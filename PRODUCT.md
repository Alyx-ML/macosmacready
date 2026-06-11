# Product

## Register

product

## Users

Mac enthusiasts, Mac gamers, and Apple-news followers using a desktop browser. They come to read curated Mac news, check Mac game compatibility (CrossOver / native), discover apps, and play with a faithful macOS-style desktop. They know real macOS intimately, so any visual drift from Apple's language reads as a defect.

## Product Purpose

MacReady is a macOS 27 "Golden Gate"-styled web desktop: news reader, Mac games library with compatibility data, app discovery, Siri assistant, and desktop utilities. Success means the interface is indistinguishable in feel from native macOS while staying fast in a browser.

## Brand Personality

Authentic, polished, playful-but-precise. The interface should evoke the calm confidence of Apple's own software: restrained color, deep typography hierarchy, materials that respond to light and pointer. Delight comes from fidelity, not decoration.

## Anti-references

- Generic "glassmorphism dashboards": blur-everywhere translucent cards with no optical behavior.
- Cheap macOS clones with wrong fonts (rounded display webfonts), oversized radii, and neon glows.
- Heavy serif editorial styling in UI chrome (previously rejected by the owner).
- Double borders, floating unanchored links, decorative dividers.

## Design Principles

1. **Glass is a control material, not a theme.** Liquid Glass lives on the menu bar, dock, toolbars, window chrome, HUDs, and overlays. Content surfaces stay clean and readable.
2. **Earned familiarity.** Every affordance (traffic lights, menus, dock magnification) behaves the way a Mac user's muscle memory expects.
3. **Materials respond.** Glass reacts to pointer, press, and underlying content. Static translucency is a failure state.
4. **Type is system type.** Apple system stack first (SF on Apple hardware), Inter as the webfont fallback elsewhere. One family, weight-driven hierarchy.
5. **Rich but disciplined motion.** Exponential ease-out, 150–420 ms, state-driven. Visual richness is allowed to cost a little, jank from layout-thrash is not.

## Accessibility & Inclusion

- Honor `prefers-reduced-motion` (crossfade instead of movement), reduce-transparency and increase-contrast modes (already present as body classes).
- Text on glass must remain ≥4.5:1 via adaptive scrims, not blur intensity.
- All interactive controls keep visible focus states.
