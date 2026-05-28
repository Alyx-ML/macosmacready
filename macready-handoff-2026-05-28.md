# MacReady Handoff - 2026-05-28

## Project

- Repository: `Alyx-ML/macosmacready`
- Local workspace: `~/Documents/WebsiteProjects/Macreadygem`
- Main public site: `https://alyx-ml.github.io/macosmacready/`
- Hidden Siri API endpoint: Cloudflare Worker `/api/siri`
- Branch: `main`

## Current Git State

- Latest pushed commit: `9b4d1f2 Fix Siri popover fade positioning`
- Recent relevant commits:
  - `9b4d1f2 Fix Siri popover fade positioning`
  - `df42972 Update generated news data`
  - `daa1594 Update generated news data`
  - `9384955 Remove Siri blur card`
  - `d976279 Limit Siri blur to popover area`
  - `ec2f5b6 Refine Siri popover focus`
  - `d3c15a6 Route Siri questions to AI`
  - `1e73259 Make Siri a focused menu popover`
- Working tree note: there is one untracked folder, `macready-ad/`. It was intentionally left alone.

## User Preferences And Constraints

- Keep responses plain and direct.
- Avoid unnecessary technical jargon.
- Do not add fallbacks. The project instruction explicitly says fallbacks are forbidden.
- User prefers fast, visible fixes and often tests manually in the browser.
- The user wants changes pushed to GitHub when requested.
- Use `apply_patch` for manual edits.
- Do not use the in-app browser if the user explicitly says they will test.

## Recent Work Completed

- Siri now uses the Cloudflare Worker AI endpoint and can answer plain user questions, including text and voice submissions.
- Siri should be a menu-bar popover opened from the Siri icon.
- Siri should close when the user clicks outside the box.
- Siri traffic lights were removed.
- A previous blur/glass card behind Siri was removed after the user objected.
- The latest Siri popover change removed movement from the popover animation:
  - `#siri-hud` now uses fixed `left` positioning.
  - `right` is forced to `auto`.
  - `transform` is forced to `none`.
  - transition is opacity/visibility only.
  - cache version is `siri-fade-only-11`.
- Latest build and syntax checks passed before push:
  - `bun run build`
  - `node --check app-live-4.js`

## Important Files

- `index.html`
  - Siri markup and cache-busted script/CSS references.
- `styles.css`
  - Main styles.
  - Siri section starts around `#siri-focus-backdrop` / `#siri-hud`.
- `styles-live.css`
- `styles-live.min.css`
  - Generated from `styles.css` by `bun run build`.
- `app-live-4.js`
  - Main app logic.
  - Siri logic starts around `initSiriAssistant()`.
  - `positionSiriHud()` controls Siri popover placement.
- `app-live-4.min.js`
  - Generated/synced from `app-live-4.js` by build.
- `functions/api/siri.js`
  - Cloudflare Worker AI route.

## Current User Concern

The most recent issue before this handoff was Siri appearing with a snap from the left before landing under the Siri icon. The latest pushed commit attempted to fix this by removing movement entirely and using fade-only positioning. The user may still need to test this on GitHub Pages after deployment cache clears.

If the user still sees the left snap:

- First confirm the served page is using `siri-fade-only-11`.
- Inspect the live CSS for `#siri-hud` and verify:
  - `right: auto !important`
  - `left` is set inline by JavaScript
  - `transform: none !important`
  - `transition: opacity 0.24s ease, visibility 0.24s ease`
- Check whether GitHub Pages is serving stale `styles-live.min.css` or `app-live-4.min.js`.
- Do not reintroduce blur panels, large glass cards, or scale/translate animation.

## Deployment Notes

- The user wants the public site to stay on GitHub Pages.
- Cloudflare is being used for the Worker API, not as the main visible site.
- A previous Cloudflare Pages deployment failed because Wrangler auto-config required Vite 6+, but the project uses Vite 5.4.21. This is not relevant if the user continues using GitHub Pages for the static site and Cloudflare Worker only for Siri API.

## News/RSS Context

- There is a generated news JSON pipeline in the repo.
- Recent news commits updated generated data.
- User wants:
  - Today / Today's Overview focused on Mac news, not iOS-first stories.
  - Games category for general latest games, not Mac-only gaming.
  - Reviews category for Mac reviews.
  - Apps category for latest macOS apps, not the App Store itself.
  - Apple Intelligence category with a white icon.
- User repeatedly objected to missing article images from Six Colors, MacStories, and The Mac Observer, and to iOS-focused headlines appearing in Today.

## Suggested Skills

- `handoff`: if another summary is needed later.
- `diagnose`: for hard UI bugs such as animation flashes or drag regressions.
- `confidence-loop`: before pushing fixes that the user is likely to inspect visually.
- `frontend-design`: only for visual polish tasks, with care not to alter requested behavior.
- `github:yeet`: when the user asks to commit and push.

## Suggested Next Steps

1. If the user reports Siri still snapping, verify the live GitHub Pages assets first.
2. If the live assets are current, remove any remaining class or global CSS that can affect `#siri-hud`.
3. Keep Siri fade-only unless the user explicitly asks for movement.
4. Preserve the current public-site plus Cloudflare-worker setup.
5. Leave `macready-ad/` untouched unless the user explains what it is for.
