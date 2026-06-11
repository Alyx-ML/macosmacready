# MacReady — agent guide

## Architecture

- `index.html` — shell markup for all desktop apps/windows
- `lib/macready-bootstrap.mjs` — installs env helpers, news filters, games-media matchers on `window`
- `lib/news-filters.mjs` — canonical news/deal filter rules (mirrored in Rust builder)
- `lib/games-media.mjs` — YouTube ↔ Steam title matching (pure functions)
- `lib/macready-env.mjs` — data URL resolution + host capability detection
- `desktop-chrome.js` — Control Center, segment switcher
- `app.js` — main client logic (games, store, finder, settings)
- `news-reader.js` — feed rendering, bookmarks, reader overlay
- `window-manager.js` — draggable/resizable windows
- `siri-assistant.js` — Siri HUD and `/api/siri` + `/api/transcribe`
- `worker.js` — Cloudflare Worker entry; serves `dist/` and API routes
- `functions/api/` — Worker handlers (siri, transcribe, crossover, rss)
- `tools/news_builder/` — Rust RSS/HTML pipeline → `public/data/news.generated.json`
- `scripts/generate-games-data.mjs` — Steam + CrossOver data → `public/data/games.generated.js`

## Deploy targets

| Host | Build | APIs (`/api/*`) | News/games data |
|------|-------|-----------------|-----------------|
| `npm run dev` | none (Vite serve) | Vite middleware | `/data/...` |
| GitHub Pages | `npm run build` → `dist/` via `deploy-pages.yml` | **Not available** (static) | `/macosmacready/data/...` |
| Cloudflare Workers | `npm run build` + `wrangler deploy` | Worker routes | `/data/...` |

GitHub Pages uses Vite `base: /macosmacready/`. Do not add hostname-specific path hacks — use `document.baseURI` / `macreadyResolveDataUrl()`.

On static hosts, live RSS refresh and CrossOver live lookup are skipped; generated JSON/JS is authoritative.

## Data flow

1. News: Rust builder filters/balances feeds → generated JSON → client loads `data/news.generated.json`
2. Games: generator script embeds Steam catalog + CrossOver ratings → client seeds from `data/games.generated.js`
3. CrossOver live lookup: `/api/crossover-compatibility?title=...` (Worker + Vite dev middleware only)

## Do not hand-edit

- `public/data/news.generated.json`
- `public/data/games.generated.js`

Regenerate with `npm run news:update` and `npm run games:update`.

## Verification

```bash
npm run verify
```

## Do not fabricate

Never invent version numbers, release dates, changelog bullets, blog posts, SDK entries, or other factual content. Use only verifiable sources (official changelogs, RSS feeds, generated data files). If data is unavailable, omit it, link out, or ask — do not fill gaps with made-up detail.

## Conventions

- Script load order: `lib/macready-bootstrap.mjs` (module) → `desktop-chrome.js` → `news-reader.js` → `window-manager.js` → `siri-assistant.js` → `app.js`
- Shared globals (`articles`, `enabledNewsSources`, etc.) live in `app.js`
- News filter functions live in `lib/news-filters.mjs` — tests import this module directly
- Use `escapeHTML()` for any user/content interpolation into HTML templates
- Asset paths use Vite `public/` root: `data/...` resolved via `document.baseURI`
