# Assets — inventory and usage guide

What art the portfolio ships, where every file lives, and how to add more.
The project is offline-first: runtime assets are served from this repo over
HTTP; source kit zips stay outside the repo and are never fetched by the page.

## Repo folders

| Folder | Contents | Used by |
|---|---|---|
| `assets/kenney/<pack>/` | Baked flat-color OBJ+MTL model pieces (CC0) | 3D scene (`parseKenneyOBJ`) |
| `assets/craftpix/` | Critter sprite sheets (PNG, royalty-free) | 2D world + 3D critter planes |
| `assets/solarpunk-city.jpg` | Intro matte painting, 1376x768 JPEG q82 | `#intro` background |

## Kenney kits (CC0)

Source zips were downloaded manually from kenney.nl (free, no sign-in) and
currently sit in the session temp folder
`C:\Users\Abir-PC\AppData\Local\Temp\opencode\` (volatile — copy them out or
re-fetch from the asset pages if cleared). The versions fetched:

| Kit | Zip fetched | Status |
|---|---|---|
| City Kit Commercial | `kenney_city-kit-commercial_2.1.zip` | extracted (partial bake) |
| City Kit Suburban | `kenney_city-kit-suburban_20.zip` | extracted (unbaked) |
| City Kit Industrial | `kenney_city-kit-industrial_2.0.zip` | downloaded, unbaked |
| Train Kit | `kenney_train-kit.zip` | extracted (partial bake) |
| Space Kit | `kenney_space-kit.zip` | extracted (partial bake) |
| Space Station Kit | `kenney_space-station-kit.zip` | downloaded, unbaked |
| Cube Pets | `kenney_cube-pets_1.0.zip` | downloaded, unbaked |

Baked pieces currently in `assets/kenney/`, and how `index.html` maps them:

- `nature/` — trees (default, oak, pine), rock, 3 flowers, grass, bush.
  Loaded via `FLORA` (index.html ~L3693); placed per-region in `init3d`.
- `space/` — satellite dish + rocket base/sides/top/fins. `KIT3D` keys
  `dish`, `rBase`, `rBody`, `rTop`, `rFins`.
- `train/` — track, electric loco, box carriage. `KIT3D` keys `track`,
  `loco`, `carriage` (colormap-baked).
- `arcade/` — arcade machine. `KIT3D` key `cabinet` (colormap-baked).
- `furniture/` — open stairs, doormat. `KIT3D` keys `steps`, `doormat`.
- `modular/` — door-window block, 2 corner-window blocks, edges-door.
  `KIT3D` keys `doorWin`, `winN`, `winM`, `barr` (edges-door).
- `commercial/` — skyscraper-c. `KIT3D` key `glassTop`.
- `retro/` — wide window, metal roof, balcony, single light. `KIT3D` keys
  `glassPane`, `plantBox`, `rail`, `mast`.
- `survival/` — campfire pit, bedroll, box, large box, barrel. `KIT3D` keys
  `firepit`, `bedroll`, `crate`, `crateL`, `cask`.

Unbaked but interesting pieces for later passes:

- City Kit Industrial: 20 building shells (a-t), chimneys, tanks,
  shipping containers, water tower, windmills, and `solar-panel-*` (flat /
  landscape / portrait, singles + groups) — ready-made solarpunk crowns.
- Space Station Kit: 97 modular walls/floors/stairs/containers/pipes — usable
  for a future orbital or terrarium interior region.
- Cube Pets: 24 blocky animals (`animal-beaver` ... `animal-tiger`) — candidate
  3D critter variants; the current scene keeps procedural box critters instead.
- City Kit Suburban: 21 house shells (type-a ... type-u), driveways, fences,
  planters, paths.

## CraftPix (royalty-free, free downloads need account sign-in)

Source zips in `C:\Users\Abir-PC\Downloads\` (never copied into the repo; only
needed PNGs are):

- `craftpix-net-291971-free-top-down-animals-farm-pixel-art-sprites.zip` —
  farm animals. Also contains unused species: lamb, calf, turkey, piglet.
- `craftpix-net-789196-free-top-down-hunt-animals-pixel-sprite-pack.zip` —
  deer/hare (in use) plus unused: fox, boar, black grouse, with extra
  Death/Hurt/Run animations.
- `craftpix-net-100884-free-shrubs-flowers-and-mushrooms-3d-low-poly-models.zip`
  — NEW, not integrated: 20 low-poly 3D plants as FBX (`_bush_1..5`,
  `_flower_1..6`, `_grass_1..2`, `_mashroom_1..4`, `_stone_1..3`) + one 64x64
  texture atlas (PNG). FBX must be converted to OBJ before the repo parser can
  read it (see below).
- `craftpix-net-790180-free-50-futuristic-plant-icons-for-cyberpunk-game.zip`
  — FAILED download (0-byte zip + leftover `.part`); re-download before use.
  Intended for HUD/sector-chip icons, not world decor.

Sprite sheets extracted to `assets/craftpix/` (8 PNGs) and mapped in the 2D
`SPRITES` table (index.html ~L3838):

| File | Game animal | Sheet size | Frames |
|---|---|---|---|
| `bull.png` | cow | 64x64 cells, 6x8 sheet | 6 |
| `sheep.png` | goat | 64x64 cells, 6x8 sheet | 6 |
| `rooster.png` | mother duck | 64x64 cells, 6x8 sheet | 6 |
| `chick.png` | duckling | 32x32 cells, 6x8 sheet | 6 |
| `deer-walk.png` / `deer-idle.png` | deer | 32x32 cells | 6 / 5 |
| `hare-walk.png` / `hare-idle.png` | rabbit | 32x32 cells | 5 / 5 |

## How the Kenney pipeline works

`parseKenneyOBJ(objText, mtlText, targetH)` (index.html ~L3717) parses OBJ+MTL
at runtime, reads only `Kd` material colors (no UV/textures), triangulates,
height-normalizes to `targetH` world units, and returns a
`THREE.BufferGeometry` with a `color` attribute. `loadFlora()` (~L3755) fetches
every `FLORA` + `KIT3D` entry from `assets/kenney/...` — the page therefore
needs the HTTP server (`python -m http.server 8000`), not `file://`.

`targetH` is chosen per piece so its footprint lands on the 16px tile grid
(player ~22 tall, walls 30). See `KIT3D` for reference values.

### Adding a new Kenney piece

1. Extract the OBJ from the kit zip (`Models/OBJ format/<name>.obj`).
2. If the OBJ references `Textures/colormap.png` (train/arcade-era kits do),
   bake it first: sample each face's UV-centroid texel from the colormap,
   group faces by color, and write flat `Kd`-only OBJ+MTL (no UVs, no PNGs in
   the repo). The offline bake script pattern lives in the session temp folder
   (`bake_models.py` in `%TEMP%/opencode`); reuse it with a new JOBS entry.
3. Copy the `<name>.obj` + `<name>.mtl` into `assets/kenney/<pack>/`.
4. Add an entry to `KIT3D` (or `FLORA` for plants) in `index.html`:
   `key:['<pack>/<name>',targetH]`.
5. Place/consume the geometry in the 3D scene like existing keys.
6. Validate: inline-script `node --check`, `git diff --check`, HTTP smoke of
   the new asset URLs (`/assets/kenney/<pack>/<name>.obj|.mtl`), then a browser
   look at scale/grounding.

### Adding a new CraftPix critter

1. Extract the PNG sheet(s) from the animal zip into `assets/craftpix/`
   (keep the lowercase kebab filenames used by the map).
2. Sheet layout: 6x8 sheets have rows 0-3 = walk (front/back/sideL/sideR) and
   rows 4-7 = idle, column 0; split sheets use separate walk/idle files with
   rows 0-3, idle in column 0.
3. Add an entry to the `SPRITES` map with `w/h` (world size, matched to the 3D
   cast scale), `cw/ch` (sheet cell size), and `n` (walk frame count).
4. The billboard plane + cutout shadow + reduced-motion freeze come from the
   shared critter renderer; no per-species code is needed.
5. Validate the same way as above.

### Adding the CraftPix 3D low-poly plants (pending)

These ship as FBX, which the parser cannot read. Required steps:

1. Convert each `_*.fbx` to OBJ (Blender/assimp export; keep Y-up).
2. Bake the shared 64x64 texture atlas per-face into flat `Kd` colors using
   the same offline bake script pattern (colormap sampling).
3. Copy the baked OBJ+MTL into `assets/kenney/` (e.g. a `craftpix/` pack
   folder) and add `KIT3D`/`FLORA` entries with suitable `targetH`.

## Constraints when adding any asset

- Offline only: no CDN, no runtime network fetches beyond the local
  `assets/` HTTP paths; no build step.
- Licenses: Kenney is CC0; CraftPix free files are royalty-free for unlimited
  projects — record the source zip name next to any new extraction.
- 2D world paths stay byte-identical; new art is additive (`KIT3D`/`FLORA`/
  `SPRITES` entries, new files under `assets/`).
- Keep the repo small: bake to flat colors instead of shipping textures; never
  commit source zips.
- Reduced motion must keep freezing any new animated sprites/props.
