import { defineConfig } from "vite";
import fs from "fs";
import path from "path";

export default defineConfig({
  plugins: [
    {
      name: "macready-sync-assets",
      buildStart() {
        const srcPath = path.resolve(process.cwd(), "app-live-4.js");
        const destPath = path.resolve(process.cwd(), "app-live-4.min.js");
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
          console.log("Successfully synchronized app-live-4.js to app-live-4.min.js");
        }
        const cssSrc = path.resolve(process.cwd(), "styles.css");
        const cssLive = path.resolve(process.cwd(), "styles-live.css");
        const cssLiveMin = path.resolve(process.cwd(), "styles-live.min.css");
        if (fs.existsSync(cssSrc)) {
          fs.copyFileSync(cssSrc, cssLive);
          fs.copyFileSync(cssSrc, cssLiveMin);
          console.log("Successfully synchronized styles.css to styles-live.css and styles-live.min.css");
        }
      },
      closeBundle() {
        const minSrcPath = path.resolve(process.cwd(), "app-live-4.min.js");
        const minDestPath = path.resolve(process.cwd(), "dist/app-live-4.min.js");
        if (fs.existsSync(minSrcPath)) {
          const distDir = path.resolve(process.cwd(), "dist");
          if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir, { recursive: true });
          }
          fs.copyFileSync(minSrcPath, minDestPath);
          console.log("Successfully copied app-live-4.min.js to dist/app-live-4.min.js!");
        }
        const srcPath = path.resolve(process.cwd(), "app-live-4.js");
        const destPath = path.resolve(process.cwd(), "dist/app-live-4.js");
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
          console.log("Successfully copied app-live-4.js to dist/app-live-4.js!");
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

          if (!feedUrl) {
            res.statusCode = 400;
            res.end("Missing RSS URL");
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
        server.middlewares.use("/api/save-file", async (req, res) => {
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.end("Method Not Allowed");
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
      }
    }
  ]
});
