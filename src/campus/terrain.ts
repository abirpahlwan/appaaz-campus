/* Island terrain: smooth heightfield, beach, hills, lagoon, painted ground colours,
   and a flagstone path mask read by the ground shader. */
import * as THREE from 'three';
import { WORLD, PLAZA, LAGOON, PATHS, SEA_LEVEL, ISLANDS, type Vec2 } from './layout';

/* ---------- noise ---------- */
function hash(ix: number, iz: number) { let h = ix * 374761393 + iz * 668265263; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x: number, z: number) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  return (hash(ix, iz) * (1 - u) + hash(ix + 1, iz) * u) * (1 - v) + (hash(ix, iz + 1) * (1 - u) + hash(ix + 1, iz + 1) * u) * v;
}
export function fbm(x: number, z: number, oct = 4) { let a = 0.5, s = 0, f = 1; for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, z * f); f *= 2.03; a *= 0.5; } return s; }
export const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/* ---------- height ---------- */
/** >0 inland, 0 at the coast, <0 in the sea. Includes the 8 satellite islands. */
export function coast(x: number, z: number) {
  const r = Math.hypot(x / 5900, z / 4250);
  const wob = 1 + (fbm(x * 0.00032 + 11, z * 0.00032 + 5, 3) - 0.5) * 0.36 + (fbm(x * 0.0012, z * 0.0012, 2) - 0.5) * 0.08;
  const c = 1 - r * wob;
  let best = c;
  for (const is of ISLANDS) {                                                  // satellite islands as small coast bumps
    const dx = x - is.x, dz = z - is.z;
    const d = Math.hypot(dx, dz) / is.r;
    if (d > 2.6) continue;                                                     // cheap early-out
    const w = 1 + (fbm(dx * 0.0022 + is.k, dz * 0.0022 + is.k * 1.7, 2) - 0.5) * 0.5;
    best = Math.max(best, 1 - d * w);
  }
  return best;
}
export function heightAt(x: number, z: number) {
  const c = coast(x, z);
  let h = -18 + 24 * smooth(-0.02, 0.03, c) + 6 * smooth(0.03, 0.18, c);      // sea floor -> beach shelf (+6) -> inland (+12)
  const hills = (fbm(x * 0.00044 + 3, z * 0.00044 + 9, 4) - 0.32) * 95 + (fbm(x * 0.0014, z * 0.0014, 2) - 0.5) * 9;
  h += Math.max(0, hills) * smooth(0.1, 0.34, c);
  h += 64 * Math.exp(-(((x - 780) / 240) ** 2 + ((z + 170) / 200) ** 2));      // turbine ridge (cluster-scale, matches the turbines)
  h += 34 * Math.exp(-(((x + 900) / 220) ** 2 + ((z + 420) / 180) ** 2));      // west knoll
  const pd = Math.hypot(x - PLAZA[0], (z - PLAZA[1]) * 1.15);                   // flat plaza plateau
  h = mix(h, 16, 1 - smooth(300, 560, pd));
  const gd = Math.hypot((x - 0) / 1.0, z - 820);                                // flat forecourt at the gate
  h = mix(h, 12, (1 - smooth(140, 300, gd)));
  const ld = Math.hypot((x - LAGOON[0]) / 1.15, z - LAGOON[1]);                 // lagoon basin
  h = mix(h, -16, 1 - smooth(200, 330, ld));
  return h;
}

/* ---------- paths ---------- */
function segDist(px: number, pz: number, a: Vec2, b: Vec2) {
  const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / l2));
  return Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t));
}
/** signed-ish distance to the nearest path edge (negative on the path). */
export function pathEdgeDist(x: number, z: number) {
  let best = 1e9;
  for (const p of PATHS) for (let i = 0; i < p.pts.length - 1; i++) best = Math.min(best, segDist(x, z, p.pts[i], p.pts[i + 1]) - p.half);
  return best;
}

export function buildPathMask(res = 3) {
  /* the paths only exist inside the built campus cluster, so the mask only
     covers that region - keeps the texture cheap on the 5× island */
  const x0 = -1400, z0 = -900, mw = 3000, md = 2400;
  const w = Math.ceil(mw / res), h = Math.ceil(md / res);
  const data = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const x = x0 + (i + 0.5) * res, z = z0 + (j + 0.5) * res;
    const d = pathEdgeDist(x, z);
    data[j * w + i] = Math.round(255 * (1 - smooth(-1.5, 2.5, d)));
  }
  const tex = new THREE.DataTexture(data, w, h, THREE.RedFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
  (tex as any).__maskRegion = [x0, z0, mw, md];
  return tex;
}

/* ---------- mesh ---------- */
const C = (hex: string) => new THREE.Color(hex);
const GRASS_LIGHT = C('#a3dc62'), GRASS_MID = C('#7cc852'), GRASS_DARK = C('#4fa650'), SAND = C('#f3e2ae'), WET = C('#d9c38b'), ROCK = C('#b9a98e');

export function buildTerrain(step = 8) {
  const segX = Math.round(WORLD.w / step), segZ = Math.round(WORLD.d / step);
  const g = new THREE.PlaneGeometry(WORLD.w, WORLD.d, segX, segZ);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)));
  g.computeVertexNormals();
  const nrm = g.attributes.normal as THREE.BufferAttribute;
  const col = new Float32Array(pos.count * 3), tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), ny = nrm.getY(i);
    const n1 = fbm(x * 0.006, z * 0.006, 3), n2 = fbm(x * 0.03 + 7, z * 0.03, 2);
    tmp.copy(GRASS_MID).lerp(GRASS_LIGHT, smooth(0.35, 0.7, n1)).lerp(GRASS_DARK, smooth(0.55, 0.85, n2) * 0.5 + smooth(30, 90, y) * 0.35);
    if (ny < 0.8) tmp.lerp(ROCK, smooth(0.8, 0.55, ny));
    const cc = coast(x, z);
    tmp.lerp(SAND, 1 - smooth(0.035, 0.085, cc)).lerp(WET, smooth(2.2, 0.2, y) * 0.8);
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));

  const pathTex = buildPathMask();
  const maskRegion = (pathTex as any).__maskRegion as [number, number, number, number];
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  mat.onBeforeCompile = sh => {
    sh.uniforms.uPath = { value: pathTex };
    sh.uniforms.uMask = { value: new THREE.Vector4(...maskRegion) };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vWp; uniform sampler2D uPath; uniform vec4 uMask;
      float gh(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
      float gn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(gh(i),gh(i+vec2(1,0)),f.x),mix(gh(i+vec2(0,1)),gh(i+vec2(1,1)),f.x),f.y); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      float speck = gn(vWp.xz*0.55) * 0.6 + gn(vWp.xz*1.9) * 0.4;
      diffuseColor.rgb *= 0.9 + 0.2 * speck;
      float pm = texture2D(uPath, (vWp.xz - uMask.xy) / uMask.zw).r;
      vec2 sp = vWp.xz / 10.0; vec2 cell = floor(sp + vec2(0.5*mod(floor(sp.y),2.0), 0.0)); vec2 fr = fract(sp + vec2(0.5*mod(floor(sp.y),2.0), 0.0));
      float mortar = clamp(step(fr.x, 0.07) + step(fr.y, 0.07), 0.0, 1.0);
      vec3 stone = mix(vec3(0.86,0.72,0.50), vec3(0.95,0.87,0.68), gh(cell));
      stone = mix(stone, vec3(0.55,0.44,0.28), mortar * 0.55);
      diffuseColor.rgb = mix(diffuseColor.rgb, stone, pm);`);
  };
  const mesh = new THREE.Mesh(g, mat);
  mesh.receiveShadow = true;
  return mesh;
}

/** a coarse land/water grid used by the ocean shader to find the shore distance */
export function buildLandGrid(cell = 50) {
  const w = Math.ceil(WORLD.w / cell), h = Math.ceil(WORLD.d / cell), map: number[][] = [];
  for (let j = 0; j < h; j++) { map[j] = []; for (let i = 0; i < w; i++) map[j][i] = heightAt((i + 0.5) * cell - WORLD.w / 2, (j + 0.5) * cell - WORLD.d / 2) > SEA_LEVEL + 0.3 ? 0 : 1; }
  return { map, w, h, cell };
}
