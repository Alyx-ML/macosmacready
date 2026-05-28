import { onRequestGet as siriGet, onRequestPost as siriPost } from "./functions/api/siri.js";
import { onRequestOptions as transcribeOptions, onRequestPost as transcribePost } from "./functions/api/transcribe.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/siri") {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: {
        "Access-Control-Allow-Origin": "https://alyx-ml.github.io",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      } });
      if (request.method === "POST") return siriPost({ request, env });
      if (request.method === "GET") return siriGet();
      return new Response("Method Not Allowed", { status: 405 });
    }

    if (url.pathname === "/api/transcribe") {
      if (request.method === "OPTIONS") return transcribeOptions();
      if (request.method === "POST") return transcribePost({ request, env });
      return new Response("Method Not Allowed", { status: 405 });
    }

    return env.ASSETS.fetch(request);
  }
};
