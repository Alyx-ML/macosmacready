# MacReady

MacReady is a macOS Tahoe–styled web desktop for Apple news, Mac games, app discovery, reviews, and desktop utilities.

## Requirements

- Node.js 20+
- Rust/Cargo (news builder)
- Wrangler CLI (installed via `npm ci` for deploy)

## Quick start

```bash
npm ci
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server with local API middleware |
| `npm run build` | Build static site into `dist/` |
| `npm run preview` | Preview production build |
| `npm run news:update` | Regenerate `public/data/news.generated.json` |
| `npm run games:update` | Regenerate `public/data/games.generated.js` |
| `npm run test` | Run JS unit tests |
| `npm run verify` | Tests + Rust tests + production build |

## Generated data

- `public/data/news.generated.json` — built by the Rust news builder
- `public/data/games.generated.js` — built by `scripts/generate-games-data.mjs`

Both are served at `/data/...` in dev and production.

## Deploy

```bash
npm run build
npx wrangler deploy
```

`wrangler.toml` expects:

- static assets from `dist/`
- Workers AI binding named `AI` for Siri and voice transcription

## Mac OS 9 classic mode

The dock includes a Mac OS 9 emulator at `/classic/mac-os-9/`. Licensed ROM/disk assets are **not** shipped. See `public/classic/mac-os-9/assets/README.md` for required files.

## Environment variables

See `.env.example`.
