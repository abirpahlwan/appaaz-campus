/* Hero buildings, generated in code: spiral terraced tower, glass dome, ring pavilions with
   solar roofs, vine-draped arch, gazebo and boardwalk, lantern posts, wind turbines,
   beacon beams and holographic panels. Static parts are merged per material. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TOWER, DOME, PAVILIONS, GATE, GAZEBO, PLAZA, PATHS } from './layout';
import { heightAt } from './terrain';

const col = (h: string) => new THREE.Color(h);
function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ---------- materials ---------- */
function solarTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!;
  const gr = g.createLinearGradient(0, 0, 128, 128); gr.addColorStop(0, '#3a86d8'); gr.addColorStop(1, '#1f55a8');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = 'rgba(210,235,255,.75)'; g.lineWidth = 2;
  for (let i = 0; i <= 128; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(128, i); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}
const HOT = (r: number, g: number, b: number) => new THREE.Color(r, g, b);   // >1 values glow through bloom
const MAT = {
  cream: new THREE.MeshLambertMaterial({ vertexColors: true }),
  glass: new THREE.MeshPhongMaterial({ color: '#8fe3ea', transparent: true, opacity: 0.5, shininess: 140, specular: '#ffffff', depthWrite: false }),
  solar: new THREE.MeshPhongMaterial({ map: solarTexture(), shininess: 90, specular: '#cfeaff', side: THREE.DoubleSide, emissive: '#1a4fa8', emissiveIntensity: 0.55 }),
  leaf: new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }),
  wood: new THREE.MeshLambertMaterial({ color: '#b98052' }),
  lantern: new THREE.MeshBasicMaterial({ color: HOT(3, 2.1, 0.9) }),
  teal: new THREE.MeshBasicMaterial({ color: HOT(0.7, 3, 2.8) }),
  line: new THREE.LineBasicMaterial({ color: '#f6efe0' }),
};

/* ---------- batching ---------- */
function paint(g: THREE.BufferGeometry, top: string, bottom: string, y0 = 0, y1 = 1) {
  const p = g.attributes.position, c = new Float32Array(p.count * 3), t = col(top), b = col(bottom), tmp = new THREE.Color();
  g.computeBoundingBox(); const bb = g.boundingBox!; const lo = y0 * 0 + bb.min.y, hi = bb.max.y;
  for (let i = 0; i < p.count; i++) { const k = hi > lo ? (p.getY(i) - lo) / (hi - lo) : 1; tmp.copy(b).lerp(t, Math.min(1, Math.max(0, k))); c[i * 3] = tmp.r; c[i * 3 + 1] = tmp.g; c[i * 3 + 2] = tmp.b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g;
}
const prep = (g: THREE.BufferGeometry) => { const n = g.index ? g.toNonIndexed() : g; n.deleteAttribute('uv'); return n; };
class Batch {
  cream: THREE.BufferGeometry[] = []; leaf: THREE.BufferGeometry[] = []; glass: THREE.BufferGeometry[] = []; solar: THREE.BufferGeometry[] = [];
  addCream(g: THREE.BufferGeometry, top = '#f7f0de', bottom = '#d9cdb0') { this.cream.push(prep(paint(g, top, bottom))); }
  addLeaf(g: THREE.BufferGeometry, top = '#a6e26a', bottom = '#3f9d58') { this.leaf.push(prep(paint(g, top, bottom))); }
  addGlass(g: THREE.BufferGeometry) { this.glass.push(prep(g)); }
  addSolar(g: THREE.BufferGeometry) { this.solar.push(g.index ? g.toNonIndexed() : g); }
  flush(scene: THREE.Scene, at: THREE.Vector3, rotY = 0) {
    const put = (list: THREE.BufferGeometry[], mat: THREE.Material, cast: boolean, keepUv = false) => {
      if (!list.length) return; const m = new THREE.Mesh(mergeGeometries(list.map(g => { if (!keepUv) g.deleteAttribute('uv'); return g; }))!, mat);
      m.position.copy(at); m.rotation.y = rotY; m.castShadow = cast; m.receiveShadow = true; scene.add(m);
    };
    put(this.cream, MAT.cream, true); put(this.leaf, MAT.leaf, true); put(this.solar, MAT.solar, true, true); put(this.glass, MAT.glass, false);
  }
}
const T = (g: THREE.BufferGeometry, x: number, y: number, z: number) => g.translate(x, y, z);

/* ---------- beams and panels ---------- */
const beamMats: THREE.ShaderMaterial[] = [];
export function makeBeam(color: string, height: number, rTop: number, rBottom: number) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { uColor: { value: col(color) }, uTime: { value: 0 }, uH: { value: height } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying vec3 vP; uniform vec3 uColor; uniform float uTime, uH; void main(){ float k = clamp(vP.y / uH + 0.5, 0.0, 1.0); float a = pow(1.0 - k, 1.6) * (0.55 + 0.15*sin(uTime*1.7 + vP.y*0.02)); gl_FragColor = vec4(uColor * a * 1.6, a); }',
  });
  beamMats.push(mat);
  return new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, height, 20, 1, true), mat);
}

function hologramTexture(seed: number) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 320; const g = c.getContext('2d')!; const r = rng(seed);
  g.fillStyle = 'rgba(90,230,255,0.16)'; g.strokeStyle = 'rgba(150,250,255,0.95)'; g.lineWidth = 5;
  const rr = (x: number, y: number, w: number, h: number, rad: number) => { g.beginPath(); g.roundRect(x, y, w, h, rad); };
  rr(8, 8, 496, 304, 26); g.fill(); g.stroke();
  g.fillStyle = 'rgba(190,255,255,0.9)'; rr(34, 34, 150, 16, 8); g.fill();
  for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(160,250,255,0.55)'; rr(34, 76 + i * 34, 120 + r() * 170, 12, 6); g.fill(); }
  for (let i = 0; i < 2; i++) { g.strokeStyle = 'rgba(190,255,255,0.95)'; g.lineWidth = 8; g.beginPath(); g.arc(340 + i * 100, 240, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * (0.8 + r() * 1.1)); g.stroke(); }
  g.fillStyle = 'rgba(200,255,255,0.9)'; g.beginPath(); g.moveTo(80, 250); g.quadraticCurveTo(110, 200, 150, 232); g.quadraticCurveTo(110, 262, 80, 250); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ---------- builders ---------- */
let towerBeam: THREE.Mesh, domeBeam: THREE.Mesh;
function tower(scene: THREE.Scene, x: number, z: number) {
  const b = new Batch(), r = rng(5), y0 = heightAt(x, z);
  const floors = 9, fh = 34, pink = ['#ffb1c8', '#ffffff', '#ffe36e', '#e9d4ff'];
  const dots: THREE.Vector3[] = [], dotCol: string[] = [];
  { const foot = new THREE.CylinderGeometry(62, 70, 8, 32); T(foot, 0, 4, 0); b.addCream(foot, '#efe6d0', '#c9bd9c'); }
  for (let i = 0; i < floors; i++) {
    const rad = 46 - i * 2.4, cx = Math.sin(i * 0.75) * 6, cz = Math.cos(i * 0.75) * 6, base = 8 + i * fh;
    const slab = new THREE.CylinderGeometry(rad + 9, rad + 9, 5, 32); T(slab, cx, base + 2.5, cz); b.addCream(slab, '#f9f3e3', '#dccfb1');
    const roof = new THREE.CylinderGeometry(rad + 3, rad + 3, 3, 32); T(roof, cx, base + fh - 1.5, cz); b.addCream(roof, '#f9f3e3', '#dccfb1');
    const glass = new THREE.CylinderGeometry(rad, rad, fh - 10, 32, 1, true); T(glass, cx, base + 5 + (fh - 10) / 2, cz); b.addGlass(glass);
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2 + i * 0.3; const m = new THREE.BoxGeometry(2.4, fh - 8, 2.4); T(m, cx + Math.cos(a) * rad, base + 5 + (fh - 8) / 2, cz + Math.sin(a) * rad); b.addCream(m, '#f7f0de', '#d9cdb0'); }
    const hedge = new THREE.TorusGeometry(rad + 9, 3.6, 6, 32); hedge.rotateX(Math.PI / 2); T(hedge, cx, base + 7, cz); b.addLeaf(hedge, '#a9e56c', '#3f9d58');
    for (let k = 0; k < 30; k++) { const a = r() * Math.PI * 2; dots.push(new THREE.Vector3(cx + Math.cos(a) * (rad + 9 + (r() - 0.5) * 4), base + 9.5 + r() * 2, cz + Math.sin(a) * (rad + 9 + (r() - 0.5) * 4))); dotCol.push(pink[Math.floor(r() * pink.length)]); }
    for (let k = 0; k < 18; k++) { const a = r() * Math.PI * 2, len = 8 + r() * 22; const v = new THREE.BoxGeometry(1.8, len, 1.8); T(v, cx + Math.cos(a) * (rad + 11), base + 5 - len / 2, cz + Math.sin(a) * (rad + 11)); b.addLeaf(v, '#7cc85a', '#2f8f52'); }
  }
  const top = 8 + floors * fh, tx = Math.sin(floors * 0.75) * 6, tz = Math.cos(floors * 0.75) * 6;
  const mast = new THREE.CylinderGeometry(2.2, 3.2, 70, 10); T(mast, tx, top + 35, tz); b.addCream(mast);
  for (let k = 0; k < 5; k++) {   // solar petals
    const g = new THREE.PlaneGeometry(58, 112, 6, 10), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const t = (p.getY(i) + 56) / 112, w = Math.sin(Math.PI * Math.min(1, t * 0.98 + 0.02)); p.setX(i, p.getX(i) * (0.25 + w * 0.85)); p.setZ(i, t * t * 26); p.setY(i, t * 112); }
    g.computeVertexNormals(); g.rotateX(-Math.PI / 2.9); g.rotateY((k / 5) * Math.PI * 2); T(g, tx, top + 20, tz); b.addSolar(g);
  }
  b.flush(scene, new THREE.Vector3(x, y0, z));
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(6, 14, 10), MAT.teal); beacon.position.set(x + tx, y0 + top + 76, z + tz); scene.add(beacon);
  const beam = makeBeam('#33d1c0', 520, 5, 16); beam.position.set(x + tx, y0 + top + 76 + 260, z + tz); scene.add(beam);
  towerBeam = beam;
  const dg = new THREE.SphereGeometry(1.9, 6, 4), im = new THREE.InstancedMesh(dg, new THREE.MeshLambertMaterial({ color: 0xffffff }), dots.length), m = new THREE.Matrix4(), c = new THREE.Color();
  dots.forEach((p, i) => { m.makeTranslation(p.x + x, p.y + y0, p.z + z); im.setMatrixAt(i, m); im.setColorAt(i, c.set(dotCol[i])); }); scene.add(im);
}

function dome(scene: THREE.Scene, x: number, z: number) {
  const b = new Batch(), y0 = heightAt(x, z), R = 54;
  const plinth = new THREE.CylinderGeometry(R + 6, R + 10, 8, 30); T(plinth, 0, 4, 0); b.addCream(plinth, '#efe6d0', '#c9bd9c');
  for (let i = 0; i < 2; i++) {
    const rad = R - i * 2, base = 8 + i * 30;
    const slab = new THREE.CylinderGeometry(rad + 8, rad + 8, 5, 30); T(slab, 0, base + 2.5, 0); b.addCream(slab, '#f9f3e3', '#dccfb1');
    const gl = new THREE.CylinderGeometry(rad, rad, 22, 30, 1, true); T(gl, 0, base + 16, 0); b.addGlass(gl);
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; const m = new THREE.BoxGeometry(2.4, 24, 2.4); T(m, Math.cos(a) * rad, base + 17, Math.sin(a) * rad); b.addCream(m); }
    const hedge = new THREE.TorusGeometry(rad + 8, 3.4, 6, 30); hedge.rotateX(Math.PI / 2); T(hedge, 0, base + 6, 0); b.addLeaf(hedge);
  }
  const dg = new THREE.SphereGeometry(R - 2, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2); T(dg, 0, 64, 0); b.addGlass(dg);
  const inner = new THREE.CylinderGeometry(R - 4, R - 4, 2, 24); T(inner, 0, 64, 0); b.addLeaf(inner, '#8ad45e', '#4fae5c');
  const r = rng(9);
  for (let k = 0; k < 9; k++) {                                   // conservatory plants under the glass
    const a = r() * Math.PI * 2, d = r() * 32, s = 0.6 + r() * 0.9; const px = Math.cos(a) * d, pz = Math.sin(a) * d;
    const trunk = new THREE.CylinderGeometry(1.2, 1.6, 12 * s, 6); T(trunk, px, 64 + 6 * s, pz); b.addCream(trunk, '#a77b52', '#6b4a34');
    const blob = new THREE.IcosahedronGeometry(9 * s, 1); T(blob, px, 64 + 16 * s, pz); b.addLeaf(blob, '#b8ea70', '#4fae5c');
  }
  b.flush(scene, new THREE.Vector3(x, y0, z));
  const lat = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(R - 1.6, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2)), MAT.line);
  lat.position.set(x, y0 + 64, z); scene.add(lat);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(4.5, 12, 8), MAT.lantern); beacon.position.set(x, y0 + 64 + R + 4, z); scene.add(beacon);
  const beam = makeBeam('#33d1c0', 420, 4, 12); beam.position.set(x, y0 + 64 + R + 4 + 210, z); scene.add(beam);
  domeBeam = beam;
}

function pavilion(scene: THREE.Scene, x: number, z: number, faceAngle: number) {
  const b = new Batch(), y0 = heightAt(x, z), R = 46;
  const plinth = new THREE.CylinderGeometry(R + 4, R + 7, 7, 26); T(plinth, 0, 3.5, 0); b.addCream(plinth, '#efe6d0', '#c9bd9c');
  const gl = new THREE.CylinderGeometry(R - 3, R - 3, 22, 26, 1, true); T(gl, 0, 18, 0); b.addGlass(gl);
  for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; const m = new THREE.BoxGeometry(2.2, 24, 2.2); T(m, Math.cos(a) * (R - 3), 18, Math.sin(a) * (R - 3)); b.addCream(m); }
  const deck = new THREE.CylinderGeometry(R + 8, R + 8, 4, 26); T(deck, 0, 31, 0); b.addCream(deck, '#f9f3e3', '#dccfb1');
  const hedge = new THREE.TorusGeometry(R + 8, 3, 6, 26); hedge.rotateX(Math.PI / 2); T(hedge, 0, 35, 0); b.addLeaf(hedge);
  const gl2 = new THREE.CylinderGeometry(R - 14, R - 14, 16, 22, 1, true); T(gl2, 0, 41, 0); b.addGlass(gl2);
  const roofSlab = new THREE.CylinderGeometry(R + 2, R + 2, 3, 26); T(roofSlab, 0, 50.5, 0); b.addCream(roofSlab, '#f9f3e3', '#dccfb1');
  const roof = new THREE.ConeGeometry(R + 10, 11, 26); T(roof, 0, 57, 0); const rp = roof.attributes.uv; for (let i = 0; i < rp.count; i++) rp.setXY(i, rp.getX(i) * 6, rp.getY(i) * 6); b.addSolar(roof);
  const garden = new THREE.TorusGeometry(R - 4, 3.4, 6, 24); garden.rotateX(Math.PI / 2); T(garden, 0, 52, 0); b.addLeaf(garden, '#b5ea70', '#4fae5c');
  b.flush(scene, new THREE.Vector3(x, y0, z), -faceAngle);
}

function arch(scene: THREE.Scene, x: number, z: number) {
  const b = new Batch(), y0 = heightAt(x, z), r = rng(21);
  const s = new THREE.Shape();
  s.moveTo(-175, 0); s.bezierCurveTo(-175, 92, -96, 122, 0, 122); s.bezierCurveTo(96, 122, 175, 92, 175, 0);
  s.lineTo(150, 0); s.bezierCurveTo(150, 74, 90, 98, 0, 98); s.bezierCurveTo(-90, 98, -150, 74, -150, 0); s.closePath();
  const ex = new THREE.ExtrudeGeometry(s, { depth: 46, bevelEnabled: true, bevelSize: 3, bevelThickness: 3, bevelSegments: 2, curveSegments: 18 }); ex.translate(0, 0, -23);
  b.addCream(ex, '#f9f3e3', '#d9cdb0');
  for (const sx of [-1, 1]) { const gp = new THREE.PlaneGeometry(70, 92, 1, 1); T(gp, sx * 112, 50, 0); b.addGlass(gp); }
  const top = (u: number) => { const t = u; const px = (1 - t) * (1 - t) * (1 - t) * -175 + 3 * (1 - t) * (1 - t) * t * -175 + 3 * (1 - t) * t * t * -96 + t * t * t * 0; return px; };
  void top;
  const ptsOnTop: [number, number][] = [];
  for (let i = 0; i <= 40; i++) { const u = i / 40, ang = Math.PI * u; const px = -Math.cos(ang) * 172, py = Math.sin(ang) * 120 + 2 * Math.sin(ang * 3); ptsOnTop.push([px, py]); }
  for (const [px, py] of ptsOnTop) for (let k = 0; k < 2; k++) {
    const blob = new THREE.IcosahedronGeometry(8 + r() * 8, 1); T(blob, px + (r() - 0.5) * 8, py + 2 + r() * 6, (r() - 0.5) * 32); b.addLeaf(blob, '#b8ea70', '#4fae5c');
  }
  for (let k = 0; k < 46; k++) {
    const u = r(), ang = Math.PI * u, px = -Math.cos(ang) * (u < 0.5 ? 172 : 172), py = Math.sin(ang) * 118, len = 12 + r() * 46, side = r() < 0.5 ? -1 : 1;
    const v = new THREE.BoxGeometry(2, len, 2); T(v, px + (r() - 0.5) * 10, py - len / 2 + 4, side * (22 + r() * 3)); b.addLeaf(v, '#7cc85a', '#2f8f52');
  }
  b.flush(scene, new THREE.Vector3(x, y0, z));
  const dg = new THREE.SphereGeometry(2.2, 6, 4), N = 60, im = new THREE.InstancedMesh(dg, new THREE.MeshLambertMaterial({ color: 0xffffff }), N), m = new THREE.Matrix4(), c = new THREE.Color();
  for (let i = 0; i < N; i++) { const [px, py] = ptsOnTop[Math.floor(r() * ptsOnTop.length)]; m.makeTranslation(x + px + (r() - 0.5) * 10, y0 + py + 12 + r() * 8, z + (r() - 0.5) * 34); im.setMatrixAt(i, m); im.setColorAt(i, c.set(['#ffb1c8', '#ffffff', '#ffe36e', '#e9d4ff'][Math.floor(r() * 4)])); }
  scene.add(im);
}

function gazebo(scene: THREE.Scene, x: number, z: number) {
  const b = new Batch(), y0 = 3;
  const deck = new THREE.CylinderGeometry(44, 44, 4, 6); T(deck, 0, y0, 0); b.addCream(deck, '#d9b385', '#9b6f46');
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; const p = new THREE.CylinderGeometry(1.8, 1.8, 40, 8); T(p, Math.cos(a) * 38, y0 + 22, Math.sin(a) * 38); b.addCream(p); }
  const roof = new THREE.ConeGeometry(54, 26, 6); T(roof, 0, y0 + 54, 0); b.addCream(roof, '#3aa0c4', '#2b7ba0');
  const rim = new THREE.TorusGeometry(46, 1.6, 6, 6); rim.rotateX(Math.PI / 2); T(rim, 0, y0 + 41, 0); b.addLeaf(rim);
  b.flush(scene, new THREE.Vector3(x, 0, z));
  const pier = PATHS[2].pts;                                       // boardwalk along the gazebo path, over the water
  const wood = MAT.wood;
  for (let i = 0; i < pier.length - 1; i++) {
    const [ax, az] = pier[i], [bx, bz] = pier[i + 1]; if (Math.hypot(bx - GAZEBO[0], bz - GAZEBO[1]) > 260) continue;
    const len = Math.hypot(bx - ax, bz - az), plank = new THREE.Mesh(new THREE.BoxGeometry(len, 2.4, 18), wood);
    plank.position.set((ax + bx) / 2, 2.4, (az + bz) / 2); plank.rotation.y = -Math.atan2(bz - az, bx - ax); plank.castShadow = plank.receiveShadow = true; scene.add(plank);
  }
}

function lampPosts(scene: THREE.Scene) {
  const spots: [number, number][] = [];
  PATHS.slice(0, 5).forEach(p => { for (let i = 0; i < p.pts.length - 1; i++) {
    const [ax, az] = p.pts[i], [bx, bz] = p.pts[i + 1], len = Math.hypot(bx - ax, bz - az), n = Math.floor(len / 80), nx = -(bz - az) / len, nz = (bx - ax) / len;
    for (let k = 0; k <= n; k++) { const t = n ? k / n : 0, side = (k + i) % 2 ? 1 : -1; const px = ax + (bx - ax) * t + nx * (p.half + 7) * side, pz = az + (bz - az) * t + nz * (p.half + 7) * side; if (heightAt(px, pz) > 2) spots.push([px, pz]); }
  } });
  const pole = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.1, 1.5, 24, 6), new THREE.MeshLambertMaterial({ color: '#f3ead6' }), spots.length);
  const lamp = new THREE.InstancedMesh(new THREE.BoxGeometry(5.5, 8, 5.5), MAT.lantern, spots.length), m = new THREE.Matrix4();
  spots.forEach(([x, z], i) => { const y = heightAt(x, z); m.makeTranslation(x, y + 12, z); pole.setMatrixAt(i, m); m.makeTranslation(x, y + 27, z); lamp.setMatrixAt(i, m); });
  pole.castShadow = true; scene.add(pole, lamp);
}

const turbines: THREE.Group[] = [];
function windTurbines(scene: THREE.Scene) {
  const spots: [number, number][] = [[700, -240], [800, -130], [880, -250], [640, -110], [940, -140]];
  spots.forEach(([x, z], i) => {
    const y = heightAt(x, z), g = new THREE.Group(); g.position.set(x, y, z);
    const mast = new THREE.Mesh(paint(new THREE.CylinderGeometry(2.4, 4.4, 120, 10), '#ffffff', '#dcd6c6'), MAT.cream); mast.position.y = 60; mast.castShadow = true; g.add(mast);
    const rotor = new THREE.Group(); rotor.position.set(0, 122, 6);
    const hub = new THREE.Mesh(new THREE.SphereGeometry(4.5, 10, 8), new THREE.MeshLambertMaterial({ color: '#e9b949' })); rotor.add(hub);
    for (let k = 0; k < 3; k++) { const bl = new THREE.Mesh(paint(new THREE.BoxGeometry(4.5, 62, 1.2), '#ffffff', '#eee8da'), MAT.cream); bl.position.y = 32; const holder = new THREE.Group(); holder.rotation.z = (k / 3) * Math.PI * 2; holder.add(bl); rotor.add(holder); bl.castShadow = true; }
    g.add(rotor); g.rotation.y = 0.5 + i * 0.3; (g as any).rotor = rotor; (g as any).speed = 0.9 + (i % 3) * 0.15; turbines.push(g); scene.add(g);
  });
}

const panels: THREE.Mesh[] = [];
function hologram(scene: THREE.Scene, x: number, y: number, z: number, seed: number) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(96, 60), new THREE.MeshBasicMaterial({ map: hologramTexture(seed), transparent: true, depthWrite: false, opacity: 0.92, side: THREE.DoubleSide, toneMapped: false }));
  m.position.set(x, y, z); (m as any).baseY = y; scene.add(m); panels.push(m);
}

/* ---------- assembly ---------- */
export function buildCampus(scene: THREE.Scene) {
  tower(scene, TOWER[0], TOWER[1]);
  dome(scene, DOME[0], DOME[1]);
  PAVILIONS.forEach(p => pavilion(scene, p[0], p[1], Math.atan2(PLAZA[1] - p[1], PLAZA[0] - p[0])));
  arch(scene, GATE[0], GATE[1]);
  gazebo(scene, GAZEBO[0], GAZEBO[1]);
  lampPosts(scene);
  windTurbines(scene);
  hologram(scene, GATE[0] - 205, heightAt(GATE[0], GATE[1]) + 70, GATE[1] - 30, 1);
  hologram(scene, TOWER[0] + 140, heightAt(TOWER[0], TOWER[1]) + 150, TOWER[1] + 120, 2);
  const p0 = PAVILIONS[0]; hologram(scene, p0[0] + 60, heightAt(p0[0], p0[1]) + 95, p0[1] + 30, 3);
  return {
    towerBeam, domeBeam,
    update(time: number, cam: THREE.Vector3) {
      for (const m of beamMats) m.uniforms.uTime.value = time;
      for (const g of turbines) (g as any).rotor.rotation.z = time * (g as any).speed;
      for (const p of panels) { p.rotation.y = Math.atan2(cam.x - p.position.x, cam.z - p.position.z); p.position.y = (p as any).baseY + Math.sin(time * 1.3 + p.position.x) * 3; }
    },
  };
}
