use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use html_escape::{decode_html_entities, encode_text};
use regex::Regex;
use reqwest::blocking::Client;
use scraper::{ElementRef, Html, Selector};
use serde::Serialize;
use serde_json::Value;
use std::collections::HashSet;
use std::fs;
use std::time::Duration;
use url::Url;

const OUTPUT_PATH: &str = "public/data/news.generated.json";

#[derive(Clone, Copy, Serialize)]
struct Source {
    name: &'static str,
    url: &'static str,
    category: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    format: Option<&'static str>,
}

#[derive(Clone, Serialize)]
struct Article {
    id: String,
    title: String,
    subtitle: String,
    category: String,
    author: String,
    avatar: String,
    date: String,
    timestamp: i64,
    cover: String,
    #[serde(rename = "sourceName")]
    source_name: String,
    #[serde(rename = "sourceUrl")]
    source_url: String,
    bookmarked: bool,
    queued: bool,
    custom: bool,
    content: String,
}

#[derive(Serialize)]
struct NewsData {
    #[serde(rename = "generatedAt")]
    generated_at: String,
    sources: Vec<Source>,
    articles: Vec<Article>,
}

const APPLE_ECOSYSTEM_SOURCES: &[&str] = &["iClarified"];

struct Filters {
    mac_news: Regex,
    strong_mac: Regex,
    apple_ecosystem: Regex,
    ios_only: Regex,
    deal: Regex,
    sales_deal: Regex,
    idiomatic_deal: Regex,
    commercial_price: Regex,
    deal_word: Regex,
    mac_deal: Regex,
    games: Regex,
    reviews: Regex,
    apps: Regex,
    ai: Regex,
    deals: Regex,
    macbook_deals: Regex,
    mac_deal_product: Regex,
    mobile_product: Regex,
    boilerplate: Regex,
}

const ARTICLE_LEADING_LABELS: &[&str] = &[
    "ai",
    "app store",
    "apple",
    "apple intelligence",
    "apple silicon",
    "apple tv",
    "apple watch",
    "apps",
    "all about mac",
    "chatgpt",
    "claude",
    "codex",
    "deals",
    "featured",
    "gemini",
    "google",
    "ios",
    "ipad",
    "ipados",
    "iphone",
    "mac",
    "macos",
    "messages",
    "microsoft",
    "openai",
    "reviews",
    "siri",
    "vision pro",
    "watchos",
];

const ARTICLE_RELATED_SECTION_LABELS: &[&str] = &[
    "active discussions",
    "deals",
    "do more with your apple products",
    "latest news",
    "more from appleinsider",
    "more stories",
    "popular stories",
    "read more",
    "related articles",
    "related stories",
    "table of contents",
    "top stories",
    "videos",
];

const ARTICLE_AD_LINK_LABELS: &[&str] = &[
    "discounted airpods pro 3",
    "get weekly updates",
    "official apple store on amazon",
];

fn main() -> Result<()> {
    let client = Client::builder()
        .user_agent("MacReady RSS Builder")
        .timeout(Duration::from_secs(25))
        .build()
        .context("Could not create HTTP client")?;

    let filters = Filters::new()?;
    let sources = news_sources();
    let mut fetched = Vec::new();
    let mut failed_sources = Vec::new();

    for source in &sources {
        let result = if source.format == Some("html") {
            fetch_html_source(&client, &filters, source)
        } else {
            fetch_rss_source(&client, &filters, source)
        };

        match result {
            Ok(mut articles) => fetched.append(&mut articles),
            Err(error) => failed_sources.push(format!("{}: {error:#}", source.name)),
        }
    }

    hydrate_article_pages(&client, &filters, &mut fetched);
    for article in fetched.iter_mut() {
        article.category = resolve_article_category(&filters, article);
    }
    fetched.retain(|article| should_render_article(&filters, article));

    let articles = balance_articles(fetched);
    if articles.is_empty() {
        anyhow::bail!(
            "No articles were generated. Source errors: {}",
            failed_sources.join(" | ")
        );
    }

    let data = NewsData {
        generated_at: Utc::now().to_rfc3339(),
        sources,
        articles,
    };

    fs::create_dir_all("public/data").context("Could not create public/data")?;
    fs::write(OUTPUT_PATH, serde_json::to_string_pretty(&data)?)
        .with_context(|| format!("Could not write {OUTPUT_PATH}"))?;

    if !failed_sources.is_empty() {
        eprintln!("Generated news with source errors:");
        for failure in failed_sources {
            eprintln!("- {failure}");
        }
    }

    Ok(())
}

impl Filters {
    fn new() -> Result<Self> {
        Ok(Self {
            mac_news: Regex::new(
                r"(?i)\b(macOS|Mac\b|MacBook|iMac|Mac mini|Mac Studio|Mac Pro|Apple silicon|M[1-9]\b|WWDC|Safari|Finder|Time Machine|Xcode|Gatekeeper|FileVault|Launch Services|MDM|Jamf|SwiftUI|AppKit|Terminal|malware|Security Update)\b",
            )?,
            strong_mac: Regex::new(
                r"(?i)\b(macOS|Mac\b|MacBook|iMac|Mac mini|Mac Studio|Mac Pro|Apple silicon|M[1-9]\b|Finder|Time Machine|Xcode|Gatekeeper|FileVault|Launch Services|MDM|Jamf|SwiftUI|AppKit|Terminal|Security Update)\b",
            )?,
            apple_ecosystem: Regex::new(
                r"(?i)\b(Apple|WWDC|iOS|iPhone|iPad|macOS|Mac\b|AirPods|watchOS|visionOS|Siri|App Store|iCloud|Xcode|Apple TV|Apple Watch)\b",
            )?,
            ios_only: Regex::new(
                r"(?i)\b(iOS|iPhone|iPad|iPadOS|watchOS|Apple Watch|AirPods|visionOS|Vision Pro)\b",
            )?,
            deal: Regex::new(
                r"(?i)\b(deal|deals|sale|discount|coupon|save \$|save up to|% off|today only|lowest price|record-low|price drop|clearance|promo|promotion|bundle|lifetime license|sponsored|advertorial|stacksocial|walmart|best buy|amazon|b&h)\b",
            )?,
            sales_deal: Regex::new(
                r"(?i)\b(sale|on sale|discount|discounted|coupon|save \$|save up to|% off|today only|lowest price|record-low|record low|all-time low|price drop|price cut|clearance|promo|promotion|bundle|lifetime license|sponsored|advertorial|stacksocial|walmart|best buy|amazon|b&h|marked down)\b",
            )?,
            idiomatic_deal: Regex::new(
                r"(?i)\b(?:biggest|main|real|whole|entire|true)\s+deal\s+(?:about|with|here|is|was|isn't|is not|breaker)|(?:the|this|that|a)\s+deal\s+(?:about|with|here|is|was|isn't|is not|breaker)|not\s+(?:the|a)\s+deal\b|\bdeal\s+breaker\b",
            )?,
            commercial_price: Regex::new(
                r"(?i)(?:[$£€]\s?\d[\d,]*(?:\.\d{2})?|\d{1,3}%\s?off|save\s?(?:up to\s?)?[$£€]?\s?\d[\d,]*|[$£€]?\s?\d[\d,]*\s?off|all-time low|record low|lowest price)",
            )?,
            deal_word: Regex::new(r"(?i)\bdeals?\b")?,
            mac_deal: Regex::new(
                r"(?i)\b(MacBook|iMac|Mac mini|Mac Studio|Mac Pro|Studio Display|Apple display|Apple silicon)\b",
            )?,
            games: Regex::new(
                r"(?i)\b(game|games|gaming|Steam|Xbox|PlayStation|Nintendo|Switch|PC|trailer|release|released|launch|update|patch|DLC|demo|early access|indie|developer|studio)\b",
            )?,
            reviews: Regex::new(
                r"(?i)\b(review|reviews|hands-on|tested|benchmark|benchmarks|performance|long-term|versus|vs\.?|Mac|macOS|MacBook|iMac|Mac mini|Mac Studio|Mac Pro)\b",
            )?,
            apps: Regex::new(
                r"(?i)\b(Mac app|Mac apps|macOS app|macOS apps|for Mac|on Mac|Mac version|menu bar|Safari extension|Setapp|Raycast|Alfred|BBEdit|Pixelmator|CleanMyMac|Final Cut|Logic Pro|developer tool|Apple silicon)\b",
            )?,
            ai: Regex::new(
                r"(?i)\b(Apple Intelligence|AI|artificial intelligence|Siri|LLM|language model|machine learning|Foundation Models|Image Playground|Genmoji|Writing Tools|ChatGPT|OpenAI|Claude|Gemini|Shortcuts Playground|macOS)\b",
            )?,
            deals: Regex::new(
                r"(?i)\b(MacBook|MacBook Air|MacBook Pro|Mac mini|Mac Studio|Studio Display|Thunderbolt|USB-C|MagSafe|charger|dock|hub|monitor|display|SSD|keyboard|mouse|trackpad|case|sleeve|stand|backpack|accessor(?:y|ies)|deal|deals|discount|sale|off|low|price|Amazon|Best Buy|B&H)\b",
            )?,
            macbook_deals: Regex::new(
                r"(?i)\b(MacBook|MacBook Air|MacBook Pro|USB-C|Thunderbolt|MagSafe|dock|hub|charger|adapter|monitor|display|SSD|external drive|keyboard|mouse|trackpad|sleeve|case|stand|backpack|accessor(?:y|ies)|AppleCare|M[1-9]\b)\b",
            )?,
            mac_deal_product: Regex::new(
                r"(?i)\b(MacBook|MacBook Air|MacBook Pro|Mac mini|Mac Studio|Mac Pro|iMac|Studio Display|Mac\b)\b",
            )?,
            mobile_product: Regex::new(
                r"(?i)\b(iPhone|iPad|AirPods|Apple Watch|Watch|Vision Pro|MagSafe Battery)\b",
            )?,
            boilerplate: Regex::new(
                r"(?i)^(source:|read on|continue reading|go to the linked site|go to the podcast page|advertisement|sponsor|sponsored|subscribe|share this|related articles|related stories|sign up|you are using an ad blocker|ftc:)",
            )?,
        })
    }

    fn category_matches(&self, category: &str, text: &str) -> bool {
        match category {
            "design" => self.games.is_match(text),
            "science" => self.reviews.is_match(text),
            "culture" => self.apps.is_match(text),
            "ai" => self.ai.is_match(text),
            "deals" => self.deals.is_match(text),
            _ => self.mac_news.is_match(text),
        }
    }
}

fn news_sources() -> Vec<Source> {
    vec![
        Source {
            name: "9to5Mac",
            url: "https://9to5mac.com/guides/mac/feed/",
            category: "technology",
            format: None,
        },
        Source {
            name: "MacRumors",
            url: "https://feeds.macrumors.com/MacRumors-All",
            category: "technology",
            format: None,
        },
        Source {
            name: "AppleInsider Mac",
            url: "https://appleinsider.com/inside/mac",
            category: "technology",
            format: Some("html"),
        },
        Source {
            name: "Apple Newsroom",
            url: "https://www.apple.com/newsroom/rss-feed.rss",
            category: "technology",
            format: None,
        },
        Source {
            name: "Ars Technica",
            url: "https://feeds.arstechnica.com/arstechnica/apple",
            category: "technology",
            format: None,
        },
        Source {
            name: "The Verge",
            url: "https://www.theverge.com/rss/apple/index.xml",
            category: "technology",
            format: None,
        },
        Source {
            name: "TidBITS",
            url: "https://tidbits.com/feed/",
            category: "technology",
            format: None,
        },
        Source {
            name: "The Eclectic Light Company",
            url: "https://eclecticlight.co/category/macs/feed/",
            category: "technology",
            format: None,
        },
        Source {
            name: "Michael Tsai",
            url: "https://mjtsai.com/blog/feed/",
            category: "technology",
            format: None,
        },
        Source {
            name: "Macworld",
            url: "https://www.macworld.com/feed",
            category: "technology",
            format: None,
        },
        Source {
            name: "The Mac Observer",
            url: "https://www.macobserver.com/feed/",
            category: "technology",
            format: None,
        },
        Source {
            name: "iClarified",
            url: "https://www.iclarified.com/rss/news.xml",
            category: "technology",
            format: None,
        },
        Source {
            name: "Daring Fireball",
            url: "https://daringfireball.net/feeds/main",
            category: "technology",
            format: None,
        },
        Source {
            name: "512 Pixels",
            url: "https://512pixels.net/feed.xml",
            category: "technology",
            format: None,
        },
        Source {
            name: "Scripting OS X",
            url: "https://scriptingosx.com/feed/",
            category: "technology",
            format: None,
        },
        Source {
            name: "OWC Rocket Yard",
            url: "https://eshop.macsales.com/blog/feed/",
            category: "technology",
            format: None,
        },
        Source {
            name: "Der Flounder",
            url: "https://derflounder.wordpress.com/feed/",
            category: "technology",
            format: None,
        },
        Source {
            name: "PC Gamer",
            url: "https://www.pcgamer.com/rss/",
            category: "design",
            format: None,
        },
        Source {
            name: "Rock Paper Shotgun",
            url: "https://www.rockpapershotgun.com/feed",
            category: "design",
            format: None,
        },
        Source {
            name: "Polygon",
            url: "https://www.polygon.com/rss/index.xml",
            category: "design",
            format: None,
        },
        Source {
            name: "Kotaku",
            url: "https://kotaku.com/rss",
            category: "design",
            format: None,
        },
        Source {
            name: "Macworld Reviews",
            url: "https://www.macworld.com/reviews/feed",
            category: "science",
            format: None,
        },
        Source {
            name: "Six Colors",
            url: "https://sixcolors.com/feed/",
            category: "science",
            format: None,
        },
        Source {
            name: "MacStories",
            url: "https://www.macstories.net/feed/",
            category: "culture",
            format: None,
        },
        Source {
            name: "9to5Mac Apps",
            url: "https://9to5mac.com/guides/apps/feed/",
            category: "culture",
            format: None,
        },
        Source {
            name: "9to5Mac Apple Intelligence",
            url: "https://9to5mac.com/guides/apple-intelligence/feed/",
            category: "ai",
            format: None,
        },
        Source {
            name: "9to5Toys Mac Deals",
            url: "https://9to5toys.com/guides/mac/feed/",
            category: "deals",
            format: None,
        },
        Source {
            name: "9to5Toys Apple Deals",
            url: "https://9to5toys.com/guides/apple/feed/",
            category: "deals",
            format: None,
        },
    ]
}

fn fetch_text(client: &Client, url: &str) -> Result<String> {
    let response = client
        .get(url)
        .send()
        .with_context(|| format!("Request failed for {url}"))?;

    if !response.status().is_success() {
        anyhow::bail!("Request returned {}", response.status());
    }

    response.text().context("Could not read response text")
}

fn fetch_rss_source(client: &Client, filters: &Filters, source: &Source) -> Result<Vec<Article>> {
    let xml = fetch_text(client, source.url)?;
    let doc = roxmltree::Document::parse(&xml).context("Could not parse RSS XML")?;
    let mut articles = Vec::new();

    for (index, item) in doc
        .descendants()
        .filter(|node| node.is_element() && matches!(node.tag_name().name(), "item" | "entry"))
        .enumerate()
    {
        let title = clean_article_text(&child_text(item, &["title"]).unwrap_or_default());
        let link = item_link(item);
        let raw_description = child_text(item, &["description", "summary"]);
        let content = child_text(item, &["encoded", "content"]).or_else(|| raw_description.clone());
        let pub_date = child_text(item, &["pubDate", "published", "updated"]);

        if title.is_empty() || link.is_empty() {
            continue;
        }

        let subtitle_preview = build_article_excerpt(
            &raw_description.clone().or_else(|| content.clone()),
            260,
        );
        let content_preview = content.clone().unwrap_or_default();
        if is_audio_podcast_item(item)
            || is_podcast_feed_entry(&title, &subtitle_preview, &content_preview, &link)
        {
            continue;
        }

        if !should_include_article(filters, source, &title, &raw_description, &content) {
            continue;
        }

        let timestamp = parse_timestamp(&pub_date)
            .unwrap_or_else(|| Utc::now().timestamp_millis() - index as i64);
        let cover = extract_rss_image(item, &content, source.url);
        let subtitle =
            build_article_excerpt(&raw_description.clone().or_else(|| content.clone()), 260);
        let feed_content = build_article_content(
            &content.clone().or_else(|| raw_description.clone()),
            &link,
            source.name,
            filters,
        );

        articles.push(Article {
            id: article_id(source.name, timestamp, index),
            title,
            subtitle,
            category: source.category.to_string(),
            author: source.name.to_string(),
            avatar: source_avatar(source.name),
            date: format_date(timestamp),
            timestamp,
            cover,
            source_name: source.name.to_string(),
            source_url: link,
            bookmarked: false,
            queued: false,
            custom: false,
            content: feed_content,
        });
    }

    Ok(articles)
}

fn fetch_html_source(client: &Client, filters: &Filters, source: &Source) -> Result<Vec<Article>> {
    let html = fetch_text(client, source.url)?;
    let doc = Html::parse_document(&html);
    let mut candidates = Vec::new();
    let container_selector = selector("article, .article, .card, .post, li")?;
    let link_selector = selector("a[href]")?;
    let time_selector = selector("time")?;

    for container in doc.select(&container_selector) {
        let Some(link) = container
            .select(&link_selector)
            .find(|link| clean_article_text(&link.text().collect::<Vec<_>>().join(" ")).len() > 24)
        else {
            continue;
        };

        let title = clean_article_text(&link.text().collect::<Vec<_>>().join(" "));
        if is_non_article_title(&title) {
            continue;
        }
        let source_url = absolutize(source.url, link.value().attr("href").unwrap_or_default());
        if !source_url.starts_with("https://appleinsider.com/") {
            continue;
        }

        let subtitle = html_source_subtitle(container, &title);
        let subtitle_content = Some(subtitle.clone());
        if !should_include_article(
            filters,
            source,
            &title,
            &subtitle_content,
            &subtitle_content,
        ) {
            continue;
        }

        let timestamp = container
            .select(&time_selector)
            .find_map(|node| {
                let text = node
                    .value()
                    .attr("datetime")
                    .map(str::to_string)
                    .unwrap_or_else(|| node.text().collect::<Vec<_>>().join(" "));
                parse_timestamp(&Some(text))
            })
            .unwrap_or_else(|| Utc::now().timestamp_millis() - candidates.len() as i64);

        let cover = extract_source_article_image(&container.html(), source.url);
        candidates.push((title, source_url, subtitle, cover, timestamp));
    }

    let mut seen = HashSet::new();
    let mut articles = Vec::new();
    for (index, (title, source_url, subtitle, cover, timestamp)) in
        candidates.into_iter().enumerate()
    {
        if !seen.insert(source_url.clone()) {
            continue;
        }
        if articles.len() >= 12 {
            break;
        }

        let content = format!("<p>{}</p>", encode_text(&subtitle));

        articles.push(Article {
            id: article_id(source.name, timestamp, index),
            title,
            subtitle,
            category: source.category.to_string(),
            author: source.name.to_string(),
            avatar: source_avatar(source.name),
            date: format_date(timestamp),
            timestamp,
            cover,
            source_name: source.name.to_string(),
            source_url,
            bookmarked: false,
            queued: false,
            custom: false,
            content,
        });
    }

    Ok(articles)
}

fn hydrate_article_pages(client: &Client, filters: &Filters, articles: &mut [Article]) {
    for article in articles.iter_mut() {
        let needs_content = word_count(&strip_html(&article.content)) < 140;
        let needs_cover = article.cover.is_empty();
        if !needs_content && !needs_cover {
            continue;
        }

        let Ok(html) = fetch_text(client, &article.source_url) else {
            continue;
        };

        if needs_cover {
            article.cover = extract_source_article_image(&html, &article.source_url);
        }

        if needs_content {
            let expanded = build_source_article_content(
                &html,
                &article.source_url,
                &article.source_name,
                filters,
            );
            if word_count(&strip_html(&expanded)) > word_count(&strip_html(&article.content)) {
                article.content = expanded;
                article.subtitle = build_article_excerpt(&Some(strip_html(&article.content)), 260);
            }
        }
    }
}

fn should_include_article(
    filters: &Filters,
    source: &Source,
    title: &str,
    raw_description: &Option<String>,
    content: &Option<String>,
) -> bool {
    if is_non_article_title(title) {
        return false;
    }

    let subtitle_preview = build_article_excerpt(
        &raw_description.clone().or_else(|| content.clone()),
        260,
    );
    let content_preview = strip_html_option(content);
    if is_podcast_feed_entry(title, &subtitle_preview, &content_preview, "") {
        return false;
    }

    let headline_text = format!("{} {}", title, strip_html_option(raw_description));
    if source.category != "design"
        && source.category != "deals"
        && !is_apple_ecosystem_source(source)
        && is_ios_led_title(filters, title)
    {
        return false;
    }

    let combined_text = format!(
        "{} {} {}",
        title,
        raw_description.as_deref().unwrap_or_default(),
        strip_html_option(content)
    );

    let category_ok = if is_apple_ecosystem_source(source) && source.category == "technology" {
        filters.apple_ecosystem.is_match(&combined_text)
    } else {
        filters.category_matches(source.category, &combined_text)
    };
    if !category_ok {
        return false;
    }

    if source.category == "deals" {
        if filters.mobile_product.is_match(title) && !filters.mac_deal_product.is_match(title) {
            return false;
        }
        return filters.deal.is_match(&combined_text)
            && filters.macbook_deals.is_match(&headline_text);
    }

    if source.category != "technology" {
        return true;
    }

    let has_mac_context = if is_apple_ecosystem_source(source) {
        filters.apple_ecosystem.is_match(&combined_text)
    } else {
        filters.strong_mac.is_match(&headline_text)
    };
    if !has_mac_context {
        return false;
    }

    let deal_headline = if is_apple_ecosystem_source(source) {
        title.to_string()
    } else {
        headline_text.clone()
    };
    if filters.deal.is_match(&deal_headline) && !filters.mac_deal.is_match(&deal_headline) {
        return false;
    }

    if is_apple_ecosystem_source(source) {
        return true;
    }

    !is_ios_led_title(filters, title)
}

fn has_commercial_deal_signal(filters: &Filters, title: &str, headline: &str) -> bool {
    if filters.sales_deal.is_match(headline) || filters.commercial_price.is_match(headline) {
        return true;
    }

    let title_has_deal_word = filters.deal_word.is_match(title);
    title_has_deal_word && !filters.idiomatic_deal.is_match(headline)
}

fn is_mac_deal_article(filters: &Filters, article: &Article) -> bool {
    let headline = format!("{} {}", article.title, article.subtitle);
    if !has_commercial_deal_signal(filters, &article.title, &headline) {
        return false;
    }
    if filters.mobile_product.is_match(&article.title)
        && !filters.mac_deal_product.is_match(&article.title)
    {
        return false;
    }
    filters.macbook_deals.is_match(&headline) || filters.mac_deal.is_match(&headline)
}

fn resolve_article_category(filters: &Filters, article: &Article) -> String {
    if article.category == "design" || article.category == "deals" {
        return article.category.clone();
    }
    if is_mac_deal_article(filters, article) {
        return "deals".to_string();
    }
    article.category.clone()
}

fn should_render_article(filters: &Filters, article: &Article) -> bool {
    if is_non_article_title(&article.title) {
        return false;
    }

    if is_podcast_feed_entry(
        &article.title,
        &article.subtitle,
        &article.content,
        &article.source_url,
    ) {
        return false;
    }

    if article.category != "design" && article.category != "deals" {
        let headline = format!("{} {}", article.title, article.subtitle);
        let is_apple_ecosystem_article = APPLE_ECOSYSTEM_SOURCES.contains(&article.source_name.as_str());
        if !is_apple_ecosystem_article
            && filters.ios_only.is_match(&headline)
            && !filters.strong_mac.is_match(&headline)
        {
            return false;
        }
    }

    let image_required = ["The Mac Observer", "Six Colors", "MacStories"];
    if image_required.contains(&article.source_name.as_str()) && article.cover.is_empty() {
        return false;
    }

    true
}

fn balance_articles(mut fetched: Vec<Article>) -> Vec<Article> {
    fetched.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

    let category_order = ["technology", "deals", "science", "culture", "ai", "design"];
    let mut categorized = Vec::new();

    for category in category_order {
        let mut category_articles = fetched
            .iter()
            .filter(|article| article.category == category)
            .cloned()
            .collect::<Vec<_>>();
        category_articles.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        category_articles.truncate(12);
        categorized.push(category_articles);
    }

    let mut balanced = Vec::new();
    for index in 0..12 {
        for category_articles in &categorized {
            if let Some(article) = category_articles.get(index) {
                balanced.push(article.clone());
            }
        }
    }

    let mut seen_urls = HashSet::new();
    let mut seen_titles = HashSet::new();
    balanced
        .into_iter()
        .filter(|article| seen_urls.insert(article.source_url.clone()))
        .filter(|article| seen_titles.insert(article.title.to_lowercase()))
        .take(60)
        .collect()
}

fn child_text(node: roxmltree::Node, names: &[&str]) -> Option<String> {
    node.children()
        .find(|child| child.is_element() && names.contains(&child.tag_name().name()))
        .and_then(|child| child.text())
        .map(|text| decode_html_entities(text).to_string())
        .map(|text| text.trim().to_string())
        .filter(|text| !text.is_empty())
}

fn item_link(item: roxmltree::Node) -> String {
    if let Some(text) = child_text(item, &["link"]) {
        if text.starts_with("http") {
            return text;
        }
    }

    item.children()
        .filter(|child| child.is_element() && child.tag_name().name() == "link")
        .find_map(|link| {
            let rel = link.attribute("rel").unwrap_or("alternate");
            if rel == "alternate" || rel.is_empty() {
                link.attribute("href").map(str::to_string)
            } else {
                None
            }
        })
        .unwrap_or_default()
}

fn extract_rss_image(item: roxmltree::Node, html: &Option<String>, base_url: &str) -> String {
    for node in item.descendants().filter(|node| {
        node.is_element()
            && matches!(
                node.tag_name().name(),
                "enclosure" | "thumbnail" | "image" | "content"
            )
    }) {
        let url = node
            .attribute("url")
            .or_else(|| node.attribute("href"))
            .or_else(|| node.attribute("src"))
            .or_else(|| node.text())
            .unwrap_or_default()
            .trim();
        if is_image_url(url) {
            return absolutize(base_url, url);
        }
    }

    extract_image_from_html(html.as_deref().unwrap_or_default(), base_url)
}

fn extract_image_from_html(html: &str, base_url: &str) -> String {
    if html.trim().is_empty() {
        return String::new();
    }

    let doc = Html::parse_fragment(html);
    let Ok(selector) = Selector::parse("img, source") else {
        return String::new();
    };

    doc.select(&selector)
        .filter_map(|node| {
            node.value()
                .attr("src")
                .or_else(|| node.value().attr("data-src"))
                .or_else(|| node.value().attr("data-lazy-src"))
                .or_else(|| node.value().attr("data-orig-file"))
                .or_else(|| node.value().attr("srcset"))
        })
        .map(first_srcset_url)
        .find(|url| is_image_url(url))
        .map(|url| absolutize(base_url, &url))
        .unwrap_or_default()
}

fn extract_source_article_image(html: &str, article_url: &str) -> String {
    let doc = Html::parse_document(html);
    if let Some(image) = json_ld_image(&doc, article_url) {
        return image;
    }

    let Ok(selector) = Selector::parse(
        "meta[property='og:image'], meta[name='twitter:image'], link[rel='image_src'], article img, article source, figure img, .entry-content img, .post-thumbnail img, .featured-image img, .wp-post-image",
    ) else {
        return String::new();
    };

    doc.select(&selector)
        .filter_map(|node| {
            node.value()
                .attr("content")
                .or_else(|| node.value().attr("href"))
                .or_else(|| node.value().attr("src"))
                .or_else(|| node.value().attr("data-src"))
                .or_else(|| node.value().attr("data-lazy-src"))
                .or_else(|| node.value().attr("data-srcset"))
                .or_else(|| node.value().attr("data-lazy-srcset"))
                .or_else(|| node.value().attr("srcset"))
        })
        .map(first_srcset_url)
        .find(|url| is_image_url(url) || url.starts_with('/'))
        .map(|url| absolutize(article_url, &url))
        .unwrap_or_default()
}

fn json_ld_image(doc: &Html, base_url: &str) -> Option<String> {
    let selector = selector("script[type='application/ld+json']").ok()?;
    for script in doc.select(&selector) {
        let text = script.text().collect::<Vec<_>>().join("");
        let Ok(value) = serde_json::from_str::<Value>(&text) else {
            continue;
        };

        if let Some(image) = value_image(&value, base_url) {
            return Some(image);
        }
    }
    None
}

fn value_image(value: &Value, base_url: &str) -> Option<String> {
    match value {
        Value::Array(items) => items.iter().find_map(|item| value_image(item, base_url)),
        Value::Object(map) => {
            if let Some(graph) = map.get("@graph") {
                if let Some(image) = value_image(graph, base_url) {
                    return Some(image);
                }
            }

            let image = map.get("image").or_else(|| map.get("thumbnailUrl"))?;
            match image {
                Value::String(url) => Some(absolutize(base_url, url)),
                Value::Array(images) => images.iter().find_map(|item| value_image(item, base_url)),
                Value::Object(image_map) => image_map
                    .get("url")
                    .and_then(Value::as_str)
                    .map(|url| absolutize(base_url, url)),
                _ => None,
            }
        }
        _ => None,
    }
}

fn build_article_content(
    html: &Option<String>,
    link: &str,
    source_name: &str,
    filters: &Filters,
) -> String {
    let blocks = readable_blocks(html.as_deref().unwrap_or_default(), filters);
    article_html_from_blocks(&blocks, link, source_name)
}

fn build_source_article_content(
    html: &str,
    link: &str,
    source_name: &str,
    filters: &Filters,
) -> String {
    let doc = Html::parse_document(html);
    let root_selectors = [
        "article [itemprop='articleBody']",
        ".container.med.post-content",
        ".post-content",
        ".entry-content",
        "article .entry-content",
        "article .post-content",
        "article .article-content",
        "article .c-entry-content",
        "article .story-body",
        "article",
        "main",
    ];

    let mut best_blocks = Vec::new();
    for selector_text in root_selectors {
        let Ok(root_selector) = Selector::parse(selector_text) else {
            continue;
        };

        for root in doc.select(&root_selector) {
            let blocks = readable_blocks(&root.html(), filters);
            if blocks.len() > best_blocks.len() {
                best_blocks = blocks;
            }
        }
    }

    if best_blocks.is_empty() {
        best_blocks = readable_blocks(html, filters);
    }

    article_html_from_blocks(&best_blocks, link, source_name)
}

fn readable_blocks(html: &str, filters: &Filters) -> Vec<(String, String)> {
    let doc = Html::parse_fragment(html);
    let Ok(selector) = Selector::parse("h2, h3, p, li, blockquote") else {
        return Vec::new();
    };

    let mut blocks = Vec::new();
    let mut previous = String::new();
    for node in doc.select(&selector) {
        let tag = match node.value().name() {
            "h2" | "h3" => "h2",
            _ => "p",
        };
        let text = clean_article_text(&node.text().collect::<Vec<_>>().join(" "));
        if text.is_empty() || filters.boilerplate.is_match(&text) || text == previous {
            continue;
        }
        previous = text.clone();
        blocks.push((tag.to_string(), text));
    }

    clean_article_blocks(blocks)
        .into_iter()
        .flat_map(|(tag, text)| {
            split_long_paragraph(&text)
                .into_iter()
                .map(move |paragraph| (tag.clone(), paragraph))
        })
        .collect()
}

fn clean_article_blocks(mut blocks: Vec<(String, String)>) -> Vec<(String, String)> {
    remove_leading_related_sections(&mut blocks);
    remove_leading_article_labels(&mut blocks);
    remove_leading_related_sections(&mut blocks);
    remove_trailing_related_sections(&mut blocks);
    remove_article_ad_links(&mut blocks);
    remove_trailing_link_lists(&mut blocks);
    blocks
}

fn remove_leading_article_labels(blocks: &mut Vec<(String, String)>) {
    let mut removed = 0;
    while removed < 12 && !blocks.is_empty() && is_leading_article_label(&blocks[0].1) {
        blocks.remove(0);
        removed += 1;
    }
}

fn remove_leading_related_sections(blocks: &mut Vec<(String, String)>) {
    let mut removing_related = false;
    let mut removed = 0;

    while removed < 24 && !blocks.is_empty() {
        let starts_related = is_related_section_label(&blocks[0].1);

        if !removing_related && !starts_related {
            return;
        }

        if removing_related && blocks[0].0 == "h2" && !starts_related {
            return;
        }

        blocks.remove(0);
        removed += 1;
        removing_related = true;
    }
}

fn remove_trailing_related_sections(blocks: &mut Vec<(String, String)>) {
    if let Some(index) = blocks
        .iter()
        .position(|(_, text)| is_related_section_label(text))
    {
        blocks.truncate(index);
    }
}

fn remove_article_ad_links(blocks: &mut Vec<(String, String)>) {
    blocks.retain(|(_, text)| !is_article_ad_link(text));
}

fn remove_trailing_link_lists(blocks: &mut Vec<(String, String)>) {
    let Some(newsletter_index) = blocks
        .iter()
        .position(|(_, text)| normalized(text) == "get weekly updates")
    else {
        return;
    };

    let mut start = newsletter_index;
    let mut cursor = newsletter_index;
    let mut headline_count = 0;

    while cursor > 0 && headline_count < 8 {
        cursor -= 1;
        if !is_related_headline_text(&blocks[cursor].1) {
            break;
        }
        start = cursor;
        headline_count += 1;
    }

    blocks.truncate(if headline_count >= 2 {
        start
    } else {
        newsletter_index
    });
}

fn is_leading_article_label(text: &str) -> bool {
    let normalized = normalized(text);
    if normalized.is_empty() || ARTICLE_LEADING_LABELS.contains(&normalized.as_str()) {
        return true;
    }

    if text.len() > 36 || text.chars().any(|ch| ".!?;:".contains(ch)) {
        return false;
    }

    let words = text.split_whitespace().collect::<Vec<_>>();
    if words.is_empty() || words.len() > 4 {
        return false;
    }

    words.iter().all(|word| is_heading_token(word))
}

fn is_heading_token(word: &str) -> bool {
    let mut chars = word.chars();
    let Some(first) = chars.next() else {
        return false;
    };

    let starts_heading = first.is_ascii_uppercase() || first.is_ascii_digit();
    let rest_ok = chars.all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '&' | '+' | '-'));
    starts_heading && rest_ok
}

fn is_related_section_label(text: &str) -> bool {
    let normalized = normalized(text);
    ARTICLE_RELATED_SECTION_LABELS.contains(&normalized.as_str())
        || normalized.starts_with("top comment by ")
        || normalized == "comments"
}

fn is_article_ad_link(text: &str) -> bool {
    let normalized = normalized(text);
    if ARTICLE_AD_LINK_LABELS.contains(&normalized.as_str()) {
        return true;
    }

    let lower = text.to_lowercase();
    lower.starts_with("discounted airpods")
        || lower.starts_with("discounted apple watch")
        || lower.starts_with("discounted ipad")
        || lower.starts_with("discounted iphone")
        || lower.starts_with("discounted macbook")
        || lower.starts_with("discounted mac mini")
        || lower.starts_with("discounted mac studio")
        || (lower.starts_with("macbook neo ")
            && (lower.contains("$590") || lower.contains("$690"))
            && lower.contains("delivery by"))
        || (lower.starts_with("these ")
            && lower.contains(" macbook air models are ")
            && lower.contains(" off"))
        || lower.starts_with("still live: ")
}

fn is_related_headline_text(text: &str) -> bool {
    let len = text.len();
    (24..=160).contains(&len) && !text.ends_with(['.', '!', '?'])
}

fn normalized(text: &str) -> String {
    clean_article_text(text).to_lowercase()
}

fn is_non_article_title(title: &str) -> bool {
    let title = clean_article_text(title);
    let mut chars = title.chars();
    let Some(first) = chars.next() else {
        return true;
    };

    first.is_ascii_digit() && title.chars().take(4).any(|ch| ch == '.')
}

fn is_podcast_feed_entry(title: &str, subtitle: &str, content: &str, link: &str) -> bool {
    let title_lower = clean_article_text(title).to_lowercase();
    let subtitle_lower = clean_article_text(subtitle).to_lowercase();
    let content_lower = strip_html_option(&Some(content.to_string())).to_lowercase();
    let link_lower = link.to_lowercase();
    let combined = format!("{title_lower} {subtitle_lower} {content_lower}");

    if title_lower.contains("podcast rewind") {
        return true;
    }
    if title_lower.contains("macstories weekly") {
        return true;
    }
    if link_lower.contains("/podcast-rewind")
        || link_lower.contains("/podcast/episode")
        || link_lower.contains("/feed/podcast")
    {
        return true;
    }
    if subtitle_lower.starts_with("enjoy the latest episodes from")
        || content_lower.starts_with("enjoy the latest episodes from")
    {
        return true;
    }
    if combined.contains("recap of") && combined.contains("articles and podcasts") {
        return true;
    }
    if title_lower.starts_with("podcast:")
        || title_lower.starts_with("listen now:")
        || title_lower.starts_with("watch:")
    {
        return true;
    }

    false
}

fn is_audio_podcast_item(item: roxmltree::Node) -> bool {
    item.descendants()
        .filter(|node| node.is_element() && node.tag_name().name() == "enclosure")
        .any(|node| {
            let media_type = node.attribute("type").unwrap_or("").to_lowercase();
            let url = node.attribute("url").unwrap_or("").to_lowercase();
            media_type.starts_with("audio/")
                || url.ends_with(".mp3")
                || url.ends_with(".m4a")
                || url.ends_with(".aac")
                || url.ends_with(".ogg")
        })
}

fn article_html_from_blocks(
    blocks: &[(String, String)],
    _link: &str,
    _source_name: &str,
) -> String {
    let mut html = String::new();
    for (tag, text) in blocks.iter().take(18) {
        html.push_str(&format!("<{}>{}</{}>", tag, encode_text(text), tag));
    }
    html
}

fn build_article_excerpt(html: &Option<String>, max_length: usize) -> String {
    let text = strip_html_option(html)
        .replace('\n', " ")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ");

    if text.len() <= max_length {
        return text;
    }

    let mut cutoff = max_length.min(text.len());
    while cutoff > 0 && !text.is_char_boundary(cutoff) {
        cutoff -= 1;
    }
    let shortened = &text[..cutoff];
    for marker in [". ", "? ", "! "] {
        if let Some(index) = shortened.rfind(marker) {
            if index > 120 {
                return shortened[..index + 1].trim().to_string();
            }
        }
    }

    if let Some(index) = shortened.rfind(' ') {
        if index > 120 {
            return format!("{}...", shortened[..index].trim());
        }
    }

    format!("{}...", shortened.trim())
}

fn html_source_subtitle(container: ElementRef, title: &str) -> String {
    let Ok(selector) = Selector::parse("p, .dek, .summary, .excerpt") else {
        return String::new();
    };

    container
        .select(&selector)
        .map(|node| clean_article_text(&node.text().collect::<Vec<_>>().join(" ")))
        .find(|text| text.len() > 40 && text != title)
        .unwrap_or_default()
}

fn strip_html_option(html: &Option<String>) -> String {
    html.as_deref().map(strip_html).unwrap_or_default()
}

fn strip_html(html: &str) -> String {
    let doc = Html::parse_fragment(html);
    clean_article_text(&doc.root_element().text().collect::<Vec<_>>().join(" "))
}

fn clean_article_text(text: &str) -> String {
    decode_html_entities(text)
        .replace('\u{00a0}', " ")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .replace(" ,", ",")
        .replace(" .", ".")
        .replace(" :", ":")
        .replace(" ;", ";")
        .replace(" !", "!")
        .replace(" ?", "?")
        .trim()
        .to_string()
}

fn split_long_paragraph(text: &str) -> Vec<String> {
    if text.len() <= 520 {
        return vec![text.to_string()];
    }

    let mut chunks = Vec::new();
    let mut current = String::new();
    for sentence in text.split_inclusive(['.', '!', '?']) {
        let candidate = if current.is_empty() {
            sentence.trim().to_string()
        } else {
            format!("{} {}", current, sentence.trim())
        };

        if !current.is_empty() && candidate.len() > 420 {
            chunks.push(current);
            current = sentence.trim().to_string();
        } else {
            current = candidate;
        }
    }

    if !current.is_empty() {
        chunks.push(current);
    }

    chunks
}

fn parse_timestamp(value: &Option<String>) -> Option<i64> {
    let value = value.as_deref()?.trim();
    if value.is_empty() {
        return None;
    }

    DateTime::parse_from_rfc2822(value)
        .or_else(|_| DateTime::parse_from_rfc3339(value))
        .map(|date| date.timestamp_millis())
        .ok()
}

fn format_date(timestamp: i64) -> String {
    DateTime::<Utc>::from_timestamp_millis(timestamp)
        .unwrap_or_else(Utc::now)
        .format("%b %-d, %Y")
        .to_string()
}

fn article_id(source_name: &str, timestamp: i64, index: usize) -> String {
    let slug = source_name
        .to_lowercase()
        .chars()
        .map(|ch| if ch.is_ascii_alphanumeric() { ch } else { '-' })
        .collect::<String>()
        .trim_matches('-')
        .to_string();
    format!("{slug}-{timestamp}-{index}")
}

fn source_avatar(source_name: &str) -> String {
    source_name
        .split_whitespace()
        .filter_map(|part| part.chars().next())
        .take(2)
        .collect::<String>()
        .to_uppercase()
}

fn is_apple_ecosystem_source(source: &Source) -> bool {
    APPLE_ECOSYSTEM_SOURCES.contains(&source.name)
}

fn is_ios_led_title(filters: &Filters, title: &str) -> bool {
    filters.ios_only.is_match(title) && !filters.strong_mac.is_match(title)
}

fn is_image_url(url: &str) -> bool {
    let trimmed = url.trim();
    trimmed.starts_with("http://") || trimmed.starts_with("https://") || trimmed.starts_with("//")
}

fn first_srcset_url(value: &str) -> String {
    value
        .split(',')
        .next()
        .unwrap_or(value)
        .trim()
        .split_whitespace()
        .next()
        .unwrap_or_default()
        .to_string()
}

fn absolutize(base_url: &str, value: &str) -> String {
    let trimmed = value.trim();
    if trimmed.starts_with("//") {
        return format!("https:{trimmed}");
    }
    if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        return trimmed.to_string();
    }
    Url::parse(base_url)
        .ok()
        .and_then(|base| base.join(trimmed).ok())
        .map(|url| url.to_string())
        .unwrap_or_else(|| trimmed.to_string())
}

fn selector(value: &str) -> Result<Selector> {
    Selector::parse(value).map_err(|error| anyhow::anyhow!("Invalid selector {value}: {error}"))
}

fn word_count(text: &str) -> usize {
    text.split_whitespace()
        .filter(|part| !part.is_empty())
        .count()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn article_cleaner_removes_related_sections_and_ad_links() {
        let blocks = vec![
            (
                "p".to_string(),
                "OpenAI just released this week’s Codex desktop app update.".to_string(),
            ),
            ("h2".to_string(), "Latest News".to_string()),
            (
                "p".to_string(),
                "95% of Canceled Annual App Subscribers Never Return, New Report Reveals"
                    .to_string(),
            ),
            (
                "p".to_string(),
                "Official Apple Store on Amazon".to_string(),
            ),
        ];

        let cleaned = clean_article_blocks(blocks);
        assert_eq!(cleaned.len(), 1);
        assert_eq!(
            cleaned[0].1,
            "OpenAI just released this week’s Codex desktop app update."
        );
    }

    #[test]
    fn podcast_feed_entry_detects_macstories_rewind_roundups() {
        assert!(is_podcast_feed_entry(
            "Podcast Rewind: Automation Wishes, RG Rotate Impressions",
            "Enjoy the latest episodes from MacStories’ family of podcasts: AppStories",
            "<p>Enjoy the latest episodes from MacStories’ family of podcasts:</p>",
            "https://www.macstories.net/news/podcast-rewind-automation-wishes/"
        ));
        assert!(is_podcast_feed_entry(
            "MacStories Weekly: Issue 515",
            "recap of MacStories' articles and podcasts",
            "<p>This week, in addition to the usual links</p>",
            "https://www.macstories.net/weekly/issue-515/"
        ));
        assert!(!is_podcast_feed_entry(
            "Jason Snell Launches Designed in California Podcast Kickstarter",
            "Today I’m incredibly excited to announce that Myke Hurley and I are launching a Kickstarter for a new podcast",
            "<p>Today I’m incredibly excited to announce that Myke Hurley and I are launching a Kickstarter for a new podcast</p>",
            "https://sixcolors.com/post/2026/05/designed-in-california/"
        ));
    }

    #[test]
    fn should_render_article_rejects_ios_led_headlines_without_mac_context() {
        let filters = Filters::new().expect("filters");
        let article = Article {
            id: "ios-only".to_string(),
            title: "New iPhone features arrive this fall".to_string(),
            subtitle: "Apple updates mobile software".to_string(),
            category: "technology".to_string(),
            author: "Test".to_string(),
            avatar: "T".to_string(),
            date: "Jun 1".to_string(),
            timestamp: 1,
            cover: "https://example.com/cover.jpg".to_string(),
            source_name: "Test Source".to_string(),
            source_url: "https://example.com/story".to_string(),
            bookmarked: false,
            queued: false,
            custom: false,
            content: "<p>Story</p>".to_string(),
        };

        assert!(!should_render_article(&filters, &article));
    }

    #[test]
    fn should_render_article_keeps_mac_headlines() {
        let filters = Filters::new().expect("filters");
        let article = Article {
            id: "mac-story".to_string(),
            title: "macOS Tahoe beta adds new Finder features".to_string(),
            subtitle: "Mac update details".to_string(),
            category: "technology".to_string(),
            author: "Test".to_string(),
            avatar: "T".to_string(),
            date: "Jun 1".to_string(),
            timestamp: 1,
            cover: "https://example.com/cover.jpg".to_string(),
            source_name: "Test Source".to_string(),
            source_url: "https://example.com/mac-story".to_string(),
            bookmarked: false,
            queued: false,
            custom: false,
            content: "<p>Story</p>".to_string(),
        };

        assert!(should_render_article(&filters, &article));
    }

    #[test]
    fn resolve_article_category_promotes_mac_deal_headlines() {
        let filters = Filters::new().expect("filters");
        let article = Article {
            id: "mac-deal".to_string(),
            title: "Apple's 2026 M5 MacBook Air plunges to record-low $899".to_string(),
            subtitle: "Save $200 at Amazon".to_string(),
            category: "technology".to_string(),
            author: "AppleInsider Mac".to_string(),
            avatar: "AM".to_string(),
            date: "Jun 10".to_string(),
            timestamp: 1,
            cover: String::new(),
            source_name: "AppleInsider Mac".to_string(),
            source_url: "https://appleinsider.com/articles/26/05/26/deal".to_string(),
            bookmarked: false,
            queued: false,
            custom: false,
            content: "<p>Deal</p>".to_string(),
        };

        assert_eq!(resolve_article_category(&filters, &article), "deals");
    }

    #[test]
    fn resolve_article_category_rejects_idiomatic_deal_phrasing() {
        let filters = Filters::new().expect("filters");
        let article = Article {
            id: "idiomatic-deal".to_string(),
            title: "I’m using macOS Golden Gate’s Siri on the MacBook Neo. Ask us anything"
                .to_string(),
            subtitle: "The biggest deal about macOS 27 Golden Gate isn’t the design tweaks"
                .to_string(),
            category: "technology".to_string(),
            author: "Macworld".to_string(),
            avatar: "MW".to_string(),
            date: "Jun 10".to_string(),
            timestamp: 1,
            cover: String::new(),
            source_name: "Macworld".to_string(),
            source_url: "https://www.macworld.com/article/siri-macbook-neo".to_string(),
            bookmarked: false,
            queued: false,
            custom: false,
            content: "<p>Story</p>".to_string(),
        };

        assert_eq!(resolve_article_category(&filters, &article), "technology");
    }

    #[test]
    #[ignore = "live network fetch"]
    fn fetch_iclarified_live_pipeline() {
        let client = Client::builder()
            .user_agent("MacReady RSS Builder Test")
            .timeout(Duration::from_secs(25))
            .build()
            .expect("client");
        let filters = Filters::new().expect("filters");
        let source = news_sources()
            .into_iter()
            .find(|source| source.name == "iClarified")
            .expect("source");

        let xml = fetch_text(&client, source.url).expect("xml");
        let doc = roxmltree::Document::parse(&xml).expect("parse");
        let mut included = 0usize;
        let mut item_count = 0usize;
        for item in doc
            .descendants()
            .filter(|node| node.is_element() && matches!(node.tag_name().name(), "item" | "entry"))
        {
            item_count += 1;
            let title = clean_article_text(&child_text(item, &["title"]).unwrap_or_default());
            let raw_description = child_text(item, &["description", "summary"]);
            let content = child_text(item, &["encoded", "content"]).or_else(|| raw_description.clone());
            if should_include_article(&filters, &source, &title, &raw_description, &content) {
                included += 1;
            }
        }
        eprintln!("iClarified feed items={item_count}, included={included}");

        let mut articles = fetch_rss_source(&client, &filters, &source).expect("fetch");
        assert!(!articles.is_empty(), "fetch_rss_source returned no articles");

        for article in articles.iter_mut() {
            article.category = resolve_article_category(&filters, article);
        }
        let fetched_count = articles.len();
        articles.retain(|article| should_render_article(&filters, article));
        let after_render = articles.len();
        let balanced = balance_articles(articles);

        eprintln!(
            "iClarified pipeline: fetched={fetched_count}, after_render={after_render}, balanced={}",
            balanced.len()
        );
        assert!(
            !balanced.is_empty(),
            "expected at least one balanced iClarified article"
        );
    }

    #[test]
    fn should_include_iclarified_apple_news() {
        let filters = Filters::new().expect("filters");
        let source = Source {
            name: "iClarified",
            url: "https://www.iclarified.com/rss/news.xml",
            category: "technology",
            format: None,
        };

        assert!(should_include_article(
            &filters,
            &source,
            "Apple Fires Back at Epic in Supreme Court App Store Appeal",
            &Some(
                "Apple is continuing its push for U.S. Supreme Court review of the App Store contempt ruling."
                    .to_string(),
            ),
            &None,
        ));
        assert!(should_include_article(
            &filters,
            &source,
            "macOS 27 Golden Gate Supported Devices: Full List of Compatible Macs",
            &Some("Apple has confirmed the full list of Mac models compatible with macOS 27 Golden Gate.".to_string()),
            &None,
        ));
        assert!(!should_include_article(
            &filters,
            &source,
            "AirPods Pro 3 Drop to New All-Time Low of $179 ($70 Off) [Deal]",
            &Some("Apple's AirPods Pro 3 have dropped to an all-time low price of just $179.".to_string()),
            &None,
        ));
    }

    #[test]
    fn resolve_article_category_keeps_regular_mac_news() {
        let filters = Filters::new().expect("filters");
        let article = Article {
            id: "mac-news".to_string(),
            title: "macOS Tahoe beta adds new Finder features".to_string(),
            subtitle: "Mac update details".to_string(),
            category: "technology".to_string(),
            author: "Test".to_string(),
            avatar: "T".to_string(),
            date: "Jun 1".to_string(),
            timestamp: 1,
            cover: String::new(),
            source_name: "Test Source".to_string(),
            source_url: "https://example.com/mac-story".to_string(),
            bookmarked: false,
            queued: false,
            custom: false,
            content: "<p>Story</p>".to_string(),
        };

        assert_eq!(resolve_article_category(&filters, &article), "technology");
    }

    #[test]
    fn article_cleaner_removes_leading_category_labels() {
        let blocks = vec![
            ("p".to_string(), "Apps".to_string()),
            ("p".to_string(), "Mac".to_string()),
            ("p".to_string(), "AI".to_string()),
            (
                "p".to_string(),
                "OpenAI just released this week’s Codex desktop app update.".to_string(),
            ),
        ];

        let cleaned = clean_article_blocks(blocks);
        assert_eq!(cleaned.len(), 1);
        assert_eq!(
            cleaned[0].1,
            "OpenAI just released this week’s Codex desktop app update."
        );
    }
}
