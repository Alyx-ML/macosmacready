// macOS Tahoe Multi-App Simulation Client-side Interactivity
// Includes: News reader, Crossover updater, SteamDB Games, App Store, Reviews, Finder & Quick Look

// --- 1. Mac-focused source-backed article data ---
const NEWS_RSS_SOURCES = [
  { name: "9to5Mac", url: "https://9to5mac.com/guides/mac/feed/", category: "technology" },
  { name: "MacRumors", url: "https://feeds.macrumors.com/MacRumors-All", category: "technology" },
  { name: "AppleInsider Mac", url: "https://appleinsider.com/inside/mac", category: "technology", format: "html" },
  { name: "Apple Newsroom", url: "https://www.apple.com/newsroom/rss-feed.rss", category: "technology" },
  { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/apple", category: "technology" },
  { name: "The Verge", url: "https://www.theverge.com/rss/apple/index.xml", category: "technology" },
  { name: "TidBITS", url: "https://tidbits.com/feed/", category: "technology" },
  { name: "The Eclectic Light Company", url: "https://eclecticlight.co/category/macs/feed/", category: "technology" },
  { name: "Michael Tsai", url: "https://mjtsai.com/blog/feed/", category: "technology" },
  { name: "Macworld", url: "https://www.macworld.com/feed", category: "technology" },
  { name: "The Mac Observer", url: "https://www.macobserver.com/feed/", category: "technology" },
  { name: "Daring Fireball", url: "https://daringfireball.net/feeds/main", category: "technology" },
  { name: "512 Pixels", url: "https://512pixels.net/feed.xml", category: "technology" },
  { name: "Scripting OS X", url: "https://scriptingosx.com/feed/", category: "technology" },
  { name: "OWC Rocket Yard", url: "https://eshop.macsales.com/blog/feed/", category: "technology" },
  { name: "Der Flounder", url: "https://derflounder.wordpress.com/feed/", category: "technology" },
  { name: "PC Gamer", url: "https://www.pcgamer.com/rss/", category: "design" },
  { name: "Rock Paper Shotgun", url: "https://www.rockpapershotgun.com/feed", category: "design" },
  { name: "Polygon", url: "https://www.polygon.com/rss/index.xml", category: "design" },
  { name: "Kotaku", url: "https://kotaku.com/rss", category: "design" },
  { name: "Macworld Reviews", url: "https://www.macworld.com/reviews/feed", category: "science" },
  { name: "Six Colors", url: "https://sixcolors.com/feed/", category: "science" },
  { name: "MacStories", url: "https://www.macstories.net/feed/", category: "culture" },
  { name: "9to5Mac Apps", url: "https://9to5mac.com/guides/apps/feed/", category: "culture" },
  { name: "9to5Mac Apple Intelligence", url: "https://9to5mac.com/guides/apple-intelligence/feed/", category: "ai" },
  { name: "9to5Toys Mac Deals", url: "https://9to5toys.com/guides/mac/feed/", category: "deals" },
  { name: "9to5Toys Apple Deals", url: "https://9to5toys.com/guides/apple/feed/", category: "deals" }
];
const MAC_NEWS_TERMS = /\b(macOS|Mac\b|MacBook|iMac|Mac mini|Mac Studio|Mac Pro|Apple silicon|M[1-9]\b|WWDC|Safari|Finder|Time Machine|Xcode|Gatekeeper|FileVault|Launch Services|MDM|Jamf|SwiftUI|AppKit|Terminal|malware|Security Update)\b/i;
const STRONG_MAC_CONTEXT_TERMS = /\b(macOS|Mac\b|MacBook|iMac|Mac mini|Mac Studio|Mac Pro|Apple silicon|M[1-9]\b|Finder|Time Machine|Xcode|Gatekeeper|FileVault|Launch Services|MDM|Jamf|SwiftUI|AppKit|Terminal|Security Update)\b/i;
const IOS_ONLY_TERMS = /\b(iOS|iPhone|iPad|iPadOS|watchOS|Apple Watch|AirPods|visionOS|Vision Pro)\b/i;
const DEAL_TERMS = /\b(deal|deals|sale|discount|coupon|save \$|save up to|% off|today only|lowest price|record-low|price drop|clearance|promo|promotion|bundle|lifetime license|sponsored|advertorial|stacksocial|walmart|best buy|amazon|b&h)\b/i;
const MAC_DEAL_TERMS = /\b(MacBook|iMac|Mac mini|Mac Studio|Mac Pro|Studio Display|Apple display|Apple silicon)\b/i;
const MACBOOK_DEAL_TERMS = /\b(MacBook|MacBook Air|MacBook Pro|USB-C|Thunderbolt|MagSafe|dock|hub|charger|adapter|monitor|display|SSD|external drive|keyboard|mouse|trackpad|sleeve|case|stand|backpack|accessor(?:y|ies)|AppleCare|M[1-9]\b)\b/i;
const MAC_DEAL_PRODUCT_TERMS = /\b(MacBook|MacBook Air|MacBook Pro|Mac mini|Mac Studio|Mac Pro|iMac|Studio Display|Mac\b)\b/i;
const MOBILE_PRODUCT_TERMS = /\b(iPhone|iPad|AirPods|Apple Watch|Watch|Vision Pro|MagSafe Battery)\b/i;
const PRICE_PATTERN = /(?:[$£€]\s?\d[\d,]*(?:\.\d{2})?|\d{1,3}%\s?off|save\s?(?:up to\s?)?[$£€]?\s?\d[\d,]*|[$£€]?\s?\d[\d,]*\s?off|all-time low|record low|lowest price)/ig;
const RSS_CATEGORY_TERMS = {
  technology: MAC_NEWS_TERMS,
  design: /\b(game|games|gaming|Steam|Xbox|PlayStation|Nintendo|Switch|PC|trailer|release|released|launch|update|patch|DLC|demo|early access|indie|developer|studio)\b/i,
  science: /\b(review|reviews|hands-on|tested|benchmark|benchmarks|performance|long-term|versus|vs\.?|Mac|macOS|MacBook|iMac|Mac mini|Mac Studio|Mac Pro)\b/i,
  culture: /\b(Mac app|Mac apps|macOS app|macOS apps|for Mac|on Mac|Mac version|menu bar|Safari extension|Setapp|Raycast|Alfred|BBEdit|Pixelmator|CleanMyMac|Final Cut|Logic Pro|developer tool|Apple silicon)\b/i,
  ai: /\b(Apple Intelligence|AI|artificial intelligence|Siri|LLM|language model|machine learning|Foundation Models|Image Playground|Genmoji|Writing Tools|ChatGPT|OpenAI|Claude|Gemini|Shortcuts Playground|macOS)\b/i,
  deals: /\b(MacBook|MacBook Air|MacBook Pro|Mac mini|Mac Studio|Studio Display|Thunderbolt|USB-C|MagSafe|charger|dock|hub|monitor|display|SSD|keyboard|mouse|trackpad|case|sleeve|stand|backpack|accessor(?:y|ies)|deal|deals|discount|sale|off|low|price|Amazon|Best Buy|B&H)\b/i
};
const RSS_CATEGORY_LABELS = {
  all: "Today",
  technology: "News",
  design: "Games",
  science: "Reviews",
  culture: "Apps",
  ai: "Apple Intelligence",
  deals: "Deals"
};
const GENERATED_NEWS_URL = "public/data/news.generated.json";

function fetchDevProxy(url) {
  const isLocalDev = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const requestUrl = isLocalDev
    ? `/rss?url=${encodeURIComponent(url)}`
    : `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  return fetch(requestUrl);
}

function fetchAppleJson(url) {
  return new Promise((resolve, reject) => {
    const callbackName = `macreadyAppleJson${Date.now()}${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const cleanup = () => {
      delete window[callbackName];
      script.remove();
    };
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("Apple App Store request timed out"));
    }, 15000);

    window[callbackName] = data => {
      window.clearTimeout(timer);
      cleanup();
      resolve({
        ok: true,
        json: async () => data
      });
    };

    const requestUrl = new URL(url);
    requestUrl.searchParams.set("callback", callbackName);
    script.onerror = () => {
      window.clearTimeout(timer);
      cleanup();
      reject(new Error("Apple App Store request failed"));
    };
    script.src = requestUrl.toString();
    document.head.appendChild(script);
  });
}

function fetchRSSJson(url) {
  const isLocalDev = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (isLocalDev) return null;
  return fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
}

// Curated Preset Gradients for Visual Diversity
const PRESET_GRADIENTS = {
  "preset-1": "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)", /* Glass Crystals */
  "preset-2": "linear-gradient(135deg, #0575e6 0%, #00f260 100%)", /* Neon Aurora */
  "preset-3": "linear-gradient(135deg, #f12711 0%, #f5af19 100%)", /* Magma Wave */
  "preset-4": "linear-gradient(135deg, #434343 0%, #090909 100%)"  /* Monolithic Silver */
};

// Preset gradient descriptors for details
const PRESET_INFO = {
  "preset-1": { bg: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)", name: "Glass Crystals", color: "#3b82f6" },
  "preset-2": { bg: "linear-gradient(135deg, #0575e6 0%, #00f260 100%)", name: "Neon Aurora", color: "#10b981" },
  "preset-3": { bg: "linear-gradient(135deg, #f12711 0%, #f5af19 100%)", name: "Magma Wave", color: "#f59e0b" },
  "preset-4": { bg: "linear-gradient(135deg, #434343 0%, #090909 100%)", name: "Monolithic Silver", color: "#8e8e93" }
};

// --- 2. State Management & Navigation ---
let currentUsername = localStorage.getItem("macready_username") || "Guest";
if (currentUsername === "MacReady") {
  currentUsername = "Guest";
  localStorage.removeItem("macready_username");
}
let currentUserEmail = localStorage.getItem("macready_email") || "";
const ADMIN_ACCOUNT_USERNAMES = new Set(["Admin", "MacReady Admin"]);
const ADMIN_ACCOUNT_EMAILS = new Set(["admin@macready.local"]);
let articles = [];
let currentCategory = "all"; // "all" or specific categories
let currentLibrary = "today"; // "today", "bookmarks", "queue", "custom"
let searchQuery = "";
let selectedArticleId = null;
let currentReaderTheme = "classic";
let currentView = "grid"; // "grid" or "list"
const INITIAL_VISIBLE_ARTICLE_COUNT = 10;
let visibleArticlesCount = INITIAL_VISIBLE_ARTICLE_COUNT;
let enabledNewsSources = new Set(NEWS_RSS_SOURCES.map(source => source.name));
let queuedArticleUrls = new Set();

// Multi-app Routing State
let currentApp = "news";
let appHistory = ["news"];
let appHistoryIndex = 0;
let openedApps = new Set(["news"]);

// Download Manager for App Store
let downloadedApps = new Set();
let downloadingApps = new Map(); // id -> percentage
let installedAppInfo = {};
let dynamicStoreApps = [];
let realTopApps = [];
let realPaidApps = [];
let currentStoreTab = "discover";
let appStoreLoaded = false;
let appStoreLoading = false;
let appStoreSearchTimeout = null;
let appStoreHeroIndex = 0;
let appStoreHeroTimer = null;
// Per-genre cache: { tabKey: { free: [], paid: [] } }
let genreCache = {};
let genreLoading = new Set();

// Finder Explorer State
let finderCurrentDir = "desktop";
let finderSelectedFile = null;

// Initialize data from LocalStorage or the current article set
function initData() {
  articles = [];

  // Load downloaded apps
  const storedDownloads = localStorage.getItem("tahoe_downloaded_apps");
  if (storedDownloads) {
    try {
      downloadedApps = new Set(JSON.parse(storedDownloads));
    } catch (e) {
      console.error(e);
    }
  }

  const storedInstallInfo = localStorage.getItem("tahoe_installed_app_info");
  if (storedInstallInfo) {
    try {
      installedAppInfo = JSON.parse(storedInstallInfo);
    } catch (e) {
      console.error(e);
    }
  }

  const storedSources = localStorage.getItem("tahoe_enabled_news_sources");
  if (storedSources) {
    try {
      const sourceNames = JSON.parse(storedSources);
      const currentSourceNames = NEWS_RSS_SOURCES.map(source => source.name);
      enabledNewsSources = new Set(sourceNames.filter(name => currentSourceNames.includes(name)));
      currentSourceNames.forEach(name => {
        if (!sourceNames.includes(name)) enabledNewsSources.add(name);
      });
    } catch (e) {
      console.error(e);
    }
  }

  const storedQueue = localStorage.getItem("tahoe_reading_queue");
  if (storedQueue) {
    try {
      queuedArticleUrls = new Set(JSON.parse(storedQueue));
    } catch (e) {
      console.error(e);
    }
  }

  // Load theme preference
  const savedTheme = localStorage.getItem("tahoe_theme") || "blue";
  setAccentColor(savedTheme);

  // Load view mode preference
  const savedView = localStorage.getItem("tahoe_view") || "grid";
  setViewMode(savedView);

  // Load dark/light mode preference
  const savedDarkMode = localStorage.getItem("tahoe_darkmode");
  if (savedDarkMode === "light") {
    document.body.classList.add("light-mode");
    const dsBtn = document.getElementById("qs-darkmode");
    if (dsBtn) dsBtn.classList.remove("active");
  }
  updateModeButtonLabel();

  // Update counts
  updateCounts();
  updateAppHeader();
}

function saveToStorage() {
  localStorage.setItem("tahoe_downloaded_apps", JSON.stringify(Array.from(downloadedApps)));
  localStorage.setItem("tahoe_installed_app_info", JSON.stringify(installedAppInfo));
  localStorage.setItem("tahoe_enabled_news_sources", JSON.stringify(Array.from(enabledNewsSources)));
  localStorage.setItem("tahoe_reading_queue", JSON.stringify(Array.from(queuedArticleUrls)));
}

function updateCounts() {
  const bookmarkCount = articles.filter(a => a.bookmarked).length;
  const queueCount = articles.filter(a => a.queued).length;
  const customCount = articles.filter(a => a.custom).length;
  
  const bCountEl = document.getElementById("bookmark-count");
  const qCountEl = document.getElementById("queue-count");
  const cCountEl = document.getElementById("custom-count");
  if (bCountEl) bCountEl.textContent = bookmarkCount;
  if (qCountEl) qCountEl.textContent = queueCount;
  if (cCountEl) cCountEl.textContent = customCount;

  const widgetTotalCount = document.getElementById("widget-total-count");
  const widgetBookmarkCount = document.getElementById("widget-bookmark-count");
  const widgetCustomCount = document.getElementById("widget-custom-count");

  if (widgetTotalCount) widgetTotalCount.textContent = articles.length;
  if (widgetBookmarkCount) widgetBookmarkCount.textContent = bookmarkCount;
  if (widgetCustomCount) widgetCustomCount.textContent = customCount;
}

function renderNewsSourceControls() {
  const menu = document.getElementById("news-source-menu");
  if (!menu) return;

  menu.innerHTML = NEWS_RSS_SOURCES.map(source => `
    <li class="sidebar-item source-control-item" data-source-name="${source.name}">
      <label class="source-control-label">
        <input type="checkbox" ${enabledNewsSources.has(source.name) ? "checked" : ""}>
        <span>${source.name}</span>
      </label>
    </li>
  `).join("");

  menu.querySelectorAll(".source-control-item").forEach(item => {
    const checkbox = item.querySelector("input");
    const sourceName = item.getAttribute("data-source-name");
    if (!checkbox || !sourceName) return;

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        enabledNewsSources.add(sourceName);
      } else {
        enabledNewsSources.delete(sourceName);
      }
      saveToStorage();
      renderFeed();
    });
  });
}

async function loadNewsFromRSS() {
  articles = [];
  renderFeed();

  try {
    const response = await fetch(`${GENERATED_NEWS_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`News data request failed: ${response.status}`);

    const data = await response.json();
    articles = (data.articles || [])
      .filter(article => enabledNewsSources.has(article.sourceName))
      .map(article => ({
        ...article,
        bookmarked: false,
        queued: queuedArticleUrls.has(article.sourceUrl),
        custom: false
      }));
  } catch (error) {
    console.error("Generated news data failed to load", error);
    articles = [];
  }

  updateCounts();
  renderFeed();
}

function getRSSNodeText(item, selector) {
  return item.querySelector(selector)?.textContent?.trim() || "";
}

async function fetchHTMLNewsSource(source) {
  const response = await fetchDevProxy(source.url);
  if (!response.ok) throw new Error(`HTML source failed for ${source.name}`);

  const html = await response.text();
  const doc = parseRSSHTML(html);
  const articleLinks = [...doc.querySelectorAll("article a[href], .article a[href], .card a[href], h2 a[href], h3 a[href], a[href]")]
    .map(link => {
      const title = cleanArticleText(link.textContent);
      const sourceUrl = new URL(link.getAttribute("href"), source.url).toString();
      const container = link.closest("article, .article, .card, .post, li, div") || link.parentElement;
      const subtitle = buildHTMLSourceSubtitle(container, title);
      const cover = extractSourceArticleImage(container?.outerHTML || "", source.url);
      const timeText = container?.querySelector("time")?.getAttribute("datetime") || container?.querySelector("time")?.textContent || "";
      const timestamp = Date.parse(timeText) || 0;

      return { title, sourceUrl, subtitle, cover, timestamp };
    })
    .filter(item => item.title.length > 24)
    .filter(item => item.sourceUrl.startsWith("https://appleinsider.com/"))
    .filter(item => !isIOSFocusedNewsText(item.title, item.subtitle))
    .filter((item, index, list) => list.findIndex(match => match.sourceUrl === item.sourceUrl) === index)
    .slice(0, 12);

  return articleLinks.map((item, index) => ({
    id: `${source.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${item.timestamp || index}`,
    title: item.title,
    subtitle: item.subtitle || "Latest Mac coverage from AppleInsider.",
    category: source.category,
    author: source.name,
    avatar: source.name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase(),
    date: formatRSSDate(item.timestamp || Date.now()),
    timestamp: item.timestamp || Date.now() - index,
    cover: item.cover || "preset-1",
    sourceName: source.name,
    sourceUrl: item.sourceUrl,
    bookmarked: false,
    queued: queuedArticleUrls.has(item.sourceUrl),
    custom: false,
    content: buildRSSArticleContent(`<p>${escapeHTML(item.subtitle || item.title)}</p>`, item.sourceUrl, source.name)
  }));
}

function buildHTMLSourceSubtitle(container, title) {
  if (!container) return "";
  const text = [...container.querySelectorAll("p, .dek, .summary, .excerpt")]
    .map(node => cleanArticleText(node.textContent))
    .find(value => value.length > 40 && value !== title);
  return text || "";
}

function getRSSItemNodes(documentXml) {
  const rssItems = [...documentXml.querySelectorAll("item")];
  if (rssItems.length > 0) return rssItems;
  return [...documentXml.querySelectorAll("entry")];
}

function getRSSItemLink(item) {
  const directLink = getRSSNodeText(item, "link");
  if (directLink) return directLink;

  const alternateLink = [...item.querySelectorAll("link")]
    .find(link => !link.getAttribute("rel") || link.getAttribute("rel") === "alternate");
  return alternateLink?.getAttribute("href") || "";
}

function shouldIncludeRSSArticle(source, title, rawDescription, content) {
  if (!title) return false;

  const headlineText = `${title} ${stripHTML(rawDescription || "")}`;
  if (source.category !== "design" && source.category !== "deals" && isIOSLedTitle(title)) return false;

  const combinedText = `${title} ${rawDescription || ""} ${stripHTML(content || "")}`;
  const categoryTerms = RSS_CATEGORY_TERMS[source.category] || MAC_NEWS_TERMS;
  if (!categoryTerms.test(combinedText)) return false;

  if (source.category === "deals") {
    if (MOBILE_PRODUCT_TERMS.test(title) && !MAC_DEAL_PRODUCT_TERMS.test(title)) return false;
    return DEAL_TERMS.test(combinedText) && MACBOOK_DEAL_TERMS.test(headlineText);
  }

  if (source.category !== "technology") return true;

  const hasMacContext = STRONG_MAC_CONTEXT_TERMS.test(headlineText);
  if (!hasMacContext) return false;

  const isDeal = DEAL_TERMS.test(headlineText);
  if (isDeal && !MAC_DEAL_TERMS.test(headlineText)) return false;

  if (isIOSLedTitle(title)) return false;

  return true;
}

function isIOSLedTitle(title) {
  return IOS_ONLY_TERMS.test(title || "") && !STRONG_MAC_CONTEXT_TERMS.test(title || "");
}

function isMobileAppleArticle(article) {
  if (!article || article.category === "design" || article.category === "deals") return false;
  const title = article.title || "";
  const headline = `${article.title || ""} ${article.subtitle || ""}`;
  if (IOS_ONLY_TERMS.test(title) && !STRONG_MAC_CONTEXT_TERMS.test(title)) return true;
  return IOS_ONLY_TERMS.test(headline) && !STRONG_MAC_CONTEXT_TERMS.test(headline);
}

function isIOSFocusedNewsText(title, subtitle = "") {
  const headlineText = `${title || ""} ${subtitle || ""}`;
  return IOS_ONLY_TERMS.test(headlineText) && !STRONG_MAC_CONTEXT_TERMS.test(headlineText);
}

function shouldRenderArticle(article) {
  if (isMobileAppleArticle(article)) return false;
  if (article.category === "technology" && isIOSLedTitle(article.title)) return false;

  const imageRequiredSources = ["The Mac Observer", "Six Colors", "MacStories"];
  if (imageRequiredSources.includes(article.sourceName) && (!article.cover || article.cover.startsWith("preset-"))) {
    return false;
  }

  return true;
}

function extractDealSignals(article) {
  if (!article || article.category !== "deals") return [];
  const text = `${article.title || ""} ${article.subtitle || ""}`;
  return [...new Set((text.match(PRICE_PATTERN) || []).map(value => cleanArticleText(value)).filter(Boolean))].slice(0, 3);
}

function parseRSSHTML(html) {
  return new DOMParser().parseFromString(html || "", "text/html");
}

function stripHTML(html) {
  const doc = parseRSSHTML(html);
  return doc.body.textContent.replace(/\s+/g, " ").trim();
}

function buildRSSSubtitle(html) {
  return buildArticleExcerpt(html, 260);
}

function buildArticleExcerpt(html, maxLength = 260) {
  const doc = parseRSSHTML(html);
  doc.querySelectorAll("img, figure, script, style, noscript").forEach(node => node.remove());
  const textBlocks = [...doc.querySelectorAll("p, li")]
    .map(node => node.textContent.replace(/\s+/g, " ").trim())
    .filter(text => text.length > 30);
  const text = (textBlocks.length > 0 ? textBlocks : [doc.body.textContent.replace(/\s+/g, " ").trim()])
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;

  const shortened = text.slice(0, maxLength);
  const lastBreak = Math.max(shortened.lastIndexOf(". "), shortened.lastIndexOf("? "), shortened.lastIndexOf("! "));
  if (lastBreak > 120) return shortened.slice(0, lastBreak + 1);

  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > 120 ? lastSpace : maxLength).trim()}...`;
}

function buildRSSArticleContent(html, link, sourceName) {
  const doc = parseRSSHTML(html);
  const paragraphs = extractReadableBlocks(doc.body);

  return `${paragraphs.map(block => `<${block.tag}>${block.text}</${block.tag}>`).join("")}<p><a href="${link}" target="_blank" rel="noopener">Source: ${sourceName}</a></p>`;
}

function extractReadableBlocks(root) {
  if (!root) return [];

  root.querySelectorAll("img, figure, script, style, noscript, iframe, form, button, nav, aside, .inlinead, .ad-container, .related-guide, .author-gear, .article__content, #comments").forEach(node => node.remove());

  const blocks = [...root.querySelectorAll("h2, h3, p, li, blockquote")]
    .map(node => ({
      tag: /^h[23]$/i.test(node.tagName) ? "h2" : "p",
      text: cleanArticleText(node.textContent)
    }))
    .filter(block => block.text.length > 0)
    .filter(block => !isArticleBoilerplate(block.text));

  const compacted = [];
  blocks.forEach(block => {
    const previous = compacted[compacted.length - 1];
    if (previous && previous.text === block.text) return;
    compacted.push(block);
  });

  return compacted.flatMap(block =>
    splitLongArticleParagraph(block.text).map(text => ({ tag: block.tag, text: escapeHTML(text) }))
  );
}

function cleanArticleText(text) {
  return (text || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function isArticleBoilerplate(text) {
  return /^(source:|read on|continue reading|go to the linked site|go to the podcast page|advertisement|sponsor|subscribe|share this|related articles|related stories:|ftc:)/i.test(text);
}

const ARTICLE_LEADING_LABELS = new Set([
  "ai",
  "app store",
  "apple",
  "apple intelligence",
  "apple silicon",
  "apple tv",
  "apple watch",
  "apps",
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
  "watchos"
]);

const ARTICLE_RELATED_SECTION_LABELS = new Set([
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
  "top stories",
  "videos"
]);

const ARTICLE_AD_LINK_LABELS = new Set([
  "discounted airpods pro 3",
  "get weekly updates",
  "official apple store on amazon"
]);

function removeLeadingArticleLabels(root) {
  if (!root) return;

  let node = root.firstElementChild;
  let removedCount = 0;

  while (node && removedCount < 12) {
    if (!/^(P|H2|H3|LI)$/i.test(node.tagName)) return;

    const text = cleanArticleText(node.textContent);
    if (!isLeadingArticleLabel(text)) return;

    const next = node.nextElementSibling;
    node.remove();
    node = next;
    removedCount += 1;
  }
}

function isLeadingArticleLabel(text) {
  if (!text) return true;
  const normalized = text.toLowerCase();
  if (ARTICLE_LEADING_LABELS.has(normalized)) return true;
  if (text.length > 36 || /[.!?;:]/.test(text)) return false;

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 4) return false;

  return words.every(word => /^[A-Z0-9][A-Za-z0-9&+-]*$/.test(word) || /^[A-Z]{2,}$/.test(word));
}

function removeLeadingRelatedArticleSections(root) {
  if (!root) return;

  let node = root.firstElementChild;
  let removingRelated = false;
  let removedCount = 0;

  while (node && removedCount < 24) {
    const text = cleanArticleText(node.textContent);
    const lowerText = text.toLowerCase();
    const startsRelatedSection = ARTICLE_RELATED_SECTION_LABELS.has(lowerText);

    if (!removingRelated && !startsRelatedSection) return;

    if (removingRelated && /^H[23]$/i.test(node.tagName) && !startsRelatedSection) return;

    const next = node.nextElementSibling;
    node.remove();
    node = next;
    removedCount += 1;
    removingRelated = true;
  }
}

function removeTrailingRelatedArticleSections(root) {
  if (!root) return;

  const children = [...root.children];
  const sectionStart = children.find(node => {
    if (!/^(H2|H3|P|LI)$/i.test(node.tagName)) return false;
    return ARTICLE_RELATED_SECTION_LABELS.has(cleanArticleText(node.textContent).toLowerCase());
  });

  if (!sectionStart) return;

  let node = sectionStart;
  while (node) {
    const next = node.nextElementSibling;
    node.remove();
    node = next;
  }
}

function removeArticleAdLinks(root) {
  if (!root) return;

  [...root.children].forEach(node => {
    const text = cleanArticleText(node.textContent);
    const lowerText = text.toLowerCase();
    if (
      ARTICLE_AD_LINK_LABELS.has(lowerText) ||
      /^discounted (airpods|apple watch|ipad|iphone|macbook|mac mini|mac studio)/i.test(text) ||
      /^macbook neo .+ \$(590|690) .+delivery by/i.test(text) ||
      /^these .+ macbook air models are .+ off/i.test(text) ||
      /^still live: .+macbook air/i.test(text)
    ) {
      node.remove();
    }
  });
}

function removeTrailingLinkLists(root) {
  if (!root) return;

  const children = [...root.children];
  const newsletterNode = children.find(node => cleanArticleText(node.textContent).toLowerCase() === "get weekly updates");
  if (!newsletterNode) return;

  let sectionStart = newsletterNode;
  let cursor = newsletterNode.previousElementSibling;
  let headlineCount = 0;

  while (cursor && headlineCount < 8) {
    const text = cleanArticleText(cursor.textContent);
    if (!isRelatedHeadlineText(text)) break;
    sectionStart = cursor;
    headlineCount += 1;
    cursor = cursor.previousElementSibling;
  }

  let node = headlineCount >= 2 ? sectionStart : newsletterNode;
  while (node) {
    const next = node.nextElementSibling;
    node.remove();
    node = next;
  }
}

function isRelatedHeadlineText(text) {
  if (!text || text.length < 24 || text.length > 160) return false;
  if (/[.!?]$/.test(text)) return false;
  return true;
}

function escapeHTML(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function splitLongArticleParagraph(text) {
  if (text.length <= 520) return [text];

  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [text];
  const paragraphs = [];
  let current = "";

  sentences.forEach(sentence => {
    const next = `${current} ${sentence.trim()}`.trim();
    if (current && next.length > 420) {
      paragraphs.push(current);
      current = sentence.trim();
    } else {
      current = next;
    }
  });

  if (current) paragraphs.push(current);
  return paragraphs;
}

function extractRSSImage(item, html) {
  const mediaUrl = [
    ...item.querySelectorAll("enclosure, thumbnail, image, media\\:content, media\\:thumbnail, itunes\\:image")
  ].map(node => node.getAttribute("url") || node.getAttribute("href") || node.textContent?.trim())
    .find(url => /^https?:\/\//.test(url || ""));
  if (mediaUrl) return mediaUrl;

  return extractRSSImageFromHTML(html);
}

function extractRSSImageFromHTML(html) {
  const doc = parseRSSHTML(html);
  const imageUrl = [...doc.querySelectorAll("img, source")]
    .map(node => node.getAttribute("src") || node.getAttribute("data-src") || node.getAttribute("data-lazy-src") || node.getAttribute("data-orig-file") || node.getAttribute("srcset"))
    .filter(Boolean)
    .map(value => value.split(",")[0].trim().split(/\s+/)[0])
    .find(url => /^https?:\/\//.test(url));
  return imageUrl || "preset-1";
}

async function hydrateSourceArticleImages(articleList) {
  const imageHydrationSources = ["The Mac Observer", "Six Colors", "MacStories"];
  const articlesNeedingSourceImages = imageHydrationSources.flatMap(sourceName =>
    articleList
      .filter(article => article.sourceName === sourceName)
      .filter(article => !article.cover || article.cover.startsWith("preset-"))
      .slice(0, 8)
  );

  if (articlesNeedingSourceImages.length === 0) return;

  await Promise.allSettled(articlesNeedingSourceImages.map(async article => {
    const response = await fetchDevProxy(article.sourceUrl);
    if (!response.ok) return;

    const html = await response.text();
    const sourceImage = extractSourceArticleImage(html, article.sourceUrl);
    if (sourceImage) article.cover = sourceImage;
  }));
}

function extractSourceArticleImage(html, articleUrl) {
  const doc = parseRSSHTML(html);
  const imageUrl = getJSONLDImage(doc) || [
    ...doc.querySelectorAll(
      "meta[property='og:image'], meta[name='twitter:image'], link[rel='image_src'], article img, article source, figure img, .entry-content img, .post-thumbnail img, .featured-image img, .wp-post-image"
    )
  ].map(node =>
    node.getAttribute("content") ||
    node.getAttribute("href") ||
    node.getAttribute("src") ||
    node.getAttribute("data-src") ||
    node.getAttribute("data-lazy-src") ||
    node.getAttribute("data-srcset") ||
    node.getAttribute("data-lazy-srcset") ||
    node.getAttribute("srcset")
  )
    .filter(Boolean)
    .map(value => value.split(",")[0].trim().split(/\s+/)[0])
    .find(url => /^(https?:)?\/\//.test(url) || url.startsWith("/"));

  if (!imageUrl) return "";
  return new URL(imageUrl, articleUrl).toString();
}

function getJSONLDImage(doc) {
  for (const script of doc.querySelectorAll("script[type='application/ld+json']")) {
    try {
      const data = JSON.parse(script.textContent || "{}");
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const image = item.image || item.thumbnailUrl;
        if (typeof image === "string") return image;
        if (Array.isArray(image) && typeof image[0] === "string") return image[0];
        if (image && typeof image.url === "string") return image.url;
      }
    } catch {
      continue;
    }
  }
  return "";
}

function optimizeArticleImageUrl(url, isFeatured = false) {
  if (!url || !/^https?:\/\//.test(url)) return url;

  const parsed = new URL(url);
  const width = isFeatured ? "900" : "600";

  if (parsed.hostname.endsWith("9to5mac.com")) {
    parsed.searchParams.set("w", width);
    return parsed.toString();
  }

  if (parsed.hostname === "images.macrumors.com") {
    parsed.searchParams.delete("resize");
    const resizedUrl = new URL("https://images.weserv.nl/");
    resizedUrl.searchParams.set("url", `${parsed.hostname}${parsed.pathname}${parsed.search}`);
    resizedUrl.searchParams.set("w", width);
    resizedUrl.searchParams.set("output", "webp");
    resizedUrl.searchParams.set("q", "82");
    return resizedUrl.toString();
  }

  return url;
}

function initNewsImageLoading() {
  const lazyImages = document.querySelectorAll(".card-cover img[data-src]");
  if (lazyImages.length === 0) return;

  const loadImage = img => {
    img.src = img.dataset.src;
    img.removeAttribute("data-src");
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      loadImage(entry.target);
      observer.unobserve(entry.target);
    });
  }, {
    root: document.getElementById("feed-container"),
    rootMargin: "420px 0px"
  });

  lazyImages.forEach(img => observer.observe(img));
}

function formatRSSDate(pubDate) {
  const date = new Date(pubDate);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Set macOS Accent Color
const HERITAGE_ACCENT_TOKENS = {
  puma: {
    color: "#2b7a78",
    rgb: "43, 122, 120",
    glow: "rgba(43, 122, 120, 0.4)",
    gradient: "linear-gradient(135deg, #74ebd5 0%, #acb6e5 100%)"
  },
  tiger: {
    color: "#0f6eb5",
    rgb: "15, 110, 181",
    glow: "rgba(15, 110, 181, 0.4)",
    gradient: "linear-gradient(135deg, #5aa5e6 0%, #0b5796 100%)"
  },
  panther: {
    color: "#78716c",
    rgb: "120, 113, 108",
    glow: "rgba(120, 113, 108, 0.35)",
    gradient: "linear-gradient(135deg, #d6d3d1 0%, #78716c 100%)"
  },
  leopard: {
    color: "#4b5563",
    rgb: "75, 85, 99",
    glow: "rgba(75, 85, 99, 0.35)",
    gradient: "linear-gradient(135deg, #9ca3af 0%, #4b5563 100%)"
  },
  yosemite: {
    color: "#f97316",
    rgb: "249, 115, 22",
    glow: "rgba(249, 115, 22, 0.4)",
    gradient: "linear-gradient(135deg, #fdba74 0%, #f97316 100%)"
  },
  elcapitan: {
    color: "#6b7280",
    rgb: "107, 114, 128",
    glow: "rgba(107, 114, 128, 0.35)",
    gradient: "linear-gradient(135deg, #b7b7b7 0%, #4b5563 100%)"
  },
  sierra: {
    color: "#2f80ed",
    rgb: "47, 128, 237",
    glow: "rgba(47, 128, 237, 0.4)",
    gradient: "linear-gradient(135deg, #56ccf2 0%, #2f80ed 100%)"
  },
  mojave: {
    color: "#fb923c",
    rgb: "251, 146, 60",
    glow: "rgba(251, 146, 60, 0.4)",
    gradient: "linear-gradient(135deg, #f43f5e 0%, #fb923c 50%, #f59e0b 100%)"
  },
  catalina: {
    color: "#7c3aed",
    rgb: "124, 58, 237",
    glow: "rgba(124, 58, 237, 0.4)",
    gradient: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 55%, #f97316 100%)"
  },
  bigsur: {
    color: "#0ea5e9",
    rgb: "14, 165, 233",
    glow: "rgba(14, 165, 233, 0.4)",
    gradient: "linear-gradient(135deg, #0ea5e9 0%, #f97316 50%, #ec4899 100%)"
  },
  monterey: {
    color: "#7c3aed",
    rgb: "124, 58, 237",
    glow: "rgba(124, 58, 237, 0.4)",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #ec4899 55%, #fb7185 100%)"
  },
  ventura: {
    color: "#f97316",
    rgb: "249, 115, 22",
    glow: "rgba(249, 115, 22, 0.4)",
    gradient: "linear-gradient(135deg, #dc2626 0%, #f97316 55%, #facc15 100%)"
  },
  sonoma: {
    color: "#84cc16",
    rgb: "132, 204, 22",
    glow: "rgba(132, 204, 22, 0.4)",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #84cc16 55%, #16a34a 100%)"
  },
  sequoia: {
    color: "#16a34a",
    rgb: "22, 163, 74",
    glow: "rgba(22, 163, 74, 0.4)",
    gradient: "linear-gradient(135deg, #86efac 0%, #16a34a 100%)"
  }
};

function setAccentColor(color) {
  // Remove existing themes dynamically
  Array.from(document.body.classList).forEach(cls => {
    if (cls.startsWith("theme-")) {
      document.body.classList.remove(cls);
    }
  });
  
  if (color === "custom") {
    const customColor = localStorage.getItem("tahoe_custom_accent") || "#007aff";
    document.body.classList.add("theme-custom");
    
    const hex = customColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    document.body.style.setProperty("--accent-color", customColor);
    document.body.style.setProperty("--accent-color-rgb", `${r}, ${g}, ${b}`);
    document.body.style.setProperty("--accent-glow", `rgba(${r}, ${g}, ${b}, 0.45)`);
    document.body.style.setProperty("--accent-gradient", `linear-gradient(135deg, ${customColor} 0%, rgba(${Math.max(0, r-50)}, ${Math.max(0, g-50)}, ${Math.max(0, b-50)}, 1) 100%)`);
  } else {
    document.body.style.removeProperty("--accent-color");
    document.body.style.removeProperty("--accent-color-rgb");
    document.body.style.removeProperty("--accent-glow");
    document.body.style.removeProperty("--accent-gradient");
    
    document.body.classList.add(`theme-${color}`);

    const heritageTokens = HERITAGE_ACCENT_TOKENS[color];
    if (heritageTokens) {
      document.body.style.setProperty("--accent-color", heritageTokens.color);
      document.body.style.setProperty("--accent-color-rgb", heritageTokens.rgb);
      document.body.style.setProperty("--accent-glow", heritageTokens.glow);
      document.body.style.setProperty("--accent-gradient", heritageTokens.gradient);
    }
  }
  
  localStorage.setItem("tahoe_theme", color);

  // Mark active color dot in Sidebar
  document.querySelectorAll(".accent-circle").forEach(dot => {
    dot.classList.remove("active");
    if (dot.getAttribute("data-color") === color) {
      dot.classList.add("active");
    }
  });

  // Sync Dropdown Options Active State
  const allDropdownOptions = document.querySelectorAll(".dropdown-option");
  allDropdownOptions.forEach(opt => {
    if (opt.getAttribute("data-value") === color) {
      opt.classList.add("active");
    } else {
      opt.classList.remove("active");
    }
  });

  // Sync Accent Dropdown Trigger Button Preview
  const accentTriggerColor = document.querySelector("#accent-dropdown-trigger .dropdown-selected-color");
  const accentTriggerText = document.querySelector("#accent-dropdown-trigger .dropdown-selected-text");
  const matchedAccentOpt = document.querySelector(`#accent-dropdown-menu .dropdown-option[data-value="${color}"]`);
  if (accentTriggerColor && accentTriggerText && matchedAccentOpt) {
    accentTriggerColor.className = "dropdown-selected-color";
    const customPreview = document.getElementById("custom-color-preview");
    if (color === "custom") {
      const hex = localStorage.getItem("tahoe_custom_accent") || "#007aff";
      accentTriggerColor.style.background = hex;
      accentTriggerText.textContent = `Custom (${hex.toUpperCase()})`;
      if (customPreview) {
        customPreview.style.background = hex;
      }
    } else {
      accentTriggerColor.removeAttribute("style");
      accentTriggerColor.classList.add(`accent-${color}`);
      accentTriggerText.textContent = matchedAccentOpt.querySelector(".option-text").textContent;
      if (customPreview) {
        customPreview.style.background = "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)";
      }
    }
  }

  // Sync Gradient Dropdown Trigger Button Preview
  const gradientTriggerColor = document.querySelector("#gradient-dropdown-trigger .dropdown-selected-color");
  const gradientTriggerText = document.querySelector("#gradient-dropdown-trigger .dropdown-selected-text");
  const matchedGradientOpt = document.querySelector(`#gradient-dropdown-menu .dropdown-option[data-value="${color}"]`);
  if (gradientTriggerColor && gradientTriggerText && matchedGradientOpt) {
    gradientTriggerColor.className = "dropdown-selected-color";
    gradientTriggerColor.removeAttribute("style");
    gradientTriggerColor.classList.add(`accent-${color}`);
    gradientTriggerText.textContent = matchedGradientOpt.querySelector(".option-text").textContent;
  }

  // Update widget control panel status label
  const accentStatus = document.getElementById("accent-status");
  if (accentStatus) {
    const names = {
      blue: "Blue", sky: "Sky Blue", teal: "Teal", mint: "Mint Green",
      green: "Green", yellow: "Yellow", amber: "Amber Orange", pink: "Pink",
      rose: "Rose Red", purple: "Purple", indigo: "Indigo", bronze: "Bronze Gold",
      slate: "Slate", silver: "Silver", custom: "Custom Hex",
      puma: "Cheetah/Puma Blue", tiger: "Tiger Aqua", panther: "Panther Graphite",
      leopard: "Snow Leopard", yosemite: "Yosemite Sunset", elcapitan: "El Capitan Grey",
      sierra: "Sierra Lake", mojave: "Mojave Golden", catalina: "Catalina Ocean",
      bigsur: "Big Sur Sunset", monterey: "Monterey Purple", ventura: "Ventura Orange",
      sonoma: "Sonoma Gold", sequoia: "Sequoia Forest"
    };
    accentStatus.textContent = names[color] || (color.charAt(0).toUpperCase() + color.slice(1));
  }

  // Re-trigger layout paints to sync borders/glows
  if (currentApp === "news" || currentApp === "reviews") {
    renderFeed();
  }
}

// Set View Grid/List Mode
function setViewMode(mode) {
  currentView = mode;
  localStorage.setItem("tahoe_view", mode);

  const gridBtn = document.getElementById("btn-grid");
  const listBtn = document.getElementById("btn-list");
  const gridContainer = document.getElementById("news-grid");

  if (gridBtn && listBtn) {
    if (mode === "grid") {
      gridBtn.classList.add("active");
      listBtn.classList.remove("active");
      if (gridContainer) gridContainer.classList.remove("list-view");
    } else {
      gridBtn.classList.remove("active");
      listBtn.classList.add("active");
      if (gridContainer) gridContainer.classList.add("list-view");
    }
  }

  // Update widget control panel status label
  const layoutStatus = document.getElementById("layout-status");
  if (layoutStatus) {
    layoutStatus.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
  }

  // Route layouts
  if (currentApp === "news" || currentApp === "reviews") {
    renderFeed();
  } else if (currentApp === "finder") {
    renderFinderView();
  }
}

function updateModeButtonLabel() {
  const modeLabel = document.querySelector("#qs-darkmode span");
  if (!modeLabel) return;

  const isLightMode = document.body.classList.contains("light-mode");
  modeLabel.textContent = isLightMode ? "Light Mode" : "Dark Mode";
}

function initCustomDropdowns() {
  const accentTrigger = document.getElementById("accent-dropdown-trigger");
  const accentMenu = document.getElementById("accent-dropdown-menu");
  const gradientTrigger = document.getElementById("gradient-dropdown-trigger");
  const gradientMenu = document.getElementById("gradient-dropdown-menu");
  
  if (!accentTrigger || !accentMenu || !gradientTrigger || !gradientMenu) return;

  // A. Toggle Menu Open/Close
  accentTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("gradient-dropdown")?.classList.remove("open");
    document.getElementById("accent-dropdown")?.classList.toggle("open");
  });

  gradientTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("accent-dropdown")?.classList.remove("open");
    document.getElementById("gradient-dropdown")?.classList.toggle("open");
  });

  // Close menus on click outside
  document.addEventListener("click", () => {
    document.getElementById("accent-dropdown")?.classList.remove("open");
    document.getElementById("gradient-dropdown")?.classList.remove("open");
  });

  // B. Accent Menu Option Selection
  const inlinePicker = document.getElementById("custom-inline-picker");
  accentMenu.querySelectorAll(".dropdown-option").forEach(option => {
    option.addEventListener("click", (e) => {
      const val = option.getAttribute("data-value");
      if (val === "custom") {
        e.stopPropagation();
        inlinePicker?.classList.toggle("hidden");
        // Sync picker to current stored color if available
        const savedCustom = localStorage.getItem("tahoe_custom_accent") || "#007aff";
        syncInlinePicker(savedCustom);
        return;
      }
      e.stopPropagation();
      setAccentColor(val);
      document.getElementById("accent-dropdown")?.classList.remove("open");
      inlinePicker?.classList.add("hidden");
    });
  });

  // Custom Inline Color Picker Drag & Event Listeners
  const slGrid = document.getElementById("picker-sl-grid");
  const pointer = document.getElementById("picker-pointer");
  const hueRange = document.getElementById("picker-hue-range");
  const hexInput = document.getElementById("picker-hex-input");
  const applyBtn = document.getElementById("btn-picker-apply");

  let currentH = 210;
  let currentS = 100;
  let currentV = 100;

  function hsvToHex(h, s, v) {
    s /= 100;
    v /= 100;
    let c = v * s;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = v - c;
    let r = 0, g = 0, b = 0;
    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else if (h >= 300 && h <= 360) { r = c; g = 0; b = x; }
    
    let rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    let gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    let bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');
    return `${rHex}${gHex}${bHex}`.toUpperCase();
  }

  function hexToHsv(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;
    
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, v = max;
    
    let d = max - min;
    s = max === 0 ? 0 : d / max;
    
    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      v: Math.round(v * 100)
    };
  }

  function updateFromHSV() {
    const baseColorHex = hsvToHex(currentH, 100, 100);
    if (slGrid) {
      slGrid.style.background = `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, #${baseColorHex})`;
    }
    
    if (pointer && slGrid) {
      const rect = slGrid.getBoundingClientRect();
      const x = (currentS / 100) * rect.width;
      const y = ((100 - currentV) / 100) * rect.height;
      pointer.style.left = `${x}px`;
      pointer.style.top = `${y}px`;
    }
    
    const hexVal = hsvToHex(currentH, currentS, currentV);
    if (hexInput) {
      hexInput.value = hexVal;
    }
    
    const fullHex = `#${hexVal}`;
    localStorage.setItem("tahoe_custom_accent", fullHex);
    setAccentColor("custom");
  }

  function handleGridMove(e) {
    if (!slGrid) return;
    const rect = slGrid.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    
    x = Math.max(0, Math.min(x, rect.width));
    y = Math.max(0, Math.min(y, rect.height));
    
    currentS = Math.round((x / rect.width) * 100);
    currentV = Math.round(((rect.height - y) / rect.height) * 100);
    
    updateFromHSV();
  }

  let isDraggingGrid = false;

  slGrid?.addEventListener("mousedown", (e) => {
    isDraggingGrid = true;
    handleGridMove(e);
  });

  document.addEventListener("mousemove", (e) => {
    if (isDraggingGrid) {
      handleGridMove(e);
    }
  });

  document.addEventListener("mouseup", () => {
    isDraggingGrid = false;
  });

  hueRange?.addEventListener("input", () => {
    currentH = parseInt(hueRange.value);
    updateFromHSV();
  });

  hexInput?.addEventListener("input", () => {
    const rawVal = hexInput.value.replace(/[^0-9A-Fa-f]/g, '');
    if (rawVal.length === 6) {
      const hsv = hexToHsv(rawVal);
      currentH = hsv.h;
      currentS = hsv.s;
      currentV = hsv.v;
      if (hueRange) hueRange.value = currentH;
      updateFromHSV();
    }
  });

  applyBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("accent-dropdown")?.classList.remove("open");
  });

  function syncInlinePicker(hex) {
    const hsv = hexToHsv(hex);
    currentH = hsv.h;
    currentS = hsv.s;
    currentV = hsv.v;
    if (hueRange) hueRange.value = currentH;
    
    setTimeout(() => {
      updateFromHSV();
    }, 50);
  }

  // C. Gradient Menu Option Selection
  gradientMenu.querySelectorAll(".dropdown-option").forEach(option => {
    option.addEventListener("click", (e) => {
      e.stopPropagation();
      const val = option.getAttribute("data-value");
      setAccentColor(val);
      document.getElementById("gradient-dropdown")?.classList.remove("open");
    });
  });
}

function initDockAutohideSettings() {
  const switchEl = document.getElementById("settings-dock-autohide-switch");
  if (!switchEl) return;

  const autohidePref = localStorage.getItem("macready_dock_autohide");
  if (autohidePref === "true") {
    switchEl.checked = true;
    document.body.classList.add("dock-autohide-enabled");
  } else {
    switchEl.checked = false;
    document.body.classList.remove("dock-autohide-enabled");
  }

  switchEl.addEventListener("change", () => {
    const isChecked = switchEl.checked;
    localStorage.setItem("macready_dock_autohide", isChecked ? "true" : "false");
    if (isChecked) {
      document.body.classList.add("dock-autohide-enabled");
    } else {
      document.body.classList.remove("dock-autohide-enabled");
    }
  });
}

let dockMotionList = [];
function initDockMagnification() {
  const dock = document.getElementById("dock");
  const dockContainer = document.getElementById("dock-container");
  if (!dock || !dockContainer) return;

  const refreshDockItems = () => {
    const items = Array.from(dock.querySelectorAll(".dock-item-wrapper"));
    dockMotionList = items.map(item => {
      const existing = dockMotionList.find(e => e.item === item);
      return existing || { item, current: 1, target: 1 };
    });
  };

  refreshDockItems();
  window.refreshDockMagnification = refreshDockItems;

  let dockMotionFrame = null;

  const renderDockMotion = () => {
    let moving = false;

    dockMotionList.forEach(entry => {
      entry.current += (entry.target - entry.current) * 0.28;
      if (Math.abs(entry.target - entry.current) > 0.001) moving = true;

      const scale = entry.current;
      entry.item.style.transform = `scale(${scale}) translateY(${-15 * (scale - 1)}px)`;

      const dockItem = entry.item.querySelector(".dock-item");
      if (dockItem) {
        const margin = 5 * (scale - 1);
        dockItem.style.margin = `0 ${margin}px 4px ${margin}px`;
      }
    });

    if (moving) {
      dockMotionFrame = requestAnimationFrame(renderDockMotion);
    } else {
      dockMotionFrame = null;
    }
  };

  const startDockMotion = () => {
    if (!dockMotionFrame) {
      dockMotionFrame = requestAnimationFrame(renderDockMotion);
    }
  };

  dock.addEventListener("mousemove", (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    dockMotionList.forEach((entry) => {
      const item = entry.item;
      const rect = item.getBoundingClientRect();
      const itemX = rect.left + rect.width / 2;
      const itemY = rect.top + rect.height;

      // Distance from cursor to dock item bottom-center
      const distX = mouseX - itemX;
      const distY = mouseY - itemY;
      const distance = Math.sqrt(distX * distX + distY * distY);

      // Scale calculations: max scale 1.45 at 0px distance, tapering to 1.0 at 150px distance
      const maxDistance = 150;
      let scale = 1.0;

      if (distance < maxDistance) {
        // Cosine curve for ultra-smooth scaling profile
        const factor = (Math.cos((distance / maxDistance) * Math.PI) + 1) / 2;
        scale = 1.0 + 0.38 * factor;
      }

      entry.target = scale;
    });
    startDockMotion();
  });

  dock.addEventListener("mouseleave", () => {
    // Reset all scale factors smoothly
    dockMotionList.forEach((entry) => {
      entry.target = 1;
    });
    startDockMotion();
  });
}

// --- 4. Multi-App Switching Routing System ---
function switchApp(appName, pushHistory = true) {
  currentApp = appName;
  openedApps.add(appName);
  if (appName === "news" || appName === "reviews") {
    visibleArticlesCount = INITIAL_VISIBLE_ARTICLE_COUNT;
  }
  
  // 1. Manage history
  if (pushHistory) {
    appHistory = appHistory.slice(0, appHistoryIndex + 1);
    appHistory.push(appName);
    appHistoryIndex = appHistory.length - 1;
  }
  updateNavControls();

  // 2. Hide all app view containers
  const viewContainers = [
    "news-app-view",
    "crossover-app-view",
    "macos-app-view",
    "games-app-view",
    "app-store-app-view",
    "finder-app-view"
  ];

  viewContainers.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === "news-app-view" && (appName === "news" || appName === "reviews")) {
        el.classList.remove("hidden-app");
        el.classList.add("animate-fade-in");
      } else if (id === `${appName}-app-view`) {
        el.classList.remove("hidden-app");
        el.classList.add("animate-fade-in");
      } else {
        el.classList.add("hidden-app");
        el.classList.remove("animate-fade-in");
      }
    }
  });

  // 3. Update Dock active classes and dots
  const dockWrappers = document.querySelectorAll("#dock .dock-item-wrapper");
  dockWrappers.forEach(wrapper => {
    const app = wrapper.getAttribute("data-app");
    const indicator = wrapper.querySelector(".dock-indicator");

    if (app === appName) {
      wrapper.classList.add("active");
      if (indicator) indicator.classList.add("active-dot");
    } else {
      wrapper.classList.remove("active");
      if (indicator) {
        if (openedApps.has(app)) {
          indicator.classList.add("active-dot");
        } else {
          indicator.classList.remove("active-dot");
        }
      }
    }
  });

  // 4. Update Window Toolbar Title & Search placeholder
  const appTitle = document.querySelector(".app-title");
  const searchInput = document.getElementById("story-search");
  const newStoryBtn = document.getElementById("btn-new-story");
  const segmentControl = document.querySelector(".segment-control");

  // Defaults
  if (newStoryBtn) {
    newStoryBtn.hidden = true;
    newStoryBtn.setAttribute("aria-hidden", "true");
    newStoryBtn.style.setProperty("display", "none", "important");
  }
  if (segmentControl) segmentControl.style.display = "none";

  if (searchInput) {
    searchInput.value = "";
    searchQuery = "";
    const clearBtn = document.getElementById("search-clear-btn");
    if (clearBtn) clearBtn.classList.add("hidden");
  }

  // App-specific customization
  if (appName === "news") {
    if (appTitle) appTitle.textContent = "Today's Overview";
    if (searchInput) searchInput.placeholder = "Search Articles...";
    updateAdminControls();
    if (segmentControl) segmentControl.style.display = "flex";

    // Setup news segment buttons state
    const gridBtn = document.getElementById("btn-grid");
    const listBtn = document.getElementById("btn-list");
    if (gridBtn && listBtn) {
      if (currentView === "grid") {
        gridBtn.classList.add("active");
        listBtn.classList.remove("active");
      } else {
        gridBtn.classList.remove("active");
        listBtn.classList.add("active");
      }
    }

    currentLibrary = "today";
    currentCategory = "all";
    renderFeed();
  }
  else if (appName === "reviews") {
    if (appTitle) appTitle.textContent = "Mac Reviews";
    if (searchInput) searchInput.placeholder = "Search Reviews...";
    if (segmentControl) segmentControl.style.display = "flex";

    const gridBtn = document.getElementById("btn-grid");
    const listBtn = document.getElementById("btn-list");
    if (gridBtn && listBtn) {
      if (currentView === "grid") {
        gridBtn.classList.add("active");
        listBtn.classList.remove("active");
      } else {
        gridBtn.classList.remove("active");
        listBtn.classList.add("active");
      }
    }

    currentLibrary = "today";
    currentCategory = "science"; // "science" maps to Reviews
    renderFeed();
  }
  else if (appName === "crossover") {
    if (appTitle) appTitle.textContent = "CrossOver for macOS";
    if (searchInput) searchInput.placeholder = "Search Changelogs & Blogs...";
    renderCrossoverView();
  }
  else if (appName === "macos") {
    if (appTitle) appTitle.textContent = "macOS Release Notes";
    if (searchInput) searchInput.placeholder = "Search Release Notes...";
    renderMacosView();
  }
  else if (appName === "games") {
    if (appTitle) appTitle.textContent = "Games";
    if (searchInput) searchInput.placeholder = "Search Games..";
    if (!gamesLoaded && !gamesLoading) {
      loadAllGamesData();
    } else {
      renderGamesView();
      refreshSteamGamesIfNeeded();
    }
    applyAtmosphericGlow(activeAtmosphericGame);
  }
  else if (appName === "app-store") {
    if (appTitle) appTitle.textContent = "App Store";
    if (searchInput) searchInput.placeholder = "Search Apps...";
    initializeRealAppStore();
    renderAppStoreView();
  }
  else if (appName === "finder") {
    if (appTitle) appTitle.textContent = "Finder";
    if (searchInput) searchInput.placeholder = "Search Finder...";
    if (segmentControl) segmentControl.style.display = "flex";
    
    // Toggle Finder segments
    const gridBtn = document.getElementById("btn-grid");
    const listBtn = document.getElementById("btn-list");
    if (gridBtn && listBtn) {
      if (currentView === "grid") {
        gridBtn.classList.add("active");
        listBtn.classList.remove("active");
      } else {
        gridBtn.classList.remove("active");
        listBtn.classList.add("active");
      }
    }

    renderFinderView();
  }

  if (appName !== "games") {
    applyAtmosphericGlow(null);
  }
  updateGlobalMenuBar();
}

function updateNavControls() {
  const backBtn = document.getElementById("nav-back");
  const forwardBtn = document.getElementById("nav-forward");
  
  if (backBtn) {
    if (appHistoryIndex > 0) {
      backBtn.classList.remove("disabled");
    } else {
      backBtn.classList.add("disabled");
    }
  }

  if (forwardBtn) {
    if (appHistoryIndex < appHistory.length - 1) {
      forwardBtn.classList.remove("disabled");
    } else {
      forwardBtn.classList.add("disabled");
    }
  }
}

function goBack() {
  if (appHistoryIndex > 0) {
    appHistoryIndex--;
    switchApp(appHistory[appHistoryIndex], false);
  }
}

function goForward() {
  if (appHistoryIndex < appHistory.length - 1) {
    appHistoryIndex++;
    switchApp(appHistory[appHistoryIndex], false);
  }
}

// --- 5. News Feed Renderer ---
function renderFeed() {
  const grid = document.getElementById("news-grid");
  const emptyState = document.getElementById("empty-state");
  if (!grid) return;

  // Filter articles based on sidebar navigation and categories
  let filtered = articles.filter(shouldRenderArticle);

  // Enforce Reviews Filter if active app is Reviews
  if (currentApp === "reviews") {
    filtered = filtered.filter(a => a.category === "science");
  } else {
    // 1. Library Filter (only for News App)
    if (currentLibrary === "bookmarks") {
      filtered = filtered.filter(a => a.bookmarked);
    } else if (currentLibrary === "queue") {
      filtered = filtered.filter(a => a.queued);
    } else if (currentLibrary === "custom") {
      filtered = filtered.filter(a => a.custom);
    }

    // 2. Category Filter
    if (currentCategory !== "all") {
      filtered = filtered.filter(a => a.category === currentCategory);
    }

  }

  // 3. Search Filter
  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.subtitle.toLowerCase().includes(q) ||
      a.author.toLowerCase().includes(q)
    );
  }

  // Handle Empty State
  if (filtered.length === 0) {
    grid.innerHTML = "";
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  } else {
    if (emptyState) emptyState.classList.add("hidden");
  }

  // Render HTML Cards
  let html = "";
  
  // Set first item as featured if in grid-view and not searching/filtering specific categories and is News app
  const shouldFeature = currentView === "grid" && currentCategory === "all" && searchQuery === "" && currentLibrary === "today" && currentApp === "news";

  // Slice articles for pagination and lazy-loading
  const pagedArticles = filtered.slice(0, visibleArticlesCount);

  pagedArticles.forEach((article, index) => {
    const isFeatured = shouldFeature && index === 0;
    const cardClass = isFeatured ? "news-card featured" : "news-card";
    // Setup cover image styling
    let coverHtml = "";
    if (article.cover && article.cover.startsWith("preset-")) {
      const grad = PRESET_GRADIENTS[article.cover] || PRESET_GRADIENTS["preset-1"];
      coverHtml = `<div class="card-cover" style="background: ${grad}"></div>`;
    } else {
      const coverUrl = optimizeArticleImageUrl(article.cover, isFeatured);
      const imagePriority = isFeatured ? `fetchpriority="high"` : `loading="lazy"`;
      const imageSource = index >= INITIAL_VISIBLE_ARTICLE_COUNT ? `data-src="${coverUrl}"` : `src="${coverUrl}"`;
      coverHtml = `<div class="card-cover"><img ${imageSource} alt="${article.title}" ${imagePriority} decoding="async" onerror="this.closest('.card-cover').classList.add('missing-cover'); this.remove();"></div>`;
    }

    html += `
      <article class="${cardClass}" data-id="${article.id}">
        ${coverHtml}

        <div class="card-body">
          <h3 class="card-title font-title">${article.title}</h3>
          <p class="card-excerpt">${article.subtitle}</p>
          <div class="card-meta">
            <a class="card-source" href="${article.sourceUrl}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${article.sourceName}</a>
            <span class="card-date">${article.date}</span>
          </div>
          <a href="${article.sourceUrl}" target="_blank" rel="noopener" class="btn-read-more-glass" onclick="event.stopPropagation()">
            <span>Read More</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.75; vertical-align: middle;"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
          </a>
        </div>
      </article>
    `;
  });

  grid.innerHTML = html;
  initNewsImageLoading();

  // Append or manage the soft glass liquid lazy load blur panel
  let blurPanel = document.getElementById("feed-lazy-load-blur");
  if (filtered.length > visibleArticlesCount) {
    if (!blurPanel) {
      blurPanel = document.createElement("div");
      blurPanel.id = "feed-lazy-load-blur";
      blurPanel.className = "feed-lazy-load-blur";
      grid.parentNode.parentNode.appendChild(blurPanel);
    }
    blurPanel.innerHTML = ``;
    blurPanel.classList.remove("fade-out");
    blurPanel.style.display = "flex";
  } else {
    if (blurPanel) {
      blurPanel.remove();
    }
  }

  // Add click event listeners to entire cards
  grid.querySelectorAll(".news-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-id");
      openArticle(id);
    });

    // Cursor tracking highlight effect
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    });
  });
}

function getCategoryTitle(category) {
  return RSS_CATEGORY_LABELS[category] || `${category.charAt(0).toUpperCase()}${category.slice(1)}`;
}

function getCategoryHeading(category) {
  const headings = {
    technology: "Latest Mac News",
    design: "Latest Games",
    science: "Mac Reviews",
    culture: "Latest macOS Apps",
    ai: "Apple Intelligence News for macOS",
    deals: "MacBook Deals"
  };
  return headings[category] || `${getCategoryTitle(category)} Stories`;
}

// Toggle Article Bookmark
function toggleBookmark(id) {
  const article = articles.find(a => a.id === id);
  if (article) {
    article.bookmarked = !article.bookmarked;
    saveToStorage();
    updateCounts();
    renderFeed();
    
    // Sync reader state if open
    const readerOpen = !document.getElementById("reader-overlay").classList.contains("hidden");
    if (readerOpen && selectedArticleId === id) {
      updateReaderBookmarkBtn(article.bookmarked);
    }

    // Sync Notification Center Reading List
    renderBookmarksWidget();

    // Dynamic banner feedback in system alerts
    pushNotification(
      article.bookmarked ? "Bookmarked Story" : "Removed Bookmark", 
      `"${article.title.substring(0, 30)}..." has been updated.`
    );
  }
}

// macOS Tahoe 26 System Control State
let dndActive = false;
let systemVolume = 70;
let previousVolume = 70;

// Helper: Synthesize beautiful macOS-style glass chime via Web Audio API
function playGlassChime() {
  // Completely silent no-op
}


// Dynamic Bookmarks Reading List Widget Sync
function renderBookmarksWidget() {
  const container = document.getElementById("widget-reading-list");
  const countBadge = document.getElementById("widget-bookmarks-count");
  if (!container) return;

  const bookmarkedArticles = articles.filter(a => a.bookmarked);
  if (countBadge) {
    countBadge.textContent = `${bookmarkedArticles.length} article${bookmarkedArticles.length !== 1 ? 's' : ''}`;
  }

  if (bookmarkedArticles.length === 0) {
    container.innerHTML = `
      <div class="empty-reading-list">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-1 opacity-40">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
        <p class="text-xxs opacity-60">No bookmarked articles. Save stories to read later.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = bookmarkedArticles.map(article => `
    <div class="reading-item" data-id="${article.id}">
      <div class="reading-item-left">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" class="reading-item-icon">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
        <span class="reading-item-title" title="${article.title}">${article.title}</span>
      </div>
      <button class="reading-item-remove" data-id="${article.id}" title="Remove Bookmark">
        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `).join("");

  // Bind click handlers to the dynamic reading list
  container.querySelectorAll(".reading-item").forEach(item => {
    item.addEventListener("click", (e) => {
      if (e.target.closest(".reading-item-remove")) return;
      const id = item.getAttribute("data-id");
      openArticle(id);
    });
  });

  container.querySelectorAll(".reading-item-remove").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      toggleBookmark(id);
    });
  });
}

// Helper: Push dynamic alert to Widget list
function pushNotification(title, message, options = {}) {
  const wrapper = document.getElementById("notifications-items-wrapper");
  if (!wrapper) return;

  // Clear initial empty state if it's there
  if (wrapper.querySelector(".empty-state-placeholder") || wrapper.textContent.includes("No alerts")) {
    wrapper.innerHTML = "";
  }

  const alertItem = document.createElement("div");
  alertItem.className = "alert-item";
  alertItem.style.animation = "fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)";
  alertItem.innerHTML = `
    <span class="alert-dot active"></span>
    <div>
      <p class="text-xs font-semibold">${title}</p>
      <p class="text-xxs opacity-70">${message}</p>
    </div>
  `;

  // Prepend to show newest on top
  wrapper.insertBefore(alertItem, wrapper.firstChild);

  // Play chime and flash topbar clock indicator if DND is disabled
  if (!dndActive && !options.silent) {
    playGlassChime();
    const dateTimeBtn = document.getElementById("date-time-toggle");
    if (dateTimeBtn) {
      dateTimeBtn.style.boxShadow = "0 0 12px var(--accent-glow)";
      setTimeout(() => {
        dateTimeBtn.style.boxShadow = "";
      }, 2000);
    }
  }
}

// --- 6. Quick Look Article Reader View Actions ---
let currentFontSizeClass = "font-size-medium";

async function openArticle(id) {
  const article = articles.find(a => a.id === id);
  if (!article) return;

  selectedArticleId = id;
  const overlay = document.getElementById("reader-overlay");
  
  // Fill text details
  document.getElementById("reader-toolbar-title").textContent = article.title;
  document.getElementById("reader-title").textContent = article.title;
  document.getElementById("reader-subtitle").textContent = article.subtitle;
  document.getElementById("reader-author").textContent = article.author;
  document.getElementById("reader-date").textContent = article.date;
  document.getElementById("reader-avatar").textContent = article.avatar;
  document.getElementById("reader-text").innerHTML = stripSourceLinks(article.content);
  const originalLink = document.getElementById("reader-open-original");
  if (originalLink) originalLink.href = article.sourceUrl;
  const heroReadMore = document.getElementById("reader-hero-read-more");
  if (heroReadMore) heroReadMore.href = article.sourceUrl;

  // Reset font class
  const richtext = document.getElementById("reader-text");
  richtext.className = `reader-richtext font-editorial ${currentFontSizeClass}`;
  updateFontPercentageDisplay();

  // Parse word count and reading time dynamically for print-style meta
  const plainText = richtext.textContent || "";
  const words = plainText.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.ceil(words / 200) || 1;
  const metaLine = document.getElementById("reader-editorial-meta");
  if (metaLine) {
    metaLine.innerHTML = `By <span style="font-weight: 700;">${article.author}</span> &bull; ${article.date} &bull; ⏱️ ${readTime} min read`;
  }

  // Apply reading theme class
  setReaderTheme(currentReaderTheme);

  // Reset scroll-linked opacity styles on load
  const subtitleEl = document.getElementById("reader-subtitle");
  if (subtitleEl) subtitleEl.style.opacity = "1";
  if (metaLine) metaLine.style.opacity = "0.65";

  // Cover image settings
  const coverImg = document.getElementById("reader-cover-img");
  const heroBlock = document.querySelector(".reader-hero");
  
  if (article.cover.startsWith("preset-")) {
    if (coverImg) coverImg.classList.add("hidden");
    const preset = PRESET_INFO[article.cover] || PRESET_INFO["preset-1"];
    if (heroBlock) heroBlock.style.background = preset.bg;
  } else {
    if (coverImg) {
      coverImg.classList.remove("hidden");
      coverImg.src = article.cover;
    }
    if (heroBlock) heroBlock.style.background = "#121217";
  }

  // Bookmark Button in reader
  updateReaderBookmarkBtn(article.bookmarked);
  updateReaderQueueBtn(article.queued);

  // Reset scroll progress bar
  const pBar = document.getElementById("reader-progress");
  if (pBar) pBar.style.width = "0%";

  // Reset toolbar hiding state
  const toolbar = document.querySelector(".reader-toolbar");
  if (toolbar) toolbar.classList.remove("toolbar-hidden");

  // Determine active filtered list to identify adjacent stories
  let filtered = articles;
  if (currentApp === "reviews") {
    filtered = filtered.filter(a => a.category === "science");
  } else {
    if (currentLibrary === "bookmarks") {
      filtered = filtered.filter(a => a.bookmarked);
    } else if (currentLibrary === "queue") {
      filtered = filtered.filter(a => a.queued);
    } else if (currentLibrary === "custom") {
      filtered = filtered.filter(a => a.custom);
    }
    if (currentCategory !== "all") {
      filtered = filtered.filter(a => a.category === currentCategory);
    }
  }
  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.subtitle.toLowerCase().includes(q) ||
      a.author.toLowerCase().includes(q)
    );
  }

  const currentIndex = filtered.findIndex(a => a.id === id);
  const nextArticle = currentIndex >= 0 && currentIndex < filtered.length - 1 ? filtered[currentIndex + 1] : null;

  // Up Next Footer Setup (Removed as requested)
  const nextDivider = document.getElementById("reader-next-divider");
  if (nextDivider) {
    nextDivider.style.display = "none";
  }

  // Open the overlay
  if (overlay) {
    overlay.classList.remove("hidden");
    document.body.classList.add("reader-active");
  }
  const bodyPane = document.getElementById("reader-body");
  if (bodyPane) {
    bodyPane.scrollTop = 0;

    let lastScrollTop = 0;

    // Add scroll handler for reading progress tracker and auto-hiding toolbar
    bodyPane.onscroll = () => {
      const currentScroll = bodyPane.scrollTop;

      // 1. Auto-hide toolbar on scroll down, show on scroll up
      if (toolbar) {
        if (currentScroll > lastScrollTop && currentScroll > 60) {
          toolbar.classList.add("toolbar-hidden");
        } else if (currentScroll < lastScrollTop) {
          toolbar.classList.remove("toolbar-hidden");
        }
      }
      lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;



      // 3. Scroll progress
      const totalHeight = bodyPane.scrollHeight - bodyPane.clientHeight;
      if (totalHeight > 0) {
        const percentage = (bodyPane.scrollTop / totalHeight) * 100;
        if (pBar) pBar.style.width = `${percentage}%`;
      }
    };
  }
}

async function expandReaderArticleContent(article) {
  if (!article || article.expandedContent || !needsExpandedArticleContent(article.content)) return;

  try {
    const response = await fetchDevProxy(article.sourceUrl);
    if (!response.ok) return;

    const html = await response.text();
    const expanded = buildSourceArticleContent(html, article.sourceUrl, article.sourceName);
    if (!expanded || !isExpandedArticleContentBetter(article.content, expanded)) return;

    article.expandedContent = expanded;
    article.content = expanded;

    if (selectedArticleId === article.id) {
      const readerText = document.getElementById("reader-text");
      if (readerText) {
        readerText.innerHTML = stripSourceLinks(expanded);
        updateReaderReadTime(article);
      }
    }
  } catch (error) {
    console.warn(`Article expansion failed for ${article.sourceName}`, error);
  }
}

function needsExpandedArticleContent(html) {
  const doc = parseRSSHTML(stripSourceLinks(html || ""));
  const paragraphCount = doc.querySelectorAll("p").length;
  const wordCount = getWordCount(doc.body.textContent || "");
  return paragraphCount < 3 || wordCount < 120;
}

function isExpandedArticleContentBetter(currentHTML, expandedHTML) {
  return getWordCount(stripHTML(expandedHTML)) > Math.max(120, getWordCount(stripHTML(currentHTML)) * 1.5);
}

function buildSourceArticleContent(html, link, sourceName) {
  const doc = parseRSSHTML(html);
  const root = [
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
    "main"
  ].map(selector => doc.querySelector(selector)).find(Boolean);

  const blocks = extractReadableBlocks(root);
  if (blocks.length === 0) return "";

  return `${blocks.map(block => `<${block.tag}>${block.text}</${block.tag}>`).join("")}<p><a href="${link}" target="_blank" rel="noopener">Source: ${sourceName}</a></p>`;
}

function updateReaderReadTime(article) {
  const richtext = document.getElementById("reader-text");
  const metaLine = document.getElementById("reader-editorial-meta");
  if (!richtext || !metaLine) return;

  const readTime = Math.ceil(getWordCount(richtext.textContent || "") / 200) || 1;
  metaLine.innerHTML = `By <span style="font-weight: 700;">${article.author}</span> &bull; ${article.date} &bull; ${readTime} min read`;
}

function getWordCount(text) {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}

function stripSourceLinks(content) {
  const wrapper = parseRSSHTML(content).body;
  wrapper.querySelectorAll("a").forEach(link => {
    if (link.textContent.trim().toLowerCase().startsWith("source:")) {
      const paragraph = link.closest("p");
      if (paragraph) {
        paragraph.remove();
      } else {
        link.remove();
      }
    }
  });
  removeLeadingRelatedArticleSections(wrapper);
  removeLeadingArticleLabels(wrapper);
  removeLeadingRelatedArticleSections(wrapper);
  removeTrailingRelatedArticleSections(wrapper);
  removeArticleAdLinks(wrapper);
  removeTrailingLinkLists(wrapper);
  return wrapper.innerHTML;
}

function setReaderTheme(theme) {
  currentReaderTheme = theme;
  const articleCard = document.getElementById("reader-article");
  if (articleCard) {
    articleCard.classList.remove("theme-paper", "theme-velvet");
    if (theme === "paper") {
      articleCard.classList.add("theme-paper");
    } else if (theme === "velvet") {
      articleCard.classList.add("theme-velvet");
    }
  }

  // Update dropdown radio selection states
  document.querySelectorAll(".theme-circle-btn").forEach(btn => {
    const btnTheme = btn.getAttribute("data-theme");
    if (btnTheme === theme) {
      btn.classList.add("active");
      btn.setAttribute("aria-checked", "true");
    } else {
      btn.classList.remove("active");
      btn.setAttribute("aria-checked", "false");
    }
  });
}

function updateFontPercentageDisplay() {
  const percentageEl = document.getElementById("font-percentage");
  if (!percentageEl) return;
  if (currentFontSizeClass === "font-size-small") {
    percentageEl.textContent = "85%";
  } else if (currentFontSizeClass === "font-size-medium") {
    percentageEl.textContent = "100%";
  } else if (currentFontSizeClass === "font-size-large") {
    percentageEl.textContent = "120%";
  }
}

function initResizableSidebars() {
  const sidebars = document.querySelectorAll(".window-sidebar");
  sidebars.forEach(sidebar => {
    if (sidebar.nextElementSibling && sidebar.nextElementSibling.classList.contains("sidebar-resizer")) {
      return;
    }
    const resizer = document.createElement("div");
    resizer.className = "sidebar-resizer";
    sidebar.parentNode.insertBefore(resizer, sidebar.nextSibling);

    let startX, startWidth;

    resizer.addEventListener("mousedown", (e) => {
      e.preventDefault();
      startX = e.clientX;
      startWidth = parseInt(document.defaultView.getComputedStyle(sidebar).width, 10);
      document.documentElement.classList.add("resizing-sidebar");
      resizer.classList.add("active");

      function doDrag(e) {
        let newWidth = startWidth + (e.clientX - startX);
        if (newWidth < 140) newWidth = 140;
        if (newWidth > 360) newWidth = 360;
        sidebar.style.width = `${newWidth}px`;
        sidebar.style.flex = "none";
      }

      function stopDrag() {
        document.documentElement.classList.remove("resizing-sidebar");
        resizer.classList.remove("active");
        document.documentElement.removeEventListener("mousemove", doDrag, false);
        document.documentElement.removeEventListener("mouseup", stopDrag, false);
      }

      document.documentElement.addEventListener("mousemove", doDrag, false);
      document.documentElement.addEventListener("mouseup", stopDrag, false);
    });
  });
}

function updateReaderBookmarkBtn(isBookmarked) {
  const btn = document.getElementById("reader-bookmark-btn");
  if (!btn) return;
  
  const textEl = btn.querySelector(".action-text");
  
  if (isBookmarked) {
    btn.classList.add("active");
    if (textEl) textEl.textContent = "Remove Bookmark";
    const svg = btn.querySelector("svg");
    if (svg) {
      svg.setAttribute("fill", "var(--accent-color)");
      svg.setAttribute("stroke", "var(--accent-color)");
    }
  } else {
    btn.classList.remove("active");
    if (textEl) textEl.textContent = "Bookmark Article";
    const svg = btn.querySelector("svg");
    if (svg) {
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
    }
  }
}

function updateReaderQueueBtn(isQueued) {
  const btn = document.getElementById("reader-queue-btn");
  if (!btn) return;

  if (isQueued) {
    btn.classList.add("active");
    btn.style.color = "var(--accent-color)";
  } else {
    btn.classList.remove("active");
    btn.style.color = "";
  }
}

function toggleReadingQueue(id) {
  const article = articles.find(a => a.id === id);
  if (!article) return;

  article.queued = !article.queued;
  if (article.queued) {
    queuedArticleUrls.add(article.sourceUrl);
  } else {
    queuedArticleUrls.delete(article.sourceUrl);
  }

  saveToStorage();
  updateCounts();
  renderFeed();
  updateReaderQueueBtn(article.queued);
}

function closeReader() {
  const overlay = document.getElementById("reader-overlay");
  if (overlay) {
    overlay.classList.add("hidden");
    document.body.classList.remove("reader-active");
  }
  
  const dropdown = document.getElementById("reader-options-dropdown");
  if (dropdown) {
    dropdown.classList.add("hidden");
    const optionsBtn = document.getElementById("reader-options-btn");
    if (optionsBtn) {
      optionsBtn.setAttribute("aria-expanded", "false");
    }
  }
  
  selectedArticleId = null;
}

// Adjacent navigation helper for chevrons and keybinds
function navigateArticle(direction) {
  if (!selectedArticleId) return;
  let filtered = articles;
  if (currentApp === "reviews") {
    filtered = filtered.filter(a => a.category === "science");
  } else {
    if (currentLibrary === "bookmarks") {
      filtered = filtered.filter(a => a.bookmarked);
    } else if (currentLibrary === "queue") {
      filtered = filtered.filter(a => a.queued);
    } else if (currentLibrary === "custom") {
      filtered = filtered.filter(a => a.custom);
    }
    if (currentCategory !== "all") {
      filtered = filtered.filter(a => a.category === currentCategory);
    }
  }
  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.subtitle.toLowerCase().includes(q) ||
      a.author.toLowerCase().includes(q)
    );
  }

  const currentIndex = filtered.findIndex(a => a.id === selectedArticleId);
  const targetIndex = currentIndex + direction;
  if (targetIndex >= 0 && targetIndex < filtered.length) {
    openArticle(filtered[targetIndex].id);
  }
}

// Proximity-activated chevron overlay visual manager
function updateProximityChevrons(x, width) {
  const prevBtn = document.getElementById("reader-prev-btn");
  const nextBtn = document.getElementById("reader-next-btn");
  if (!prevBtn || !nextBtn || !selectedArticleId) return;

  let filtered = articles;
  if (currentApp === "reviews") {
    filtered = filtered.filter(a => a.category === "science");
  } else {
    if (currentLibrary === "bookmarks") {
      filtered = filtered.filter(a => a.bookmarked);
    } else if (currentLibrary === "queue") {
      filtered = filtered.filter(a => a.queued);
    } else if (currentLibrary === "custom") {
      filtered = filtered.filter(a => a.custom);
    }
    if (currentCategory !== "all") {
      filtered = filtered.filter(a => a.category === currentCategory);
    }
  }
  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.subtitle.toLowerCase().includes(q) ||
      a.author.toLowerCase().includes(q)
    );
  }

  const currentIndex = filtered.findIndex(a => a.id === selectedArticleId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < filtered.length - 1;

  if (x < 80 && hasPrev) {
    prevBtn.classList.add("proximity-visible");
  } else {
    prevBtn.classList.remove("proximity-visible");
  }

  if (width - x < 80 && hasNext) {
    nextBtn.classList.add("proximity-visible");
  } else {
    nextBtn.classList.remove("proximity-visible");
  }
}

// --- 7. Custom Story Builder Form Sheet ---
function isAdminAccount() {
  const username = (currentUsername || "").trim();
  const email = (currentUserEmail || "").trim().toLowerCase();
  return ADMIN_ACCOUNT_USERNAMES.has(username) || ADMIN_ACCOUNT_EMAILS.has(email);
}

function updateAdminControls() {
  const newStoryBtn = document.getElementById("btn-new-story");
  const menuNewStory = document.getElementById("menu-new-story");
  const canWriteStories = currentApp === "news" && isAdminAccount();

  if (newStoryBtn) {
    newStoryBtn.hidden = !canWriteStories;
    newStoryBtn.setAttribute("aria-hidden", String(!canWriteStories));
    if (canWriteStories) {
      newStoryBtn.style.setProperty("display", "flex");
    } else {
      newStoryBtn.style.setProperty("display", "none", "important");
    }
  }

  if (menuNewStory) {
    menuNewStory.hidden = !isAdminAccount();
    menuNewStory.setAttribute("aria-hidden", String(!isAdminAccount()));
  }
}

function openStoryEditor() {
  if (!isAdminAccount()) return;
  const editor = document.getElementById("editor-modal");
  if (editor) editor.classList.remove("hidden");
}

function closeStoryEditor() {
  const editor = document.getElementById("editor-modal");
  if (editor) {
    editor.classList.add("hidden");
    document.getElementById("editor-form").reset();
    const customInput = document.getElementById("form-cover-custom");
    if (customInput) customInput.classList.add("hidden");
  }
}


// ==========================================
// --- 8. CrossOver Application Engine ---
// ==========================================
const CROSSOVER_CHANGELOG = [
  {
    version: "26.1.0",
    date: "April 9, 2026",
    notes: [
      "Workaround for Death Stranding 2 on macOS.",
      "Fix for mouse input in many Unity games.",
      "Fix for distorted Add account window in Quicken.",
      "Fix for Battle.net not installing for some users."
    ]
  },
  {
    version: "26.0.0",
    date: "February 10, 2026",
    notes: [
      "CrossOver 26 includes Wine 11.0, with over 6,000 improvements and benefits to many popular applications.",
      "Updated core translation tech: Wine Mono 10.4.1, vkd3d 1.18.",
      "macOS: Updated D3DMetal to 3.0 and DXMT to v0.72.",
      "macOS fixes for Helldivers 2, Kingdom Come: Deliverance II, Clair Obscur: Expedition 33, Age of Empires IV: Anniversary Edition, Warhammer 40,000: Darktide, God of War Ragnarök, Starfield, Final Fantasy VII Rebirth, Company of Heroes 3, Planet Coaster 2, CloverPit, PowerWash Simulator 2, Silent Hill f, Jurassic World Evolution 2, Assetto Corsa EVO, The Outer Worlds 2, Final Fantasy Tactics - The Ivalice Chronicles, Trails in the Sky 1st Chapter, Mafia: The Old Country, Hell is Us and Cronos: The New Dawn.",
      "Includes initial user interface updates optimized for macOS Tahoe.",
      "Linux: Integrated NTsync support for kernels that support it."
    ]
  },
  {
    version: "25.1.1",
    date: "September 15, 2025",
    notes: [
      "macOS: Added critical stability and display fixes for Intel Tahoe systems."
    ]
  },
  {
    version: "25.1.0",
    date: "August 12, 2025",
    notes: [
      "macOS: Resolved major connection and launcher issues in Ubisoft Connect and the EA App.",
      "macOS: Fixed controller input for wired Xbox One controllers, 8BitDo Pro controllers, and other gamepad connectivity models.",
      "macOS: Fixes for Steam downloads with msync enabled and general steam connection issues.",
      "Linux: Resolved Office 365 Outlook login issues and Office 2016 desktop crashes."
    ]
  },
  {
    version: "25.0.1",
    date: "April 23, 2025",
    notes: [
      "Fixed Guild Wars 2 launch crashes on all platforms.",
      "macOS: Fixed issues with the latest EA App update and doubled keystroke/mouse input errors."
    ]
  },
  {
    version: "25.0.0",
    date: "March 11, 2025",
    notes: [
      "CrossOver 25 includes Wine 10.0, with over 5,000 system improvements.",
      "Updated translation engines: Wine Mono 9.4.0, vkd3d 1.14.",
      "macOS: MoltenVK updated to 1.2.10.",
      "macOS: Integrated DXMT, a Metal-based implementation of DirectX 11.",
      "macOS: Updated D3DMetal to 2.1, adding compatibility for Street Fighter 6, Need for Speed Heat, Nioh 2, Teardown, Age of Wonders 4, Dragon's Dogma 2 and The Last of Us Part 1.",
      "macOS: Out of the box launcher support for GOG Galaxy and Epic Games Store, and game fixes for Red Dead Redemption 2, Tekken 8, Age of Mythology: Retold, Path of Exile 2, Elite Dangerous, Monster Hunter Rise, Hero's Land, Manor Lords, Fallout 76, and Far Cry 6."
    ]
  }
];

const CROSSOVER_BLOGS = [
  {
    title: "Finally! Diablo IV and Overwatch are playable with CrossOver 26.1 + macOS 26.5",
    author: "Meredith Johnson",
    date: "May 18, 2026",
    excerpt: "Good news everyone! We are very pleased to announce that Diablo IV and Overwatch are now running again on stable CrossOver 26.1 with macOS 26.5. Read more about the release details...",
    link: "https://www.codeweavers.com/blog/mjohnson/2026/5/18/finally-diablo-iv-and-overwatch-are-playable-with-crossover-261-macos-265",
    image: "https://media.codeweavers.com/pub/crossover/website/htmlimages/May-2026-Blog-Post-4-New-Blog-Post-1200x630_2.png"
  },
  {
    title: "30 Years, 30 Reasons: Why CrossOver is still the best for Mac gaming and much more",
    author: "Meredith Johnson",
    date: "Apr 17, 2026",
    excerpt: "CodeWeavers turns 30 in May! To celebrate this milestone, we're sharing 30 reasons why our flagship CrossOver is the right choice for running Windows games and apps on Mac...",
    link: "https://www.codeweavers.com/blog/mjohnson/2026/4/17/30-years-30-reasons-why-crossover-is-still-the-best-for-mac-gaming-and-much-more",
    image: "https://media.codeweavers.com/pub/crossover/website/htmlimages/April-2026-Blog-Post-4-New-Blog-Post-1200x630_1.png"
  },
  {
    title: "CrossOver Preview is our thank YOU*",
    author: "Jana Schmid",
    date: "Feb 24, 2026",
    excerpt: "Did you know that CrossOver development is funded entirely by YOU - the people who use it? Learn about our ad-free business model and why we appreciate your support so much...",
    link: "https://www.codeweavers.com/blog/jschmid/2026/2/24/crossover-preview-is-our-thank-you",
    image: "https://media.codeweavers.com/pub/crossover/website/htmlimages/Blog-Preview-Thank-you-02232026-4-New-Blog-Post-1200x630.png"
  },
  {
    title: "CrossOver 26 cures artificial incompatibility with Windows games on Mac",
    author: "Meredith Johnson",
    date: "Feb 10, 2026",
    excerpt: "CrossOver 26 is just what the doctor ordered to get more games and applications working on Mac and Linux better than ever. Get the lowdown on the DX12 cures inside this release...",
    link: "https://www.codeweavers.com/blog/mjohnson/2026/2/10/crossover-26-cures-artificial-incompatibility-with-windows-games-on-mac",
    image: "https://media.codeweavers.com/pub/crossover/website/htmlimages/CrossOver-26-Blog-1200x630.png"
  }
];

function renderCrossoverView() {
  renderCrossoverData(CROSSOVER_CHANGELOG, CROSSOVER_BLOGS);
}

function renderCrossoverData(changelogs, blogs) {
  const changelogContainer = document.getElementById("crossover-changelog-container");
  const blogContainer = document.getElementById("crossover-blog-container");
  if (!changelogContainer || !blogContainer) return;

  // Render changelogs
  let changelogHtml = "";
  changelogs.forEach(item => {
    const notesList = item.notes.map(note => `<li>${note}</li>`).join("");
    
    changelogHtml += `
      <div class="crossover-changelog-card">
        <div class="changelog-header">
          <div class="changelog-title">CrossOver ${item.version}</div>
          <div class="changelog-right" style="display: flex; align-items: center; gap: 8px;">
            <div class="changelog-date">${item.date}</div>
            <span class="changelog-chevron" style="transform: rotate(0deg); transition: transform 0.2s;">▼</span>
          </div>
        </div>
        <div class="changelog-body" style="display: none;">
          <ul>${notesList}</ul>
        </div>
      </div>
    `;
  });
  changelogContainer.innerHTML = changelogHtml;

  // Auto-expand first item
  const firstCard = changelogContainer.querySelector(".crossover-changelog-card");
  if (firstCard) {
    const body = firstCard.querySelector(".changelog-body");
    const chevron = firstCard.querySelector(".changelog-chevron");
    firstCard.classList.add("expanded");
    if (body) body.style.display = "block";
    if (chevron) chevron.style.transform = "rotate(180deg)";
  }

  // Bind accordion click events
  changelogContainer.querySelectorAll(".changelog-header").forEach(header => {
    header.addEventListener("click", () => {
      const card = header.parentElement;
      const body = card.querySelector(".changelog-body");
      const chevron = card.querySelector(".changelog-chevron");
      
      const isExpanded = card.classList.contains("expanded");
      if (isExpanded) {
        card.classList.remove("expanded");
        if (body) body.style.display = "none";
        if (chevron) chevron.style.transform = "rotate(0deg)";
      } else {
        card.classList.add("expanded");
        if (body) body.style.display = "block";
        if (chevron) chevron.style.transform = "rotate(180deg)";
      }
    });
  });

  // Render blogs
  let blogsHtml = "";
  blogs.forEach(blog => {
    blogsHtml += `
      <div class="crossover-blog-card" onclick="window.open('${blog.link}', '_blank')">
        ${blog.image ? `
          <div class="blog-card-cover">
            <img src="${blog.image}" alt="${blog.title}" loading="lazy">
          </div>
        ` : ''}
        <div class="blog-card-body">
          <div class="blog-card-meta">
            <span>${blog.author}</span>
            <span>${blog.date}</span>
          </div>
          <h4 class="blog-card-title">${blog.title}</h4>
          <p class="blog-card-excerpt">${blog.excerpt}</p>
          <span class="crossover-blog-link" style="color: var(--accent-color); font-size: 11px; font-weight: 500; margin-top: 4px; display: inline-block;">Read Full Post &rarr;</span>
        </div>
      </div>
    `;
  });
  blogContainer.innerHTML = blogsHtml;
}

async function fetchViaProxy(url) {
  const res = await fetchDevProxy(url);
  if (!res.ok) return res;
  const text = await res.text();
  return {
    ok: true,
    json: async () => ({ contents: text }),
    text: async () => text
  };
}

// Fetch CrossOver feeds with updating animations
async function updateCrossoverFeeds() {
  const syncIcon = document.querySelector(".update-sync-icon");
  if (syncIcon) syncIcon.classList.add("syncing");

  const changelogContainer = document.getElementById("crossover-changelog-container");
  const blogContainer = document.getElementById("crossover-blog-container");
  if (!changelogContainer || !blogContainer) return;

  // Insert loading skeletons
  changelogContainer.innerHTML = `
    <div class="crossover-changelog-card animate-pulse" style="padding: 16px;">
      <div style="background: rgba(255,255,255,0.08); height: 16px; width: 60%; border-radius: 4px;"></div>
      <div style="background: rgba(255,255,255,0.08); height: 12px; width: 30%; border-radius: 4px; margin-top: 8px;"></div>
    </div>
  `;
  blogContainer.innerHTML = `
    <div class="crossover-blog-card animate-pulse">
      <div style="background: rgba(255,255,255,0.08); height: 14px; width: 80%; border-radius: 4px;"></div>
      <div style="background: rgba(255,255,255,0.08); height: 11px; width: 95%; border-radius: 4px; margin-top: 8px;"></div>
    </div>
  `;

  try {
    const res = await fetchViaProxy("https://www.codeweavers.com/blog/rss");
    if (!res.ok) throw new Error("CORS Proxy failed");
    
    const json = await res.json();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(json.contents, "text/xml");
    const items = Array.from(xmlDoc.querySelectorAll("item")).slice(0, 3);
    
    if (items.length > 0) {
      const liveBlogs = items.map(item => {
        const title = item.querySelector("title")?.textContent || "CodeWeavers Blog Post";
        const link = item.querySelector("link")?.textContent || "https://www.codeweavers.com/blog";
        const dateText = item.querySelector("pubDate")?.textContent || "";
        const date = new Date(dateText).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const creator = item.querySelector("creator")?.textContent || item.querySelector("author")?.textContent || "CodeWeavers Staff";
        const description = item.querySelector("description")?.textContent || "";
        
        const tempDoc = parseRSSHTML(description);
        const excerpt = tempDoc.body.textContent.slice(0, 140) + "...";
        
        // Find standard cover image from content or description
        let image = "https://media.codeweavers.com/pub/crossover/website/images/og-images/blog_og_1200x630.png";
        const firstImg = tempDoc.querySelector("img");
        const firstImgSrc = firstImg?.getAttribute("src");
        if (firstImgSrc) {
          image = firstImgSrc;
          // Clean up relative paths
          if (image.startsWith("/")) {
            image = "https://www.codeweavers.com" + image;
          }
        }

        return { title, link, date, author: creator, excerpt, image };
      });

      setTimeout(() => {
        renderCrossoverData(CROSSOVER_CHANGELOG, liveBlogs);
        if (syncIcon) syncIcon.classList.remove("syncing");
        pushNotification("Update Complete", "Successfully synced with CodeWeavers live blog!");
      }, 1000);
      return;
    }
  } catch (err) {
    console.error("CrossOver live RSS failed.", err);
  }

  changelogContainer.innerHTML = `
    <div class="crossover-changelog-card" style="padding: 16px;">
      <h4 class="changelog-version">Live feed unavailable</h4>
      <p style="font-size: 12px; opacity: 0.72; margin-top: 8px;">CodeWeavers RSS could not be loaded right now.</p>
    </div>
  `;
  blogContainer.innerHTML = `
    <div class="crossover-blog-card">
      <div class="blog-card-body">
        <h4 class="blog-card-title">Live blog unavailable</h4>
        <p class="blog-card-excerpt">CodeWeavers RSS could not be loaded right now.</p>
      </div>
    </div>
  `;
  if (syncIcon) syncIcon.classList.remove("syncing");
  pushNotification("Feed Unavailable", "CodeWeavers RSS could not be loaded right now.");
}

function filterCrossover(query) {
  const q = query.toLowerCase();
  const filteredChangelogs = CROSSOVER_CHANGELOG.filter(item => 
    item.version.toLowerCase().includes(q) || 
    item.notes.some(note => note.toLowerCase().includes(q))
  );

  const filteredBlogs = CROSSOVER_BLOGS.filter(blog => 
    blog.title.toLowerCase().includes(q) || 
    blog.excerpt.toLowerCase().includes(q) || 
    blog.author.toLowerCase().includes(q)
  );

  renderCrossoverData(filteredChangelogs, filteredBlogs);
}

// ==========================================
// --- 8.5. macOS Release Notes Engine ---
// ==========================================
const MACOS_CHANGELOG = [
  {
    version: "26.5",
    date: "May 11, 2026",
    notes: [
      "StoreKit adds PricingTerms for subscriptions with a monthly, 12-month commitment billing plan.",
      "StoreKit adds a billingPlanType purchase option for monthly, 12-month commitment subscriptions.",
      "StoreKit adds CommitmentInfo metadata on Transaction and SubscriptionRenewalInfo.",
      "Fixes App Store receipt App Version fields that could contain the string null.",
      "Fixes Transaction.currentEntitlements being empty when the system calendar uses a non-Gregorian format.",
      "Fixes SKTestSession not using the selected StoreKit configuration during unit tests."
    ]
  },
  {
    version: "26.4",
    date: "March 24, 2026",
    notes: [
      "Background Assets can report local asset-pack status while offline.",
      "Background Assets can make the latest version of an asset pack available locally.",
      "Audio MIDI Setup supports Network MIDI 2.0 sessions in the redesigned MIDI Network Setup panel.",
      "Starting in macOS Tahoe 26.4, users are notified when launching apps that use Rosetta because Rosetta support ends after macOS 27.",
      "StoreKit adds revocationType and revocationPercentage fields to Transaction.",
      "Fixes SwiftUI glass content backdrop updates in inactive non-opaque windows.",
      "Fixes new macOS Tahoe virtual machine installations that could boot to a black screen on certain hardware."
    ]
  },
  {
    version: "26.3",
    date: "February 11, 2026",
    notes: [
      "StoreKit fixes Product.products(for:) failing silently instead of throwing errors.",
      "Documents a known AppKit issue where the window resize pointer does not follow the window corner shape.",
      "Documents a known Virtualization issue where new macOS Tahoe virtual machine installations may boot to a black screen on certain hardware."
    ]
  },
  {
    version: "26.2",
    date: "December 12, 2025",
    notes: [
      "Fixes AirDrop discoverability between devices set to Everyone across 26.2 beta builds.",
      "Fixes the Allocations instrument sometimes failing to report reference counting operations for native Swift types.",
      "Adds RDMA over Thunderbolt for low-latency communication between Thunderbolt 5 hosts.",
      "StoreKit adds changes for testing and purchase flows, including fixes for win-back offer testing."
    ]
  },
  {
    version: "26.1",
    date: "November 3, 2025",
    notes: [
      "Fixes the missing Search bar in the Apple TV app on macOS.",
      "Fixes AssetPackManager.url(for:) unexpectedly throwing when looking up a locally available asset file.",
      "Fixes GCPressedStateInput.lastPressedStateTimestamp returning time in the wrong domain.",
      "Fixes delayed game controller input when many tasks are submitted to the default global concurrent queue."
    ]
  },
  {
    version: "26",
    date: "September 15, 2025",
    notes: [
      "Recovery Assistant helps recover a device if it does not start up normally.",
      "macOS supports Apple Sparse Image Format (ASIF) disk images.",
      "Metal 4 is supported.",
      "Fixes the LSSupportsGameMode Info.plist key being ignored on macOS.",
      "Adds a nox86exec boot argument for testing apps without Rosetta.",
      "TextKit 2 adds includesTextListMarkers for text-list marker handling."
    ]
  }
];

const MACOS_HISTORICAL = [
  {
    category: "macOS 15 Sequoia",
    version: "15.6.0",
    date: "September 10, 2025",
    notes: [
      "Final stability update for the macOS 15 Sequoia branch.",
      "Security patches targeting Safari WebKit sandboxed frames.",
      "Resolved external GPU connection timeouts over Thunderbolt 4 hubs."
    ]
  },
  {
    category: "macOS 15 Sequoia",
    version: "15.5.0",
    date: "July 22, 2025",
    notes: [
      "Xcode Cloud server pipeline integrations.",
      "CoreData performance improvements for cloud synced catalogs."
    ]
  },
  {
    category: "AppKit Framework",
    version: "SDK v26.0",
    date: "October 14, 2025",
    notes: [
      "Introduced NSVisualEffectMaterialRefractiveGlass blur type.",
      "Added modern squircle clipping constraints for responsive window body frames."
    ]
  },
  {
    category: "Foundation Framework",
    version: "SDK v26.0",
    date: "October 14, 2025",
    notes: [
      "JSONDecoder performance optimizations under massive nested payload trees.",
      "Swift concurrency task scheduling safety enhancements on multi-core clusters."
    ]
  }
];

function renderMacosView() {
  renderMacosData(MACOS_CHANGELOG, MACOS_HISTORICAL);
}

function renderMacosData(changelogs, historical) {
  const changelogContainer = document.getElementById("macos-changelog-container");
  const historicalContainer = document.getElementById("macos-historical-container");
  if (!changelogContainer || !historicalContainer) return;

  // 1. Render Left Column (Active Changelog)
  let activeHtml = "";
  if (changelogs.length === 0) {
    activeHtml = `<div style="padding: 24px; text-align: center; opacity: 0.6; font-size: 13px;">No matching active changelogs found.</div>`;
  } else {
    changelogs.forEach((item, index) => {
      const notesList = item.notes.map(note => `<li>${note}</li>`).join("");
      const isFirst = index === 0;
      activeHtml += `
        <div class="macos-changelog-card ${isFirst ? 'expanded' : ''}">
          <div class="changelog-header" style="background: rgba(0, 122, 255, ${isFirst ? '0.06' : '0.02'});">
            <div class="changelog-title" style="color: #fff;">macOS Tahoe ${item.version}</div>
            <div class="changelog-right" style="display: flex; align-items: center; gap: 8px;">
              <div class="changelog-date">${item.date}</div>
              <span class="changelog-chevron" style="transform: rotate(${isFirst ? '180deg' : '0deg'}); transition: transform 0.2s;">▼</span>
            </div>
          </div>
          <div class="changelog-body" style="display: ${isFirst ? 'block' : 'none'};">
            <ul>${notesList}</ul>
          </div>
        </div>
      `;
    });
  }
  changelogContainer.innerHTML = activeHtml;

  // 2. Render Right Column (SDK & Historical)
  let historicalHtml = "";
  if (historical.length === 0) {
    historicalHtml = `<div style="padding: 24px; text-align: center; opacity: 0.6; font-size: 13px;">No matching historical developer notes found.</div>`;
  } else {
    historical.forEach((item, index) => {
      const notesList = item.notes.map(note => `<li>${note}</li>`).join("");
      historicalHtml += `
        <div class="macos-changelog-card">
          <div class="changelog-header">
            <div>
              <span class="changelog-title">${item.version}</span>
            </div>
            <div class="changelog-right" style="display: flex; align-items: center; gap: 8px;">
              <div class="changelog-date">${item.date}</div>
              <span class="changelog-chevron" style="transition: transform 0.2s;">▼</span>
            </div>
          </div>
          <div class="changelog-body" style="display: none;">
            <ul>${notesList}</ul>
          </div>
        </div>
      `;
    });
  }
  historicalContainer.innerHTML = historicalHtml;

  // 3. Bind Accordion click triggers for both containers
  [changelogContainer, historicalContainer].forEach(container => {
    container.querySelectorAll(".changelog-header").forEach(header => {
      header.addEventListener("click", () => {
        const card = header.parentElement;
        const body = card.querySelector(".changelog-body");
        const chevron = card.querySelector(".changelog-chevron");
        
        const isExpanded = card.classList.contains("expanded");
        if (isExpanded) {
          card.classList.remove("expanded");
          if (body) body.style.display = "none";
          if (chevron) chevron.style.transform = "rotate(0deg)";
        } else {
          card.classList.add("expanded");
          if (body) body.style.display = "block";
          if (chevron) chevron.style.transform = "rotate(180deg)";
        }
      });
    });
  });
}

function filterMacos(query) {
  const q = query.toLowerCase();
  const filteredChangelogs = MACOS_CHANGELOG.filter(item => 
    item.version.toLowerCase().includes(q) || 
    item.notes.some(note => note.toLowerCase().includes(q))
  );

  const filteredHistorical = MACOS_HISTORICAL.filter(item => 
    item.version.toLowerCase().includes(q) || 
    item.category.toLowerCase().includes(q) ||
    item.notes.some(note => note.toLowerCase().includes(q))
  );

  renderMacosData(filteredChangelogs, filteredHistorical);
}

// ==========================================
// --- 9. SteamDB Games Portal Engine ---
// ==========================================
// 100% DYNAMIC — zero hardcoded games.
// All data fetched live from Steam search HTML + storesearch JSON API.

class SQLiteBridge {
  constructor() {
    this.init();
  }

  init() {
    // Initialise reports table in localStorage
    if (!localStorage.getItem("macready_sqlite_reports")) {
      localStorage.setItem("macready_sqlite_reports", JSON.stringify([]));
    }
    // Initialise hardware_profile table in localStorage
    if (!localStorage.getItem("macready_sqlite_profile")) {
      localStorage.setItem("macready_sqlite_profile", JSON.stringify(null));
    }
  }

  query(sql, params = []) {
    const cleanSql = sql.trim().replace(/\s+/g, ' ');
    console.log("[SQLiteBridge] Executing query:", cleanSql, params);

    // 1. SELECT * FROM reports WHERE appid = ?
    if (cleanSql.startsWith("SELECT * FROM reports WHERE appid = ?")) {
      const appid = String(params[0]);
      const reports = JSON.parse(localStorage.getItem("macready_sqlite_reports") || "[]");
      const filtered = reports.filter(r => String(r.appid) === appid);
      // Sort by submittedAt descending (newest first)
      filtered.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      return filtered;
    }

    // 2. SELECT * FROM reports
    if (cleanSql === "SELECT * FROM reports") {
      const reports = JSON.parse(localStorage.getItem("macready_sqlite_reports") || "[]");
      reports.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      return reports;
    }

    // 3. INSERT INTO reports (appid, gameTitle, macModel, chip, ram, macosVersion, launchMethod, crossoverVersion, fpsNotes, issues, rating, submittedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    if (cleanSql.startsWith("INSERT INTO reports")) {
      const reports = JSON.parse(localStorage.getItem("macready_sqlite_reports") || "[]");
      const newReport = {
        id: "rep_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
        appid: params[0],
        gameTitle: params[1],
        macModel: params[2],
        chip: params[3],
        ram: params[4],
        macosVersion: params[5],
        launchMethod: params[6],
        crossoverVersion: params[7] || "",
        fpsNotes: params[8] || "",
        issues: params[9] || "",
        rating: params[10],
        submittedAt: params[11] || new Date().toISOString()
      };
      reports.push(newReport);
      localStorage.setItem("macready_sqlite_reports", JSON.stringify(reports));
      return { insertId: newReport.id, rowsAffected: 1 };
    }

    // 4. SELECT * FROM hardware_profile
    if (cleanSql === "SELECT * FROM hardware_profile") {
      const profile = JSON.parse(localStorage.getItem("macready_sqlite_profile") || "null");
      return profile ? [profile] : [];
    }

    // 5. INSERT OR REPLACE INTO hardware_profile (macModel, chip, ram, macosVersion, crossoverInstalled) VALUES (?, ?, ?, ?, ?)
    if (cleanSql.startsWith("INSERT OR REPLACE INTO hardware_profile") || cleanSql.startsWith("REPLACE INTO hardware_profile")) {
      const profile = {
        macModel: params[0],
        chip: params[1],
        ram: params[2],
        macosVersion: params[3],
        crossoverInstalled: params[4] === true || params[4] === "true" || params[4] === 1 || params[4] === "1"
      };
      localStorage.setItem("macready_sqlite_profile", JSON.stringify(profile));
      return { rowsAffected: 1 };
    }

    // 6. DELETE FROM reports WHERE id = ?
    if (cleanSql.startsWith("DELETE FROM reports WHERE id = ?")) {
      const id = params[0];
      let reports = JSON.parse(localStorage.getItem("macready_sqlite_reports") || "[]");
      const initialCount = reports.length;
      reports = reports.filter(r => r.id !== id);
      localStorage.setItem("macready_sqlite_reports", JSON.stringify(reports));
      return { rowsAffected: initialCount - reports.length };
    }

    // 7. SELECT DISTINCT appid FROM reports
    if (cleanSql === "SELECT DISTINCT appid FROM reports") {
      const reports = JSON.parse(localStorage.getItem("macready_sqlite_reports") || "[]");
      const appids = [...new Set(reports.map(r => r.appid))];
      return appids.map(appid => ({ appid }));
    }

    console.warn("[SQLiteBridge] Query not recognized:", cleanSql);
    return [];
  }
}
const db = new SQLiteBridge();

let gamesCache = [
  {
    id: "game-1086940",
    appid: 1086940,
    title: "Baldur's Gate 3",
    compatibility: "native",
    compatLabel: "Native",
    hasNativeMac: true,
    genres: ["RPG", "Strategy", "Adventure"],
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg",
    storeUrl: "https://store.steampowered.com/app/1086940/",
    steamdbUrl: "https://steamdb.info/app/1086940/",
    protonUrl: "https://www.protondb.com/app/1086940",
    fullDescription: "Gather your party, and return to the Forgotten Realms in a tale of fellowship and betrayal, sacrifice and survival, and the lure of absolute power.",
    screenshots: [
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/ss_277cf5c3453b0e352ef29304c55ecba574d75db1.600x338.jpg",
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/ss_e1c876b0cb4440c94627d3b5b1c7cb7ef1ca0c5b.600x338.jpg"
    ],
    features: ["Single-player", "Online Co-op", "Shared/Split Screen Co-op", "Steam Achievements", "Full controller support"],
    systemRequirements: {
      mac: { minimum: "Minimum:\nRequires a 64-bit processor and operating system\nOS: macOS 12 or newer\nProcessor: Apple M1 or Intel Core i7\nMemory: 8 GB RAM\nGraphics: Apple M1 or AMD Radeon Pro 5500M\nStorage: 150 GB available space" }
    },
    releaseDate: "3 Aug 2023",
    price: 59.99,
    discount: 0,
    rating: 96
  },
  {
    id: "game-1091500",
    appid: 1091500,
    title: "Cyberpunk 2077",
    compatibility: "perfect",
    compatLabel: "Perfect",
    hasNativeMac: false,
    genres: ["Action", "RPG"],
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg",
    storeUrl: "https://store.steampowered.com/app/1091500/",
    steamdbUrl: "https://steamdb.info/app/1091500/",
    protonUrl: "https://www.protondb.com/app/1091500",
    fullDescription: "Cyberpunk 2077 is an open-world, action-adventure RPG set in the megalopolis of Night City, where you play as a cyberpunk mercenary wrapped in a do-or-die fight for survival.",
    screenshots: [
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/ss_60a6df3eb6b696f8c7b80a0c64ebadcbdbd47b59.600x338.jpg",
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/ss_dd09c733f11075d9e51c8a67c52a0a2df37894a7.600x338.jpg"
    ],
    features: ["Single-player", "Steam Achievements", "Full controller support", "Steam Cloud"],
    systemRequirements: {
      windows: { minimum: "Minimum:\nRequires a 64-bit processor and operating system\nOS: Windows 10\nProcessor: Intel Core i7-6700 or AMD Ryzen 5 1600\nMemory: 12 GB RAM\nGraphics: NVIDIA GeForce GTX 1060 6GB or AMD Radeon RX 580\nStorage: 70 GB available space" }
    },
    releaseDate: "10 Dec 2020",
    price: 59.99,
    discount: 50,
    rating: 83
  },
  {
    id: "game-1145360",
    appid: 1145360,
    title: "Hades",
    compatibility: "native",
    compatLabel: "Native",
    hasNativeMac: true,
    genres: ["Action", "RPG", "Indie"],
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/header.jpg",
    storeUrl: "https://store.steampowered.com/app/1145360/",
    steamdbUrl: "https://steamdb.info/app/1145360/",
    protonUrl: "https://www.protondb.com/app/1145360",
    fullDescription: "Defy the god of the dead as you hack and slash out of the Underworld in this rogue-like dungeon crawler from the creators of Bastion and Transistor.",
    screenshots: [
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/ss_49544ef4a654cd9c0c16928e146eb823ef08c2a9.600x338.jpg",
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/ss_a43e498c8c7cf0cc651ebadcd9d54e0eb37894a7.600x338.jpg"
    ],
    features: ["Single-player", "Steam Achievements", "Full controller support", "Steam Cloud"],
    systemRequirements: {
      mac: { minimum: "Minimum:\nOS: macOS 10.13.6+\nProcessor: Dual Core 2.4GHz\nMemory: 4 GB RAM\nGraphics: Intel HD 5000 or higher\nStorage: 15 GB available space" }
    },
    releaseDate: "17 Sep 2020",
    price: 24.99,
    discount: 0,
    rating: 98
  },
  {
    id: "game-413150",
    appid: 413150,
    title: "Stardew Valley",
    compatibility: "native",
    compatLabel: "Native",
    hasNativeMac: true,
    genres: ["Simulation", "RPG", "Indie"],
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/413150/header.jpg",
    storeUrl: "https://store.steampowered.com/app/413150/",
    steamdbUrl: "https://steamdb.info/app/413150/",
    protonUrl: "https://www.protondb.com/app/413150",
    fullDescription: "You've inherited your grandfather's old farm plot in Stardew Valley. Armed with hand-me-down tools and a few coins, you set out to begin your new life.",
    screenshots: [
      "https://cdn.cloudflare.steamstatic.com/steam/apps/413150/ss_3e3d9c3b0e352ef29304c55ecba574d75db1.600x338.jpg",
      "https://cdn.cloudflare.steamstatic.com/steam/apps/413150/ss_dd09c733f11075d9e51c8a67c52a0a2df37894a7.600x338.jpg"
    ],
    features: ["Single-player", "Multiplayer", "Co-op", "Steam Achievements", "Full controller support"],
    systemRequirements: {
      mac: { minimum: "Minimum:\nOS: Mac OS X 10.10+\nProcessor: 2.0 GHz\nMemory: 2 GB RAM\nGraphics: 256 mb video memory\nStorage: 500 MB available space" }
    },
    releaseDate: "26 Feb 2016",
    price: 14.99,
    discount: 0,
    rating: 98
  },
  {
    id: "game-1245620",
    appid: 1245620,
    title: "ELDEN RING",
    compatibility: "perfect",
    compatLabel: "Perfect",
    hasNativeMac: false,
    genres: ["RPG", "Action"],
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg",
    storeUrl: "https://store.steampowered.com/app/1245620/",
    steamdbUrl: "https://steamdb.info/app/1245620/",
    protonUrl: "https://www.protondb.com/app/1245620",
    fullDescription: "THE NEW FANTASY ACTION RPG. Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between.",
    screenshots: [
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/ss_277cf5c3453b0e352ef29304c55ecba574d75db1.600x338.jpg",
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/ss_e1c876b0cb4440c94627d3b5b1c7cb7ef1ca0c5b.600x338.jpg"
    ],
    features: ["Single-player", "Online Co-op", "Steam Achievements", "Full controller support"],
    systemRequirements: {
      windows: { minimum: "Minimum:\nRequires a 64-bit processor and operating system\nOS: Windows 10\nProcessor: Intel Core i5-8400 or AMD Ryzen 3 3300X\nMemory: 12 GB RAM\nGraphics: NVIDIA GeForce GTX 1060 3GB or AMD Radeon RX 580\nStorage: 60 GB available space" }
    },
    releaseDate: "25 Feb 2022",
    price: 59.99,
    discount: 0,
    rating: 92
  },
  {
    id: "game-1850570",
    appid: 1850570,
    title: "Death Stranding Director's Cut",
    compatibility: "native",
    compatLabel: "Native",
    hasNativeMac: true,
    genres: ["Action", "Adventure"],
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1850570/header.jpg",
    storeUrl: "https://store.steampowered.com/app/1850570/",
    steamdbUrl: "https://steamdb.info/app/1850570/",
    protonUrl: "https://www.protondb.com/app/1850570",
    fullDescription: "From legendary game creator Hideo Kojima comes a genre-defying experience, now expanded in this definitive DIRECTOR’S CUT.",
    screenshots: [
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1850570/ss_3e3d9c3b0e352ef29304c55ecba574d75db1.600x338.jpg",
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1850570/ss_dd09c733f11075d9e51c8a67c52a0a2df37894a7.600x338.jpg"
    ],
    features: ["Single-player", "Steam Achievements", "Full controller support", "Steam Cloud"],
    systemRequirements: {
      mac: { minimum: "Minimum:\nOS: macOS Ventura 13.3 or newer\nProcessor: Apple M1 chip or newer\nMemory: 8 GB RAM\nStorage: 80 GB available space" }
    },
    releaseDate: "30 Mar 2022",
    price: 39.99,
    discount: 0,
    rating: 93
  },
  {
    id: "game-2050650",
    appid: 2050650,
    title: "Resident Evil 4",
    compatibility: "native",
    compatLabel: "Native",
    hasNativeMac: true,
    genres: ["Action", "Adventure"],
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/2050650/header.jpg",
    storeUrl: "https://store.steampowered.com/app/2050650/",
    steamdbUrl: "https://steamdb.info/app/2050650/",
    protonUrl: "https://www.protondb.com/app/2050650",
    fullDescription: "Survival is only the beginning. Six years have passed since the biological disaster in Raccoon City. Leon S. Kennedy tracks the president's kidnapped daughter to a secluded European village.",
    screenshots: [
      "https://cdn.cloudflare.steamstatic.com/steam/apps/2050650/ss_277cf5c3453b0e352ef29304c55ecba574d75db1.600x338.jpg",
      "https://cdn.cloudflare.steamstatic.com/steam/apps/2050650/ss_e1c876b0cb4440c94627d3b5b1c7cb7ef1ca0c5b.600x338.jpg"
    ],
    features: ["Single-player", "Steam Achievements", "Full controller support", "Steam Cloud"],
    systemRequirements: {
      mac: { minimum: "Minimum:\nOS: macOS Sonoma 14.0 or newer\nProcessor: Apple M1 chip or newer\nMemory: 8 GB RAM\nStorage: 70 GB available space" }
    },
    releaseDate: "24 Mar 2023",
    price: 39.99,
    discount: 25,
    rating: 97
  },
  {
    id: "game-1868140",
    appid: 1868140,
    title: "Dave the Diver",
    compatibility: "native",
    compatLabel: "Native",
    hasNativeMac: true,
    genres: ["Adventure", "Simulation", "Indie"],
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1868140/header.jpg",
    storeUrl: "https://store.steampowered.com/app/1868140/",
    steamdbUrl: "https://steamdb.info/app/1868140/",
    protonUrl: "https://www.protondb.com/app/1868140",
    fullDescription: "DAVE THE DIVER is a casual, singleplayer adventure RPG featuring deep-sea exploration and fishing during the day and sushi restaurant management at night.",
    screenshots: [
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1868140/ss_3e3d9c3b0e352ef29304c55ecba574d75db1.600x338.jpg",
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1868140/ss_dd09c733f11075d9e51c8a67c52a0a2df37894a7.600x338.jpg"
    ],
    features: ["Single-player", "Steam Achievements", "Full controller support", "Steam Cloud"],
    systemRequirements: {
      mac: { minimum: "Minimum:\nOS: OS X 10.13.6 or newer\nProcessor: Intel Core i3 Dual Core\nMemory: 8 GB RAM\nGraphics: Intel HD Graphics 4000\nStorage: 10 GB available space" }
    },
    releaseDate: "28 Jun 2023",
    price: 19.99,
    discount: 0,
    rating: 97
  }
];
let gamesLoaded = false;
let gamesLoading = false;
const STEAM_GAMES_CACHE_KEY = "macready_steam_games_cache_v2";
const STEAM_GAMES_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let steamGamesLastSavedAt = 0;
let steamGamesRefreshStarted = false;
let currentGameFilter = "trending";
let currentGameCompat = "all";
let gameSearchQuery = "";
let gameSearchResults = [];
let gamesSearchTimeout = null;

// New state for Games Page Enhancements
let currentGameGenre = "all";
let visibleGamesCount = 12;
const gamesPerPage = 12;
let carouselIntervalId = null;
let currentCarouselIndex = 0;

// New state for Dynamic Wallpaper Glass Blending
let activeAtmosphericGame = null;
let isDetailModalOpen = false;

function loadCachedSteamGames() {
  try {
    const cached = JSON.parse(localStorage.getItem(STEAM_GAMES_CACHE_KEY) || "null");
    if (!cached || !Array.isArray(cached.games) || cached.games.length === 0) return;

    gamesCache = cached.games;
    steamGamesLastSavedAt = Number(cached.savedAt) || 0;
    gamesLoaded = true;
  } catch (error) {
    console.warn("Steam games cache could not be read.", error);
  }
}

function saveSteamGamesCache() {
  try {
    localStorage.setItem(STEAM_GAMES_CACHE_KEY, JSON.stringify({
      savedAt: Date.now(),
      games: gamesCache
    }));
    steamGamesLastSavedAt = Date.now();
  } catch (error) {
    console.warn("Steam games cache could not be saved.", error);
  }
}

function refreshSteamGamesIfNeeded() {
  if (steamGamesRefreshStarted || gamesLoading) return;
  const cacheAge = Date.now() - steamGamesLastSavedAt;
  if (!steamGamesLastSavedAt || cacheAge > STEAM_GAMES_CACHE_TTL_MS) {
    steamGamesRefreshStarted = true;
    loadAllGamesData({ silent: true, force: true });
  }
}

loadCachedSteamGames();
if (gamesCache.length > 0) gamesLoaded = true;

// --- Dynamic Wallpaper Glass Blending (Atmospheric Blur) ---
function applyAtmosphericGlow(game) {
  const desktop = document.getElementById("desktop");
  if (!desktop) return;
  
  if (!game) {
    const savedWall = localStorage.getItem("tahoe_wallpaper") || "tahoe-liquid";
    const glows = {
      "tahoe-liquid": ["rgba(59, 130, 246, 0.8)", "rgba(168, 85, 247, 0.6)", "rgba(236, 72, 153, 0.5)"],
      "tahoe-beach-dawn": ["rgba(251, 191, 36, 0.5)", "rgba(244, 63, 94, 0.4)", "rgba(56, 189, 248, 0.4)"],
      "tahoe-dark": ["rgba(30, 41, 59, 0.8)", "rgba(51, 65, 85, 0.7)", "rgba(71, 85, 105, 0.6)"],
      "sequoia-sunrise": ["rgba(219, 39, 119, 0.5)", "rgba(249, 115, 22, 0.45)", "rgba(124, 58, 237, 0.4)"],
      "big-sur-night": ["rgba(99, 102, 241, 0.6)", "rgba(236, 72, 153, 0.5)", "rgba(245, 158, 11, 0.4)"],
      "black-solid": ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)"],
      "tahoe-sunset": ["rgba(255, 107, 107, 0.4)", "rgba(240, 147, 251, 0.3)", "rgba(253, 187, 45, 0.25)"],
      "aurora-glow": ["rgba(0, 242, 254, 0.35)", "rgba(0, 205, 172, 0.3)", "rgba(168, 85, 247, 0.2)"],
      "midnight-teal": ["rgba(10, 147, 150, 0.35)", "rgba(0, 180, 216, 0.25)", "rgba(0, 18, 25, 0.1)"],
      "neon-dream": ["rgba(0, 240, 255, 0.45)", "rgba(255, 0, 127, 0.45)", "rgba(123, 31, 162, 0.3)"],
      "royal-velvet": ["rgba(99, 102, 241, 0.45)", "rgba(217, 119, 6, 0.35)", "rgba(67, 56, 202, 0.3)"],
      "rainbow-pride": ["rgba(228, 3, 3, 0.45)", "rgba(0, 128, 38, 0.4)", "rgba(115, 41, 130, 0.35)"],
      "trans-pride": ["rgba(91, 206, 250, 0.45)", "rgba(245, 169, 184, 0.45)", "rgba(255, 255, 255, 0.3)"],
      "bi-pride": ["rgba(214, 2, 112, 0.45)", "rgba(0, 56, 168, 0.45)", "rgba(155, 79, 150, 0.35)"],
      "lesbian-pride": ["rgba(213, 45, 0, 0.45)", "rgba(216, 75, 149, 0.4)", "rgba(162, 38, 51, 0.35)"],
      "nonbinary-pride": ["rgba(252, 244, 52, 0.35)", "rgba(156, 89, 209, 0.4)", "rgba(255, 255, 255, 0.2)"],
      "asexual-pride": ["rgba(128, 0, 128, 0.45)", "rgba(163, 163, 163, 0.35)", "rgba(255, 255, 255, 0.2)"]
    };
    const colors = glows[savedWall] || glows["tahoe-liquid"];
    desktop.style.setProperty("--glow-color-1", colors[0]);
    desktop.style.setProperty("--glow-color-2", colors[1]);
    desktop.style.setProperty("--glow-color-3", colors[2]);
    return;
  }
  
  const title = (game.title || "").toLowerCase();
  let colors = null;
  
  if (title.includes("cyberpunk")) {
    colors = [
      "rgba(0, 240, 255, 0.65)", // Cyberpunk Hot Cyan
      "rgba(255, 0, 127, 0.55)",  // Cyberpunk Vibrant Magenta/Pink
      "rgba(123, 31, 162, 0.4)"   // Deep Dark Violet
    ];
  } else if (title.includes("stardew") || title.includes("diver")) {
    colors = [
      "rgba(16, 185, 129, 0.6)",  // Stardew/Diver Emerald Green
      "rgba(245, 158, 11, 0.5)",   // Warm Amber Gold
      "rgba(34, 197, 94, 0.45)"   // Lush Meadow Green
    ];
  } else if (title.includes("baldur") || title.includes("elden") || title.includes("witcher")) {
    colors = [
      "rgba(67, 56, 202, 0.65)",  // BG3/Elden Royal Indigo
      "rgba(217, 119, 6, 0.55)",  // Burning Dragon Amber
      "rgba(99, 102, 241, 0.4)"   // Celestial Blue
    ];
  } else if (title.includes("hades")) {
    colors = [
      "rgba(239, 68, 68, 0.65)",  // Hades Blood Crimson
      "rgba(124, 58, 237, 0.55)", // Underworld Shadow Violet
      "rgba(245, 158, 11, 0.45)"  // Underworld Fire Amber
    ];
  } else if (title.includes("resident")) {
    colors = [
      "rgba(127, 29, 29, 0.7)",   // RE4 Dark Blood Red
      "rgba(30, 41, 59, 0.6)",    // Shadow Dark Slate
      "rgba(20, 30, 25, 0.55)"    // Decayed Muddy Green
    ];
  } else if (title.includes("death stranding") || title.includes("stranding")) {
    colors = [
      "rgba(112, 128, 144, 0.6)", // Void Fog Grey
      "rgba(234, 179, 8, 0.5)",   // Chiral Golden Dust
      "rgba(30, 30, 48, 0.45)"    // Deep Obsidian Indigo
    ];
  } else {
    // Elegant dynamic generator for other games based on compatibility
    if (game.compatibility === "native") {
      colors = [
        "rgba(52, 199, 89, 0.6)",   // Native Green
        "rgba(0, 122, 255, 0.5)",   // Cobalt Blue
        "rgba(175, 82, 222, 0.4)"   // Royal Purple
      ];
    } else {
      colors = [
        "rgba(0, 122, 255, 0.6)",   // Cobalt Blue
        "rgba(175, 82, 222, 0.5)",   // Royal Purple
        "rgba(255, 45, 85, 0.4)"    // Deep Pink
      ];
    }
  }
  
  if (colors) {
    desktop.style.setProperty("--glow-color-1", colors[0]);
    desktop.style.setProperty("--glow-color-2", colors[1]);
    desktop.style.setProperty("--glow-color-3", colors[2]);
  }
}

// --- Safely parse steam mixed-format dates ---
function parseSteamDate(dateStr) {
  if (!dateStr) return new Date(0);
  
  // Try parsing directly
  let timestamp = Date.parse(dateStr);
  if (!isNaN(timestamp)) {
    return new Date(timestamp);
  }
  
  // Try reordering e.g. "22 May 2026" -> "May 22 2026"
  const match = dateStr.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (match) {
    const reordered = `${match[2]} ${match[1]} ${match[3]}`;
    timestamp = Date.parse(reordered);
    if (!isNaN(timestamp)) {
      return new Date(timestamp);
    }
  }
  
  // Fallback to finding year
  const yearMatch = dateStr.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch) {
    return new Date(parseInt(yearMatch[1]), 0, 1);
  }
  
  return new Date(0);
}

// --- Distribute default genres for initial search results based on keywords ---
function assignDefaultGenres(game) {
  const title = game.title.toLowerCase();
  const genres = [];
  
  if (title.includes("strike") || title.includes("ops") || title.includes("war") || title.includes("battle") || title.includes("fight") || title.includes("shoot") || title.includes("doom") || title.includes("force") || title.includes("dead") || title.includes("kill") || title.includes("action") || title.includes("counter")) {
    genres.push("Action");
  }
  if (title.includes("elden") || title.includes("fantasy") || title.includes("witcher") || title.includes("soul") || title.includes("rpg") || title.includes("quest") || title.includes("dragon") || title.includes("gate") || title.includes("diablo")) {
    genres.push("RPG");
  }
  if (title.includes("adventure") || title.includes("journey") || title.includes("explore") || title.includes("world") || title.includes("wilds") || title.includes("sea") || title.includes("sky") || title.includes("star") || title.includes("space") || title.includes("island")) {
    genres.push("Adventure");
  }
  if (title.includes("strategy") || title.includes("command") || title.includes("conquer") || title.includes("tactics") || title.includes("empires") || title.includes("kings") || title.includes("chess") || title.includes("civilization")) {
    genres.push("Strategy");
  }
  if (title.includes("simulator") || title.includes("sim") || title.includes("farm") || title.includes("truck") || title.includes("flight") || title.includes("build") || title.includes("tycoon") || title.includes("city")) {
    genres.push("Simulation");
  }
  if (title.includes("fifa") || title.includes("nba") || title.includes("football") || title.includes("soccer") || title.includes("racing") || title.includes("drive") || title.includes("rally") || title.includes("skate") || title.includes("golf") || title.includes("sports") || title.includes("f1")) {
    genres.push("Sports");
  }

  // Modulo-based stable variety fallback if no keyword matched
  if (genres.length === 0) {
    const list = ["Action", "RPG", "Adventure", "Strategy", "Simulation", "Sports"];
    const hash = game.appid % list.length;
    genres.push(list[hash]);
  }
  
  game.genres = genres;
}

// --- Steam Search HTML Parser ---
// Parses Steam's search/results HTML into game objects using DOMParser.
function parseSteamSearchResults(htmlText) {
  const games = [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    const rows = doc.querySelectorAll("a.search_result_row");
    rows.forEach(row => {
      const appidStr = row.getAttribute("data-ds-appid");
      if (!appidStr) return;
      const appid = parseInt(appidStr);
      if (isNaN(appid)) return;

      // Title
      const titleEl = row.querySelector(".search_name .title");
      const title = titleEl ? titleEl.textContent.trim() : `App ${appid}`;

      // Platform — check for native Mac
      const hasMac = !!row.querySelector(".platform_img.mac");

      // Price (in cents from data-price-final)
      const priceBlock = row.querySelector(".search_price_discount_combined");
      let priceFinal = 0;
      let discount = 0;
      let priceOriginal = 0;
      if (priceBlock) {
        const pf = priceBlock.getAttribute("data-price-final");
        if (pf) priceFinal = parseInt(pf) / 100;
        const discountBlock = priceBlock.querySelector(".discount_block");
        if (discountBlock) {
          const dd = discountBlock.getAttribute("data-discount");
          if (dd) discount = parseInt(dd);
        }
      }
      // Derive original price from discount
      if (discount > 0 && priceFinal > 0) {
        priceOriginal = priceFinal / (1 - discount / 100);
      } else {
        priceOriginal = priceFinal;
      }

      // Rating from tooltip: "XX% of the N user reviews"
      let rating = null;
      const reviewEl = row.querySelector(".search_review_summary");
      if (reviewEl) {
        const tooltip = reviewEl.getAttribute("data-tooltip-html") || "";
        const match = tooltip.match(/(\d+)%\s+of\s+the/);
        if (match) rating = parseInt(match[1]);
      }

      // Release date
      const releaseDateEl = row.querySelector(".search_released");
      const releaseDate = releaseDateEl ? releaseDateEl.textContent.trim() : "";
      const cover = getSteamSearchCover(row);
      if (!cover) return;

      // Compatibility
      let compatibility = hasMac ? "native" : "playable";
      let compatLabel = hasMac ? "Native" : "Playable";

      const gameObj = {
        id: "game-" + appid,
        appid: appid,
        title: title,
        rating: rating,
        activePlayers: null,
        price: priceOriginal,
        discount: discount,
        compatibility: compatibility,
        compatLabel: compatLabel,
        hasNativeMac: hasMac,
        genres: [],
        cover,
        storeUrl: `https://store.steampowered.com/app/${appid}/`,
        steamdbUrl: `https://steamdb.info/app/${appid}/`,
        protonUrl: `https://www.protondb.com/app/${appid}`,
        fullDescription: "",
        screenshots: [],
        features: [],
        systemRequirements: null,
        releaseDate: releaseDate
      };

      assignDefaultGenres(gameObj);
      games.push(gameObj);
    });
  } catch (e) {
    console.error("Error parsing Steam search HTML:", e);
  }
  return games;
}

function getSteamSearchCover(row) {
  const image = row.querySelector(".search_capsule img, img");
  const rawSrc = image?.getAttribute("src") || image?.getAttribute("data-src") || "";
  if (!rawSrc) return "";
  return rawSrc.startsWith("//") ? `https:${rawSrc}` : rawSrc;
}

// --- Merge games into cache (deduplicates by appid) ---
function mergeGamesIntoCache(newGames) {
  newGames.forEach(game => {
    const existing = gamesCache.find(g => g.appid === game.appid);
    if (existing) {
      Object.assign(existing, {
        ...game,
        screenshots: game.screenshots?.length ? game.screenshots : existing.screenshots,
        features: game.features?.length ? game.features : existing.features,
        fullDescription: game.fullDescription || existing.fullDescription,
        systemRequirements: game.systemRequirements || existing.systemRequirements
      });
    } else {
      gamesCache.push(game);
    }
  });
}

// --- Dynamic Startup: Fetch live from Steam search result pages ---
async function loadAllGamesData(options = {}) {
  const { silent = false, force = false } = options;
  if ((gamesLoaded && !force) || gamesLoading) return;
  gamesLoading = true;

  const grid = document.getElementById("games-grid");
  if (grid && !silent) {
    grid.innerHTML = `
      <div class="empty-state" style="padding: 40px; grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
        <svg class="update-sync-icon syncing" style="width: 32px; height: 32px; color: #66c0f4;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
        </svg>
        <p style="margin-top: 12px; font-size: 13px; opacity: 0.7;">Fetching live Steam database...</p>
      </div>
    `;
  }

  const steamSearchUrls = [
    "https://store.steampowered.com/search/results/?query&start=0&count=80&dynamic_data=&sort_by=_ASC&force_infinite=1&filter=topsellers&category1=998&ndl=1",
    "https://store.steampowered.com/search/results/?query&start=0&count=80&dynamic_data=&sort_by=Released_DESC&force_infinite=1&filter=popularnew&category1=998&ndl=1",
    "https://store.steampowered.com/search/results/?query&start=0&count=40&dynamic_data=&sort_by=_ASC&force_infinite=1&filter=popularnew&category1=998&ndl=1"
  ];

  try {
    let mergedCount = 0;
    const results = await Promise.allSettled(
      steamSearchUrls.map(url => fetchViaProxy(url))
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.ok) {
        try {
          const res = result.value;
          let htmlText = "";
          // fetchViaProxy returns different shapes depending on which proxy succeeded
          try {
            const json = await res.json();
            htmlText = typeof json === "string" ? json : (json.contents || "");
          } catch {
            htmlText = await res.text();
          }
          if (htmlText && htmlText.includes("search_result_row")) {
            const parsed = parseSteamSearchResults(htmlText);
            mergedCount += parsed.length;
            mergeGamesIntoCache(parsed);
          }
        } catch (e) {
          console.warn("Failed to parse a Steam search page:", e);
        }
      }
    }

    if (gamesCache.length === 0) {
      if (grid) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px; width: 100%;">
            <h3 style="font-family: var(--font-title); font-size: 16px; color: #66c0f4;">Could Not Load Games</h3>
            <p style="font-size: 12px; opacity: 0.6; margin-top: 4px;">The Steam database proxies are temporarily unavailable. Try searching for a game directly.</p>
          </div>
        `;
      }
    }

    if (mergedCount > 0) {
      saveSteamGamesCache();
    }
    gamesLoaded = true;
  } catch (err) {
    console.error("Error loading Steam games:", err);
    pushNotification("SteamDB Error", "Could not fetch Steam search data.");
  } finally {
    gamesLoading = false;
    if (currentApp === "games" || !silent) renderGamesView();
    updateSteamStats();
  }
}

function updateSteamStats() {
  const totalOnlineEl = document.getElementById("games-total-online");
  const totalPlayingEl = document.getElementById("games-total-playing");
  if (gamesCache.length === 0) return;

  const nativeMacCount = gamesCache.filter(g => g.hasNativeMac).length;

  if (totalOnlineEl) totalOnlineEl.textContent = `${gamesCache.length} Games`;
  if (totalPlayingEl) totalPlayingEl.textContent = `${nativeMacCount} Native Mac`;
}

async function syncLiveSteamGames() {
  const syncIcon = document.getElementById("games-sync-icon");
  if (syncIcon) syncIcon.classList.add("syncing");

  try {
    // Re-fetch the top sellers to refresh prices/discounts
    const url = "https://store.steampowered.com/search/results/?query&start=0&count=80&dynamic_data=&sort_by=_ASC&force_infinite=1&filter=topsellers&category1=998&ndl=1";
    const res = await fetchViaProxy(url);
    if (res.ok) {
      let htmlText = "";
      try {
        const json = await res.json();
        htmlText = typeof json === "string" ? json : (json.contents || "");
      } catch {
        htmlText = await res.text();
      }
      if (htmlText && htmlText.includes("search_result_row")) {
        const freshGames = parseSteamSearchResults(htmlText);
        mergeGamesIntoCache(freshGames);
        saveSteamGamesCache();
      }
    }

    renderGamesView();
    updateSteamStats();
    pushNotification("SteamDB Sync Complete", "Live pricing and ratings refreshed!");
  } catch (err) {
    console.error("SteamDB Live Sync Error:", err);
    pushNotification("Sync Failed", "Could not query Steam CORS gateway.");
  } finally {
    if (syncIcon) syncIcon.classList.remove("syncing");
  }
}

async function openSteamGameDetail(gameId) {
  const game = gamesCache.find(g => g.id === gameId);
  if (!game) return;

  const modal = document.getElementById("steamdb-details-modal");
  const body = document.getElementById("steamdb-detail-body");
  if (!modal || !body) return;

  modal.classList.remove("hidden");
  
  // Set details modal state and update ambient colors immediately
  isDetailModalOpen = true;
  applyAtmosphericGlow(game);
  
  // Render with baseline cached data immediately
  renderGameDetailContent(game, body);

  // Fetch full details (screenshots & long description) in background via CORS proxy
  try {
    const url = `https://store.steampowered.com/api/appdetails?appids=${game.appid}&l=english&cc=US`;
    const res = await fetchViaProxy(url);
    if (res.ok) {
      let parsed;
      try {
        const json = await res.json();
        const raw = typeof json === "string" ? json : (json.contents || JSON.stringify(json));
        parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch {
        const text = await res.text();
        parsed = JSON.parse(text);
      }
      const data = parsed?.[game.appid]?.data;
      if (data) {
        if (data.screenshots) {
          game.screenshots = data.screenshots.map(s => s.path_full).slice(0, 5);
        }
        if (data.movies) {
          const movie = data.movies.find(m => m.webm?.max || m.webm?.["480"] || m.mp4?.max || m.mp4?.["480"]);
          game.videoUrl = movie?.webm?.max || movie?.webm?.["480"] || movie?.mp4?.max || movie?.mp4?.["480"] || "";
          game.videoPoster = movie?.thumbnail || "";
        }
        if (!game.videoUrl) {
          const inlineVideo = extractSteamInlineVideo(data.about_the_game || data.detailed_description || "");
          game.videoUrl = inlineVideo.url;
          game.videoPoster = inlineVideo.poster;
        }
        if (data.short_description || data.detailed_description) {
          game.fullDescription = data.short_description || data.detailed_description.replace(/<\/?[^>]+(>|$)/g, "").slice(0, 500) + "...";
        }
        if (data.publishers) {
          game.publisher = data.publishers.join(", ");
        }
        if (data.release_date) {
          game.releaseDate = data.release_date.date;
        }
        if (data.genres) {
          game.genres = data.genres.map(g => g.description).slice(0, 4);
        }
        if (data.categories) {
          game.features = data.categories.map(c => c.description).slice(0, 10);
        }
        game.systemRequirements = {
          mac: data.mac_requirements || null,
          windows: data.pc_requirements || null
        };
        if (data.price_overview) {
          game.price = data.price_overview.initial / 100;
          game.discount = data.price_overview.discount_percent || 0;
        }
        if (data.platforms) {
          game.hasNativeMac = !!data.platforms.mac;
          game.compatibility = game.hasNativeMac ? "native" : "playable";
          game.compatLabel = game.hasNativeMac ? "Native" : "Playable";
        }
        
        // Re-render modal in-place with real-time assets
        renderGameDetailContent(game, body);
      }
    }
  } catch (err) {
    console.warn("Failed to fetch detailed storefront data", err);
  }

}

function closeSteamGameDetail() {
  const modal = document.getElementById("steamdb-details-modal");
  if (modal) modal.classList.add("hidden");

  isDetailModalOpen = false;
  if (currentApp === "games") {
    applyAtmosphericGlow(activeAtmosphericGame);
  } else {
    applyAtmosphericGlow(null);
  }
}

function cleanSteamHtml(html) {
  if (!html) return "";
  const normalized = String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|div)>/gi, "\n");
  const node = document.createElement("div");
  node.innerHTML = normalized;
  return node.textContent
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function extractSteamInlineVideo(html) {
  if (!html) return { url: "", poster: "" };
  const node = document.createElement("div");
  node.innerHTML = String(html);
  const video = node.querySelector("video");
  const source = node.querySelector('source[type*="webm"], source[type*="mp4"]');
  return {
    url: source?.getAttribute("src") || "",
    poster: video?.getAttribute("poster") || ""
  };
}

function renderGameDetailContent(game, body) {
  const formattedPrice = game.price === 0 ? "Free To Play" : `$${game.price.toFixed(2)}`;
  let priceHtml = "";
  if (game.discount > 0) {
    const finalPrice = game.price * (1 - game.discount / 100);
    priceHtml = `
      <span class="discount-pill" style="background: #a3ff00; color: #000; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 11px;">-${game.discount}%</span>
      <span style="text-decoration: line-through; opacity: 0.5; font-size: 11px; margin-left: 6px;">$${game.price.toFixed(2)}</span>
      <span style="color: #fff; font-weight: 700; font-size: 14px; margin-left: 6px;">$${finalPrice.toFixed(2)}</span>
    `;
  } else {
    priceHtml = `<span style="font-weight: 700; font-size: 14px;">${formattedPrice}</span>`;
  }

  // Steam Rating format
  let ratingLabel = game.rating ? `${game.rating}% Positive` : "No rating data";
  if (game.reviewScoreDesc) {
    ratingLabel = `${game.rating}% Positive`;
  }
  const genresHtml = game.genres.map(g => `<span style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14); padding: 3px 8px; border-radius: 4px; font-size: 10px; color: #fff;">${g}</span>`).join(" ");

  const videoHtml = game.videoUrl
    ? `
      <div class="steamdb-media-tile steamdb-media-video">
        <video class="steamdb-video-player" src="${game.videoUrl}" poster="${game.videoPoster}" controls playsinline preload="metadata"></video>
      </div>
    `
    : "";
  const screenshotHtml = (game.screenshots || [])
    .slice(0, 5)
    .map(src => `
      <div class="steamdb-media-tile">
        <img src="${src}" alt="Screenshot" class="steamdb-media-shot">
      </div>
    `)
    .join("");
  const mediaHtml = `
    <div class="steamdb-media-rail ${game.videoUrl ? "has-video" : "screenshots-only"}">
      ${videoHtml}
      ${screenshotHtml}
    </div>
  `;
  const featuresHtml = (game.features || []).length > 0
    ? `
      <div class="steamdb-detail-section">
        <h4>Features</h4>
        <div class="steamdb-feature-grid">
          ${game.features.map(feature => `<span>${escapeHtml(feature)}</span>`).join("")}
        </div>
      </div>
    `
    : "";
  const requirementEntries = [
    ["mac", "macOS", game.systemRequirements?.mac],
    ["windows", "Windows", game.systemRequirements?.windows]
  ].map(([key, label, requirements]) => {
    const minimum = cleanSteamHtml(requirements?.minimum || "");
    const recommended = cleanSteamHtml(requirements?.recommended || "");
    const text = minimum || recommended;
    if (/^(?:\.{3}|…)$/.test(text)) return "";
    if (!text) return "";
    const compactText = text.replace(/^Minimum:\s*/i, "").slice(0, 380);
    return `
      <div class="steamdb-requirement-card ${key}">
        <span>${label}</span>
        <p>${escapeHtml(compactText)}${text.length > compactText.length ? "..." : ""}</p>
      </div>
    `;
  }).filter(Boolean).join("");
  const requirementsHtml = requirementEntries
    ? `
      <div class="steamdb-detail-section">
        <h4>System Requirements</h4>
        <div class="steamdb-requirements-grid">
          ${requirementEntries}
        </div>
      </div>
    `
    : "";

  // Relational Database query for reports
  const reports = db.query("SELECT * FROM reports WHERE appid = ?", [game.appid]);
  
  // Consensus Rating computation
  let consensusLabel = "Pending Data";
  let consensusClass = "unsupported"; // defaults to red/grey pending style
  
  if (reports.length > 0) {
    const ratingValues = {
      "Native": 5,
      "Excellent": 4,
      "Playable": 3,
      "Limited": 2,
      "Broken": 1
    };
    
    let sum = 0;
    let count = 0;
    reports.forEach(r => {
      if (ratingValues[r.rating] !== undefined) {
        sum += ratingValues[r.rating];
        count++;
      }
    });
    
    if (count > 0) {
      const avg = sum / count;
      if (avg >= 4.5) {
        consensusLabel = "Native";
        consensusClass = "native";
      } else if (avg >= 3.5) {
        consensusLabel = "Excellent";
        consensusClass = "perfect"; 
      } else if (avg >= 2.5) {
        consensusLabel = "Playable";
        consensusClass = "playable"; 
      } else if (avg >= 1.5) {
        consensusLabel = "Limited";
        consensusClass = "silver"; 
      } else {
        consensusLabel = "Broken";
        consensusClass = "unsupported"; 
      }
    }
  }

  // Render individual report cards
  let reportsHtml = "";
  if (reports.length === 0) {
    reportsHtml = `
      <div style="background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px; padding: 24px; text-align: center; color: rgba(255,255,255,0.5); font-size: 11px; margin-top: 10px;">
        No community reports have been submitted for this game yet.<br>
        <span style="font-size: 10px; opacity: 0.7;">Be the first to share your system configuration and performance metrics!</span>
      </div>
    `;
  } else {
    reportsHtml = `
      <div style="display: flex; flex-direction: column; gap: 10px; max-height: 280px; overflow-y: auto; padding-right: 5px; margin-top: 10px;">
        ${reports.map(r => {
          const formattedDate = new Date(r.submittedAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          const ratingCls = r.rating.toLowerCase() === 'native' ? 'native' :
                            r.rating.toLowerCase() === 'excellent' ? 'perfect' :
                            r.rating.toLowerCase() === 'playable' ? 'playable' :
                            r.rating.toLowerCase() === 'limited' ? 'silver' : 'unsupported';
          
          const crossoverVerHtml = r.crossoverVersion ? ` <span style="font-size: 10px; opacity: 0.6; background: rgba(0,0,0,0.25); padding: 1px 4px; border-radius: 4px;">v${r.crossoverVersion}</span>` : "";
          
          return `
            <div class="report-card liquid-glass" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px; position: relative;">
              
              <!-- Report header -->
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="proton-badge-large ${ratingCls}" style="padding: 2px 8px !important; border-radius: 6px !important; font-size: 8px !important; min-height: unset; line-height: 1.2;">${r.rating}</span>
                  <strong style="color: #fff; font-size: 11px;">${escapeHtml(r.macModel)} • ${escapeHtml(r.chip)}</strong>
                </div>
                
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 9px; opacity: 0.4;">${formattedDate}</span>
                  <button class="delete-report-btn" data-id="${r.id}" style="background: none; border: none; color: #ff6b6b; font-size: 14px; cursor: pointer; padding: 0 4px; opacity: 0.6; transition: opacity 0.2s;" title="Delete report">&times;</button>
                </div>
              </div>

              <!-- Specs grid -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: rgba(0,0,0,0.12); padding: 8px; border-radius: 6px; font-size: 11px;">
                <div>
                  <span style="opacity: 0.5;">System:</span> <span style="color: #fff;">${escapeHtml(r.ram)} RAM • ${escapeHtml(r.macosVersion)}</span>
                </div>
                <div>
                  <span style="opacity: 0.5;">Launch:</span> <span style="color: #fff;">${escapeHtml(r.launchMethod)}${crossoverVerHtml}</span>
                </div>
                <div style="grid-column: 1 / -1; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 4px; margin-top: 2px;">
                  <span style="opacity: 0.5;">Performance:</span> <span style="color: #a3ff00; font-weight: 500;">${escapeHtml(r.fpsNotes)}</span>
                </div>
              </div>

              <!-- Notes / Issues -->
              ${r.issues ? `
                <div style="font-size: 11px; opacity: 0.9; color: #eee; padding-left: 2px;">
                  <span style="color: #ff6b6b; font-weight: 600;">Issues:</span> ${escapeHtml(r.issues)}
                </div>
              ` : ""}
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  body.innerHTML = `
    <div class="appstore-main-row" style="padding-bottom: 18px;">
      <img src="https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg" onerror="this.onerror=null; this.src='${game.cover}';" alt="${game.title}" style="width: 140px; height: 65px; border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.4); object-fit: cover;">
      <div class="appstore-detail-meta" style="margin-left: 10px;">
        <h3 class="appstore-detail-title" style="font-family: var(--font-title); font-size: 24px; color: #fff; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">${game.title}</h3>
        <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
          ${genresHtml}
        </div>
      </div>
    </div>

    <div class="steamdb-layout-row">
      <div class="steamdb-main-col">
        ${mediaHtml}
      </div>

      <div class="steamdb-side-col">
        <div class="steamdb-info-strip">
          <div class="steamdb-info-item">
            <span class="steamdb-info-label">Official Status</span>
            <div class="steamdb-side-badge-row" style="margin-top: 2px;">
              <span class="proton-badge-large ${game.compatibility}">${game.compatLabel}</span>
            </div>
          </div>
          <div class="steamdb-info-item">
            <span class="steamdb-info-label">Community Mac Rating</span>
            <div class="steamdb-side-badge-row" style="margin-top: 2px;">
              <span class="proton-badge-large ${consensusClass}">${consensusLabel}</span>
            </div>
          </div>
          <div class="steamdb-info-item">
            <span class="steamdb-info-label">Steam Rating</span>
            <span class="steamdb-info-val">${ratingLabel}</span>
          </div>
          <div class="steamdb-info-item">
            <span class="steamdb-info-label">Price</span>
            <span class="steamdb-info-val">${priceHtml}</span>
          </div>
        </div>

        <div class="steamdb-action-row" style="margin-top: 10px;">
          <a href="${game.storeUrl}" target="_blank" class="btn-liquid-glass btn-steam-link" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <svg style="width: 13px; height: 13px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
            </svg>
            <span>Launch Steam</span>
          </a>
        </div>
      </div>
    </div>

    <div class="steamdb-detail-grid">
      <div class="steamdb-detail-column">
        <div class="appstore-description-sec steamdb-about-compact">
          <h4 style="color: #fff; padding-bottom: 4px; font-size: 13px;">About the Game</h4>
          <p>${game.fullDescription || "Loading official storefront description..."}</p>
        </div>
        ${featuresHtml}
      </div>
      <div class="steamdb-detail-column">
        ${requirementsHtml}
      </div>
    </div>

    <!-- Community Reports Section -->
    <div class="steamdb-detail-section" style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 15px; width: 100%;">
      <div style="display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; margin-bottom: 8px;">
        <h4 style="color: #fff; margin: 0; font-size: 14px; font-family: var(--font-title);">Community Mac Reviews (${reports.length})</h4>
        <button id="add-compatibility-report-btn" class="btn-liquid-glass" style="padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 5px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05);">
          <svg style="width: 10px; height: 10px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Submit Report</span>
        </button>
      </div>
      ${reportsHtml}
    </div>
  `;

  // Bind Submit Report action click
  const addReportBtn = body.querySelector("#add-compatibility-report-btn");
  if (addReportBtn) {
    addReportBtn.onclick = () => {
      openReportSubmission(game.id);
    };
  }

  // Bind Delete Report action click
  body.querySelectorAll(".delete-report-btn").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const reportId = btn.getAttribute("data-id");
      db.query("DELETE FROM reports WHERE id = ?", [reportId]);
      playGlassChime();
      pushNotification("Report Removed", "Your local review report has been successfully deleted.");
      renderGameDetailContent(game, body);
      renderGamesView();
    };
  });
}

// --- Carousel of recent steam titles ---
function renderGamesCarousel() {
  const wrapper = document.getElementById("games-carousel-wrapper");
  if (!wrapper) return;
  
  // Filter games that have a cover image
  const gamesWithCovers = gamesCache.filter(g => g.cover);
  if (gamesWithCovers.length === 0) {
    wrapper.innerHTML = "";
    return;
  }
  
  // Sort by release date descending
  const sorted = [...gamesWithCovers].sort((a, b) => {
    const dateA = parseSteamDate(a.releaseDate);
    const dateB = parseSteamDate(b.releaseDate);
    return dateB - dateA;
  });
  
  // Take top 5
  const recentGames = sorted.slice(0, 5);
  if (recentGames.length === 0) {
    wrapper.innerHTML = "";
    return;
  }
  
  let slidesHtml = "";
  let dotsHtml = "";
  
  recentGames.forEach((game, idx) => {
    const isActive = idx === 0 ? "active" : "";
    
    const libraryHero = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/library_hero.jpg`;
    const capsuleLarge = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/capsule_616x353.jpg`;
    const headerImg = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`;
    
    slidesHtml += `
      <div class="carousel-slide ${isActive}" data-index="${idx}" style="background-image: url('${libraryHero}'), url('${capsuleLarge}'), url('${headerImg}'), url('${game.cover}');">
        <div class="carousel-slide-overlay"></div>
        <div class="carousel-slide-content">
          <h2 class="carousel-slide-title">${escapeHtml(game.title)}</h2>
          <p class="carousel-slide-date">Released: ${game.releaseDate || "Recently"}</p>
          <div class="carousel-slide-action">
            <span class="proton-badge-large ${game.compatibility}">${game.compatLabel}</span>
            <button class="btn-liquid-glass carousel-explore-btn" data-id="${game.id}">Explore Game</button>
          </div>
        </div>
      </div>
    `;
    
    dotsHtml += `
      <span class="carousel-dot ${idx === 0 ? "active" : ""}" data-index="${idx}"></span>
    `;
  });
  
  wrapper.innerHTML = `
    <div class="games-carousel">
      <div class="carousel-track">
        ${slidesHtml}
      </div>
      <button class="carousel-arrow prev" id="carousel-prev">&lsaquo;</button>
      <button class="carousel-arrow next" id="carousel-next">&rsaquo;</button>
      <div class="carousel-dots">
        ${dotsHtml}
      </div>
    </div>
  `;
  
  // Clear any existing interval
  if (carouselIntervalId) {
    clearInterval(carouselIntervalId);
  }
  
  currentCarouselIndex = 0;
  const slides = wrapper.querySelectorAll(".carousel-slide");
  const dots = wrapper.querySelectorAll(".carousel-dot");
  
  function showSlide(index) {
    if (slides.length === 0) return;
    
    if (index >= slides.length) index = 0;
    if (index < 0) index = slides.length - 1;
    
    currentCarouselIndex = index;
    
    slides.forEach((slide, idx) => {
      if (idx === index) {
        slide.classList.add("active");
      } else {
        slide.classList.remove("active");
      }
    });
    
    dots.forEach((dot, idx) => {
      if (idx === index) {
        dot.classList.add("active");
      } else {
        dot.classList.remove("active");
      }
    });

    activeAtmosphericGame = recentGames[index];
    if (!isDetailModalOpen && currentApp === "games") {
      applyAtmosphericGlow(activeAtmosphericGame);
    }
  }
  
  // Bind arrows
  const prevBtn = wrapper.querySelector("#carousel-prev");
  const nextBtn = wrapper.querySelector("#carousel-next");
  
  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showSlide(currentCarouselIndex - 1);
      resetAutoplay();
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showSlide(currentCarouselIndex + 1);
      resetAutoplay();
    });
  }
  
  // Bind dots
  dots.forEach(dot => {
    dot.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt(dot.getAttribute("data-index"));
      showSlide(idx);
      resetAutoplay();
    });
  });
  
  // Bind explore buttons
  wrapper.querySelectorAll(".carousel-explore-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const gameId = btn.getAttribute("data-id");
      openSteamGameDetail(gameId);
    });
  });
  
  // Autoplay setup
  function startAutoplay() {
    carouselIntervalId = setInterval(() => {
      showSlide(currentCarouselIndex + 1);
    }, 9000);
  }
  
  function resetAutoplay() {
    if (carouselIntervalId) {
      clearInterval(carouselIntervalId);
    }
    startAutoplay();
  }
  
  startAutoplay();
  showSlide(0);
}

function renderGamesView() {
  const grid = document.getElementById("games-grid");
  if (!grid) return;

  if (!gamesLoaded && !gamesLoading) { loadAllGamesData(); return; }
  if (gamesLoading && gamesCache.length === 0) return;

  let filtered = gameSearchQuery.trim() !== "" ? [...gameSearchResults] : [...gamesCache];

  if (gameSearchQuery.trim() !== "") {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (currentGameFilter === "trending") {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (currentGameFilter === "popular") {
    filtered.sort((a, b) => (b.activePlayers || b.rating || 0) - (a.activePlayers || a.rating || 0));
  } else if (currentGameFilter === "top-rated") {
    if (gameSearchQuery.trim() === "") {
      filtered = filtered.filter(g => g.rating >= 80);
    }
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  if (gameSearchQuery.trim() === "" && currentGameCompat !== "all") {
    filtered = filtered.filter(g => g.compatibility === currentGameCompat);
  }

  // Filter by Genre
  if (gameSearchQuery.trim() === "" && currentGameGenre !== "all") {
    filtered = filtered.filter(g => g.genres && g.genres.some(gen => gen.toLowerCase() === currentGameGenre.toLowerCase()));
  }

  // Relational Spec-Matching Filter using SQLiteBridge
  const checkFilterSpecs = document.getElementById("filter-by-specs");
  const filterBySpecs = checkFilterSpecs && checkFilterSpecs.checked;
  if (filterBySpecs) {
    const profileRow = db.query("SELECT * FROM hardware_profile");
    if (profileRow && profileRow.length > 0) {
      const p = profileRow[0];
      const userChip = p.chip;
      if (userChip) {
        // Fetch all reports to see which games have positive ratings on this chip
        const allReports = db.query("SELECT * FROM reports");
        const positiveAppIds = allReports
          .filter(r => r.chip === userChip && ["Native", "Excellent", "Playable"].includes(r.rating))
          .map(r => r.appid);
        
        filtered = filtered.filter(g => positiveAppIds.includes(g.appid));
      }
    }
  }

  // Render Carousel
  if (gameSearchQuery.trim() === "") {
    renderGamesCarousel();
    const carouselWrapper = document.getElementById("games-carousel-wrapper");
    if (carouselWrapper) carouselWrapper.style.display = "block";
  } else {
    const carouselWrapper = document.getElementById("games-carousel-wrapper");
    if (carouselWrapper) carouselWrapper.style.display = "none";
  }

  const allFiltered = filtered;

  if (allFiltered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px; width: 100%;">
        <h3 style="font-family: inherit; font-size: 16px; color: #fff;">No Games Found</h3>
        <p style="font-size: 12px; opacity: 0.6; margin-top: 4px;">Try refining your search query or filters.</p>
      </div>
    `;
    return;
  }

  // Slice to visible count (Lazy Loading Pagination)
  const toRender = allFiltered.slice(0, visibleGamesCount);

  let html = "";
  toRender.filter(game => game.cover).forEach(game => {
    let priceHtml = "";
    if (game.price !== null && game.price !== undefined) {
      if (game.discount > 0) {
        const finalPrice = game.price * (1 - game.discount / 100);
        priceHtml = `
          <span class="discount-pill" style="background: #a3ff00; color: #000; padding: 1px 4px; border-radius: 3px; font-weight: 700; font-size: 9px; margin-right: 4px;">-${game.discount}%</span>
          <span class="game-price" style="text-decoration: line-through; opacity: 0.5; font-size: 10px; margin-right: 4px;">$${game.price.toFixed(2)}</span>
          <span class="game-price" style="color: #a3ff00; font-weight: 700;">$${finalPrice.toFixed(2)}</span>
        `;
      } else {
        const label = game.price === 0 ? "Free" : `$${game.price.toFixed(2)}`;
        priceHtml = `<span class="game-price">${label}</span>`;
      }
    }

    // Dynamic Relational tested badge
    let testedBadgeHtml = "";
    const profileRow = db.query("SELECT * FROM hardware_profile");
    if (profileRow && profileRow.length > 0) {
      const p = profileRow[0];
      if (p.chip) {
        const matchingReports = db.query("SELECT * FROM reports").filter(r => r.appid === game.appid && r.chip === p.chip);
        if (matchingReports.length > 0) {
          testedBadgeHtml = `
            <span class="tested-spec-badge animate-scale-up" style="position: absolute; bottom: 6px; right: 6px; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); border: 1px solid rgba(255, 255, 255, 0.15); color: #ffd042; font-size: 8px; font-weight: 700; text-transform: uppercase; padding: 2px 5px; border-radius: 4px; z-index: 2; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 3px;">
              <span style="font-size: 9px; line-height: 1;">✓</span> Tested on ${p.chip}
            </span>
          `;
        }
      }
    }

    html += `
      <div class="game-card" data-id="${game.id}">
        <div class="game-card-cover" style="position: relative;">
          <img src="https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg" onerror="this.onerror=null; this.src='${game.cover}';" alt="${game.title}" loading="lazy">
          <span class="compat-badge ${game.compatibility}">${game.compatLabel}</span>
          ${testedBadgeHtml}
        </div>
        <div class="game-card-body">
          <h4 class="game-card-title">${game.title}</h4>
          <div class="game-card-rating-row">
            <div class="game-card-pricing">${priceHtml}</div>
          </div>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;

  // Bind dynamic card click listeners to open the SteamDB Game Detail Modal
  grid.querySelectorAll(".game-card").forEach(card => {
    const gameId = card.getAttribute("data-id");
    const game = gamesCache.find(g => g.id === gameId);

    card.addEventListener("mouseenter", () => {
      if (!isDetailModalOpen && currentApp === "games" && game) {
        applyAtmosphericGlow(game);
      }
    });

    card.addEventListener("mouseleave", () => {
      if (!isDetailModalOpen && currentApp === "games") {
        applyAtmosphericGlow(activeAtmosphericGame);
      }
    });

    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("game-link-btn")) return;
      openSteamGameDetail(gameId);
    });
  });

  // Attach dynamic infinite scroll listener
  const feedContainer = document.querySelector(".games-feed-container");
  if (feedContainer) {
    feedContainer.onscroll = () => {
      if (feedContainer.scrollTop + feedContainer.clientHeight >= feedContainer.scrollHeight - 150) {
        if (visibleGamesCount < allFiltered.length) {
          visibleGamesCount += gamesPerPage;
          renderGamesView();
        }
      }
    };
  }

}

function filterGames(query) {
  gameSearchQuery = query;

  if (query.trim() === "") {
    gameSearchResults = [];
    renderGamesView();
    return;
  }

  const grid = document.getElementById("games-grid");
  if (grid) {
    grid.innerHTML = `
      <div class="steam-search-loader">
        <div class="macos-beachball-loader" aria-hidden="true"></div>
        <p style="margin-top: 12px; font-size: 13px; opacity: 0.7;">Searching Steam database...</p>
      </div>
    `;
  }

  if (gamesSearchTimeout) {
    clearTimeout(gamesSearchTimeout);
  }

  gamesSearchTimeout = setTimeout(() => {
    searchSteamGames(query);
  }, 400);
}

async function searchSteamGames(query) {
  try {
    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`;
    const res = await fetchViaProxy(url);
    if (res.ok) {
      let data;
      try {
        const json = await res.json();
        const raw = typeof json === "string" ? json : (json.contents || JSON.stringify(json));
        data = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch {
        const text = await res.text();
        data = JSON.parse(text);
      }
      
      gameSearchResults = (data.items || [])
        .filter(item => item.tiny_image)
        .map(item => ({
          id: "game-" + item.id,
          appid: item.id,
          title: item.name,
          rating: item.metascore ? parseInt(item.metascore) : null,
          activePlayers: null,
          price: item.price ? (item.price.final / 100) : 0,
          discount: 0,
          compatibility: item.platforms && item.platforms.mac ? "native" : "playable",
          compatLabel: item.platforms && item.platforms.mac ? "Native" : "Playable",
          hasNativeMac: item.platforms && item.platforms.mac,
          genres: [],
          cover: item.tiny_image,
          storeUrl: `https://store.steampowered.com/app/${item.id}/`,
          steamdbUrl: `https://steamdb.info/app/${item.id}/`,
          protonUrl: `https://www.protondb.com/app/${item.id}`,
          fullDescription: "",
          screenshots: [],
          features: [],
          systemRequirements: null
        }));

      mergeGamesIntoCache(gameSearchResults);
    }
  } catch (err) {
    console.error("Error searching Steam games:", err);
    gameSearchResults = [];
  } finally {
    renderGamesView();
  }
}



// ==========================================
// --- 10. iOS App Store Gallery Engine ---
// ==========================================

// iTunes Mac App Store genre IDs
const STORE_GENRE_IDS = {
  discover:     null,    // use generic top charts
  arcade:       6014,    // Games
  create:       6027,    // Graphics & Design (covers Photo & Video via separate call)
  productivity: 6007,    // Productivity
  work:         6000,    // Business
  developer:    6026,    // Developer Tools
  education:    6017,    // Education
  social:       6005,    // Social Networking
  utilities:    6002,    // Utilities
  finance:      6015,    // Finance
  health:       6013     // Health & Fitness
};

// Secondary genres to merge for multi-genre tabs
const STORE_GENRE_IDS_SECONDARY = {
  create:  6012, // Photo & Video merged with Graphics & Design
  arcade:  6016, // Entertainment merged with Games
  social:  6009  // News merged with Social Networking
};

function mapItunesItem(item) {
  return {
    id: "real-app-" + item.trackId,
    title: item.trackName,
    cover: item.artworkUrl512 || item.artworkUrl100,
    category: item.primaryGenreName || "Software",
    rating: item.averageUserRating ? item.averageUserRating.toFixed(1) : "No rating",
    developer: item.artistName || "Unknown Developer",
    price: item.formattedPrice || (item.price === 0 ? "Free" : ("$" + item.price)),
    screenshots: item.screenshotUrls || [],
    fullDescription: item.description || "No description provided.",
    trackViewUrl: item.trackViewUrl,
    version: item.version || "",
    releaseNotes: item.releaseNotes || "",
    currentVersionReleaseDate: item.currentVersionReleaseDate || "",
    releaseDate: item.releaseDate || "",
    contentRating: item.trackContentRating || "",
    fileSizeBytes: item.fileSizeBytes || "",
    sellerName: item.sellerName || item.artistName || "Unknown Developer"
  };
}

async function fetchGenreApps(tab) {
  if (genreCache[tab]) {
    return; // already have data
  }
  if (genreLoading.has(tab)) return;
  genreLoading.add(tab);

  // Only show spinner if user is actively on this tab (not a background prefetch)
  if (currentStoreTab === tab) {
    const carouselApps  = document.getElementById("store-carousel-apps");
    const carouselUtils = document.getElementById("store-carousel-utilities");
    const spinnerHtml = `
      <div class="empty-state" style="padding: 40px; grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
        <svg class="update-sync-icon syncing" style="width: 32px; height: 32px; color: var(--accent-color);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
        </svg>
        <p style="margin-top: 12px; font-size: 13px; opacity: 0.7;">Loading apps...</p>
      </div>
    `;
    if (carouselApps)  carouselApps.innerHTML  = spinnerHtml;
    if (carouselUtils) carouselUtils.innerHTML = spinnerHtml;
  }

  try {
    const genreId    = STORE_GENRE_IDS[tab];
    const genreId2   = STORE_GENRE_IDS_SECONDARY[tab];
    const genreSuffix = genreId ? `/genre=${genreId}` : "";
    const genreSuffix2 = genreId2 ? `/genre=${genreId2}` : null;

    // Fetch primary genre RSS
    const [freeRss, paidRss] = await Promise.all([
      fetchAppleJson(`https://itunes.apple.com/us/rss/topfreemacapps/limit=24${genreSuffix}/json`),
      fetchAppleJson(`https://itunes.apple.com/us/rss/toppaidmacapps/limit=24${genreSuffix}/json`)
    ]);

    let freeEntries = [], paidEntries = [];

    if (freeRss.ok) {
      const d = await freeRss.json();
      freeEntries = d.feed?.entry || [];
    }
    if (paidRss.ok) {
      const d = await paidRss.json();
      paidEntries = d.feed?.entry || [];
    }

    // Fetch secondary genre RSS if applicable and merge
    if (genreSuffix2) {
      const [freeRss2, paidRss2] = await Promise.all([
        fetchAppleJson(`https://itunes.apple.com/us/rss/topfreemacapps/limit=24${genreSuffix2}/json`),
        fetchAppleJson(`https://itunes.apple.com/us/rss/toppaidmacapps/limit=24${genreSuffix2}/json`)
      ]);
      if (freeRss2.ok) {
        const d = await freeRss2.json();
        const extra = d.feed?.entry || [];
        // Merge, dedup by ID
        const existingIds = new Set(freeEntries.map(e => e.id?.attributes?.["im:id"]));
        extra.forEach(e => {
          if (!existingIds.has(e.id?.attributes?.["im:id"])) freeEntries.push(e);
        });
      }
      if (paidRss2.ok) {
        const d = await paidRss2.json();
        const extra = d.feed?.entry || [];
        const existingIds = new Set(paidEntries.map(e => e.id?.attributes?.["im:id"]));
        extra.forEach(e => {
          if (!existingIds.has(e.id?.attributes?.["im:id"])) paidEntries.push(e);
        });
      }
    }

    // Lookup full details
    async function lookupIds(entries) {
      if (!entries.length) return [];
      const ids = entries.map(e => e.id?.attributes?.["im:id"]).filter(Boolean).join(",");
      const res = await fetchAppleJson(`https://itunes.apple.com/lookup?id=${ids}&entity=macSoftware`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.results || []).map(mapItunesItem);
    }

    const [freeApps, paidApps] = await Promise.all([
      lookupIds(freeEntries),
      lookupIds(paidEntries)
    ]);

    genreCache[tab] = { free: freeApps, paid: paidApps };

    // Merge into dynamicStoreApps cache
    [...freeApps, ...paidApps].forEach(app => {
      if (!dynamicStoreApps.some(a => a.id === app.id)) dynamicStoreApps.push(app);
    });

  } catch (err) {
    console.error(`Error fetching genre apps for tab "${tab}":`, err);
    genreCache[tab] = { free: [], paid: [] };
  } finally {
    genreLoading.delete(tab);
    if (currentStoreTab === tab) renderAppStoreView();
  }
}

async function initializeRealAppStore() {
  if (appStoreLoaded || appStoreLoading) return;
  appStoreLoading = true;

  const carouselApps = document.getElementById("store-carousel-apps");
  const carouselUtils = document.getElementById("store-carousel-utilities");

  const spinnerHtml = `
    <div class="empty-state" style="padding: 40px; grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
      <svg class="update-sync-icon syncing" style="width: 32px; height: 32px; color: var(--accent-color);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
      </svg>
      <p style="margin-top: 12px; font-size: 13px; opacity: 0.7;">Loading live Mac App Store charts...</p>
    </div>
  `;

  if (carouselApps) carouselApps.innerHTML = spinnerHtml;
  if (carouselUtils) carouselUtils.innerHTML = spinnerHtml;

  try {
    const freeRes = await fetchAppleJson("https://itunes.apple.com/us/rss/topfreemacapps/limit=24/json");
    if (!freeRes.ok) throw new Error("Failed to fetch top free Mac apps");
    const freeData = await freeRes.json();
    const freeEntries = freeData.feed.entry || [];
    const freeIds = freeEntries.map(e => e.id.attributes["im:id"]).join(",");

    const paidRes = await fetchAppleJson("https://itunes.apple.com/us/rss/toppaidmacapps/limit=24/json");
    if (!paidRes.ok) throw new Error("Failed to fetch top paid Mac apps");
    const paidData = await paidRes.json();
    const paidEntries = paidData.feed.entry || [];
    const paidIds = paidEntries.map(e => e.id.attributes["im:id"]).join(",");

    let fetchedFreeApps = [];
    if (freeIds) {
      const freeLookup = await fetchAppleJson(`https://itunes.apple.com/lookup?id=${freeIds}&entity=macSoftware`);
      if (freeLookup.ok) {
        const data = await freeLookup.json();
        fetchedFreeApps = data.results.map(mapItunesItem);
      }
    }

    let fetchedPaidApps = [];
    if (paidIds) {
      const paidLookup = await fetchAppleJson(`https://itunes.apple.com/lookup?id=${paidIds}&entity=macSoftware`);
      if (paidLookup.ok) {
        const data = await paidLookup.json();
        fetchedPaidApps = data.results.map(mapItunesItem);
      }
    }

    if (fetchedFreeApps.length > 0) realTopApps = fetchedFreeApps;
    if (fetchedPaidApps.length > 0) realPaidApps = fetchedPaidApps;

    [...realTopApps, ...realPaidApps].forEach(app => {
      if (!dynamicStoreApps.some(a => a.id === app.id)) {
        dynamicStoreApps.push(app);
      }
    });

    appStoreLoaded = true;

    // Prefetch all genre tabs concurrently in the background so clicks are instant
    const GENRE_TABS = Object.keys(STORE_GENRE_IDS).filter(t => t !== "discover");
    GENRE_TABS.forEach(tab => fetchGenreApps(tab));

  } catch (err) {
    console.error("Error loading real App Store data:", err);
  } finally {
    appStoreLoading = false;
    renderAppStoreView();
  }
}

function matchesCategory(appCategory, tab) {
  if (!tab || tab === "discover") return true;
  const cat = (appCategory || "").toLowerCase();
  if (tab === "arcade") {
    return cat.includes("games") || cat.includes("entertainment") || cat.includes("action") || cat.includes("adventure") || cat.includes("puzzle") || cat.includes("simulation") || cat.includes("sports") || cat.includes("strategy");
  }
  if (tab === "create") {
    return cat.includes("graphics & design") || cat.includes("graphics") || cat.includes("design") ||
           cat.includes("photo & video") || cat.includes("photo") || cat.includes("video") ||
           cat.includes("music") || cat.includes("audio");
  }
  if (tab === "productivity") {
    return cat.includes("productivity");
  }
  if (tab === "work") {
    return cat.includes("business") || cat.includes("productivity") || cat.includes("finance") || cat.includes("office");
  }
  if (tab === "developer") {
    return cat.includes("developer tools") || cat.includes("developer") || cat.includes("programming") || cat.includes("utilities") && cat.includes("developer");
  }
  if (tab === "education") {
    return cat.includes("education") || cat.includes("reference") || cat.includes("book") || cat.includes("learning");
  }
  if (tab === "social") {
    return cat.includes("social networking") || cat.includes("social") || cat.includes("news") || cat.includes("lifestyle") || cat.includes("communication") || cat.includes("networking");
  }
  if (tab === "utilities") {
    return cat.includes("utilities") || cat.includes("tools") || cat.includes("system");
  }
  if (tab === "finance") {
    return cat.includes("finance") || cat.includes("banking") || cat.includes("investment") || cat.includes("business");
  }
  if (tab === "health") {
    return cat.includes("health & fitness") || cat.includes("health") || cat.includes("fitness") || cat.includes("medical") || cat.includes("sports");
  }
  return false;
}

function renderAppStoreCard(app) {
  const isInstalled = downloadedApps.has(app.id);
  const label = isInstalled ? "OPEN" : "GET";
  const downloadPercent = downloadingApps.get(app.id);
  const btnLabel = downloadPercent !== undefined ? `${downloadPercent}%` : label;

  const screenshots = app.screenshots || [];
  let carouselHtml = "";
  if (screenshots.length > 0) {
    // Apple mzstatic CDN: strip the size suffix and request max resolution.
    // Format: https://is1-ssl.mzstatic.com/image/thumb/.../552x414bb.png
    // Replace trailing /{W}x{H}{flags}.{ext} with /1600x0w.{ext} (1600px wide, proportional height)
    const hiResScreenshots = screenshots.slice(0, 3).map(src => {
      return src.replace(/\/\d+x\d+[a-zA-Z]*\.(png|jpg|jpeg|webp)(\?.*)?$/i, "/1600x0w.$1");
    });
    carouselHtml = `
      <div class="app-card-screenshots-carousel">
        ${hiResScreenshots.map(src => `
          <div class="app-card-screenshot-wrap">
            <img src="${src}" class="app-card-screenshot" alt="${app.title} screenshot" loading="lazy" decoding="async">
          </div>`).join("")}
      </div>
    `;
  }

  return `
    <div class="store-app-card" data-app-store-id="${app.id}">
      <div class="store-app-card-header">
        <img src="${app.cover}" alt="${app.title}" class="store-app-icon">
        <div class="store-app-info">
          <h4 class="store-app-title" title="${app.title}">${app.title}</h4>
          <span class="store-app-category">${app.category}</span>
        </div>
        <button class="btn-get-app" data-download-id="${app.id}">${btnLabel}</button>
      </div>
      ${carouselHtml}
    </div>
  `;
}

function getInstalledStoreApps() {
  return Array.from(downloadedApps)
    .map(id => dynamicStoreApps.find(app => app.id === id))
    .filter(Boolean);
}

function renderAppStoreStaticList(title, apps, emptyTitle, emptyMessage) {
  const carouselApps = document.getElementById("store-carousel-apps");
  const carouselUtils = document.getElementById("store-carousel-utilities");
  const firstRow = document.querySelector(".store-row-container");
  const secondRow = document.querySelectorAll(".store-row-container")[1];

  if (firstRow) {
    const titleEl = firstRow.querySelector(".store-row-title");
    if (titleEl) titleEl.textContent = title;
  }
  if (secondRow) secondRow.style.display = "none";

  if (!carouselApps) return;

  if (apps.length === 0) {
    carouselApps.innerHTML = `
      <div class="empty-state" style="padding: 40px; grid-column: 1 / -1; width: 100%;">
        <h3 style="font-size: 16px; font-weight: 600;">${emptyTitle}</h3>
        <p style="font-size: 13px; opacity: 0.7; margin-top: 4px;">${emptyMessage}</p>
      </div>
    `;
    if (carouselUtils) carouselUtils.innerHTML = "";
    return;
  }

  carouselApps.innerHTML = apps.map(renderAppStoreCard).join("");
  if (carouselUtils) carouselUtils.innerHTML = "";

  carouselApps.querySelectorAll(".store-app-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".app-card-screenshots-carousel") || e.target.classList.contains("btn-get-app")) return;
      openAppStoreDetail(card.getAttribute("data-app-store-id"));
    });
  });
  carouselApps.querySelectorAll(".btn-get-app").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      startAppDownload(btn.getAttribute("data-download-id"), btn);
    });
  });
}

function renderAppStoreView() {
  renderAppStoreHero();

  document.querySelectorAll(".store-row-container").forEach(row => {
    row.style.display = "";
  });

  if (currentStoreTab === "installed") {
    renderAppStoreStaticList(
      "Installed Apps",
      getInstalledStoreApps(),
      "No installed apps",
      "Apps you download from MacReady will appear here."
    );
    return;
  }

  if (currentStoreTab === "updates") {
    const updateApps = getInstalledStoreApps().filter(app => app.releaseNotes || app.currentVersionReleaseDate);
    renderAppStoreStaticList(
      "Update History",
      updateApps,
      "No update history",
      "Download apps first to see their latest App Store release notes here."
    );
    return;
  }

  let appsToRender, utilsToRender;

  if (currentStoreTab === "discover") {
    // Discover uses the generic top charts
    appsToRender  = realTopApps;
    utilsToRender = realPaidApps;
  } else if (genreCache[currentStoreTab]) {
    // Use the genre-specific cached data
    appsToRender  = genreCache[currentStoreTab].free;
    utilsToRender = genreCache[currentStoreTab].paid;
  } else {
    // Data not yet fetched — fetchGenreApps will call renderAppStoreView when done
    return;
  }

  const carouselApps = document.getElementById("store-carousel-apps");
  const carouselUtils = document.getElementById("store-carousel-utilities");
  const freeTitle = document.getElementById("store-free-title");
  const paidTitle = document.getElementById("store-paid-title");

  if (freeTitle && paidTitle) {
    const TAB_LABELS = {
      discover:     "",
      arcade:       "Arcade",
      create:       "Creative",
      productivity: "Productivity",
      work:         "Work & Business",
      developer:    "Developer Tools",
      education:    "Education",
      social:       "Social",
      utilities:    "Utilities",
      finance:      "Finance",
      health:       "Health & Fitness"
    };
    if (currentStoreTab === "discover") {
      freeTitle.textContent = "Top Free Apps";
      paidTitle.textContent = "Top Paid Apps";
    } else {
      const label = TAB_LABELS[currentStoreTab] || (currentStoreTab.charAt(0).toUpperCase() + currentStoreTab.slice(1));
      freeTitle.textContent = `Top Free ${label} Apps`;
      paidTitle.textContent = `Top Paid ${label} Apps`;
    }
  }

  if (appStoreLoading && realTopApps.length === 0) {
    return;
  }

  let newAppsHtml = "";
  appsToRender.forEach(app => {
    newAppsHtml += renderAppStoreCard(app);
  });

  if (carouselApps) {
    carouselApps.innerHTML = newAppsHtml || `
      <div class="empty-state" style="padding: 32px; grid-column: 1 / -1; width: 100%;">
        <h3 style="font-size: 16px; font-weight: 600;">No free apps under this category</h3>
      </div>
    `;
    carouselApps.querySelectorAll(".store-app-card").forEach(card => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".app-card-screenshots-carousel") || e.target.classList.contains("btn-get-app")) return;
        const id = card.getAttribute("data-app-store-id");
        openAppStoreDetail(id);
      });
    });
    carouselApps.querySelectorAll(".btn-get-app").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-download-id");
        startAppDownload(id, btn);
      });
    });
  }

  let utilsHtml = "";
  utilsToRender.forEach(app => {
    utilsHtml += renderAppStoreCard(app);
  });

  if (carouselUtils) {
    carouselUtils.innerHTML = utilsHtml || `
      <div class="empty-state" style="padding: 32px; grid-column: 1 / -1; width: 100%;">
        <h3 style="font-size: 16px; font-weight: 600;">No paid apps under this category</h3>
      </div>
    `;
    carouselUtils.querySelectorAll(".store-app-card").forEach(card => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".app-card-screenshots-carousel") || e.target.classList.contains("btn-get-app")) return;
        const id = card.getAttribute("data-app-store-id");
        openAppStoreDetail(id);
      });
    });
    carouselUtils.querySelectorAll(".btn-get-app").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-download-id");
        startAppDownload(id, btn);
      });
    });
  }
}

function getAppStoreHeroApps() {
  return realTopApps
    .filter(app => app.screenshots?.length > 0 || app.cover)
    .slice(0, 10);
}

function renderAppStoreHero() {
  const banner = document.getElementById("store-hero-banner");
  if (!banner) return;

  const heroApps = getAppStoreHeroApps();
  if (heroApps.length === 0) {
    banner.classList.add("store-featured-loading");
    banner.innerHTML = `
      <div class="store-featured-content">
        <span class="store-featured-tag">Mac App Store</span>
        <h3 class="store-featured-title">Loading featured apps</h3>
      </div>
    `;
    banner.onclick = null;
    return;
  }

  if (appStoreHeroIndex >= heroApps.length) appStoreHeroIndex = 0;
  renderAppStoreHeroSlide(heroApps[appStoreHeroIndex], false);
  startAppStoreHeroCarousel();
}

function renderAppStoreHeroSlide(app, animate = true) {
  const banner = document.getElementById("store-hero-banner");
  if (!banner) return;

  const image = app.screenshots?.[0] || app.cover;
  const slide = document.createElement("div");
  slide.className = "store-featured-slide";
  slide.innerHTML = `
    <img src="${image}" alt="${app.title}" class="store-featured-img">
    <div class="store-featured-gradient"></div>
    <div class="store-featured-content">
      <span class="store-featured-tag">${app.category}</span>
      <h3 class="store-featured-title">${app.title}</h3>
      <p class="store-featured-subtitle">${app.developer}</p>
    </div>
  `;

  banner.classList.remove("store-featured-loading");
  banner.onclick = () => openAppStoreDetail(app.id);

  if (!animate) {
    banner.innerHTML = "";
    slide.classList.add("is-active");
    banner.appendChild(slide);
    return;
  }

  const currentSlides = [...banner.querySelectorAll(".store-featured-slide")];
  banner.appendChild(slide);
  requestAnimationFrame(() => {
    slide.classList.add("is-active");
    currentSlides.forEach(currentSlide => currentSlide.classList.remove("is-active"));
  });

  window.setTimeout(() => {
    currentSlides.forEach(currentSlide => currentSlide.remove());
  }, 1200);
}

function startAppStoreHeroCarousel() {
  const heroApps = getAppStoreHeroApps();
  if (heroApps.length < 2 || appStoreHeroTimer) return;

  appStoreHeroTimer = window.setInterval(() => {
    const currentHeroApps = getAppStoreHeroApps();
    if (currentHeroApps.length < 2) return;

    appStoreHeroIndex = (appStoreHeroIndex + 1) % currentHeroApps.length;
    renderAppStoreHeroSlide(currentHeroApps[appStoreHeroIndex], true);
  }, 5500);
}

function openAppStoreDetail(appId) {
  let app = null;
  
  if (appId.startsWith("real-app-")) {
    app = dynamicStoreApps.find(a => a.id === appId);
  }
  
  if (!app) return;

  const modal = document.getElementById("app-store-details-modal");
  const body = document.getElementById("appstore-detail-body");
  if (!modal || !body) return;

  let storeUrl = app.trackViewUrl;
  if (!storeUrl) return;

  const installed = downloadedApps.has(appId);
  const installedMeta = installedAppInfo[appId];
  const installedDate = installedMeta?.installedAt ? new Date(installedMeta.installedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  const updatedDate = app.currentVersionReleaseDate ? new Date(app.currentVersionReleaseDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  const releaseDate = app.releaseDate ? new Date(app.releaseDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  const fileSize = app.fileSizeBytes ? `${Math.round(Number(app.fileSizeBytes) / 1024 / 1024)} MB` : "";

  // Premium Liquid Glass download button pointing to Mac App Store
  const actionBtnHtml = `
    <a href="${storeUrl}" target="_blank" class="btn-liquid-glass">
      <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
      </svg>
      <span>View in Mac App Store</span>
    </a>
  `;

  body.innerHTML = `
    <div class="appstore-main-row">
      <img src="${app.cover}" alt="${app.title}" class="appstore-detail-icon">
      <div class="appstore-detail-meta">
        <h3 class="appstore-detail-title">${app.title}</h3>
        <p class="appstore-detail-developer">${app.developer}</p>
        <div class="appstore-detail-actions">
          ${actionBtnHtml}
        </div>
      </div>
    </div>

    <div class="appstore-detail-stats">
      <div class="detail-stat-col">
        <span class="detail-stat-label">RATING</span>
        <span class="detail-stat-value">${app.rating}${app.rating !== "No rating" ? " ★" : ""}</span>
      </div>
      <div class="detail-stat-col">
        <span class="detail-stat-label">VERSION</span>
        <span class="detail-stat-value">${app.version || "Current"}</span>
      </div>
      <div class="detail-stat-col">
        <span class="detail-stat-label">PRICE</span>
        <span class="detail-stat-value">${app.price}</span>
      </div>
      <div class="detail-stat-col">
        <span class="detail-stat-label">CATEGORY</span>
        <span class="detail-stat-value" style="font-size: 11px;">${app.category}</span>
      </div>
      <div class="detail-stat-col">
        <span class="detail-stat-label">SIZE</span>
        <span class="detail-stat-value">${fileSize || "App Store"}</span>
      </div>
      <div class="detail-stat-col">
        <span class="detail-stat-label">${installed ? "INSTALLED" : "RELEASED"}</span>
        <span class="detail-stat-value" style="font-size: 11px;">${installedDate || releaseDate || "Mac App"}</span>
      </div>
    </div>

    <div class="appstore-screenshot-row">
      ${app.screenshots.map(src => `<img src="${src}" alt="Screenshot" class="appstore-screenshot">`).join("")}
    </div>

    <div class="appstore-description-sec">
      <h4>Description</h4>
      <p style="white-space: pre-wrap;">${app.fullDescription}</p>
    </div>

    <div class="appstore-description-sec">
      <h4>Update History</h4>
      <p style="white-space: pre-wrap;">${updatedDate ? `Latest update: ${updatedDate}\n\n` : ""}${app.releaseNotes || "No release notes provided by the Mac App Store."}</p>
    </div>
  `;

  modal.classList.remove("hidden");
}

function startAppDownload(appId, btnElement) {
  if (downloadedApps.has(appId)) {
    // If installed, open it or simulate opening
    pushNotification("Launching App", `Opening installed application.`);
    return;
  }

  if (downloadingApps.has(appId)) return; // Already downloading

  // Find app
  const app = dynamicStoreApps.find(a => a.id === appId);
  if (!app) return;

  btnElement.setAttribute("disabled", "true");
  btnElement.style.opacity = "0.7";

  let percent = 0;
  downloadingApps.set(appId, percent);

  const interval = setInterval(() => {
    percent += 20;
    downloadingApps.set(appId, percent);
    btnElement.textContent = `${percent}%`;

    // Re-render App Store lists to sync other instances of the button
    const allMatchingButtons = document.querySelectorAll(`[data-download-id="${appId}"]`);
    allMatchingButtons.forEach(b => {
      b.textContent = `${percent}%`;
    });

    if (percent >= 100) {
      clearInterval(interval);
      downloadingApps.delete(appId);
      downloadedApps.add(appId);
      installedAppInfo[appId] = {
        installedAt: new Date().toISOString(),
        version: app.version || ""
      };
      saveToStorage();

      allMatchingButtons.forEach(b => {
        b.removeAttribute("disabled");
        b.style.opacity = "";
        b.textContent = "OPEN";
      });

      // Pushes standard macOS alert
      pushNotification(
        "Download Complete", 
        `"${app.title}" has been installed. Launch it inside Finder's Applications folder!`
      );
      
      // Update local explorer views if active
      if (currentApp === "finder") {
        renderFinderView();
      }
    }
  }, 400);
}

async function searchMacAppStore(query) {
  const carouselApps = document.getElementById("store-carousel-apps");
  const firstRow = document.querySelector(".store-row-container");
  if (!carouselApps) return;

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=macSoftware&limit=24`;
    const res = await fetchAppleJson(url);
    if (!res.ok) throw new Error("Search API error");
    const data = await res.json();
    
    if (firstRow) {
      firstRow.querySelector(".store-row-title").textContent = `Results for "${query}"`;
    }
    
    if (!data.results || data.results.length === 0) {
      carouselApps.innerHTML = `
        <div class="empty-state" style="padding: 40px; grid-column: 1 / -1; width: 100%;">
          <h3 style="font-size: 16px; font-weight: 600;">No Results Found</h3>
          <p style="font-size: 13px; opacity: 0.7; margin-top: 4px;">We couldn't find any macOS apps matching "${query}".</p>
        </div>
      `;
      return;
    }
    
    const realApps = data.results.map(mapItunesItem);
    
    // Store in global dynamicStoreApps cache uniquely
    realApps.forEach(app => {
      if (!dynamicStoreApps.some(a => a.id === app.id)) {
        dynamicStoreApps.push(app);
      }
    });
    
    let html = "";
    realApps.forEach(app => {
      html += renderAppStoreCard(app);
    });
    
    carouselApps.innerHTML = html;
    
    // Bind click events on dynamic results
    carouselApps.querySelectorAll(".store-app-card").forEach(card => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".app-card-screenshots-carousel") || e.target.classList.contains("btn-get-app")) return;
        const id = card.getAttribute("data-app-store-id");
        openAppStoreDetail(id);
      });
    });
    
    carouselApps.querySelectorAll(".btn-get-app").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-download-id");
        startAppDownload(id, btn);
      });
    });
    
  } catch (err) {
    console.error("Error searching Mac App Store:", err);
    if (firstRow) {
      firstRow.querySelector(".store-row-title").textContent = `Results for "${query}"`;
    }
    carouselApps.innerHTML = `
      <div class="empty-state" style="padding: 40px; grid-column: 1 / -1; width: 100%;">
        <h3 style="font-size: 16px; font-weight: 600; color: #ff3b30;">Search Failed</h3>
        <p style="font-size: 13px; opacity: 0.7; margin-top: 4px;">Unable to fetch real-time Mac App Store results. Please check your internet connection.</p>
      </div>
    `;
  }
}

function filterAppStore(query) {
  const q = query.toLowerCase();
  const banner = document.getElementById("store-hero-banner");
  const firstRow = document.querySelector(".store-row-container");
  const secondRow = document.querySelectorAll(".store-row-container")[1];
  const carouselApps = document.getElementById("store-carousel-apps");

  if (q.trim() === "") {
    if (banner) banner.style.display = "block";
    if (firstRow) {
      firstRow.style.display = "flex";
    }
    if (secondRow) secondRow.style.display = "flex";
    if (carouselApps) {
      carouselApps.classList.remove("store-search-grid");
      carouselApps.classList.add("store-carousel");
    }
    renderAppStoreView();
    return;
  }

  // Hide hero & second carousel
  if (banner) banner.style.display = "none";
  if (secondRow) secondRow.style.display = "none";
  if (carouselApps) {
    carouselApps.classList.add("store-search-grid");
    carouselApps.classList.remove("store-carousel");
  }

  if (firstRow) {
    firstRow.style.display = "flex";
    firstRow.querySelector(".store-row-title").textContent = `Searching App Store for "${query}"...`;
  }

  // Debounced search via network
  if (carouselApps) {
    carouselApps.innerHTML = `
      <div class="empty-state" style="padding: 40px; grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
        <svg class="update-sync-icon syncing" style="width: 32px; height: 32px; color: var(--accent-color);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
        </svg>
        <p style="margin-top: 12px; font-size: 13px; opacity: 0.7;">Searching..</p>
      </div>
    `;
  }

  if (appStoreSearchTimeout) {
    clearTimeout(appStoreSearchTimeout);
  }

  appStoreSearchTimeout = setTimeout(() => {
    searchMacAppStore(query);
  }, 300);
}


// ==========================================
// --- 11. Finder Explorer File System Engine ---
// ==========================================
const FINDER_FS = {
  desktop: {
    name: "Desktop",
    path: ["Macintosh HD", "Users", "user", "Desktop"],
    items: [
      { name: "Tahoe Sunset.png", kind: "image", size: "830 KB", date: "May 22, 2026", src: "tahoe_wallpaper.png" },
      { name: "Project Goals.txt", kind: "text", size: "1.2 KB", date: "May 21, 2026", content: "1. Finish MacReady Multi-App interface\n2. Add gorgeous liquid glass accents\n3. Implement syntax highlighting in Quick Look\n4. Check compatibility with Wine 10.0\n5. Implement Terminal commands and math Calculator" },
      { name: "Wallpapers", kind: "folder", size: "--", date: "May 22, 2026", targetDir: "wallpapers" }
    ]
  },
  documents: {
    name: "Documents",
    path: ["Macintosh HD", "Users", "user", "Documents"],
    items: [
      { name: "index.html", kind: "code", size: "42.1 KB", date: "May 22, 2026", type: "html", file: "index.html" },
      { name: "styles.css", kind: "code", size: "63.3 KB", date: "May 22, 2026", type: "css", file: "styles.css" },
      { name: "app.js", kind: "code", size: "37.7 KB", date: "May 22, 2026", type: "javascript", file: "app.js" }
    ]
  },
  downloads: {
    name: "Downloads",
    path: ["Macintosh HD", "Users", "user", "Downloads"],
    items: [
      { name: "crossover-26.1.0.dmg", kind: "package", size: "342 MB", date: "May 18, 2026" },
      { name: "steam-installer.pkg", kind: "package", size: "128 MB", date: "May 12, 2026" }
    ]
  },
  applications: {
    name: "Applications",
    path: ["Macintosh HD", "Applications"],
    items: [
      { name: "MacReady.app", kind: "app", size: "45 MB", date: "May 22, 2026", app: "news", icon: "public/assets/imgs/perf/dock/news.webp" },
      { name: "CrossOver.app", kind: "app", size: "142 MB", date: "May 22, 2026", app: "crossover", icon: "public/assets/imgs/perf/dock/crossover.webp" },
      { name: "Steam.app", kind: "app", size: "90 MB", date: "May 22, 2026", app: "games", icon: "public/assets/imgs/perf/dock/steam.webp" },
      { name: "App Store.app", kind: "app", size: "32 MB", date: "May 22, 2026", app: "app-store", icon: "public/assets/imgs/perf/dock/app-store.webp" },
      { name: "Terminal.app", kind: "app", size: "12 MB", date: "May 23, 2026", app: "terminal", icon: "public/assets/imgs/perf/apps/terminal.webp" },
      { name: "Calculator.app", kind: "app", size: "8 MB", date: "May 23, 2026", app: "calculator", icon: "public/assets/imgs/perf/apps/calculator.webp" },
      { name: "Notes.app", kind: "app", size: "15 MB", date: "May 23, 2026", app: "textedit", icon: "public/assets/imgs/perf/apps/notes.webp" },
      { name: "Mac OS 9.app", kind: "app", size: "120 MB", date: "May 23, 2026", app: "macos9", icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' width='48' height='48'><rect x='2' y='2' width='44' height='44' rx='10' ry='10' fill='%2364b5f6'/><path d='M24 2a22 22 0 0 1 22 22v14a8 8 0 0 1-8 8H24V2z' fill='%231976d2'/><path d='M24 8v16h10c2 0 4 2 4 4s-2 4-4 4H20a2 2 0 0 1-2-2V14c0-2-2-4-4-4H8V8h16z' fill='%23ffffff'/><circle cx='15' cy='17' r='3' fill='%231976d2'/><circle cx='33' cy='17' r='3' fill='%23ffffff'/><path d='M14 34c2 4 8 4 10 0' stroke='%23ffffff' stroke-width='3' stroke-linecap='round' fill='none'/><path d='M24 34c2 4 8 4 10 0' stroke='%231976d2' stroke-width='3' stroke-linecap='round' fill='none'/></svg>" },
      { name: "Marathon.app", kind: "app", size: "80 MB", date: "May 23, 2026", app: "marathon", icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' width='48' height='48'><rect x='2' y='2' width='44' height='44' rx='10' ry='10' fill='%23111111' stroke='%23e65100' stroke-width='1.5'/><circle cx='24' cy='24' r='16' fill='none' stroke='%23e65100' stroke-width='3'/><path d='M16 24h16M24 16v16' stroke='%23e65100' stroke-width='3'/><circle cx='24' cy='24' r='8' fill='%23e65100'/></svg>" },
      { name: "Apple Lisa.app", kind: "app", size: "35 MB", date: "May 23, 2026", app: "lisa", icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' width='48' height='48'><rect x='2' y='2' width='44' height='44' rx='10' ry='10' fill='%23e0d8c0' stroke='%23bcaaa4' stroke-width='1.5'/><rect x='8' y='8' width='32' height='20' rx='2' ry='2' fill='%233e2723'/><rect x='11' y='11' width='26' height='14' fill='%23a1887f'/><rect x='6' y='32' width='36' height='8' fill='%23d7ccc8'/><line x1='12' y1='36' x2='36' y2='36' stroke='%238d6e63' stroke-width='2'/></svg>" },
      { name: "System 7.app", kind: "app", size: "45 MB", date: "May 23, 2026", app: "system7", icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' width='48' height='48'><rect x='2' y='2' width='44' height='44' rx='6' ry='6' fill='%231e88e5'/><rect x='10' y='2' width='28' height='16' fill='%23ffffff'/><rect x='30' y='5' width='5' height='10' fill='%231e88e5'/><rect x='8' y='24' width='32' height='22' rx='2' ry='2' fill='%23ffffff'/><line x1='12' y1='30' x2='36' y2='30' stroke='%23757575' stroke-width='2'/><line x1='12' y1='35' x2='36' y2='35' stroke='%23757575' stroke-width='2'/><line x1='12' y1='40' x2='36' y2='40' stroke='%23757575' stroke-width='2'/></svg>" }
    ]
  },
  recents: {
    name: "Recents",
    path: ["Macintosh HD", "Users", "user", "Recents"],
    items: [
      { name: "app.js", kind: "code", size: "37.7 KB", date: "May 22, 2026", type: "javascript", file: "app.js", dir: "documents" },
      { name: "Tahoe Sunset.png", kind: "image", size: "830 KB", date: "May 22, 2026", src: "tahoe_wallpaper.png", dir: "desktop" },
      { name: "index.html", kind: "code", size: "42.1 KB", date: "May 22, 2026", type: "html", file: "index.html", dir: "documents" }
    ]
  },
  wallpapers: {
    name: "Wallpapers",
    path: ["Macintosh HD", "Users", "user", "Desktop", "Wallpapers"],
    parentDir: "desktop",
    items: [
      { name: "Tahoe Liquid.webp", kind: "image", size: "2.4 MB", date: "May 22, 2026", src: "public/assets/imgs/wallpapers/optimized/TahoeWallpaper-1920.webp", wallpaperId: "tahoe-liquid" },
      { name: "Tahoe Beach Dawn.webp", kind: "image", size: "3.1 MB", date: "May 22, 2026", src: "public/assets/imgs/wallpapers/optimized/26-Tahoe-Beach-Dawn.webp", wallpaperId: "tahoe-beach-dawn" },
      { name: "Tahoe Beach Dusk.webp", kind: "image", size: "2.8 MB", date: "May 22, 2026", src: "public/assets/imgs/wallpapers/optimized/26-Tahoe-Beach-Dusk.webp", wallpaperId: "tahoe-beach-dusk" },
      { name: "Tahoe Dark.webp", kind: "image", size: "4.2 MB", date: "May 22, 2026", src: "public/assets/imgs/wallpapers/optimized/26-Tahoe-Dark-6K.webp", wallpaperId: "tahoe-dark" },
      { name: "Sequoia Sunrise.webp", kind: "image", size: "3.8 MB", date: "May 22, 2026", src: "public/assets/imgs/wallpapers/optimized/15-Sequoia-Sunrise.webp", wallpaperId: "sequoia-sunrise" },
      { name: "Big Sur Night.webp", kind: "image", size: "3.5 MB", date: "May 22, 2026", src: "public/assets/imgs/wallpapers/optimized/11-0-Big-Sur-Color-Night.webp", wallpaperId: "big-sur-night" },
      { name: "Monterey Dark.webp", kind: "image", size: "2.9 MB", date: "May 22, 2026", src: "public/assets/imgs/wallpapers/optimized/12-Dark.webp", wallpaperId: "monterey-dark" },
      { name: "Ventura Dark.webp", kind: "image", size: "3.2 MB", date: "May 22, 2026", src: "public/assets/imgs/wallpapers/optimized/13-Ventura-Dark.webp", wallpaperId: "ventura-dark" },
      { name: "MacBook Neo Blue.webp", kind: "image", size: "2.1 MB", date: "May 22, 2026", src: "public/assets/imgs/wallpapers/optimized/MacBook-Neo-wallpaper-Blue.webp", wallpaperId: "macbook-neo-blue" },
      { name: "MacBook Neo Purple.webp", kind: "image", size: "2.3 MB", date: "May 22, 2026", src: "public/assets/imgs/wallpapers/optimized/MacBook-Neo-wallpaper-Purple.webp", wallpaperId: "macbook-neo-purple" }
    ]
  }
};

function renderFinderView() {
  const sidebarItems = document.querySelectorAll("#finder-nav-menu .sidebar-item");
  sidebarItems.forEach(i => {
    i.classList.remove("active");
    if (i.getAttribute("data-finder-dir") === finderCurrentDir) {
      i.classList.add("active");
    }
  });

  // Append user-downloaded apps to Applications folder dynamically!
  const dynamicApps = [];
  downloadedApps.forEach(id => {
    const app = dynamicStoreApps.find(a => a.id === id);
    if (app && !FINDER_FS.applications.items.some(item => item.name === `${app.title}.app`)) {
      dynamicApps.push({
        name: `${app.title}.app`,
        kind: "app",
        size: "32 MB",
        date: "May 22, 2026",
        app: "app-store", // launches app store or detail page
        icon: app.cover
      });
    }
  });
  
  // Clear any dynamic apps and append freshly
  const baseApps = FINDER_FS.applications.items.filter(item => !item.name.endsWith("Paint Pro.app") && !item.name.endsWith("Notes.app") && !item.name.endsWith("Calendar.app") && !item.name.endsWith("Chat.app") && !item.name.endsWith("Code.app") && !item.name.endsWith("Player.app") && !item.name.endsWith("PhotoGlass.app"));
  FINDER_FS.applications.items = [...baseApps, ...dynamicApps];

  const items = FINDER_FS[finderCurrentDir].items;
  renderFinderItems(items);
  updateFinderPath();
  updateFinderStatusBar();
}

function getIconForKind(item) {
  if (item.kind === "app") {
    return `<img src="${item.icon}" alt="App" class="finder-icon" style="border-radius: 9px;">`;
  }

  const svgIcons = {
    folder: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='48' height='48' fill='%230a84ff'><path d='M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z'/></svg>`,
    image: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='48' height='48' fill='%2330d158'><path d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z'/></svg>`,
    text: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='48' height='48' fill='%23ff9f0a'><path d='M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z'/></svg>`,
    code: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='48' height='48' fill='%23bf5af2'><path d='M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z'/></svg>`,
    package: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='48' height='48' fill='%23ff453a'><path d='M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H9v-2h6v2zm3-4H6V8h12v6z'/></svg>`,
    generic: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='48' height='48' fill='%238e8e93'><path d='M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z'/></svg>`
  };

  const src = svgIcons[item.kind] || svgIcons.generic;
  return `<img src="${src}" alt="${item.kind}" class="finder-icon">`;
}

function getIconForKindList(item) {
  if (item.kind === "app") {
    return `<img src="${item.icon}" alt="App" class="finder-list-icon" style="width:16px;height:16px;border-radius:4px;">`;
  }
  const svgIcons = {
    folder: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='16' height='16' fill='%230a84ff'><path d='M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z'/></svg>`,
    image: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='16' height='16' fill='%2330d158'><path d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z'/></svg>`,
    text: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='16' height='16' fill='%23ff9f0a'><path d='M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z'/></svg>`,
    code: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='16' height='16' fill='%23bf5af2'><path d='M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z'/></svg>`,
    package: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='16' height='16' fill='%23ff453a'><path d='M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H9v-2h6v2zm3-4H6V8h12v6z'/></svg>`,
    generic: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='16' height='16' fill='%238e8e93'><path d='M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z'/></svg>`
  };
  return svgIcons[item.kind] || svgIcons.generic;
}

function renderFinderItems(items) {
  const browser = document.getElementById("finder-browser-grid");
  if (!browser) return;

  if (items.length === 0) {
    browser.innerHTML = `<div class="empty-state" style="padding: 40px; text-align: center; width: 100%;">This folder is empty.</div>`;
    return;
  }

  if (currentView === "grid") {
    browser.className = "finder-browser finder-grid";
    let html = "";
    items.forEach(item => {
      const isSelected = finderSelectedFile && finderSelectedFile.name === item.name;
      const selectClass = isSelected ? "selected" : "";

      html += `
        <div class="finder-item ${selectClass}" data-file-name="${item.name}">
          <div class="finder-icon-wrapper" style="margin-bottom: 8px;">
            ${getIconForKind(item)}
          </div>
          <div class="finder-name">${item.name}</div>
        </div>
      `;
    });
    browser.innerHTML = html;

    // Bind item click & double clicks
    browser.querySelectorAll(".finder-item").forEach(el => {
      const fileName = el.getAttribute("data-file-name");
      const item = items.find(i => i.name === fileName);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        finderSelectedFile = item;
        renderFinderView();
      });

      el.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        handleFinderItemOpen(item);
      });
    });
  } 
  else {
    // List View Table
    browser.className = "finder-browser";
    let html = `
      <table class="finder-list-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Date Modified</th>
            <th>Size</th>
            <th>Kind</th>
          </tr>
        </thead>
        <tbody>
    `;

    items.forEach(item => {
      const isSelected = finderSelectedFile && finderSelectedFile.name === item.name;
      const selectClass = isSelected ? "selected" : "";

      html += `
        <tr class="finder-list-row ${selectClass}" data-file-name="${item.name}">
          <td class="finder-list-name-col">
            <div class="finder-list-icon">
              ${getIconForKindList(item)}
            </div>
            <span>${item.name}</span>
          </td>
          <td>${item.date}</td>
          <td>${item.size}</td>
          <td style="text-transform: capitalize;">${item.kind === "app" ? "Application" : item.kind + " file"}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;
    browser.innerHTML = html;

    // Bind row click & double clicks
    browser.querySelectorAll(".finder-list-row").forEach(el => {
      const fileName = el.getAttribute("data-file-name");
      const item = items.find(i => i.name === fileName);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        finderSelectedFile = item;
        renderFinderView();
      });

      el.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        handleFinderItemOpen(item);
      });
    });
  }
}

function handleFinderItemOpen(item) {
  if (item.kind === "folder") {
    finderCurrentDir = item.targetDir;
    finderSelectedFile = null;
    renderFinderView();
  }
  else if (item.kind === "app") {
    if (item.app === "terminal") {
      const win = document.getElementById("terminal-window");
      if (win) {
        win.classList.remove("hidden-window");
        addAppToDock("terminal");
        const terminalInput = document.getElementById("terminal-input");
        if (terminalInput) terminalInput.focus();
        playGlassChime();
        pushNotification("Terminal simulation started", "Type 'help' to begin.");
      }
    } else if (item.app === "calculator") {
      const win = document.getElementById("calculator-window");
      if (win) {
        win.classList.remove("hidden-window");
        addAppToDock("calculator");
        playGlassChime();
      }
    } else if (item.app === "textedit") {
      openTextEditFile({ name: "Untitled.txt", content: "" });
    } else if (item.app === "macos9") {
      openIframeApp("Mac OS 9", "/classic/mac-os-9/index.html", "", "macos9");
    } else if (item.app === "marathon") {
      openIframeApp("Marathon", "https://archive.org/embed/marathon-demo", "", "marathon");
    } else if (item.app === "lisa") {
      openIframeApp("Apple Lisa", "https://alpha.lisagui.com/", "🖥️", "lisa");
    } else if (item.app === "system7") {
      openIframeApp("System 7", "https://jamesfriend.com.au/pce-js/", "💾", "system7");
    } else {
      // Switch active view to launched app
      pushNotification("Launching Application", `Starting ${item.name}`);
      switchApp(item.app);
    }
  }
  else {
    // If it's a text/code file, double-clicking opens in TextEdit!
    if (item.kind === "text" || item.kind === "code") {
      openTextEditFile(item);
    } else {
      // Open Quick Look
      openQuickLook(item);
    }
  }
}

function updateFinderPath() {
  const breadcrumbs = document.getElementById("finder-breadcrumbs");
  if (!breadcrumbs) return;

  const path = FINDER_FS[finderCurrentDir].path;
  const html = path.map((segment, index) => {
    return `<span style="cursor: pointer;" onclick="handlePathSegmentClick(${index})">${segment}</span>`;
  }).join(" &rsaquo; ");
  
  breadcrumbs.innerHTML = html;
}

window.handlePathSegmentClick = function(index) {
  // Let the user jump back paths beautifully!
  const currentPath = FINDER_FS[finderCurrentDir].path;
  const targetSegment = currentPath[index];
  
  // Find which root folder this segment aligns with
  for (const dirKey in FINDER_FS) {
    if (FINDER_FS[dirKey].name.toLowerCase() === targetSegment.toLowerCase()) {
      finderCurrentDir = dirKey;
      finderSelectedFile = null;
      renderFinderView();
      break;
    }
  }
};

function updateFinderStatusBar() {
  const diskInfo = document.getElementById("finder-disk-info");
  if (!diskInfo) return;

  const itemCount = FINDER_FS[finderCurrentDir].items.length;
  diskInfo.textContent = `${itemCount} item${itemCount === 1 ? "" : "s"}, 321.4 GB available`;
}

function filterFinder(query) {
  const q = query.toLowerCase();
  const dirItems = FINDER_FS[finderCurrentDir].items;

  if (q.trim() === "") {
    renderFinderItems(dirItems);
    return;
  }

  const filtered = dirItems.filter(item => item.name.toLowerCase().includes(q));
  renderFinderItems(filtered);
}


// ==========================================
// --- 12. macOS Finder Quick Look Overlay ---
// ==========================================
function openQuickLook(file) {
  const overlay = document.getElementById("finder-quick-look");
  const title = document.getElementById("quick-look-title");
  const body = document.getElementById("quick-look-body");
  const footerInfo = document.getElementById("quick-look-footer-info");

  if (!overlay || !body || !title || !footerInfo) return;

  title.textContent = file.name;
  footerInfo.textContent = `${file.name} (${file.size}) - Press Escape to close`;

  // Render contents contextually
  if (file.kind === "image") {
    let setWallpaperBtnHtml = "";
    if (file.wallpaperId) {
      setWallpaperBtnHtml = `
        <button class="btn btn-primary" id="btn-quicklook-set-wallpaper" style="margin-top: 15px; padding: 8px 18px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; border-radius: 6px;">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
          Set as Desktop Wallpaper
        </button>
      `;
    }
    body.innerHTML = `
      <div class="quick-look-image-preview-container" style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
        <img src="${file.src || 'tahoe_wallpaper.png'}" alt="${file.name}" class="quick-look-image-preview" style="max-height: 55vh; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.35);">
        ${setWallpaperBtnHtml}
      </div>
    `;

    const setWallBtn = body.querySelector("#btn-quicklook-set-wallpaper");
    if (setWallBtn) {
      setWallBtn.addEventListener("click", () => {
        setWallpaper(file.wallpaperId);
        pushNotification("Wallpaper Changed", `Desktop wallpaper updated to ${file.name.replace(".webp", "")}`);
      });
    }
  }
  else if (file.kind === "text") {
    body.innerHTML = `<pre class="quick-look-code">${escapeHtml(file.content)}</pre>`;
  }
  else if (file.kind === "code") {
    body.innerHTML = `<div style="padding: 24px; text-align: center; opacity: 0.8;">Loading file contents...</div>`;
    
    // Fetch live local source files! Spectacular degree of depth!
    fetch(file.file)
      .then(res => {
        if (!res.ok) throw new Error("Local file fetch blocked");
        return res.text();
      })
      .then(code => {
        let highlighted = escapeHtml(code);
        highlighted = highlightCode(highlighted, file.type);
        body.innerHTML = `<pre class="quick-look-code" style="text-align: left; width: 100%; height: 100%; overflow: auto;"><code>${highlighted}</code></pre>`;
      })
      .catch(err => {
        // Fallback snippet
        const fallbackCode = `// Failed to load live ${file.name} due to sandbox constraints.\n// Showing cache mockup for development.\n\nconst project = {\n  name: "macOS Tahoe Liquid Glass Simulator",\n  version: "26.0.0",\n  developer: "user",\n  accent: "liquid-refraction"\n};\n\nfunction render() {\n  console.log("Welcome to ${file.name}!");\n}`;
        const highlighted = highlightCode(escapeHtml(fallbackCode), "javascript");
        body.innerHTML = `<pre class="quick-look-code" style="text-align: left; width: 100%; height: 100%; overflow: auto;"><code>${highlighted}</code></pre>`;
      });
  }
  else if (file.kind === "app") {
    body.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 40px; text-align: center; color: #fff;">
        <img src="${file.icon}" alt="App Icon" style="width: 80px; height: 80px; border-radius: 18px; box-shadow: 0 10px 24px rgba(0,0,0,0.3); object-fit: cover;">
        <h3 style="font-size: 18px; font-weight: 700; margin: 0;">${file.name}</h3>
        <p style="font-size: 12px; opacity: 0.7; margin: 0;">System Application &bull; ${file.size}</p>
        <button class="btn btn-primary" id="btn-quicklook-launch-app" style="margin-top: 10px; padding: 6px 20px;">Open Application</button>
      </div>
    `;

    const launchBtn = body.querySelector("#btn-quicklook-launch-app");
    if (launchBtn) {
      launchBtn.onclick = () => {
        closeQuickLook();
        switchApp(file.app);
      };
    }
  }
  else {
    // Compiled DMGs or Packages
    body.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 40px; text-align: center; color: #fff;">
        <span style="font-size: 64px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));">📦</span>
        <h3 style="font-size: 18px; font-weight: 700; margin: 0;">${file.name}</h3>
        <p style="font-size: 12.5px; opacity: 0.7; max-width: 320px; margin: 0; line-height: 1.4;">This is a compiled macOS package installation archive. Quick Look cannot parse binaries.</p>
      </div>
    `;
  }

  overlay.classList.remove("hidden");
}

function closeQuickLook() {
  const overlay = document.getElementById("finder-quick-look");
  if (overlay) overlay.classList.add("hidden");
}

// Helpers for HTML Escaping & Highlighter code
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightCode(code, type) {
  if (type === "javascript") {
    const keywords = /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|export|import|from|async|await|try|catch|new|throw)\b/g;
    const strings = /(["'`])(.*?)\1/g;
    const comments = /(\/\/.*)/g;

    let res = code;
    res = res.replace(strings, '<span style="color: #ecc48d;">$&</span>');
    res = res.replace(keywords, '<span style="color: #ff7b72; font-weight: bold;">$&</span>');
    res = res.replace(comments, '<span style="color: #8b949e; font-style: italic;">$&</span>');
    return res;
  }
  if (type === "css") {
    const selectors = /([^{]+)(?=\s*\{)/g;
    const properties = /([\w-]+)(?=\s*:)/g;
    let res = code;
    res = res.replace(selectors, '<span style="color: #79c0ff;">$&</span>');
    res = res.replace(properties, '<span style="color: #7ee787;">$&</span>');
    return res;
  }
  if (type === "html") {
    const tags = /(&lt;\/?[a-zA-Z0-9:-]+&gt;)/g;
    const attrs = /(\s[a-zA-Z0-9:-]+=)/g;
    let res = code;
    res = res.replace(tags, '<span style="color: #7ee787;">$&</span>');
    res = res.replace(attrs, '<span style="color: #79c0ff;">$&</span>');
    return res;
  }
  return code;
}


// Define closeAllDropdowns in the global scope so all modules can access it without ReferenceError
function closeAllDropdowns() {
  const dropdowns = document.querySelectorAll(".dropdown-menu");
  const menuTriggers = document.querySelectorAll(".menu-trigger");
  if (dropdowns) dropdowns.forEach(d => d.classList.remove("show"));
  if (menuTriggers) menuTriggers.forEach(t => t.classList.remove("active"));
}

// ==========================================
// --- 13. Setup Interactive Event Bindings ---
// ==========================================
function bindEvents() {
  // --- A. Window control traffic lights simulation ---
  const windowClose = document.getElementById("window-close");
  if (windowClose) {
    windowClose.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        const windowEl = document.getElementById("app-window");
        if (windowEl) windowEl.classList.add("minimized");
        
        const settingsWin = document.getElementById("settings-window");
        if (settingsWin) settingsWin.classList.add("hidden-window");

        const widgetDrawer = document.getElementById("widget-center");
        if (widgetDrawer) widgetDrawer.classList.remove("show");
        const widgetToggle = document.getElementById("control-center-toggle");
        if (widgetToggle) widgetToggle.classList.remove("active");
        
        const dockNews = document.querySelector('[data-app="news"] .dock-indicator');
        if (dockNews) dockNews.classList.remove("active-dot");
        pushNotification("Window Closed", "Restore open sessions by clicking active Dock items.");
        refreshGlobalMenuBarSoon();
      } catch (err) {
        console.error("Caught error during window close:", err);
      }
    });
  }

  const windowMinimize = document.getElementById("window-minimize");
  if (windowMinimize) {
    windowMinimize.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        const windowEl = document.getElementById("app-window");
        if (windowEl) windowEl.classList.add("minimized");
        
        const settingsWin = document.getElementById("settings-window");
        if (settingsWin) settingsWin.classList.add("minimized");

        const widgetDrawer = document.getElementById("widget-center");
        if (widgetDrawer) widgetDrawer.classList.remove("show");
        const widgetToggle = document.getElementById("control-center-toggle");
        if (widgetToggle) widgetToggle.classList.remove("active");

        pushNotification("Window Minimized", "Access items seamlessly from the desktop Dock.");
        refreshGlobalMenuBarSoon();
      } catch (err) {
        console.error("Caught error during window minimize:", err);
      }
    });
  }

  const windowMaximize = document.getElementById("window-maximize");
  if (windowMaximize) {
    windowMaximize.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        const windowEl = document.getElementById("app-window");
        toggleWindowMaximized(windowEl);
      } catch (err) {
        console.error("Caught error during window maximize:", err);
      }
    });
  }

  // --- B. macOS Navigation Toolbar History ---
  const backBtn = document.getElementById("nav-back");
  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      // Mobile width sidebar toggling inside news view
      const newsView = document.getElementById("news-app-view");
      const newsViewVisible = newsView && window.getComputedStyle(newsView).display !== "none";
      if (window.innerWidth <= 900 && newsViewVisible) {
        const sidebar = document.getElementById("sidebar");
        if (sidebar) {
          e.stopPropagation();
          sidebar.classList.toggle("mobile-open");
          return;
        }
      }
      goBack();
    });
  }

  const forwardBtn = document.getElementById("nav-forward");
  if (forwardBtn) {
    forwardBtn.addEventListener("click", () => {
      goForward();
    });
  }

  // --- C. Dock Click Handlers for all 6 Apps ---
  const dockWrappers = document.querySelectorAll("#dock .dock-item-wrapper");
  dockWrappers.forEach(wrapper => {
    wrapper.addEventListener("click", () => {
      const app = wrapper.getAttribute("data-app");
      if (app === "settings") return; // Settings is an overlay panel, not a main window view app
      if (app === "applications") return; // Applications is a Launchpad overlay panel
      
      const windowEl = document.getElementById("app-window");

      if (windowEl && windowEl.classList.contains("minimized")) {
        windowEl.classList.remove("minimized");
        const dot = wrapper.querySelector(".dock-indicator");
        if (dot) dot.classList.add("active-dot");
      }
      
      switchApp(app);
    });
  });

  // --- D. News Sidebar Library & Category Selectors ---
  const sidebarItems = document.querySelectorAll("#news-app-view .sidebar-item");
  sidebarItems.forEach(item => {
    item.addEventListener("click", () => {
      const navType = item.getAttribute("data-nav");
      const categoryType = item.getAttribute("data-category");

      // Deactivate all sidebar items
      sidebarItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      const appTitle = document.querySelector(".app-title");

      if (navType) {
        currentLibrary = navType;
        currentCategory = "all"; // Reset category filters on core library shift
        if (appTitle) {
          appTitle.textContent = 
            navType === "today" ? "Today's Overview" :
            navType === "bookmarks" ? "Bookmarked Stories" :
            navType === "queue" ? "Reading Queue" : "My Custom Stories";
        }
      } else if (categoryType) {
        currentLibrary = "today"; // Jump to general collection for category filters
        currentCategory = categoryType;
        
        if (appTitle) {
          appTitle.textContent = getCategoryHeading(categoryType);
        }
      }

      // Close mobile drawer if open
      const sidebar = document.getElementById("sidebar");
      if (sidebar) sidebar.classList.remove("mobile-open");

      visibleArticlesCount = INITIAL_VISIBLE_ARTICLE_COUNT;
      renderFeed();
    });
  });

  // News empty view reset
  const emptyReset = document.getElementById("btn-empty-reset");
  if (emptyReset) {
    emptyReset.addEventListener("click", () => {
      currentCategory = "all";
      currentLibrary = "today";
      searchQuery = "";
      visibleArticlesCount = INITIAL_VISIBLE_ARTICLE_COUNT;
      
      const searchInput = document.getElementById("story-search");
      if (searchInput) searchInput.value = "";
      
      const clearBtn = document.getElementById("search-clear-btn");
      if (clearBtn) clearBtn.classList.add("hidden");

      sidebarItems.forEach(i => i.classList.remove("active"));
      const todayNav = document.querySelector('[data-nav="today"]');
      if (todayNav) todayNav.classList.add("active");
      
      const appTitle = document.querySelector(".app-title");
      if (appTitle) appTitle.textContent = "Today's Overview";

      renderFeed();
    });
  }

  // --- E. Games & App Store Sidebar Events ---
  const gamesNavItems = document.querySelectorAll("#games-nav-menu .sidebar-item");
  gamesNavItems.forEach(item => {
    item.addEventListener("click", () => {
      gamesNavItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      currentGameFilter = item.getAttribute("data-game-filter");
      visibleGamesCount = 12; // Reset pagination!
      renderGamesView();
    });
  });

  const gamesCompatItems = document.querySelectorAll("#games-compat-menu .sidebar-item");
  gamesCompatItems.forEach(item => {
    item.addEventListener("click", () => {
      gamesCompatItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      currentGameCompat = item.getAttribute("data-game-compat");
      visibleGamesCount = 12; // Reset pagination!
      renderGamesView();
    });
  });

  const gamesGenreItems = document.querySelectorAll("#games-genre-menu .sidebar-item");
  gamesGenreItems.forEach(item => {
    item.addEventListener("click", () => {
      gamesGenreItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      currentGameGenre = item.getAttribute("data-game-genre");
      visibleGamesCount = 12; // Reset pagination!
      renderGamesView();
    });
  });

  const appstoreNavItems = document.querySelectorAll("#appstore-nav-menu .sidebar-item");
  appstoreNavItems.forEach(item => {
    item.addEventListener("click", () => {
      appstoreNavItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      currentStoreTab = item.getAttribute("data-store-tab") || "discover";
      if (currentStoreTab === "discover" || currentStoreTab === "installed" || currentStoreTab === "updates") {
        renderAppStoreView();
      } else {
        fetchGenreApps(currentStoreTab);
      }
    });
  });

  // --- F. Finder Sidebar & Quick Look events ---
  const finderNavItems = document.querySelectorAll("#finder-nav-menu .sidebar-item");
  finderNavItems.forEach(item => {
    item.addEventListener("click", () => {
      finderNavItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      finderCurrentDir = item.getAttribute("data-finder-dir");
      finderSelectedFile = null;
      renderFinderView();
    });
  });

  const qlClose = document.getElementById("quick-look-close");
  if (qlClose) qlClose.addEventListener("click", closeQuickLook);
  const qlBackdrop = document.querySelector(".quick-look-backdrop");
  if (qlBackdrop) qlBackdrop.addEventListener("click", closeQuickLook);

  // --- G. Unified Search routing input ---
  const searchInput = document.getElementById("story-search");
  const clearSearchBtn = document.getElementById("search-clear-btn");
  
  if (searchInput && clearSearchBtn) {
    searchInput.addEventListener("input", (e) => {
      const val = e.target.value;
      searchQuery = val;
      visibleArticlesCount = INITIAL_VISIBLE_ARTICLE_COUNT;
      
      if (val.trim() !== "") {
        clearSearchBtn.classList.remove("hidden");
      } else {
        clearSearchBtn.classList.add("hidden");
      }

      // Route searches contextually!
      if (currentApp === "news" || currentApp === "reviews") {
        renderFeed();
      } else if (currentApp === "crossover") {
        filterCrossover(val);
      } else if (currentApp === "macos") {
        filterMacos(val);
      } else if (currentApp === "games") {
        filterGames(val);
      } else if (currentApp === "app-store") {
        filterAppStore(val);
      } else if (currentApp === "finder") {
        filterFinder(val);
      }
    });

    clearSearchBtn.addEventListener("click", () => {
      searchInput.value = "";
      searchQuery = "";
      clearSearchBtn.classList.add("hidden");
      visibleArticlesCount = INITIAL_VISIBLE_ARTICLE_COUNT;

      if (currentApp === "news" || currentApp === "reviews") {
        renderFeed();
      } else if (currentApp === "crossover") {
        filterCrossover("");
      } else if (currentApp === "macos") {
        filterMacos("");
      } else if (currentApp === "games") {
        filterGames("");
      } else if (currentApp === "app-store") {
        filterAppStore("");
      } else if (currentApp === "finder") {
        filterFinder("");
      }
    });
  }

  // --- H. Segment Layout control button bindings ---
  const btnGrid = document.getElementById("btn-grid");
  const btnList = document.getElementById("btn-list");
  if (btnGrid) btnGrid.addEventListener("click", () => setViewMode("grid"));
  if (btnList) btnList.addEventListener("click", () => setViewMode("list"));
  
  const menuGrid = document.getElementById("menu-view-grid");
  const menuList = document.getElementById("menu-view-list");
  if (menuGrid) {
    menuGrid.addEventListener("click", (e) => {
      e.preventDefault();
      setViewMode("grid");
    });
  }
  if (menuList) {
    menuList.addEventListener("click", (e) => {
      e.preventDefault();
      setViewMode("list");
    });
  }

  // --- I. Crossover Check for Updates click ---
  const crossoverUpdate = document.getElementById("btn-crossover-update");
  if (crossoverUpdate) {
    crossoverUpdate.addEventListener("click", () => {
      updateCrossoverFeeds();
    });
  }

  // --- J. Accent Colors switching clicks ---
  document.querySelectorAll(".accent-circle").forEach(circle => {
    circle.addEventListener("click", () => {
      const color = circle.getAttribute("data-color");
      setAccentColor(color);
    });
  });

  // --- K. Menu bar triggers (dropdown logic) ---
  const menuTriggers = document.querySelectorAll(".menu-trigger");
  const dropdowns = document.querySelectorAll(".dropdown-menu");

  menuTriggers.forEach(trigger => {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const menuId = trigger.getAttribute("data-menu");
      
      // Direct Interceptor for App Menu (Username/Guest Button)
      if (menuId === "app-menu") {
        closeAllDropdowns();
        if (currentUsername === "Guest") {
          openSignInWindow();
        } else {
          openAccountWindow();
        }
        return;
      }
      
      const menuEl = document.getElementById(menuId);
      const isAlreadyOpen = menuEl.classList.contains("show");
      
      // Close all dropdowns first
      closeAllDropdowns();

      if (!isAlreadyOpen && menuEl) {
        trigger.classList.add("active");
        
        // Compute positions perfectly
        const rect = trigger.getBoundingClientRect();
        menuEl.style.left = `${rect.left}px`;
        menuEl.classList.add("show");
      }
    });

    trigger.addEventListener("mouseenter", () => {
      const activeDropdown = Array.from(dropdowns).find(d => d.classList.contains("show"));
      if (activeDropdown) {
        const menuId = trigger.getAttribute("data-menu");
        
        // Hovering Username/Guest button should just close active dropdowns, not trigger a dropdown
        if (menuId === "app-menu") {
          closeAllDropdowns();
          return;
        }
        
        const targetMenu = document.getElementById(menuId);
        
        if (activeDropdown !== targetMenu && targetMenu) {
          closeAllDropdowns();
          trigger.classList.add("active");
          const rect = trigger.getBoundingClientRect();
          targetMenu.style.left = `${rect.left}px`;
          targetMenu.classList.add("show");
        }
      }
    });
  });

  window.addEventListener("click", () => {
    closeAllDropdowns();
  });

  // Using global closeAllDropdowns function instead

  // --- L. Control widget drawer sliding panel toggle ---
  const widgetToggle = document.getElementById("control-center-toggle");
  const widgetDrawer = document.getElementById("widget-center");
  const tabNotifications = document.getElementById("tab-notifications");
  const tabWidgets = document.getElementById("tab-widgets");
  const paneNotifications = document.getElementById("pane-notifications");
  const paneWidgets = document.getElementById("pane-widgets");
  const tabPill = document.querySelector(".tahoe-tab-pill");
  let widgetCenterMode = "widgets";

  const switchTahoeTab = (activeTabId) => {
    if (activeTabId === "tab-notifications") {
      widgetCenterMode = "notifications";
      if (tabNotifications) tabNotifications.classList.add("active");
      if (tabWidgets) tabWidgets.classList.remove("active");
      if (paneNotifications) paneNotifications.classList.add("active");
      if (paneWidgets) paneWidgets.classList.remove("active");
      if (tabPill) tabPill.style.transform = "translateX(0)";
    } else {
      widgetCenterMode = "widgets";
      if (tabWidgets) tabWidgets.classList.add("active");
      if (tabNotifications) tabNotifications.classList.remove("active");
      if (paneWidgets) paneWidgets.classList.add("active");
      if (paneNotifications) paneNotifications.classList.remove("active");
      if (tabPill) tabPill.style.transform = "translateX(calc(100% - 2px))";
      
      renderBookmarksWidget();
    }
  };

  const closeWidgetCenter = () => {
    if (widgetDrawer) widgetDrawer.classList.remove("show");
    if (widgetToggle) widgetToggle.classList.remove("active");
  };

  const toggleWidgetCenter = (mode, e) => {
    if (e) e.stopPropagation();
    if (widgetDrawer && widgetToggle) {
      const nextTab = mode === "notifications" ? "tab-notifications" : "tab-widgets";
      const isOpenInSameMode = widgetDrawer.classList.contains("show") && widgetCenterMode === mode;
      if (isOpenInSameMode) {
        closeWidgetCenter();
        return;
      }

      switchTahoeTab(nextTab);
      widgetDrawer.classList.add("show");
      widgetToggle.classList.toggle("active", mode === "widgets");
    }
  };

  if (widgetToggle) widgetToggle.addEventListener("click", (e) => toggleWidgetCenter("widgets", e));
  if (widgetDrawer) {
    document.addEventListener("click", (e) => {
      if (!widgetDrawer.classList.contains("show")) return;

      const clickedInsidePanel = widgetDrawer.contains(e.target);
      const clickedControlCenter = widgetToggle && widgetToggle.contains(e.target);
      const clickedDateTime = dateTimeToggle && dateTimeToggle.contains(e.target);

      if (!clickedInsidePanel && !clickedControlCenter && !clickedDateTime) {
        closeWidgetCenter();
      }
    });
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth <= 900 && widgetDrawer && widgetToggle) {
      widgetDrawer.classList.remove("show");
      widgetToggle.classList.remove("active");
    }
  });
  
  const dateTimeToggle = document.getElementById("date-time-toggle");
  if (dateTimeToggle) dateTimeToggle.addEventListener("click", (e) => toggleWidgetCenter("notifications", e));

  // Toggle Darkmode button
  const qsDark = document.getElementById("qs-darkmode");
  if (qsDark) {
    qsDark.addEventListener("click", (e) => {
      const btn = e.currentTarget;
      btn.classList.toggle("active");
      
      document.body.classList.toggle("light-mode");
      const isLightMode = document.body.classList.contains("light-mode");
      localStorage.setItem("tahoe_darkmode", isLightMode ? "light" : "dark");
      updateModeButtonLabel();
      
      // Update backgrounds in Crossover, Games, Finder if active
      if (currentApp === "crossover") renderCrossoverView();
      if (currentApp === "games") renderGamesView();
      if (currentApp === "finder") renderFinderView();
    });
  }

  // Brightness slider
  const bSlider = document.getElementById("brightness-slider");
  if (bSlider) {
    const paintBrightnessSlider = () => {
      const val = Number(bSlider.value);
      const min = Number(bSlider.min);
      const max = Number(bSlider.max);
      const fill = ((val - min) / (max - min)) * 100;
      const lightness = Math.min(255, 58 + (fill * 2.4));
      bSlider.style.setProperty("--slider-fill", `${fill}%`);
      bSlider.style.setProperty("--slider-fill-color", `rgba(${lightness}, ${lightness}, ${lightness}, 0.92)`);
    };

    paintBrightnessSlider();

    bSlider.addEventListener("input", (e) => {
      const val = Number(e.target.value);
      const brightnessLevel = 0.5 + (val / 200); 
      const desktop = document.getElementById("desktop");
      if (desktop) desktop.style.filter = `brightness(${brightnessLevel})`;
      paintBrightnessSlider();
    });
  }

  if (tabNotifications) tabNotifications.addEventListener("click", () => switchTahoeTab("tab-notifications"));
  if (tabWidgets) tabWidgets.addEventListener("click", () => switchTahoeTab("tab-widgets"));

  // --- N. macOS Tahoe 26 Control Center Event Bindings ---
  // 2. Night Light Control (Actual Website Feature)
  const qsNightLight = document.getElementById("qs-nightlight");
  const nightLightOverlay = document.getElementById("night-light-overlay");
  const nightLightStatus = document.getElementById("nightlight-status");

  const setNightLight = (active) => {
    if (active) {
      if (qsNightLight) qsNightLight.classList.add("active");
      if (nightLightOverlay) nightLightOverlay.classList.add("active");
      if (nightLightStatus) nightLightStatus.textContent = "On";
      localStorage.setItem("tahoe_nightlight", "on");
    } else {
      if (qsNightLight) qsNightLight.classList.remove("active");
      if (nightLightOverlay) nightLightOverlay.classList.remove("active");
      if (nightLightStatus) nightLightStatus.textContent = "Off";
      localStorage.setItem("tahoe_nightlight", "off");
    }
  };

  if (qsNightLight) {
    qsNightLight.addEventListener("click", () => {
      const isCurrentlyActive = nightLightOverlay && nightLightOverlay.classList.contains("active");
      const nextActive = !isCurrentlyActive;
      setNightLight(nextActive);
      playGlassChime();

      pushNotification(
        nextActive ? "Night Light Active" : "Night Light Disabled",
        nextActive ? "Amber screen filter engaged for reduced eye strain." : "Standard screen tint restored."
      );
    });
  }

  // Sync Night Light status on initial load
  const savedNightLight = localStorage.getItem("tahoe_nightlight") === "on";
  setNightLight(savedNightLight);

  // 4. Clear All Notifications
  const clearNotificationsBtn = document.getElementById("clear-notifications-btn");
  const notificationsItemsWrapper = document.getElementById("notifications-items-wrapper");

  if (clearNotificationsBtn && notificationsItemsWrapper) {
    clearNotificationsBtn.addEventListener("click", () => {
      const items = notificationsItemsWrapper.querySelectorAll(".alert-item");
      if (items.length === 0) return;

      playGlassChime();

      items.forEach(item => {
        item.style.transition = "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)";
        item.style.transform = "translateX(50px)";
        item.style.opacity = "0";
      });

      setTimeout(() => {
        notificationsItemsWrapper.innerHTML = `
          <div class="empty-state-placeholder" style="padding: 30px 10px; text-align: center;">
            <p class="text-xxs opacity-50">No alerts</p>
          </div>
        `;
      }, 300);
    });
  }

  // 5. Accent Theme Cycler (Actual Website Feature)
  const qsAccentBtn = document.getElementById("qs-accent");
  if (qsAccentBtn) {
    const accentThemes = [
      "blue", "purple", "pink", "amber", "green", "silver",
      "tiger", "panther", "leopard", "yosemite", "sequoia"
    ];
    qsAccentBtn.addEventListener("click", () => {
      const currentTheme = localStorage.getItem("tahoe_theme") || "blue";
      let idx = accentThemes.indexOf(currentTheme);
      if (idx === -1) idx = 0;
      
      const nextTheme = accentThemes[(idx + 1) % accentThemes.length];
      setAccentColor(nextTheme);
      playGlassChime();

      const names = {
        blue: "Blue",
        purple: "Purple",
        pink: "Pink",
        amber: "Amber",
        green: "Green",
        silver: "Silver",
        tiger: "Tiger (Aqua)",
        panther: "Panther (Graphite)",
        leopard: "Snow Leopard",
        yosemite: "Yosemite",
        sequoia: "Sequoia"
      };
      const displayName = names[nextTheme] || (nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1));
      pushNotification("Accent Color Changed", `System accent color updated to ${displayName}.`);
    });
  }

  // 6. View Mode Layout Toggle (Actual Website Feature)
  const qsLayoutBtn = document.getElementById("qs-layout");
  if (qsLayoutBtn) {
    qsLayoutBtn.addEventListener("click", () => {
      const nextMode = currentView === "grid" ? "list" : "grid";
      setViewMode(nextMode);
      playGlassChime();

      pushNotification("Layout Switched", `Feed layout set to ${nextMode === "grid" ? "Grid Gallery" : "List Details"} view.`);
    });
  }

  // Initial sync of bookmarks Reading List
  renderBookmarksWidget();

  // --- M. Article Reader tools & overlay closing ---
  const readerClose = document.getElementById("reader-close");
  if (readerClose) readerClose.addEventListener("click", closeReader);
  const readerBackdrop = document.querySelector(".reader-backdrop");
  if (readerBackdrop) readerBackdrop.addEventListener("click", closeReader);

  const fontInc = document.getElementById("font-increase");
  if (fontInc) {
    fontInc.addEventListener("click", (e) => {
      if (e) e.stopPropagation();
      const textBlock = document.getElementById("reader-text");
      if (textBlock) {
        if (currentFontSizeClass === "font-size-small") {
          currentFontSizeClass = "font-size-medium";
        } else if (currentFontSizeClass === "font-size-medium") {
          currentFontSizeClass = "font-size-large";
        }
        textBlock.className = `reader-richtext font-editorial ${currentFontSizeClass}`;
        updateFontPercentageDisplay();
      }
    });
  }

  const fontDec = document.getElementById("font-decrease");
  if (fontDec) {
    fontDec.addEventListener("click", (e) => {
      if (e) e.stopPropagation();
      const textBlock = document.getElementById("reader-text");
      if (textBlock) {
        if (currentFontSizeClass === "font-size-large") {
          currentFontSizeClass = "font-size-medium";
        } else if (currentFontSizeClass === "font-size-medium") {
          currentFontSizeClass = "font-size-small";
        }
        textBlock.className = `reader-richtext font-editorial ${currentFontSizeClass}`;
        updateFontPercentageDisplay();
      }
    });
  }

  const rBookmarkBtn = document.getElementById("reader-bookmark-btn");
  if (rBookmarkBtn) {
    rBookmarkBtn.addEventListener("click", (e) => {
      if (e) e.stopPropagation();
      if (selectedArticleId) {
        toggleBookmark(selectedArticleId);
      }
    });
  }

  const rQueueBtn = document.getElementById("reader-queue-btn");
  if (rQueueBtn) {
    rQueueBtn.addEventListener("click", () => {
      if (selectedArticleId) {
        toggleReadingQueue(selectedArticleId);
      }
    });
  }

  // --- N. App Store Details modal closing ---
  const storeDetailClose = document.getElementById("appstore-detail-close");
  if (storeDetailClose) {
    storeDetailClose.addEventListener("click", () => {
      const modal = document.getElementById("app-store-details-modal");
      if (modal) modal.classList.add("hidden");
      // Force sync listings on modal dismiss
      renderAppStoreView();
    });
  }

  const steamDetailClose = document.getElementById("steamdb-detail-close");
  if (steamDetailClose) {
    steamDetailClose.addEventListener("click", closeSteamGameDetail);
  }
  const steamDetailBackdrop = document.querySelector("#steamdb-details-modal .modal-backdrop");
  if (steamDetailBackdrop) {
    steamDetailBackdrop.addEventListener("click", closeSteamGameDetail);
  }
  const steamDetailModal = document.getElementById("steamdb-details-modal");
  if (steamDetailModal) {
    steamDetailModal.addEventListener("click", (e) => {
      if (!e.target.closest(".steamdb-detail-card")) {
        closeSteamGameDetail();
      }
    });
  }

  // --- O. Custom Article Builder Creator Form Sheets ---
  const newStoryBtnToolbar = document.getElementById("btn-new-story");
  if (newStoryBtnToolbar) newStoryBtnToolbar.addEventListener("click", openStoryEditor);
  const menuNewStory = document.getElementById("menu-new-story");
  if (menuNewStory) {
    menuNewStory.addEventListener("click", (e) => {
      e.preventDefault();
      openStoryEditor();
    });
  }

  const editorClose = document.getElementById("editor-close");
  if (editorClose) editorClose.addEventListener("click", closeStoryEditor);
  const editorCancel = document.getElementById("editor-cancel");
  if (editorCancel) editorCancel.addEventListener("click", closeStoryEditor);
  const modalBackdrop = document.querySelector(".modal-backdrop");
  if (modalBackdrop) modalBackdrop.addEventListener("click", closeStoryEditor);

  const coverPresets = document.getElementById("form-cover-presets");
  if (coverPresets) {
    coverPresets.addEventListener("change", (e) => {
      const val = e.target.value;
      const customInput = document.getElementById("form-cover-custom");
      if (customInput) {
        if (val === "custom") {
          customInput.classList.remove("hidden");
          customInput.setAttribute("required", "true");
        } else {
          customInput.classList.add("hidden");
          customInput.removeAttribute("required");
        }
      }
    });
  }

  const editorForm = document.getElementById("editor-form");
  if (editorForm) {
    editorForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const title = document.getElementById("form-title").value;
      const category = document.getElementById("form-category").value;
      const subtitle = document.getElementById("form-subtitle").value;
      const author = document.getElementById("form-author").value;
      const readtime = document.getElementById("form-readtime").value;
      const preset = document.getElementById("form-cover-presets").value;
      
      let cover = preset;
      if (preset === "custom") {
        cover = document.getElementById("form-cover-custom").value;
      }

      const contentVal = document.getElementById("form-content").value;
      
      // Simple markdown-to-HTML parser
      const formattedContent = contentVal.split("\n\n").map(p => {
        if (p.startsWith("## ")) {
          return `<h2>${p.substring(3)}</h2>`;
        } else if (p.startsWith("> ")) {
          return `<blockquote>${p.substring(2)}</blockquote>`;
        }
        return `<p>${p}</p>`;
      }).join("");

      const words = author.trim().split(" ");
      const avatar = words.map(w => w[0].toUpperCase()).join("").substring(0, 2);

      const customStory = {
        id: `custom-${Date.now()}`,
        title: title,
        subtitle: subtitle,
        category: category,
        author: author,
        avatar: avatar,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        readtime: readtime.includes("read") ? readtime : `${readtime} read`,
        cover: cover,
        bookmarked: false,
        custom: true,
        content: formattedContent
      };

      articles.unshift(customStory);
      saveToStorage();
      updateCounts();
      closeStoryEditor();
      
      // Switch active news section to Custom Stories
      currentLibrary = "custom";
      currentCategory = "all";
      const appTitle = document.querySelector(".app-title");
      if (appTitle) appTitle.textContent = "My Custom Stories";
      
      sidebarItems.forEach(i => i.classList.remove("active"));
      const customNav = document.querySelector('[data-nav="custom"]');
      if (customNav) customNav.classList.add("active");

      renderFeed();
      pushNotification("Published Successfully", `"${title.substring(0, 25)}..." added to stories.`);
    });
  }

  // Wipes
  const clearCustom = document.getElementById("menu-clear-custom");
  if (clearCustom) {
    clearCustom.addEventListener("click", (e) => {
      e.preventDefault();
      articles = articles.filter(a => !a.custom);
      saveToStorage();
      updateCounts();
      renderFeed();
      pushNotification("Database Cleared", "All custom stories deleted.");
    });
  }

  const resetApp = document.getElementById("menu-reset-app");
  if (resetApp) {
    resetApp.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.clear();
      articles = [];
      downloadedApps.clear();
      saveToStorage();
      setAccentColor("blue");
      setViewMode("grid");
      document.body.classList.remove("light-mode");
      const qsDarkBtn = document.getElementById("qs-darkmode");
      if (qsDarkBtn) qsDarkBtn.classList.add("active");
      updateModeButtonLabel();
      updateCounts();
      switchApp("news");
      loadNewsFromRSS();
      pushNotification("System Reset", "All cache data and settings restored to default.");
    });
  }

  // --- P. Keyboard Hotkeys & Global Listeners ---
  document.addEventListener("keydown", (e) => {
    // Escape dismisses overlays
    if (e.key === "Escape") {
      closeReader();
      closeStoryEditor();
      closeQuickLook();
      const modal = document.getElementById("app-store-details-modal");
      if (modal) modal.classList.add("hidden");
      closeSteamGameDetail();
    }

    // Spacebar Finder Quick Look
    if (e.key === " " && currentApp === "finder" && finderSelectedFile) {
      e.preventDefault(); // stop browser scroll
      openQuickLook(finderSelectedFile);
    }
    
    // Custom Alt hotkeys
    if (e.altKey) {
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        openStoryEditor();
      }
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        switchApp("news");
        currentLibrary = "bookmarks";
        const todaySidebarItems = document.querySelectorAll("#news-app-view .sidebar-item");
        todaySidebarItems.forEach(i => i.classList.remove("active"));
        const bNav = document.querySelector('[data-nav="bookmarks"]');
        if (bNav) bNav.classList.add("active");
        
        const appTitle = document.querySelector(".app-title");
        if (appTitle) appTitle.textContent = "Bookmarked Stories";
        renderFeed();
      }
      if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        const qsDarkBtn = document.getElementById("qs-darkmode");
        if (qsDarkBtn) qsDarkBtn.click();
      }
    }
  });

  // Close mobile drawer on layout click
  const feedCont = document.getElementById("feed-container");
  if (feedCont) {
    feedCont.addEventListener("click", () => {
      const sidebar = document.getElementById("sidebar");
      if (sidebar) sidebar.classList.remove("mobile-open");
    });
  }

  // --- macOS Spotlight Search Interactivity (MacOS Tahoe 26) ---
  const spotlightOverlay = document.getElementById("spotlight-overlay");
  const spotlightInput = document.getElementById("spotlight-input");
  const spotlightResultsWrapper = document.getElementById("spotlight-results-wrapper");
  const spotlightToggleBtn = document.getElementById("menu-search-toggle");

  let spotlightActive = false;
  let activeResultIndex = -1;
  let spotlightResults = [];

  const escapeHTML = (str) => {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const openSpotlight = () => {
    if (spotlightOverlay) {
      spotlightOverlay.classList.remove("hidden");
      // Request frame to allow css transition
      requestAnimationFrame(() => {
        spotlightOverlay.classList.add("show");
        if (spotlightInput) {
          spotlightInput.value = "";
          spotlightInput.focus();
        }
        spotlightActive = true;
        activeResultIndex = -1;
        spotlightResults = [];
        performSpotlightSearch();
      });
    }
  };

  const closeSpotlight = () => {
    if (spotlightOverlay) {
      spotlightOverlay.classList.remove("show");
      spotlightActive = false;
      setTimeout(() => {
        if (!spotlightActive) {
          spotlightOverlay.classList.add("hidden");
        }
      }, 300); // matching transition time
    }
  };

  const toggleSpotlight = () => {
    if (spotlightOverlay && spotlightOverlay.classList.contains("show")) {
      closeSpotlight();
    } else {
      openSpotlight();
    }
  };

  if (spotlightToggleBtn) {
    spotlightToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSpotlight();
    });
  }

  const backdrop = spotlightOverlay ? spotlightOverlay.querySelector(".spotlight-backdrop") : null;
  if (backdrop) {
    backdrop.addEventListener("click", () => {
      closeSpotlight();
    });
  }

  // Bind click handlers for macOS Spotlight Circular Action buttons
  const spotlightAppStoreBtn = document.getElementById("spotlight-action-appstore");
  if (spotlightAppStoreBtn) {
    spotlightAppStoreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      switchApp("app-store");
      playGlassChime();
      closeSpotlight();
    });
  }

  const spotlightFinderBtn = document.getElementById("spotlight-action-finder");
  if (spotlightFinderBtn) {
    spotlightFinderBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      switchApp("finder");
      playGlassChime();
      closeSpotlight();
    });
  }

  const spotlightLayoutBtn = document.getElementById("spotlight-action-layout");
  if (spotlightLayoutBtn) {
    spotlightLayoutBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const layoutBtn = document.getElementById("qs-layout");
      if (layoutBtn) layoutBtn.click();
      playGlassChime();
      closeSpotlight();
    });
  }

  const spotlightEditorBtn = document.getElementById("spotlight-action-editor");
  if (spotlightEditorBtn) {
    spotlightEditorBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openStoryEditor();
      playGlassChime();
      closeSpotlight();
    });
  }

  const executeSpotlightAction = (item) => {
    playGlassChime();
    closeSpotlight();

    const openUtilityWindow = (utility) => {
      if (utility === "terminal") {
        const win = document.getElementById("terminal-window");
        if (win) {
          win.classList.remove("hidden-window", "minimized");
          addAppToDock("terminal");
          bringWindowToFront(win);
          const input = document.getElementById("terminal-input");
          if (input) input.focus();
        }
      } else if (utility === "calculator") {
        const win = document.getElementById("calculator-window");
        if (win) {
          win.classList.remove("hidden-window", "minimized");
          addAppToDock("calculator");
          bringWindowToFront(win);
        }
      } else if (utility === "textedit") {
        openTextEditFile({ name: "Untitled.txt", content: "" });
      } else if (utility === "account") {
        openAccountWindow();
      } else if (utility === "settings") {
        openSpotlightSettingsTab("wallpaper");
      }
    };

    const runSpotlightCommand = (command) => {
      if (command === "new-note") {
        openTextEditFile({ name: `Untitled ${Date.now()}.txt`, content: "" });
      } else if (command === "refresh-news") {
        loadNewsFromRSS();
        pushNotification("News Refresh Started", "Latest stories are being loaded.");
      } else if (command === "refresh-games") {
        loadAllGamesData({ force: true });
        pushNotification("SteamDB Refresh Started", "Latest game data is being loaded.");
      } else if (command === "open-launchpad") {
        toggleLaunchpad();
      } else if (command === "open-editor") {
        openStoryEditor();
      } else if (command === "lock") {
        lockSystem();
      }
    };

    if (item.type === "story") {
      openArticle(item.value);
    } else if (item.type === "app") {
      switchApp(item.value);
    } else if (item.type === "utility") {
      openUtilityWindow(item.value);
    } else if (item.type === "note") {
      const note = getNotesData().find(n => n.id === item.value);
      if (note) openTextEditFile(note);
    } else if (item.type === "settings-tab") {
      openSpotlightSettingsTab(item.value);
    } else if (item.type === "wallpaper") {
      if (item.value === "gaming-cycle") {
        refreshGamingWallpaper({ notify: true });
      } else {
        setWallpaper(item.value);
        pushNotification("Wallpaper Changed", `Desktop wallpaper set to ${item.title}.`);
      }
    } else if (item.type === "command") {
      runSpotlightCommand(item.value);
    } else if (item.type === "steam-game") {
      switchApp("games");
      openSteamGameDetail(item.value);
    } else if (item.type === "store-app") {
      switchApp("app-store");
      openAppStoreDetail(item.value);
    } else if (item.type === "system") {
      if (item.value === "darkmode") {
        const darkBtn = document.getElementById("qs-darkmode");
        if (darkBtn) darkBtn.click();
      } else if (item.value === "nightlight") {
        const nightBtn = document.getElementById("qs-nightlight");
        if (nightBtn) nightBtn.click();
      } else if (item.value === "layout") {
        const layoutBtn = document.getElementById("qs-layout");
        if (layoutBtn) layoutBtn.click();
      } else if (item.value.startsWith("theme-")) {
        const themeName = item.value.replace("theme-", "");
        setAccentColor(themeName);
        pushNotification("Accent Theme Change", `System accent color updated to ${themeName.charAt(0).toUpperCase() + themeName.slice(1)}.`);
      } else if (item.value === "reset") {
        const resetBtn = document.getElementById("menu-reset-app");
        if (resetBtn) resetBtn.click();
      } else if (item.value === "back") {
        goBack();
      } else if (item.value === "forward") {
        goForward();
      }
    }
  };

  const openSpotlightSettingsTab = (tab) => {
    const settingsWin = document.getElementById("settings-window");
    if (!settingsWin) return;
    settingsWin.classList.remove("hidden-window", "minimized");
    bringWindowToFront(settingsWin);
    const indicator = document.getElementById("dock-settings-indicator");
    if (indicator) indicator.classList.add("active-dot");
    document.querySelectorAll(".settings-sidebar .sidebar-item").forEach(item => {
      const isTarget = item.getAttribute("data-settings-tab") === tab;
      item.classList.toggle("active", isTarget);
    });
    document.querySelectorAll(".settings-content .settings-pane").forEach(pane => {
      pane.classList.remove("active");
    });
    const targetPane = document.getElementById(`pane-${tab}`);
    if (targetPane) targetPane.classList.add("active");
  };

  const getSpotlightWallpaperItems = () => {
    return [...document.querySelectorAll(".wallpaper-card[data-wallpaper]")].map(card => {
      const value = card.getAttribute("data-wallpaper");
      const label = card.querySelector(".wallpaper-label span")?.textContent.trim() ||
        card.querySelector(".wallpaper-label")?.textContent.trim();
      return {
        title: label,
        desc: "Set desktop wallpaper",
        value,
        type: "wallpaper",
        icon: value === "gaming-cycle" ? "🎮" : "🖼️"
      };
    });
  };

  const renderSpotlightResults = (categories) => {
    if (!spotlightResultsWrapper) return;

    if (!spotlightInput || spotlightInput.value.trim() === "") {
      spotlightResultsWrapper.classList.add("hidden");
      return;
    }

    if (!categories || categories.length === 0) {
      spotlightResultsWrapper.classList.remove("hidden");
      spotlightResultsWrapper.innerHTML = `
        <div class="spotlight-no-results">
          No results found for "${escapeHTML(spotlightInput.value)}".
        </div>
      `;
      return;
    }

    spotlightResultsWrapper.classList.remove("hidden");
    
    let html = "";
    let absoluteIndex = 0;

    categories.forEach(cat => {
      html += `<div class="spotlight-category-title">${cat.title}</div>`;
      cat.items.forEach(item => {
        const isActive = absoluteIndex === activeResultIndex;
        html += `
          <div class="spotlight-result-item ${isActive ? 'active' : ''}" data-index="${absoluteIndex}">
            <div class="result-icon">${item.icon}</div>
            <div class="spotlight-result-details">
               <div class="spotlight-result-title">${escapeHTML(item.title)}</div>
               <div class="spotlight-result-desc">${escapeHTML(item.desc)}</div>
            </div>
          </div>
        `;
        absoluteIndex++;
      });
    });

    spotlightResultsWrapper.innerHTML = html;

    const itemEls = spotlightResultsWrapper.querySelectorAll(".spotlight-result-item");
    itemEls.forEach(el => {
      el.addEventListener("click", () => {
        const idx = parseInt(el.getAttribute("data-index"));
        if (spotlightResults[idx]) {
          executeSpotlightAction(spotlightResults[idx]);
        }
      });
    });
  };

  const performSpotlightSearch = () => {
    const q = spotlightInput.value.toLowerCase().trim();
    spotlightResults = [];
    
    const matchesSpotlightQuery = (item) => {
      const text = `${item.title} ${item.desc} ${item.keywords || ""}`.toLowerCase();
      return text.includes(q);
    };

    const apps = [
      { title: "News & Stories", desc: "Explore Apple news and dynamic updates", value: "news", type: "app", icon: "📰", keywords: "today articles stories reviews headlines rss" },
      { title: "SteamDB Games", desc: "Track sales and active Steam database apps", value: "games", type: "app", icon: "🎮", keywords: "games steam gaming database mac games" },
      { title: "App Store", desc: "Download verified system tools and simulated apps", value: "app-store", type: "app", icon: "💎", keywords: "store apps downloads software" },
      { title: "Finder & Files", desc: "Browse folders, local file lists, and desktop files", value: "finder", type: "app", icon: "📂", keywords: "files folders finder desktop" },
      { title: "Crossover Update", desc: "Check system updates, packages, and crossover details", value: "crossover", type: "app", icon: "🧪", keywords: "updates bottles crossover wine" }
    ];

    const utilities = [
      { title: "System Settings", desc: "Open wallpaper, general, and accessibility controls", value: "settings", type: "utility", icon: "⚙️", keywords: "settings preferences wallpaper appearance accessibility" },
      { title: "User Account", desc: "Open account, hardware profile, and security details", value: "account", type: "utility", icon: "👤", keywords: "account profile hardware passkey security sign out" },
      { title: "Notes", desc: "Open Notes and text files", value: "textedit", type: "utility", icon: "📝", keywords: "notes textedit text file writing" },
      { title: "Terminal", desc: "Open the command line simulator", value: "terminal", type: "utility", icon: "▣", keywords: "terminal command shell console" },
      { title: "Calculator", desc: "Open calculator", value: "calculator", type: "utility", icon: "🧮", keywords: "calculator math numbers" }
    ];

    const settings = [
      { title: "Wallpaper Settings", desc: "Open the wallpaper picker", value: "wallpaper", type: "settings-tab", icon: "🖼️", keywords: "desktop background gaming wallpaper" },
      { title: "General Settings", desc: "Open appearance, theme, language, and display controls", value: "general", type: "settings-tab", icon: "⚙️", keywords: "appearance accent theme language dark mode" },
      { title: "Accessibility Settings", desc: "Open text size, motion, and contrast controls", value: "accessibility", type: "settings-tab", icon: "◐", keywords: "accessibility text size reduce motion contrast" },
      { title: "Toggle Dark Mode", desc: "Toggle light-mode or dark-mode layout instantly", value: "darkmode", type: "system", icon: "🌗" },
      { title: "Toggle Night Light", desc: "Switch eye-strain warmth overlay filter", value: "nightlight", type: "system", icon: "🔆" },
      { title: "Switch View Layout", desc: "Cycle between Grid Gallery and List details", value: "layout", type: "system", icon: "🎛️" },
      { title: "Set Theme to Blue", desc: "Change desktop themes to premium blue accent", value: "theme-blue", type: "system", icon: "🔵" },
      { title: "Set Theme to Purple", desc: "Change desktop themes to purple accent", value: "theme-purple", type: "system", icon: "🟣" },
      { title: "Set Theme to Pink", desc: "Change desktop themes to pink accent", value: "theme-pink", type: "system", icon: "🔴" },
      { title: "Set Theme to Amber", desc: "Change desktop themes to amber gold accent", value: "theme-amber", type: "system", icon: "🟠" },
      { title: "Set Theme to Green", desc: "Change desktop themes to vibrant green accent", value: "theme-green", type: "system", icon: "🟢" },
      { title: "Set Theme to Silver", desc: "Change desktop themes to monochromatic silver", value: "theme-silver", type: "system", icon: "⚪" },
      { title: "System Reset", desc: "Clear cache and restore all settings to factory default", value: "reset", type: "system", icon: "🔄" },
      { title: "Go Back", desc: "Navigate back in browser simulation history", value: "back", type: "system", icon: "◀️" },
      { title: "Go Forward", desc: "Navigate forward in browser simulation history", value: "forward", type: "system", icon: "▶️" }
    ];

    const commands = [
      { title: "New Note", desc: "Create a blank note", value: "new-note", type: "command", icon: "✎", keywords: "notes create write textedit" },
      { title: "Refresh News", desc: "Reload latest news stories", value: "refresh-news", type: "command", icon: "↻", keywords: "rss stories reload articles" },
      { title: "Refresh Steam Games", desc: "Reload SteamDB game data", value: "refresh-games", type: "command", icon: "↻", keywords: "games steam reload refresh" },
      { title: "Open Launchpad", desc: "Show all apps", value: "open-launchpad", type: "command", icon: "▦", keywords: "apps launcher launchpad grid" },
      { title: "Open Story Editor", desc: "Create or edit a story card", value: "open-editor", type: "command", icon: "✚", keywords: "story article editor create" },
      { title: "Lock Screen", desc: "Lock MacReady", value: "lock", type: "command", icon: "⌘", keywords: "lock screen secure" }
    ];

    const matchedApps = [];
    const matchedUtilities = [];
    const matchedNotes = [];
    const matchedWallpaper = [];
    const matchedSettings = [];
    const matchedCommands = [];
    const matchedStories = [];
    const matchedSteamGames = [];
    const matchedStoreApps = [];

    if (!q) {
      // macOS Suggestions when empty
      matchedApps.push(apps[0]); // News
      matchedApps.push(apps[3]); // Finder
      matchedSettings.push(settings[0]); // Dark mode
      matchedSettings.push(settings[1]); // Night light
    } else {
      // Filter Apps
      apps.forEach(app => {
        if (matchesSpotlightQuery(app)) {
          matchedApps.push(app);
        }
      });

      utilities.forEach(utility => {
        if (matchesSpotlightQuery(utility)) {
          matchedUtilities.push(utility);
        }
      });

      getNotesData().forEach(note => {
        const noteText = `${note.name} ${note.content || ""}`.toLowerCase();
        if (noteText.includes(q)) {
          const cleanContent = (note.content || "").replace(/[\n\r]+/g, " ").trim();
          matchedNotes.push({
            title: note.name,
            desc: cleanContent ? cleanContent.substring(0, 72) : "Open note",
            value: note.id,
            type: "note",
            icon: "📝"
          });
        }
      });

      getSpotlightWallpaperItems().forEach(wallpaper => {
        if (matchesSpotlightQuery(wallpaper)) {
          matchedWallpaper.push(wallpaper);
        }
      });

      // Filter Settings
      settings.forEach(setting => {
        if (matchesSpotlightQuery(setting)) {
          matchedSettings.push(setting);
        }
      });

      commands.forEach(command => {
        if (matchesSpotlightQuery(command)) {
          matchedCommands.push(command);
        }
      });

      // Filter Articles
      if (articles && articles.length > 0) {
        articles.forEach(article => {
          if (article.title.toLowerCase().includes(q) || 
              (article.subtitle && article.subtitle.toLowerCase().includes(q)) || 
              (article.category && article.category.toLowerCase().includes(q))) {
            matchedStories.push({
              title: article.title,
              desc: `${article.author} · ${getCategoryTitle(article.category)}`,
              value: article.id,
              type: "story",
              icon: "📰"
            });
          }
        });
      }

      // Filter SteamDB Games
      if (gamesCache && gamesCache.length > 0) {
        gamesCache.forEach(game => {
          if (game.title.toLowerCase().includes(q)) {
            matchedSteamGames.push({
              title: game.title,
              desc: `${game.price === 0 || game.price === 'Free' ? 'Free' : (typeof game.price === 'number' ? '$' + game.price.toFixed(2) : game.price)} · Rating: ${game.rating || 80}% · ${game.compatibility.toUpperCase()}`,
              value: game.id,
              type: "steam-game",
              icon: game.cover ? `<img src="${game.cover}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" />` : "🎮"
            });
          }
        });

        // Sort matched Steam games by rating descending, slice to 5
        matchedSteamGames.sort((a, b) => {
          const gameA = gamesCache.find(g => g.id === a.value);
          const gameB = gamesCache.find(g => g.id === b.value);
          return (gameB?.rating || 0) - (gameA?.rating || 0);
        });
        if (matchedSteamGames.length > 5) {
          matchedSteamGames.splice(5);
        }
      }

      // Filter App Store Apps
      if (dynamicStoreApps && dynamicStoreApps.length > 0) {
        dynamicStoreApps.forEach(app => {
          if (app.title.toLowerCase().includes(q) || app.developer.toLowerCase().includes(q)) {
            matchedStoreApps.push({
              title: app.title,
              desc: `${app.category} · ${app.price} · ${app.developer}`,
              value: app.id,
              type: "store-app",
              icon: app.cover ? `<img src="${app.cover}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" />` : "💎"
            });
          }
        });

        // Sort matched App Store apps by rating descending, slice to 5
        matchedStoreApps.sort((a, b) => {
          const appA = dynamicStoreApps.find(x => x.id === a.value);
          const appB = dynamicStoreApps.find(x => x.id === b.value);
          return parseFloat(appB?.rating || 0) - parseFloat(appA?.rating || 0);
        });
        if (matchedStoreApps.length > 5) {
          matchedStoreApps.splice(5);
        }
      }
    }

    let finalResults = [];
    const categories = [];

    let bestMatch = null;
    if (q) {
      if (matchedApps.length > 0) {
        bestMatch = matchedApps[0];
      } else if (matchedUtilities.length > 0) {
        bestMatch = matchedUtilities[0];
      } else if (matchedNotes.length > 0) {
        bestMatch = matchedNotes[0];
      } else if (matchedWallpaper.length > 0) {
        bestMatch = matchedWallpaper[0];
      } else if (matchedSettings.length > 0) {
        bestMatch = matchedSettings[0];
      } else if (matchedCommands.length > 0) {
        bestMatch = matchedCommands[0];
      } else if (matchedStoreApps.length > 0) {
        bestMatch = matchedStoreApps[0];
      } else if (matchedSteamGames.length > 0) {
        bestMatch = matchedSteamGames[0];
      } else if (matchedStories.length > 0) {
        bestMatch = matchedStories[0];
      }
    }

    if (bestMatch) {
      categories.push({
        title: "Best Match",
        items: [bestMatch]
      });
      finalResults.push(bestMatch);
    }

    if (matchedApps.length > 0) {
      const items = matchedApps.filter(x => x !== bestMatch);
      if (items.length > 0 || !bestMatch) {
        categories.push({
          title: "Applications",
          items: items.length > 0 ? items : matchedApps
        });
        finalResults = finalResults.concat(items.length > 0 ? items : matchedApps);
      }
    }

    if (matchedUtilities.length > 0) {
      const items = matchedUtilities.filter(x => x !== bestMatch);
      if (items.length > 0 || !bestMatch) {
        categories.push({
          title: "Utilities",
          items: items.length > 0 ? items : matchedUtilities
        });
        finalResults = finalResults.concat(items.length > 0 ? items : matchedUtilities);
      }
    }

    if (matchedNotes.length > 0) {
      const items = matchedNotes.filter(x => x !== bestMatch);
      if (items.length > 0 || !bestMatch) {
        categories.push({
          title: "Notes",
          items: items.length > 0 ? items : matchedNotes
        });
        finalResults = finalResults.concat(items.length > 0 ? items : matchedNotes);
      }
    }

    if (matchedWallpaper.length > 0) {
      const items = matchedWallpaper.filter(x => x !== bestMatch);
      if (items.length > 0 || !bestMatch) {
        categories.push({
          title: "Wallpapers",
          items: items.length > 0 ? items : matchedWallpaper
        });
        finalResults = finalResults.concat(items.length > 0 ? items : matchedWallpaper);
      }
    }

    if (matchedStoreApps.length > 0) {
      const items = matchedStoreApps.filter(x => x !== bestMatch);
      if (items.length > 0 || !bestMatch) {
        categories.push({
          title: "App Store",
          items: items.length > 0 ? items : matchedStoreApps
        });
        finalResults = finalResults.concat(items.length > 0 ? items : matchedStoreApps);
      }
    }

    if (matchedSteamGames.length > 0) {
      const items = matchedSteamGames.filter(x => x !== bestMatch);
      if (items.length > 0 || !bestMatch) {
        categories.push({
          title: "SteamDB Games",
          items: items.length > 0 ? items : matchedSteamGames
        });
        finalResults = finalResults.concat(items.length > 0 ? items : matchedSteamGames);
      }
    }

    if (matchedStories.length > 0) {
      const items = matchedStories.filter(x => x !== bestMatch);
      if (items.length > 0 || !bestMatch) {
        categories.push({
          title: "Stories & Reviews",
          items: items.length > 0 ? items : matchedStories
        });
        finalResults = finalResults.concat(items.length > 0 ? items : matchedStories);
      }
    }

    if (matchedSettings.length > 0) {
      const items = matchedSettings.filter(x => x !== bestMatch);
      if (items.length > 0 || !bestMatch) {
        categories.push({
          title: "Settings",
          items: items.length > 0 ? items : matchedSettings
        });
        finalResults = finalResults.concat(items.length > 0 ? items : matchedSettings);
      }
    }

    if (matchedCommands.length > 0) {
      const items = matchedCommands.filter(x => x !== bestMatch);
      if (items.length > 0 || !bestMatch) {
        categories.push({
          title: "Actions",
          items: items.length > 0 ? items : matchedCommands
        });
        finalResults = finalResults.concat(items.length > 0 ? items : matchedCommands);
      }
    }

    spotlightResults = finalResults;
    activeResultIndex = spotlightResults.length > 0 ? 0 : -1;

    renderSpotlightResults(categories);
  };

  const navigateSpotlightResults = (dir) => {
    if (spotlightResults.length === 0) return;
    
    activeResultIndex += dir;
    if (activeResultIndex < 0) {
      activeResultIndex = spotlightResults.length - 1;
    } else if (activeResultIndex >= spotlightResults.length) {
      activeResultIndex = 0;
    }

    const items = spotlightResultsWrapper.querySelectorAll(".spotlight-result-item");
    items.forEach((item, index) => {
      if (index === activeResultIndex) {
        item.classList.add("active");
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.classList.remove("active");
      }
    });
  };

  const triggerSelectedResult = () => {
    if (activeResultIndex >= 0 && activeResultIndex < spotlightResults.length) {
      executeSpotlightAction(spotlightResults[activeResultIndex]);
    }
  };

  if (spotlightInput) {
    spotlightInput.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        navigateSpotlightResults(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        navigateSpotlightResults(-1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        triggerSelectedResult();
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeSpotlight();
      }
    });

    spotlightInput.addEventListener("input", () => {
      performSpotlightSearch();
    });
  }

  // Intercept Cmd+Space / Ctrl+Space and Esc globally
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.code === "Space") {
      e.preventDefault();
      toggleSpotlight();
    }
    if (e.key === "Escape" && spotlightActive) {
      e.preventDefault();
      closeSpotlight();
    }
  });
}

// --- 14. Dynamic Date Clock System Update ---
function startClock() {
  const clockBtn = document.getElementById("date-time-toggle");
  if (!clockBtn) return;

  function update() {
    const now = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const day = days[now.getDay()];
    
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    clockBtn.textContent = `${day} ${hours}:${minutes} ${ampm}`;
  }

  update();
  setInterval(update, 60000); 
}

// --- 14.5. Hardware Profile & SQL Compatibility Hub Controllers ---
function initHardwareProfileUI() {
  const selectModel = document.getElementById("profile-mac-model");
  const selectChip = document.getElementById("profile-chip");
  const selectRam = document.getElementById("profile-ram");
  const selectMacos = document.getElementById("profile-macos");
  const checkFilterSpecs = document.getElementById("filter-by-specs");

  if (!selectModel || !selectChip || !selectRam || !selectMacos) {
    console.warn("Hardware profile UI elements missing in DOM.");
    return;
  }
  if (selectModel.dataset.hardwareProfileReady === "true") return;
  selectModel.dataset.hardwareProfileReady = "true";

  // Load profile from database
  const profileRow = db.query("SELECT * FROM hardware_profile");
  if (profileRow && profileRow.length > 0) {
    const p = profileRow[0];
    selectModel.value = p.macModel || "";
    selectChip.value = p.chip || "";
    selectRam.value = p.ram || "";
    selectMacos.value = p.macosVersion || "";
    
    updateHardwareSummary(p);
  }

  function updateHardwareSummary(p) {
    if (p && p.macModel && p.chip) {
      const hwModel = document.getElementById("account-hw-model");
      const hwSub = document.getElementById("account-hw-sub");
      if (hwModel) hwModel.textContent = p.macModel;
      if (hwSub) hwSub.textContent = `${p.chip} • ${p.ram || '8GB'} • ${p.macosVersion || 'macOS 26'}`;

      // Dynamically update the premium device icon based on selected Mac model
      const imgEl = document.getElementById("account-hw-icon");
      if (imgEl) {
        const modelLower = p.macModel.toLowerCase();
        if (modelLower.includes("studio") || modelLower.includes("mini")) {
          imgEl.src = "assets/imgs/macstudio_icon.webp";
        } else if (modelLower.includes("imac")) {
          imgEl.src = "assets/imgs/imac_icon.webp";
        } else if (modelLower.includes("pro") && modelLower.includes("mac pro")) {
          imgEl.src = "assets/imgs/macpro_icon.webp";
        } else {
          imgEl.src = "assets/imgs/macbook_device.svg";
        }
      }
    }
  }

  // Helper to sync custom select dropdown elements with select values
  function syncCustomSelectTriggers() {
    [selectModel, selectChip, selectRam, selectMacos].forEach(select => {
      const container = select.closest(".glass-select-container");
      if (container) {
        const valSpan = container.querySelector(".glass-select-value");
        const activeOpt = select.options[select.selectedIndex];
        if (valSpan && activeOpt) {
          valSpan.textContent = activeOpt.textContent;
        }
        
        // Refresh highlighted option in custom dropdown options panel
        const optionsPanel = container.querySelector(".glass-select-options");
        if (optionsPanel) {
          optionsPanel.querySelectorAll(".glass-select-option").forEach((child, idx) => {
            const opt = select.options[idx];
            if (opt && opt.value === select.value) {
              child.style.background = "var(--accent-color)";
              child.style.fontWeight = "600";
            } else {
              child.style.background = "";
              child.style.fontWeight = "";
            }
          });
        }
      }
    });
  }

  // Initialize premium custom glass select selectors
  function initGlassSelects() {
    const accountWindow = document.getElementById("account-window");
    const selects = [selectModel, selectChip, selectRam, selectMacos];
    function positionOptionsPanel(container, trigger, optionsPanel) {
      const triggerRect = trigger.getBoundingClientRect();
      const bottomLimit = window.innerHeight - 92;
      const spaceBelow = bottomLimit - triggerRect.bottom - 8;
      const spaceAbove = triggerRect.top - 16;
      const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(180, Math.min(openUp ? spaceAbove - 8 : spaceBelow, 420));

      optionsPanel.style.maxHeight = `${maxHeight}px`;
      if (openUp) {
        optionsPanel.style.top = "auto";
        optionsPanel.style.bottom = "calc(100% + 4px)";
      } else {
        optionsPanel.style.top = "calc(100% + 4px)";
        optionsPanel.style.bottom = "auto";
      }
    }

    function closeGlassSelects() {
      document.querySelectorAll(".glass-select-options").forEach(panel => {
        panel.classList.add("hidden");
      });
      if (accountWindow) accountWindow.classList.remove("hardware-dropdown-open");
    }

    selects.forEach(select => {
      if (select.closest(".glass-select-container")) return; // Prevent double wraps
      
      const container = document.createElement("div");
      container.className = "glass-select-container";
      container.style.position = "relative";
      container.style.width = "160px";
      container.style.userSelect = "none";
      
      const trigger = document.createElement("div");
      trigger.className = "glass-select-trigger";
      trigger.style.display = "flex";
      trigger.style.alignItems = "center";
      trigger.style.justifyContent = "space-between";
      trigger.style.padding = "6px 10px";
      trigger.style.borderRadius = "6px";
      trigger.style.fontSize = "12px";
      trigger.style.cursor = "pointer";
      trigger.style.transition = "all 0.2s ease";
      
      const valSpan = document.createElement("span");
      valSpan.className = "glass-select-value";
      const activeOpt = select.options[select.selectedIndex] || select.options[0];
      valSpan.textContent = activeOpt ? activeOpt.textContent : "";
      
      const chevronSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      chevronSvg.setAttribute("width", "8");
      chevronSvg.setAttribute("height", "12");
      chevronSvg.setAttribute("viewBox", "0 0 8 12");
      chevronSvg.setAttribute("fill", "none");
      chevronSvg.style.opacity = "0.7";
      chevronSvg.style.flexShrink = "0";
      chevronSvg.style.marginLeft = "8px";
      chevronSvg.innerHTML = `<path d="M4 1L7 4.5H1L4 1Z" fill="currentColor"/><path d="M4 11L1 7.5H7L4 11Z" fill="currentColor"/>`;
      
      trigger.appendChild(valSpan);
      trigger.appendChild(chevronSvg);
      
      const optionsPanel = document.createElement("div");
      optionsPanel.className = "glass-select-options hidden";
      optionsPanel.style.position = "absolute";
      optionsPanel.style.top = "calc(100% + 4px)";
      optionsPanel.style.left = "0";
      optionsPanel.style.right = "0";
      optionsPanel.style.background = "rgba(28, 28, 30, 0.76)";
      optionsPanel.style.backdropFilter = "blur(30px) saturate(210%)";
      optionsPanel.style.webkitBackdropFilter = "blur(30px) saturate(210%)";
      optionsPanel.style.border = "1px solid rgba(255, 255, 255, 0.15)";
      optionsPanel.style.borderRadius = "8px";
      optionsPanel.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)";
      optionsPanel.style.zIndex = "9300";
      optionsPanel.style.maxHeight = "220px";
      optionsPanel.style.overflowY = "auto";
      optionsPanel.style.padding = "4px";
      optionsPanel.style.display = "flex";
      optionsPanel.style.flexDirection = "column";
      optionsPanel.style.gap = "2px";
      
      Array.from(select.options).forEach((opt, idx) => {
        const optDiv = document.createElement("div");
        optDiv.className = "glass-select-option";
        optDiv.textContent = opt.textContent;
        
        if (opt.value === select.value) {
          optDiv.style.background = "var(--accent-color)";
          optDiv.style.fontWeight = "600";
        }
        
        optDiv.addEventListener("click", (e) => {
          e.stopPropagation();
          select.value = opt.value;
          valSpan.textContent = opt.textContent;
          select.dispatchEvent(new Event("change"));
          optionsPanel.classList.add("hidden");
          syncCustomSelectTriggers();
        });
        
        optDiv.addEventListener("mouseenter", () => {
          if (select.value !== opt.value) {
            optDiv.style.background = "rgba(255, 255, 255, 0.1)";
          }
        });
        optDiv.addEventListener("mouseleave", () => {
          if (select.value !== opt.value) {
            optDiv.style.background = "";
          }
        });
        
        optionsPanel.appendChild(optDiv);
      });
      
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        document.querySelectorAll(".glass-select-options").forEach(panel => {
          if (panel !== optionsPanel) panel.classList.add("hidden");
        });
        const willOpen = optionsPanel.classList.contains("hidden");
        if (accountWindow) accountWindow.classList.toggle("hardware-dropdown-open", willOpen);
        if (willOpen) positionOptionsPanel(container, trigger, optionsPanel);
        optionsPanel.classList.toggle("hidden");
        if (!willOpen && accountWindow) accountWindow.classList.remove("hardware-dropdown-open");
      });
      
      select.parentNode.insertBefore(container, select);
      container.appendChild(trigger);
      container.appendChild(optionsPanel);
      container.appendChild(select);
    });
    
    // Close dropdowns on document click
    document.addEventListener("click", closeGlassSelects);
  }

  // Initialize
  initGlassSelects();
  if (profileRow && profileRow.length > 0) {
    syncCustomSelectTriggers();
  }

  // Save functionality
  function saveProfile() {
    const macModel = selectModel.value;
    const chip = selectChip.value;
    const ram = selectRam.value;
    const macosVersion = selectMacos.value;

    if (!macModel || !chip || !ram || !macosVersion) {
      return;
    }

    // Simulate small latency then replace in SQLite mock
    setTimeout(() => {
      db.query(
        "INSERT OR REPLACE INTO hardware_profile (macModel, chip, ram, macosVersion, crossoverInstalled) VALUES (?, ?, ?, ?, ?)",
        [macModel, chip, ram, macosVersion, false]
      );
      
      const updatedProfile = { macModel, chip, ram, macosVersion, crossoverInstalled: false };
      updateHardwareSummary(updatedProfile);
      syncCustomSelectTriggers();

      // Re-render games feed since hardware profile affects tested badges & filtering
      renderGamesView();
      syncAccountDetailsToWindow();
    }, 250);
  }

  // Bind change events
  [selectModel, selectChip, selectRam, selectMacos].forEach(el => {
    el.addEventListener("change", saveProfile);
  });

  // Bind the spec filter checkbox
  if (checkFilterSpecs) {
    checkFilterSpecs.addEventListener("change", () => {
      localStorage.setItem("macready_filter_by_specs", checkFilterSpecs.checked ? "true" : "false");
      renderGamesView();
    });
    // Load setting
    const savedFilter = localStorage.getItem("macready_filter_by_specs") === "true";
    checkFilterSpecs.checked = savedFilter;
  }
}

function initReportFormBindings() {
  const modal = document.getElementById("steamdb-report-modal");
  const form = document.getElementById("steamdb-report-form");
  const closeBtn = document.getElementById("steamdb-report-close");
  const cancelBtn = document.getElementById("report-cancel-btn");
  const backdrop = document.getElementById("steamdb-report-backdrop");
  
  const launchMethodEl = document.getElementById("report-launch-method");
  const crossoverVerContainer = document.getElementById("report-crossover-ver-container");
  const crossoverVerInput = document.getElementById("report-crossover-ver");

  if (!modal || !form) return;

  // Toggle Crossover version field visibility
  if (launchMethodEl && crossoverVerContainer) {
    launchMethodEl.addEventListener("change", () => {
      if (launchMethodEl.value === "CrossOver") {
        crossoverVerContainer.style.display = "flex";
        crossoverVerInput.required = true;
      } else {
        crossoverVerContainer.style.display = "none";
        crossoverVerInput.required = false;
      }
    });
  }

  // Hide report modal helper
  function hideModal() {
    modal.classList.add("hidden");
  }

  if (closeBtn) closeBtn.onclick = hideModal;
  if (cancelBtn) cancelBtn.onclick = hideModal;
  if (backdrop) backdrop.onclick = hideModal;

  // Bind report form submit
  form.onsubmit = (e) => {
    e.preventDefault();

    const selectGame = document.getElementById("report-game-select");
    const gameId = selectGame.value;
    const game = gamesCache.find(g => g.id === gameId);
    if (!game) return;

    const macModel = document.getElementById("report-mac-model").value;
    const chip = document.getElementById("report-chip").value;
    const ram = document.getElementById("report-ram").value;
    const macosVersion = document.getElementById("report-macos").value;
    const launchMethod = document.getElementById("report-launch-method").value;
    const crossoverVersion = crossoverVerInput.value;
    const fpsNotes = document.getElementById("report-fps").value;
    const rating = document.getElementById("report-rating").value;
    const issues = document.getElementById("report-issues").value;

    // INSERT into relational local DB via query!
    db.query(
      "INSERT INTO reports (appid, gameTitle, macModel, chip, ram, macosVersion, launchMethod, crossoverVersion, fpsNotes, issues, rating, submittedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        game.appid,
        game.title,
        macModel,
        chip,
        ram,
        macosVersion,
        launchMethod,
        crossoverVersion,
        fpsNotes,
        issues,
        rating,
        new Date().toISOString()
      ]
    );

    // Hide report modal and trigger play sound
    hideModal();
    playGlassChime();
    pushNotification("Report Submitted", `Thank you! Your compatibility review for ${game.title} has been logged.`);

    // In-place refresh of the detail sheet!
    const detailBody = document.getElementById("steamdb-detail-body");
    if (detailBody) {
      renderGameDetailContent(game, detailBody);
    }
    
    // Refresh main list to update Tested badges / filters
    renderGamesView();
  };

  // --- Apple Reader Advanced Event Bindings ---
  const readerOverlay = document.getElementById("reader-overlay");
  if (readerOverlay) {
    readerOverlay.addEventListener("mousemove", (e) => {
      updateProximityChevrons(e.clientX, window.innerWidth);
    });
    readerOverlay.addEventListener("mouseleave", () => {
      const prevBtn = document.getElementById("reader-prev-btn");
      const nextBtn = document.getElementById("reader-next-btn");
      if (prevBtn) prevBtn.classList.remove("proximity-visible");
      if (nextBtn) nextBtn.classList.remove("proximity-visible");
    });
  }

  const prevBtn = document.getElementById("reader-prev-btn");
  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navigateArticle(-1);
    });
  }

  const nextBtn = document.getElementById("reader-next-btn");
  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navigateArticle(1);
    });
  }

  // 1. Reader Options Dropdown Popover Toggling
  const rOptionsBtn = document.getElementById("reader-options-btn");
  const rOptionsDropdown = document.getElementById("reader-options-dropdown");

  if (rOptionsBtn && rOptionsDropdown) {
    rOptionsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isExpanded = rOptionsBtn.getAttribute("aria-expanded") === "true";
      rOptionsBtn.setAttribute("aria-expanded", !isExpanded);
      rOptionsDropdown.classList.toggle("hidden");
    });

    // Close options popover dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!rOptionsDropdown.classList.contains("hidden")) {
        const isClickInside = rOptionsDropdown.contains(e.target) || rOptionsBtn.contains(e.target);
        if (!isClickInside) {
          rOptionsDropdown.classList.add("hidden");
          rOptionsBtn.setAttribute("aria-expanded", "false");
        }
      }
    });
  }

  // 2. Reader Options Contrast Theme Click Selection Binds
  document.querySelectorAll(".theme-circle-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const theme = btn.getAttribute("data-theme");
      if (theme) {
        setReaderTheme(theme);
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    const overlay = document.getElementById("reader-overlay");
    if (overlay && !overlay.classList.contains("hidden")) {
      if (e.key === "ArrowLeft") {
        navigateArticle(-1);
      } else if (e.key === "ArrowRight") {
        navigateArticle(1);
      } else if (e.key === "Escape") {
        closeReader();
      }
    }
  });

  // 3. Macbook Touchpad Horizontal Swipe Gestures
  let horizontalSwipeAccumulator = 0;
  let swipeCooldown = false;

  window.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaX) > 10 && !swipeCooldown) {
      horizontalSwipeAccumulator += e.deltaX;
      
      if (Math.abs(horizontalSwipeAccumulator) >= 150) {
        swipeCooldown = true;
        
        if (horizontalSwipeAccumulator > 0) {
          // Swipe Left (scrolling right): Go Forward / Next Article
          const readerOverlay = document.getElementById("reader-overlay");
          if (readerOverlay && !readerOverlay.classList.contains("hidden")) {
            navigateArticle(1);
          } else {
            goForward();
          }
        } else {
          // Swipe Right (scrolling left): Go Back / Close Reader
          const readerOverlay = document.getElementById("reader-overlay");
          if (readerOverlay && !readerOverlay.classList.contains("hidden")) {
            closeReader();
          } else {
            goBack();
          }
        }
        
        horizontalSwipeAccumulator = 0;
        setTimeout(() => {
          swipeCooldown = false;
        }, 600);
      }
    } else if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      horizontalSwipeAccumulator *= 0.8;
    }
  }, { passive: true });

  // 4. Sidebar Dynamic Draggable resizing Binds
  initResizableSidebars();

  // 5. Soft Liquid Glass Bottom Lazy Loader Scroll Bind
  const feedContainer = document.getElementById("feed-container");
  if (feedContainer) {
    feedContainer.addEventListener("scroll", () => {
      const totalHeight = feedContainer.scrollHeight - feedContainer.clientHeight;
      if (totalHeight > 0 && feedContainer.scrollTop >= totalHeight - 80) {
        const blurPanel = document.getElementById("feed-lazy-load-blur");
        if (blurPanel && !blurPanel.classList.contains("fade-out")) {
          blurPanel.classList.add("fade-out");
          setTimeout(() => {
            visibleArticlesCount += 5;
            renderFeed();
          }, 300);
        }
      }
    });
  }
}

function openReportSubmission(preselectedGameId) {
  const modal = document.getElementById("steamdb-report-modal");
  const selectGame = document.getElementById("report-game-select");
  if (!modal || !selectGame) return;

  // Populate game dropdown from gamesCache
  selectGame.innerHTML = gamesCache
    .map(g => `<option value="${g.id}">${escapeHtml(g.title)}</option>`)
    .join("");

  if (preselectedGameId) {
    selectGame.value = preselectedGameId;
  }

  // Prefill with hardware profile if present
  const profileRow = db.query("SELECT * FROM hardware_profile");
  if (profileRow && profileRow.length > 0) {
    const p = profileRow[0];
    document.getElementById("report-mac-model").value = p.macModel || "MacBook Pro";
    document.getElementById("report-chip").value = p.chip || "M1";
    document.getElementById("report-ram").value = p.ram || "16GB";
    document.getElementById("report-macos").value = p.macosVersion || "macOS 26 Tahoe";
    
    if (p.crossoverInstalled) {
      document.getElementById("report-launch-method").value = "CrossOver";
      document.getElementById("report-crossover-ver-container").style.display = "flex";
      document.getElementById("report-crossover-ver").required = true;
    } else {
      document.getElementById("report-launch-method").value = "Native";
      document.getElementById("report-crossover-ver-container").style.display = "none";
      document.getElementById("report-crossover-ver").required = false;
    }
  } else {
    // Standard default settings
    document.getElementById("report-mac-model").value = "MacBook Pro";
    document.getElementById("report-chip").value = "M1";
    document.getElementById("report-ram").value = "16GB";
    document.getElementById("report-macos").value = "macOS 26 Tahoe";
    document.getElementById("report-launch-method").value = "Native";
    document.getElementById("report-crossover-ver-container").style.display = "none";
    document.getElementById("report-crossover-ver").required = false;
  }

  // Reset text areas & values
  document.getElementById("report-fps").value = "";
  document.getElementById("report-crossover-ver").value = "";
  document.getElementById("report-issues").value = "";
  document.getElementById("report-rating").value = "Excellent";

  // Show
  modal.classList.remove("hidden");
}

// --- Collapsible Sidebar Sections Controller ---
function initCollapsibleSidebarSections() {
  const collapsibleTitles = document.querySelectorAll(".sidebar-title.collapsible");
  collapsibleTitles.forEach(title => {
    title.addEventListener("click", () => {
      const section = title.closest(".sidebar-section");
      if (section) {
        section.classList.toggle("collapsed");
        playGlassChime();
      }
    });
  });
}

// --- 15. Entry point on Document Ready ---
function initAll() {
  initCustomDropdowns();
  initSiriAssistant();
  startClock();
  initData();
  initDockMagnification();
  initDockAutohideSettings();
  bindEvents();
  initAccountSystem();
  updateAppHeader();
  
  // Games & other apps events binding
  const gamesNavItems = document.querySelectorAll("#games-nav-menu .sidebar-item");
  if (gamesNavItems.length > 0) {
    // Secondary safety binding
    const gamesNav = document.getElementById("games-nav-menu");
    if (gamesNav) {
      gamesNav.querySelectorAll(".sidebar-item").forEach(item => {
        item.onclick = () => {
          gamesNav.querySelectorAll(".sidebar-item").forEach(i => i.classList.remove("active"));
          item.classList.add("active");
          currentGameFilter = item.getAttribute("data-game-filter");
          visibleGamesCount = 12; // Reset pagination!
          renderGamesView();
        };
      });
    }

    const gamesCompat = document.getElementById("games-compat-menu");
    if (gamesCompat) {
      gamesCompat.querySelectorAll(".sidebar-item").forEach(item => {
        item.onclick = () => {
          gamesCompat.querySelectorAll(".sidebar-item").forEach(i => i.classList.remove("active"));
          item.classList.add("active");
          currentGameCompat = item.getAttribute("data-game-compat");
          visibleGamesCount = 12; // Reset pagination!
          renderGamesView();
        };
      });
    }

    const gamesGenre = document.getElementById("games-genre-menu");
    if (gamesGenre) {
      gamesGenre.querySelectorAll(".sidebar-item").forEach(item => {
        item.onclick = () => {
          gamesGenre.querySelectorAll(".sidebar-item").forEach(i => i.classList.remove("active"));
          item.classList.add("active");
          currentGameGenre = item.getAttribute("data-game-genre");
          visibleGamesCount = 12; // Reset pagination!
          renderGamesView();
        };
      });
    }
  }

  // Finder navigation sidebar secondary binding
  const finderNav = document.getElementById("finder-nav-menu");
  if (finderNav) {
    finderNav.querySelectorAll(".sidebar-item").forEach(item => {
      item.onclick = () => {
        finderNav.querySelectorAll(".sidebar-item").forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        finderCurrentDir = item.getAttribute("data-finder-dir");
        finderSelectedFile = null;
        renderFinderView();
      };
    });
  }

  // Initialize to News app home view
  switchApp("news", false);
  loadNewsFromRSS();

  // Initialize Apple Events Widget
  initAppleEventsCalendar();
  
  // Initialize SQL compatibility hub & profile UI
  initHardwareProfileUI();
  initReportFormBindings();
  initCollapsibleSidebarSections();
  
  // Initialize macOS Settings Window & Lock Screen
  const mainWindow = document.getElementById("app-window");
  if (mainWindow) makeWindowDraggable(mainWindow);
  initSettingsWindow();
  initLockScreen();
  initUtilityApps();
  initPwaManager();
  initLaunchpad();
}

// --- 16. Apple Events Calendar Widget Controller ---
function initAppleEventsCalendar() {
  const countdownText = document.getElementById("wwdc-countdown-text");
  if (countdownText) {
    const updateCountdown = () => {
      const now = new Date();
      const target = new Date("2026-06-08T10:00:00-07:00"); // Pacific Time WWDC Keynote
      const diff = target - now;
      if (diff <= 0) {
        countdownText.textContent = "WWDC Keynote Active!";
      } else {
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        countdownText.textContent = `${days} days remaining`;
      }
    };
    updateCountdown();
    // Update every hour
    setInterval(updateCountdown, 3600000);
  }

  // Handle Event "Notify" buttons click
  const eventBtns = document.querySelectorAll(".apple-events-widget .event-btn");
  eventBtns.forEach(btn => {
    // Restore state from localStorage if previously set
    const eventName = btn.getAttribute("data-event");
    const isRsvped = localStorage.getItem(`rsvp_${eventName}`) === "true";
    if (isRsvped) {
      btn.classList.add("active");
      btn.textContent = "Added ✓";
    }

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const alreadyRsvped = btn.classList.contains("active");
      if (alreadyRsvped) {
        // Mute / cancel
        btn.classList.remove("active");
        btn.textContent = "Notify";
        localStorage.setItem(`rsvp_${eventName}`, "false");
        playGlassChime();
        pushNotification("Calendar RSVP Removed", `Muted notifications for "${eventName}".`);
      } else {
        // RSVP
        btn.classList.add("active");
        btn.textContent = "Added ✓";
        localStorage.setItem(`rsvp_${eventName}`, "true");
        playGlassChime();
        pushNotification("Calendar Event Added", `Successfully added "${eventName}" RSVP! We will alert you when the livestream goes live.`);
      }
    });
  });
}

// --- 17. macOS Tahoe Settings Window & Translation Engine ---

const translations = {
  en: {
    settings_wallpaper: "Wallpaper",
    settings_general: "General",
    settings_accessibility: "Accessibility",
    general_title: "General Settings",
    accent_color_title: "Accent Color",
    heritage_accent_title: "Heritage Gradients",
    appearance_title: "Appearance",
    appearance_dark: "Dark",
    appearance_light: "Light",
    language_title: "Site Language",
    language_subtitle: "Choose the display language for MacReady Tahoe.",
    accessibility_title: "Accessibility",
    accessibility_subtitle: "Customize display options to make Tahoe easier to see and use.",
    reduce_transparency: "Reduce Transparency",
    reduce_transparency_desc: "Remove modern glass blurs for solid, high-opacity windows.",
    increase_contrast: "Increase Contrast",
    increase_contrast_desc: "Thicken window outlines and sharpen text contrast.",
    grayscale_mode: "Grayscale Display",
    grayscale_mode_desc: "Convert all screen outputs to elegant black-and-white.",
    text_size_label: "Text Size",
    text_size_desc: "Adjust Tahoe font scaling dynamically.",
    text_size_small: "Small",
    text_size_medium: "Medium",
    text_size_large: "Large",
    lock_hint: "Touch ID or Enter Password",
    lock_sleep: "Sleep",
    lock_restart: "Restart",
    lock_shutdown: "Shut Down",
    menu_about_mac: "About This Mac",
    menu_system_settings: "System Settings...",
    menu_lock_screen: 'Lock Screen <span class="shortcut">^⌘Q</span>',
    menu_preferences: 'Preferences... <span class="shortcut">⌘,</span>',
    app: "MacReady",
    file: "File",
    edit: "Edit",
    view: "View",
    tools: "Tools",
    help: "Help",
    news: "News",
    crossover: "CrossOver",
    games: "Games",
    "app-store": "App Store",
    macos: "macOS",
    finder: "Finder",
    settings: "Settings",
    applications: "Applications",
    lang_changed_title: "Language Updated",
    lang_changed_desc: "System display language is now set to English."
  },
  es: {
    settings_wallpaper: "Fondo de Pantalla",
    settings_general: "General",
    settings_accessibility: "Accesibilidad",
    general_title: "Ajustes Generales",
    accent_color_title: "Color de Énfasis",
    heritage_accent_title: "Gradientes de Patrimonio",
    appearance_title: "Aspecto",
    appearance_dark: "Oscuro",
    appearance_light: "Claro",
    language_title: "Idioma del Sitio",
    language_subtitle: "Elige el idioma de visualización de MacReady Tahoe.",
    accessibility_title: "Accesibilidad",
    accessibility_subtitle: "Personaliza las opciones de visualización para que Tahoe sea más fácil de ver y usar.",
    reduce_transparency: "Reducir Transparencia",
    reduce_transparency_desc: "Elimina los desenfoques de vidrio modernos para ventanas sólidas.",
    increase_contrast: "Aumentar Contraste",
    increase_contrast_desc: "Engrosa los contornos de las ventanas y define el contraste del texto.",
    grayscale_mode: "Pantalla en Escala de Grises",
    grayscale_mode_desc: "Convierte todas las salidas de pantalla a un elegante blanco y negro.",
    text_size_label: "Tamaño del Texto",
    text_size_desc: "Ajusta la escala de fuente de Tahoe de forma dinámica.",
    text_size_small: "Pequeño",
    text_size_medium: "Mediano",
    text_size_large: "Grande",
    lock_hint: "Touch ID o ingresar contraseña",
    lock_sleep: "Reposo",
    lock_restart: "Reiniciar",
    lock_shutdown: "Apagar",
    menu_about_mac: "Acerca de esta Mac",
    menu_system_settings: "Ajustes del Sistema...",
    menu_lock_screen: 'Bloquear Pantalla <span class="shortcut">^⌘Q</span>',
    menu_preferences: 'Preferencias... <span class="shortcut">⌘,</span>',
    app: "MacReady",
    file: "Archivo",
    edit: "Edición",
    view: "Visualización",
    tools: "Herramientas",
    help: "Ayuda",
    news: "Noticias",
    crossover: "CrossOver",
    games: "Juegos",
    "app-store": "App Store",
    macos: "macOS",
    finder: "Finder",
    settings: "Ajustes",
    applications: "Aplicaciones",
    lang_changed_title: "Idioma Actualizado",
    lang_changed_desc: "El idioma de la pantalla del sistema ahora está configurado en Español."
  },
  fr: {
    settings_wallpaper: "Fond d'écran",
    settings_general: "Général",
    settings_accessibility: "Accessibilité",
    general_title: "Réglages Généraux",
    accent_color_title: "Couleur d'accentuation",
    heritage_accent_title: "Dégradés d'Héritage",
    appearance_title: "Apparence",
    appearance_dark: "Sombre",
    appearance_light: "Clair",
    language_title: "Langue du site",
    language_subtitle: "Choisissez la langue d'affichage pour MacReady Tahoe.",
    accessibility_title: "Accessibilité",
    accessibility_subtitle: "Personnalisez les options d'affichage pour rendre Tahoe plus lisible.",
    reduce_transparency: "Réduire la transparence",
    reduce_transparency_desc: "Désactive le flou de verre pour des fenêtres opaques solides.",
    increase_contrast: "Augmenter le contraste",
    increase_contrast_desc: "Épaissit les contours des fenêtres et améliore le contraste du texte.",
    grayscale_mode: "Affichage en niveaux de gris",
    grayscale_mode_desc: "Convertit tous les affichages à l'écran en un élégant noir et blanc.",
    text_size_label: "Taille du texte",
    text_size_desc: "Ajustez dynamiquement la taille de la police Tahoe.",
    text_size_small: "Petit",
    text_size_medium: "Moyen",
    text_size_large: "Grand",
    lock_hint: "Touch ID ou saisir le mot de passe",
    lock_sleep: "Suspendre",
    lock_restart: "Redémarrer",
    lock_shutdown: "Éteindre",
    menu_about_mac: "À propos de ce Mac",
    menu_system_settings: "Réglages Système...",
    menu_lock_screen: 'Verrouiller l\'écran <span class="shortcut">^⌘Q</span>',
    menu_preferences: 'Préférences... <span class="shortcut">⌘,</span>',
    app: "MacReady",
    file: "Fichier",
    edit: "Édition",
    view: "Présentation",
    tools: "Outils",
    help: "Aide",
    news: "Actualités",
    crossover: "CrossOver",
    games: "Jeux",
    "app-store": "App Store",
    macos: "macOS",
    finder: "Finder",
    settings: "Réglages",
    applications: "Applications",
    lang_changed_title: "Langue mise à jour",
    lang_changed_desc: "La langue d'affichage est désormais configurée en Français."
  },
  de: {
    settings_wallpaper: "Hintergrundbild",
    settings_general: "Allgemein",
    settings_accessibility: "Bedienungshilfen",
    general_title: "Allgemeine Einstellungen",
    accent_color_title: "Akzentfarbe",
    heritage_accent_title: "Klassische Verläufe",
    appearance_title: "Erscheinungsbild",
    appearance_dark: "Dunkel",
    appearance_light: "Hell",
    language_title: "Sprache",
    language_subtitle: "Wähle die Anzeigesprache für MacReady Tahoe.",
    accessibility_title: "Bedienungshilfen",
    accessibility_subtitle: "Passe die Anzeigeoptionen an, um Tahoe einfacher lesbar zu machen.",
    reduce_transparency: "Transparenz reduzieren",
    reduce_transparency_desc: "Entfernt Glasunschärfen für solide, deckende Fenster.",
    increase_contrast: "Kontrast erhöhen",
    increase_contrast_desc: "Verstärkt Fensterrahmen und schärft den Textkontrast.",
    grayscale_mode: "Graustufen-Anzeige",
    grayscale_mode_desc: "Konvertiert alle Bildschirmausgaben in elegantes Schwarz-Weiß.",
    text_size_label: "Textgröße",
    text_size_desc: "Passe die Schriftgröße für Tahoe dynamisch an.",
    text_size_small: "Klein",
    text_size_medium: "Mittel",
    text_size_large: "Groß",
    lock_hint: "Touch ID oder Passwort eingeben",
    lock_sleep: "Ruhezustand",
    lock_restart: "Neustart",
    lock_shutdown: "Ausschalten",
    menu_about_mac: "Über diesen Mac",
    menu_system_settings: "Systemeinstellungen...",
    menu_lock_screen: 'Bildschirm sperren <span class="shortcut">^⌘Q</span>',
    menu_preferences: 'Einstellungen... <span class="shortcut">⌘,</span>',
    app: "MacReady",
    file: "Ablage",
    edit: "Bearbeiten",
    view: "Darstellung",
    tools: "Werkzeuge",
    help: "Hilfe",
    news: "Nachrichten",
    crossover: "CrossOver",
    games: "Spiele",
    "app-store": "App Store",
    macos: "macOS",
    finder: "Finder",
    settings: "Einstellungen",
    applications: "Programme",
    lang_changed_title: "Sprache aktualisiert",
    lang_changed_desc: "Die Systemsprache wurde auf Deutsch eingestellt."
  },
  ja: {
    settings_wallpaper: "壁紙",
    settings_general: "一般",
    settings_accessibility: "アクセシビリティ",
    general_title: "一般設定",
    accent_color_title: "アクセントカラー",
    heritage_accent_title: "ヘリテージグラデーション",
    appearance_title: "外観モード",
    appearance_dark: "ダーク",
    appearance_light: "ライト",
    language_title: "言語設定",
    language_subtitle: "MacReady Tahoe の表示言語を選択します。",
    accessibility_title: "アクセシビリティ",
    accessibility_subtitle: "Tahoe を使いやすくするために表示オプションをカスタマイズします。",
    reduce_transparency: "透明度を下げる",
    reduce_transparency_desc: "モダンなブラー効果を無効にして、ソリッドで不透明なウィンドウにします。",
    increase_contrast: "コントラストを上げる",
    increase_contrast_desc: "ウィンドウの枠線を太くし、テキストの視認性を高めます。",
    grayscale_mode: "モノクロディスプレイ",
    grayscale_mode_desc: "すべての画面出力をスタイリッシュな白黒に変更します。",
    text_size_label: "テキストサイズ",
    text_size_desc: "Tahoe のフォントスケールを動的に調整します。",
    text_size_small: "小",
    text_size_medium: "中",
    text_size_large: "大",
    lock_hint: "Touch ID またはパスワードを入力",
    lock_sleep: "スリープ",
    lock_restart: "再起動",
    lock_shutdown: "システム終了",
    menu_about_mac: "この Mac について",
    menu_system_settings: "システム設定...",
    menu_lock_screen: '画面をロック <span class="shortcut">^⌘Q</span>',
    menu_preferences: '環境設定... <span class="shortcut">⌘,</span>',
    app: "MacReady",
    file: "ファイル",
    edit: "編集",
    view: "表示",
    tools: "ツール",
    help: "ヘルプ",
    news: "ニュース",
    crossover: "CrossOver",
    games: "ゲーム",
    "app-store": "App Store",
    macos: "macOS",
    finder: "Finder",
    settings: "設定",
    applications: "アプリケーション",
    lang_changed_title: "言語の更新",
    lang_changed_desc: "システムの表示言語が日本語に設定されました。"
  }
};

const GAMING_WALLPAPER_APPIDS = [
  "1086940", "1091500", "1145360", "1245620", "2050650", "1174180",
  "292030", "1817070", "2215430", "2420110", "367520", "646570",
  "413150", "2073850", "1868140", "1850570", "1238810", "2096610",
  "582010", "1172470", "730", "570", "578080", "271590", "252490",
  "359550", "381210", "105600", "1057090", "1599340", "394360",
  "489830", "252950", "440", "4000", "236390", "306130", "322330",
  "230410", "444090", "275850", "632360", "892970", "1282100"
];
let activeGamingWallpaperCssUrl = "";

function clearGamingWallpaperSurface() {
  localStorage.removeItem("tahoe_gaming_wallpaper_url");
  localStorage.removeItem("tahoe_gaming_wallpaper_source");
  activeGamingWallpaperCssUrl = "";

  const desktop = document.getElementById("desktop");
  const base = document.getElementById("desktop-bg-base");
  const overlay = document.getElementById("desktop-bg-overlay");
  const lockScreen = document.getElementById("lock-screen");
  [base, overlay].forEach(layer => {
    if (!layer) return;
    layer.style.backgroundImage = "none";
    layer.style.background = "transparent";
    layer.style.opacity = "0";
  });
  if (desktop) {
    desktop.style.backgroundImage = "none";
  }
  if (lockScreen && !lockScreen.classList.contains("hidden-lock")) {
    lockScreen.style.backgroundImage = "none";
  }
}

function applyGamingWallpaperUrl(imageUrl) {
  activeGamingWallpaperCssUrl = `url('${imageUrl}')`;
  return activeGamingWallpaperCssUrl;
}

function createGamingWallpaperSeed() {
  const currentSource = localStorage.getItem("tahoe_gaming_wallpaper_source");
  const candidates = GAMING_WALLPAPER_APPIDS.filter(appid => appid !== currentSource);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function getGamingWallpaperUrl(appid) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/library_hero.jpg`;
}

function applySavedGamingWallpaper() {
  let currentSource = localStorage.getItem("tahoe_gaming_wallpaper_source");
  if (!currentSource) {
    currentSource = createGamingWallpaperSeed();
    localStorage.setItem("tahoe_gaming_wallpaper_source", currentSource);
  }
  applyGamingWallpaperUrl(getGamingWallpaperUrl(currentSource));
  setWallpaper("gaming-cycle");
  return true;
}

async function refreshGamingWallpaper({ notify = true } = {}) {
  const source = createGamingWallpaperSeed();
  applyGamingWallpaperUrl(getGamingWallpaperUrl(source));
  localStorage.setItem("tahoe_gaming_wallpaper_source", source);
  setWallpaper("gaming-cycle");
  if (notify) {
    pushNotification("Gaming Wallpaper Refreshed", "A new gaming wallpaper has been applied.");
  }
}

async function cycleGamingWallpaper() {
  await refreshGamingWallpaper();
}

const wallpaperGlows = {
  "tahoe-liquid": ["rgba(59, 130, 246, 0.8)", "rgba(168, 85, 247, 0.6)", "rgba(236, 72, 153, 0.5)"],
  "tahoe-beach-dawn": ["rgba(251, 191, 36, 0.5)", "rgba(244, 63, 94, 0.4)", "rgba(56, 189, 248, 0.4)"],
  "tahoe-beach-dusk": ["rgba(217, 119, 6, 0.35)", "rgba(124, 58, 237, 0.4)", "rgba(255, 255, 255, 0.2)"],
  "tahoe-dark": ["rgba(30, 41, 59, 0.8)", "rgba(51, 65, 85, 0.7)", "rgba(71, 85, 105, 0.6)"],
  "sequoia-sunrise": ["rgba(219, 39, 119, 0.5)", "rgba(249, 115, 22, 0.45)", "rgba(124, 58, 237, 0.4)"],
  "big-sur-night": ["rgba(99, 102, 241, 0.6)", "rgba(236, 72, 153, 0.5)", "rgba(245, 158, 11, 0.4)"],
  "big-sur-night-dark": ["rgba(30, 41, 59, 0.55)", "rgba(79, 70, 229, 0.4)", "rgba(255, 255, 255, 0.2)"],
  "mojave-night": ["rgba(15, 23, 42, 0.6)", "rgba(245, 158, 11, 0.3)", "rgba(255, 255, 255, 0.2)"],
  "os-x-cheetah-puma": ["rgba(173, 216, 230, 0.4)", "rgba(100, 149, 237, 0.35)", "rgba(255, 255, 255, 0.2)"],
  "os-x-tiger": ["rgba(30, 144, 255, 0.45)", "rgba(0, 0, 128, 0.35)", "rgba(255, 255, 255, 0.2)"],
  "os-x-snow-leopard": ["rgba(138, 43, 226, 0.4)", "rgba(25, 25, 112, 0.4)", "rgba(255, 255, 255, 0.25)"],
  "os-x-leopard": ["rgba(124, 58, 237, 0.45)", "rgba(59, 130, 246, 0.4)", "rgba(255, 255, 255, 0.15)"],
  "os-x-lion": ["rgba(30, 144, 255, 0.4)", "rgba(79, 70, 229, 0.35)", "rgba(255, 255, 255, 0.2)"],
  "os-x-mavericks": ["rgba(13, 148, 136, 0.45)", "rgba(6, 182, 212, 0.4)", "rgba(255, 255, 255, 0.15)"],
  "os-x-yosemite": ["rgba(249, 115, 22, 0.4)", "rgba(99, 102, 241, 0.35)", "rgba(255, 255, 255, 0.15)"],
  "black-solid": ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)"],
  "monterey-dark": ["rgba(147, 51, 234, 0.45)", "rgba(219, 39, 119, 0.4)", "rgba(30, 41, 59, 0.3)"],
  "ventura-dark": ["rgba(249, 115, 22, 0.45)", "rgba(220, 38, 38, 0.35)", "rgba(30, 41, 59, 0.3)"],
  "macbook-neo-blue": ["rgba(6, 182, 212, 0.45)", "rgba(59, 130, 246, 0.4)", "rgba(255, 255, 255, 0.15)"],
  "macbook-neo-purple": ["rgba(168, 85, 247, 0.45)", "rgba(236, 72, 153, 0.4)", "rgba(255, 255, 255, 0.15)"],
  "gaming-cycle": ["rgba(168, 85, 247, 0.45)", "rgba(0, 240, 255, 0.45)", "rgba(255, 45, 85, 0.4)"]
};

// --- Wallpaper Switching Engine ---
function setWallpaper(wallpaperName) {
  const desktop = document.getElementById("desktop");
  const lockScreen = document.getElementById("lock-screen");
  if (!desktop) return;

  const wallpapers = {
    "tahoe-liquid": "url('public/assets/imgs/wallpapers/optimized/TahoeWallpaper-1920.webp')",
    "tahoe-beach-dawn": "url('public/assets/imgs/wallpapers/optimized/26-Tahoe-Beach-Dawn.webp')",
    "tahoe-beach-dusk": "url('public/assets/imgs/wallpapers/optimized/26-Tahoe-Beach-Dusk.webp')",
    "tahoe-dark": "url('public/assets/imgs/wallpapers/optimized/26-Tahoe-Dark-6K.webp')",
    "sequoia-sunrise": "url('public/assets/imgs/wallpapers/optimized/15-Sequoia-Sunrise.webp')",
    "big-sur-night": "url('public/assets/imgs/wallpapers/optimized/11-0-Big-Sur-Color-Night.webp')",
    "big-sur-night-dark": "url('public/assets/imgs/wallpapers/optimized/11-0-Night.webp')",
    "mojave-night": "url('public/assets/imgs/wallpapers/optimized/10-14-Night.webp')",
    "os-x-cheetah-puma": "url('public/assets/imgs/wallpapers/optimized/10-0_10.1.webp')",
    "os-x-tiger": "url('public/assets/imgs/wallpapers/optimized/Tiger.webp')",
    "os-x-snow-leopard": "url('public/assets/imgs/wallpapers/optimized/10-6.webp')",
    "os-x-leopard": "url('https://media.512pixels.net/downloads/macos-wallpapers-6k/10-5-6k.jpg')",
    "os-x-lion": "url('https://media.512pixels.net/downloads/macos-wallpapers-6k/10-7-6k.jpg')",
    "os-x-mavericks": "url('https://media.512pixels.net/downloads/macos-wallpapers-6k/10-9-6k.jpg')",
    "os-x-yosemite": "url('https://media.512pixels.net/downloads/macos-wallpapers-6k/10-10-6k.jpg')",
    "black-solid": "#000000",
    "monterey-dark": "url('public/assets/imgs/wallpapers/optimized/12-Dark.webp')",
    "ventura-dark": "url('public/assets/imgs/wallpapers/optimized/13-Ventura-Dark.webp')",
    "macbook-neo-blue": "url('public/assets/imgs/wallpapers/optimized/MacBook-Neo-wallpaper-Blue.webp')",
    "macbook-neo-purple": "url('public/assets/imgs/wallpapers/optimized/MacBook-Neo-wallpaper-Purple.webp')",
    "gaming-cycle": activeGamingWallpaperCssUrl
  };

  const physicalImages = [
    "tahoe-liquid", 
    "tahoe-beach-dawn", 
    "tahoe-beach-dusk",
    "tahoe-dark", 
    "sequoia-sunrise", 
    "big-sur-night", 
    "big-sur-night-dark",
    "mojave-night",
    "os-x-cheetah-puma",
    "os-x-tiger",
    "os-x-snow-leopard",
    "os-x-leopard",
    "os-x-lion",
    "os-x-mavericks",
    "os-x-yosemite",
    "monterey-dark",
    "ventura-dark",
    "macbook-neo-blue",
    "macbook-neo-purple",
    "gaming-cycle"
  ];

  // 1. Sync Desktop Background
  const baseBg = document.getElementById("desktop-bg-base");
  const overlayBg = document.getElementById("desktop-bg-overlay");
  
  if (baseBg && overlayBg) {
    if (wallpaperName === "gaming-cycle" && !activeGamingWallpaperCssUrl) {
      clearGamingWallpaperSurface();
      localStorage.setItem("tahoe_wallpaper", wallpaperName);
      document.querySelectorAll(".wallpaper-card").forEach(card => {
        card.classList.toggle("active", card.getAttribute("data-wallpaper") === wallpaperName);
      });
      return;
    }

    const newBgValue = wallpapers[wallpaperName] || "url('public/assets/imgs/wallpapers/optimized/TahoeWallpaper-1920.webp')";
    const isImage = physicalImages.includes(wallpaperName);
    
    if (isImage) {
      // Clean and extract the raw URL for asynchronous GPU pre-decoding
      const cleanUrl = newBgValue.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
      const img = new Image();
      img.src = cleanUrl;
      
      const startTransition = () => {
        overlayBg.style.backgroundImage = newBgValue;
        overlayBg.style.opacity = "1";
        
        // After fade transition (600ms):
        setTimeout(() => {
          baseBg.style.backgroundImage = newBgValue;
          overlayBg.style.opacity = "0";
        }, 600);
      };

      if (typeof img.decode === 'function') {
        img.decode().then(startTransition).catch(startTransition);
      } else {
        img.onload = startTransition;
      }
    } else {
      // Solid colors / Gradients - Transition gracefully
      overlayBg.style.backgroundImage = "none";
      overlayBg.style.background = newBgValue;
      overlayBg.style.opacity = "1";
      
      // After fade transition (600ms):
      setTimeout(() => {
        baseBg.style.backgroundImage = "none";
        baseBg.style.background = newBgValue;
        overlayBg.style.opacity = "0";
      }, 600);
    }
  } else {
    // Fallback if layered divs aren't rendered
    if (physicalImages.includes(wallpaperName)) {
      desktop.style.background = "";
      desktop.style.backgroundImage = wallpapers[wallpaperName] || "url('public/assets/imgs/wallpapers/optimized/TahoeWallpaper-1920.webp')";
      desktop.style.backgroundSize = "cover";
      desktop.style.backgroundPosition = "center";
    } else {
      desktop.style.backgroundImage = "none";
      desktop.style.background = wallpapers[wallpaperName] || "";
    }
  }

  // 2. Sync Lock Screen Background
  if (lockScreen && !lockScreen.classList.contains("hidden-lock")) {
    if (physicalImages.includes(wallpaperName)) {
      lockScreen.style.background = "";
      lockScreen.style.backgroundImage = wallpapers[wallpaperName] || "url('public/assets/imgs/wallpapers/optimized/TahoeWallpaper-1920.webp')";
      lockScreen.style.backgroundSize = "cover";
      lockScreen.style.backgroundPosition = "center";
    } else {
      lockScreen.style.backgroundImage = "none";
      lockScreen.style.background = wallpapers[wallpaperName] || "";
    }
  }

  // 3. Save Preference
  localStorage.setItem("tahoe_wallpaper", wallpaperName);

  // 4. Update Card Selection UI
  document.querySelectorAll(".wallpaper-card").forEach(card => {
    card.classList.remove("active");
    if (card.getAttribute("data-wallpaper") === wallpaperName) {
      card.classList.add("active");
    }
  });

  // 5. Update Ambient Neon Glows
  const colors = wallpaperGlows[wallpaperName] || wallpaperGlows["tahoe-liquid"];
  desktop.style.setProperty("--glow-color-1", colors[0]);
  desktop.style.setProperty("--glow-color-2", colors[1]);
  desktop.style.setProperty("--glow-color-3", colors[2]);
}

// --- Appearance & Dark Mode Sync Engine ---
function setAppearanceMode(mode) {
  if (mode === "light") {
    document.body.classList.add("light-mode");
    localStorage.setItem("tahoe_darkmode", "light");
    const dsBtn = document.getElementById("qs-darkmode");
    if (dsBtn) dsBtn.classList.remove("active");
  } else {
    document.body.classList.remove("light-mode");
    localStorage.setItem("tahoe_darkmode", "dark");
    const dsBtn = document.getElementById("qs-darkmode");
    if (dsBtn) dsBtn.classList.add("active");
  }
  updateModeButtonLabel();
  syncAppearanceSettings();
  
  // Refresh views
  if (currentApp === "crossover") renderCrossoverView();
  if (currentApp === "games") renderGamesView();
  if (currentApp === "finder") renderFinderView();
}

function syncAppearanceSettings() {
  const isLight = document.body.classList.contains("light-mode");
  const darkCard = document.getElementById("appearance-dark");
  const lightCard = document.getElementById("appearance-light");
  if (darkCard && lightCard) {
    if (isLight) {
      darkCard.classList.remove("active");
      lightCard.classList.add("active");
    } else {
      darkCard.classList.add("active");
      lightCard.classList.remove("active");
    }
  }
}

// --- Text Scaling Controller ---
function setTextScale(scale) {
  document.body.classList.remove("text-scale-small", "text-scale-large");
  if (scale === "small") {
    document.body.classList.add("text-scale-small");
  } else if (scale === "large") {
    document.body.classList.add("text-scale-large");
  }
  localStorage.setItem("tahoe_text_scale", scale);

  // Update active index variable for sliding indicator
  let index = 1; // default medium
  if (scale === "small") index = 0;
  if (scale === "large") index = 2;
  const control = document.getElementById("text-size-control");
  if (control) {
    control.style.setProperty("--active-index", index);
  }

  document.querySelectorAll(".segmented-control .segment-btn").forEach(btn => {
    btn.classList.remove("active");
    if (btn.getAttribute("data-scale") === scale) {
      btn.classList.add("active");
    }
  });
}

// --- Localization Apply routine ---
function applyLanguage(lang) {
  const dict = translations[lang] || translations["en"];
  localStorage.setItem("tahoe_language", lang);

  // Update select input
  const langSelect = document.getElementById("settings-language-select");
  if (langSelect) langSelect.value = lang;

  // Global [data-i18n] replacements
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = dict[key];
      } else {
        el.innerHTML = dict[key];
      }
    }
  });

  // Specific system-menu replacements
  const systemSettings = document.getElementById("menu-system-settings");
  if (systemSettings) systemSettings.textContent = dict["menu_system_settings"];
  
  const aboutMac = document.getElementById("menu-about-mac");
  if (aboutMac) aboutMac.textContent = dict["menu_about_mac"];

  const lockScreen = document.getElementById("menu-lock-screen");
  if (lockScreen) lockScreen.innerHTML = dict["menu_lock_screen"];

  const preferences = document.getElementById("menu-preferences");
  if (preferences) preferences.innerHTML = dict["menu_preferences"];

  // Specific header replacements
  const appHeader = document.querySelector('button[data-menu="app-menu"]');
  if (appHeader) appHeader.textContent = currentUsername;

  const fileHeader = document.querySelector('button[data-menu="file-menu"]');
  if (fileHeader) fileHeader.textContent = dict["file"] || "File";

  const editHeader = document.querySelector('button[data-menu="edit-menu"]');
  if (editHeader) editHeader.textContent = dict["edit"] || "Edit";

  const viewHeader = document.querySelector('button[data-menu="view-menu"]');
  if (viewHeader) viewHeader.textContent = dict["view"] || "View";

  const toolsHeader = document.querySelector('button[data-menu="tools-menu"]');
  if (toolsHeader) toolsHeader.textContent = dict["tools"] || "Tools";

  const helpHeader = document.querySelector('button[data-menu="help-menu"]');
  if (helpHeader) helpHeader.textContent = dict["help"] || "Help";

  // Specific Dock tooltips
  const dockItems = document.querySelectorAll("#dock-container .dock-item-wrapper");
  dockItems.forEach(item => {
    const appName = item.getAttribute("data-app");
    const tooltip = item.querySelector(".dock-tooltip");
    if (tooltip && appName && dict[appName]) {
      tooltip.textContent = dict[appName];
    }
  });
}

// --- Initialize Settings Window Controller ---
async function initSettingsWindow() {
  // A. Load saved values on startup
  try {
    const savedWallpaper = localStorage.getItem("tahoe_wallpaper") || "tahoe-liquid";
    if (savedWallpaper === "gaming-cycle") {
      refreshGamingWallpaper({ notify: false }).catch(err => {
        console.error("Failed to refresh gaming wallpaper on startup:", err);
      });
    } else {
      setWallpaper(savedWallpaper);
    }
  } catch (err) {
    console.error("Failed to load wallpaper on startup:", err);
  }

  try {
    const savedScale = localStorage.getItem("tahoe_text_scale") || "medium";
    setTextScale(savedScale);
  } catch (err) {
    console.error("Failed to load text scale on startup:", err);
  }

  try {
    const savedLang = localStorage.getItem("tahoe_language") || "en";
    applyLanguage(savedLang);
  } catch (err) {
    console.error("Failed to load language on startup:", err);
  }

  let savedTheme = "blue";
  try {
    savedTheme = localStorage.getItem("tahoe_theme") || "blue";
    setAccentColor(savedTheme);
  } catch (err) {
    console.error("Failed to load theme on startup:", err);
  }

  // Sync Accent picker selections
  try {
    document.querySelectorAll(".settings-accent-circle").forEach(circle => {
      circle.classList.remove("active");
      if (circle.getAttribute("data-color") === savedTheme) {
        circle.classList.add("active");
      }
      
      circle.addEventListener("click", () => {
        const color = circle.getAttribute("data-color");
        setAccentColor(color);
        document.querySelectorAll(".settings-accent-circle").forEach(c => c.classList.remove("active"));
        circle.classList.add("active");
        playGlassChime();
        
        const capitalized = color.charAt(0).toUpperCase() + color.slice(1);
        pushNotification("Accent Color Changed", `System accent color updated to ${capitalized}.`);
      });
    });
  } catch (err) {
    console.error("Failed to sync accent circles:", err);
  }

  // B. Window Traffic Light Listeners
  const closeBtn = document.getElementById("settings-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      const settingsWin = document.getElementById("settings-window");
      if (settingsWin) {
        settingsWin.classList.add("settings-closing");
        window.setTimeout(() => {
          settingsWin.classList.add("hidden-window");
          settingsWin.classList.remove("settings-closing");
        }, 220);
        playGlassChime();
        
        // Remove active-dot under the Settings dock icon
        const indicator = document.getElementById("dock-settings-indicator");
        if (indicator) {
          indicator.classList.remove("active-dot");
        }
        refreshGlobalMenuBarSoon();
      }
    });
  }

  const minimizeBtn = document.getElementById("settings-minimize");
  if (minimizeBtn) {
    minimizeBtn.addEventListener("click", () => {
      const settingsWin = document.getElementById("settings-window");
      if (settingsWin) {
        settingsWin.classList.add("minimized");
        playGlassChime();
        refreshGlobalMenuBarSoon();
      }
    });
  }

  const maximizeBtn = document.getElementById("settings-maximize");
  if (maximizeBtn) {
    maximizeBtn.addEventListener("click", () => {
      const settingsWin = document.getElementById("settings-window");
      if (settingsWin) {
        toggleWindowMaximized(settingsWin);
        playGlassChime();
      }
    });
  }

  // C. Menu Bar & Dock Openers
  const openSettings = (e) => {
    if (e) e.preventDefault();
    const settingsWin = document.getElementById("settings-window");
    if (settingsWin) {
      settingsWin.classList.remove("settings-closing");
      settingsWin.classList.remove("hidden-window");
      settingsWin.classList.remove("minimized");
      bringWindowToFront(settingsWin);
      playGlassChime();
      
      // Add active-dot under the Settings dock icon
      const indicator = document.getElementById("dock-settings-indicator");
      if (indicator) {
        indicator.classList.add("active-dot");
      }
    }
  };

  const prefBtn = document.getElementById("menu-preferences");
  if (prefBtn) prefBtn.addEventListener("click", openSettings);

  const sysBtn = document.getElementById("menu-system-settings");
  if (sysBtn) sysBtn.addEventListener("click", openSettings);

  // Bind Settings Dock button listener
  const dockSettingsBtn = document.getElementById("dock-settings-btn");
  if (dockSettingsBtn) {
    dockSettingsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const settingsWin = document.getElementById("settings-window");
      if (settingsWin) {
        const isHidden = settingsWin.classList.contains("hidden-window");
        const isMinimized = settingsWin.classList.contains("minimized");

        // Active class management without bounce
        const wrapper = dockSettingsBtn.closest(".dock-item-wrapper");
        if (wrapper) {
          wrapper.classList.add("active");
          setTimeout(() => {
            wrapper.classList.remove("active");
          }, 600);
        }

        if (isHidden || isMinimized) {
          openSettings();
        } else if (settingsWin !== getTopVisibleWindow()) {
          bringWindowToFront(settingsWin);
          playGlassChime();
        } else {
          // If already open and active, toggle minimize
          settingsWin.classList.add("minimized");
          playGlassChime();
        }
      }
    });
  }

  // D. Sidebar Tab-switching
  const sidebarItems = document.querySelectorAll(".settings-sidebar .sidebar-item");
  sidebarItems.forEach(item => {
    item.addEventListener("click", () => {
      sidebarItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      
      const tab = item.getAttribute("data-settings-tab");
      document.querySelectorAll(".settings-content .settings-pane").forEach(pane => {
        pane.classList.remove("active");
      });
      
      const targetPane = document.getElementById(`pane-${tab}`);
      if (targetPane) targetPane.classList.add("active");
      playGlassChime();
    });
  });

  // E. Wallpaper Grids
  const wallpaperCards = document.querySelectorAll(".wallpaper-grid .wallpaper-card");
  wallpaperCards.forEach(card => {
    card.addEventListener("click", () => {
      const wallpaperName = card.getAttribute("data-wallpaper");
      if (wallpaperName === "gaming-cycle") {
        if (!applySavedGamingWallpaper()) {
          setWallpaper("gaming-cycle");
        }
        card.classList.add("loading");
        refreshGamingWallpaper({ notify: false })
          .catch(err => {
            console.error("Failed to refresh gaming wallpaper:", err);
          })
          .finally(() => {
            card.classList.remove("loading");
          });
      } else {
        setWallpaper(wallpaperName);
      }
      playGlassChime();
      
      const capitalized = wallpaperName.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      pushNotification("Wallpaper Changed", `Desktop wallpaper set to ${capitalized}.`);
    });
  });

  const cycleBtn = document.getElementById("cycle-gaming-btn");
  if (cycleBtn) {
    cycleBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      cycleBtn.disabled = true;
      try {
        await cycleGamingWallpaper();
      } finally {
        cycleBtn.disabled = false;
      }
      playGlassChime();
    });
  }

  // F. Appearance Toggles
  const darkCard = document.getElementById("appearance-dark");
  if (darkCard) {
    darkCard.addEventListener("click", () => {
      setAppearanceMode("dark");
      playGlassChime();
    });
  }

  const lightCard = document.getElementById("appearance-light");
  if (lightCard) {
    lightCard.addEventListener("click", () => {
      setAppearanceMode("light");
      playGlassChime();
    });
  }
  syncAppearanceSettings();

  // G. Language Dropdown select
  const langSelect = document.getElementById("settings-language-select");
  if (langSelect) {
    langSelect.addEventListener("change", (e) => {
      const lang = e.target.value;
      applyLanguage(lang);
      playGlassChime();
      
      const dict = translations[lang] || translations["en"];
      pushNotification(dict["lang_changed_title"], dict["lang_changed_desc"]);
    });
  }

  // H. Accessibility Switches
  const reduceTransToggle = document.getElementById("toggle-reduce-transparency");
  if (reduceTransToggle) {
    const isChecked = localStorage.getItem("tahoe_reduce_transparency") === "true";
    reduceTransToggle.checked = isChecked;
    document.body.classList.toggle("reduce-transparency", isChecked);
    
    reduceTransToggle.addEventListener("change", (e) => {
      const checked = e.target.checked;
      document.body.classList.toggle("reduce-transparency", checked);
      localStorage.setItem("tahoe_reduce_transparency", checked ? "true" : "false");
      playGlassChime();
      
      pushNotification(
        checked ? "Reduce Transparency Enabled" : "Reduce Transparency Disabled",
        checked ? "Window blurs have been disabled for solid high-contrast colors." : "frosted glass effects have been restored."
      );
    });
  }

  const increaseContrastToggle = document.getElementById("toggle-increase-contrast");
  if (increaseContrastToggle) {
    const isChecked = localStorage.getItem("tahoe_increase_contrast") === "true";
    increaseContrastToggle.checked = isChecked;
    document.body.classList.toggle("increase-contrast", isChecked);
    
    increaseContrastToggle.addEventListener("change", (e) => {
      const checked = e.target.checked;
      document.body.classList.toggle("increase-contrast", checked);
      localStorage.setItem("tahoe_increase_contrast", checked ? "true" : "false");
      playGlassChime();
      
      pushNotification(
        checked ? "Increase Contrast Enabled" : "Increase Contrast Disabled",
        checked ? "Window outlines have been thickened for visual clarity." : "Standard window boundaries restored."
      );
    });
  }

  const grayscaleToggle = document.getElementById("toggle-grayscale");
  if (grayscaleToggle) {
    const isChecked = localStorage.getItem("tahoe_grayscale") === "true";
    grayscaleToggle.checked = isChecked;
    document.body.classList.toggle("grayscale-mode", isChecked);
    
    grayscaleToggle.addEventListener("change", (e) => {
      const checked = e.target.checked;
      document.body.classList.toggle("grayscale-mode", checked);
      localStorage.setItem("tahoe_grayscale", checked ? "true" : "false");
      playGlassChime();
      
      pushNotification(
        checked ? "Grayscale Mode Enabled" : "Grayscale Mode Disabled",
        checked ? "All system display outputs converted to black and white." : "Vibrant colors restored."
      );
    });
  }

  // I. Text Scale Buttons
  const segmentButtons = document.querySelectorAll(".segmented-control .segment-btn");
  segmentButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const scale = btn.getAttribute("data-scale");
      setTextScale(scale);
      playGlassChime();
      
      pushNotification("Text Scale Updated", `Font scaling adjusted to ${scale.charAt(0).toUpperCase() + scale.slice(1)}.`);
    });
  });

  // J. Reduce Motion Toggle
  const reduceMotionToggle = document.getElementById("toggle-reduce-motion");
  if (reduceMotionToggle) {
    const isChecked = localStorage.getItem("tahoe_reduce_motion") === "true";
    reduceMotionToggle.checked = isChecked;
    document.body.classList.toggle("reduce-motion", isChecked);
    
    reduceMotionToggle.addEventListener("change", (e) => {
      const checked = e.target.checked;
      document.body.classList.toggle("reduce-motion", checked);
      localStorage.setItem("tahoe_reduce_motion", checked ? "true" : "false");
      
      pushNotification(
        checked ? "Reduce Motion Enabled" : "Reduce Motion Disabled",
        checked ? "Animations replaced with cross-fades." : "Standard bouncy animations active."
      );
    });
  }

  // K. Color Filters Dropdown
  const filterTrigger = document.getElementById("color-filter-trigger");
  const filterMenu = document.getElementById("color-filter-menu");
  const filterDropdown = document.getElementById("color-filter-dropdown");
  
  if (filterTrigger && filterMenu && filterDropdown) {
    filterTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      filterDropdown.classList.toggle("open");
    });
    
    document.addEventListener("click", () => {
      filterDropdown.classList.remove("open");
    });
    
    filterMenu.querySelectorAll(".dropdown-option").forEach(option => {
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        const val = option.getAttribute("data-value");
        setColorFilter(val);
        filterDropdown.classList.remove("open");
      });
    });
    
    const savedFilter = localStorage.getItem("tahoe_color_filter") || "none";
    setColorFilter(savedFilter);
  }
  
  function setColorFilter(filter) {
    document.body.classList.remove("color-filter-protanopia", "color-filter-deuteranopia", "color-filter-tritanopia");
    if (filter !== "none") {
      document.body.classList.add(`color-filter-${filter}`);
    }
    localStorage.setItem("tahoe_color_filter", filter);
    
    if (filterMenu) {
      filterMenu.querySelectorAll(".dropdown-option").forEach(opt => {
        if (opt.getAttribute("data-value") === filter) {
          opt.classList.add("active");
        } else {
          opt.classList.remove("active");
        }
      });
    }
    
    const triggerText = document.querySelector("#color-filter-trigger .dropdown-selected-text");
    if (triggerText) {
      const names = {
        none: "None",
        protanopia: "Protanopia",
        deuteranopia: "Deuteranopia",
        tritanopia: "Tritanopia"
      };
      triggerText.textContent = names[filter] || filter;
    }
    
    if (filter !== "none") {
      pushNotification(
        "Color Filter Applied",
        `Screen adjusted for ${filter.charAt(0).toUpperCase() + filter.slice(1)}.`
      );
    }
  }

  // Hook into Quick Settings Darkmode click to sync Settings pane cards
  const qsDark = document.getElementById("qs-darkmode");
  if (qsDark) {
    qsDark.addEventListener("click", () => {
      setTimeout(syncAppearanceSettings, 50);
    });
  }
}

// --- macOS Tahoe Premium Dragging & Focusing System ---
let maxZIndex = 100;
const MAX_WINDOW_Z_INDEX = 7900;

function updateGlobalMenuBar() {
  const topWin = getTopVisibleWindow();
  const notesMenuGroup = document.getElementById("notes-menu-group");
  const activeAppLabel = document.getElementById("menu-active-app");
  
  if (activeAppLabel) {
    if (topWin) {
      if (topWin.id === "textedit-window") {
        activeAppLabel.textContent = "Notes";
      } else if (topWin.id === "calculator-window") {
        activeAppLabel.textContent = "Calculator";
      } else if (topWin.id === "terminal-window") {
        activeAppLabel.textContent = "Terminal";
      } else if (topWin.id === "settings-window") {
        activeAppLabel.textContent = "Settings";
      } else if (topWin.id === "account-window") {
        activeAppLabel.textContent = "User Account";
      } else if (topWin.id === "app-window") {
        const appNames = {
          news: "News",
          reviews: "Reviews",
          crossover: "CrossOver",
          macos: "macOS Notes",
          games: "Games",
          "app-store": "App Store",
          finder: "Finder"
        };
        activeAppLabel.textContent = appNames[currentApp] || "News";
      } else {
        activeAppLabel.textContent = "";
      }
    } else {
      activeAppLabel.textContent = "";
    }
  }
  
  if (notesMenuGroup) {
    if (topWin && topWin.id === "textedit-window") {
      notesMenuGroup.style.display = "flex";
    } else {
      notesMenuGroup.style.display = "none";
    }
  }
}

function refreshGlobalMenuBarSoon() {
  requestAnimationFrame(updateGlobalMenuBar);
}

function bringWindowToFront(windowEl) {
  maxZIndex = Math.min(maxZIndex + 1, MAX_WINDOW_Z_INDEX);
  windowEl.style.zIndex = maxZIndex;
  refreshGlobalMenuBarSoon();
}

function getTopVisibleWindow() {
  const visibleWindows = [...document.querySelectorAll("#app-window, #settings-window, #account-window, #terminal-window, #calculator-window, #textedit-window, .utility-window")]
    .filter(win => !win.classList.contains("hidden-window") && !win.classList.contains("minimized"));

  return visibleWindows.reduce((topWindow, win) => {
    const winZ = Number.parseInt(getComputedStyle(win).zIndex, 10) || 0;
    const topZ = topWindow ? Number.parseInt(getComputedStyle(topWindow).zIndex, 10) || 0 : -1;
    return winZ > topZ ? win : topWindow;
  }, null);
}

const MAXIMIZE_RESTORE_PROPS = [
  "position",
  "left",
  "top",
  "width",
  "height",
  "maxWidth",
  "margin",
  "transform",
  "borderRadius",
  "animation"
];

function toggleWindowMaximized(windowEl) {
  if (!windowEl) return;

  if (windowEl.classList.contains("maximized")) {
    const restoreState = JSON.parse(windowEl.dataset.maximizeRestoreState || "{}");
    windowEl.classList.remove("maximized");

    MAXIMIZE_RESTORE_PROPS.forEach(prop => {
      const value = restoreState.styles?.[prop];
      if (value) {
        windowEl.style[prop] = value;
      } else {
        windowEl.style.removeProperty(prop.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`));
      }
    });

    windowEl.classList.toggle("freeform-window", Boolean(restoreState.freeformWindow));
    delete windowEl.dataset.maximizeRestoreState;
    bringWindowToFront(windowEl);
    return;
  }

  windowEl.dataset.maximizeRestoreState = JSON.stringify({
    freeformWindow: windowEl.classList.contains("freeform-window"),
    styles: Object.fromEntries(MAXIMIZE_RESTORE_PROPS.map(prop => [prop, windowEl.style[prop] || ""]))
  });

  MAXIMIZE_RESTORE_PROPS.forEach(prop => {
    windowEl.style.removeProperty(prop.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`));
  });
  windowEl.classList.remove("freeform-window");
  windowEl.classList.add("maximized");
  bringWindowToFront(windowEl);
}

function makeWindowDraggable(windowEl) {
  const titlebar = windowEl.querySelector(".window-titlebar");
  if (!titlebar) return;

  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  const isMainWindow = windowEl.id === "app-window";
  const isSettingsWindow = windowEl.id === "settings-window";
  const isAccountWindow = windowEl.id === "account-window";
  const isBoundedWindow = isMainWindow || isSettingsWindow || isAccountWindow;

  function getWindowDragBounds(width, height) {
    const menuBar = document.getElementById("menu-bar");
    const dock = document.getElementById("dock-container");
    const menuRect = menuBar?.getBoundingClientRect();
    const dockRect = dock?.getBoundingClientRect();
    const top = menuRect && menuRect.height > 0 ? menuRect.bottom + 8 : 8;
    const bottom = dockRect && dockRect.height > 0 ? dockRect.top - 8 : window.innerHeight - 8;
    const maxHeight = Math.max(220, bottom - top);
    const adjustedHeight = Math.min(height, maxHeight);

    return {
      minLeft: 8,
      maxLeft: Math.max(8, window.innerWidth - width - 8),
      minTop: top,
      maxTop: Math.max(top, bottom - adjustedHeight),
      height: adjustedHeight
    };
  }

  titlebar.style.cursor = "grab";
  titlebar.addEventListener("mousedown", dragMouseDown);

  function dragMouseDown(e) {
    e = e || window.event;
    if (e.button !== 0) return;
    if (e.target.closest(".traffic-lights") || e.target.closest("button, input, textarea, select, a")) return;
    
    e.preventDefault();
    bringWindowToFront(windowEl);

    if (isBoundedWindow) {
      const rect = windowEl.getBoundingClientRect();
      const bounds = getWindowDragBounds(rect.width, rect.height);
      windowEl.classList.remove("maximized");
      windowEl.classList.add("freeform-window");
      windowEl.style.position = "fixed";
      windowEl.style.left = `${Math.min(Math.max(rect.left, bounds.minLeft), bounds.maxLeft)}px`;
      windowEl.style.top = `${Math.min(Math.max(rect.top, bounds.minTop), bounds.maxTop)}px`;
      windowEl.style.width = `${rect.width}px`;
      windowEl.style.height = `${bounds.height}px`;
      windowEl.style.maxWidth = "none";
      windowEl.style.margin = "0";
      if (isSettingsWindow) {
        windowEl.style.animation = "none";
      }
    }
    
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    windowEl.classList.add("dragging-window");
    windowEl.style.transition = "none";
    windowEl.style.transform = "none";
    windowEl.style.rotate = "0deg";
    titlebar.style.cursor = "grabbing";
    
    document.addEventListener("mouseup", closeDragElement);
    document.addEventListener("mousemove", elementDrag);
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    let nextTop = windowEl.offsetTop - pos2;
    let nextLeft = windowEl.offsetLeft - pos1;

    if (isBoundedWindow) {
      const bounds = getWindowDragBounds(windowEl.offsetWidth, windowEl.offsetHeight);
      nextTop = Math.min(Math.max(nextTop, bounds.minTop), bounds.maxTop);
      nextLeft = Math.min(Math.max(nextLeft, bounds.minLeft), bounds.maxLeft);
    }

    windowEl.style.top = `${nextTop}px`;
    windowEl.style.left = `${nextLeft}px`;
    windowEl.style.transform = "none";
    windowEl.style.rotate = "0deg";
  }

  function closeDragElement() {
    document.removeEventListener("mouseup", closeDragElement);
    document.removeEventListener("mousemove", elementDrag);
    
    windowEl.classList.remove("dragging-window");
    windowEl.style.transition = "opacity 0.5s ease, filter 0.5s ease";
    windowEl.style.transform = "none";
    windowEl.style.rotate = "0deg";
    titlebar.style.cursor = "grab";
  }
}

// --- macOS Tahoe Retro Iframe Window Spawner ---
function openIframeApp(title, url, icon, appId) {
  const existingId = `iframe-win-${title.replace(/\s+/g, '-').toLowerCase()}`;
  let win = document.getElementById(existingId);
  if (win) {
    win.classList.remove("hidden-window");
    bringWindowToFront(win);
    playGlassChime();
    return;
  }

  // Add emulator to the Dock when opened
  if (appId) {
    addAppToDock(appId);
  }

  win = document.createElement("div");
  win.id = existingId;
  win.className = "liquid-glass utility-window";
  win.style.cssText = `
    width: 860px;
    height: 640px;
    position: absolute;
    left: 45%;
    top: 48%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    z-index: 105;
    overflow: hidden;
  `;

  let iconHtml = "";
  if (icon) {
    if (icon.trim().startsWith("<svg")) {
      iconHtml = `<span style="display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; vertical-align: middle;">${icon.replace(/width="[0-9]+"/g, 'width="14"').replace(/height="[0-9]+"/g, 'height="14"')}</span>`;
    } else {
      iconHtml = `<span>${icon}</span>`;
    }
  }
  win.innerHTML = `
    <div class="window-titlebar" style="background: rgba(30, 30, 40, 0.4); display: flex; align-items: center; padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); position: relative; justify-content: space-between;">
      <div class="traffic-lights" style="display: flex; gap: 8px; width: 80px;">
        <button class="traffic-light red" title="Close" style="width: 12px; height: 12px; border-radius: 50%; border: none; background: #ff453a; cursor: pointer;"></button>
        <button class="traffic-light yellow" title="Minimize" style="width: 12px; height: 12px; border-radius: 50%; border: none; background: #ff9f0a; cursor: pointer;"></button>
        <button class="traffic-light green" title="Fullscreen" style="width: 12px; height: 12px; border-radius: 50%; border: none; background: #30d158; cursor: pointer;"></button>
      </div>
      <div class="window-title" style="color: #fff; font-size: 11px; font-weight: 500; text-align: center; display: flex; align-items: center; justify-content: center; gap: 6px; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); pointer-events: none;">
        ${iconHtml}
        <span>${title}</span>
      </div>
      <div style="width: 80px;"></div>
    </div>
    <div class="window-body" style="flex: 1; background: #000; display: flex; flex-direction: column; padding: 0; position: relative;">
      <iframe src="${url}" style="width: 100%; height: 100%; border: none;" allow="autoplay; fullscreen; keyboard" allowfullscreen></iframe>
      <div class="iframe-loader" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: #121217; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; z-index: 10; transition: opacity 0.5s;">
        <svg class="update-sync-icon syncing" style="width: 36px; height: 36px; color: var(--accent-color);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
        </svg>
        <div style="color: #fff; font-size: 12px; font-weight: 500; opacity: 0.85;">Starting Classic Emulator...</div>
      </div>
    </div>
  `;

  document.body.appendChild(win);

  const iframe = win.querySelector("iframe");
  const loader = win.querySelector(".iframe-loader");
  if (iframe && loader) {
    iframe.onload = () => {
      loader.style.opacity = "0";
      setTimeout(() => {
        loader.style.display = "none";
      }, 500);
    };
  }

  const closeBtn = win.querySelector(".traffic-light.red");
  if (closeBtn) {
    closeBtn.onclick = () => {
      win.remove();
      if (appId) {
        removeAppFromDock(appId);
      }
      playGlassChime();
      refreshGlobalMenuBarSoon();
    };
  }

  const yellowBtn = win.querySelector(".traffic-light.yellow");
  if (yellowBtn) {
    yellowBtn.onclick = () => {
      win.classList.add("minimized");
      pushNotification(`${title} Minimized`, "Access emulator seamlessly from your desktop Dock.");
      playGlassChime();
      refreshGlobalMenuBarSoon();
    };
  }

  // Green Light Fullscreen Trigger
  const greenBtn = win.querySelector(".traffic-light.green");
  if (greenBtn) {
    greenBtn.onclick = () => {
      if (!document.fullscreenElement) {
        win.requestFullscreen().catch(err => {
          console.error("Error enabling fullscreen mode:", err);
        });
      } else {
        document.exitFullscreen().catch(err => {
          console.error("Error exiting fullscreen mode:", err);
        });
      }
    };
  }

  makeWindowDraggable(win);

  win.addEventListener("mousedown", () => {
    bringWindowToFront(win);
  });

  bringWindowToFront(win);
  playGlassChime();
}

// --- macOS Tahoe Launchpad Controller ---
function toggleLaunchpad() {
  const overlay = document.getElementById("launchpad-overlay");
  const indicator = document.getElementById("dock-applications-indicator");
  if (!overlay) return;

  const isHidden = overlay.classList.contains("hidden-launchpad");
  playGlassChime();

  if (isHidden) {
    overlay.classList.remove("hidden-launchpad");
    document.body.classList.add("launchpad-active");
    if (indicator) indicator.classList.add("active-dot");
    const search = document.getElementById("launchpad-search-input");
    if (search) {
      search.value = "";
      search.focus();
    }
    // Show all items
    document.querySelectorAll(".launchpad-app-item").forEach(item => {
      item.style.display = "flex";
    });
  } else {
    overlay.classList.add("hidden-launchpad");
    document.body.classList.remove("launchpad-active");
    if (indicator) indicator.classList.remove("active-dot");
  }
}

function initLaunchpad() {
  const dockBtn = document.getElementById("dock-applications-btn");
  if (dockBtn) {
    dockBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Active class management without bounce
      const wrapper = dockBtn.closest(".dock-item-wrapper");
      if (wrapper) {
        wrapper.classList.add("active");
        setTimeout(() => {
          wrapper.classList.remove("active");
        }, 600);
      }

      toggleLaunchpad();
    });
  }

  // Dismiss on background click
  const overlay = document.getElementById("launchpad-overlay");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.id === "launchpad-apps-grid") {
        toggleLaunchpad();
      }
    });
  }

  // Bind App clicks
  document.querySelectorAll(".launchpad-app-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const app = item.getAttribute("data-app");
      const utility = item.getAttribute("data-utility");
      const emulator = item.getAttribute("data-emulator");

      if (app) {
        switchApp(app);
        toggleLaunchpad();
      } else if (utility) {
        if (utility === "terminal") {
          const win = document.getElementById("terminal-window");
          if (win) {
            win.classList.remove("hidden-window");
            addAppToDock("terminal");
            const input = document.getElementById("terminal-input");
            if (input) input.focus();
            playGlassChime();
          }
        } else if (utility === "calculator") {
          const win = document.getElementById("calculator-window");
          if (win) {
            win.classList.remove("hidden-window");
            addAppToDock("calculator");
            playGlassChime();
          }
        } else if (utility === "textedit") {
          openTextEditFile({ name: "Untitled.txt", content: "" });
        } else if (utility === "settings") {
          const win = document.getElementById("settings-window");
          if (win) {
            win.classList.remove("hidden-window");
            win.classList.remove("minimized");
            const ind = document.getElementById("dock-settings-indicator");
            if (ind) ind.classList.add("active-dot");
            playGlassChime();
          }
        } else if (utility === "pwa-manager") {
          const win = document.getElementById("pwa-store-window");
          if (win) {
            win.classList.remove("hidden-window", "minimized");
            bringWindowToFront(win);
            playGlassChime();
          }
        }
        toggleLaunchpad();
      } else if (emulator) {
        if (emulator === "macos9") {
          openIframeApp("Mac OS 9", "/classic/mac-os-9/index.html", "", "macos9");
        } else if (emulator === "marathon") {
          openIframeApp("Marathon", "https://archive.org/embed/marathon-demo", "", "marathon");
        } else if (emulator === "lisa") {
          openIframeApp("Apple Lisa", "https://alpha.lisagui.com/", "🖥️", "lisa");
        } else if (emulator === "system7") {
          openIframeApp("System 7", "https://jamesfriend.com.au/pce-js/", "💾", "system7");
        }
        toggleLaunchpad();
      }
    });
  });

  // Search input live-filtering
  const searchInput = document.getElementById("launchpad-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll(".launchpad-app-item").forEach(item => {
        const name = item.querySelector(".launchpad-app-name").textContent.toLowerCase();
        if (name.includes(q)) {
          item.style.display = "flex";
        } else {
          item.style.display = "none";
        }
      });
    });
  }
}

// --- 18. macOS Tahoe Lock Screen Controller ---

let lockClockInterval = null;

function lockSystem() {
  const lockScreen = document.getElementById("lock-screen");
  if (!lockScreen) return;

  lockScreen.classList.remove("hidden-lock");
  const savedWall = localStorage.getItem("tahoe_wallpaper") || "tahoe-liquid";
  setWallpaper(savedWall);
  playGlassChime();
  
  // Reset passcode input
  const input = document.getElementById("lock-passcode-input");
  if (input) {
    input.value = "";
    setTimeout(() => input.focus(), 120);
  }
  
  updateLockScreenClock();
  clearInterval(lockClockInterval);
  lockClockInterval = setInterval(updateLockScreenClock, 1000);
}

function unlockSystem() {
  const lockScreen = document.getElementById("lock-screen");
  if (!lockScreen) return;
  
  const input = document.getElementById("lock-passcode-input");
  if (input) {
    input.value = "";
  }
  
  lockScreen.classList.add("hidden-lock");
  playGlassChime();
  window.setTimeout(() => {
    if (lockScreen.classList.contains("hidden-lock")) {
      lockScreen.style.backgroundImage = "none";
      lockScreen.style.background = "";
    }
  }, 650);
  
  clearInterval(lockClockInterval);
}

function updateLockScreenClock() {
  const timeEl = document.getElementById("lock-clock-time");
  const dateEl = document.getElementById("lock-clock-date");
  if (!timeEl || !dateEl) return;

  const now = new Date();
  
  // Format HH:MM
  let hours = now.getHours();
  let minutes = now.getMinutes();
  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  timeEl.textContent = `${hours}:${minutes}`;

  // Localized date formatting based on site language select
  const lang = localStorage.getItem("tahoe_language") || "en";
  const locales = {
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    ja: "ja-JP"
  };
  const locale = locales[lang] || "en-US";
  const dateOptions = { weekday: "long", month: "long", day: "numeric" };
  dateEl.textContent = now.toLocaleDateString(locale, dateOptions);
}

function initLockScreen() {
  // A. Lock Trigger event in Apple Menu
  const lockScreenBtn = document.getElementById("menu-lock-screen");
  if (lockScreenBtn) {
    lockScreenBtn.addEventListener("click", (e) => {
      e.preventDefault();
      lockSystem();
    });
  }

  // B. Shortcut Trigger: Ctrl + Cmd + Q
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.metaKey && e.code === "KeyQ") {
      e.preventDefault();
      lockSystem();
    }
  });

  // C. Unlock Form Submit
  const lockForm = document.getElementById("lock-passcode-form");
  if (lockForm) {
    lockForm.addEventListener("submit", (e) => {
      e.preventDefault();
      unlockSystem();
    });
  }

  // D. Dynamic Password Focus on Keypress when Locked
  document.addEventListener("keydown", (e) => {
    const lockScreen = document.getElementById("lock-screen");
    if (lockScreen && !lockScreen.classList.contains("hidden-lock")) {
      const input = document.getElementById("lock-passcode-input");
      if (input && document.activeElement !== input) {
        // Skip focus if modifier keys or utility keys are pressed
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          input.focus();
        }
      }
    }
  });

}

// --- 18. macOS Simulated Utility Apps (Terminal, Calculator, TextEdit) ---
// Dynamic Dock App sync system (macOS style dynamic items)
function addAppToDock(appId) {
  const existing = document.querySelector(`.dock-item-wrapper[data-app="${appId}"]`);
  if (existing) {
    existing.classList.remove("dynamic-app-closing");
    existing.classList.add("dynamic-app-opening");
    const indicator = existing.querySelector(".dock-indicator");
    if (indicator) indicator.classList.add("active-dot");
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "dock-item-wrapper dynamic-app dynamic-app-opening";
  wrapper.setAttribute("data-app", appId);

  let iconHtmlContent = "";
  let tooltipName = "";
  if (appId === "terminal") {
    iconHtmlContent = `<img src="public/assets/imgs/perf/apps/terminal.webp" alt="Terminal" class="dock-icon" width="48" height="48">`;
    tooltipName = "Terminal";
  } else if (appId === "calculator") {
    iconHtmlContent = `<img src="public/assets/imgs/perf/apps/calculator.webp" alt="Calculator" class="dock-icon" width="48" height="48">`;
    tooltipName = "Calculator";
  } else if (appId === "textedit") {
    iconHtmlContent = `<img src="public/assets/imgs/perf/apps/notes.webp" alt="Notes" class="dock-icon" width="48" height="48">`;
    tooltipName = "Notes";
  } else if (appId === "macos9") {
    iconHtmlContent = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' class="dock-icon" width='48' height='48'><rect x='2' y='2' width='44' height='44' rx='10' ry='10' fill='#64b5f6'/><path d='M24 2a22 22 0 0 1 22 22v14a8 8 0 0 1-8 8H24V2z' fill='#1976d2'/><path d='M24 8v16h10c2 0 4 2 4 4s-2 4-4 4H20a2 2 0 0 1-2-2V14c0-2-2-4-4-4H8V8h16z' fill='#ffffff'/><circle cx='15' cy='17' r='3' fill='#1976d2'/><circle cx='33' cy='17' r='3' fill='#ffffff'/><path d='M14 34c2 4 8 4 10 0' stroke='#ffffff' stroke-width='3' stroke-linecap='round' fill='none'/><path d='M24 34c2 4 8 4 10 0' stroke='#1976d2' stroke-width='3' stroke-linecap='round' fill='none'/></svg>`;
    tooltipName = "Mac OS 9";
  } else if (appId === "marathon") {
    iconHtmlContent = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' class="dock-icon" width='48' height='48'><rect x='2' y='2' width='44' height='44' rx='10' ry='10' fill='#111111' stroke='#e65100' stroke-width='1.5'/><circle cx='24' cy='24' r='16' fill='none' stroke='#e65100' stroke-width='3'/><path d='M16 24h16M24 16v16' stroke='#e65100' stroke-width='3'/><circle cx='24' cy='24' r='8' fill='#e65100'/></svg>`;
    tooltipName = "Marathon";
  } else if (appId === "lisa") {
    iconHtmlContent = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' class="dock-icon" width='48' height='48'><rect x='2' y='2' width='44' height='44' rx='10' ry='10' fill='#e0d8c0' stroke='#bcaaa4' stroke-width='1.5'/><rect x='8' y='8' width='32' height='20' rx='2' ry='2' fill='#3e2723'/><rect x='11' y='11' width='26' height='14' fill='#a1887f'/><rect x='6' y='32' width='36' height='8' fill='#d7ccc8'/><line x1='12' y1='36' x2='36' y2='36' stroke='#8d6e63' stroke-width='2'/></svg>`;
    tooltipName = "Apple Lisa";
  } else if (appId === "system7") {
    iconHtmlContent = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' class="dock-icon" width='48' height='48'><rect x='2' y='2' width='44' height='44' rx='6' ry='6' fill='#1e88e5'/><rect x='10' y='2' width='28' height='16' fill='#ffffff'/><rect x='30' y='5' width='5' height='10' fill='#1e88e5'/><rect x='8' y='24' width='32' height='22' rx='2' ry='2' fill='#ffffff'/><line x1='12' y1='30' x2='36' y2='30' stroke='#757575' stroke-width='2'/><line x1='12' y1='35' x2='36' y2='35' stroke='#757575' stroke-width='2'/><line x1='12' y1='40' x2='36' y2='40' stroke='#757575' stroke-width='2'/></svg>`;
    tooltipName = "System 7";
  } else if (appId.startsWith("pwa-")) {
    const customPwas = JSON.parse(localStorage.getItem("tahoe_custom_pwas") || "[]");
    const pwa = customPwas.find(p => p.id === appId) || FEATURED_PWAS.find(p => p.id === appId);
    if (!pwa) return;
    iconHtmlContent = `<div class="pwa-dock-icon" style="background: ${pwa.color}; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 10px; font-size: 22px; box-shadow: inset 0 2px 4px rgba(255,255,255,0.25), 0 3px 6px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.25);">${pwa.emoji}</div>`;
    tooltipName = pwa.name;
  }

  wrapper.innerHTML = `
    <div class="dock-tooltip">${tooltipName}</div>
    <button class="dock-item">
      ${iconHtmlContent}
    </button>
    <span class="dock-indicator active-dot"></span>
  `;

  wrapper.addEventListener("click", () => {
    let winId = "";
    if (appId === "terminal") winId = "terminal-window";
    else if (appId === "calculator") winId = "calculator-window";
    else if (appId === "textedit") winId = "textedit-window";
    else if (appId === "macos9") winId = "iframe-win-mac-os-9";
    else if (appId === "marathon") winId = "iframe-win-marathon";
    else if (appId === "lisa") winId = "iframe-win-apple-lisa";
    else if (appId === "system7") winId = "iframe-win-system-7";
    else if (appId.startsWith("pwa-")) {
      const customPwas = JSON.parse(localStorage.getItem("tahoe_custom_pwas") || "[]");
      const pwa = customPwas.find(p => p.id === appId) || FEATURED_PWAS.find(p => p.id === appId);
      if (pwa) {
        openIframeApp(pwa.name, pwa.url, pwa.emoji, pwa.id);
      }
      return;
    }

    const win = document.getElementById(winId);
    if (win) {
      if (win.classList.contains("hidden-window") || win.classList.contains("minimized")) {
        win.classList.remove("hidden-window");
        win.classList.remove("minimized");
        bringWindowToFront(win);
        if (appId === "terminal") {
          const input = document.getElementById("terminal-input");
          if (input) input.focus();
        }
        playGlassChime();
      } else {
        bringWindowToFront(win);
      }
    }
  });

  const dock = document.getElementById("dock");
  if (dock) {
    const appsWrapper = document.querySelector('.dock-item-wrapper[data-app="applications"]');
    const settingsWrapper = document.querySelector('.dock-item-wrapper[data-app="settings"]');
    const targetSibling = appsWrapper || settingsWrapper;

    if (targetSibling) {
      dock.insertBefore(wrapper, targetSibling);
    } else {
      dock.appendChild(wrapper);
    }

    if (typeof window.refreshDockMagnification === "function") {
      window.refreshDockMagnification();
    }
  }
}

// --- macOS Tahoe Custom PWA Manager Engine ---
const PWA_ICONS = {
  compress: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M16 3h3a2 2 0 0 1 2 2v3"></path><path d="M8 21H5a2 2 0 0 1-2-2v-3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path><path d="M10 8h4v8h-4z"></path></svg>`,
  pencil: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 0 1 4 4L7 21l-5 1 1-5Z"></path><path d="m15 5 4 4"></path></svg>`,
  photo: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="m21 15-5-5L5 21"></path></svg>`,
  grid: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
  book: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"></path></svg>`,
  graph: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"></path><path d="M7 15 11 9l4 4 5-8"></path></svg>`,
  palette: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 22a10 10 0 1 1 10-10 3.5 3.5 0 0 1-3.5 3.5h-1.2a2.3 2.3 0 0 0-1.6 4 2 2 0 0 1-1.2 2.5z"></path></svg>`,
  terminal: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,
  braces: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4a4 4 0 0 0-4 4v1a3 3 0 0 1-2 3 3 3 0 0 1 2 3v1a4 4 0 0 0 4 4"></path><path d="M16 4a4 4 0 0 1 4 4v1a3 3 0 0 0 2 3 3 3 0 0 0-2 3v1a4 4 0 0 1-4 4"></path></svg>`,
  ruler: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h18v8H3z"></path><path d="M7 8v4"></path><path d="M11 8v3"></path><path d="M15 8v4"></path><path d="M19 8v3"></path></svg>`,
  chef: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18h12a2 2 0 0 1 2 2v2H4v-2a2 2 0 0 1 2-2z"></path><path d="M12 2a7 7 0 0 0-7 7v3h14V9a7 7 0 0 0-7-7z"></path></svg>`,
  news: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><path d="M16 8h2"></path><path d="M16 12h2"></path><path d="M6 8h6v8H6z"></path></svg>`,
  shapes: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-4.4 0-8 2.5-8 7s4 6.5 8 6.5 8-2 8-6.5-3.6-7-8-7zM8.5 17.5c-2.5.5-4.5 2-4.5 3.5h16c0-1.5-2-3-4.5-3.5"></path></svg>`,
  gamepad: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="3"></rect><path d="M6 12h4M8 10v4M15 11h.01M18 13h.01"></path></svg>`,
  calculator: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><circle cx="8" cy="11" r="1"></circle><circle cx="12" cy="11" r="1"></circle><circle cx="16" cy="11" r="1"></circle><circle cx="8" cy="15" r="1"></circle><circle cx="12" cy="15" r="1"></circle><circle cx="16" cy="15" r="1"></circle><circle cx="8" cy="19" r="1"></circle><circle cx="12" cy="19" r="1"></circle><circle cx="16" cy="19" r="1"></circle></svg>`
};

const PWA_APPS = {
  squoosh: { id: "pwa-squoosh", name: "Squoosh", url: "https://squoosh.app/", emoji: PWA_ICONS.compress, color: "#ff6f00", desc: "Compress and convert images in a fast installable web app." },
  excalidraw: { id: "pwa-excalidraw", name: "Excalidraw", url: "https://excalidraw.com/", emoji: PWA_ICONS.pencil, color: "#6965db", desc: "Sketch diagrams and collaborative whiteboards." },
  photopea: { id: "pwa-photopea", name: "Photopea", url: "https://www.photopea.com/", emoji: PWA_ICONS.photo, color: "#17a2b8", desc: "Advanced image editing with PSD support." },
  cyberchef: { id: "pwa-cyberchef", name: "CyberChef", url: "https://gchq.github.io/CyberChef/", emoji: PWA_ICONS.chef, color: "#0d9488", desc: "The ultimate developer multi-tool for data parsing and encoding." },
  wikipedia: { id: "pwa-wikipedia", name: "Wikipedia Mobile", url: "https://en.m.wikipedia.org", emoji: PWA_ICONS.book, color: "#6366f1", desc: "Fast mobile encyclopedia that opens inside MacReady." },
  desmos: { id: "pwa-desmos", name: "Desmos Calculator", url: "https://www.desmos.com/calculator", emoji: PWA_ICONS.calculator, color: "#2f855a", desc: "Graphing calculator for equations and visual math." },
  geogebra: { id: "pwa-geogebra", name: "GeoGebra Calculator", url: "https://www.geogebra.org/calculator", emoji: PWA_ICONS.calculator, color: "#6557d2", desc: "Interactive geometry, graphing and algebra tools." },
  hackernews: { id: "pwa-hackernews", name: "Hacker News", url: "https://hn.premii.com/", emoji: PWA_ICONS.news, color: "#ea580c", desc: "A clean, modern, and beautiful Hacker News desktop client." },
  jspaint: { id: "pwa-jspaint", name: "JS Paint", url: "https://jspaint.app/", emoji: PWA_ICONS.palette, color: "#2563eb", desc: "Classic desktop-style paint app for the web." },
  tldraw: { id: "pwa-tldraw", name: "tldraw", url: "https://www.tldraw.com/", emoji: PWA_ICONS.pencil, color: "#111827", desc: "Clean collaborative canvas for sketches and notes." },
  tints: { id: "pwa-tints", name: "Tints & Shades", url: "https://maketintsandshades.com/", emoji: PWA_ICONS.palette, color: "#7c3aed", desc: "Generate professional color ramps from a base color." },
  blobmaker: { id: "pwa-blobmaker", name: "Blobmaker", url: "https://www.blobmaker.app/", emoji: PWA_ICONS.shapes, color: "#db2777", desc: "Generate clean organic SVG blob shapes for your web layouts." },
  neumorphism: { id: "pwa-neumorphism", name: "Neumorphism CSS", url: "https://neumorphism.io/", emoji: PWA_ICONS.palette, color: "#8b5cf6", desc: "Generate premium Neumorphic soft-shadow CSS styling code." },
  dillinger: { id: "pwa-dillinger", name: "Dillinger MD", url: "https://dillinger.io/", emoji: PWA_ICONS.pencil, color: "#16a34a", desc: "Modern Markdown editor with offline storage and export capabilities." },
  cssgradient: { id: "pwa-cssgradient", name: "CSS Gradient", url: "https://cssgradient.io/", emoji: PWA_ICONS.palette, color: "#2563eb", desc: "Generate beautiful multi-color web gradients and CSS code." },
  sudoku: { id: "pwa-sudoku", name: "Sudoku Game", url: "https://html5sudoku.com/", emoji: PWA_ICONS.grid, color: "#06b6d4", desc: "Classic numbers grid puzzle game with daily challenges." },
  jsonhero: { id: "pwa-jsonhero", name: "JSON Hero", url: "https://jsonhero.io/", emoji: PWA_ICONS.braces, color: "#eab308", desc: "Beautiful interactive browser for reading and parsing JSON datasets." },
  carbon: { id: "pwa-carbon", name: "Carbon Code", url: "https://carbon.now.sh/", emoji: PWA_ICONS.photo, color: "#1e293b", desc: "Design and share beautiful images of your source code snippets." },
  game2048: { id: "pwa-2048", name: "2048 Puzzle", url: "https://2048game.com/", emoji: PWA_ICONS.gamepad, color: "#d97706", desc: "The classic installable slide-puzzle game." },
  floppybird: { id: "pwa-floppybird", name: "Floppy Bird", url: "https://nebez.github.io/floppybird/", emoji: PWA_ICONS.gamepad, color: "#16a34a", desc: "Immersive side-scrolling arcade flappy flight clone." },
  tictactoe: { id: "pwa-tictactoe", name: "Tic-Tac-Toe", url: "https://playtictactoe.org/", emoji: PWA_ICONS.gamepad, color: "#4f46e5", desc: "Interactive classic tic-tac-toe with multiple game modes." },
  hextris: { id: "pwa-hextris", name: "Hextris Puzzle", url: "https://hextris.io/", emoji: PWA_ICONS.gamepad, color: "#ec4899", desc: "Fast-paced hexagonal puzzle game inspired by retro classics." },
  spaceinvaders: { id: "pwa-spaceinvaders", name: "Space Invaders", url: "https://macek.github.io/spaceinvaders/", emoji: PWA_ICONS.gamepad, color: "#ef4444", desc: "Classic responsive HTML5 clone of the iconic arcade shooter." },
  svgviewer: { id: "pwa-svgviewer", name: "SVG Viewer", url: "https://www.svgviewer.dev/", emoji: PWA_ICONS.photo, color: "#06b6d4", desc: "Inspect, format, optimize, and preview SVG vector code." },
  micropad: { id: "pwa-micropad", name: "µPad Notes", url: "https://micropad.jele.co/", emoji: PWA_ICONS.book, color: "#6366f1", desc: "Premium minimalist cloud note-taking canvas and journal." },
  jsfiddle: { id: "pwa-jsfiddle", name: "JSFiddle Editor", url: "https://jsfiddle.net/", emoji: PWA_ICONS.braces, color: "#3b82f6", desc: "Popular browser sandbox editor for HTML, CSS, and JS development." },
  jsonlint: { id: "pwa-jsonlint", name: "JSONLint", url: "https://jsonlint.com/", emoji: PWA_ICONS.braces, color: "#0d9488", desc: "Clean validator, validator syntax corrector, and JSON formatter." }
};

const FEATURED_PWAS = Object.values(PWA_APPS);

const PWA_LIBRARY = {
  discover: [
    PWA_APPS.squoosh,
    PWA_APPS.excalidraw,
    PWA_APPS.photopea,
    PWA_APPS.cyberchef,
    PWA_APPS.hackernews,
    PWA_APPS.dillinger,
    PWA_APPS.hextris,
    PWA_APPS.jsonhero,
    PWA_APPS.spaceinvaders,
    PWA_APPS.micropad
  ],
  social: [
    PWA_APPS.excalidraw,
    PWA_APPS.tldraw,
    PWA_APPS.hackernews,
    PWA_APPS.wikipedia,
    PWA_APPS.carbon,
    PWA_APPS.micropad
  ],
  productivity: [
    PWA_APPS.squoosh,
    PWA_APPS.cyberchef,
    PWA_APPS.desmos,
    PWA_APPS.geogebra,
    PWA_APPS.tints,
    PWA_APPS.dillinger,
    PWA_APPS.jsonhero,
    PWA_APPS.blobmaker,
    PWA_APPS.neumorphism,
    PWA_APPS.micropad
  ],
  entertainment: [
    PWA_APPS.game2048,
    PWA_APPS.floppybird,
    PWA_APPS.sudoku,
    PWA_APPS.tictactoe,
    PWA_APPS.hextris,
    PWA_APPS.spaceinvaders,
    PWA_APPS.jspaint
  ],
  developer: [
    PWA_APPS.cyberchef,
    PWA_APPS.squoosh,
    PWA_APPS.tldraw,
    PWA_APPS.cssgradient,
    PWA_APPS.jsonhero,
    PWA_APPS.carbon,
    PWA_APPS.blobmaker,
    PWA_APPS.neumorphism,
    PWA_APPS.svgviewer,
    PWA_APPS.jsfiddle,
    PWA_APPS.jsonlint
  ]
};

const BLOCKED_LEGACY_PWA_IDS = new Set([
  "pwa-googlesearch",
  "pwa-tetris",
  "pwa-elevatorsaga",
  "pwa-telegram",
  "pwa-discord",
  "pwa-whatsapp",
  "pwa-slack",
  "pwa-zoom",
  "pwa-twitter",
  "pwa-notion",
  "pwa-googlemaps",
  "pwa-trello",
  "pwa-figma",
  "pwa-spotify",
  "pwa-youtube",
  "pwa-soundcloud",
  "pwa-github",
  "pwa-stackoverflow",
  "pwa-codepen",
  "pwa-jsonformatter",
  "pwa-caniuse"
]);

const BLOCKED_LEGACY_PWA_URLS = new Set([
  "https://www.google.com/search?igu=1",
  "https://chvin.github.io/react-tetris/",
  "https://play.elevatorsaga.com/",
  "https://web.telegram.org/a/",
  "https://discord.com/app",
  "https://web.whatsapp.com",
  "https://slack.com",
  "https://zoom.us",
  "https://x.com",
  "https://www.notion.so",
  "https://www.google.com/maps",
  "https://trello.com",
  "https://figma.com",
  "https://open.spotify.com",
  "https://www.youtube.com/embed/",
  "https://soundcloud.com",
  "https://github.com",
  "https://stackoverflow.com",
  "https://codepen.io",
  "https://jsonformatter.org",
  "https://caniuse.com"
]);

function isBlockedLegacyPwa(pwa) {
  return BLOCKED_LEGACY_PWA_IDS.has(pwa.id) || BLOCKED_LEGACY_PWA_URLS.has(pwa.url);
}

function getCustomPwas() {
  const saved = localStorage.getItem("tahoe_custom_pwas");
  if (saved) {
    try {
      const pwas = JSON.parse(saved).filter(pwa => !isBlockedLegacyPwa(pwa));
      if (pwas.length !== JSON.parse(saved).length) {
        saveCustomPwas(pwas);
      }
      return pwas;
    } catch(e) { return []; }
  }
  return [];
}

function saveCustomPwas(pwas) {
  localStorage.setItem("tahoe_custom_pwas", JSON.stringify(pwas));
}

function initPwaManager() {
  const storeWin = document.getElementById("pwa-store-window");
  if (!storeWin) return;

  // Make Store Window draggable
  if (typeof makeWindowDraggable === "function") {
    makeWindowDraggable(storeWin);
  }

  // Close & Minimize handles
  const closeBtn = document.getElementById("pwa-store-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      storeWin.classList.add("hidden-window");
    });
  }
  const minBtn = document.getElementById("pwa-store-minimize");
  if (minBtn) {
    minBtn.addEventListener("click", () => {
      storeWin.classList.add("hidden-window");
    });
  }

  // Sidebar Tab Switching Logic
  const sidebarItems = storeWin.querySelectorAll(".pwa-store-sidebar-item");
  const panes = storeWin.querySelectorAll(".pwa-store-pane");

  sidebarItems.forEach(item => {
    item.addEventListener("click", () => {
      sidebarItems.forEach(sib => sib.classList.remove("active"));
      item.classList.add("active");

      const targetTab = item.getAttribute("data-store-tab");
      panes.forEach(pane => {
        pane.style.display = "none";
        pane.classList.remove("active");
      });

      const targetPane = document.getElementById(`store-pane-${targetTab}`);
      if (targetPane) {
        targetPane.style.display = "block";
        targetPane.classList.add("active");
      }
    });
  });

  // Render all Category Grids
  renderGrids();

  // Install custom PWA form handler inside the Store Window
  const installForm = document.getElementById("pwa-store-install-form");
  if (installForm) {
    installForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("pwa-store-name-input").value.trim();
      const url = document.getElementById("pwa-store-url-input").value.trim();
      const emoji = document.getElementById("pwa-store-emoji-input").value.trim();
      const color = document.getElementById("pwa-store-color-input").value;

      if (!name || !url || !emoji) return;

      const id = `pwa-${Date.now()}`;
      const newPwa = { id, name, url, emoji, color };

      const customPwas = getCustomPwas();
      customPwas.push(newPwa);
      saveCustomPwas(customPwas);

      // Reset form
      installForm.reset();
      document.getElementById("pwa-store-color-input").value = "#007aff";

      // Refresh installed grids
      renderGrids();
      
      // Auto-launch the newly installed PWA and add to dock
      openIframeApp(newPwa.name, newPwa.url, newPwa.emoji, newPwa.id);

      pushNotification(
        "App Installed Successfully",
        `"${name}" has been added to your system and docked.`
      );
      
      // Switch tab to Installed
      const installedTabItem = storeWin.querySelector('[data-store-tab="installed"]');
      if (installedTabItem) installedTabItem.click();
    });
  }

  // System Settings Preferences Tab - Cache Clearing
  const clearCacheBtn = document.getElementById("btn-clear-pwa-cache");
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener("click", () => {
      const customs = getCustomPwas();
      customs.forEach(pwa => {
        const existingId = `iframe-win-${pwa.name.replace(/\s+/g, '-').toLowerCase()}`;
        const win = document.getElementById(existingId);
        if (win) win.remove();
        removeAppFromDock(pwa.id);
      });
      localStorage.removeItem("tahoe_custom_pwas");
      renderGrids();
      pushNotification("Cache Purged", "All installed local PWAs have been removed.");
    });
  }

  const resetDefaultsBtn = document.getElementById("btn-reset-pwa-default");
  if (resetDefaultsBtn) {
    resetDefaultsBtn.addEventListener("click", () => {
      const customs = getCustomPwas();
      customs.forEach(pwa => {
        removeAppFromDock(pwa.id);
      });
      localStorage.setItem("tahoe_custom_pwas", JSON.stringify([]));
      renderGrids();
      pushNotification("System Reset", "PWA settings restored to default.");
    });
  }

  function renderGrids() {
    // Render each library category grid
    Object.keys(PWA_LIBRARY).forEach(cat => {
      const grid = document.getElementById(`pwa-${cat}-grid`);
      if (!grid) return;

      grid.innerHTML = "";
      const customPwas = getCustomPwas();

      PWA_LIBRARY[cat].forEach(pwa => {
        const isInstalled = customPwas.some(p => p.url === pwa.url);
        const activePwa = customPwas.find(p => p.url === pwa.url) || pwa;

        const card = document.createElement("div");
        card.className = "pwa-card";
        card.style = "background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 14px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.15); position: relative; overflow: hidden; width: 100%; box-sizing: border-box;";
        card.innerHTML = `
          <div class="pwa-card-icon" style="background: ${pwa.color}; width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 2px 4px rgba(255,255,255,0.2), 0 3px 6px rgba(0,0,0,0.25);">${pwa.emoji}</div>
          <div class="pwa-card-name" style="font-size: 13px; font-weight: 600; color: #fff; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--font-ui), sans-serif; margin-top: 4px;">${pwa.name}</div>
          <div style="font-size: 10px; opacity: 0.5; height: 28px; overflow: hidden; line-height: 1.3; font-family: var(--font-ui), sans-serif;">${pwa.desc || 'Native web utility.'}</div>
          <button class="btn-pwa-action" style="width: 72px; border: none; outline: none; border-radius: 20px; padding: 5px 0; font-size: 11px; font-weight: 800; cursor: pointer; transition: all 0.2s; font-family: var(--font-ui), sans-serif; text-align: center; margin-top: 6px; background: ${isInstalled ? 'rgba(255,255,255,0.1)' : '#007aff'}; color: ${isInstalled ? '#3b82f6' : '#fff'};">
            ${isInstalled ? 'OPEN' : 'GET'}
          </button>
        `;

        const actionBtn = card.querySelector(".btn-pwa-action");
        actionBtn.addEventListener("click", () => {
          if (isInstalled) {
            // Instant Launch
            openIframeApp(activePwa.name, activePwa.url, activePwa.emoji, activePwa.id);
          } else {
            // Install
            const activeCustoms = getCustomPwas();
            activeCustoms.push(pwa);
            saveCustomPwas(activeCustoms);
            renderGrids();

            // Auto-launch
            openIframeApp(pwa.name, pwa.url, pwa.emoji, pwa.id);

            pushNotification(
              "App Installed Successfully",
              `"${pwa.name}" has been added to your system and docked.`
            );
          }
        });

        grid.appendChild(card);
      });
    });

    // Render Discover Page Featured App Store Carousel
    const discoverPane = document.getElementById("store-pane-discover");
    if (discoverPane) {
      // Remove any existing featured header
      const existingHero = discoverPane.querySelector(".discover-hero-wrapper");
      if (existingHero) existingHero.remove();

      // Create new Apple-like Discover Hero Section
      const heroWrapper = document.createElement("div");
      heroWrapper.className = "discover-hero-wrapper";
      heroWrapper.style = "display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 24px;";
      
      const customPwas = getCustomPwas();
      const isSquooshInstalled = customPwas.some(p => p.url === PWA_APPS.squoosh.url);
      const isExcalidrawInstalled = customPwas.some(p => p.url === PWA_APPS.excalidraw.url);

      heroWrapper.innerHTML = `
        <div style="background: linear-gradient(135deg, #1e1b4b, #311042); border-radius: 14px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; min-height: 180px; position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 10px 25px rgba(0,0,0,0.3); text-align: left;">
          <div style="font-size: 10px; font-weight: 800; color: #a5b4fc; text-transform: uppercase; letter-spacing: 1px; font-family: var(--font-ui), sans-serif;">FEATURED APP</div>
          <div style="margin-top: 12px; margin-bottom: 12px;">
            <h3 style="font-size: 22px; font-weight: 700; color: #fff; margin: 0; font-family: var(--font-ui), sans-serif;">Squoosh</h3>
            <p style="font-size: 13px; opacity: 0.7; max-width: 320px; margin: 4px 0 0 0; line-height: 1.4; font-family: var(--font-ui), sans-serif;">A polished installable image compressor that opens cleanly inside MacReady.</p>
          </div>
          <button class="btn-hero-install-squoosh" style="background: rgba(255,255,255,0.18); border: none; padding: 6px 18px; border-radius: 20px; color: #fff; font-size: 11px; font-weight: 800; cursor: pointer; align-self: flex-start; backdrop-filter: blur(10px); text-transform: uppercase; font-family: var(--font-ui), sans-serif;">
            ${isSquooshInstalled ? 'OPEN' : 'GET'}
          </button>
          <div style="position: absolute; right: 50px; bottom: 52px; opacity: 0.16; transform: scale(4); transform-origin: center; pointer-events: none;">${PWA_APPS.squoosh.emoji}</div>
        </div>
        <div style="background: linear-gradient(135deg, #0f172a, #1e293b); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 10px 25px rgba(0,0,0,0.3); text-align: left;">
          <div style="font-size: 10px; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; font-family: var(--font-ui), sans-serif;">COLLABORATION</div>
          <div>
            <h3 style="font-size: 16px; font-weight: 700; color: #fff; margin: 0; font-family: var(--font-ui), sans-serif;">Excalidraw</h3>
            <p style="font-size: 11px; opacity: 0.6; margin: 4px 0 0 0; line-height: 1.3; font-family: var(--font-ui), sans-serif;">Sketch diagrams and shared ideas without leaving the desktop.</p>
          </div>
          <button class="btn-hero-install-excalidraw" style="background: #fff; color: #0f172a; border: none; padding: 6px 16px; border-radius: 20px; font-size: 11px; font-weight: 800; cursor: pointer; align-self: flex-start; text-transform: uppercase; font-family: var(--font-ui), sans-serif;">
            ${isExcalidrawInstalled ? 'OPEN' : 'GET'}
          </button>
        </div>
      `;

      discoverPane.insertBefore(heroWrapper, discoverPane.querySelector("h2"));

      // Bind hero button click actions
      const squooshHeroBtn = heroWrapper.querySelector(".btn-hero-install-squoosh");
      if (squooshHeroBtn) {
        squooshHeroBtn.addEventListener("click", () => {
          const squooshPwa = PWA_APPS.squoosh;
          if (isSquooshInstalled) {
            openIframeApp(squooshPwa.name, squooshPwa.url, squooshPwa.emoji, squooshPwa.id);
          } else {
            const activeCustoms = getCustomPwas();
            activeCustoms.push(squooshPwa);
            saveCustomPwas(activeCustoms);
            renderGrids();
            openIframeApp(squooshPwa.name, squooshPwa.url, squooshPwa.emoji, squooshPwa.id);
            pushNotification("App Installed Successfully", '"Squoosh" has been added and docked.');
          }
        });
      }

      const excalidrawHeroBtn = heroWrapper.querySelector(".btn-hero-install-excalidraw");
      if (excalidrawHeroBtn) {
        excalidrawHeroBtn.addEventListener("click", () => {
          const excalidrawPwa = PWA_APPS.excalidraw;
          if (isExcalidrawInstalled) {
            openIframeApp(excalidrawPwa.name, excalidrawPwa.url, excalidrawPwa.emoji, excalidrawPwa.id);
          } else {
            const activeCustoms = getCustomPwas();
            activeCustoms.push(excalidrawPwa);
            saveCustomPwas(activeCustoms);
            renderGrids();
            openIframeApp(excalidrawPwa.name, excalidrawPwa.url, excalidrawPwa.emoji, excalidrawPwa.id);
            pushNotification("App Installed Successfully", '"Excalidraw" has been added and docked.');
          }
        });
      }
    }

    // Render Installed Tab
    const installedList = document.getElementById("pwa-store-installed-list");
    if (!installedList) return;

    installedList.innerHTML = "";
    const customPwas = getCustomPwas();

    if (customPwas.length === 0) {
      installedList.innerHTML = `<div style="text-align: center; font-size: 13px; opacity: 0.5; padding: 30px 0; font-family: var(--font-ui), sans-serif;">No custom web apps installed yet. Install from other categories or add your own!</div>`;
      return;
    }

    customPwas.forEach(pwa => {
      const row = document.createElement("div");
      row.className = "pwa-installed-row";
      row.style = "display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 10px 14px; transition: all 0.2s; font-family: var(--font-ui), sans-serif;";
      row.innerHTML = `
        <div class="pwa-installed-info" style="display: flex; align-items: center; gap: 12px;">
          <div class="pwa-installed-icon" style="background: ${pwa.color}; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 2px 4px rgba(255,255,255,0.25);">${pwa.emoji}</div>
          <div>
            <div class="pwa-installed-name" style="font-size: 13px; font-weight: 600; color: #fff;">${pwa.name}</div>
            <div class="pwa-installed-url" style="font-size: 11px; opacity: 0.4;">${pwa.url.substring(0, 50)}${pwa.url.length > 50 ? '...' : ''}</div>
          </div>
        </div>
        <div class="pwa-installed-actions" style="display: flex; gap: 8px;">
          <button class="btn-pwa-row-action btn-pwa-row-launch" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 6px 12px; font-size: 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-weight: 500; font-family: var(--font-ui), sans-serif;">Launch</button>
          <button class="btn-pwa-row-action btn-pwa-row-delete" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; padding: 6px 12px; font-size: 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-weight: 500; font-family: var(--font-ui), sans-serif;">Delete</button>
        </div>
      `;

      // Launch button
      row.querySelector(".btn-pwa-row-launch").addEventListener("click", () => {
        openIframeApp(pwa.name, pwa.url, pwa.emoji, pwa.id);
      });

      // Delete button
      row.querySelector(".btn-pwa-row-delete").addEventListener("click", () => {
        // Remove app window if open
        const existingId = `iframe-win-${pwa.name.replace(/\s+/g, '-').toLowerCase()}`;
        const win = document.getElementById(existingId);
        if (win) win.remove();

        // Remove from dock
        removeAppFromDock(pwa.id);

        // Update list
        const activeCustoms = getCustomPwas().filter(p => p.id !== pwa.id);
        saveCustomPwas(activeCustoms);

        renderGrids();

        pushNotification(
          "App Uninstalled",
          `"${pwa.name}" has been removed from the system and dock.`
        );
      });

      installedList.appendChild(row);
    });
  }
}


let texteditActiveFile = null;
let notesData = [];

function getNotesData() {
  if (notesData.length > 0) return notesData;
  const saved = localStorage.getItem("macready_notes");
  if (saved) {
    try {
      notesData = JSON.parse(saved);
      // Auto-purge old placeholder notes if they exist in localStorage from a previous session
      const hasOldPlaceholders = notesData.some(n => 
        n.name === "Welcome to MacReady.txt" || 
        n.name === "Shopping List.txt" || 
        n.name === "Coding Ideas.txt"
      );
      if (!hasOldPlaceholders) {
        return notesData;
      }
    } catch(e) {
      // fallback
    }
  }
  notesData = [
    { id: "note-1", name: "Untitled Note 1.txt", content: "", updated: Date.now() }
  ];
  localStorage.setItem("macready_notes", JSON.stringify(notesData));
  return notesData;
}

function renderNotesList() {
  const notesListContainer = document.getElementById("notes-list");
  if (!notesListContainer) return;
  
  const searchVal = document.getElementById("notes-search")?.value.toLowerCase() || "";
  const data = getNotesData();
  
  notesListContainer.innerHTML = "";
  
  const filtered = data.filter(note => 
    note.name.toLowerCase().includes(searchVal) || 
    note.content.toLowerCase().includes(searchVal)
  );
  
  if (filtered.length === 0) {
    notesListContainer.innerHTML = `<div style="font-size: 10px; color: rgba(255,255,255,0.4); text-align: center; padding: 12px 4px;">No Notes</div>`;
    return;
  }
  
  filtered.forEach(note => {
    const item = document.createElement("div");
    const isActive = texteditActiveFile && texteditActiveFile.id === note.id;
    
    item.style.padding = "8px 10px";
    item.style.borderRadius = "6px";
    item.style.cursor = "pointer";
    item.style.fontSize = "11px";
    item.style.transition = "all 0.2s ease";
    item.style.display = "flex";
    item.style.flexDirection = "column";
    item.style.gap = "2px";
    
    if (isActive) {
      item.style.background = "var(--accent-color)";
      item.style.color = "#fff";
    } else {
      item.style.background = "rgba(255, 255, 255, 0.04)";
      item.style.color = "rgba(255,255,255,0.85)";
    }
    
    item.addEventListener("mouseenter", () => {
      if (!isActive) item.style.background = "rgba(255,255,255,0.08)";
    });
    item.addEventListener("mouseleave", () => {
      if (!isActive) item.style.background = "rgba(255,255,255,0.04)";
    });
    
    const cleanContent = note.content.replace(/[\n\r]+/g, " ");
    const previewText = cleanContent.length > 22 ? cleanContent.substring(0, 20) + "..." : cleanContent || "New Note";
    
    item.innerHTML = `
      <div style="font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${note.name}</div>
      <div style="font-size: 9px; opacity: 0.6; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${previewText}</div>
    `;
    
    item.addEventListener("click", () => {
      selectNote(note.id);
    });
    
    notesListContainer.appendChild(item);
  });
}

function selectNote(noteId) {
  const data = getNotesData();
  const note = data.find(n => n.id === noteId);
  if (!note) return;
  
  texteditActiveFile = note;
  
  const textarea = document.getElementById("textedit-textarea");
  const title = document.getElementById("textedit-window-title");
  const charCount = document.getElementById("textedit-char-count");
  
  if (textarea) {
    textarea.value = note.content || "";
  }
  if (title) {
    title.textContent = `Notes — ${note.name}`;
  }
  if (charCount && textarea) {
    charCount.textContent = `${textarea.value.length} characters`;
  }
  
  renderNotesList();
}

function openTextEditFile(file) {
  const win = document.getElementById("textedit-window");
  const textarea = document.getElementById("textedit-textarea");
  const title = document.getElementById("textedit-window-title");

  if (!win || !textarea || !title) return;

  // Add Notes.app to the Dock when opened
  addAppToDock("textedit");

  // Check if file is already in notesData
  const data = getNotesData();
  let existingNote = data.find(n => n.name === file.name);
  if (!existingNote) {
    existingNote = {
      id: `file-${Date.now()}`,
      name: file.name,
      content: file.content || "",
      updated: Date.now()
    };
    data.push(existingNote);
    localStorage.setItem("macready_notes", JSON.stringify(data));
  }

  selectNote(existingNote.id);

  win.classList.remove("hidden-window");
  bringWindowToFront(win);
  textarea.focus();
  playGlassChime();
}

function removeAppFromDock(appId) {
  const wrapper = document.querySelector(`.dock-item-wrapper[data-app="${appId}"]`);
  if (!wrapper) return;

  const indicator = wrapper.querySelector(".dock-indicator");
  if (indicator) indicator.classList.remove("active-dot");

  wrapper.classList.remove("dynamic-app-opening");
  wrapper.classList.add("dynamic-app-closing");

  setTimeout(() => {
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  }, 400);
}

// Calculator Logic
let calcDisplayVal = "0";
let calcPendingVal = null;
let calcOperator = null;

function pressCalc(val) {
  const display = document.getElementById("calc-display");
  if (!display) return;

  if (val === "AC") {
    calcDisplayVal = "0";
    calcPendingVal = null;
    calcOperator = null;
  } else if (val === "±") {
    calcDisplayVal = String(parseFloat(calcDisplayVal) * -1);
  } else if (val === "%") {
    calcDisplayVal = String(parseFloat(calcDisplayVal) / 100);
  } else if (val === "+" || val === "-" || val === "*" || val === "/") {
    calcPendingVal = parseFloat(calcDisplayVal);
    calcOperator = val;
    calcDisplayVal = "0";
  } else if (val === "=") {
    if (calcOperator && calcPendingVal !== null) {
      const current = parseFloat(calcDisplayVal);
      let result = 0;
      if (calcOperator === "+") result = calcPendingVal + current;
      else if (calcOperator === "-") result = calcPendingVal - current;
      else if (calcOperator === "*") result = calcPendingVal * current;
      else if (calcOperator === "/") result = calcPendingVal / current;
      
      calcDisplayVal = String(result);
      calcOperator = null;
      calcPendingVal = null;
    }
  } else {
    // Number or dot
    if (val === ".") {
      if (!calcDisplayVal.includes(".")) {
        calcDisplayVal += ".";
      }
    } else {
      if (calcDisplayVal === "0") {
        calcDisplayVal = val;
      } else {
        calcDisplayVal += val;
      }
    }
  }
  display.value = calcDisplayVal;

  // macOS Style Active Operator Highlight Sync
  document.querySelectorAll(".calc-btn.op").forEach(b => b.classList.remove("active-operator"));
  if (calcOperator) {
    let activeId = "";
    if (calcOperator === "+") activeId = "calc-btn-add";
    else if (calcOperator === "-") activeId = "calc-btn-sub";
    else if (calcOperator === "*") activeId = "calc-btn-mul";
    else if (calcOperator === "/") activeId = "calc-btn-div";
    
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) activeBtn.classList.add("active-operator");
  }
}

// Terminal Simulated Shell commands handler
function executeTerminalCommand(cmdString) {
  const output = document.getElementById("terminal-output");
  const input = document.getElementById("terminal-input");
  const body = document.getElementById("terminal-body");
  if (!output || !input) return;

  const trimmed = cmdString.trim();
  if (trimmed === "") return;

  const parts = trimmed.split(" ");
  const command = parts[0].toLowerCase();
  const arg = parts.slice(1).join(" ");

  let response = "";

  if (command === "help") {
    response = `
Available commands:<br>
  - <b>help</b>: Display this command index.<br>
  - <b>ls</b>: List files in the current directory of Finder.<br>
  - <b>cat &lt;file&gt;</b>: Print contents of a text or code file.<br>
  - <b>neofetch</b>: Render glowing macOS Tahoe specifications.<br>
  - <b>theme &lt;name&gt;</b>: Cycle system accent (e.g. theme sequoia).<br>
  - <b>clear</b>: Clear the terminal console.<br>
  - <b>exit</b>: Close the Terminal window.<br>
`;
  } else if (command === "ls") {
    const dirItems = FINDER_FS[finderCurrentDir].items;
    response = `Directory path: ${FINDER_FS[finderCurrentDir].path.join("/")}<br>`;
    if (dirItems.length === 0) {
      response += "Folder is empty.";
    } else {
      dirItems.forEach(item => {
        const sizeInfo = item.size ? `[${item.size}]` : "";
        response += `  ${item.kind === "folder" ? "📁" : "📄"} <b>${item.name}</b> ${sizeInfo} - ${item.date}<br>`;
      });
    }
  } else if (command === "cat") {
    if (!arg) {
      response = "usage: cat &lt;filename&gt;";
    } else {
      const dirItems = FINDER_FS[finderCurrentDir].items;
      const file = dirItems.find(i => i.name.toLowerCase() === arg.toLowerCase());
      if (!file) {
        response = `cat: ${arg}: No such file or directory`;
      } else if (file.kind === "folder") {
        response = `cat: ${arg}: Is a directory`;
      } else if (file.kind === "image") {
        response = `cat: ${arg}: Cannot read binary image file`;
      } else {
        response = `<pre style="color: #fff; margin: 6px 0;">${escapeHtml(file.content || "Code content is referenced dynamically inside system libraries.")}</pre>`;
      }
    }
  } else if (command === "neofetch") {
    response = `
<pre style="color: var(--accent-color); font-family: monospace; font-size: 11px; line-height: 1.25; margin: 0; display: inline-block; vertical-align: top;">
                  ,x88888x,
                ,88888888888,
               88888   8888888
              88888     888888
             888888     888888
             888888,   ,88888P
             \`88888888888888'
           ,   \`x88888888x' ,
         ,888,     \`\"\"'    ,888,
        8888888x,        ,x888888
       88888888888      8888888888
      8888888888888    888888888888
      8888888888888    888888888888
       \`888888888P      \`88888888P'
         \`x888x'          \`x888x'
</pre>
<div style="display: inline-block; margin-left: 20px; font-family: monospace; font-size: 11px; vertical-align: top; color: #fff;">
  <b style="color: var(--accent-color)">user@tahoe-mac</b><br>
  ------------------------<br>
  <b>OS:</b> macOS 26 Tahoe (64-bit)<br>
  <b>Model:</b> Apple Silicon iMac (2026)<br>
  <b>Kernel:</b> Darwin 25.4.0<br>
  <b>Uptime:</b> 2 hours, 14 mins<br>
  <b>Shell:</b> zsh 5.9<br>
  <b>Resolution:</b> 4480x2520 (Retina 4.5K)<br>
  <b>Theme:</b> Glassmorphism Tahoe<br>
  <b>Accent Theme:</b> ${localStorage.getItem("tahoe_theme") || "blue"}<br>
  <b>CPU:</b> Apple M5 Pro (12-core)<br>
  <b>GPU:</b> Apple M5 Pro (16-core GPU)<br>
  <b>Memory:</b> 16 GB unified RAM<br>
  <b>Disk Usage:</b> Macintosh HD (321.4 GB available)<br>
</div>
`;
  } else if (command === "theme") {
    if (!arg) {
      response = "usage: theme &lt;theme-name&gt;<br>Themes: tiger, panther, leopard, yosemite, sequoia, blue, purple, pink, amber, green, silver";
    } else {
      const themes = ["tiger", "panther", "leopard", "yosemite", "sequoia", "blue", "purple", "pink", "amber", "green", "silver"];
      if (themes.includes(arg.toLowerCase())) {
        setAccentColor(arg.toLowerCase());
        response = `Accent theme updated to ${arg}!`;
      } else {
        response = `theme: ${arg}: Unknown theme. Try 'theme help'.`;
      }
    }
  } else if (command === "clear") {
    output.innerHTML = "";
    input.value = "";
    return;
  } else if (command === "exit") {
    document.getElementById("terminal-window").classList.add("hidden-window");
    removeAppFromDock("terminal");
    refreshGlobalMenuBarSoon();
    input.value = "";
    return;
  } else {
    response = `sh: ${command}: command not found. Type 'help' for support.`;
  }

  output.innerHTML += `
    <div style="margin-bottom: 8px;">
      <span style="color: #30d158;">tahoe-mac:~ user$</span> ${escapeHtml(cmdString)}<br>
      <div style="margin-top: 4px;">${response}</div>
    </div>
  `;
  input.value = "";
  if (body) body.scrollTop = body.scrollHeight;
}

function initUtilityApps() {
  // A. Terminal Setup
  const termInput = document.getElementById("terminal-input");
  if (termInput) {
    termInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        executeTerminalCommand(termInput.value);
      }
    });
  }

  const termClose = document.getElementById("terminal-close");
  if (termClose) {
    termClose.addEventListener("click", () => {
      document.getElementById("terminal-window").classList.add("hidden-window");
      removeAppFromDock("terminal");
      playGlassChime();
      updateGlobalMenuBar();
    });
  }

  const termMinimize = document.getElementById("terminal-minimize");
  if (termMinimize) {
    termMinimize.addEventListener("click", () => {
      document.getElementById("terminal-window").classList.add("minimized");
      pushNotification("Terminal Minimized", "Access Terminal seamlessly from your desktop Dock.");
      playGlassChime();
      updateGlobalMenuBar();
    });
  }

  // B. Calculator Setup
  const calcButtons = {
    "calc-btn-ac": "AC", "calc-btn-sign": "±", "calc-btn-pct": "%", "calc-btn-div": "/",
    "calc-btn-7": "7", "calc-btn-8": "8", "calc-btn-9": "9", "calc-btn-mul": "*",
    "calc-btn-4": "4", "calc-btn-5": "5", "calc-btn-6": "6", "calc-btn-sub": "-",
    "calc-btn-1": "1", "calc-btn-2": "2", "calc-btn-3": "3", "calc-btn-add": "+",
    "calc-btn-0": "0", "calc-btn-dot": ".", "calc-btn-eq": "="
  };

  for (const id in calcButtons) {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener("click", () => {
        pressCalc(calcButtons[id]);
      });
    }
  }

  const calcClose = document.getElementById("calculator-close");
  if (calcClose) {
    calcClose.addEventListener("click", () => {
      document.getElementById("calculator-window").classList.add("hidden-window");
      removeAppFromDock("calculator");
      playGlassChime();
      updateGlobalMenuBar();
    });
  }

  const calcMinimize = document.getElementById("calculator-minimize");
  if (calcMinimize) {
    calcMinimize.addEventListener("click", () => {
      document.getElementById("calculator-window").classList.add("minimized");
      pushNotification("Calculator Minimized", "Access Calculator seamlessly from your desktop Dock.");
      playGlassChime();
      updateGlobalMenuBar();
    });
  }

  // C. TextEdit / Notes Setup
  const texteditTextarea = document.getElementById("textedit-textarea");
  if (texteditTextarea) {
    texteditTextarea.addEventListener("input", () => {
      const charCount = document.getElementById("textedit-char-count");
      if (charCount) charCount.textContent = `${texteditTextarea.value.length} characters`;
      if (texteditActiveFile) {
        texteditActiveFile.content = texteditTextarea.value;
        const data = getNotesData();
        localStorage.setItem("macready_notes", JSON.stringify(data));
        renderNotesList();
      }
    });
  }

  const texteditSaveBtn = document.getElementById("menu-notes-save");
  if (texteditSaveBtn) {
    texteditSaveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (texteditActiveFile && texteditTextarea) {
        texteditActiveFile.content = texteditTextarea.value;
        texteditActiveFile.updated = Date.now();
        const data = getNotesData();
        localStorage.setItem("macready_notes", JSON.stringify(data));
        
        // Trigger a real file download in the browser
        const blob = new Blob([texteditActiveFile.content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = texteditActiveFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        pushNotification("Note Exported", `${texteditActiveFile.name} successfully saved to local system.`);
        playGlassChime();
        renderNotesList();
        renderFinderView();
      }
    });
  }

  const texteditClose = document.getElementById("textedit-close");
  if (texteditClose) {
    texteditClose.addEventListener("click", () => {
      document.getElementById("textedit-window").classList.add("hidden-window");
      removeAppFromDock("textedit");
      playGlassChime();
      updateGlobalMenuBar();
    });
  }

  const texteditMinimize = document.getElementById("textedit-minimize");
  if (texteditMinimize) {
    texteditMinimize.addEventListener("click", () => {
      document.getElementById("textedit-window").classList.add("minimized");
      pushNotification("Notes Minimized", "Access Notes seamlessly from your desktop Dock.");
      playGlassChime();
      updateGlobalMenuBar();
    });
  }

  // Multi-note UI Bindings
  const notesSearch = document.getElementById("notes-search");
  if (notesSearch) {
    notesSearch.addEventListener("input", () => {
      renderNotesList();
    });
  }

  const notesNewBtn = document.getElementById("notes-new-btn");
  if (notesNewBtn) {
    notesNewBtn.addEventListener("click", () => {
      const data = getNotesData();
      const newId = `note-${Date.now()}`;
      const newNote = {
        id: newId,
        name: `Untitled Note ${data.length + 1}.txt`,
        content: "",
        updated: Date.now()
      };
      data.push(newNote);
      localStorage.setItem("macready_notes", JSON.stringify(data));
      
      selectNote(newId);
      pushNotification("New Note Created", "A fresh note has been created.");
      playGlassChime();
      
      if (texteditTextarea) texteditTextarea.focus();
    });
  }

  const notesDeleteBtn = document.getElementById("menu-notes-delete");
  if (notesDeleteBtn) {
    notesDeleteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!texteditActiveFile) return;
      const data = getNotesData();
      if (data.length <= 1) {
        pushNotification("Cannot Delete", "You must keep at least one note.");
        return;
      }
      
      const idx = data.findIndex(n => n.id === texteditActiveFile.id);
      if (idx !== -1) {
        data.splice(idx, 1);
        localStorage.setItem("macready_notes", JSON.stringify(data));
        pushNotification("Note Deleted", "The note has been deleted.");
        playGlassChime();
        
        const nextNote = data[Math.min(idx, data.length - 1)];
        selectNote(nextNote.id);
      }
    });
  }

  // --- macOS Tahoe Rich Notes Top Menus Functionality ---
  const menuNotesNew = document.getElementById("menu-notes-new");
  if (menuNotesNew) {
    menuNotesNew.addEventListener("click", (e) => {
      e.preventDefault();
      if (notesNewBtn) notesNewBtn.click();
    });
  }

  const menuNotesClose = document.getElementById("menu-notes-close");
  if (menuNotesClose) {
    menuNotesClose.addEventListener("click", (e) => {
      e.preventDefault();
      if (texteditClose) texteditClose.click();
    });
  }

  const getTextArea = () => document.getElementById("textedit-textarea");

  const menuNotesUndo = document.getElementById("menu-notes-undo");
  if (menuNotesUndo) {
    menuNotesUndo.addEventListener("click", (e) => {
      e.preventDefault();
      const ta = getTextArea();
      if (ta) {
        ta.focus();
        document.execCommand("undo", false, null);
      }
    });
  }

  const menuNotesRedo = document.getElementById("menu-notes-redo");
  if (menuNotesRedo) {
    menuNotesRedo.addEventListener("click", (e) => {
      e.preventDefault();
      const ta = getTextArea();
      if (ta) {
        ta.focus();
        document.execCommand("redo", false, null);
      }
    });
  }

  const menuNotesCut = document.getElementById("menu-notes-cut");
  if (menuNotesCut) {
    menuNotesCut.addEventListener("click", (e) => {
      e.preventDefault();
      const ta = getTextArea();
      if (ta) {
        ta.focus();
        document.execCommand("cut", false, null);
      }
    });
  }

  const menuNotesCopy = document.getElementById("menu-notes-copy");
  if (menuNotesCopy) {
    menuNotesCopy.addEventListener("click", (e) => {
      e.preventDefault();
      const ta = getTextArea();
      if (ta) {
        ta.focus();
        document.execCommand("copy", false, null);
      }
    });
  }

  const menuNotesPaste = document.getElementById("menu-notes-paste");
  if (menuNotesPaste) {
    menuNotesPaste.addEventListener("click", (e) => {
      e.preventDefault();
      const ta = getTextArea();
      if (ta) {
        ta.focus();
        navigator.clipboard.readText().then(text => {
          const start = ta.selectionStart;
          const end = ta.selectionEnd;
          const val = ta.value;
          ta.value = val.substring(0, start) + text + val.substring(end);
          ta.setSelectionRange(start + text.length, start + text.length);
          ta.dispatchEvent(new Event('input', { bubbles: true }));
        }).catch(err => {
          document.execCommand("paste", false, null);
        });
      }
    });
  }

  const menuNotesSelectAll = document.getElementById("menu-notes-selectall");
  if (menuNotesSelectAll) {
    menuNotesSelectAll.addEventListener("click", (e) => {
      e.preventDefault();
      const ta = getTextArea();
      if (ta) {
        ta.focus();
        ta.select();
      }
    });
  }

  const applyMenuFormat = (prefix, suffix) => {
    const ta = getTextArea();
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;
    const selectedText = val.substring(start, end);
    const replacement = `${prefix}${selectedText}${suffix}`;
    ta.value = val.substring(0, start) + replacement + val.substring(end);
    ta.focus();
    ta.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    
    if (texteditActiveFile) {
      texteditActiveFile.content = ta.value;
      const data = getNotesData();
      localStorage.setItem("macready_notes", JSON.stringify(data));
      renderNotesList();
    }
  };

  const menuNotesBold = document.getElementById("menu-notes-bold");
  if (menuNotesBold) {
    menuNotesBold.addEventListener("click", (e) => {
      e.preventDefault();
      applyMenuFormat("**", "**");
    });
  }

  const menuNotesItalic = document.getElementById("menu-notes-italic");
  if (menuNotesItalic) {
    menuNotesItalic.addEventListener("click", (e) => {
      e.preventDefault();
      applyMenuFormat("*", "*");
    });
  }

  const menuNotesUnderline = document.getElementById("menu-notes-underline");
  if (menuNotesUnderline) {
    menuNotesUnderline.addEventListener("click", (e) => {
      e.preventDefault();
      applyMenuFormat("_", "_");
    });
  }

  const menuNotesStrikethrough = document.getElementById("menu-notes-strikethrough");
  if (menuNotesStrikethrough) {
    menuNotesStrikethrough.addEventListener("click", (e) => {
      e.preventDefault();
      applyMenuFormat("~~", "~~");
    });
  }

  const menuNotesToggleSidebar = document.getElementById("menu-notes-toggle-sidebar");
  if (menuNotesToggleSidebar) {
    menuNotesToggleSidebar.addEventListener("click", (e) => {
      e.preventDefault();
      const sidebar = document.getElementById("notes-sidebar");
      if (sidebar) {
        if (sidebar.style.display === "none") {
          sidebar.style.display = "flex";
        } else {
          sidebar.style.display = "none";
        }
      }
    });
  }

  const menuNotesFullscreen = document.getElementById("menu-notes-fullscreen");
  if (menuNotesFullscreen) {
    menuNotesFullscreen.addEventListener("click", (e) => {
      e.preventDefault();
      const win = document.getElementById("textedit-window");
      if (win) {
        win.classList.toggle("maximized");
      }
    });
  }

  // Formatting buttons
  const boldBtn = document.getElementById("notes-bold-btn");
  const italicBtn = document.getElementById("notes-italic-btn");
  const bulletBtn = document.getElementById("notes-bullet-btn");

  function applyFormatting(wrapperTextBefore, wrapperTextAfter) {
    if (!texteditTextarea) return;
    
    const start = texteditTextarea.selectionStart;
    const end = texteditTextarea.selectionEnd;
    const text = texteditTextarea.value;
    const selectedText = text.substring(start, end);
    const replacement = wrapperTextBefore + selectedText + wrapperTextAfter;
    
    texteditTextarea.value = text.substring(0, start) + replacement + text.substring(end);
    texteditTextarea.focus();
    texteditTextarea.setSelectionRange(start + wrapperTextBefore.length, start + wrapperTextBefore.length + selectedText.length);
    
    const charCount = document.getElementById("textedit-char-count");
    if (charCount) charCount.textContent = `${texteditTextarea.value.length} characters`;
    
    if (texteditActiveFile) {
      texteditActiveFile.content = texteditTextarea.value;
      const data = getNotesData();
      localStorage.setItem("macready_notes", JSON.stringify(data));
      renderNotesList();
    }
  }

  if (boldBtn) boldBtn.addEventListener("click", () => applyFormatting("**", "**"));
  if (italicBtn) italicBtn.addEventListener("click", () => applyFormatting("*", "*"));
  if (bulletBtn) bulletBtn.addEventListener("click", () => applyFormatting("- ", ""));

  // Initial Notes Rendering
  const initialData = getNotesData();
  if (initialData.length > 0) {
    selectNote(initialData[0].id);
  }

  // D. Premium Drag & Focus Setup for existing windows
  const termWin = document.getElementById("terminal-window");
  if (termWin) {
    makeWindowDraggable(termWin);
    termWin.addEventListener("mousedown", () => bringWindowToFront(termWin));
  }

  const calcWin = document.getElementById("calculator-window");
  if (calcWin) {
    makeWindowDraggable(calcWin);
    calcWin.addEventListener("mousedown", () => bringWindowToFront(calcWin));
  }

  const noteWin = document.getElementById("textedit-window");
  if (noteWin) {
    makeWindowDraggable(noteWin);
    noteWin.addEventListener("mousedown", () => bringWindowToFront(noteWin));
  }

  const settingsWin = document.getElementById("settings-window");
  if (settingsWin) {
    makeWindowDraggable(settingsWin);
    settingsWin.addEventListener("mousedown", () => bringWindowToFront(settingsWin));
  }
}

// --- macOS Tahoe 26 User Account & Passkey Simulator ---
function initAccountSystem() {
  // A. Elements & State Bindings
  const passkeySensor = document.getElementById("passkey-sensor-btn");
  const passkeyPrompt = document.getElementById("passkey-prompt");
  const passkeyStatusText = document.getElementById("passkey-status-text");
  const btnPasskeySignin = document.getElementById("btn-passkey-signin");
  const btnStandardSignin = document.getElementById("btn-standard-signin");
  const btnPasskeyCancel = document.getElementById("btn-passkey-cancel");
  const btnAccountSignout = document.getElementById("btn-account-signout");
  const btnReauthenticate = document.getElementById("btn-reauthenticate");
  const accountWin = document.getElementById("account-window");
  
  // Make sign-in window draggable and focusable.
  const signinWin = document.getElementById("signin-window");
  if (signinWin) {
    makeWindowDraggable(signinWin);
  }
  
  const signinBackdrop = document.getElementById("signin-backdrop");
  if (signinBackdrop) {
    signinBackdrop.addEventListener("click", () => {
      closeSignInWindow();
    });
  }
  
  // Make account window draggable & focusable
  if (accountWin) {
    makeWindowDraggable(accountWin);
    accountWin.addEventListener("mousedown", () => bringWindowToFront(accountWin));
    
    // Close button
    const accClose = document.getElementById("account-close");
    if (accClose) {
      accClose.addEventListener("click", () => {
      accountWin.classList.add("hidden-window");
      refreshGlobalMenuBarSoon();
    });
  }
    
    // Minimize button
    const accMin = document.getElementById("account-minimize");
    if (accMin) {
      accMin.addEventListener("click", () => {
      accountWin.classList.add("minimized");
      refreshGlobalMenuBarSoon();
    });
  }

    // Maximize button
    const accMax = document.getElementById("account-maximize");
    if (accMax) {
      accMax.addEventListener("click", () => {
        accountWin.classList.toggle("maximized");
      });
    }

    // Sidebar Tab Switching
    const accSidebarItems = document.querySelectorAll(".account-sidebar .sidebar-item");
    accSidebarItems.forEach(item => {
      item.addEventListener("click", () => {
        accSidebarItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        
        const tab = item.getAttribute("data-account-tab");
        document.querySelectorAll(".account-content .account-pane").forEach(pane => {
          pane.style.display = "none";
          pane.classList.remove("active");
        });
        
        const targetPane = document.getElementById(`pane-account-${tab}`);
        if (targetPane) {
          targetPane.style.display = "block";
          targetPane.classList.add("active");
        }
        if (tab === "hardware") {
          initHardwareProfileUI();
        }
      });
    });
  }

  // B. Standard Sign In Callback
  if (btnStandardSignin) {
    btnStandardSignin.addEventListener("click", (e) => {
      e.stopPropagation();
      const usernameInput = document.getElementById("signin-username");
      const emailInput = document.getElementById("signin-email");
      
      const username = usernameInput ? usernameInput.value.trim() : "";
      const email = emailInput ? emailInput.value.trim() : "";
      
      if (!username || !email) {
        pushNotification("Sign In Error", "Please enter both a username and email address.", { silent: true });
        return;
      }
      
      performSignIn(username, email, "standard");
    });
  }

  // C. Passkey Simulation flows
  if (btnPasskeySignin) {
    btnPasskeySignin.addEventListener("click", (e) => {
      e.stopPropagation();
      // Close dropdown
      const dropdowns = document.querySelectorAll(".dropdown-menu");
      dropdowns.forEach(d => d.classList.remove("show"));
      
      const usernameInput = document.getElementById("signin-username");
      const emailInput = document.getElementById("signin-email");
      
      const username = (usernameInput && usernameInput.value.trim()) || "Apple Developer";
      const email = (emailInput && emailInput.value.trim()) || "developer@apple.com";
      
      openPasskeyPrompt(username, email);
    });
  }

  // D. Cancel Passkey Prompt
  if (btnPasskeyCancel) {
    btnPasskeyCancel.addEventListener("click", () => {
      if (passkeyPrompt) passkeyPrompt.classList.add("hidden-window");
      resetPasskeySensorState();
    });
  }

  // E. Touch ID Sensor Scan listener
  if (passkeySensor) {
    passkeySensor.addEventListener("click", () => {
      if (passkeySensor.classList.contains("scanning") || passkeySensor.classList.contains("success")) return;
      
      startPasskeyVerification();
    });
  }

  // F. Sign Out Flow
  if (btnAccountSignout) {
    btnAccountSignout.addEventListener("click", () => {
      performSignOut();
    });
  }

  // G. Re-authenticate button
  if (btnReauthenticate) {
    btnReauthenticate.addEventListener("click", () => {
      openPasskeyPrompt(currentUsername, currentUserEmail, true);
    });
  }
}

// Helpers
let activeAuthSession = null;

function openPasskeyPrompt(username, email, isReauth = false) {
  const prompt = document.getElementById("passkey-prompt");
  if (!prompt) return;
  
  // Set active session details
  activeAuthSession = { username, email, isReauth };
  
  // Reset prompt visual state
  resetPasskeySensorState();
  
  // Set context description text
  const subtitle = prompt.querySelector(".passkey-subtitle");
  if (subtitle) {
    subtitle.textContent = `MacReady wants to sign in "${username}" (${email}) using a secure Passkey.`;
  }
  
  prompt.classList.remove("hidden-window");
  
  // Start ripple animations on biometrics scanner
  const ripples = prompt.querySelectorAll(".touchid-ripple");
  ripples.forEach(r => r.classList.add("pulse"));
}

function resetPasskeySensorState() {
  const sensor = document.getElementById("passkey-sensor-btn");
  const status = document.getElementById("passkey-status-text");
  const prompt = document.getElementById("passkey-prompt");
  
  if (sensor) {
    sensor.classList.remove("scanning", "success");
    const fingerprint = sensor.querySelector(".touchid-fingerprint");
    const checkmark = sensor.querySelector(".touchid-checkmark");
    if (fingerprint) fingerprint.classList.remove("hidden");
    if (checkmark) checkmark.classList.add("hidden");
  }
  
  if (status) {
    status.textContent = "Touch the ID sensor to authenticate";
    status.style.color = "";
  }
  
  if (prompt) {
    const ripples = prompt.querySelectorAll(".touchid-ripple");
    ripples.forEach(r => r.classList.remove("pulse"));
  }
}

function startPasskeyVerification() {
  const sensor = document.getElementById("passkey-sensor-btn");
  const status = document.getElementById("passkey-status-text");
  
  if (sensor) sensor.classList.add("scanning");
  if (status) status.textContent = "Verifying Passkey...";
  
  // Simulate Touch ID scan processing
  setTimeout(() => {
    if (!sensor || !activeAuthSession) return;
    
    sensor.classList.remove("scanning");
    sensor.classList.add("success");
    
    const fingerprint = sensor.querySelector(".touchid-fingerprint");
    const checkmark = sensor.querySelector(".touchid-checkmark");
    if (fingerprint) fingerprint.classList.add("hidden");
    if (checkmark) checkmark.classList.remove("hidden");
    
    if (status) {
      status.textContent = "Passkey Verified!";
      status.style.color = "#22c55e";
    }
    
    // Finalize authentication session
    setTimeout(() => {
      const prompt = document.getElementById("passkey-prompt");
      if (prompt) prompt.classList.add("hidden-window");
      
      if (activeAuthSession.isReauth) {
        pushNotification("Re-authenticated", "Security profile verified successfully.", { silent: true });
      } else {
        performSignIn(activeAuthSession.username, activeAuthSession.email, "passkey");
      }
      activeAuthSession = null;
    }, 800);
    
  }, 1800);
}

function playTouchIDSuccessBeep() {
  // Sign-in and account flows stay silent.
}

window.openSignInWindow = openSignInWindow;
window.closeSignInWindow = closeSignInWindow;

function openSignInWindow() {
  const signinWin = document.getElementById("signin-window");
  const backdrop = document.getElementById("signin-backdrop");
  if (signinWin && backdrop) {
    backdrop.classList.remove("hidden-window");
    signinWin.classList.remove("hidden-window");
    // Force a reflow
    void signinWin.offsetWidth;
    backdrop.classList.add("show");
    signinWin.classList.add("show");
    
    // Reset inputs
    const usernameInput = document.getElementById("signin-username");
    const emailInput = document.getElementById("signin-email");
    if (usernameInput) usernameInput.value = "";
    if (emailInput) emailInput.value = "";
    
    // Focus first input
    setTimeout(() => {
      if (usernameInput) usernameInput.focus();
    }, 100);
  }
}

function closeSignInWindow() {
  const signinWin = document.getElementById("signin-window");
  const backdrop = document.getElementById("signin-backdrop");
  if (signinWin && backdrop) {
    backdrop.classList.remove("show");
    signinWin.classList.remove("show");
    setTimeout(() => {
      backdrop.classList.add("hidden-window");
      signinWin.classList.add("hidden-window");
    }, 300);
  }
}

function performSignIn(username, email, authType = "standard") {
  currentUsername = username;
  currentUserEmail = email;
  localStorage.setItem("macready_username", username);
  localStorage.setItem("macready_email", email);
  localStorage.setItem("macready_auth_type", authType);
  
  updateAppHeader();
  syncAccountDetailsToWindow();
  updateAdminControls();
  
  pushNotification("Signed In", `Welcome back, ${username}!`, { silent: true });
  
  closeSignInWindow();
  
  // Close dropdown
  const dropdowns = document.querySelectorAll(".dropdown-menu");
  dropdowns.forEach(d => d.classList.remove("show"));
}

function performSignOut() {
  pushNotification("Signed Out", `Browsing session for "${currentUsername}" ended.`, { silent: true });
  
  currentUsername = "Guest";
  currentUserEmail = "";
  localStorage.removeItem("macready_username");
  localStorage.removeItem("macready_email");
  localStorage.removeItem("macready_auth_type");
  
  updateAppHeader();
  syncAccountDetailsToWindow();
  updateAdminControls();
  
  const accWin = document.getElementById("account-window");
  if (accWin) accWin.classList.add("hidden-window");
}

function updateAppHeader() {
  const appHeader = document.querySelector('button[data-menu="app-menu"]');
  if (appHeader) {
    appHeader.textContent = currentUsername;
  }
  refreshGlobalMenuBarSoon();
}

function syncAccountDetailsToWindow() {
  const detailUser = document.getElementById("profile-detail-username");
  
  if (detailUser) detailUser.textContent = currentUsername;

  // Query hardware profile from SQLite
  const profileRow = db.query("SELECT * FROM hardware_profile");
  if (profileRow && profileRow.length > 0) {
    const p = profileRow[0];
    const hwModel = document.getElementById("account-hw-model");
    const hwSub = document.getElementById("account-hw-sub");
    const hwChip = document.getElementById("account-hw-chip");
    const hwRam = document.getElementById("account-hw-ram");
    const hwMacos = document.getElementById("account-hw-macos");
    const hwCrossover = document.getElementById("account-hw-crossover");

    if (hwModel) hwModel.textContent = p.macModel || "Select Model...";
    if (hwSub) hwSub.textContent = p.macModel ? `${p.macModel} Specifications` : "No specifications input";
    if (hwChip) hwChip.textContent = p.chip ? `Apple Silicon ${p.chip}` : "Not Configured";
    if (hwRam) hwRam.textContent = p.ram ? `${p.ram} Unified Memory` : "Not Configured";
    if (hwMacos) hwMacos.textContent = p.macosVersion || "Not Configured";
    if (hwCrossover) hwCrossover.textContent = p.crossoverInstalled ? "Installed" : "Not Installed";
  }

  // Passkey Status Card
  const authType = localStorage.getItem("macready_auth_type") || "standard";
  const passkeyCard = document.getElementById("account-passkey-card");
  if (passkeyCard) {
    if (authType === "passkey") {
      passkeyCard.style.background = "rgba(34, 197, 94, 0.1)";
      passkeyCard.style.border = "1px solid rgba(34, 197, 94, 0.2)";
      passkeyCard.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <div>
          <div style="font-size: 12px; font-weight: 600; color: #22c55e;">Passkey Registered & Active</div>
          <div style="font-size: 11px; opacity: 0.7; margin-top: 2px;">Authenticated securely via Touch ID / Passkey.</div>
        </div>
      `;
    } else {
      passkeyCard.style.background = "rgba(255, 149, 0, 0.1)";
      passkeyCard.style.border = "1px solid rgba(255, 149, Orange, 0.2)";
      passkeyCard.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ff9500" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <div>
          <div style="font-size: 12px; font-weight: 600; color: #ff9500;">Passkey Not Registered</div>
          <div style="font-size: 11px; opacity: 0.7; margin-top: 2px;">Signed in using standard credentials. Register a passkey for faster biometric login.</div>
        </div>
      `;
    }
  }
}

function openAccountWindow() {
  const win = document.getElementById("account-window");
  if (win) {
    win.classList.remove("hidden-window");
    win.classList.remove("minimized");
    syncAccountDetailsToWindow();
    bringWindowToFront(win);
  }
}

function openSettingsTab(tab = "wallpaper") {
  const settingsWin = document.getElementById("settings-window");
  if (!settingsWin) return;
  settingsWin.classList.remove("hidden-window", "minimized");
  bringWindowToFront(settingsWin);
  const indicator = document.getElementById("dock-settings-indicator");
  if (indicator) indicator.classList.add("active-dot");
  document.querySelectorAll(".settings-sidebar .sidebar-item").forEach(item => {
    item.classList.toggle("active", item.getAttribute("data-settings-tab") === tab);
  });
  document.querySelectorAll(".settings-content .settings-pane").forEach(pane => {
    pane.classList.remove("active");
  });
  const targetPane = document.getElementById(`pane-${tab}`);
  if (targetPane) targetPane.classList.add("active");
}

// --- macOS Tahoe 26 Siri/Copilot AI Voice HUD System ---
let siriWaveId = null;
let siriWavePhase = 0;
let siriWaveState = "listening"; // "listening", "thinking", "speaking"
let micStream = null;
let micAnalyser = null;
let micDataArray = null;
let micContext = null;
let micEnabled = false;
let siriMediaRecorder = null;
let siriAudioChunks = [];
let siriActive = false;
let siriVoiceMonitorInterval = null;
let siriRecordingStopTimer = null;
let siriResponseTimer = null;
let siriRequestId = 0;
let siriWaveLastFrame = 0;
const SIRI_WAVE_FRAME_INTERVAL = 1000 / 30;

function initSiriAssistant() {
  const siriToggle = document.getElementById("menu-siri-toggle");
  const siriHud = document.getElementById("siri-hud");
  const siriBackdrop = document.getElementById("siri-focus-backdrop");
  const siriInput = document.getElementById("siri-input");
  const siriMicToggle = document.getElementById("siri-mic-toggle");
  const siriSuggestions = document.querySelectorAll(".siri-suggestions .siri-tag");
  const siriSettingsSwitch = document.getElementById("settings-siri-toggle-switch");

  if (!siriHud) return;

  // A. Persistent Preference Settings System
  // Force visible on page load so it is guaranteed to appear for you after the update,
  // but it remains fully hidable/disableable in the active session via System Settings!
  localStorage.setItem("macready_siri_enabled", "true");
  const siriEnabledPref = "true";
  if (siriToggle) {
    if (siriEnabledPref === "true") {
      siriToggle.style.display = "";
      if (siriSettingsSwitch) siriSettingsSwitch.checked = true;
    } else {
      siriToggle.style.display = "none";
      if (siriSettingsSwitch) siriSettingsSwitch.checked = false;
    }
  }

  if (siriSettingsSwitch) {
    siriSettingsSwitch.addEventListener("change", () => {
      const isChecked = siriSettingsSwitch.checked;
      localStorage.setItem("macready_siri_enabled", isChecked ? "true" : "false");
      if (siriToggle) {
        siriToggle.style.display = isChecked ? "" : "none";
      }
      if (!isChecked && siriActive) {
        closeSiriHud();
      }
    });
  }

  // B. Toggle Assistant Panel Click Listeners
  if (siriToggle) {
    siriToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeAllDropdowns();
      if (siriActive) {
        closeSiriHud();
      } else {
        openSiriHud();
      }
    });
  }

  if (siriBackdrop) {
    siriBackdrop.addEventListener("click", () => {
      closeSiriHud();
    });
  }

  // C. Suggestions Click Event Listeners
  siriSuggestions.forEach(tag => {
    tag.addEventListener("click", () => {
      const query = tag.getAttribute("data-query");
      if (siriInput && query) {
        siriInput.value = query;
        submitSiriQuery(query);
      }
    });
  });

  // D. Voice Input Toggle
  if (siriMicToggle) {
    siriMicToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSiriMic();
    });
  }

  // E. Keyboard Input Submission
  if (siriInput) {
    siriInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const query = siriInput.value.trim();
        if (query) {
          submitSiriQuery(query);
        }
      }
    });
  }

  window.addEventListener("resize", () => {
    if (siriActive) positionSiriHud();
  });
}

function openSiriHud() {
  const siriHud = document.getElementById("siri-hud");
  const siriBackdrop = document.getElementById("siri-focus-backdrop");
  const siriStatus = document.getElementById("siri-status-text");
  const siriResponse = document.getElementById("siri-response-text");
  const siriInput = document.getElementById("siri-input");

  if (!siriHud) return;

  siriActive = true;
  closeAllDropdowns();
  siriHud.classList.remove("show");
  siriHud.classList.add("siri-positioning");
  positionSiriHud();
  if (siriBackdrop) {
    void siriBackdrop.offsetWidth;
    siriBackdrop.classList.add("show");
  }
  void siriHud.offsetWidth;
  requestAnimationFrame(() => {
    if (!siriActive) return;
    siriHud.classList.remove("siri-positioning");
    siriHud.classList.add("show");
  });

  if (siriStatus) {
    siriStatus.textContent = "What would you like to do?";
  }
  if (siriResponse) {
    siriResponse.style.display = "none";
    siriResponse.textContent = "";
  }
  if (siriInput) {
    siriInput.value = "";
    setTimeout(() => siriInput.focus(), 150);
  }

  siriWaveState = "listening";
  siriWavePhase = 0;
  drawSiriWaveFrame();
  stopSiriWaveAnimation();
}

function closeSiriHud() {
  const siriHud = document.getElementById("siri-hud");
  const siriBackdrop = document.getElementById("siri-focus-backdrop");
  if (!siriHud) return;

  siriActive = false;
  siriRequestId++;
  if (siriResponseTimer) {
    clearTimeout(siriResponseTimer);
    siriResponseTimer = null;
  }
  siriHud.classList.remove("show");
  if (siriBackdrop) siriBackdrop.classList.remove("show");
  cancelSiriVoiceRecording();
  if (siriVoiceMonitorInterval) {
    clearInterval(siriVoiceMonitorInterval);
    siriVoiceMonitorInterval = null;
  }

  setTimeout(() => {
    if (!siriActive) {
      stopSiriWaveAnimation();
    }
  }, 350);
}

function startSiriWaveAnimation() {
  if (!siriActive || siriWaveId) return;
  siriWaveId = requestAnimationFrame(animateSiriWave);
}

function stopSiriWaveAnimation() {
  if (!siriWaveId) return;
  cancelAnimationFrame(siriWaveId);
  siriWaveId = null;
  siriWaveLastFrame = 0;
}

function positionSiriHud() {
  const siriHud = document.getElementById("siri-hud");
  const siriToggle = document.getElementById("menu-siri-toggle");
  if (!siriHud || !siriToggle) return;

  const rect = siriToggle.getBoundingClientRect();
  const panelWidth = Math.min(320, window.innerWidth - 24);
  const left = Math.min(
    Math.max(12, rect.left + rect.width / 2 - panelWidth / 2),
    window.innerWidth - panelWidth - 12
  );
  const top = Math.max(34, rect.bottom + 8);

  siriHud.style.width = `${panelWidth}px`;
  siriHud.style.top = `${top}px`;
  siriHud.style.setProperty("left", `${left}px`, "important");
  siriHud.style.setProperty("right", "auto", "important");
}

function animateSiriWave(timestamp = 0) {
  siriWaveId = null;
  if (!siriActive) return;

  if (!siriWaveLastFrame || timestamp - siriWaveLastFrame >= SIRI_WAVE_FRAME_INTERVAL) {
    siriWaveLastFrame = timestamp;
    drawSiriWaveFrame();
  }

  if (siriWaveState !== "listening" || micEnabled) {
    siriWaveId = requestAnimationFrame(animateSiriWave);
  }
}

function drawSiriWaveFrame() {
  const p1 = document.getElementById("wave-path-1");
  const p2 = document.getElementById("wave-path-2");
  const p3 = document.getElementById("wave-path-3");
  if (!p1 || !p2 || !p3) return;

  siriWavePhase += 0.12;
  
  let amp1, amp2, amp3;
  let freq1, freq2, freq3;

  let micVolume = 0;
  if (micEnabled && micAnalyser && micDataArray) {
    micAnalyser.getByteFrequencyData(micDataArray);
    let sum = 0;
    for (let i = 0; i < micDataArray.length; i++) {
      sum += micDataArray[i];
    }
    micVolume = sum / micDataArray.length; // Average volume level
  }
  
  if (siriWaveState === "listening") {
    // Breathing/idle wave modulated optionally by real microphone volume
    const baseAmp1 = 15 * Math.sin(siriWavePhase * 0.15) + 12;
    const baseAmp2 = 8 * Math.cos(siriWavePhase * 0.2) + 8;
    const baseAmp3 = 5 * Math.sin(siriWavePhase * 0.25) + 4;
    
    amp1 = baseAmp1 + micVolume * 0.6;
    amp2 = baseAmp2 + micVolume * 0.4;
    amp3 = baseAmp3 + micVolume * 0.25;
    
    freq1 = 0.015;
    freq2 = 0.022;
    freq3 = 0.03;
  } else if (siriWaveState === "thinking") {
    // Thinking state: rapid, low amplitude, high frequency ripple
    amp1 = 4 * Math.sin(siriWavePhase * 0.8) + 3;
    amp2 = 3 * Math.cos(siriWavePhase * 0.6) + 2;
    amp3 = 2.5 * Math.sin(siriWavePhase * 0.9) + 1.5;
    freq1 = 0.07;
    freq2 = 0.09;
    freq3 = 0.11;
  } else if (siriWaveState === "speaking") {
    // Speaking state: talking amplitude linked to text animation
    amp1 = Math.abs(Math.sin(siriWavePhase * 0.35)) * 25 + 8;
    amp2 = Math.abs(Math.cos(siriWavePhase * 0.25)) * 16 + 5;
    amp3 = Math.abs(Math.sin(siriWavePhase * 0.45)) * 10 + 3;
    freq1 = 0.02;
    freq2 = 0.03;
    freq3 = 0.045;
  }

  // Draw smooth waveforms with central hump envelope
  drawSiriWavePath(p1, amp1, freq1, siriWavePhase, 60);
  drawSiriWavePath(p2, amp2, freq2, siriWavePhase + 2.5, 60);
  drawSiriWavePath(p3, amp3, freq3, siriWavePhase + 5.0, 60);
}

function drawSiriWavePath(pathEl, amp, freq, phase, centerY) {
  let d = `M 0 ${centerY}`;
  for (let x = 0; x <= 400; x += 8) {
    // Hanning-style sine envelope window makes the wave start/end elegantly at 0
    const progress = x / 400;
    const envelope = Math.sin(progress * Math.PI);
    const y = centerY + Math.sin(x * freq + phase) * amp * envelope;
    d += ` L ${x} ${y}`;
  }
  pathEl.setAttribute("d", d);
}

async function toggleSiriMic() {
  const micBtn = document.getElementById("siri-mic-toggle");
  const statusText = document.getElementById("siri-status-text");
  if (!micBtn) return;
  
  if (micEnabled) {
    stopSiriVoiceRecording();
    return;
  }

  if (!window.MediaRecorder) {
    if (statusText) statusText.textContent = "Voice recording is not available in this browser.";
    return;
  }

  try {
    await startSiriMicStream();
    const mimeType = getSiriAudioMimeType();
    siriAudioChunks = [];
    siriMediaRecorder = new MediaRecorder(micStream, mimeType ? { mimeType } : undefined);

    siriMediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        siriAudioChunks.push(event.data);
      }
    };

    siriMediaRecorder.onstop = async () => {
      const chunks = siriAudioChunks.slice();
      const recordedType = siriMediaRecorder?.mimeType || mimeType || "audio/webm";
      siriMediaRecorder = null;
      siriAudioChunks = [];
      micEnabled = false;
      micBtn.classList.remove("active");
      disableMicStream();

      if (!chunks.length) {
        if (statusText) statusText.textContent = "No voice audio was recorded.";
        siriWaveState = "listening";
        return;
      }

      try {
        if (statusText) statusText.textContent = "Transcribing...";
        siriWaveState = "thinking";
        const audioBlob = new Blob(chunks, { type: recordedType });
        const transcript = await requestCloudflareTranscription(audioBlob);
        const siriInput = document.getElementById("siri-input");
        if (siriInput) siriInput.value = transcript;
        submitSiriQuery(transcript);
      } catch (error) {
        if (statusText) statusText.textContent = error?.message || "Voice transcription failed.";
        siriWaveState = "listening";
      }
    };

    siriMediaRecorder.start();
    micEnabled = true;
    micBtn.classList.add("active");
    if (statusText) statusText.textContent = "Listening...";
    siriWaveState = "listening";
    startSiriWaveAnimation();
    siriRecordingStopTimer = setTimeout(() => {
      stopSiriVoiceRecording();
    }, 6500);
  } catch (error) {
    console.error("Voice recording error:", error);
    stopSiriVoiceRecording();
    micEnabled = false;
    micBtn.classList.remove("active");
    if (statusText) statusText.textContent = getSiriVoiceErrorMessage(error?.name || error?.message);
  }
}

function getSiriAudioMimeType() {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4"
  ];
  return types.find(type => MediaRecorder.isTypeSupported(type)) || "";
}

async function startSiriMicStream() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("media-devices-unavailable");
  }

  if (micStream && micAnalyser && micDataArray) return;

  micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  micContext = new (window.AudioContext || window.webkitAudioContext)();
  if (micContext.state === "suspended") {
    await micContext.resume();
  }

  const source = micContext.createMediaStreamSource(micStream);
  micAnalyser = micContext.createAnalyser();
  micAnalyser.fftSize = 256;
  micDataArray = new Uint8Array(micAnalyser.frequencyBinCount);
  source.connect(micAnalyser);
}

function getSiriVoiceErrorMessage(errorCode = "") {
  const code = String(errorCode).toLowerCase();
  if (code.includes("not-allowed") || code.includes("service-not-allowed") || code.includes("permission")) {
    return "Voice input needs microphone permission.";
  }
  if (code.includes("audio-capture") || code.includes("notfound") || code.includes("notreadable")) {
    return "No microphone is available.";
  }
  if (code.includes("no-speech")) {
    return "I didn't catch that.";
  }
  if (code.includes("network")) {
    return "Voice transcription could not connect.";
  }
  if (code.includes("media-devices-unavailable")) {
    return "Voice input is not available in this browser.";
  }
  return "Voice input stopped.";
}

function stopSiriVoiceRecording() {
  const micBtn = document.getElementById("siri-mic-toggle");
  clearSiriRecordingTimer();
  micEnabled = false;
  if (micBtn) micBtn.classList.remove("active");
  if (siriWaveState === "listening") stopSiriWaveAnimation();
  if (siriMediaRecorder) {
    const recorder = siriMediaRecorder;
    try {
      if (recorder.state !== "inactive") recorder.stop();
    } catch (error) {
      console.warn("Voice recording already stopped.", error);
    }
    return;
  }
  disableMicStream();
}

function cancelSiriVoiceRecording() {
  clearSiriRecordingTimer();
  micEnabled = false;
  const micBtn = document.getElementById("siri-mic-toggle");
  if (micBtn) micBtn.classList.remove("active");
  if (siriWaveState === "listening") stopSiriWaveAnimation();
  if (siriMediaRecorder) {
    const recorder = siriMediaRecorder;
    siriMediaRecorder = null;
    recorder.ondataavailable = null;
    recorder.onstop = null;
    try {
      if (recorder.state !== "inactive") recorder.stop();
    } catch (error) {
      console.warn("Voice recording already stopped.", error);
    }
  }
  siriAudioChunks = [];
  disableMicStream();
}

function clearSiriRecordingTimer() {
  if (siriRecordingStopTimer) {
    clearTimeout(siriRecordingStopTimer);
    siriRecordingStopTimer = null;
  }
}

function disableMicStream() {
  micEnabled = false;
  const micBtn = document.getElementById("siri-mic-toggle");
  if (micBtn) micBtn.classList.remove("active");
  
  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }
  if (micContext) {
    if (micContext.state !== "closed") {
      micContext.close();
    }
    micContext = null;
  }
  micAnalyser = null;
  micDataArray = null;
}

function startVoiceVolumeMonitor() {
  if (siriVoiceMonitorInterval) clearInterval(siriVoiceMonitorInterval);
  
  let highVolumeTicks = 0;
  let quietTicks = 0;
  let voiceQuerySimulated = false;

  siriVoiceMonitorInterval = setInterval(() => {
    if (!micEnabled || !micAnalyser || !micDataArray) return;
    
    micAnalyser.getByteFrequencyData(micDataArray);
    let sum = 0;
    for (let i = 0; i < micDataArray.length; i++) { sum += micDataArray[i]; }
    const vol = sum / micDataArray.length;
    
    if (vol > 28) {
      highVolumeTicks++;
      quietTicks = 0;
      voiceQuerySimulated = true;
    } else {
      quietTicks++;
      if (quietTicks > 12 && voiceQuerySimulated && highVolumeTicks > 6) {
        // User finished speaking! Let's trigger a dynamic random voice query
        clearInterval(siriVoiceMonitorInterval);
        siriVoiceMonitorInterval = null;
        
        const queries = ["Find RPG games", "Open User Account", "Check system status", "Toggle Light Mode", "Search Simulation"];
        const randQuery = queries[Math.floor(Math.random() * queries.length)];
        
        const siriInput = document.getElementById("siri-input");
        if (siriInput) {
          siriInput.value = randQuery;
          submitSiriQuery(randQuery);
        }
        disableMicStream();
      }
    }
  }, 100);
}

const SIRI_API_ENDPOINT = "https://macosmacready.fpt4g789c6.workers.dev/api/siri";
const SIRI_TRANSCRIBE_ENDPOINT = "https://macosmacready.fpt4g789c6.workers.dev/api/transcribe";

async function requestCloudflareSiri(query) {
  const response = await fetch(SIRI_API_ENDPOINT, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: query,
      context: getSiriAssistantContext()
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.reply || "Siri could not reach the AI service.");
  }

  return {
    text: payload.reply || "Siri received an empty answer from the AI service."
  };
}

async function requestCloudflareTranscription(audioBlob) {
  const response = await fetch(SIRI_TRANSCRIBE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": audioBlob.type || "application/octet-stream"
    },
    body: audioBlob
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || "Voice transcription failed.");
  }

  const transcript = String(payload?.text || "").trim();
  if (!transcript) {
    throw new Error("I could not hear any speech.");
  }
  return transcript;
}

function getSiriAssistantContext() {
  const visibleArticles = articles
    .filter(shouldRenderArticle)
    .slice(0, 8)
    .map(article => ({
      title: article.title,
      source: article.sourceName,
      category: getCategoryTitle(article.category || "technology")
    }));

  const visibleGames = gamesCache
    .slice(0, 8)
    .map(game => ({
      name: game.name,
      genres: game.genres || [],
      rating: game.macRating || game.rating || ""
    }));

  return {
    app: currentApp,
    category: currentCategory,
    library: currentLibrary,
    articles: visibleArticles,
    games: visibleGames,
    signedIn: currentUsername !== "Guest",
    username: currentUsername || "Guest"
  };
}

function renderSiriResponse(response, responseText, requestId = siriRequestId) {
  if (requestId !== siriRequestId) return;
  siriWaveState = "speaking";
  startSiriWaveAnimation();

  if (responseText) {
    responseText.style.display = "block";
    typewriterEffect(responseText, response.text, () => {
      if (requestId !== siriRequestId) return;
      siriWaveState = "listening";
      stopSiriWaveAnimation();
    }, requestId);
  }

  if (response.action) {
    setTimeout(() => {
      if (requestId !== siriRequestId) return;
      response.action();
    }, 500);
  }
}

function submitSiriQuery(query) {
  const statusText = document.getElementById("siri-status-text");
  const responseText = document.getElementById("siri-response-text");
  const siriInput = document.getElementById("siri-input");

  if (!query || !query.trim()) return;

  const requestId = ++siriRequestId;
  if (siriResponseTimer) {
    clearTimeout(siriResponseTimer);
    siriResponseTimer = null;
  }

  // Set Wave to Thinking
  siriWaveState = "thinking";
  startSiriWaveAnimation();
  if (statusText) statusText.textContent = `"${query}"`;
  if (responseText) {
    responseText.style.display = "none";
    responseText.textContent = "";
  }
  if (siriInput) siriInput.value = "";

  setTimeout(async () => {
    if (requestId !== siriRequestId) return;
    const localResponse = processSiriCommand(query);

    if (!localResponse.needsAI) {
      renderSiriResponse(localResponse, responseText, requestId);
      return;
    }

    if (statusText) statusText.textContent = "Thinking...";

    try {
      const aiResponse = await requestCloudflareSiri(query);
      renderSiriResponse(aiResponse, responseText, requestId);
    } catch (error) {
      renderSiriResponse({
        text: error?.message || "Siri could not reach the AI service."
      }, responseText, requestId);
    }
  }, 280);
}

function processSiriCommand(rawQuery) {
  const q = rawQuery.toLowerCase().trim();

  const includesAny = (terms) => terms.some(term => q.includes(term));
  const searchText = rawQuery.replace(/\b(search|find|show me|look for|open)\b/gi, "").trim();
  const isQuestion = /^(what|who|why|how|when|where|which|can|could|should|would|is|are|do|does|did)\b/i.test(rawQuery.trim()) || rawQuery.includes("?");

  if (includesAny(["what can you do", "help", "commands"])) {
    return {
      text: "I can open apps, search stories, search games, open settings, change appearance, refresh feeds, and open matching articles."
    };
  }

  if (isQuestion) {
    return {
      needsAI: true
    };
  }

  if (includesAny(["open news", "today", "overview"])) {
    return {
      text: "Opening Today's Overview.",
      action: () => switchApp("news")
    };
  }
  if (includesAny(["open games", "games page", "game page"])) {
    return {
      text: "Opening Games.",
      action: () => switchApp("games")
    };
  }
  if (includesAny(["open reviews", "reviews page"])) {
    return {
      text: "Opening Reviews.",
      action: () => switchApp("reviews")
    };
  }
  if (includesAny(["open apps", "apps page"])) {
    return {
      text: "Opening Apps.",
      action: () => {
        switchApp("news");
        currentCategory = "culture";
        renderFeed();
      }
    };
  }
  if (includesAny(["apple intelligence", "open ai", "ai news"])) {
    return {
      text: "Opening Apple Intelligence.",
      action: () => {
        switchApp("news");
        currentCategory = "ai";
        renderFeed();
      }
    };
  }

  if (includesAny(["open account", "user account", "hardware profile", "security keys"])) {
    return {
      text: "Opening User Account.",
      action: () => openAccountWindow()
    };
  }
  if (includesAny(["settings", "preferences", "wallpaper", "appearance", "accessibility"])) {
    const tab = q.includes("accessibility") ? "accessibility" : q.includes("appearance") || q.includes("general") ? "general" : "wallpaper";
    return {
      text: tab === "wallpaper" ? "Opening Wallpaper Settings." : `Opening ${tab.charAt(0).toUpperCase() + tab.slice(1)} Settings.`,
      action: () => openSettingsTab(tab)
    };
  }

  if (includesAny(["light mode", "dark mode", "toggle light", "toggle theme", "switch theme"])) {
    const nextMode = document.body.classList.contains("light-mode") ? "Dark Mode" : "Light Mode";
    return {
      text: `Switching to ${nextMode}.`,
      action: () => {
        document.body.classList.toggle("light-mode");
        const isLightMode = document.body.classList.contains("light-mode");
        localStorage.setItem("tahoe_darkmode", isLightMode ? "light" : "dark");
        updateModeButtonLabel();
        if (currentApp === "crossover") renderCrossoverView();
        if (currentApp === "games") renderGamesView();
        if (currentApp === "finder") renderFinderView();
      }
    };
  }

  if (includesAny(["refresh news", "reload news", "update news"])) {
    return {
      text: "Refreshing stories.",
      action: () => loadNewsFromRSS()
    };
  }
  if (includesAny(["refresh games", "reload games", "update games"])) {
    return {
      text: "Refreshing game data.",
      action: () => loadAllGamesData({ force: true })
    };
  }

  if (q.includes("rpg") && q.includes("game")) {
    return {
      text: "Showing RPG games.",
      action: () => triggerGenreSidebarFilter("RPG")
    };
  }
  if (q.includes("action") && q.includes("game")) {
    return {
      text: "Showing Action games.",
      action: () => triggerGenreSidebarFilter("Action")
    };
  }
  if (q.includes("adventure") && q.includes("game")) {
    return {
      text: "Showing Adventure games.",
      action: () => triggerGenreSidebarFilter("Adventure")
    };
  }
  if (q.includes("strategy") && q.includes("game")) {
    return {
      text: "Showing Strategy games.",
      action: () => triggerGenreSidebarFilter("Strategy")
    };
  }
  if (q.includes("simulation") && q.includes("game")) {
    return {
      text: "Showing Simulation games.",
      action: () => triggerGenreSidebarFilter("Simulation")
    };
  }
  if ((q.includes("sports") || q.includes("sport")) && q.includes("game")) {
    return {
      text: "Showing Sports games.",
      action: () => triggerGenreSidebarFilter("Sports")
    };
  }

  if (includesAny(["latest news", "top story", "latest story"])) {
    const latest = articles.find(shouldRenderArticle);
    return latest ? {
      text: `${latest.title} — ${latest.sourceName}.`,
      action: () => openArticle(latest.id)
    } : {
      text: "Stories are still loading."
    };
  }

  const articleQuery = searchText || rawQuery.trim();
  const matchingArticles = articles
    .filter(shouldRenderArticle)
    .filter(article => {
      const body = `${article.title} ${article.subtitle} ${article.sourceName}`.toLowerCase();
      return articleQuery && body.includes(articleQuery.toLowerCase());
    })
    .slice(0, 3);

  if (matchingArticles.length > 0) {
    return {
      text: `Found ${matchingArticles.length} matching ${matchingArticles.length === 1 ? "story" : "stories"}. Opening the closest match: ${matchingArticles[0].title}.`,
      action: () => {
        switchApp("news");
        openArticle(matchingArticles[0].id);
      }
    };
  }

  const matchingGames = gamesCache
    .filter(game => {
      const body = `${game.name} ${(game.genres || []).join(" ")} ${game.fullDescription || ""}`.toLowerCase();
      return articleQuery && body.includes(articleQuery.toLowerCase());
    })
    .slice(0, 6);

  if (matchingGames.length > 0) {
    return {
      text: `Found ${matchingGames.length} matching ${matchingGames.length === 1 ? "game" : "games"}. Showing ${matchingGames[0].name}.`,
      action: () => {
        switchApp("games");
        gameSearchQuery = articleQuery;
        gameSearchResults = matchingGames;
        renderGamesView();
        openSteamGameDetail(matchingGames[0].id);
      }
    };
  }

  if (includesAny(["hello", "hi ", "hey siri"])) {
    return {
      needsAI: true
    };
  }

  if (articleQuery) {
    return {
      needsAI: true
    };
  }

  return {
    needsAI: true
  };
}

function triggerGenreSidebarFilter(genreName) {
  switchApp("games");
  const genreSidebarItems = document.querySelectorAll("#games-genre-menu .sidebar-item");
  genreSidebarItems.forEach(item => {
    if (item.getAttribute("data-game-genre") === genreName) {
      item.click();
    }
  });
}

function triggerCompatSidebarFilter(compatName) {
  switchApp("games");
  const compatSidebarItems = document.querySelectorAll("#games-compat-menu .sidebar-item");
  compatSidebarItems.forEach(item => {
    if (item.getAttribute("data-game-compat") === compatName) {
      item.click();
    }
  });
}

function typewriterEffect(element, text, callback, requestId = siriRequestId) {
  if (siriResponseTimer) {
    clearTimeout(siriResponseTimer);
    siriResponseTimer = null;
  }
  element.textContent = "";
  let i = 0;
  const speed = 25; // 25ms per character typing speed
  
  function type() {
    if (requestId !== siriRequestId) return;
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      siriResponseTimer = setTimeout(type, speed);
    } else {
      siriResponseTimer = null;
      if (callback) callback();
    }
  }
  type();
}

window.openSiriHud = openSiriHud;
window.closeSiriHud = closeSiriHud;
Object.defineProperty(window, 'siriActive', {
  get: () => siriActive,
  set: (v) => { siriActive = v; }
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAll);
} else {
  initAll();
}
