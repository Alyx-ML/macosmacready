/** Host + path helpers shared by browser scripts and vitest. */

export function resolveDataUrl(filename) {
  if (typeof document !== "undefined" && document.baseURI) {
    return new URL(`data/${filename}`, document.baseURI).pathname;
  }
  return `/data/${filename}`;
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
  window.macreadyHostCapabilities = () => hostCapabilities(window.location.hostname);
  window.macreadyHasWorkerApis = () => !hostCapabilities(window.location.hostname).staticOnly;
}
