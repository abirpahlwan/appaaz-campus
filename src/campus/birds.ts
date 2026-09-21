/* Flying birds: cheap procedural low-poly birds (body + hinged flapping wings)
   riding circular paths over the island. Four species with different sizes,
   colours, altitudes and habitats - gulls hug the coast, herons stalk the
   lagoon, sparrows wheel over the campus, crows roam everywhere. They glide
   between flapping bursts. Built from boxes, so no model files are needed. */
import * as THREE from 'three';
import { coast } from './terrain';
import { LAGOON } from './layout';

const COARSE = matchMedia('(pointer:coarse)').matches;

interface BirdSpec {
  scale: number; body: string; wing: string;
  n: number; alt: [number, number]; radius: [number, number];
  flap: number; glide: boolean;
  anchor: (r: () => number) => [number, number];
}

function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const randLand = (r: () => number, minCoast: number, span = 7000): [number, number] => {
  for (let i = 0; i < 200; i++) {
    const x = (r() * 2 - 1) * span, z = (r() * 2 - 1) * span * 0.7;
    if (coast(x, z) > minCoast) return [x, z];
  }
  return [0, 0];
};

const SPECS: Record<string, BirdSpec> = {
  sparrow: { scale: 0.55, body: '#7a5a3f', wing: '#5d412c', n: 16, alt: [50, 110], radius: [120, 400], flap: 11, glide: true,
             anchor: r => randLand(r, 0.25, 3200) },
  gull:    { scale: 1.0,  body: '#f4f6f5', wing: '#c9d4d8', n: 12, alt: [70, 160], radius: [300, 900], flap: 6, glide: true,
             anchor: r => { for (let i = 0; i < 200; i++) { const x = (r() * 2 - 1) * 7500, z = (r() * 2 - 1) * 5500; const c = coast(x, z); if (c > -0.05 && c < 0.1) return [x, z]; } return [0, 4200]; } },
  crow:    { scale: 0.9,  body: '#26262c', wing: '#3a3a44', n: 8, alt: [110, 260], radius: [400, 1300], flap: 5, glide: true,
             anchor: r => randLand(r, 0.1) },
  heron:   { scale: 1.5,  body: '#b8c4c9', wing: '#8fa3ab', n: 4, alt: [40, 90], radius: [150, 450], flap: 3.4, glide: false,
             anchor: r => { const a = r() * Math.PI * 2, d = 260 + r() * 500; return [LAGOON[0] + Math.cos(a) * d, LAGOON[1] + Math.sin(a) * d]; } },
};

interface Bird {
  name: string;
  grp: THREE.Group; wl: THREE.Mesh; wr: THREE.Mesh;
  ax: number; az: number; alt: number;
  radius: number; omega: number; a0: number;
  flapSp: number; phase: number; glide: boolean;
  driftX: number; driftZ: number;
}

export function createBirds(scene: THREE.Scene) {
  const birds: Bird[] = [];
  const r = rng(20260922);
  const N = COARSE ? 0.5 : 1;

  for (const [name, S] of Object.entries(SPECS)) {
    const bodyMat = new THREE.MeshLambertMaterial({ color: S.body });
    const wingMat = new THREE.MeshLambertMaterial({ color: S.wing });
    const k = Math.round(S.n * N);
    for (let i = 0; i < k; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 3.4), bodyMat);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.3, 4), new THREE.MeshLambertMaterial({ color: '#e0a33c' }));
      beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.1, 2.2);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.35, 1.6), wingMat);
      tail.position.set(0, 0.15, -2.2);
      const wingGeo = new THREE.BoxGeometry(5.4, 0.3, 2.1); wingGeo.translate(2.7, 0, 0);   // hinge at the body edge
      const wl = new THREE.Mesh(wingGeo, wingMat);
      const wr = new THREE.Mesh(wingGeo, wingMat); wr.rotation.y = Math.PI;                 // mirrored to the other side
      g.add(body, beak, tail, wl, wr);
      const [ax, az] = S.anchor(r);
      const alt = S.alt[0] + r() * (S.alt[1] - S.alt[0]);
      g.scale.setScalar(S.scale * (0.85 + r() * 0.3));
      g.position.set(ax, alt, az);
      scene.add(g);
      birds.push({
        name,
        grp: g, wl, wr,
        ax, az, alt,
        radius: S.radius[0] + r() * (S.radius[1] - S.radius[0]),
        omega: (0.14 + r() * 0.2) * (r() < 0.5 ? 1 : -1),          // rad/s, some fly clockwise
        a0: r() * Math.PI * 2,
        flapSp: S.flap * (0.85 + r() * 0.3), phase: r() * 7,
        glide: S.glide,
        driftX: (r() - 0.5) * 8, driftZ: (r() - 0.5) * 8,          // slow anchor wander
      });
    }
  }

  function update(dt: number, t: number) {
    for (const b of birds) {
      b.a0 += b.omega * dt;
      const x = b.ax + b.driftX * t * 0.05 + Math.cos(b.a0) * b.radius;
      const z = b.az + b.driftZ * t * 0.05 + Math.sin(b.a0) * b.radius;
      const y = b.alt + Math.sin(t * 0.5 + b.phase) * 8;
      b.grp.position.set(x, y, z);
      b.grp.rotation.y = b.a0 + (b.omega > 0 ? -Math.PI / 2 : Math.PI / 2);   // face along the path
      b.grp.rotation.z = -Math.sin(t * 0.23 + b.phase) * 0.25;                // banking into the turn
      /* flap or glide: bursts of flapping broken up by gliding stretches */
      const gliding = b.glide && Math.sin(t * 0.35 + b.phase * 2) > 0.45;
      const f = gliding ? 0.12 : Math.sin(t * b.flapSp + b.phase) * 0.55;
      b.wl.rotation.z = f; b.wr.rotation.z = -f;
    }
  }

  function census(): Record<string, number> {
    const m: Record<string, number> = {};
    for (const b of birds) m[b.name] = (m[b.name] || 0) + 1;
    return m;
  }

  return { update, census, expected: birds.length };
}
