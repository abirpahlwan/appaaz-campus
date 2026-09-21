/* Look settings: the one place that defines how the campus is lit and graded.
   Values can be tuned live in the look panel (press L), saved to localStorage,
   and copied as JSON to paste back here as the new defaults. */
import * as THREE from 'three';

export interface Look {
  exposure: number;
  sunColor: string; sunIntensity: number; sunElevation: number; sunAzimuth: number;
  hemiSky: string; hemiGround: string; hemiIntensity: number;
  fogColor: string; fogNear: number; fogFar: number;
  skyTop: string; skyMid: string; skyHorizon: string; skySeaHaze: string;
  cloudCover: number; cloudSoftness: number;
  seaShallow: string; seaDeep: string; seaFoam: string; seaGlitter: number;
  bloomStrength: number; bloomThreshold: number; bloomRadius: number;
  saturation: number; contrast: number; vignette: number;
  shadowTint: string; highlightTint: string;
}

export const DEFAULT_LOOK: Look = {
  exposure: 1.0,
  sunColor: '#ffe3b4', sunIntensity: 3.2, sunElevation: 30, sunAzimuth: 150,
  hemiSky: '#a9d8ff', hemiGround: '#6fae5c', hemiIntensity: 1.25,
  fogColor: '#a9daf2', fogNear: 2500, fogFar: 15000,
  skyTop: '#1a6fe0', skyMid: '#48aeee', skyHorizon: '#b3e0f8', skySeaHaze: '#9fdcec',
  cloudCover: 0.62, cloudSoftness: 0.12,
  seaShallow: '#63e3d3', seaDeep: '#0f8fbf', seaFoam: '#ffffff', seaGlitter: 1.0,
  bloomStrength: 0.25, bloomThreshold: 1.0, bloomRadius: 0.55,
  saturation: 1.12, contrast: 1.06, vignette: 0.22,
  shadowTint: '#8fb4d8', highlightTint: '#fff0d0',
};

const KEY = 'appaaz-campus-look-v1';

function load(): Look {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_LOOK, ...JSON.parse(raw) };
  } catch (e) { /* ignore */ }
  return { ...DEFAULT_LOOK };
}

export const LOOK: Look = load();

export function saveLook() {
  try { localStorage.setItem(KEY, JSON.stringify(LOOK)); } catch (e) { /* ignore */ }
}
export function resetLook() {
  Object.assign(LOOK, DEFAULT_LOOK);
  saveLook();
}

/** Unit vector pointing from the ground towards the sun. */
export function sunDirection(out = new THREE.Vector3()): THREE.Vector3 {
  const el = THREE.MathUtils.degToRad(LOOK.sunElevation);
  const az = THREE.MathUtils.degToRad(LOOK.sunAzimuth);
  return out.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).normalize();
}
