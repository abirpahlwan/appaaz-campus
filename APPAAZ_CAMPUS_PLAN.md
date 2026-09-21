# appaaz; Campus - plan

Status: planning only. No code has been changed for this plan.
Written: 2026-09-19. Starting point: the CTO's personal 3D/2D portfolio
(see README.md, PLAN.md, SOLARPUNK_PLAN.md, ASSETS.md - those describe the old
project and are left untouched for now).

## 1. Goals

- A fun, interactable, immersive 3D tech park that shows clients Appaaz's
  technical prowess, supports lead generation and brand awareness, and carries
  ad slots.
- Highest priority: graphics and UX, aiming for a high-end stylized look.
- Desktop first. 3D only.
- Ad slots start with Appaaz's own services, client showcases and partners.
  No outside ad networks.

Non-goals (removed from the codebase): 2D world, arcade (`play/`), blog
(`blog/`), classic/plain view, personal portfolio content, analytics stubs.

## 2. Decisions

| Topic | Status |
|---|---|
| 3D only, desktop first | Decided |
| Visual references: Breath of the Wild, Pokemon Winds & Waves (style inspiration only, no Nintendo/Pokemon assets) | Decided |
| Assets: free/CC0 + AI-generated models for now | Decided |
| Ad slots: own services, client showcases, partners first | Decided |
| Tooling: Vite + TypeScript + three.js (WebGPU renderer, automatic WebGL 2 fallback) | Decided |
| Minimal text/contact fallback for no-WebGL or screen-reader visitors | Decided |
| Case studies: the six projects already public on the Appaaz site (see section 4b) | Decided |
| Project name: "appaaz; Campus" (renamed from "appaaz; Tech Park") | Decided |
| 60 fps target on a recent integrated-GPU laptop | Decided |

## 3. Art direction (style bible v0)

Target: soft, painterly, wind-swept, glittering - not photoreal.

- **Shading:** 2-3 step soft toon ramp, warm highlights and cool violet
  shadows (hue-shifted), painted-looking low-frequency colour variation.
  Thin outlines only on characters and hero props (depth/normal edge pass or
  inverted hull); none on environment.
- **Light and atmosphere:** stylized gradient sky, soft clouds, sun bloom,
  light shafts, coloured depth fog (far = cooler and lighter), day/night cycle.
- **Wind as a system:** one global wind field drives grass, trees, flags,
  cloth, water ripples and drifting leaves/pollen. Grass bends around the
  player.
- **Water:** GPU shader with gerstner-style waves, sun glitter, depth-based
  foam and refraction (replaces the current per-frame CPU pond shader).
- **Architecture:** solarpunk towers - curved shells, terraces, vertical
  gardens, solar canopies, glass. Generated in code (parametric) for a
  consistent style and tiny downloads.
- **Appaaz brand:** the site's teal light beams and Beacon Amber accent.
  Each zone has a teal beam that turns amber once visited; amber is the
  interaction colour.
- **Palette rule:** shaders remap every asset to the shared palette, so
  differing source textures (especially AI-generated ones) do not matter.

## 4. Zones (blockout on the existing eight tower slots)

| Zone | Represents | Interaction idea |
|---|---|---|
| Gate Plaza | Arrival, who Appaaz is | Concierge NPC: 60-second guided tour or free roam |
| Web & Full-stack Lab | Next.js, Laravel, NestJS, Postgres | Inspectable stack "relics" |
| Mobile Foundry | Cross-platform apps | App-store-style kiosks |
| SaaS Greenhouse | AI and subscription products | Living-greenhouse exhibit |
| Project Gallery | All six site projects together | Central hall with one pavilion per project, deep-linking to each zone |
| Process Pavilion | Scope -> build -> ship | Walkable conveyor: project moves from proposal to delivery |
| Global Hub | Teams in Bangladesh and Germany | Two beacons, sun clock with local times |
| Team Atrium | Founders and engineers | Character plinths |
| Contact Tower | Start a project | Real intake form or mailto |

### 4b. Projects (source: the Appaaz site, `lib/projects-data.ts`)

The site already publishes these six with descriptions, tech, features and
live links, so the park reuses that data (later: import or share it rather
than copy it). Images live in the site's `public/projects/*.webp` and can
become kiosk/billboard textures.

| Project | Category | Home zone |
|---|---|---|
| Noor Hajj BD | web | Web & Full-stack Lab |
| East London Eats | web | Web & Full-stack Lab |
| Penny Rounding Calculator Pro | mobile (iOS + Android) | Mobile Foundry |
| SubRobin | web, AI, data | SaaS Greenhouse |
| propDNA.ai | web, AI | SaaS Greenhouse |
| BILIAI | web (retail commerce, AI) | SaaS Greenhouse |

Each project gets a pavilion with its story, tech stack, features and a
live/app-store link. Only projects listed on the site are included; anything
else needs an explicit decision first.

Keep from the old build: jetpack, sky, ambient audio, animals ("urban farm"),
discovery counter (becomes zones visited). Cut: camera sliders (replace with
mouse orbit + presets), personal jokes, mountain lore.

## 5. Target structure

```
src/
  main.ts
  content/     zones, projects, team, ad slots, copy (typed data)
  core/        loop, input (kb/mouse/gamepad), save, audio, events
  world/       map, heightfield, collision, zone layout
  render/      renderer, materials (toon/TSL), sky, water, foliage, post, camera
  entities/    player + jetpack, animals, NPCs
  ui/          hud, panels, prompt, toast, minimap, intro
  assets/      manifest + loader (GLB, KTX2)
public/
  models/ textures/ audio/
```

## 6. Phases and acceptance checks

**Phase 0 - baseline fixes (old code, before moving it)**
- Jetpack input: code reads `z`, docs/toast/FLY button say Space/FLY. Pick one
  scheme and make code, toast and help agree.
- Frame counter `T` only advances in the 2D `render()`: 3D critter walk cycles,
  tree sway, bird bob, speech bubbles and biome music freeze. Advance it in
  the 3D loop.
- Pond texture is never redrawn in 3D (`renderWater()` is only called from
  the 2D path).
- Check: 3D animals animate, pond animates, jetpack works by keyboard.

**Phase 1 - scaffold and split**
- Vite + TS project, split `index.html` into the structure above with
  behaviour parity in 3D.
- Check: `tsc --noEmit`, `vite build`, dev server plays as before.

**Phase 2 - strip the old project**
- Delete the 2D renderer (`drawTerrain`, `paintHero`, `drawObj`, ...),
  `play/`, `blog/`, classic view, portfolio `CONTENT`, personal links, email
  and analytics stubs.
- Keep what 3D still borrows from 2D-era code: `map`/`HGRID` and collision,
  the minimap, the modal avatar (or replace it), and the pond texture until
  the GPU water lands.
- Check: no references to the old name/contact remain (grep), 3D still plays.

**Phase 3 - look-dev spike (biggest visible jump, no new art)**
- Toon/painterly materials, hue-shifted lighting, sky + clouds, GPU water,
  wind-driven instanced grass, post stack (bloom, AO/outline, grade),
  mouse-orbit third-person camera.
- Check: side-by-side screenshots against the reference board; 60 fps on the
  baseline machine; draw calls kept low (guidance: under about 100).

**Phase 4 - asset pipeline and diet**
- Load only used models (about 95 of 228 catalogue entries are referenced;
  about 130 are dead weight and are fetched on first 3D toggle).
- glTF-transform (Draco/Meshopt, KTX2), instancing, baked AO on statics.
- License log for every asset in ASSETS.md (source, licence, attribution).

**Phase 5 - vertical slice**
- Gate Plaza + one tower fully polished: concierge, one panel, one ad slot,
  audio, camera moves. This sets the quality bar for the rest.

**Phase 6 - full campus**
- All zones, content, ad-slot system, contact intake.

**Phase 7 - polish and ship**
- Composed audio, performance pass, basic accessibility, Vercel deploy.

## 7. Asset pipeline (free + AI)

1. Concept boards first, so all generated assets chase one look.
2. Free sources: Kenney (already in repo, CC0), Quaternius (CC0), Poly Haven
   and ambientCG (CC0 HDRIs/textures), Mixamo for humanoid animation.
   Check each licence and record it.
3. AI image-to-3D (open-source or hosted tools) for props, rocks, plants and
   creatures - not hero architecture. Check each tool's current commercial
   terms before use.
4. Blender cleanup for every AI mesh: decimate to budget, fix normals, unwrap,
   bake, drop the AI textures and recolour via palette/vertex colour.
5. Export GLB, compress, register in the manifest.

## 8. Ad-slot system (data-driven)

Each slot is one entry in `content/`: id, zone, type (billboard / kiosk /
banner), size, position, media (self-hosted image or short loop), link,
"sponsor" label, optional start/end dates. Placement: walking paths, plaza,
jetpack skyline. Self-hosted creatives only. Impression/click tracking is a
later decision.

## 9. Performance budget (desktop first)

- 60 fps on a recent integrated-GPU laptop, higher settings on discrete GPUs.
- Small first download; stream zones after first paint.
- Quality presets with dynamic resolution.

## 10. Risks

- Art is most of the quality; AI/free assets need real cleanup effort.
- No non-3D fallback would hide the park from screen readers and no-WebGL
  visitors.
- Client showcase rights: the six projects are already public on the Appaaz
  site, but check before adding anything that is not.
- Leftover personal content (name, email, links) must be fully removed.
- Licence hygiene for CraftPix sprites and any AI-generated assets.

## 11. Progress log

**2026-09-19 - Phase 0 + Phase 1 (first pass), needs a browser smoke test**

- Phase 0 fixes were applied in the ported code rather than the old file:
  jetpack is Space/Z (FLY button now sets Z; Shift+thrust descends), the frame
  counter `T` and `renderWater()` now run in the 3D loop.
- Old single file moved to `legacy/portfolio.html` (reference only; its
  asset paths no longer resolve). `assets/` moved to `public/assets/` for Vite.
  `blog/`, `play/`, `vendor/` and the old docs are untouched until Phase 2.
- New Vite + TypeScript project (three.js pinned to 0.149.0 for parity; the
  WebGPU renderer comes in Phase 3). The inline script was split
  mechanically into 25 modules under `src/` (core, content, world, entities,
  render, assets, ui). 2D-only drawing code, the avatar and analytics were
  dropped in the same pass. The 3D scene now boots directly (no 2D/3D toggle).
- Ported modules carry `// @ts-nocheck` for now. Shared mutable globals live in
  `$S` (`core/state.ts`); references to later modules go through the `$R`
  registry. Both disappear as modules are cleaned up into real typed exports.
- Still legacy: `content/legacy-content.ts` (the portfolio content), the
  classic view, and 2D-era branches in `core/update.ts`.
- Verified in a sandbox: unresolved-name type check, `vite build`, and a jsdom
  boot that runs every module's top-level code plus frames of the update loop
  with no errors. NOT verified: WebGL rendering, model loading, real gameplay.
- Run: `npm install`, then `npm run dev`.

**2026-09-19 - Phase 2 (partly done)**

- Phase 1 confirmed running in a browser (plays like the old build).
- Portfolio content replaced by appaaz; content in `src/content/content.ts`
  (same slots as before: 6 project cabinets, 4 service cabinets, cloud rack,
  stack shelf, 3 process stations, global-hub board, team shelf, contact
  terminal, notice board = first ad-slot placeholder, 6 landmarks). The 7
  personal "secret" objects were removed. Wording for process/cloud/landmark
  panels is placeholder copy and needs a review.
- Building names, idle chatter, help text, intro badge, save keys and contact
  email were rewritten. Inline `onclick`/`onsubmit` handlers (contact form,
  congrats panel) needed globals after the split and are now exposed on
  `window`.
- Text version kept as the no-WebGL / accessibility fallback.
- Moved to `legacy/`: old `index.html`, `play/`, `blog/`, `vendor/`, the old
  content file and the old docs. `README.md` and `ASSETS.md` are new.
- Verified in a sandbox only: content slots identical to the old ones, name
  check, `vite build`, simulated-browser boot with zero errors.
- Later the same day: the 2D movement and camera branches in `core/update.ts`
  were removed, and `say()` now shows chatter/door lines in a small on-screen
  speech line (`#speech`), since the old bubbles were 2D-only.
- Titles fixed: CEO Aanisha, CTO Pahlwan, COO Z (team shelf updated). No
  Singapore mention anywhere in the park (entity not registered yet).
- Still to do in Phase 2: refresh the help panel and discovery counter
  wording.

**2026-09-19 - Phase 3, step 1: three.js r149 -> r186 (same renderer, same look)**

- Decision: quality default is "balanced" with automatic scale-up on strong
  GPUs (frame-time monitor, dynamic resolution, then optional effects).
  Not built yet.
- Migrated removed/changed APIs: `encoding` -> `colorSpace` on textures,
  `outputEncoding` -> `outputColorSpace`, and light intensities x pi (the old
  "legacy" light scaling is gone). Point lights now use `decay = 0` with an
  approximate intensity, so the accent lights may look a little different.
- `ColorManagement.enabled = false` (in `core/three-global.ts`) keeps the old
  colour handling so the tuned look should be unchanged. Phase 3 look-dev will
  switch proper colour management on.
- Checked in a sandbox: every `THREE.*` symbol we use exists in r186, key
  objects construct, `vite build` and the simulated boot pass. NOT checked: an
  actual WebGL render. Please run `npm install` and compare against the
  previous look (brightness, accent lights near the gallery, contact terminal
  and front desk, shadows).
- Next: WebGPURenderer (with WebGL 2 fallback) and TSL materials, then the
  look-dev stack. (Superseded by section 12: WebGL 2 first.)

## 12. Campus look target and work plan (v1)

Project renamed to **appaaz; Campus**. Two ChatGPT concept images are the
visual target: an entrance view (vine-draped arch, spiral tower, glass dome,
flagstone plaza) and an aerial view (island, six pavilions, lagoon, gazebo,
turbines). Save them in `docs/concept/` as `entrance.png` and `aerial.png`.
They are a mood board for colour, light and composition, not a spec: they have
painted-level detail that real-time cannot match everywhere.

### 12.1 What the images contain

- Smooth island terrain: hills, beach, sea, lagoon, distant islands.
- Soft painterly light: warm sun, cool shadows, dappled tree shadows, bloom,
  sun flare, volumetric-looking clouds, haze.
- Turquoise water with sun glitter, shore foam, lily pads.
- Dense foliage: flower meadows, shrubs, tree canopies, palms, hanging vines.
- Curved solarpunk architecture: spiral terraced tower with a solar-petal
  crown and beacon beam, glass dome, ring pavilions with solar roofs, vine
  arch over the gate, gazebo and boardwalk, lantern posts, wind turbines.
- Floating holographic panels.
- A cute jetpack character, NPC visitors, leaves and pollen drifting.
- A low over-the-shoulder camera and a high aerial camera.

### 12.2 Campus layout v0 (replaces the old tile map)

| Feature in the concept | Content it carries |
|---|---|
| Vine arch gate + plaza | Front desk / welcome, first hologram ad slot |
| Central spiral tower | Team (lobby) and Start a project (terminal) |
| Six solar-roof pavilions around the plaza | The six projects, one each |
| Glass dome | Services (web, mobile, AI, data) |
| Lagoon gazebo | Global hub board |
| Lantern posts along the main path | Process: discover, build, launch |
| Pergola with shelves | Our stack |
| Turbine ridge and coast | Cloud, delivery line, launchpad, airfield landmarks |
| Hologram billboards | Ad slots (data-driven) |

The 26 content slots keep their ids and text; only their positions and
visual prefabs change. A new `campus/layout.ts` holds all positions.

### 12.3 Work packages

| # | Package | Approach | Main risk |
|---|---|---|---|
| WP0 | Style lock and shot tooling | Palette numbers from the concepts; a debug key that renders fixed camera shots (entrance, aerial, plaza, water, meadow) and saves PNGs for side-by-side checks | none |
| WP1 | Render foundation | WebGL 2 + colour management on, ACES/AgX, procedural sky lighting, one sun shadow map following the player, post stack (bloom, AA, grade, optional AO and god rays; check the `postprocessing` library against r186), quality tiers with auto-scale | post cost on integrated GPUs |
| WP2 | Terrain and coast | Smooth chunked heightfield with LOD, painterly ground shader driven by mask maps (grass, sand, stone path), baked vertex AO, heightfield collision | collision and LOD seams |
| WP3 | Sky, clouds, water | Sky-dome shader with sun disc and halo, soft cloud clusters, distant island silhouettes, ocean and lagoon shaders (waves, depth colour, glitter, shore foam via depth), lily pads | foam and depth on WebGL |
| WP4 | Vegetation | GPU-wind instanced grass and flowers, leaf-card shrubs and tree canopies with backlit toon shading, palms, hanging vines, tree LODs | density vs frame time |
| WP5 | Architecture generators | Parametric TypeScript builders: spiral tower, dome, pavilion, arch, gazebo, boardwalk, lantern post, turbine, hologram panel; merged geometry with vertex AO; glass, solar and stone materials | looking detailed enough |
| WP6 | Characters and life | Procedural chibi hero with jetpack and hand-coded animation, instanced NPC visitors on path splines, birds, leaves, pollen, boats | character charm |
| WP7 | FX | Toon ramp with hue-shifted shadows, character outline, emissive bloom, beam cones (teal to amber when visited), hologram shader | style consistency |
| WP8 | Camera and controls | Over-the-shoulder spring arm with collision, mouse orbit, wide FOV, aerial pull-back when flying, opening flyover, gamepad | collision and comfort |
| WP9 | Layout and content | `campus/layout.ts`, prefab placement, interaction prompts, in-world labels, ad-slot billboards | none |
| WP10 | UX polish | Glass HUD, loading screen with real progress, composed ambient audio, footsteps by surface, spatial sound | audio sourcing |
| WP11 | Performance | Instancing, static merges, KTX2 and meshopt, chunk streaming, profiling on an integrated GPU | budgets |

### 12.4 Milestones (each one playable, checked with screenshots)

1. **M1 Sky, sea, light.** Placeholder buildings, but sky, clouds, sea, sun,
   shadows, grade and fog already match the concept mood. Includes WP0 and
   the core of WP1 and WP3.
2. **M2 Ground.** Terrain, path, meadow, flowers and trees around the plaza.
3. **M3 Hero pieces.** Arch, spiral tower, dome, hologram panels: the entrance
   view matches the first concept (without the crowd).
4. **M4 Full campus.** Pavilion ring, lagoon, gazebo, turbines, all 26 content
   slots placed and playable: the aerial view matches the second concept.
5. **M5 Life.** Character, visitors, birds, particles, audio.
6. **M6 Polish and ship.** Tiers and auto-scale, loading screen, fallback
   text version, accessibility basics, favicon, deploy.

### 12.5 Asset sources

- Generated in code: terrain, sky, water, clouds, grass, flowers, all
  architecture, lamp posts, gazebo, turbines, the hero character.
- Generated with ChatGPT (transparent PNG atlases): leaf clusters, flower
  sprites, grass blades, vines, palm fronds, cloud puffs, lily pads, seamless
  flagstone and painterly stone textures, hologram icons. Prompts to be
  written per atlas.
- Free: CC0 audio (wind, sea, birds), optional Quaternius/Kenney props.
- Record every source and licence in `ASSETS.md`.

### 12.6 Quality tiers and auto-scale

- Low: no post, 1024 shadow map, short grass radius, render scale 0.75.
- Balanced (default): AA, bloom, grade, 2048 shadow map, medium grass.
- High: adds ambient occlusion and god rays, 4096 shadows, dense grass.
- Auto: moving-average frame time. Starting values to tune: step down when
  above about 20 ms for 2 s, step up when below about 12 ms for 10 s. Render
  scale changes first, then effects.
- Starting budgets to measure against: under about 300 visible draw calls and
  1.5M triangles.

### 12.7 Expected gaps versus the concept

Foliage will be less dense and less hand-painted at distance; architecture
will have fewer fine details; characters will be simpler; water will have no
real refraction. The composition, palette, light, water, wind, beams and
silhouettes are the parts we can match closely.

### 12.8 Open decisions

- WebGL 2 first (recommended) or WebGPU now.
- Hero character: procedural chibi (recommended) or a modelled/AI one.
- Whether ChatGPT-generated texture atlases are acceptable to ship (licence).
- Replace the old portfolio favicon with an appaaz; one.

Resolved 2026-09-20: WebGL 2 first; hero character built procedurally (chibi
with jetpack); ChatGPT-generated texture atlases are OK to ship.

### 12.9 Progress log

**2026-09-20 - M1 first pass (sky, sea, light), needs your check**

- New modules in `src/render/`: `look.ts` (all look settings), `sky.ts` (gradient
  sky, sun, soft clouds), `ocean.ts` (turquoise shallows, foam lines, sun
  glitter), `post.ts` (MSAA, bloom, tone mapping, colour grade, vignette),
  `quality.ts` (low/balanced/high tiers and the auto-scaler), `devpanel.ts`.
- Colour management is now ON. The meadow colour was brightened and the
  checkerboard variation softened. The old flat sky, sea plane and shoreline
  boxes are replaced; the old blocky clouds are hidden.
- Look panel: press L in the game for live sliders (exposure, sun, sky, fog,
  clouds, sea, bloom, saturation, contrast, vignette, tints). "Copy settings"
  puts the JSON on the clipboard; paste it back to make it the new default.
  "Save shots" downloads 4 fixed-camera PNGs (ground, plaza, aerial, horizon).
- URL options: `?q=low|balanced|high` forces a tier; `?auto=0` turns the
  auto-scaler off. Default is balanced with auto scale-up/down.
- Debug hook: `window.__campus.$S.debugCam = {pos:[x,y,z], target:[x,y,z], fov}`.
- Tooling note: the assistant can now render the game in a headless
  Chromium (software WebGL) with placeholder models, so it can check
  lighting, sky, sea and colour itself. Real model shapes still need your
  screenshots.

**2026-09-20 - M2 first pass (ground): new campus scene, opt-in**

- Your M1 screenshots confirmed the sky, sea, foam and shadows work on a real
  GPU. Remaining M1 issues: pale grey horizon band (sky/fog horizon colours
  retuned), rectangular island edge and flat lawn (fixed by the new terrain).
- New `src/campus/` scene, enabled with `?scene=campus` (the old world stays
  the default until the campus is playable): `layout.ts` (positions),
  `terrain.ts` (smooth island heightfield, beach, hills, lagoon, painted colours,
  flagstone path shader), `foliage.ts` (wind grass, flowers, bushes, trees,
  palms, chunked instancing), `player.ts` (placeholder chibi with jetpack),
  `scene.ts` (controls, camera, lighting, post).
- Controls in the preview: WASD/arrows move relative to the camera, drag to
  orbit, wheel to zoom, Space/Z jetpack (Shift descends), L look panel.
- Test options: `?q=low|balanced|high`, `?density=0.3` (foliage density).
- Stand-in blocks mark the tower, dome, six pavilions, gate and gazebo.
  Interactions and content panels are not wired into the campus scene yet.
- Not measured on a real GPU: about 0.9M triangles with full foliage.

**2026-09-20 - M3 first pass (hero pieces)**

- Your M2 screenshots ran fine on a real GPU. Findings: the whole island was a
  dense uniform forest (thinned to about half, more open meadow and flowers),
  and the horizon was a grey-white band (sky horizon and fog made bluer).
- New `src/campus/buildings.ts`, all generated in code and merged per material:
  spiral terraced tower with hedges, hanging vines, flowers, a solar-petal crown
  and a teal beacon beam; glass dome with lattice, plants and an amber beam; six
  ring pavilions with solar roofs and small beacon posts; vine-draped gate arch;
  gazebo with a boardwalk over the lagoon; lantern posts along the paths; five
  wind turbines on the ridge; three holographic panels (canvas textures).
- The stand-in blocks are gone. Beam colours: teal = unvisited, amber for the
  dome for now; the visited state switches in a later step.
- Still to do: wire the 26 content slots, interaction prompts and panels into
  the campus scene; the player character; ad-slot panels; performance check on
  a real GPU; delete the old world once the campus is playable.

**2026-09-20 - M4 first pass (playable)**

- All 26 panels are placed on the campus (`src/campus/interact.ts`): six
  projects at the pavilions, four services around the dome, process steps along
  the gate path, team and contact by the tower, global hub on the gazebo
  (reachable by the boardwalk), notice board (ad slot) by the gate, and the
  landmarks and cloud rack around the island.
- Each spot has a waypoint marker (pedestal, orb, beam, name label). Markers,
  and the tower and dome beams, turn from teal to amber once opened. The tower
  beam turns amber when team and contact are both seen; the dome beam when all
  four services are seen.
- Press E (or Enter) next to a spot to open its panel; the discovery counter
  and the congratulations panel work as before. The old animals are off in the
  campus scene.
- Buildings and gate pillars are solid; the camera is kept out of the arch.
- Checked in the headless browser: walking next to the first process station
  shows the prompt, E opens the panel, and the counter goes to 1/26.
- Still to do: restyle the panel and HUD to the appaaz look, a proper player
  character, ad-slot polish, performance check on a real GPU, make the campus
  the default and delete the old world.

**2026-09-20 - Water fix**

- Feedback: the water looked solid, not liquid. `src/render/ocean.ts` now has
  five travelling wave layers plus drifting ripples, fresnel sky reflection,
  light through the wave tops, long sliding streaks, caustic lines and wobbly
  foam bands in the shallows, and a few white caps on big crests. Fine ripples
  fade with distance so the far sea does not shimmer.
- Checked in the headless browser (open sea and the lagoon). Tunables are the
  wave slopes and speeds near the top of the `waves()` function.
- Second water pass (feedback: repetitive, copied-looking patterns): replaced
  the five aligned sine waves with twelve waves of irregular wavelengths and a
  wide spread of directions, patchy gusts, warped crests, per-wave distance
  fade, no sliding-streak layer, and patchy two-frequency shoreline foam.

**2026-09-21 - M5 polish: theme, hero, campus is the default**

- HUD, prompt, toast and content panels restyled in `main.css` (teal glass,
  amber accents, modern font, readable contrast).
- Waypoint labels are a fixed screen size (readable close up and far away).
- New chibi hero in `src/campus/player.ts`: face, hair, jacket, arms and legs
  that swing, two-tank jetpack with flames, toon outline.
- The campus is now the default scene. The old world is still reachable with
  `?scene=legacy` until it is deleted.
- Still to do: delete the old world and unused legacy modules, real GPU
  performance check, mobile controls, audio, ad-slot polish, intro screen,
  favicon, loading screen, deploy.
