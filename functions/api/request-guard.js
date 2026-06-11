const DEFAULT_ALLOWED_ORIGINS = new Set([
  "https://alyx-ml.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5175",
  "http://127.0.0.1:5175"
]);

export function getAllowedOrigin(request) {
  const origin = request?.headers?.get("Origin") || "";
  const url = new URL(request.url);
  const allowedOrigins = new Set([
    ...DEFAULT_ALLOWED_ORIGINS,
    `https://${url.hostname}`,
    `http://${url.hostname}`
  ]);
  return allowedOrigins.has(origin) ? origin : DEFAULT_ALLOWED_ORIGINS.values().next().value;
}

export function isAllowedApiRequest(request) {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin") || "";
  const referer = request.headers.get("Referer") || "";

  if (origin) {
    return getAllowedOrigin(request) === origin;
  }

  if (referer) {
    try {
      const ref = new URL(referer);
      return ref.host === url.host;
    } catch (error) {
      return false;
    }
  }

  return false;
}

export function corsHeaders(request, methods = "GET, POST, OPTIONS") {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(request),
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Range"
  };
}
