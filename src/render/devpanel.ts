/* Look panel (press L): live sliders for the look, plus screenshot shots.
   "Copy" puts the current settings on the clipboard as JSON, so they can be pasted
   back as new defaults. Settings are kept in localStorage between visits. */
import { LOOK, DEFAULT_LOOK, saveLook, resetLook, type Look } from './look';
import { quality, TIERS } from './quality';

type NumSpec = [keyof Look, string, number, number, number];
const NUMS: NumSpec[] = [
  ['exposure', 'Exposure', 0.4, 2.2, 0.02],
  ['sunIntensity', 'Sun intensity', 0, 8, 0.05], ['sunElevation', 'Sun elevation', 5, 80, 1], ['sunAzimuth', 'Sun azimuth', 0, 360, 1],
  ['hemiIntensity', 'Sky light', 0, 4, 0.05],
  ['fogNear', 'Fog near', 100, 6000, 50], ['fogFar', 'Fog far', 1000, 16000, 100],
  ['cloudCover', 'Cloud cover', 0.2, 0.9, 0.01], ['cloudSoftness', 'Cloud softness', 0.05, 0.5, 0.01],
  ['seaGlitter', 'Sea glitter', 0, 3, 0.05],
  ['bloomStrength', 'Bloom', 0, 1.5, 0.02], ['bloomThreshold', 'Bloom threshold', 0.3, 1.2, 0.01], ['bloomRadius', 'Bloom radius', 0, 1.2, 0.02],
  ['saturation', 'Saturation', 0.6, 1.8, 0.01], ['contrast', 'Contrast', 0.7, 1.5, 0.01], ['vignette', 'Vignette', 0, 0.8, 0.01],
];
const COLORS: [keyof Look, string][] = [
  ['sunColor', 'Sun'], ['hemiSky', 'Sky light'], ['hemiGround', 'Ground bounce'], ['fogColor', 'Fog'],
  ['skyTop', 'Sky top'], ['skyMid', 'Sky middle'], ['skyHorizon', 'Sky horizon'], ['skySeaHaze', 'Sea haze'],
  ['seaShallow', 'Sea shallow'], ['seaDeep', 'Sea deep'], ['shadowTint', 'Shadow tint'], ['highlightTint', 'Highlight tint'],
];

export const SHOTS = [
  { name: 'ground', pitch: 14, dist: 260 },
  { name: 'plaza', pitch: 22, dist: 600 },
  { name: 'aerial', pitch: 42, dist: 1500 },
  { name: 'horizon', pitch: 4, dist: 500 },
];

export function initDevPanel(hooks: { onChange(): void; captureShots(): void }) {
  const box = document.createElement('div');
  box.id = 'lookpanel';
  box.style.cssText = 'position:fixed;top:60px;right:12px;width:270px;max-height:calc(100vh - 80px);overflow:auto;z-index:50;display:none;' +
    'background:rgba(20,32,30,.9);color:#e8fff6;font:12px/1.3 system-ui,sans-serif;padding:10px;border-radius:10px;';
  const row = (label: string, input: HTMLElement) => {
    const r = document.createElement('label'); r.style.cssText = 'display:flex;align-items:center;gap:6px;margin:3px 0;';
    const t = document.createElement('span'); t.textContent = label; t.style.cssText = 'flex:0 0 96px;';
    r.append(t, input); return r;
  };
  const h = document.createElement('div'); h.textContent = 'Look panel (L to hide)'; h.style.cssText = 'font-weight:600;margin-bottom:6px;';
  box.append(h);
  const inputs: Array<() => void> = [];
  for (const [key, label, min, max, step] of NUMS) {
    const i = document.createElement('input'); i.type = 'range'; i.min = String(min); i.max = String(max); i.step = String(step); i.style.flex = '1';
    const v = document.createElement('span'); v.style.cssText = 'flex:0 0 40px;text-align:right;';
    const sync = () => { i.value = String(LOOK[key]); v.textContent = Number(LOOK[key]).toFixed(step < 0.1 ? 2 : 0); };
    i.oninput = () => { (LOOK as any)[key] = parseFloat(i.value); v.textContent = Number(LOOK[key]).toFixed(step < 0.1 ? 2 : 0); saveLook(); hooks.onChange(); };
    sync(); inputs.push(sync);
    const r = row(label, i); r.append(v); box.append(r);
  }
  for (const [key, label] of COLORS) {
    const i = document.createElement('input'); i.type = 'color';
    const sync = () => { i.value = String(LOOK[key]); };
    i.oninput = () => { (LOOK as any)[key] = i.value; saveLook(); hooks.onChange(); };
    sync(); inputs.push(sync); box.append(row(label, i));
  }
  const tier = document.createElement('div'); tier.style.cssText = 'margin:8px 0 4px;';
  const btn = (text: string, fn: () => void) => { const b = document.createElement('button'); b.textContent = text; b.onclick = fn;
    b.style.cssText = 'margin:2px 4px 2px 0;padding:4px 8px;border-radius:6px;border:0;background:#33d1c0;color:#08332d;cursor:pointer;font:12px system-ui;'; return b; };
  const status = document.createElement('div'); status.style.cssText = 'margin-top:6px;opacity:.8;';
  const refresh = () => { status.textContent = 'Quality: ' + quality.tier.name + (quality.auto ? ' (auto)' : ' (fixed)') + ' | scale ' + quality.scale.toFixed(2) + ' | ' + quality.ema.toFixed(1) + ' ms'; };
  setInterval(() => { if (box.style.display !== 'none') refresh(); }, 500);
  tier.append(
    btn('Copy settings', () => { navigator.clipboard?.writeText(JSON.stringify(LOOK, null, 2)); status.textContent = 'Copied to clipboard'; }),
    btn('Reset', () => { resetLook(); inputs.forEach(f => f()); hooks.onChange(); }),
    btn('Save shots', () => hooks.captureShots()),
    btn('Quality: ' + TIERS.map(t => t.name[0]).join('/'), () => { quality.auto = false; quality.tierIndex = (quality.tierIndex + 1) % TIERS.length; quality.scale = 1; hooks.onChange(); refresh(); }),
  );
  box.append(tier, status);
  document.body.appendChild(box);
  addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'l' && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement)) {
      box.style.display = box.style.display === 'none' ? 'block' : 'none'; refresh();
    }
  });
  void DEFAULT_LOOK;
  return { show() { box.style.display = 'block'; refresh(); } };
}
