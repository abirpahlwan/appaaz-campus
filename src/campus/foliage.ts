/* Vegetation: wind-swayed grass, flower speckle, bushes, broadleaf trees and palms.
   Everything is instanced and grouped in chunks so distant chunks can be skipped. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { WORLD, KEEP_CLEAR, LAGOON, GAZEBO } from './layout';
import { heightAt, pathEdgeDist, fbm, coast, smooth, cover } from './terrain';

export const wind = { time: { value: 0 } };
const DENSITY = Math.max(0.02, Math.min(2, parseFloat(new URLSearchParams(location.search).get('density') || '1')));
/* the island base is 5× wider (25× the area); phones cut vegetation counts
   roughly in half so the big meadow stays cheap to draw */
const MOBILE = matchMedia('(pointer:coarse)').matches;
const Q = MOBILE ? 0.45 : 1;

function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ---------- geometry helpers ---------- */
function paint(g: THREE.BufferGeometry, fn: (x: number, y: number, z: number, i: number) => THREE.Color) {
  const p = g.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const col = fn(p.getX(i), p.getY(i), p.getZ(i), i); c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
const flat = (g: THREE.BufferGeometry) => { const n = g.index ? g.toNonIndexed() : g; n.deleteAttribute('uv'); return n; };
const col = (h: string) => new THREE.Color(h);

function grassGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 3; k++) {
    const g = new THREE.BufferGeometry(), w = 1.4, H = 9;
    g.setAttribute('position', new THREE.Float32BufferAttribute([-w, 0, 0, w, 0, 0, 0.6, H, 0.4], 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0.6, 1, 0, 0.6, 1, 0, 0.6, 1], 3));
    g.rotateY((k * Math.PI) / 3);
    parts.push(paint(g, (_x, y) => col('#68b64f').lerp(col('#d6f47c'), Math.min(1, y / H))));
  }
  return mergeGeometries(parts)!;
}

function blobGeometry(radius: number, detail: number, jitter: number, dark: string, light: string, seed: number) {
  const g = new THREE.IcosahedronGeometry(radius, detail);
  const r = rng(seed), p = g.attributes.position;
  const jit = new Map<string, THREE.Vector3>();
  for (let i = 0; i < p.count; i++) {
    const key = p.getX(i).toFixed(3) + p.getY(i).toFixed(3) + p.getZ(i).toFixed(3);
    if (!jit.has(key)) jit.set(key, new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(jitter));
    const j = jit.get(key)!; p.setXYZ(i, p.getX(i) + j.x, p.getY(i) + j.y, p.getZ(i) + j.z);
  }
  const f = flat(g); f.computeVertexNormals();
  const d = col(dark), l = col(light);
  return paint(f, (_x, y) => d.clone().lerp(l, Math.min(1, Math.max(0, (y / radius + 1) / 2))));
}

function treeGeometry(seed: number) {
  const trunk = new THREE.CylinderGeometry(2.2, 3.6, 30, 6, 1); trunk.translate(0, 15, 0);
  const t = paint(flat(trunk), (_x, y) => col('#6b4a34').lerp(col('#a77b52'), Math.min(1, y / 30)));
  const parts = [t];
  const r = rng(seed);
  const blobs = [[0, 44, 0, 20], [-13, 36, 5, 15], [12, 37, -4, 16], [3, 54, 8, 13]];
  for (const [x, y, z, rad] of blobs) {
    const b = blobGeometry(rad * (0.9 + r() * 0.2), 1, rad * 0.14, '#52ad6c', '#c9ee72', seed + x);
    b.translate(x, y, z); parts.push(b);
  }
  return mergeGeometries(parts)!;
}

function palmGeometry(seed: number) {
  const r = rng(seed), parts: THREE.BufferGeometry[] = [];
  const pts = [0, 1, 2, 3, 4, 5].map(i => new THREE.Vector3(Math.sin(i * 0.25) * 6, i * 9, 0));
  const trunk = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 2.4, 6, false);
  parts.push(paint(flat(trunk), (_x, y) => col('#8a6a4a').lerp(col('#c19a6b'), Math.min(1, y / 46))));
  const top = pts[pts.length - 1];
  for (let f = 0; f < 8; f++) {
    const a = (f / 8) * Math.PI * 2 + r() * 0.3, len = 34 + r() * 8;
    const g = new THREE.PlaneGeometry(9, len, 1, 6);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = Math.min(1, Math.max(0, (p.getY(i) + len / 2) / len));   // 0 at base .. 1 at tip
      const drop = -Math.pow(t, 2.1) * 26, out = t * len * 0.9;
      const side = p.getX(i) * (1 - t * 0.6);
      p.setXYZ(i, Math.cos(a) * out + Math.sin(a) * side, drop + 2 + t * 6, Math.sin(a) * out - Math.cos(a) * side);
    }
    g.computeVertexNormals();
    const fg = flat(g);
    parts.push(paint(fg, (_x, y) => col('#48a862').lerp(col('#a4e07a'), Math.min(1, Math.max(0, (y + 26) / 34)))).translate(top.x, top.y, top.z));
  }
  const m = mergeGeometries(parts, false)!;
  return m;
}

/* ---------- wind material patch ---------- */
function windify(mat: THREE.MeshLambertMaterial, height: number, amount: number) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = wind.time;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec3 ip = instanceMatrix[3].xyz;
      #else
        vec3 ip = vec3(0.0);
      #endif
      float sw = sin(uTime*1.7 + ip.x*0.045 + ip.z*0.037) * 0.6 + sin(uTime*3.1 + ip.x*0.13 + ip.z*0.1) * 0.25;
      float hw = clamp(position.y / ${height.toFixed(1)}, 0.0, 1.0); hw *= hw;
      transformed.x += sw * hw * ${amount.toFixed(2)};
      transformed.z += cos(uTime*1.3 + ip.z*0.05) * hw * ${(amount * 0.5).toFixed(2)};`);
  };
  return mat;
}

/* ---------- placement ---------- */
type Accept = (x: number, z: number, h: number) => number;   // returns probability 0..1
const HX = WORLD.w / 2 - 60, HZ = WORLD.d / 2 - 60;
function clearOf(x: number, z: number, pad = 0) { for (const [cx, cz, r] of KEEP_CLEAR) if (Math.hypot(x - cx, z - cz) < r + pad) return false; return true; }

function scatter(count0: number, accept: Accept, r: () => number) {
  const count = Math.round(count0 * DENSITY);
  const out: { x: number; y: number; z: number }[] = [];
  for (let tries = 0; out.length < count && tries < count * 25; tries++) {
    const x = (r() * 2 - 1) * HX, z = (r() * 2 - 1) * HZ, h = heightAt(x, z);
    if (r() < accept(x, z, h)) out.push({ x, y: h, z });
  }
  return out;
}

const CHUNK = 2500;
function chunked(geo: THREE.BufferGeometry, mat: THREE.Material, pts: { x: number; y: number; z: number }[], r: () => number,
  opts: { scale: [number, number]; lift?: number; colors?: string[]; colorFn?: (x: number, z: number, r: () => number) => string; cast?: boolean; receive?: boolean; tilt?: number }) {
  const groups = new Map<string, typeof pts>();
  for (const p of pts) { const k = Math.floor((p.x + WORLD.w / 2) / CHUNK) + ',' + Math.floor((p.z + WORLD.d / 2) / CHUNK); (groups.get(k) || groups.set(k, []).get(k)!).push(p); }
  const meshes: THREE.InstancedMesh[] = [], m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), c = new THREE.Color();
  for (const list of groups.values()) {
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((p, i) => {
      const sc = opts.scale[0] + r() * (opts.scale[1] - opts.scale[0]);
      e.set((r() - 0.5) * (opts.tilt || 0), r() * Math.PI * 2, (r() - 0.5) * (opts.tilt || 0)); q.setFromEuler(e);
      m.compose(new THREE.Vector3(p.x, p.y + (opts.lift || 0), p.z), q, s.set(sc, sc * (0.85 + r() * 0.3), sc));
      im.setMatrixAt(i, m);
      const col0 = opts.colorFn ? opts.colorFn(p.x, p.z, r) : opts.colors ? opts.colors[Math.floor(r() * opts.colors.length)] : null;
      if (col0) { c.set(col0); im.setColorAt(i, c); }
    });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.castShadow = !!opts.cast; im.receiveShadow = opts.receive !== false;
    im.computeBoundingSphere();
    meshes.push(im);
  }
  return meshes;
}

export function buildFoliage(scene: THREE.Scene) {
  const r = rng(20260920), all: THREE.InstancedMesh[] = [], grassChunks: THREE.InstancedMesh[] = [];
  const meadow = (x: number, z: number) => fbm(x * 0.004 + 40, z * 0.004 + 8, 3);
  const onLand = (x: number, z: number, h: number) => h > 7.2 && coast(x, z) > 0.055 && clearOf(x, z) && pathEdgeDist(x, z) > 3;

  /* grass: full density around the built campus, thinning out across the
     wide quiet ring, and skipping the bare-field/flower cover zones so whole
     regions read as open field instead of uniform lawn */
  const gMat = windify(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), 9, 2.6);
  const campusWeight = (x: number, z: number) => 1 - 0.65 * smooth(1500, 4500, Math.hypot(x, z));
  const grass = scatter(18750 * Q, (x, z, h) => {
    if (!onLand(x, z, h)) return 0;
    const cov = cover(x, z);
    const g = (0.25 + meadow(x, z) * 0.75) * campusWeight(x, z);
    if (cov < 0.5) return g * 0.12;                             // bare field: only sparse tufts
    if (cov > 0.5) return g * 0.35;                             // flower meadow: light grass
    return g;
  }, r);
  for (const m of chunked(grassGeometry(), gMat, grass, r, { scale: [0.8, 1.6], tilt: 0.25, receive: true })) { grassChunks.push(m); all.push(m); }

  /* flowers: clustered patches */
  const fGeo = new THREE.SphereGeometry(1.7, 6, 4);
  const fMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  /* flower varieties: broad regions share a dominant colour (a blue stretch,
     a yellow stretch, a rose stretch...), with white and odd blooms mixed in */
  const FLOWERS = ['#ffffff', '#ffd6e6', '#ffe36e', '#e9d4ff', '#ff9ec2', '#ff8a5c', '#f43f5e', '#c084fc', '#7dd3fc', '#a3e635'];
  const flowerColor = (x: number, z: number, rr: () => number) =>
    rr() < 0.25 ? FLOWERS[(rr() * FLOWERS.length) | 0]
                : FLOWERS[Math.floor(fbm(x * 0.0006 + 300, z * 0.0006 + 180, 2) * FLOWERS.length * 1.7) % FLOWERS.length];
  const flowers = scatter(80000 * Q, (x, z, h) => {
    if (!onLand(x, z, h)) return 0;
    const cov = cover(x, z);
    const patchy = Math.max(0, fbm(x * 0.02 + 5, z * 0.02 + 90, 2) - 0.45) * 2.8;
    return cov > 0.5 ? Math.max(patchy, 0.5 + meadow(x, z)) : patchy;   // flower zones bloom widely
  }, r);
  all.push(...chunked(fGeo, fMat, flowers, r, { scale: [0.8, 1.4], lift: 6.5, colorFn: flowerColor, receive: false }));

  /* bushes */
  const bush = blobGeometry(9, 1, 1.6, '#4fae5c', '#b5e56e', 5);
  const bMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const bushes = scatter(4000 * Q, (x, z, h) => {
    if (!onLand(x, z, h)) return 0;
    const cov = cover(x, z);
    return cov < 0.5 ? (0.15 + meadow(x, z) * 0.6) * 0.3 : 0.15 + meadow(x, z) * 0.6;   // bushes hug the grassy zones
  }, r);
  all.push(...chunked(bush, bMat, bushes, r, { scale: [0.7, 1.7], lift: 3, cast: true }));

  /* broadleaf trees (three variants) */
  const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const treeSpots = scatter(1400 * Q, (x, z, h) => (onLand(x, z, h) && Math.hypot(x, z - 300) > 380) ? Math.pow(meadow(x + 300, z), 3) * 1.6 + (h > 30 ? 0.25 : 0) : 0, r);
  for (let v = 0; v < 3; v++) all.push(...chunked(treeGeometry(11 + v * 7), tMat, treeSpots.filter((_, i) => i % 3 === v), r, { scale: [0.7, 1.35], cast: true, tilt: 0.06 }));

  /* meadow clumps: taller dry-grass tufts dotting the bare fields */
  const clumpGeo = blobGeometry(3.4, 0, 1.1, '#c9b96a', '#e6d98f', 77);
  const clumpMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const clumps = scatter(9000 * Q, (x, z, h) => {
    if (!onLand(x, z, h)) return 0;
    const cov = cover(x, z);
    if (cov > 0.5) return 0;                                    // no dry clumps in flower zones
    return cov < 0.5 ? 0.55 : 0.18;
  }, r);
  all.push(...chunked(clumpGeo, clumpMat, clumps, r, { scale: [0.8, 1.8], lift: 2, receive: true }));

  /* flower-spec speckle across the flower zones so the tint reads as blossoms */
  const specGeo = new THREE.SphereGeometry(1.1, 5, 4);
  const specMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const specs = scatter(60000 * Q, (x, z, h) => {
    if (!onLand(x, z, h)) return 0;
    return cover(x, z) > 0.5 ? 0.5 + meadow(x, z) * 0.5 : 0;
  }, r);
  all.push(...chunked(specGeo, specMat, specs, r, { scale: [0.6, 1.1], lift: 3.5, colorFn: flowerColor, receive: false }));

  /* palms near the shore, lagoon and plaza */
  const pMat = windify(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), 60, 2.2);
  const palmSpots = scatter(500 * Q, (x, z, h) => {
    const cc = coast(x, z); if (cc < 0.03 || cc > 0.14 || h < 4 || !clearOf(x, z, -10) || pathEdgeDist(x, z) < 6) return 0;
    const nearLagoon = Math.hypot(x - LAGOON[0], z - LAGOON[1]) < 420 ? 1 : 0.35;
    return nearLagoon * (cc < 0.1 ? 0.9 : 0.3);
  }, r);
  all.push(...chunked(palmGeometry(3), pMat, palmSpots, r, { scale: [0.9, 1.4], cast: true, tilt: 0.12 }));

  for (const m of all) scene.add(m);
  void GAZEBO;
  return {
    all,
    /** hide far grass chunks; call every frame or two with the camera position */
    update(camPos: THREE.Vector3, time: number) {
      wind.time.value = time;
      for (const m of grassChunks) {
        const b = m.boundingSphere!; m.visible = Math.hypot(b.center.x - camPos.x, b.center.z - camPos.z) < 3000 + b.radius;
      }
    },
  };
}
