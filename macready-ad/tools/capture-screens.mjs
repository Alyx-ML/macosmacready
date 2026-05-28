import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as wait } from "node:timers/promises";

const browserPath = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
const port = 9333;
const siteUrl = "http://127.0.0.1:5173/";
const outDir = new URL("../assets/screens/", import.meta.url);

await mkdir(outDir, { recursive: true });

const browser = spawn(browserPath, [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  "--user-data-dir=/private/tmp/macready-ad-capture-profile",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-background-networking",
  "about:blank"
], {
  stdio: ["ignore", "ignore", "pipe"]
});

browser.stderr.on("data", data => {
  const text = data.toString();
  if (text.includes("DevTools listening")) return;
  if (text.includes("Created TensorFlow Lite")) return;
  process.stderr.write(text);
});

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${url}`);
  return response.json();
}

async function devtoolsVersion() {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      return await fetchJson(`http://127.0.0.1:${port}/json/version`);
    } catch {
      await wait(100);
    }
  }
  throw new Error("Brave DevTools did not start.");
}

const version = await devtoolsVersion();
const ws = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});

let nextId = 1;
const pending = new Map();
const events = [];

ws.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result || {});
    return;
  }
  events.push(message);
});

function send(method, params = {}, sessionId) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params, sessionId }));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
  });
}

async function pageEval(expression) {
  return send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  }, sessionId);
}

const target = await send("Target.createTarget", { url: "about:blank" });
const attach = await send("Target.attachToTarget", {
  targetId: target.targetId,
  flatten: true
});
const sessionId = attach.sessionId;

await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);
await send("Emulation.setDeviceMetricsOverride", {
  width: 1920,
  height: 1080,
  deviceScaleFactor: 1,
  mobile: false
}, sessionId);
await send("Page.navigate", { url: siteUrl }, sessionId);
await pageEval(`new Promise(resolve => {
  const done = () => setTimeout(resolve, 2800);
  if (document.readyState === "complete") done();
  else window.addEventListener("load", done, { once: true });
})`);

async function screenshot(name, setup, settleMs = 1400) {
  await pageEval(setup);
  await wait(settleMs);
  const shot = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false
  }, sessionId);
  await writeFile(new URL(`${name}.png`, outDir), Buffer.from(shot.data, "base64"));
  console.log(`${name}.png`);
}

await screenshot("01-overview", `
  window.closeSiriHud?.();
  window.switchApp("news");
  document.getElementById("settings-window")?.classList.add("hidden-window");
  document.getElementById("account-window")?.classList.add("hidden-window");
`);

await screenshot("02-games", `
  window.closeSiriHud?.();
  window.switchApp("games");
`, 2200);

await screenshot("03-app-store", `
  window.closeSiriHud?.();
  window.switchApp("app-store");
`, 2200);

await screenshot("04-wallpaper", `
  window.closeSiriHud?.();
  window.switchApp("news");
  window.openSettingsTab("wallpaper");
`, 1300);

await screenshot("05-assistant", `
  document.getElementById("settings-window")?.classList.add("hidden-window");
  window.switchApp("news");
  window.openSiriHud();
`, 1300);

await send("Browser.close");
browser.kill();
