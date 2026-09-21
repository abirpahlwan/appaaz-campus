# portfolio
A playable, procedural pixel-art portfolio: walk through a village and a
growing world where buildings, landscapes, animals, and journeys represent
Pahlwan's work.

## Run locally

The project is intentionally self-contained. Serve the repository over HTTP
from its root, then open `http://localhost:8000/`:

```powershell
python -m http.server 8000
```

No build step, package installation, external assets, or network API is
required.

## Controls and interactions

- Move with **WASD** or **arrow keys**.
- Use **E**, **Space**, or **Enter** near a building, landmark, or animal.
- Use **M** to switch to the classic/plain reading view.
- On coarse-pointer devices, use the on-screen stick and **LOOK** action.
- Audio is off until **Start exploring** is pressed; use **♪ on/off** and the
  **VOL** slider for procedural feedback and quiet biome motifs. The audio
  layer uses only Web Audio API tones/noise generated in the page.
- Explore animals to pet them; friendly rideable animals can be mounted and
  dismounted through the contextual interaction prompt.
- The modal panels retain the portfolio content and provide the plain-version
  fallback for reading, copying, and sharing.

## Project surfaces

- `index.html` — village/world, procedural Canvas 2D art, UI, controls, and
  persistence.
- `blog/` — blog reading surface and shared typography.
- `play/` — arcade listing, wrappers, and four standalone playable canvases.
- `PLAN.md`, `AGENT.md`, `TASKS.md` — living implementation and handoff docs.

## Workflow and status

Work is merged onto `main`. Static syntax and HTTP smoke checks pass for the
complete portfolio and game surface. Manual browser/device interaction and
performance profiling remain release follow-ups; deployment is out of scope.

The newest visual pass adds stronger biome separation and more polished
mountain, dam, garden, railway, aircraft, and rocket silhouettes while keeping
the procedural, accessible, performance-bounded architecture intact.

The mountain region also includes an optional switchback ascent, a tiered
snow-and-alpenglow summit with flag, ambient wind motes, Pipkin the snow hare,
and small telescope/bell interactions. These are playful, non-progression
features and do not alter discovery totals or existing save/control contracts.

The currently accepted mountain milestone is Level 3 trail readability plus
Level 4's compact alpine meadow and meltwater detail, now joined by Level 5's
compact rope-bridge crossing over the meadow route. Its entry and exit tiles
remain walkable in both directions and its feedback is contextual only; it
does not affect progression, discoveries, saves, or controls. Levels 6-10
remain unstarted milestones.

Milestone commits for this stage are `0b19bdb` (Levels 3-4) and `1969de5`
(Level 5), with small visual polish in `8b4b02f` and `bdf9473`.

The audio pass adds gesture-gated one-shots for world, animal, summit,
transport, success/failure, and UI interactions, plus deterministic,
low-volume biome motifs. It pauses on hidden tabs, respects reduced motion,
and cleans up on unload. Browser/device playtesting and frame profiling remain
release follow-ups.
