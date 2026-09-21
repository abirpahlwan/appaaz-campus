/* Quality tiers and the automatic scaler.
   URL: ?q=low|balanced|high (forces a tier) and ?auto=0 (turns auto-scaling off). */

export type TierName = 'low' | 'balanced' | 'high';
export interface Tier { name: TierName; shadowMap: number; bloom: boolean; msaa: number; maxPixelRatio: number; }

export const TIERS: Tier[] = [
  { name: 'low',      shadowMap: 1024, bloom: false, msaa: 0, maxPixelRatio: 1 },
  { name: 'balanced', shadowMap: 2048, bloom: true,  msaa: 4, maxPixelRatio: 1.5 },
  { name: 'high',     shadowMap: 4096, bloom: true,  msaa: 4, maxPixelRatio: 2 },
];

const params = new URLSearchParams(location.search);
const forced = params.get('q') as TierName | null;

export const quality = {
  tierIndex: Math.max(0, TIERS.findIndex(t => t.name === (forced || 'balanced'))),
  scale: 1,                       // dynamic resolution multiplier
  auto: params.get('auto') !== '0' && !forced,
  ema: 16,                        // moving average frame time (ms)
  slowFor: 0, fastFor: 0,
  get tier(): Tier { return TIERS[this.tierIndex]; },
};

/** Call once per frame with the frame time in milliseconds. Returns true if a setting changed. */
export function tickQuality(dtMs: number): boolean {
  if (!quality.auto || dtMs > 500) return false;   // ignore hitches (tab switches, loading)
  quality.ema += (dtMs - quality.ema) * 0.08;
  if (quality.ema > 20) { quality.slowFor += dtMs; quality.fastFor = 0; }
  else if (quality.ema < 12) { quality.fastFor += dtMs; quality.slowFor = 0; }
  else { quality.slowFor = 0; quality.fastFor = 0; }

  if (quality.slowFor > 2000) {            // too slow: resolution first, then tier
    quality.slowFor = 0;
    if (quality.scale > 0.71) { quality.scale = Math.max(0.7, quality.scale - 0.15); return true; }
    if (quality.tierIndex > 0) { quality.tierIndex--; quality.scale = 1; return true; }
  } else if (quality.fastFor > 10000) {    // fast for a while: step back up
    quality.fastFor = 0;
    if (quality.scale < 1) { quality.scale = Math.min(1, quality.scale + 0.15); return true; }
    if (quality.tierIndex < TIERS.length - 1) { quality.tierIndex++; return true; }
  }
  return false;
}
