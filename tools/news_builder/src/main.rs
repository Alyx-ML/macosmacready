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

struct Filters {
    mac_news: Regex,
    strong_mac: Regex,
    ios_only: Regex,
    deal: Regex,
    mac_deal: Regex,
    games: Regex,
    reviews: Regex,
    apps: Regex,
    ai: Regex,
    boilerplate: Regex,
}

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
            ios_only: Regex::new(
                r"(?i)\b(iOS|iPhone|iPad|iPadOS|watchOS|Apple Watch|AirPods|visionOS|Vision Pro)\b",
            )?,
            deal: Regex::new(
                r"(?i)\b(deal|deals|sale|discount|coupon|save \$|save up to|% off|today only|lowest price|record-low|price drop|clearance|promo|promotion|bundle|lifetime license|sponsored|advertorial|stacksocial|walmart|best buy|amazon|b&h)\b",
            )?,
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
            boilerplate: Regex::new(
                r"(?i)^(source:|read on|continue reading|go to the linked site|go to the podcast page|advertisement|sponsor|subscribe|share this|related articles|sign up|you are using an ad blocker)",
            )?,
        })
    }

    fn category_matches(&self, category: &str, text: &str) -> bool {
        match category {
            "design" => self.games.is_match(text),
            "science" => self.reviews.is_match(text),
            "culture" => self.apps.is_match(text),
            "ai" => self.ai.is_match(text),
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

        let content = format!(
            "<p>{}</p><p><a href=\"{}\" target=\"_blank\" rel=\"noopener\">Source: {}</a></p>",
            encode_text(&subtitle),
            encode_text(&source_url),
            encode_text(source.name)
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
    let headline_text = format!("{} {}", title, strip_html_option(raw_description));
    if source.category != "design" && is_ios_led_title(filters, title) {
        return false;
    }

    let combined_text = format!(
        "{} {} {}",
        title,
        raw_description.as_deref().unwrap_or_default(),
        strip_html_option(content)
    );

    if !filters.category_matches(source.category, &combined_text) {
        return false;
    }

    if source.category != "technology" {
        return true;
    }

    if !filters.strong_mac.is_match(&headline_text) {
        return false;
    }

    if filters.deal.is_match(&headline_text) && !filters.mac_deal.is_match(&headline_text) {
        return false;
    }

    !is_ios_led_title(filters, title)
}

fn should_render_article(filters: &Filters, article: &Article) -> bool {
    if article.category != "design" {
        let headline = format!("{} {}", article.title, article.subtitle);
        if filters.ios_only.is_match(&headline) && !filters.strong_mac.is_match(&headline) {
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

    let category_order = ["technology", "science", "culture", "ai", "design"];
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
        .take(48)
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

        for paragraph in split_long_paragraph(&text) {
            blocks.push((tag.to_string(), paragraph));
        }
    }

    blocks
}

fn article_html_from_blocks(blocks: &[(String, String)], link: &str, source_name: &str) -> String {
    let mut html = String::new();
    for (tag, text) in blocks.iter().take(18) {
        html.push_str(&format!("<{}>{}</{}>", tag, encode_text(text), tag));
    }
    html.push_str(&format!(
        "<p><a href=\"{}\" target=\"_blank\" rel=\"noopener\">Source: {}</a></p>",
        encode_text(link),
        encode_text(source_name)
    ));
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
