const CODEWEAVERS_ORIGIN = "https://www.codeweavers.com";
const LOOKUP_HEADERS = {
  "accept": "text/html,application/xhtml+xml",
  "user-agent": "MacReady CodeWeavers compatibility lookup"
};

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const title = (url.searchParams.get("title") || "").trim();

  if (!title) {
    return jsonResponse({ found: false, reason: "missing_title" }, 400);
  }

  try {
    const result = await lookupCrossoverCompatibility(title);
    return jsonResponse(result, 200, {
      "Cache-Control": result.found ? "public, max-age=21600" : "public, max-age=3600"
    });
  } catch (error) {
    return jsonResponse({
      found: false,
      reason: "lookup_failed",
      message: error instanceof Error ? error.message : "CodeWeavers lookup failed"
    }, 502);
  }
}

export async function lookupCrossoverCompatibility(rawTitle, fetchImpl = fetch) {
  const title = sanitizeTitle(rawTitle);
  if (!title) return { found: false, reason: "missing_title" };

  const searchUrl = buildSearchUrl(title);
  const searchHtml = await fetchText(searchUrl, fetchImpl);
  const results = parseSearchResults(searchHtml);
  const match = chooseBestMatch(title, results);

  if (!match) {
    return {
      found: false,
      reason: "no_match",
      query: title,
      searchUrl
    };
  }

  const pageHtml = await fetchText(match.pageUrl, fetchImpl);
  const page = parseCompatibilityPage(pageHtml);

  return {
    found: true,
    source: "CodeWeavers Compatibility Center",
    query: title,
    matchedTitle: page.title || match.title,
    pageUrl: match.pageUrl,
    appId: page.appId || match.appId || "",
    slug: page.slug || match.slug || "",
    score: Number(match.score.toFixed(3)),
    company: match.company || "",
    updatedAt: match.updatedAt || page.updatedAt || "",
    macRating: {
      stars: page.macRating.stars || match.macStars || 0,
      label: page.macRating.label || labelForStars(page.macRating.stars || match.macStars || 0),
      lastTestedVersion: page.macRating.lastTestedVersion || "",
      reportCount: page.macRating.reportCount
    }
  };
}

function sanitizeTitle(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

function buildSearchUrl(title) {
  const url = new URL("/compatibility", CODEWEAVERS_ORIGIN);
  url.searchParams.set("search", "app");
  url.searchParams.set("name", title);
  return url.toString();
}

async function fetchText(url, fetchImpl) {
  const response = await fetchImpl(url, { headers: LOOKUP_HEADERS });
  if (!response.ok) {
    throw new Error(`CodeWeavers request returned ${response.status}`);
  }
  return response.text();
}

function parseSearchResults(html) {
  const resultsBlock = getBetween(html, '<div id="results"', '</tbody>') || "";
  const rows = [];
  const rowPattern = /<tr[^>]*id="key_([^"]+)"[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowPattern.exec(resultsBlock))) {
    const rowHtml = rowMatch[2];
    const linkMatch = rowHtml.match(/<a\s+href="(\/compatibility\/crossover\/[^"]+)">([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;

    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(match => cleanHtmlText(match[1]));
    const stars = countActiveStars(rowHtml);
    const href = linkMatch[1];

    rows.push({
      appId: rowMatch[1],
      title: cleanHtmlText(linkMatch[2]),
      pageUrl: new URL(href, CODEWEAVERS_ORIGIN).toString(),
      slug: href.split("/").pop() || "",
      company: cells[1] || "",
      updatedAt: cells[2] || "",
      macStars: stars
    });
  }

  return rows;
}

function chooseBestMatch(query, results) {
  let best = null;

  for (const result of results) {
    const score = scoreTitleMatch(query, result.title);
    if (!best || score > best.score) {
      best = { ...result, score };
    }
  }

  if (!best || best.score < 0.84) return null;
  return best;
}

function scoreTitleMatch(query, candidate) {
  const queryNorm = normalizeTitle(query);
  const candidateNorm = normalizeTitle(candidate);
  if (!queryNorm || !candidateNorm) return 0;
  if (queryNorm === candidateNorm) return 1;

  const queryTokens = importantTokens(queryNorm);
  const candidateTokens = new Set(importantTokens(candidateNorm));
  if (queryTokens.length === 0 || candidateTokens.size === 0) return 0;

  const overlap = queryTokens.filter(token => candidateTokens.has(token)).length;
  const coverage = overlap / queryTokens.length;
  const candidateExtra = Math.max(0, candidateTokens.size - queryTokens.length);
  const containsBonus = candidateNorm.includes(queryNorm) ? 0.14 : 0;
  const lengthPenalty = Math.min(0.2, candidateExtra * 0.035);

  return Math.max(0, coverage + containsBonus - lengthPenalty);
}

function normalizeTitle(value) {
  return decodeHtml(value)
    .toLowerCase()
    .replace(/[™®©]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function importantTokens(value) {
  const ignored = new Set(["a", "an", "and", "of", "the"]);
  return value.split(" ").filter(token => token && !ignored.has(token));
}

function parseCompatibilityPage(html) {
  const title = cleanHtmlText((html.match(/<h1[^>]*class="[^"]*\btxt_magenta\b[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || "");
  const appId = cleanHtmlText((html.match(/<span[^>]*id="var_app_id"[^>]*>([\s\S]*?)<\/span>/i) || [])[1] || "");
  const slug = cleanHtmlText((html.match(/<span[^>]*id="var_app_plnk"[^>]*>([\s\S]*?)<\/span>/i) || [])[1] || "");
  const updatedAt = cleanHtmlText((html.match(/<div class="col-7">([^<]*(?:,\s*\d{1,2}:\d{2}\s*[ap]m)?)<\/div>/i) || [])[1] || "");
  const macSection = (html.match(/<div class="os_Mac">([\s\S]*?)<div class="os_Linux">/i) || [])[1] || "";
  const macText = cleanHtmlText(macSection);
  const hiddenStars = Number(cleanHtmlText((html.match(/<span[^>]*id="var_medal_mac"[^>]*>([\s\S]*?)<\/span>/i) || [])[1] || ""));
  const sectionStars = countActiveStars(macSection);
  const stars = Number.isFinite(hiddenStars) && hiddenStars > 0 ? hiddenStars : sectionStars;
  const labelMatch = macText.match(/Mac Rating\s+(.+?)\s+Last Tested:/i);
  const lastTestedMatch = macText.match(/Last Tested:\s*([^\s(]+)/i);
  const reportCountMatch = macText.match(/Last Tested:\s*[^\s(]+\s*\((\d+)\)/i);

  return {
    title,
    appId,
    slug,
    updatedAt,
    macRating: {
      stars,
      label: labelMatch ? labelMatch[1].trim() : labelForStars(stars),
      lastTestedVersion: lastTestedMatch ? lastTestedMatch[1].trim() : "",
      reportCount: reportCountMatch ? Number(reportCountMatch[1]) : null
    }
  };
}

function labelForStars(stars) {
  if (stars >= 5) return "Runs Great";
  if (stars === 4) return "Runs Well";
  if (stars === 3) return "Limited Functionality";
  if (stars === 2) return "Installs, Will Not Run";
  if (stars === 1) return "Will Not Install";
  return "Not Rated";
}

function countActiveStars(html) {
  return (html.match(/<li\b[^>]*class="[^"]*\bactive\b[^"]*"/gi) || []).length;
}

function getBetween(html, startNeedle, endNeedle) {
  const start = html.indexOf(startNeedle);
  if (start === -1) return "";
  const end = html.indexOf(endNeedle, start);
  if (end === -1) return html.slice(start);
  return html.slice(start, end);
}

function cleanHtmlText(value) {
  return decodeHtml(String(value || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim());
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function jsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      ...extraHeaders
    }
  });
}
