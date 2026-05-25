const ASSETS = {
  runtime: "./assets/runtime.js",
  wasm: "./assets/sheepshaver.wasm",
  rom: "./assets/MacOS9.rom",
  disk: "./assets/MacOS9.dsk"
};

const status = document.getElementById("macos9-status");
const statusText = document.getElementById("macos9-status-text");
const canvas = document.getElementById("macos9-screen");

function setStatus(message) {
  if (statusText) statusText.textContent = message;
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  await navigator.serviceWorker.register("./sw.js", { scope: "./" });
}

async function requireAsset(label, url) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Range: "bytes=0-63"
    }
  });
  if (!response.ok) {
    throw new Error(`${label} is missing at ${url}`);
  }
  const contentType = response.headers.get("content-type") || "";
  const sample = await response.text();
  if (contentType.includes("text/html") || sample.trimStart().startsWith("<!DOCTYPE") || sample.trimStart().startsWith("<html")) {
    throw new Error(`${label} is not installed at ${url}`);
  }
}

async function requireLocalAssets() {
  await Promise.all([
    requireAsset("Runtime", ASSETS.runtime),
    requireAsset("WebAssembly module", ASSETS.wasm),
    requireAsset("Mac OS ROM", ASSETS.rom),
    requireAsset("Mac OS 9 disk", ASSETS.disk)
  ]);
}

async function bootMacOS9() {
  setStatus("Registering offline support.");
  await registerServiceWorker();

  setStatus("Checking local Mac OS 9 files.");
  await requireLocalAssets();

  setStatus("Starting Mac OS 9.");
  const runtimeModule = await import(ASSETS.runtime);
  const boot = runtimeModule.bootMacOS9 || window.MacOS9Runtime?.boot;

  if (typeof boot !== "function") {
    throw new Error("runtime.js must export bootMacOS9 or set window.MacOS9Runtime.boot.");
  }

  await boot({
    canvas,
    assets: ASSETS,
    onStatus: setStatus
  });

  if (status) status.classList.add("is-hidden");
}

bootMacOS9().catch(error => {
  console.error(error);
  setStatus(error.message);
});
