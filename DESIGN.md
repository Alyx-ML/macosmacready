# Design

macOS 27 "Golden Gate" web desktop. Design serves the product (register: product); fidelity to Apple's design language is the brand.

## Theme

Dark-first desktop over photographic wallpapers, with a full light mode (`body.light-mode`). Accent themes are user-selectable (`.theme-*` classes set `--accent-color`).

## Materials

Two materials, never mixed:

1. **Liquid Glass (control layer only)** — menu bar, dock, dropdown menus, Spotlight, Siri HUD, floating widgets.
   - Background sampling: `backdrop-filter: blur(22px) saturate(190%) brightness(1.05)`
   - Edge lensing: SVG displacement filter `#gg-lens` via `backdrop-filter: url(#gg-lens)` (Chromium; blur fallback elsewhere)
   - Pointer specular: radial gradient tracking `--spec-x` / `--spec-y` (set by `initLiquidGlassSpecular` in `app.js`, rAF-throttled, disabled under reduced motion)
   - Press response: `scale(0.96)` + brightness on `:active`
   - Readability floors: text-bearing glass (menus, widgets, Siri) uses denser fills (0.58–0.68 alpha) than ambient chrome (0.42)
   - **No rim lights or inset edge highlights.** Edges are defined by refraction and drop shadow only; borders stay at ≤0.06 alpha. Painted white lines on glass are a banned pattern in this project.
2. **Window material** — app windows, modals: one continuous Liquid Glass shell. `rgba(16,18,28,0.38)` fill + `backdrop-filter: url(#gg-lens-window) blur(26px) saturate(200%)` (low-frequency displacement bends the wallpaper through the glass; Safari falls back to blur+saturate). Titlebar and sidebar are **fully transparent** regions of that same surface: no tint, no divider, no second blur. Inner elements (cards, fields) are borderless white tints pressed into the glass. Nested `.liquid-glass` panels flatten to tints with **no** backdrop-filter.

## Color

- Tokens in `:root` of `styles.css`. Accent via `--accent-color` (+ `-rgb`, `-glow`, `-gradient` variants).
- Accent is for primary actions, selection, and state. Never decoration.
- Category colors: `--cat-tech/design/science/culture`.

## Typography

- `--font-ui` / `--font-title`: Apple system stack first (`-apple-system`, SF Pro on Apple hardware), **Inter** webfont fallback for other platforms. `--font-mono`: SF Mono stack. `--font-editorial`: Lora, used only by the reader's paper theme.
- Weight-driven hierarchy in one family. Display sizes get `letter-spacing: -0.02em`. `text-wrap: balance` on h1–h3.

## Motion

- Tokens: `--ease-out` (quint), `--ease-out-expo`, `--ease-spring`; `--dur-fast` 150ms, `--dur-med` 240ms, `--dur-slow` 420ms.
- Transform + opacity only for movement; never animate layout or filters.
- Windows: 420ms expo ease-out open/close. Menus: 240ms.
- `prefers-reduced-motion`: global override collapses all animation/transition durations.

## Layout

- Desktop metaphor: menu bar (top, capsule), dock (bottom, glass), draggable windows, overlay modals.
- Concentric radii: dock 22, widgets 20, spotlight card 18, menus 12.

## Accessibility

- `body.reduce-transparency` and `body.increase-contrast` modes exist; keep them working when touching materials.
- Text on glass ≥4.5:1 via denser fills, not blur.
- `:focus-visible` outline in accent color on all interactive controls.
