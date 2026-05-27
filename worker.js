import { onRequestGet as siriGet, onRequestPost as siriPost } from "./functions/api/siri.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/siri") {
      if (request.method === "POST") return siriPost({ request, env });
      if (request.method === "GET") return siriGet();
      return new Response("Method Not Allowed", { status: 405 });
    }

    return env.ASSETS.fetch(request);
  }
};
