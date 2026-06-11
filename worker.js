import { onRequestGet as siriGet, onRequestPost as siriPost, onRequestOptions as siriOptions } from "./functions/api/siri.js";
import { onRequestOptions as transcribeOptions, onRequestPost as transcribePost } from "./functions/api/transcribe.js";
import { onRequestGet as crossoverCompatibilityGet } from "./functions/api/crossover-compatibility.js";
import { onRequestGet as rssProxyGet, onRequestOptions as rssProxyOptions } from "./functions/api/rss-proxy.js";
import { corsHeaders } from "./functions/api/request-guard.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/siri") {
      if (request.method === "OPTIONS") return siriOptions({ request });
      if (request.method === "POST") return siriPost({ request, env });
      if (request.method === "GET") return siriGet({ request });
      return new Response("Method Not Allowed", { status: 405 });
    }

    if (url.pathname === "/api/rss") {
      if (request.method === "OPTIONS") return rssProxyOptions({ request });
      if (request.method === "GET") return rssProxyGet({ request });
      return new Response("Method Not Allowed", { status: 405 });
    }

    if (url.pathname === "/api/transcribe") {
      if (request.method === "OPTIONS") return transcribeOptions({ request });
      if (request.method === "POST") return transcribePost({ request, env });
      return new Response("Method Not Allowed", { status: 405 });
    }

    if (url.pathname === "/api/crossover-compatibility") {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders(request, "GET, OPTIONS") });
      }
      if (request.method === "GET") return crossoverCompatibilityGet({ request, env });
      return new Response("Method Not Allowed", { status: 405 });
    }

    return env.ASSETS.fetch(request);
  }
};
