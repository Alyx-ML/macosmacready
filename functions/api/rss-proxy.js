import { corsHeaders, isAllowedApiRequest } from "./request-guard.js";

const ALLOWED_HOSTS = new Set([
  "9to5mac.com",
  "feeds.macrumors.com",
  "appleinsider.com",
  "www.apple.com",
  "feeds.arstechnica.com",
  "www.theverge.com",
  "tidbits.com",
  "eclecticlight.co",
  "mjtsai.com",
  "www.macworld.com",
  "www.macobserver.com",
  "www.iclarified.com",
  "daringfireball.net",
  "512pixels.net",
  "scriptingosx.com",
  "eshop.macsales.com",
  "derflounder.wordpress.com",
  "www.pcgamer.com",
  "www.rockpapershotgun.com",
  "www.polygon.com",
  "kotaku.com",
  "sixcolors.com",
  "www.macstories.net",
  "9to5toys.com",
  "www.codeweavers.com",
  "store.steampowered.com",
  "steamcommunity.com",
  "cdn.cloudflare.steamstatic.com",
  "shared.cloudflare.steamstatic.com",
  "www.youtube.com",
  "i.ytimg.com",
  "i3.ytimg.com"
]);

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^169\.254\./,
  /^0\./,
  /^\[::1\]$/i
];

export async function onRequestGet({ request }) {
  if (!isAllowedApiRequest(request)) {
    return new Response("Forbidden", { status: 403, headers: corsHeaders(request, "GET, OPTIONS") });
  }

  const requestUrl = new URL(request.url);
  const feedUrl = (requestUrl.searchParams.get("url") || "").trim();

  if (!feedUrl || !isAllowedFeedUrl(feedUrl)) {
    return new Response("Invalid or disallowed RSS URL", {
      status: 400,
      headers: corsHeaders(request, "GET, OPTIONS")
    });
  }

  try {
    const response = await fetch(feedUrl, {
      headers: {
        "user-agent": "MacReady RSS Reader"
      }
    });

    if (!response.ok) {
      return new Response(`RSS request failed: ${response.status}`, {
        status: response.status,
        headers: corsHeaders(request, "GET, OPTIONS")
      });
    }

    return new Response(await response.text(), {
      status: 200,
      headers: {
        ...corsHeaders(request, "GET, OPTIONS"),
        "content-type": response.headers.get("content-type") || "text/plain; charset=utf-8",
        "cache-control": "public, max-age=900"
      }
    });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "RSS request failed", {
      status: 502,
      headers: corsHeaders(request, "GET, OPTIONS")
    });
  }
}

export function onRequestOptions({ request }) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request, "GET, OPTIONS")
  });
}

export function isAllowedFeedUrl(feedUrl) {
  try {
    const parsed = new URL(feedUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    if (BLOCKED_HOST_PATTERNS.some(pattern => pattern.test(parsed.hostname))) return false;
    return ALLOWED_HOSTS.has(parsed.hostname);
  } catch (error) {
    return false;
  }
}
