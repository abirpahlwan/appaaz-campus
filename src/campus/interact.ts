/* Interaction spots: places the 26 content panels on the campus, draws a waypoint marker
   (pedestal, orb, beam, name label) for each, and reports which one the visitor is near.
   Markers turn from teal to amber once a panel has been opened. */
import * as THREE from 'three';
import { objs } from '../world/objects';
import { PAVILIONS, PLAZA, GATE, TOWER, DOME, GAZEBO } from './layout';
import { heightAt, coast } from './terrain';
import { makeBeam } from './buildings';

interface Spot { id: string; x: number; z: number; r: number; }

function snapToLand(x: number, z: number) {                        // nearest dry spot away from the shore
  if (coast(x, z) > 0.07) return [x, z];
  for (let d = 30; d < 900; d += 30) for (let a = 0; a < 6.28; a += 0.5) { const px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d; if (coast(px, pz) > 0.07 && heightAt(px, pz) > 8) return [px, pz]; }
  return [x, z];
}
function around(c: [number, number], r: number, i: number, n: number): [number, number] { const a = (i / n) * Math.PI * 2 + 0.6; return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]; }

export function layoutSpots(): Spot[] {
  const S: Spot[] = [];
  const add = (id: string, p: number[], r = 58) => S.push({ id, x: p[0], z: p[1], r });
  add('about', [GATE[0] + 70, GATE[1] - 120]);
  ['c1', 'c2', 'cb', 'c3', 'c5', 'play'].forEach((id, i) => {       // in front of each pavilion, facing the plaza
    const p = PAVILIONS[i], dx = PLAZA[0] - p[0], dz = PLAZA[1] - p[1], l = Math.hypot(dx, dz);
    add(id, [p[0] + (dx / l) * 78, p[1] + (dz / l) * 78], 62);
  });
  ['m1', 'm2', 'm3', 'm4'].forEach((id, i) => add(id, around(DOME, 104, i, 4), 52));
  add('systems', snapToLand(600, -30));
  add('craft', [-320, 215]);
  add('xr', [46, 560]); add('ar', [-46, 470]); add('brand', [46, 385]);
  add('exp', [GAZEBO[0] + 6, GAZEBO[1]], 70);
  add('side', [TOWER[0] + 6, TOWER[1] + 108], 70);
  add('contact', [TOWER[0] + 96, TOWER[1] + 70], 60);
  add('blog', [GATE[0] - 165, GATE[1] - 80]);
  add('railway', [430, 55]); add('mountain', snapToLand(800, -170));
  add('aircraft', snapToLand(1000, 180)); add('rocket', snapToLand(180, -560));
  add('dam', snapToLand(-390, 400)); add('garden', snapToLand(-300, -330));
  return S;
}

const TEAL = new THREE.Color(0.6, 2.8, 2.6), AMBER = new THREE.Color(3, 2.1, 0.5);

function labelSprite(text: string) {
  const c = document.createElement('canvas'); c.width = 320; c.height = 72; const g = c.getContext('2d')!;
  g.fillStyle = 'rgba(14,42,38,0.86)'; g.beginPath(); g.roundRect(4, 6, 312, 58, 29); g.fill();
  g.strokeStyle = 'rgba(120,240,230,0.9)'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#eafff8'; g.font = '600 28px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 160, 36, 292);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, opacity: 0, sizeAttenuation: false }));
  sp.scale.set(0.21, 0.047, 1); return sp;                     // screen-relative size, readable at any distance
}

export function buildInteractables(scene: THREE.Scene) {
  const spots = layoutSpots(), byId = new Map(objs.map((o: any) => [o.id, o]));
  const items = spots.map(s => {
    const o = byId.get(s.id); if (!o) return null;
    const y = heightAt(s.x, s.z), g = new THREE.Group(); g.position.set(s.x, y, s.z);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 6, 8, 10), new THREE.MeshLambertMaterial({ color: '#f3ead6' })); ped.position.y = 4; ped.castShadow = true; g.add(ped);
    const mat = new THREE.MeshBasicMaterial({ color: TEAL.clone() }); const orb = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 8), mat); orb.position.y = 16; g.add(orb);
    const beam = makeBeam('#33d1c0', 150, 2, 7); beam.position.y = 8 + 75; g.add(beam);
    const label = labelSprite(String(o.label || o.title)); label.position.y = 40; g.add(label);
    scene.add(g);
    return { s, o, g, orb, mat, beam, label, seen: false };
  }).filter(Boolean) as any[];

  const seenAll = (ids: string[]) => ids.every(id => (byId.get(id) as any)?.seen);
  return {
    /** returns the panel object the visitor is standing next to, or null */
    update(px: number, pz: number, alt: number, time: number, towerBeam: THREE.Mesh, domeBeam: THREE.Mesh) {
      let best: any = null, bd = 1e9;
      for (const it of items) {
        const d = Math.hypot(px - it.s.x, pz - it.s.z);
        if (d < it.s.r && d < bd && alt < heightAt(px, pz) + 34) { best = it.o; bd = d; }
        if (it.o.seen !== it.seen) { it.seen = it.o.seen; it.mat.color.copy(it.seen ? AMBER : TEAL); (it.beam.material as THREE.ShaderMaterial).uniforms.uColor.value.set(it.seen ? '#ffb13b' : '#33d1c0'); }
        it.orb.position.y = 16 + Math.sin(time * 2 + it.s.x) * 1.6;
        const o = d < 260 ? 1 : d > 440 ? 0 : 1 - (d - 260) / 180;
        (it.label.material as THREE.SpriteMaterial).opacity += (o - (it.label.material as THREE.SpriteMaterial).opacity) * 0.15;
        it.label.visible = (it.label.material as THREE.SpriteMaterial).opacity > 0.02;
      }
      const setBeam = (m: THREE.Mesh, done: boolean) => (m.material as THREE.ShaderMaterial).uniforms.uColor.value.set(done ? '#ffb13b' : '#33d1c0');
      setBeam(towerBeam, seenAll(['side', 'contact'])); setBeam(domeBeam, seenAll(['m1', 'm2', 'm3', 'm4']));
      return best;
    },
  };
}
export { DOME as _DOME };
