// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */
import { $S } from './state';



$S.T = 0;
export function shade(hex, amt){
  const n=parseInt(hex.slice(1),16); let r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  r=Math.max(0,Math.min(255,r+255*amt))|0; g=Math.max(0,Math.min(255,g+255*amt))|0; b=Math.max(0,Math.min(255,b+255*amt))|0;
  return `rgb(${r},${g},${b})`;
}