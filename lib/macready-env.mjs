/** Host + path helpers shared by browser scripts and vitest. */

export function resolveDataUrl(filename) {
  if (typeof document !== "undefined" && document.baseURI) {
    return new URL(`data/${filename}`, document.baseURI).pathname;
  }
  return `/data/${filename}`;
}

/** Vite serves `public/` at site root — never prefix paths with `public/`. */
export function resolvePublicAssetUrl(path) {
  const normalized = String(path).replace(/^public\//, "");
  if (typeof document !== "undefined" && document.baseURI) {
    return new URL(normalized, document.baseURI).pathname;
  }
  return `/${normalized}`;
}

export function toCssBackgroundUrl(path) {
  return `url('${resolvePublicAssetUrl(path)}')`;
}

/** GitHub Pages serves static assets only — Worker APIs live on Cloudflare. */
export function isStaticGithubPagesHost(hostname = "") {
  return hostname.endsWith(".github.io");
}

export function hostCapabilities(hostname = typeof location !== "undefined" ? location.hostname : "") {
  const staticOnly = isStaticGithubPagesHost(hostname);
  return {
    staticOnly,
    rssProxy: !staticOnly,
    crossoverLive: !staticOnly,
    siri: !staticOnly,
    transcribe: !staticOnly
  };
}

export function installMacreadyEnv() {
  if (typeof window === "undefined") return;
  window.macreadyResolveDataUrl = resolveDataUrl;
  window.macreadyResolveAssetUrl = resolvePublicAssetUrl;
  window.macreadyCssUrl = toCssBackgroundUrl;
  window.macreadyHostCapabilities = () => hostCapabilities(window.location.hostname);
  window.macreadyHasWorkerApis = () => !hostCapabilities(window.location.hostname).staticOnly;
}
