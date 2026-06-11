# MacReady — agent guide

## Architecture

- `index.html` — shell markup for all desktop apps/windows
- `app.js` — main client logic (news helpers, games, store, finder, settings)
- `news-reader.js` — feed rendering, bookmarks, reader overlay
- `window-manager.js` — draggable/resizable windows
- `siri-assistant.js` — Siri HUD and `/api/siri` + `/api/transcribe`
- `worker.js` — Cloudflare Worker entry; serves `dist/` and API routes
- `functions/api/` — Worker handlers (siri, transcribe, crossover, rss)
- `tools/news_builder/` — Rust RSS/HTML pipeline → `public/data/news.generated.json`
- `scripts/generate-games-data.mjs` — Steam + CrossOver data → `public/data/games.generated.js`

## Data flow

1. News: Rust builder filters/balances feeds → generated JSON → client loads `/data/news.generated.json`
2. Games: generator script embeds Steam catalog + CrossOver ratings → client seeds from `/data/games.generated.js`
3. CrossOver live lookup: `/api/crossover-compatibility?title=...` (Worker + Vite dev middleware)

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

- Vanilla JS with script-tag load order: `news-reader.js` → `window-manager.js` → `siri-assistant.js` → `app.js`
- Shared globals (`articles`, `enabledNewsSources`, etc.) live in `app.js`
- Use `escapeHTML()` for any user/content interpolation into HTML templates
- Asset paths use Vite `public/` root: `/data/...`, not `/public/data/...`
