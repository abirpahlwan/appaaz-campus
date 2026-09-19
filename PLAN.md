# Portfolio RPG world expansion plan

## Goal

Grow the self-contained pixel-art portfolio into a welcoming, dreamy world that
uses fields, mountains, desert, water, gardens, buildings, animals, and
transport landmarks to represent Pahlwan's work without changing the portfolio
content or removing the plain reading experience.

## Scope and architecture

- Keep the existing single-file HTML/CSS/Canvas architecture and procedural art;
  do not add network requests, binary art dependencies, or a build pipeline.
- Add world regions and landmarks additively, with stable IDs and versioned
  localStorage state.
- Keep movement, keyboard controls, touch controls, modal content, discovery,
  arcade links, and classic/plain mode compatible.
- Use a contextual interaction resolver for petting, riding, environmental
  landmarks, and existing portfolio panels.
- Render glass, fog, water, and atmosphere with bounded CSS/canvas work, safe
  fallbacks, and reduced-motion behavior.

## Phases

1. **World and interactions** — expand terrain and procedural landmarks; add
   deterministic animal placement, petting, affinity, safe riding/dismount,
   environmental interactions, and versioned persistence.
2. **Accessibility and resilience** — preserve E/Space, WASD/arrows, LOOK and
   touch parity; make sequences skippable, pausable, focus-safe, and
   reduced-motion aware; validate classic mode and save migration.
3. **Dreamy visual treatment** — apply liquid-glass UI tokens, fog and soft
   atmosphere to the village, blog/arcade shells, and the four game canvases
   without changing simulation rules.
4. **Validation and handoff** — run syntax, diff, accessibility, responsive,
   performance, and interaction checks; update living documentation; commit
   source and docs together only after validation.

## Decisions and risks

- Existing content IDs and discovery totals are compatibility-sensitive; new
  landmarks must not silently redefine the classic content contract.
- Procedural generation must be deterministic enough for stable reloads while
  keeping animation lightweight.
- Canvas effects are capped by viewport/device pixel ratio; CSS blur always has
  a solid/translucent fallback.
- Transport sequences are short, interruptible, and optional so they cannot
  trap keyboard, touch, or reduced-motion users.
- Save data is migrated defensively and never treated as trusted input.

## Current status

World expansion, animal interactions, accessibility safeguards, and the
liquid-glass treatment are implemented on the feature branch. All inline
scripts pass syntax validation and every portfolio/game route responds over
HTTP. Manual browser/device playtesting and frame profiling remain the main
limitations. No deployment is part of this change.

## Audio pass

The audio layer remains self-contained in `index.html`: a gesture-unlocked
Web Audio manager owns the shared context, master mute/volume preference,
short procedural one-shots, and a single low-volume biome motif scheduler.
Audio is paused when the page is hidden, kept quiet under reduced motion, and
disposed on page unload. Building/landmark, animal, summit-feature,
transport/environment, success/failure, and UI interactions route through
named sounds; no external or copyrighted audio assets are introduced. The
existing save schema and interaction IDs remain unchanged.

The latest aesthetic checkpoint deepens biome-specific palettes and landmark
silhouettes while preserving mechanics, stable entity names/IDs, and rendering
guards. OpenCode Zen/Claude Sonnet was unavailable; the available free OpenCode
model was attempted interactively, then the bounded visual patch was completed
locally after the free model stalled.

The audio pass is implemented and validated with inline syntax checks,
whitespace checks, and HTTP route smoke tests. Manual browser/device listening
and frame profiling remain release follow-ups.

## Mountain exploration brainstorm

The next bounded slice keeps the mountain as an optional playground rather than
a progression gate:

- Carve a short, clearly walkable switchback/stepping-stone route through the
  existing mountain area, using the current `PATH` collision rules.
- Give the existing `mountain` landmark a tiered silhouette, snow cap,
  rose-gold alpenglow, and a tiny summit flag.
- Add a handful of deterministic, low-cost wind/snow motes near the summit;
  they remain ambient and never alter player control.
- Add a named `Pipkin` snow-hare cameo plus telescope and summit-bell feature
  prompts. Their feedback is a toast/chime and whimsical constellation text,
  not a new discovery item or progression requirement.

Implementation is intentionally limited to `index.html` terrain/render/near
interaction seams. Existing content and building IDs, animal IDs/names,
controls, save shape, discovery totals, minimap, plain mode, accessibility
behavior, and performance caps remain unchanged. Validate syntax, diff
whitespace, all routes, and the local preview before committing.

## Mountain levels 3-5 status

The accepted Level 3-4 slice layers clearer alpine trail readability and snow
banks, plus one compact meadow pocket with alpine flowers and a small
meltwater glint. Level 5 accepts one compact rope-bridge crossing with forced
walkable approach/exit tiles and contextual feedback. These milestones do not
change discovery totals, progression, saves, controls, or transport behavior.

The rope bridge, wildlife, overlook, balloon, camp, and broader summit
features beyond this accepted crossing remain exploratory work and must not be
claimed as completed levels.

Relevant commits:

- `0b19bdb` — establishes accepted Levels 3-4 tracking and terrain slice.
- `1969de5` — establishes accepted Level 5 crossing and milestone docs.
- `8b4b02f` / `bdf9473` — small snow, camp-light, and overlook polish commits.

The separate **Audio FX and BGM** child session completed its handoff on branch
`abirpahlwan-audio-fx-bgm`. Its work is not merged into this art branch; any
audio integration remains a separate follow-up.
