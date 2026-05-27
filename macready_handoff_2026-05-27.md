# MacReady Handoff - 2026-05-27

## Context

Workspace: `/Users/<redacted>/Documents/WebsiteProjects/Macreadygem`

Remote: `git@github.com:Alyx-ML/macosmacready.git`

Current branch: `main`

Dev server: running on `http://127.0.0.1:5173/` with PID `5045` at handoff time.

The user is actively testing in the in-app browser and is frustrated. Keep responses short, plain, and action-first. Do not use the browser unless the user asks; they explicitly said they will test locally.

Project instruction from `AGENTS.md`: no fallbacks should be implemented.

## Current State

There are uncommitted changes. Do not commit unless the user asks.

`git status --short` at handoff:

```text
 M app-live-4.js
 M app-live-4.min.js
 M index.html
 M styles-live.css
 M styles-live.min.css
 M styles.css
 M vite.config.js
?? public/assets/imgs/icons8-apple-intelligence-120.svg
?? public/assets/imgs/icons8-apple-intelligence-30.svg
?? public/assets/imgs/icons8-apple-intelligence-60.svg
?? public/assets/imgs/icons8-apple-intelligence-90.svg
```

`git diff --stat` is large because `app-live-4.min.js` and live CSS files are generated/synced by `bun run build`.

## Most Recent Problem

Window dragging stopped working for all windows after Siri work was added. The user asked to restore the GitHub dragging code.

Actions already taken:

- Fetched `origin/main`.
- Restored `makeWindowDraggable()` in `app-live-4.js` to the `origin/main` implementation.
- Removed extra titlebar CSS previously added for drag attempts.
- Moved the `initAll()` startup block to the end of `app-live-4.js`, after Siri variables/functions are declared. This is likely the real issue because `initAll()` called `initSiriAssistant()` before `let siriActive = false` existed.
- Updated cache keys in `index.html` to `github-drag-2`.
- Ran `bun run build`, which synced:
  - `app-live-4.js` to `app-live-4.min.js`
  - `styles.css` to `styles-live.css` and `styles-live.min.css`

Checks passed:

```text
node --check app-live-4.js
node --check app-live-4.min.js
bun run build
```

The user has not yet confirmed whether dragging works after the `github-drag-2` fix.

## Important Files / Anchors

- `app-live-4.js`
  - `initAll()` definition around line `7572`
  - `makeWindowDraggable()` around line `8791`
  - `let siriActive = false` around line `10570`
  - final `DOMContentLoaded/initAll()` block now around line `11215`
- `index.html`
  - CSS cache key around line `206`
  - JS cache key around line `2552`
- `styles.css`
  - `.window-titlebar` around line `543`

## Earlier Work In This Session

Several feature and UI changes were made before the drag regression:

- RSS/news category refinements:
  - Today renamed to `Today's Overview`.
  - Categories refined for News, Games, Reviews, Apps, and Apple Intelligence.
  - Added/expanded Mac-focused RSS sources.
  - Added filtering to reduce iOS-only and irrelevant deal/slop articles.
  - Added article image hydration for sources with missing thumbnails, though user reported Mac Observer/MacStories/Six Colors image gaps still needed attention.
- Sidebar:
  - Added `Apple Intelligence` category and icon work.
  - User wanted the icon white and sourced from SVGs under `public/assets/imgs`.
- Siri:
  - Added top menu Siri button/HUD.
  - User wanted no `AI Assistant` text and a more compact horizontal window.
  - Mic still cannot truly work in the in-app browser if Web Speech API is unavailable.
- Dragging:
  - Multiple failed attempts were made before restoring GitHub drag code.
  - Do not reintroduce those pointer/global drag rewrites unless there is clear proof they are needed.

## Suggested Skills

- `browser:browser` only if the user explicitly asks for browser testing again.
- `build-web-apps:frontend-testing-debugging` for local frontend regressions.
- `google-code-review` if asked for review.
- `confidence-loop` if asked to verify a fix deeply.
- `handoff` if another continuation handoff is requested.

## Next Recommended Step

Ask the user to hard refresh and confirm whether dragging works with `github-drag-2`. If it still fails, inspect console errors first. The highest-probability failure was early initialization stopping before drag binding, so any remaining problem is likely a runtime error during `initAll()` or stale browser cache.

Avoid broad refactors. Keep changes targeted.
