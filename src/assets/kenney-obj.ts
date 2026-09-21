/* Kenney OBJ+MTL parsing (flat per-face Kd colours, no textures).
   Shared by the legacy tile world (assets/loaders.ts) and the campus scene. */
import * as THREE from 'three';

export function parseKenneyOBJ(objText: string, mtlText: string, targetH: number): THREE.BufferGeometry | null {
  const pal: Record<string, [number, number, number]> = {};
  let cur: string | null = null;
  for (const ln of mtlText.split('\n')) {
    const p = ln.trim().split(/\s+/);
    if (p[0] === 'newmtl') cur = p[1];
    else if (p[0] === 'Kd' && cur) pal[cur] = [+p[1], +p[2], +p[3]];
  }
  const V: number[][] = [], N: number[][] = [];
  const pos: number[] = [], nor: number[] = [], col: number[] = [], idx: number[] = [];
  const seen = new Map<string, number>();
  let rgb: [number, number, number] = [1, 1, 1];
  const vk = (key: string) => {
    let id = seen.get(key);
    if (id === undefined) {
      const q = key.split('/'), vi = +q[0] - 1;
      if (vi < 0 || vi >= V.length || isNaN(vi)) return 0;
      const v = V[vi]; if (!v || v.length < 3) return 0;
      const nvi = q[2] ? +q[2] - 1 : -1;
      const n = nvi >= 0 && nvi < N.length ? N[nvi] : null;
      if (isNaN(v[0]) || isNaN(v[1]) || isNaN(v[2])) return 0;
      id = pos.length / 3;
      pos.push(v[0], v[1], v[2]);
      nor.push(n ? n[0] : 0, n ? n[1] : 1, n ? n[2] : 0);
      col.push(rgb[0], rgb[1], rgb[2]);
      seen.set(key, id);
    }
    return id;
  };
  for (const ln of objText.split('\n')) {
    const p = ln.trim().split(/\s+/);
    if (p[0] === 'v') V.push([+p[1], +p[2], +p[3]]);
    else if (p[0] === 'vn') N.push([+p[1], +p[2], +p[3]]);
    else if (p[0] === 'usemtl') rgb = pal[p[1]] || [1, 1, 1];
    else if (p[0] === 'f') {
      const vs = p.slice(1);
      for (let k = 1; k < vs.length - 1; k++) idx.push(vk(vs[0]), vk(vs[k]), vk(vs[k + 1]));
    }
  }
  let mn = 1e9, mx = -1e9;
  for (let i = 1; i < pos.length; i += 3) { if (pos[i] < mn) mn = pos[i]; if (pos[i] > mx) mx = pos[i]; }
  if (pos.length < 9 || idx.length < 3) return null;
  const range = mx - mn;
  const s = range > 0.001 ? targetH / range : 1;
  for (let i = 0; i < pos.length; i++) pos[i] *= s;
  for (let i = 0; i < pos.length; i++) { if (isNaN(pos[i])) return null; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

/** Fetch and parse one Kenney model as a normalized BufferGeometry. */
export function loadKenneyModel(file: string, targetH: number, base = 'assets/kenney/'): Promise<THREE.BufferGeometry | null> {
  return Promise.all([
    fetch(base + file + '.obj').then(r => { if (!r.ok) throw 0; return r.text(); }),
    fetch(base + file + '.mtl').then(r => { if (!r.ok) throw 0; return r.text(); }),
  ]).then(([o, m]) => parseKenneyOBJ(o, m, targetH)).catch(e => { console.warn('loadKenneyModel fail:', file, e); return null; });
}
