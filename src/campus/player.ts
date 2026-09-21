/* Hero: a small chibi visitor with a jetpack, built from primitives with a toon outline.
   Front is +z. Animation: walk cycle, arm swing, idle bob and a flickering jetpack flame. */
import * as THREE from 'three';

export function buildHero() {
  const g = new THREE.Group();
  const M = (c: string) => new THREE.MeshLambertMaterial({ color: c });
  const outlineMat = new THREE.MeshBasicMaterial({ color: '#0f2d2a', side: THREE.BackSide });
  const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, outline = true, k = 1.1) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m);
    if (outline) { const o = new THREE.Mesh(geo, outlineMat); o.scale.setScalar(k); o.position.copy(m.position); parent.add(o); }
    return m;
  };
  const body = new THREE.Group(); g.add(body);

  add(body, new THREE.CapsuleGeometry(4.8, 5, 4, 12), M('#33c2b0'), 0, 12.5, 0);                       // jacket
  add(body, new THREE.CylinderGeometry(4.9, 4.9, 1.6, 14), M('#ffb13b'), 0, 9.2, 0, false);              // belt
  add(body, new THREE.SphereGeometry(7.2, 20, 16), M('#f6d2b0'), 0, 25, 0);                              // head
  const hair = add(body, new THREE.SphereGeometry(7.55, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.52), M('#4a3128'), 0, 25.6, -0.5, false);
  hair.rotation.x = -0.28;
  add(body, new THREE.SphereGeometry(2.2, 8, 6), M('#4a3128'), 0, 30.8, 2.4, false);                    // fringe tuft
  for (const sx of [-1, 1]) {                                                                             // face
    add(body, new THREE.SphereGeometry(1.15, 8, 6), M('#1c1614'), sx * 2.7, 25, 6.7, false);
    add(body, new THREE.SphereGeometry(0.4, 6, 4), M('#ffffff'), sx * 2.5, 25.5, 7.6, false);
    add(body, new THREE.SphereGeometry(1.1, 8, 6), M('#ff9ea8'), sx * 4.3, 22.6, 5.6, false);
  }
  // jetpack: two tanks on the back with nozzles
  add(body, new THREE.BoxGeometry(9.5, 10, 3.6), M('#f0a025'), 0, 13.5, -6, true, 1.06);
  const flames: THREE.Mesh[] = [];
  for (const sx of [-1, 1]) {
    add(body, new THREE.CylinderGeometry(2.3, 2.3, 11, 10), M('#ffc247'), sx * 3.4, 14, -9.2, true, 1.08);
    add(body, new THREE.CylinderGeometry(1.3, 1.9, 2, 8), M('#2b6f78'), sx * 3.4, 7.6, -9.2, false);
    const f = new THREE.Mesh(new THREE.ConeGeometry(2.1, 11, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2, 0.6) }));
    f.position.set(sx * 3.4, 2, -9.2); f.rotation.x = Math.PI; g.add(f); flames.push(f);
  }
  // arms and legs pivot from the shoulders / hips
  const limb = (x: number, y: number, len: number, color: string, tip: string) => {
    const p = new THREE.Group(); p.position.set(x, y, 0); body.add(p);
    add(p, new THREE.CapsuleGeometry(1.9, len, 3, 8), M(color), 0, -len / 2 - 1, 0, true, 1.12);
    add(p, new THREE.SphereGeometry(2.2, 8, 6), M(tip), 0, -len - 2.4, 0.4, false);
    return p;
  };
  const armL = limb(-6.6, 16, 5, '#2aa596', '#f6d2b0'), armR = limb(6.6, 16, 5, '#2aa596', '#f6d2b0');
  const legL = limb(-2.6, 7.6, 3.4, '#2c4a6e', '#ffffff'), legR = limb(2.6, 7.6, 3.4, '#2c4a6e', '#ffffff');

  return {
    group: g,
    animate(t: number, moving: boolean, flying: boolean, speed: number) {
      const w = moving ? Math.sin(t * 11 * speed) : 0;
      legL.rotation.x = w * 0.8; legR.rotation.x = -w * 0.8;
      armL.rotation.x = flying ? -0.5 : -w * 0.7; armR.rotation.x = flying ? -0.5 : w * 0.7;
      body.position.y = (moving ? Math.abs(Math.sin(t * 11 * speed)) * 0.9 : Math.sin(t * 2) * 0.35);
      body.rotation.x = flying ? 0.18 : 0;
      for (const f of flames) { f.visible = flying; f.scale.set(1, 0.8 + Math.sin(t * 40) * 0.25, 1); }
      g.rotation.z = flying ? Math.sin(t * 3) * 0.05 : 0;
    },
  };
}
