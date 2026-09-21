/* Field pets: Kenney Cube Pets (CC0) roaming the meadows of the campus island.
   Each pet is a tiny state machine - it picks a nearby point of interest,
   walks or trots to it, sometimes hops, and idles. Getting too close sends
   it trotting away (the dog is the brave one). Models are normalized OBJs
   from the shared Kenney loader; gait is faked with bob + hop + lean, the
   models have no skeleton. */
import * as THREE from 'three';
import { loadKenneyModel } from '../assets/kenney-obj';
import { heightAt, coast, cover, pathEdgeDist } from './terrain';
import { ISLANDS, LAGOON, COLLIDERS } from './layout';

const SPECIES = {
  bunny:   { file: 'cube-pets/animal-bunny',   h: 12,  speed: 1.15, hoppy: 0.85, brave: 0.35 },
  cat:     { file: 'cube-pets/animal-cat',     h: 14,  speed: 1.0,  hoppy: 0.12, brave: 0.7 },
  dog:     { file: 'cube-pets/animal-dog',     h: 16,  speed: 1.0,  hoppy: 0.25, brave: 0.15 },
  fox:     { file: 'cube-pets/animal-fox',     h: 15,  speed: 1.25, hoppy: 0.5,  brave: 0.2 },
  penguin: { file: 'cube-pets/animal-penguin', h: 14,  speed: 0.7,  hoppy: 0.05, brave: 0.6 },
  parrot:  { file: 'cube-pets/animal-parrot',  h: 10,  speed: 0.9,  hoppy: 0.7,  brave: 0.1 },
} as const;
type SpeciesKey = keyof typeof SPECIES;

const MAT = new THREE.MeshLambertMaterial({ vertexColors: true });
const COARSE = matchMedia('(pointer:coarse)').matches;
const N_MAIN = COARSE ? 135 : 270;           // habitat pets on the main island
const N_PENGUINS = COARSE ? 12 : 27;         // lagoon colony
const PER_ISLET = 4;                         // residents per satellite islet
const FLEE_DIST = 90;
const ACTIVE_DIST = 2500;                    // beyond this a pet freezes (invisible-level detail)
const N_HERDS = COARSE ? 6 : 10;             // herd anchors on the main island

function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** species by habitat: bunnies and foxes like the dry fields, parrots the
    flower meadows, cats and dogs the grassy ground near campus */
function pickSpecies(cov: number, r: () => number): SpeciesKey {
  if (cov < 0.35) return r() < 0.55 ? 'bunny' : 'fox';
  if (cov > 0.65) return r() < 0.5 ? 'bunny' : (r() < 0.5 ? 'parrot' : 'cat');
  const pool: SpeciesKey[] = ['cat', 'dog', 'fox', 'bunny'];
  return pool[(r() * pool.length) | 0];
}

interface Pet {
  grp: THREE.Group;
  sp: SpeciesKey;
  x: number; z: number;
  heading: number;
  state: 'idle' | 'walk' | 'run' | 'flee' | 'hop';
  tLeft: number;
  yOff: number; vy: number;
  phase: number;
  herd?: number;                             // index into the herd anchors, loners have none
}

export function createPets(scene: THREE.Scene) {
  let ready = false;
  const pets: Pet[] = [];
  const geos = new Map<SpeciesKey, THREE.BufferGeometry>();

  const makePet = (sp: SpeciesKey, x: number, z: number, r: () => number, herd?: number) => {
    const geo = geos.get(sp); if (!geo) return;
    const grp = new THREE.Group();
    const mesh = new THREE.Mesh(geo, MAT); mesh.castShadow = true;
    grp.add(mesh);
    grp.position.set(x, heightAt(x, z), z);
    scene.add(grp);
    pets.push({ grp, sp, x, z, heading: r() * Math.PI * 2, state: 'idle', tLeft: 1 + r() * 3, yOff: 0, vy: 0, phase: r() * 7, herd });
  };

  const herds: [number, number][] = [];

  const place = (r: () => number) => {
    const fixed = N_PENGUINS + ISLANDS.length * PER_ISLET;
    /* herd anchors: most animals share a home range and drift back to it,
       so you meet flocks of bunnies or a pack of foxes instead of lone strays */
    for (let h = 0; h < N_HERDS; h++) {
      let ok = false;
      for (let tries = 0; tries < 300 && !ok; tries++) {
        const x = (r() * 2 - 1) * 6200, z = (r() * 2 - 1) * 4200;
        if (coast(x, z) > 0.2 && heightAt(x, z) > 9 && heightAt(x, z) < 60 && pathEdgeDist(x, z) > 60) { herds.push([x, z]); ok = true; }
      }
      if (!ok) herds.push([0, -2000 - h * 900]);
    }
    /* penguin colony waddling around the lagoon shore */
    for (let i = 0; i < N_PENGUINS; i++) {
      const a = r() * Math.PI * 2, d = 220 + r() * 160;
      makePet('penguin', LAGOON[0] + Math.cos(a) * d, LAGOON[1] + Math.sin(a) * d * 0.8, r);
    }
    /* residents per satellite islet, different species */
    const roster: SpeciesKey[] = ['penguin', 'cat', 'dog', 'bunny', 'fox', 'parrot'];
    ISLANDS.forEach((is, i) => {
      for (let k = 0; k < PER_ISLET; k++) {
        const a = r() * Math.PI * 2, d = r() * is.r * 0.5;
        makePet(roster[(i * 2 + k) % roster.length], is.x + Math.cos(a) * d, is.z + Math.sin(a) * d, r);
      }
    });
    /* herds on the main island: 3-7 animals, mostly one species per herd */
    herds.forEach(([hx, hz], h) => {
      const n = 3 + ((r() * 5) | 0);
      const lead = pickSpecies(cover(hx, hz), r);
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2, d = 40 + r() * 220;
        const sp = r() < 0.8 ? lead : pickSpecies(cover(hx, hz), r);
        makePet(sp, hx + Math.cos(a) * d, hz + Math.sin(a) * d, r, h);
      }
    });
    /* loners fill the rest by habitat */
    for (let tries = 0; pets.length < N_MAIN + fixed && tries < 40000; tries++) {
      const x = (r() * 2 - 1) * 6600, z = (r() * 2 - 1) * 4600;
      if (coast(x, z) < 0.14 || heightAt(x, z) < 8 || heightAt(x, z) > 70) continue;
      if (pathEdgeDist(x, z) < 14) continue;
      makePet(pickSpecies(cover(x, z), r), x, z, r);
    }
  };

  loadKenneyModel(SPECIES.bunny.file, SPECIES.bunny.h).then(g => { if (g) geos.set('bunny', g); return g; })
    .then(() => Promise.all((Object.keys(SPECIES) as SpeciesKey[]).map(sp =>
      geos.has(sp) ? Promise.resolve(geos.get(sp)!) : loadKenneyModel(SPECIES[sp].file, SPECIES[sp].h).then(g => { if (g) geos.set(sp, g); }))))
    .then(() => { place(rng(20260922)); ready = true; })
    .catch(e => console.warn('pets failed to load:', e));

  const WALK = 14, RUN = 42, FLEE = 60;

  function update(dt: number, t: number, px: number, pz: number) {
    if (!ready) return 0;
    let near = 0;
    for (const p of pets) {
      const S = SPECIES[p.sp];
      const pd = Math.hypot(p.x - px, p.z - pz);
      if (pd > ACTIVE_DIST) continue;                    // far away: freeze (tiny on screen)
      if (pd < 300) near++;                                        // for the HUD stats panel
      /* a visitor getting close sends the shy ones scooting */
      if (pd < FLEE_DIST * S.brave && p.state !== 'flee') {
        p.state = 'flee'; p.tLeft = 1 + Math.random() * 0.8;
        p.heading = Math.atan2(p.x - px, p.z - pz) + (Math.random() - 0.5) * 0.6;
      }
      p.tLeft -= dt;
      if (p.state === 'flee' && p.tLeft <= 0) {                 // calm down once the visitor backs off
        if (pd > FLEE_DIST * 1.2 || p.tLeft < -2) { p.state = 'idle'; p.tLeft = 0.6 + Math.random() * 1.5; }
      }
      if (p.tLeft <= 0 && p.state !== 'flee') {
        const roll = Math.random();
        if (roll < 0.42) { p.state = 'idle'; p.tLeft = 1.5 + Math.random() * 3.5; }
        else if (roll < 0.85) { p.state = 'walk'; p.tLeft = 2 + Math.random() * 4; if (p.herd !== undefined && Math.random() < 0.65) { const [cx, cz] = herds[p.herd]; p.heading = Math.atan2(cx - p.x, cz - p.z) + (Math.random() - 0.5) * 1.4; } else p.heading += (Math.random() - 0.5) * 2.4; }
        else if (roll < 0.95) { p.state = 'run'; p.tLeft = 0.8 + Math.random() * 1.2; p.heading += (Math.random() - 0.5) * 1.6; }
        else if (p.yOff === 0) { p.state = 'hop'; p.tLeft = 0.4; p.vy = 10 * Math.sqrt(S.h); }   // hop impulse scales with size
      }
      const moving = p.state === 'walk' || p.state === 'run' || p.state === 'flee';
      if (moving) {
        const sp = (p.state === 'walk' ? WALK : p.state === 'run' ? RUN : FLEE) * S.speed * dt;
        const nx = p.x + Math.sin(p.heading) * sp, nz = p.z + Math.cos(p.heading) * sp;
        if (coast(nx, nz) > 0.08 && pathEdgeDist(nx, nz) > 8 && heightAt(nx, nz) > 4) { p.x = nx; p.z = nz; }
        else p.heading += Math.PI * (0.7 + Math.random() * 0.5);          // bounce off shore/paths
        for (const [cx, cz, cr] of COLLIDERS) {                            // don't walk through buildings
          const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz), lim = cr + 14;
          if (d < lim) { const k = lim / (d || 1); p.x = cx + dx * k; p.z = cz + dz * k; }
        }
      }
      /* hop physics: bunnies and parrots hop constantly, others rarely */
      if (p.yOff > 0 || (moving && Math.random() < S.hoppy * dt * (p.state === 'flee' ? 6 : 2))) {
        if (p.yOff === 0) p.vy = 10 * Math.sqrt(S.h);
        p.vy -= 110 * dt; p.yOff = Math.max(0, p.yOff + p.vy * dt);
      }
      const bob = moving ? Math.abs(Math.sin(t * (p.state === 'walk' ? 7 : 13) + p.phase)) * 0.7
                         : Math.sin(t * 2 + p.phase) * 0.12;               // idle breathing
      p.grp.position.set(p.x, heightAt(p.x, p.z) + p.yOff + bob, p.z);
      p.grp.rotation.y = p.heading;
      p.grp.rotation.z = moving && p.state !== 'walk' ? Math.sin(t * 13 + p.phase) * 0.07 : 0;
    }
    return near;
  }

  /** live population per species, for the HUD wildlife panel */
  function census(): Record<string, number> {
    const m: Record<string, number> = {};
    for (const p of pets) m[p.sp] = (m[p.sp] || 0) + 1;
    return m;
  }

  return { update, census, expected: N_MAIN + N_PENGUINS + ISLANDS.length * PER_ISLET };
}
