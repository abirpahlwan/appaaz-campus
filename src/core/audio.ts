/* Sample-based campus audio: zoned ambience loops, footsteps, jetpack, UI/SFX.
   All samples are original CC0 files synthesized in-repo (public/audio/,
   see ASSETS.md) - no third-party downloads, no licensing risk.
   Plain Web Audio, no dependencies. */
import { $S, $R } from './state';

const PREF_KEY = 'appaaz-park-audio-v1';
const startedAt = Date.now();

// Samples live in public/audio/, served at /audio/ (no custom vite base).
const url = (f: string) => `/audio/${f}`;

type LoopName = 'sea' | 'lagoon' | 'meadow' | 'ridge' | 'plaza' | 'birds' | 'music' | 'jetpack';
interface LoopDef { file: string; bus: 'amb' | 'mus' | 'sfx'; base: number; }
const LOOPS: Record<LoopName, LoopDef> = {
  sea:     { file: 'amb-sea.wav',      bus: 'amb', base: 0.55 },
  lagoon:  { file: 'amb-lagoon.wav',   bus: 'amb', base: 0.55 },
  meadow:  { file: 'amb-meadow.wav',   bus: 'amb', base: 0.50 },
  ridge:   { file: 'amb-ridge.wav',    bus: 'amb', base: 0.55 },
  plaza:   { file: 'amb-plaza.wav',    bus: 'amb', base: 0.45 },
  birds:   { file: 'amb-birds.wav',    bus: 'amb', base: 0.38 },
  music:   { file: 'bgm-calm.wav',     bus: 'mus', base: 0.50 },
  jetpack: { file: 'jetpack-loop.wav', bus: 'sfx', base: 0.55 },
};
const AMB_LOOPS: LoopName[] = ['sea', 'lagoon', 'meadow', 'ridge', 'plaza', 'birds'];
export type AmbienceZones = Partial<Record<'sea' | 'lagoon' | 'meadow' | 'ridge' | 'plaza' | 'birds', number>>;

/** Legacy synth preset names (modal/critters/update call these) map to samples. */
const LEGACY_MAP: Record<string, { file: string; rate?: number }> = {
  ui:          { file: 'ui-click.wav' },
  click:       { file: 'ui-click.wav' },
  toast:       { file: 'toast-pop.wav' },
  environment: { file: 'toast-pop.wav' },
  building:    { file: 'panel-open.wav' },
  open:        { file: 'panel-open.wav' },
  transport:   { file: 'panel-open.wav', rate: 0.85 },
  landmark:    { file: 'waypoint-unlock.wav' },
  unlock:      { file: 'waypoint-unlock.wav' },
  animal:      { file: 'pet-chirp.wav' },
  summit:      { file: 'discovery-chime.wav' },
  discovery:   { file: 'discovery-chime.wav' },
  success:     { file: 'success-fanfare.wav' },
  failure:     { file: 'error-soft.wav' },
  land:        { file: 'land-thump.wav' },
};

export type FootSurface = 'grass' | 'sand' | 'stone' | 'wood';
export interface PlayOptions { gain?: number; rate?: number; frequency?: number; second?: number; duration?: number }

export const AudioManager = (() => {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let ambBus: GainNode | null = null;
  let musBus: GainNode | null = null;
  let sfxBus: GainNode | null = null;
  let muted = false;
  let volume = 0.55;
  let ambOn = false;
  let jetOn = false;
  const bufs = new Map<string, AudioBuffer>();
  const pending = new Map<string, Promise<AudioBuffer | null>>();
  const loops = new Map<LoopName, { src: AudioBufferSourceNode; gain: GainNode }>();
  const targets = new Map<LoopName, number>();
  const stepCount: Record<FootSurface, number> = { grass: 0, sand: 0, stone: 0, wood: 0 };
  let lastZonePush = 0;

  function readPrefs(): void {
    try {
      const p = JSON.parse(localStorage.getItem(PREF_KEY) || 'null') as { muted?: boolean; volume?: number } | null;
      if (p && typeof p === 'object') {
        muted = p.muted === true;
        if (Number.isFinite(p.volume)) volume = Math.max(0, Math.min(1, p.volume as number));
      }
    } catch { /* private mode: keep defaults */ }
  }
  function writePrefs(): void {
    try { localStorage.setItem(PREF_KEY, JSON.stringify({ muted, volume })); } catch { /* ignore */ }
  }

  function ensure(): AudioContext | null {
    if (ctx) return ctx;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : volume;
      master.connect(ctx.destination);
      ambBus = ctx.createGain(); ambBus.gain.value = 1;
      /* the synthesized ambience beds carry broadband hiss; a gentle low-pass
         keeps the waves/wind low end and bird chirps but drops the static */
      const ambTone = ctx.createBiquadFilter();
      ambTone.type = 'lowpass'; ambTone.frequency.value = 3600; ambTone.Q.value = 0.4;
      ambBus.connect(ambTone); ambTone.connect(master);
      musBus = ctx.createGain(); musBus.gain.value = 1; musBus.connect(master);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(master);
      return ctx;
    } catch { ctx = null; return null; }
  }

  function load(file: string): Promise<AudioBuffer | null> {
    const hit = bufs.get(file);
    if (hit) return Promise.resolve(hit);
    const inflight = pending.get(file);
    if (inflight) return inflight;
    const p = (async (): Promise<AudioBuffer | null> => {
      const c = ensure();
      if (!c) return null;
      try {
        const res = await fetch(url(file));
        if (!res.ok) return null;
        const data = await res.arrayBuffer();
        const buf = await c.decodeAudioData(data);
        bufs.set(file, buf);
        return buf;
      } catch { return null; }
    })();
    pending.set(file, p);
    void p.finally(() => pending.delete(file));
    return p;
  }

  function preload(): void {
    if (!ensure()) return;
    for (const def of Object.values(LOOPS)) void load(def.file);
    for (const m of Object.values(LEGACY_MAP)) void load(m.file);
    for (const s of ['grass', 'sand', 'stone', 'wood'] as FootSurface[]) {
      void load(`step-${s}-1.wav`);
      void load(`step-${s}-2.wav`);
    }
  }

  function busFor(bus: 'amb' | 'mus' | 'sfx'): GainNode | null {
    return bus === 'amb' ? ambBus : bus === 'mus' ? musBus : sfxBus;
  }

  function startLoop(name: LoopName): void {
    const c = ensure();
    if (!c || loops.has(name)) return;
    const buf = bufs.get(LOOPS[name].file);
    const bus = busFor(LOOPS[name].bus);
    if (!buf || !bus) return;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const gain = c.createGain();
    gain.gain.value = 0;
    src.connect(gain);
    gain.connect(bus);
    try { src.start(); } catch { return; }
    loops.set(name, { src, gain });
    const t = targets.get(name) ?? 0;
    gain.gain.setTargetAtTime(t, c.currentTime, 1.1);
  }

  function ramp(name: LoopName, value: number, tc = 1.1): void {
    targets.set(name, value);
    const c = ctx;
    const node = loops.get(name);
    if (c && node) node.gain.gain.setTargetAtTime(value, c.currentTime, tc);
  }

  function unlock(): boolean {
    const c = ensure();
    if (!c) return false;
    if (c.state === 'suspended') void c.resume().catch(() => undefined);
    preload();
    if (ambOn) for (const n of AMB_LOOPS) {
      if (bufs.get(LOOPS[n].file)) startLoop(n);
      else void load(LOOPS[n].file).then(b => { if (b && ambOn) startLoop(n); });
    }
    return true;
  }

  function playFile(file: string, gain = 1, rate = 1): void {
    const c = ensure();
    if (!c || muted || document.hidden) return;
    const buf = bufs.get(file);
    if (!buf) { void load(file).then(b => { if (b) playFile(file, gain, rate); }); return; }
    if (!sfxBus) return;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = Math.max(0.4, Math.min(2.5, rate));
    const g = c.createGain();
    g.gain.value = Math.max(0, Math.min(2, gain));
    src.connect(g);
    g.connect(sfxBus);
    try { src.start(); } catch { /* ignore */ }
  }

  function play(name: string, options?: PlayOptions): void {
    if (!unlock() || muted || document.hidden) return;
    const o = options || {};
    const mapped = LEGACY_MAP[name] || LEGACY_MAP.ui;
    // Legacy callers pass a raw frequency (blips/arpeggios): bend playback rate to match.
    let rate = o.rate || mapped.rate || 1;
    if (o.frequency && !o.rate) rate = Math.max(0.5, Math.min(2.2, o.frequency / 660));
    playFile(mapped.file, o.gain ?? 1, rate);
  }

  function startAmbience(): void {
    ambOn = true;
    if (!unlock()) return;
    for (const n of AMB_LOOPS) {
      if (bufs.get(LOOPS[n].file)) startLoop(n);
      else void load(LOOPS[n].file).then(b => { if (b && ambOn) startLoop(n); });
    }
  }
  function stopAmbience(): void {
    ambOn = false;
    for (const n of AMB_LOOPS) ramp(n, 0, 0.6);
  }

  /** Crossfade the ambience loops toward per-zone weights (0..1). Throttled internally. */
  function updateAmbience(zones: AmbienceZones): void {
    if (!ctx || !ambOn || muted) return;
    const now = performance.now();
    if (now - lastZonePush < 200) return;
    lastZonePush = now;
    for (const n of AMB_LOOPS) {
      const w = Math.max(0, Math.min(1, zones[n] ?? 0));
      ramp(n, LOOPS[n].base * w);
    }
  }

  function startBgm(): void {
    if (!unlock()) return;
    if (bufs.get(LOOPS.music.file)) startLoop('music');
    else void load(LOOPS.music.file).then(b => { if (b) startLoop('music'); });
    ramp('music', LOOPS.music.base);
  }
  function stopBgm(): void {
    ramp('music', 0, 0.6);
  }
  function setBiome(_next: string): void { /* legacy scene hook: zones now drive the mix */ }

  function playFootstep(surface: FootSurface, gain = 1): void {
    if (!ctx || muted || document.hidden) return;
    const i = (stepCount[surface]++ % 2) + 1;
    playFile(`step-${surface}-${i}.wav`, gain, 0.94 + Math.random() * 0.12);
  }

  function setJetpack(active: boolean): void {
    if (active === jetOn) return;
    jetOn = active;
    if (!ctx) return;
    if (active) {
      if (bufs.get(LOOPS.jetpack.file)) startLoop('jetpack');
      else { void load(LOOPS.jetpack.file).then(b => { if (b && jetOn) startLoop('jetpack'); }); return; }
    }
    ramp('jetpack', active ? LOOPS.jetpack.base : 0, 0.3);
  }

  function setMuted(next: boolean): void {
    muted = !!next;
    if (muted) { stopBgm(); stopAmbience(); setJetpack(false); }
    if (ctx && master) master.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.02);
    writePrefs();
    if (!muted && document.getElementById('intro')?.style.display === 'none') {
      unlock();
      startAmbience();
      startBgm();
    }
  }
  function setVolume(next: number): void {
    volume = Math.max(0, Math.min(1, Number(next) || 0));
    if (ctx && master && !muted) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.02);
    writePrefs();
  }
  function pause(): void {
    if (ctx && ctx.state === 'running') void ctx.suspend().catch(() => undefined);
  }
  function resume(): void {
    if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
    if (document.getElementById('intro')?.style.display === 'none' && !muted && ambOn) {
      for (const n of AMB_LOOPS) {
        const t = targets.get(n) ?? 0;
        const node = loops.get(n);
        if (ctx && node) node.gain.gain.setTargetAtTime(t, ctx.currentTime, 0.5);
      }
    }
  }
  function dispose(): void {
    stopBgm();
    stopAmbience();
    setJetpack(false);
    if (ctx) { void ctx.close().catch(() => undefined); ctx = null; master = ambBus = musBus = sfxBus = null; }
    loops.clear();
  }

  readPrefs();
  return {
    unlock, play, startBgm, stopBgm, setBiome,
    startAmbience, stopAmbience, updateAmbience,
    playFootstep, setJetpack,
    setMuted, setVolume,
    isMuted: () => muted, getVolume: () => volume,
    pause, resume, dispose,
  };
})();

$S.soundOn = !AudioManager.isMuted();
function blip(freq: number): void {
  AudioManager.play('ui', { frequency: freq });
}
$R.AudioManager = AudioManager;
$R.blip = blip;
$R.startedAt = startedAt;
