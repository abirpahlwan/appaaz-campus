/* Campus layout v0: where everything goes. Units are world units (a visitor is ~20 tall).
   x = east, z = south, y = up. Buildings arrive in the next milestone; for now these
   markers show the composition (plaza, gate, tower, dome, pavilion ring, lagoon). */

export type Vec2 = [number, number];

export const SEA_LEVEL = 0;
/* The island base was expanded 5× so there is a wide, quiet ring of meadow
   and open sea around the built campus cluster (which keeps its original
   player-scale size and spacing). */
export const WORLD = { w: 15000, d: 11000 };           // terrain extent, centred on 0,0

export const PLAZA: Vec2 = [0, 120];                   // central plaza
export const GATE: Vec2 = [0, 820];                    // vine arch / entrance
export const TOWER: Vec2 = [40, -40];                  // spiral tower (HQ)
export const DOME: Vec2 = [-420, -170];                // glass dome (services)
export const LAGOON: Vec2 = [-660, 330];               // lagoon with gazebo
export const GAZEBO: Vec2 = [-560, 300];
export const SPAWN: Vec2 = [0, 640];

/* eight satellite islands scattered in the sea around the main island.
   r = coast radius (before noise wobble), h = hill height added at the
   centre, k = seed offset so each island gets its own shoreline. Sized
   and placed so even the wobbled shore never crosses the terrain edge. */
export const ISLANDS: { x: number; z: number; r: number; h: number; k: number }[] = [
  { x: 3700, z: 4500, r: 650, h: 32, k: 3 },
  { x: -3900, z: 4400, r: 800, h: 42, k: 7 },
  { x: 6700, z: -450, r: 550, h: 27, k: 11 },
  { x: -6400, z: -1300, r: 800, h: 38, k: 17 },
  { x: 2200, z: -4800, r: 480, h: 29, k: 23 },
  { x: -3000, z: -4650, r: 600, h: 24, k: 29 },
  { x: 6100, z: -3600, r: 850, h: 45, k: 31 },
  { x: -1600, z: 4900, r: 420, h: 26, k: 37 },
];

/* six project pavilions on a ring around the plaza */
export const PAVILIONS: Vec2[] = [0, 1, 2, 3, 4, 5].map(i => {
  const a = (i / 6) * Math.PI * 2 + 0.5;
  return [PLAZA[0] + Math.cos(a) * 330, PLAZA[1] + Math.sin(a) * 250] as Vec2;
});

/* main paths (polylines) and their half-widths */
export interface PathDef { pts: Vec2[]; half: number; }
export const PATHS: PathDef[] = [
  { pts: [[0, 1000], [10, 900], [0, 760], [-20, 560], [0, 380], [0, 240]], half: 20 },        // gate to plaza
  { pts: (() => { const p: Vec2[] = []; for (let i = 0; i <= 36; i++) { const a = (i / 36) * Math.PI * 2; p.push([PLAZA[0] + Math.cos(a) * 250, PLAZA[1] + Math.sin(a) * 190]); } return p; })(), half: 15 }, // plaza ring
  { pts: [[-200, 190], [-330, 260], [-470, 300], [-560, 300]], half: 11 },                       // to gazebo
  { pts: [[-180, 40], [-300, -60], [-420, -110], DOME], half: 11 },                              // to dome
  { pts: [[200, 90], [420, 40], [640, -60], [800, -170]], half: 11 },                            // to the turbine ridge
  ...PAVILIONS.map(p => ({ pts: [[PLAZA[0] + (p[0] - PLAZA[0]) * 0.72, PLAZA[1] + (p[1] - PLAZA[1]) * 0.72] as Vec2, p], half: 9 })),
];

/* keep foliage and paths out of these circles: [x, z, radius] */
export const KEEP_CLEAR: [number, number, number][] = [
  [TOWER[0], TOWER[1], 130], [DOME[0], DOME[1], 95], [GAZEBO[0], GAZEBO[1], 60], [GATE[0], GATE[1], 120],
  ...PAVILIONS.map(p => [p[0], p[1], 80] as [number, number, number]),
];

/* solid footprints: [x, z, radius, height] - the visitor is pushed out below that height */
export const COLLIDERS: [number, number, number, number][] = [
  [TOWER[0], TOWER[1], 84, 360], [DOME[0], DOME[1], 78, 130],
  ...PAVILIONS.map(p => [p[0], p[1], 62, 70] as [number, number, number, number]),
  [GATE[0] - 162, GATE[1], 24, 130], [GATE[0] + 162, GATE[1], 24, 130],
];
