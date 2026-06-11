/** Canonical news/deal filter rules — used by client, tests, and mirrored in Rust builder. */

export const APPLE_ECOSYSTEM_SOURCES = new Set(["iClarified"]);
export const APPLE_ECOSYSTEM_TERMS = /\b(Apple|WWDC|iOS|iPhone|iPad|macOS|Mac\b|AirPods|watchOS|visionOS|Siri|App Store|iCloud|Xcode|Apple TV|Apple Watch)\b/i;
export const MAC_NEWS_TERMS = /\b(macOS|Mac\b|MacBook|iMac|Mac mini|Mac Studio|Mac Pro|Apple silicon|M[1-9]\b|WWDC|Safari|Finder|Time Machine|Xcode|Gatekeeper|FileVault|Launch Services|MDM|Jamf|SwiftUI|AppKit|Terminal|malware|Security Update)\b/i;
export const STRONG_MAC_CONTEXT_TERMS = /\b(macOS|Mac\b|MacBook|iMac|Mac mini|Mac Studio|Mac Pro|Apple silicon|M[1-9]\b|Finder|Time Machine|Xcode|Gatekeeper|FileVault|Launch Services|MDM|Jamf|SwiftUI|AppKit|Terminal|Security Update)\b/i;
export const IOS_ONLY_TERMS = /\b(iOS|iPhone|iPad|iPadOS|watchOS|Apple Watch|AirPods|visionOS|Vision Pro)\b/i;
export const DEAL_TERMS = /\b(deal|deals|sale|discount|coupon|save \$|save up to|% off|today only|lowest price|record-low|price drop|clearance|promo|promotion|bundle|lifetime license|sponsored|advertorial|stacksocial|walmart|best buy|amazon|b&h)\b/i;
export const SALES_DEAL_TERMS = /\b(sale|on sale|discount|discounted|coupon|save \$|save up to|% off|today only|lowest price|record-low|record low|all-time low|price drop|price cut|clearance|promo|promotion|bundle|lifetime license|sponsored|advertorial|stacksocial|walmart|best buy|amazon|b&h|marked down)\b/i;
export const IDIOMATIC_DEAL_TERMS = /\b(?:biggest|main|real|whole|entire|true)\s+deal\s+(?:about|with|here|is|was|isn't|is not|breaker)|(?:the|this|that|a)\s+deal\s+(?:about|with|here|is|was|isn't|is not|breaker)|not\s+(?:the|a)\s+deal\b|\bdeal\s+breaker\b/i;
export const COMMERCIAL_PRICE_TERMS = /(?:[$£€]\s?\d[\d,]*(?:\.\d{2})?|\d{1,3}%\s?off|save\s?(?:up to\s?)?[$£€]?\s?\d[\d,]*|[$£€]?\s?\d[\d,]*\s?off|all-time low|record low|lowest price)/i;
export const MAC_DEAL_TERMS = /\b(MacBook|iMac|Mac mini|Mac Studio|Mac Pro|Studio Display|Apple display|Apple silicon)\b/i;
export const MACBOOK_DEAL_TERMS = /\b(MacBook|MacBook Air|MacBook Pro|USB-C|Thunderbolt|MagSafe|dock|hub|charger|adapter|monitor|display|SSD|external drive|keyboard|mouse|trackpad|sleeve|case|stand|backpack|accessor(?:y|ies)|AppleCare|M[1-9]\b)\b/i;
export const MAC_DEAL_PRODUCT_TERMS = /\b(MacBook|MacBook Air|MacBook Pro|Mac mini|Mac Studio|Mac Pro|iMac|Studio Display|Mac\b)\b/i;
export const MOBILE_PRODUCT_TERMS = /\b(iPhone|iPad|AirPods|Apple Watch|Watch|Vision Pro|MagSafe Battery)\b/i;
export const PRICE_PATTERN = /(?:[$£€]\s?\d[\d,]*(?:\.\d{2})?|\d{1,3}%\s?off|save\s?(?:up to\s?)?[$£€]?\s?\d[\d,]*|[$£€]?\s?\d[\d,]*\s?off|all-time low|record low|lowest price)/ig;

export const RSS_CATEGORY_TERMS = {
  technology: MAC_NEWS_TERMS,
  design: /\b(game|games|gaming|Steam|Xbox|PlayStation|Nintendo|Switch|PC|trailer|release|released|launch|update|patch|DLC|demo|early access|indie|developer|studio)\b/i,
  science: /\b(review|reviews|hands-on|tested|benchmark|benchmarks|performance|long-term|versus|vs\.?|Mac|macOS|MacBook|iMac|Mac mini|Mac Studio|Mac Pro)\b/i,
  culture: /\b(Mac app|Mac apps|macOS app|macOS apps|for Mac|on Mac|Mac version|menu bar|Safari extension|Setapp|Raycast|Alfred|BBEdit|Pixelmator|CleanMyMac|Final Cut|Logic Pro|developer tool|Apple silicon)\b/i,
  ai: /\b(Apple Intelligence|AI|artificial intelligence|Siri|LLM|language model|machine learning|Foundation Models|Image Playground|Genmoji|Writing Tools|ChatGPT|OpenAI|Claude|Gemini|Shortcuts Playground|macOS)\b/i,
  deals: /\b(MacBook|MacBook Air|MacBook Pro|Mac mini|Mac Studio|Studio Display|Thunderbolt|USB-C|MagSafe|charger|dock|hub|monitor|display|SSD|keyboard|mouse|trackpad|case|sleeve|stand|backpack|accessor(?:y|ies)|deal|deals|discount|sale|off|low|price|Amazon|Best Buy|B&H)\b/i
};

export function cleanArticleText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

export function stripHTML(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isPodcastFeedEntry(title, subtitle = "", content = "", link = "") {
  const titleLower = cleanArticleText(title).toLowerCase();
  const subtitleLower = cleanArticleText(subtitle).toLowerCase();
  const contentLower = stripHTML(content).toLowerCase();
  const linkLower = String(link || "").toLowerCase();
  const combined = `${titleLower} ${subtitleLower} ${contentLower}`;

  if (titleLower.includes("podcast rewind")) return true;
  if (titleLower.includes("macstories weekly")) return true;
  if (linkLower.includes("/podcast-rewind") || linkLower.includes("/podcast/episode") || linkLower.includes("/feed/podcast")) {
    return true;
  }
  if (subtitleLower.startsWith("enjoy the latest episodes from") || contentLower.startsWith("enjoy the latest episodes from")) {
    return true;
  }
  if (combined.includes("recap of") && combined.includes("articles and podcasts")) return true;
  if (titleLower.startsWith("podcast:") || titleLower.startsWith("listen now:") || titleLower.startsWith("watch:")) {
    return true;
  }

  return false;
}

export function isIOSLedTitle(title) {
  return IOS_ONLY_TERMS.test(title || "") && !STRONG_MAC_CONTEXT_TERMS.test(title || "");
}

export function shouldIncludeRSSArticle(source, title, rawDescription, content) {
  if (!title) return false;
  if (isPodcastFeedEntry(title, stripHTML(rawDescription || ""), stripHTML(content || ""))) return false;

  const isAppleEcosystemSource = APPLE_ECOSYSTEM_SOURCES.has(source.name);
  const headlineText = `${title} ${stripHTML(rawDescription || "")}`;
  if (source.category !== "design" && source.category !== "deals" && !isAppleEcosystemSource && isIOSLedTitle(title)) {
    return false;
  }

  const combinedText = `${title} ${rawDescription || ""} ${stripHTML(content || "")}`;
  const categoryTerms = RSS_CATEGORY_TERMS[source.category] || MAC_NEWS_TERMS;
  const categoryOk = isAppleEcosystemSource && source.category === "technology"
    ? APPLE_ECOSYSTEM_TERMS.test(combinedText)
    : categoryTerms.test(combinedText);
  if (!categoryOk) return false;

  if (source.category === "deals") {
    if (MOBILE_PRODUCT_TERMS.test(title) && !MAC_DEAL_PRODUCT_TERMS.test(title)) return false;
    return DEAL_TERMS.test(combinedText) && MACBOOK_DEAL_TERMS.test(headlineText);
  }

  if (source.category !== "technology") return true;

  const hasMacContext = isAppleEcosystemSource
    ? APPLE_ECOSYSTEM_TERMS.test(combinedText)
    : STRONG_MAC_CONTEXT_TERMS.test(headlineText);
  if (!hasMacContext) return false;

  const dealHeadline = isAppleEcosystemSource ? title : headlineText;
  const isDeal = DEAL_TERMS.test(dealHeadline);
  if (isDeal && !MAC_DEAL_TERMS.test(dealHeadline)) return false;

  if (!isAppleEcosystemSource && isIOSLedTitle(title)) return false;

  return true;
}

export function isMobileAppleArticle(article) {
  if (!article || article.category === "design" || article.category === "deals") return false;
  const title = article.title || "";
  const headline = `${article.title || ""} ${article.subtitle || ""}`;
  if (IOS_ONLY_TERMS.test(title) && !STRONG_MAC_CONTEXT_TERMS.test(title)) return true;
  return IOS_ONLY_TERMS.test(headline) && !STRONG_MAC_CONTEXT_TERMS.test(headline);
}

export function isIOSFocusedNewsText(title, subtitle = "") {
  const headlineText = `${title || ""} ${subtitle || ""}`;
  return IOS_ONLY_TERMS.test(headlineText) && !STRONG_MAC_CONTEXT_TERMS.test(headlineText);
}

export function shouldRenderArticle(article) {
  if (isPodcastFeedEntry(
    article.title,
    article.subtitle,
    article.content,
    article.sourceUrl
  )) {
    return false;
  }
  if (isMobileAppleArticle(article)) return false;
  if (article.category === "technology" && isIOSLedTitle(article.title)) return false;

  const imageRequiredSources = ["The Mac Observer", "Six Colors", "MacStories"];
  if (imageRequiredSources.includes(article.sourceName) && (!article.cover || article.cover.startsWith("preset-"))) {
    return false;
  }

  return true;
}

export function hasCommercialDealSignal(title, headlineText) {
  if (SALES_DEAL_TERMS.test(headlineText) || COMMERCIAL_PRICE_TERMS.test(headlineText)) return true;
  if (/\b(deals?)\b/i.test(title) && !IDIOMATIC_DEAL_TERMS.test(headlineText)) return true;
  return false;
}

export function isMacDealArticle(article) {
  if (!article) return false;
  const title = article.title || "";
  const headlineText = `${title} ${article.subtitle || ""}`;
  if (!hasCommercialDealSignal(title, headlineText)) return false;
  if (MOBILE_PRODUCT_TERMS.test(title) && !MAC_DEAL_PRODUCT_TERMS.test(title)) return false;
  return MACBOOK_DEAL_TERMS.test(headlineText) || MAC_DEAL_TERMS.test(headlineText);
}

export function resolveArticleCategory(article, sourceCategory) {
  const baseCategory = sourceCategory || article?.category || "technology";
  if (baseCategory === "design" || baseCategory === "deals") return baseCategory;
  return isMacDealArticle(article) ? "deals" : baseCategory;
}

export function extractDealSignals(article) {
  if (!article || article.category !== "deals") return [];
  const text = `${article.title || ""} ${article.subtitle || ""}`;
  return [...new Set((text.match(PRICE_PATTERN) || []).map(value => cleanArticleText(value)).filter(Boolean))].slice(0, 3);
}

export function installNewsFilters() {
  if (typeof window === "undefined") return;
  Object.assign(window, {
    isPodcastFeedEntry,
    isIOSLedTitle,
    shouldIncludeRSSArticle,
    isMobileAppleArticle,
    isIOSFocusedNewsText,
    shouldRenderArticle,
    hasCommercialDealSignal,
    isMacDealArticle,
    resolveArticleCategory,
    extractDealSignals
  });
}
