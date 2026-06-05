import { onRequestGet as siriGet, onRequestPost as siriPost } from "./functions/api/siri.js";
import { onRequestOptions as transcribeOptions, onRequestPost as transcribePost } from "./functions/api/transcribe.js";
import { onRequestGet as crossoverCompatibilityGet } from "./functions/api/crossover-compatibility.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/siri") {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: {
        "Access-Control-Allow-Origin": getAllowedOrigin(request),
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      } });
      if (request.method === "POST") return siriPost({ request, env });
      if (request.method === "GET") return siriGet();
      return new Response("Method Not Allowed", { status: 405 });
    }

    if (url.pathname === "/api/transcribe") {
      if (request.method === "OPTIONS") return transcribeOptions({ request });
      if (request.method === "POST") return transcribePost({ request, env });
      return new Response("Method Not Allowed", { status: 405 });
    }

    if (url.pathname === "/api/crossover-compatibility") {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      } });
      if (request.method === "GET") return crossoverCompatibilityGet({ request, env });
      return new Response("Method Not Allowed", { status: 405 });
    }

    return env.ASSETS.fetch(request);
  }
};

function getAllowedOrigin(request) {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = new Set([
    "https://alyx-ml.github.io",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ]);
  return allowedOrigins.has(origin) ? origin : "https://alyx-ml.github.io";
}
