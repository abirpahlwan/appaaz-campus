# appaaz; Campus

A walkable, solarpunk 3D campus for appaaz; - explore our work, services
and team. Vite + TypeScript + three.js. Desktop first, 3D only, with a plain
text version as the fallback.

- Plan, decisions and progress log: [APPAAZ_CAMPUS_PLAN.md](APPAAZ_CAMPUS_PLAN.md)
- Assets and licences: [ASSETS.md](ASSETS.md)
- Everything from the old portfolio project lives in `legacy/` (reference only).

## Run

```
npm install
npm run dev        # dev server
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
```

The page must be served over HTTP (models are fetched at runtime), which the
dev server does.

## Layout

```
index.html           markup for the intro, HUD and modal
public/assets/       models, sprites, matte painting (served as /assets/...)
src/
  main.ts            imports the modules in dependency order
  content/content.ts every readable panel (project, service, team, contact text)
  core/              shared state, audio, util, update loop
  world/             map, terrain, water, objects, collision, chatter
  entities/          player and critters
  render/            three.js scene, loop, geometry helpers, sky
  assets/            model catalogue and loaders
  ui/                modal, HUD and controls, minimap, text version
legacy/              old portfolio project (moved, not deleted)
```

## Status

The ported modules still carry `// @ts-nocheck` and share state through `$S`
and forward references through `$R` (`src/core/state.ts`). They are being
cleaned into typed modules; see the progress log in the plan.

## Controls

WASD / arrows to move, E to inspect, hold Space (or Z) for the jetpack and add
Shift to descend, M for the text version.
