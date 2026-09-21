# Assets - inventory and licences

Runtime assets are served from `public/assets/` (URL `/assets/...`). Source
kit zips are not in the repo. The previous project's long asset guide is kept
in `legacy/docs/ASSETS.md` for reference (its file paths and script names are
outdated).

## What is in the repo

| Path | Contents | Licence / source |
|---|---|---|
| `public/assets/kenney/<pack>/` | OBJ + MTL model pieces (flat colours) | Kenney kits, CC0 (kenney.nl) |
| `public/assets/craftpix/` | Critter sprite sheets (PNG) | CraftPix free packs, royalty-free; free downloads need an account |
| `public/assets/solarpunk-city.jpg` | Intro background painting | Provenance not recorded - confirm before launch |

## Model catalogue

The models the 3D scene can load are listed in `src/assets/catalog.ts`
(`FLORA` and `KIT3D`). Loading is done by `src/assets/loaders.ts`.

Known issue: the catalogue lists 228 entries, and about 130 of them are not
referenced by the scene. All of them are fetched and parsed on start-up
(roughly 450 requests). Cleaning this up is Phase 4 of the plan.

## Rules for new assets

- Record the source, licence and attribution next to every new file, in this
  document.
- Free or AI-generated models must have their licence and the generator's
  current commercial terms checked before use.
- Do not commit source zips.
- Prefer flat colours or palette-remapped materials over shipped textures.
- Respect reduced-motion settings for any animated sprite or prop.
