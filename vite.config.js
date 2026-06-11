import { defineConfig } from "vite";
import fs from "fs";
import path from "path";
import { lookupCrossoverCompatibility } from "./functions/api/crossover-compatibility.js";
import { isAllowedFeedUrl } from "./functions/api/rss-proxy.js";

const PROD_BASE = "/macosmacready/";
const STYLESHEET_VERSION = "asset-paths-3";
const ROOT_STYLESHEET = `<link rel="stylesheet" href="styles.css?v=${STYLESHEET_VERSION}">`;
const BUNDLED_STYLESHEET_RE =
  /<link rel="stylesheet"[^>]*href="[^"]*\/assets\/index-[^"]+\.css"[^>]*>/;

function useRootStylesheet(html) {
  if (!BUNDLED_STYLESHEET_RE.test(html)) return html;
  return html.replace(BUNDLED_STYLESHEET_RE, ROOT_STYLESHEET);
}

/** CSS url() resolves against the stylesheet URL — use absolute paths in production. */
function rewriteProductionCssAssetUrls(css) {
  return css.replace(/url\((['"])assets\//g, `url($1${PROD_BASE}assets/`);
}

function patchProductionIndexHtml(html) {
  let patched = useRootStylesheet(html);
  if (!patched.includes("<base href")) {
    patched = patched.replace("<head>", `<head>\n  <base href="${PROD_BASE}">`);
  }
  patched = patched.replace(
    /<link rel="stylesheet" href="styles\.css\?[^"]+">/,
    `<link rel="stylesheet" href="${PROD_BASE}styles.css?v=${STYLESHEET_VERSION}">`
  );
  return patched;
}

export default defineConfig(({ command }) => ({
  base: command === "serve" ? "/" : "/macosmacready/",
  plugins: [
    {
      name: "macready-root-stylesheet",
      transformIndexHtml: {
        order: "post",
        handler(html) {
          return useRootStylesheet(html);
        }
      }
    },
    {
      name: "macready-copy-public-scripts",
      closeBundle() {
        const distDir = path.resolve(process.cwd(), "dist");
        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }

        const files = [
          "styles.css",
          "desktop-chrome.js",
          "news-reader.js",
          "window-manager.js",
          "siri-assistant.js",
          "app.js"
        ];

        for (const file of files) {
          const sourcePath = path.resolve(process.cwd(), file);
          const destinationPath = path.resolve(distDir, file);
          if (!fs.existsSync(sourcePath)) continue;

          if (file === "styles.css") {
            const css = rewriteProductionCssAssetUrls(fs.readFileSync(sourcePath, "utf-8"));
            fs.writeFileSync(destinationPath, css);
          } else {
            fs.copyFileSync(sourcePath, destinationPath);
          }
          console.log(`Successfully copied ${file} to dist/${file}`);
        }

        const indexPath = path.resolve(distDir, "index.html");
        if (fs.existsSync(indexPath)) {
          const html = patchProductionIndexHtml(fs.readFileSync(indexPath, "utf-8"));
          fs.writeFileSync(indexPath, html);
        }
      }
    },
    {
      name: "macready-rss-proxy",
      configureServer(server) {
        // RSS feed proxy
        server.middlewares.use("/rss", async (req, res) => {
          const requestUrl = new URL(req.url || "", "http://localhost");
          const feedUrl = requestUrl.searchParams.get("url");

          if (!feedUrl || !isAllowedFeedUrl(feedUrl)) {
            res.statusCode = 400;
            res.end("Missing or disallowed RSS URL");
            return;
          }

          try {
            const response = await fetch(feedUrl, {
              headers: {
                "user-agent": "MacReady RSS Reader"
              }
            });

            if (!response.ok) {
              res.statusCode = response.status;
              res.end(`RSS request failed: ${response.status}`);
              return;
            }

            res.setHeader(
              "content-type",
              response.headers.get("content-type") || "text/plain; charset=utf-8"
            );
            res.end(await response.text());
          } catch (error) {
            res.statusCode = 502;
            res.end(error instanceof Error ? error.message : "RSS request failed");
          }
        });

        // Real-disk File Saving endpoint
        server.middlewares.use("/api/rss", async (req, res) => {
          if (req.method !== "GET") {
            res.statusCode = 405;
            res.end("Method Not Allowed");
            return;
          }

          const requestUrl = new URL(req.url || "", "http://localhost");
          const feedUrl = (requestUrl.searchParams.get("url") || "").trim();
          if (!feedUrl || !isAllowedFeedUrl(feedUrl)) {
            res.statusCode = 400;
            res.end("Missing or disallowed RSS URL");
            return;
          }

          try {
            const response = await fetch(feedUrl, {
              headers: { "user-agent": "MacReady RSS Reader" }
            });
            if (!response.ok) {
              res.statusCode = response.status;
              res.end(`RSS request failed: ${response.status}`);
              return;
            }
            res.setHeader("content-type", response.headers.get("content-type") || "text/plain; charset=utf-8");
            res.end(await response.text());
          } catch (error) {
            res.statusCode = 502;
            res.end(error instanceof Error ? error.message : "RSS request failed");
          }
        });

        server.middlewares.use("/api/save-file", async (req, res) => {
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.end("Method Not Allowed");
            return;
          }

          const remote = req.socket?.remoteAddress || "";
          const isLocalRequest = remote === "127.0.0.1" || remote === "::1" || remote === "::ffff:127.0.0.1";
          if (!isLocalRequest) {
            res.statusCode = 403;
            res.end("Access Denied: localhost only.");
            return;
          }

          let body = "";
          req.on("data", chunk => {
            body += chunk;
          });

          req.on("end", () => {
            try {
              const { filename, content } = JSON.parse(body);
              if (!filename || content === undefined) {
                res.statusCode = 400;
                res.end("Missing filename or content");
                return;
              }

              const safeFilename = path.basename(filename);
              const allowedFiles = ["index.html", "styles.css", "app.js", "Project Goals.txt"];
              
              if (!allowedFiles.includes(safeFilename)) {
                res.statusCode = 403;
                res.end("Access Denied: Unallowed filename.");
                return;
              }

              const filePath = path.resolve(process.cwd(), safeFilename);
              fs.writeFileSync(filePath, content, "utf-8");

              res.statusCode = 200;
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify({ success: true, message: `Successfully saved ${safeFilename} to disk!` }));
            } catch (err) {
              res.statusCode = 500;
              res.end(err instanceof Error ? err.message : "Error saving file");
            }
          });
        });

        server.middlewares.use("/api/crossover-compatibility", async (req, res) => {
          if (req.method !== "GET") {
            res.statusCode = 405;
            res.end("Method Not Allowed");
            return;
          }

          const requestUrl = new URL(req.url || "", "http://localhost");
          const title = (requestUrl.searchParams.get("title") || "").trim();

          if (!title) {
            res.statusCode = 400;
            res.setHeader("content-type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ found: false, reason: "missing_title" }));
            return;
          }

          try {
            const result = await lookupCrossoverCompatibility(title);
            res.statusCode = 200;
            res.setHeader("content-type", "application/json; charset=utf-8");
            res.setHeader("cache-control", result.found ? "public, max-age=21600" : "public, max-age=3600");
            res.end(JSON.stringify(result));
          } catch (error) {
            res.statusCode = 502;
            res.setHeader("content-type", "application/json; charset=utf-8");
            res.end(JSON.stringify({
              found: false,
              reason: "lookup_failed",
              message: error instanceof Error ? error.message : "CodeWeavers lookup failed"
            }));
          }
        });
      }
    }
  ]
}));
