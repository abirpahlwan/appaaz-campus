# Solarpunk theme retrofit — plan

## Goal

Re-theme the playable portfolio into the solar-punk "habitat" shown in the Stitch
redesign (`stitch_solarpunk_rpg_redesign.zip` → `code.html` + `screen.png`): a
verdant, glass-and-gold future where the player — an eco-systems architect —
walks the work instead of a farm village. Keep the single-file, offline,
procedural architecture and every piece of portfolio substance intact.

## Reference design (from Stitch export)

Design tokens to adopt:

- Base: deep green `#0b1f1a`; glass = white gradient + `blur(16px)` + white border.
- `solargold` 300 `#FDE047` · 400 `#FACC15` · 500 `#EAB308` · 600 `#CA8A04`
- `aerogreen` 100 `#E6F4EA` · 300 `#86EFAC` · 400 `#4ADE80` · 500 `#22C55E` · 900 `#064E3B`
- `aetherblue` 300 `#7DD3FC` · 500 `#0EA5E9` · 900 `#0C4A6E`
- Tactile gold CTA (3D keycap shadow), keycap chips for controls, floating pollen
  particles, telemetry HUD strips ("TERRA-PRIME", "Sectors 0/12", "Lore Relics
  0/7", "CLEAN FUSION 4.8 GW", "WEATHER: 24°C // OPTIMAL HELIO-FLUX").
- Flavor: "ENTER THE HABITAT", "Eco-Systems Architect // Interactive Engines",
  "Holocron Plain Text" (M key). Sanitise any flavor that claims tech we do not
  use (the `code.html` footer says "THREE.JS + WEBGPU SHADERS" — ours is
  procedural Canvas 2D, so that text must be reworded).

Asset: `assets/solarpunk-city.jpg` (from `Downloads/solarpunk-city.png`, 1.5 MB —
re-encoded JPEG q82, 167 KB, 1376×768 — done Sep 19).

## Architecture constraints (non-negotiable, from AGENT.md / PLAN.md)

- Single `index.html`; no build step, no CDNs, no network dependencies, no new
  binary coupling. Fonts: do not hot-load Google Fonts — either keep the
  system mono stack or bundle webfonts locally later (decision below).
- Keep every stable content ID, discovery total, control, save key, modal
  contract, classic/plain mode, and accessibility behaviour byte-compatible.
  Re-skin visuals only; do not rename `CONTENT.objects` ids, buildings, animals,
  or the save/localStorage keys (`pahlwan-village-audio-v1`, etc.).
- Keep `prefers-reduced-motion`, focus-visible, touch execution shortcuts.

## Key surfaces and where they live (index.html, 3848 lines)

| Surface | Location | Solarpunk work |
|---|---|---|
| CSS tokens | `:root` ~L27 | Swap inks/panels to solargold/aerogreen/aetherblue on deep-green; keep `--glass-*` tokens, retune to Stitch glass |
| Intro / title overlay | CSS ~L175, markup `#intro` ~L269 | Rebuild the Stitch habitat screen: matte bg image, glass card, keycap chips, telemetry strip, "ENTER THE HABITAT" CTA, floating pollen |
| HUD chrome | `#hud` ~L224 | Badges/buttons → telemetry chips; VOL + sound rows stay; minimap → sector map styling |
| World palette | `const C` ~L1896 | Grass/dirt/wall/timber/water/desert/rail/snow → biotech greens, terrarium glass, gold accents; ink stays brown-black |
| Background fill + sky | `render()` background ~L2474 area | Ground fill colour toward solarpunk; optional parallax sky/matte strip visible at wide zoom |
| Buildings | `BUILDINGS` ~L972, roofs ~L1916, `paintFacade`/`paintRoofArt` ~L2504 | Farm cottages → biodomes / vertical-farm glasshouses with green-tinted glass, solar ridges, gold trim; doors glow green |
| Player hero | `paintHero` ~L2938 | Shirt → eco-architect suit (green/gold), maybe keeps the glasses; wave/controller/laptop poses unchanged |
| Interactables | `drawObj` (~L1730 region) | Re-tint arcade cabinets, desk, terminal, noticeboard to glass/gold; keep shapes and semantics |
| Dialogue flavour | `IDLE_LINES` ~L1385 | Solarpunk-tinged quips; keep the flying-cow and tea jokes; keep "notice board" line accurate |
| Biomes / regions | terrain gen ~L1026, `AudioManager` motifs ~L3551 | Align existing regions to "sectors" (village/water/desert/mountain = four credit-checked biomes); consider renaming displayed labels only, never ids |
| Critters | cows/ducks/rabbits/goats/deer (~L1500) | Re-tint only; names stay |
| Cloud shadows / pollen | `clouds` ~L2853 | Add gold-hour tint; reuse current drift path idea for the Stitch "pollen" micro-particles |
| Modal card + avatar | `#modal`, `#avatar` | Glass card + gold ring avatar frame |
| blog/ + play/ shells | `blog/blog.css` :root | Re-tint `--paper/--ink/--accent` to solarpunk paper-dark or soft-green; wrappers only, games untouched |

## Phases (each independently shippable and testable)

### Phase 0 — prep
- Create branch `solarpunk-theme` from current `main`.
- Matte is in the repo as `assets/solarpunk-city.jpg` (separate-file strategy — done Sep 19).
- Decide asset strategy — options: (a) separate `assets/` file (recommended:
  keeps offline guarantee, keeps `index.html` small), (b) compressed base64
  data-URI in the CSS/`#intro` (perfectly single-file, +~1–2 MB).

### Phase 1 — theme tokens + UI chrome
- Update `:root`, `.badge`, `button.k/a.k`, `.audio-control`, `#toast`,
  `#prompt`, `#modal .card`, `.cbtn`, minimap frame to solar-green glass + gold.
- Classic (#classic) and help/other modals restyled via same tokens; confirm all
  text still readable on the new surfaces.

### Phase 2 — the Stitch title screen (`#intro`)
- Background: matte painting (`assets/solarpunk-city.jpg`) with the source-image gradient
  overlays; fallback to the existing radial green gradient if image missing.
- Box: glass card (Stitch `.solarpunk-glass-subtle`), keycap chips for
  W A S D / arrows, E·Space, M; headline + role; telemetry chips (Sectors 0/12,
  Lore Relics 0/7, CLEAN FUSION); "ENTER THE HABITAT (INITIALIZE RPG)" tactile
  gold CTA; plain-version link stays. Optional floating pollen dots overlay.
- Wiring: reuse `#btnStart` flow + `toast('Walk through a doorway…')`; audio
  unlock unchanged; keep `M`/classic path.
- Language decision: factual role stays primary; solarpunk epithet ("Eco-Systems
  Architect") used as the world's frame, not a fake credential (confirm with user).

### Phase 3 — world re-skin
- Rework `C` palette; ground fill; terrain recolour (grass patches, dirt→biotech
  path, pond→clean-fusion aqua, desert→terraformed gold-green, mountains→
  pale-blue alpine, snow stays).
- Buildings → glasshouse domes: re-paint `paintFacade` + `paintRoofArt` (glass
  tint, gold ridge, solar panels/globes instead of chimney plumes), door glow
  green when open; roof name plates stay but bordered gold.
- Player suit + props + critters re-tint; interactable accents to gold.
- IDLE_LINES solarpunk quips (swap ~half; keep jokes/secrets references).
- Cloud shadows tint toward warm light; add low-cost pollen motes (reuse firefly
  particles) near the habitat entrance.

### Phase 4 — biome/naming pass (display-only)
- Sector labels: building `line` text at doorways, HUD toasts, minimap legend
  can read "sector / habitat / biome" style. Map to the four existing audio
  biomes so music still switches by tile. Never change object ids or save schema.

### Phase 5 — shells (optional)
- Re-tint `blog/blog.css` `:root` and the arcade wrapper so blog/index, notes,
  and play/ cards feel like the same habitat; games' own canvases untouched.

### Phase 6 — validation + commit
- Per AGENT.md: extract inline scripts → `node --check`; `git diff --check`;
  HTTP smoke all routes (/, play/, blog/).
- Manual desktop+mobile: intro → walk → doors → panels → classic → minimap →
  audio (biome switches) → pets/animals → secrets → reduced-motion.
- Verify no torn pixels from palette-swap (`imageSmoothingEnabled=false` world).
- Commit source + docs on `solarpunk-theme`; no deploy.

## Open decisions for next session
1. Fonts: keep the system mono stack (offline-clean) vs bundle Space Grotesk /
   Outfit / JetBrains Mono locally as woff2.
2. Title matte: decided — separate `assets/solarpunk-city.jpg`, compressed (done Sep 19).
3. Scope of theme: title screen only, or full world + shells (phases 1–5
   assume full).
4. How far to go on flavor copy: keep "Eco-Systems Architect // Interactive
   Engines" as the in-world persona, or adjust to stay strictly factual.
5. Whether the village name itself changes ("The Village" → "Habitat/Sector 04").

## Notes from this session (context for whoever picks this up)
- `main` is `27b84c0`, 12 commits ahead of `origin/main`; world expansion +
  audio are merged, five stale branches deleted, worktrees removed. Clean tree.
- Local preview server was `python -m http.server 8000` from repo root
  (already the documented run path).
- The pond's animated water is a per-frame software shader; palette-only change
  is safe. Trees/reeds sprites are pre-baked — re-bake after palette change
  (they live next to `C` and the bake IIFEs).

## Village → solarpunk city (approved Sep 19 — in progress)

Source motifs from `assets/solarpunk-city.jpg`: white garden towers + blue
solar crowns, solar-panel domes, terraced hills, winding river, gliders.
User decisions: white recolor + crowns (pitched roofs stay) · reshape allowed ·
gliders yes · labels unchanged.

- Phase 1 (done next): white tower shells + solar crowns — `paintRoofArt` base
  → warm white `#FBF4E4`, trim ridge = `b.roof`, vent → panel fan + gold dome,
  facade walls warm white + vine strips. Footprints/doors/labels untouched.
- Phase 4: gliders — new `drawGliders` (~30 lines) on the cloud-drift system,
  above world, below HUD; frozen by the global reduced-motion rule.
- Phase 3: terrace + bank art in `drawTerrain` (baked, free at runtime).
- Phase 2: tile-map reshape — terraced west/south grass, winding river;
  keep tile-code enum + all footprints + door PATHs + spawn walkable; update
  `POND`/shore mask, `setBiome` zone test, minimap region rects together.
  Saves safe (`pahlwan-village-v2` stores no position/map).
- Phase 5: sync + validate per AGENT.md (`node --check`, `git diff --check`,
  HTTP smoke, desktop + mobile walkthrough) on branch `solarpunk-city`.

Order: 1 → 4 → 3 → 2 → 5. All five executed Sep 19 on `main` (uncommitted):
white shells/crowns/vines, 3 gliders, contour ring + white banks + SAND
risers, outlet stream + widened river + terrace bands (verified: WATER
168→194, SAND 0→68, all door fronts reachable, no new conflicts).

## 3D spike (in progress Sep 19, uncommitted)
`vendor/three.min.js` (r149 UMD, 608 KB, offline) + HUD `2.5D` toggle.
Same sim, billboard renderer: baked `groundCv`/`wcv` as ground/water planes,
hero repainted per frame to a canvas texture, ABOUT tower (facade + lifting
roof tied to `b.a`), one sun with cutout shadows (`customDepthMaterial`).
Lazy-loads on first toggle; WebGL-less falls back to 2D. Next if kept:
all buildings/objs/critters as billboards, then lighting polish.

## 3D real geometry + Kenney flora (in progress Sep 19, uncommitted)
Supersedes the billboard spike. Same sim; full 3D scene: faceted heightfield
terrain, 8 merged-geometry white towers (roof+walls fade via `b.a`, door gaps,
solar crowns, labels), kiosk pillars per interactable, jointed player humanoid
with jetpack (hold SPACE / FLY button; roof landing; water skim), instanced
Kenney Nature Kit flora (CC0, `assets/kenney/nature/`, 18 files / 87KB:
default+oak+pine trees by region, rocks, 3 flowers, grass tufts, bushes),
box critters following the sim, glider squadron, follow camera + travelling
sun with shadows. Procedural systems kept: player rig, critters, buildings,
props (Kenney has no matching species/props). Movement branches in `update()`
on `R3on`; Space re-routed to thrust in 3D (E still interacts); mounts gated
to 2D; `findNear` gated above alt 26.

## 3D completion plan (in progress Sep 19, uncommitted — THIS IS THE PLAN)
Goal: shippable real-3D solarpunk city with jetpack flight, all portfolio
content reachable, 2D game untouched. Status per phase:

- [x] P1 engine+terrain: vendored three r149, heightfield, water, sun+shadows,
      follow camera, 3D movement branch, jetpack physics (SPACE/FLY, ceiling
      170, roof landing, water skim), minimap/HUD/modals/audio shared.
- [x] P2 white towers: 8 merged towers, door gaps, labels, crowns, fade via
      `b.a`, kiosks per interactable, procedural props.
- [x] P3 Kenney flora: nature kit trees/rocks/flowers/grass/bushes.
- [x] P4 houses kitbash r1+r2: arcade cabinets, furniture entrances, train +
      station + tracks, rocket, modular windows/doors, camp props (+0 draws).
- [x] P5 high-rises: per-building `roofH` (60–135 + spires), setback slabs,
      glass bands, glasshouse crowns, occlusion raycast fade, commercial +
      retro kits. Collision tops per tower; 2D walking verified identical.
- [x] P6 CraftPix sprite critters: bull/sheep/chick/rooster + deer/hare
      idle+walk sheets (`assets/craftpix/`, 8 PNGs), flat-laid animated
      planes with cutout shadows, duck headings from `mother.a`, walk cycle
      frozen under reduced-motion. (CraftPix free downloads need sign-in;
      user supplied the zips.)
- [ ] P7 VISUAL PASS (needs eyes — cannot verify headless): toggle 3D and
      check towers/glass/crowns, sprite scale vs buildings, duck float,
      hop lift, occlusion fade trigger, roof landings, frame time on low-end.
      (Grounding pass done: kitbash/prop stacks now sit on terrain per measured minY.)
- [ ] P8 commit: everything above is uncommitted on `main` (was 12 ahead of
      origin/main before this work; vendor/ + assets/ add ~1.5MB).

Rules for all remaining work: offline (no CDN), 2D paths byte-identical,
no ID/save/map-enum changes, additive edits, node --check + diff --check +
HTTP smoke every step.