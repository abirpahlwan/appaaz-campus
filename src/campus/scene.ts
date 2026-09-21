/* Campus scene (preview). Enabled with ?scene=campus while the new world is being built.
   Reuses the sky, ocean, post-processing, look and quality systems. */
import * as THREE from 'three';
import { $S, $R } from '../core/state';
import { AudioManager } from '../core/audio';
import { keys, P } from '../entities/player';
import { LOOK, sunDirection } from '../render/look';
import { createSky } from '../render/sky';
import { createOcean, buildShoreTexture } from '../render/ocean';
import { createPost } from '../render/post';
import { quality, tickQuality } from '../render/quality';
import { initDevPanel, SHOTS } from '../render/devpanel';
import { WORLD, SPAWN, GAZEBO, PATHS, COLLIDERS, GATE, PLAZA, LAGOON } from './layout';
import { buildTerrain, buildLandGrid, heightAt, coast, pathEdgeDist } from './terrain';
import { buildFoliage } from './foliage';
import { buildHero } from './player';
import { buildCampus } from './buildings';
import { buildInteractables } from './interact';
import { createPets } from './pets';
import { createBirds } from './birds';
import { objs } from '../world/objects';

function onBoardwalk(x: number, z: number) {
  if (Math.hypot(x - GAZEBO[0], z - GAZEBO[1]) < 46) return true;
  const p = PATHS[2].pts;
  for (let i = 0; i < p.length - 1; i++) {
    if (Math.hypot(p[i + 1][0] - GAZEBO[0], p[i + 1][1] - GAZEBO[1]) > 260) continue;
    const dx = p[i + 1][0] - p[i][0], dz = p[i + 1][1] - p[i][1], l2 = dx * dx + dz * dz, t = Math.max(0, Math.min(1, ((x - p[i][0]) * dx + (z - p[i][1]) * dz) / l2));
    if (Math.hypot(x - (p[i][0] + dx * t), z - (p[i][1] + dz * t)) < 10) return true;
  }
  return false;
}
const groundAt = (x: number, z: number) => onBoardwalk(x, z) ? Math.max(heightAt(x, z), 4.6) : heightAt(x, z);

/* --- audio helpers: footstep surface + ambience zone weights --- */
function surfaceAt(x: number, z: number): 'grass' | 'sand' | 'stone' | 'wood' {
  if (onBoardwalk(x, z)) return 'wood';
  if (pathEdgeDist(x, z) < 2) return 'stone';
  if (heightAt(x, z) < 3.2 || coast(x, z) < 0.085) return 'sand';
  return 'grass';
}
const sstep = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function zonesAt(x: number, z: number, alt: number, ground: number) {
  const c = coast(x, z);
  const lagD = Math.hypot(x - LAGOON[0], z - LAGOON[1]);
  const lagoon = Math.exp(-((lagD / 340) ** 2));
  const plazaD = Math.hypot(x - PLAZA[0], z - PLAZA[1]);
  const plaza = Math.exp(-((plazaD / 420) ** 2));
  const ridge = sstep(42, 85, ground);
  const airFade = 1 - sstep(60, 260, alt - ground);
  const inland = sstep(0.08, 0.2, c);
  return {
    sea: 0, // sea bed muted for testing
    lagoon: lagoon * (0.4 + 0.6 * airFade),
    ridge: Math.max(ridge, sstep(120, 400, alt - ground) * 0.7),
    meadow: inland * (1 - lagoon * 0.7) * airFade,
    plaza: plaza * airFade,
    birds: inland * (1 - lagoon * 0.8) * (1 - ridge) * airFade,
  };
}

export function startCampus() {
  const cv = document.createElement('canvas'); cv.id = 'game3d'; cv.style.cssText = 'position:fixed;inset:0;display:block;';
  document.body.appendChild(cv);
  const g2d = document.getElementById('game'); if (g2d) g2d.style.display = 'none';
  const mm = document.getElementById('minimap'); if (mm) mm.style.display = 'none';

  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = LOOK.exposure;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 2, 70000);
  scene.background = new THREE.Color(LOOK.skyHorizon);
  scene.fog = new THREE.Fog(LOOK.fogColor, LOOK.fogNear, LOOK.fogFar);

  const sky = createSky(); scene.add(sky.mesh);
  const land = buildLandGrid(50);
  const shore = buildShoreTexture(land.map, 1, land.w, land.h);
  const ocean = createOcean({ world: new THREE.Vector2(WORLD.w, WORLD.d), tile: land.cell, shore, size: new THREE.Vector2(120000, 120000) });
  scene.add(ocean.mesh);
  const terrain = buildTerrain(24); scene.add(terrain);
  const foliage = buildFoliage(scene);
  const campus = buildCampus(scene);
  objs.forEach((o: any) => { if (o.kind === 'landmark') o.kind = 'landmark-campus'; });
  const interact = buildInteractables(scene);
  const pets = createPets(scene);
  const birds = createBirds(scene);
  $S.campusMode = true;

  const sun = new THREE.DirectionalLight(LOOK.sunColor, LOOK.sunIntensity);
  sun.castShadow = true;
  const sc = sun.shadow.camera; sc.left = -430; sc.right = 430; sc.top = 430; sc.bottom = -430; sc.near = 10; sc.far = 2200;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 1.5;
  sun.shadow.mapSize.set(quality.tier.shadowMap, quality.tier.shadowMap);
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(LOOK.hemiSky, LOOK.hemiGround, LOOK.hemiIntensity); scene.add(hemi);

  const hero = buildHero(); scene.add(hero.group);
  const pl = { x: SPAWN[0], z: SPAWN[1], alt: 0, vy: 0, yaw: 0, face: Math.PI, moving: false, flying: false, hover: false, groundY: 0 };
  const camS = new THREE.Vector3(pl.x, heightAt(pl.x, pl.z), pl.z);
  let yaw = 0;

  /* mouse: drag to orbit, wheel to zoom. Touch is handled separately:
     hud-controls turns any non-stick touch into $S.touchLook deltas and
     two fingers into a pinch-zoom, so the stick and orbit can coexist. */
  const coarse = matchMedia('(pointer:coarse)').matches;
  const fb = document.getElementById('flypad'); if (fb) fb.style.display = coarse ? 'flex' : 'none';   // jetpad buttons, campus edition
  let drag = false, lx = 0;
  cv.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') return; drag = true; lx = e.clientX; cv.setPointerCapture(e.pointerId); });
  addEventListener('pointerup', e => { if (e.pointerType !== 'touch') drag = false; });
  addEventListener('pointermove', e => { if (drag && e.pointerType !== 'touch') { yaw -= (e.clientX - lx) * 0.006; lx = e.clientX; } });
  let pinch = null;
  cv.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      pinch = { d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY), dist: $S.camDist };
      $R.endTouchControls && $R.endTouchControls();        // zoom, don't steer
    }
  }, { passive: true });
  cv.addEventListener('touchmove', e => {
    if (pinch && e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      $S.camDist = Math.min(2000, Math.max(200, pinch.dist * pinch.d / Math.max(1, d)));
      syncCamDistUi();
    }
  }, { passive: true });
  cv.addEventListener('touchend', () => { pinch = null; }, { passive: true });
  cv.addEventListener('wheel', e => { $S.camDist = Math.min(2000, Math.max(200, $S.camDist * (1 + Math.sign(e.deltaY) * 0.08))); syncCamDistUi(); }, { passive: true });
  function syncCamDistUi() {
    const el = document.getElementById('camDist') as HTMLInputElement;
    if (el) { el.value = String(Math.round(2200 - $S.camDist)); const v = document.getElementById('camDistVal'); if (v) v.textContent = String(Math.round($S.camDist)); }   // slider is inverted
  }

  const post = createPost(renderer, scene, cam);
  function size() { post.resize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
  size(); addEventListener('resize', size);
  function applyQuality() {
    post.applyTier();
    const n = quality.tier.shadowMap;
    if (sun.shadow.mapSize.x !== n) { sun.shadow.map?.dispose(); (sun.shadow as any).map = null; sun.shadow.mapSize.set(n, n); }
  }
  initDevPanel({ onChange: applyQuality, captureShots: () => { $S.shotJob = { i: 0, frames: 0, saved: null }; } });

  /* --- HUD wildlife panel: species + counts, built once pets load --- */
  const stAnimals = document.getElementById('stAnimals');
  let censusBuilt = false;
  const SP_EMOJI: Record<string, string> = {
    bunny: '🐰', fox: '🦊', cat: '🐱', dog: '🐶', parrot: '🦜', penguin: '🐧',
    sparrow: '🐦', gull: '🕊️', crow: '🐦‍⬛', heron: '🦩',
  };

  const key = (k: string) => !!(keys as any)[k];
  let last = performance.now();
  let stepAcc = 0, prevX = SPAWN[0], prevZ = SPAWN[1], wasAir = false, peakAir = 0;
  const sd = new THREE.Vector3();
  function frame(now: number) {
    requestAnimationFrame(frame);
    const dtMs = now - last; last = now; const dt = Math.min(0.05, dtMs / 1000), t = now / 1000;

    /* --- movement (relative to the camera) ---
       Keyboard gives unit steps; the touch stick gives an analog vector
       (x right, y down in screen space). Both are rotated by the camera
       yaw, so stick-up always walks away from the camera. */
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    let mx = 0, mz = 0;
    if (key('w') || key('arrowup'))    { mx += fx; mz += fz; }
    if (key('s') || key('arrowdown'))  { mx -= fx; mz -= fz; }
    if (key('d') || key('arrowright')) { mx += rx; mz += rz; }
    if (key('a') || key('arrowleft'))  { mx -= rx; mz -= rz; }
    const tv = $S.touchVec || { x: 0, y: 0 };                            // stick: screen-space analog vector
    mx += tv.x * rx - tv.y * fx;
    mz += tv.x * rz - tv.y * fz;
    if (coarse) { yaw -= $S.touchLook.x * 0.006; $S.touchLook.x = 0; }   // consume orbit deltas so they never pile up
    const len = Math.hypot(mx, mz); pl.moving = len > 0.08;
    const introOn = (document.getElementById('intro') as HTMLElement).style.display !== 'none';
    const modalOn = document.getElementById('modal')!.classList.contains('on');
    if (introOn || modalOn) { mx = 0; mz = 0; pl.moving = false; }
    const ground = groundAt(pl.x, pl.z);
    if (Math.hypot(mx, mz) > 0) {
      const mag = Math.min(1, len);                                      // analog magnitude (keyboard is already unit)
      const sp = 95 * (P.speed || 1.5) / 1.5 * (pl.alt > ground + 3 ? 1.6 : 1) * dt;
      const nx = pl.x + (mx / len) * sp * mag, nz = pl.z + (mz / len) * sp * mag, nh = groundAt(nx, nz);
      if (nh > 0.8 || pl.alt > nh + 4) { pl.x = nx; pl.z = nz; }          // no wading into the sea unless flying
      pl.face = Math.atan2(mx, mz);
    }
    for (const [cx, cz, cr, ch] of COLLIDERS) {                            // solid buildings
      const dx = pl.x - cx, dz = pl.z - cz, d = Math.hypot(dx, dz), lim = cr + 8;
      if (d < lim && pl.alt < heightAt(cx, cz) + ch) { const k = lim / (d || 1); pl.x = cx + dx * k; pl.z = cz + dz * k; }
    }
    /* --- altitude: hold = jetpack; releasing mid-air hovers in place --- */
    const fly = (key(' ') || key('z')) && !introOn && !modalOn, down = fly && key('shift');
    const g0 = groundAt(pl.x, pl.z); pl.groundY = g0; pl.flying = fly ? !down : pl.alt > g0 + 0.5;
    if (fly && !down) { pl.vy = Math.min(190, pl.vy + 300 * dt); pl.hover = true; }
    else if (down) { pl.vy = Math.max(-140, pl.vy - 260 * dt); pl.hover = true; }
    else if (pl.hover) pl.vy = pl.alt - g0 < 1 ? -10 : 0;   // hover: hold altitude (settle the last inch)
    else pl.vy = Math.max(-160, pl.vy - 230 * dt);          // walked off an edge: normal fall
    pl.alt = Math.min(900, Math.max(g0, (pl.alt || g0) + pl.vy * dt));
    if (pl.alt <= g0) { pl.alt = g0; pl.vy = 0; pl.hover = false; }
    hero.group.position.set(pl.x, pl.alt + (pl.hover ? Math.sin(t * 1.7) * 2.2 : 0), pl.z);
    hero.group.rotation.y = pl.face;
    hero.animate(t, pl.moving && pl.alt <= g0 + 1, pl.flying, P.speed || 1.5);

    /* --- audio: zoned ambience, footsteps by surface, jetpack, landing --- */
    const above = pl.alt - g0;
    AudioManager.setJetpack(fly);
    const moved = Math.hypot(pl.x - prevX, pl.z - prevZ); prevX = pl.x; prevZ = pl.z;
    if (pl.moving && above < 1.5) {
      stepAcc += moved;
      if (stepAcc > 38) { stepAcc = 0; AudioManager.playFootstep(surfaceAt(pl.x, pl.z)); }
    } else stepAcc = Math.min(stepAcc, 20);
    const airNow = above > 4;
    if (airNow) peakAir = Math.max(peakAir, above);
    if (wasAir && !airNow) { if (peakAir > 60) AudioManager.play('land'); peakAir = 0; }
    wasAir = airNow;
    AudioManager.updateAmbience(zonesAt(pl.x, pl.z, pl.alt, g0));

    /* --- camera: spring follow, orbit, ground collision --- */
    const shot = $S.shotJob;
    if (shot) { if (!shot.saved) shot.saved = [$S.camAngleDeg, $S.camDist]; const s = SHOTS[shot.i]; $S.camAngleDeg = s.pitch; $S.camDist = s.dist; }
    camS.x += (pl.x - camS.x) * Math.min(1, dt * 7); camS.z += (pl.z - camS.z) * Math.min(1, dt * 7); camS.y += (pl.alt - camS.y) * Math.min(1, dt * 5);
    const pitch = $S.camAngleDeg * Math.PI / 180, D = $S.camDist;
    cam.position.set(camS.x + Math.sin(yaw) * D * Math.cos(pitch), camS.y + 18 + D * Math.sin(pitch), camS.z + Math.cos(yaw) * D * Math.cos(pitch));
    cam.position.y = Math.max(cam.position.y, heightAt(cam.position.x, cam.position.z) + 8);
    const gy = heightAt(0, GATE[1]);                      // keep the camera out of the arch stonework
    if (Math.abs(cam.position.x) < 182 && Math.abs(cam.position.z - GATE[1]) < 34 && cam.position.y > gy + 80 && cam.position.y < gy + 132) cam.position.y = gy + 134;
    cam.lookAt(camS.x, camS.y + 16, camS.z);
    if ($S.debugCam) { const dc = $S.debugCam; cam.position.set(dc.pos[0], dc.pos[1], dc.pos[2]); cam.lookAt(dc.target[0], dc.target[1], dc.target[2]); if (dc.fov && cam.fov !== dc.fov) { cam.fov = dc.fov; cam.updateProjectionMatrix(); } }

    /* --- light, sky, water, foliage --- */
    sunDirection(sd);
    sun.position.set(pl.x + sd.x * 900, sd.y * 900, pl.z + sd.z * 900); sun.target.position.set(pl.x, 0, pl.z);
    sun.color.set(LOOK.sunColor); sun.intensity = LOOK.sunIntensity;
    hemi.color.set(LOOK.hemiSky); hemi.groundColor.set(LOOK.hemiGround); hemi.intensity = LOOK.hemiIntensity;
    (scene.fog as THREE.Fog).color.set(LOOK.fogColor); (scene.fog as THREE.Fog).near = LOOK.fogNear; (scene.fog as THREE.Fog).far = LOOK.fogFar;
    (scene.background as THREE.Color).set(LOOK.skyHorizon);
    $S.campusNear = interact.update(pl.x, pl.z, pl.alt, t, campus.towerBeam, campus.domeBeam);
    sky.update(t, cam.position); ocean.update(t); foliage.update(cam.position, t); campus.update(t, cam.position);
    pets.update(dt, t, pl.x, pl.z);
    birds.update(dt, t);

    /* wildlife census in the HUD, refreshed a couple of times per second
       (counts drift as pets stream in, so rebuild until stable) */
    if (!censusBuilt || Math.floor(t * 2) !== Math.floor((t - dt) * 2)) {
      const cen = pets.census();
      for (const [k, n] of Object.entries(birds.census())) cen[k] = (cen[k] || 0) + n;
      const total = Object.values(cen).reduce((a, b) => a + b, 0);
      if (total > 0) {
        if (stAnimals) stAnimals.innerHTML = Object.entries(cen)
          .sort((a, b) => b[1] - a[1])
          .map(([k, n]) => `<div class="srow" title="${k}"><span>${SP_EMOJI[k] || k}</span><b>${n}</b></div>`).join('')
          + `<div class="srow shead" style="margin-top:6px"><span>TOTAL</span><b>${total}</b></div>`;
        if (total >= pets.expected + birds.expected) censusBuilt = true;
      }
    }

    if (tickQuality(dtMs)) applyQuality();
    post.render(dt);

    if (shot) { shot.frames++; if (shot.frames >= 4) {
      const a = document.createElement('a'); a.href = cv.toDataURL('image/png'); a.download = 'campus-' + SHOTS[shot.i].name + '.png'; a.click();
      shot.i++; shot.frames = 0;
      if (shot.i >= SHOTS.length) { $S.camAngleDeg = shot.saved[0]; $S.camDist = shot.saved[1]; $S.shotJob = null; } } }
  }
  requestAnimationFrame(frame);
  (window as any).__campus.scene = { scene, cam, pl };
}
