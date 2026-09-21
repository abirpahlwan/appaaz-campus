// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */
import { $S } from '../core/state';
import { H, W } from '../world/config';



/* Slow cloud shadows drifting over the fields.
   Each one is a clump of overlapping discs rather than an ellipse, so the
   outline is lumpy and torn the way a real cloud's shadow is. All the discs
   go into a single path and get one fill, so overlaps don't darken. */
const clouds = [];
(function seedClouds(){
  let seed = 20260909;
  const rnd = ()=>{ seed = (seed*1103515245 + 12345) & 0x7fffffff; return seed/0x7fffffff; };
  for(let i=0;i<6;i++){
    const w = 78 + rnd()*66;              // half-width of the clump
    const h = w * (0.40 + rnd()*0.16);    // clouds are wider than they are tall
    const lobes = [];
    /* a few fat lobes through the middle */
    const core = 3 + (rnd()*3|0);
    for(let k=0;k<core;k++){
      lobes.push({
        dx: (rnd()-0.5)*w*1.15,
        dy: (rnd()-0.5)*h*0.75,
        r : h*(0.62 + rnd()*0.42),
        ph: rnd()*6.283
      });
    }
    /* a dense ring of small, jittered lobes chews the edge into something torn */
    const rim = 30 + (rnd()*14|0);
    for(let k=0;k<rim;k++){
      const a2 = (k/rim)*6.283 + (rnd()-0.5)*0.30;
      const push = 0.74 + rnd()*0.30;
      lobes.push({
        dx: Math.cos(a2)*w*push,
        dy: Math.sin(a2)*h*push,
        r : h*(0.10 + rnd()*rnd()*0.34),   // squared random: mostly small, a few bigger
        ph: rnd()*6.283
      });
    }
    /* a handful of wisps hanging off the edge */
    const wisps = 5 + (rnd()*5|0);
    for(let k=0;k<wisps;k++){
      const a2 = rnd()*6.283;
      const push = 1.02 + rnd()*0.22;
      lobes.push({
        dx: Math.cos(a2)*w*push,
        dy: Math.sin(a2)*h*push,
        r : h*(0.07 + rnd()*0.13),
        ph: rnd()*6.283
      });
    }
    clouds.push({
      x: rnd()*W, y: rnd()*H,
      s: 0.09 + rnd()*0.10,
      w, h, lobes
    });
  }
})();

/* Gliders ride the same sky as the cloud shadows: slow, high, non-interactive.
   White slender wings + aqua cockpit, frozen when reduced motion is asked. */
export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const gliders = [
  {x:W*0.20, y:H*0.22, s:0.50, v:0.35, ph:0},
  {x:W*0.62, y:H*0.13, s:0.36, v:0.27, ph:2},
  {x:W*0.42, y:H*0.58, s:0.64, v:0.43, ph:4}
];
let gT = 0;

$S.confettiUntil = 0;
const CONF = [];