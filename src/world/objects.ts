// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */
import { CONTENT } from '../content/content';
import { FLOOR, GRASS, MAP_H, MAP_W, TILE, TREE, WALL, WATER, hash } from './config';
import { POND, insideBuildingAt, map } from './map';



/* ---------- trees, gathered once ---------- */
export const TREES = [];
for(let y=0;y<MAP_H;y++) for(let x=0;x<MAP_W;x++)
  if(map[y][x]===TREE) TREES.push({x:x*TILE, y:y*TILE, v:hash(x,y)>0.5?1:0, fruit:hash(x,y)>0.72, ph:x*0.7});

/* ---------- tall grass & cattails ringing the pond ---------- */
export const REEDS = [];
(function seedReeds(){
  let seed = 1337;
  const rnd = ()=>{ seed = (seed*1103515245 + 12345) & 0x7fffffff; return seed/0x7fffffff; };
  for(let i=0;i<430;i++){
    const a = rnd()*Math.PI*2;
    const k = 1.14 + Math.pow(rnd(), 0.8)*0.44;          // just outside the shore, thinning outward
    const tx = POND.cx + Math.cos(a)*POND.rx*k;
    const ty = POND.cy + Math.sin(a)*POND.ry*k;
    const ix = Math.floor(tx), iy = Math.floor(ty);
    if(ix<1||iy<1||ix>=MAP_W-1||iy>=MAP_H-1) continue;
    if(map[iy][ix]!==GRASS) continue;
    if(objSolidHas(ix,iy)) continue;
    const dens = 1 - (k-1.14)/0.44;                        // thicker near the water
    if(rnd() > 0.26 + dens*0.48) continue;
    REEDS.push({
      x:  tx*TILE + (rnd()-0.5)*10,
      y:  ty*TILE + (rnd()-0.5)*10,
      hb: Math.min(2, (rnd()*2.2 + dens*0.9)|0),           // height bucket
      sc: 1.05 + rnd()*0.5,                               // per-clump scale
      ph: rnd()*6.283,
      cat: rnd() < 0.15,
      tint: rnd()
    });
  }
})();
/* extra reed clusters around pond edges */
(function(){
  const extraRings=[
    {cx:POND.cx, cy:POND.cy, rx:POND.rx+2, ry:POND.ry+2, n:180},
    {cx:POND.cx-5, cy:POND.cy+3, rx:POND.rx*0.7, ry:POND.ry*0.7, n:80},
    {cx:POND.cx+4, cy:POND.cy-2, rx:POND.rx*0.5, ry:POND.ry*0.5, n:60}
  ];
  for(const ring of extraRings){
    for(let i=0;i<ring.n;i++){
      const a=Math.random()*Math.PI*2;
      const k=0.92+Math.random()*0.25;
      const tx=ring.cx+Math.cos(a)*ring.rx*k;
      const ty=ring.cy+Math.sin(a)*ring.ry*k;
      const ix=Math.floor(tx), iy=Math.floor(ty);
      if(ix<1||iy<1||ix>=MAP_W-1||iy>=MAP_H-1) continue;
      if(map[iy][ix]!==GRASS) continue;
      REEDS.push({
        x:tx*TILE+(Math.random()-0.5)*10,
        y:ty*TILE+(Math.random()-0.5)*10,
        hb:Math.min(2,(Math.random()*2.2)|0),
        sc:1.05+Math.random()*0.5,
        ph:Math.random()*6.283,
        cat:Math.random()<0.15,
        tint:Math.random()
      });
    }
  }
})();
function objSolidHas(x,y){ return false; }   /* reeds are decorative — you can walk through them */

/* ---------- props (outdoor decoration) ---------- */
export const PROPS = [];
(function seedProps(){
  const spots = [
    ['bench',31,22],['bench',42,22],['lamp',26,15],['lamp',31,15],['lamp',26,25],
    ['crate',46,15],['crate',47,35],['barrel',17,15],['barrel',47,26],
    ['flowers',30,17],['flowers',44,24],['flowers',15,28],['flowers',48,41],
    ['flowers',6,41],['flowers',20,41],['rock',44,17],['rock',26,35],['rock',10,27],
    ['sign',28,12],['bush',33,12],['bush',40,12],['bush',12,28],['bush',46,28],
    ['haybale',20,28],['haybale',22,28],['haybale',21,26]
  ];
  for(const [k,x,y] of spots){
    if(map[y] && map[y][x]!==WALL && map[y][x]!==WATER && map[y][x]!==FLOOR)
      PROPS.push({k,x:x*TILE,y:y*TILE,tx:x,ty:y});
  }
})();
/* lamps and benches block movement */
export const propSolid = new Set();
PROPS.forEach(p=>{ if(p.k==='bench'||p.k==='crate'||p.k==='barrel'||p.k==='rock'||p.k==='haybale') propSolid.add(p.tx+','+p.ty); });

/* ---------- interactables ---------- */
export const objs = CONTENT.objects.map(o=>({
  ...o, x:o.tile[0]*TILE, y:o.tile[1]*TILE, pw:o.w*TILE, ph:o.h*TILE, seen:false,
  home: insideBuildingAt(o.tile[0], o.tile[1])
}));
export const MOUNTAIN_FEATURES = [
  {id:'mountain-sign-lower', kind:'mountain-feature', feature:'sign', tile:[70,13],
    label:'Trail sign', x:70*TILE, y:13*TILE, pw:TILE, ph:TILE},
  {id:'mountain-sign-upper', kind:'mountain-feature', feature:'sign', tile:[76,10],
    label:'Alpine trail sign', x:76*TILE, y:10*TILE, pw:TILE, ph:TILE},
  {id:'mountain-bridge', kind:'mountain-feature', feature:'bridge', tile:[73,10],
    label:'Rope bridge', x:73*TILE, y:10*TILE, pw:2*TILE, ph:TILE},
  {id:'mountain-overlook', kind:'mountain-feature', feature:'overlook', tile:[78,8],
    label:'Cloud overlook', x:78*TILE, y:8*TILE, pw:2*TILE, ph:TILE},
  {id:'mountain-camp', kind:'mountain-feature', feature:'camp', tile:[74,12],
    label:'Climber camp', x:74*TILE, y:12*TILE, pw:TILE, ph:TILE},
  {id:'mountain-telescope', kind:'mountain-feature', feature:'telescope', tile:[79,10],
    label:'Summit telescope', x:79*TILE, y:10*TILE, pw:TILE, ph:TILE},
  {id:'mountain-bell', kind:'mountain-feature', feature:'bell', tile:[72,13],
    label:'Summit bell', x:72*TILE, y:13*TILE, pw:TILE, ph:TILE},
  {id:'mountain-hare', kind:'mountain-feature', feature:'hare', tile:[80,13],
    label:'Pipkin the snow hare', x:80*TILE, y:13*TILE, pw:TILE, ph:TILE},
  {id:'mountain-ptarmigan', kind:'mountain-feature', feature:'ptarmigan', tile:[82,7],
    label:'Breeze the ptarmigan', x:82*TILE, y:7*TILE, pw:TILE, ph:TILE},
  {id:'mountain-marmot', kind:'mountain-feature', feature:'marmot', tile:[68,8],
    label:'Rocky the marmot', x:68*TILE, y:8*TILE, pw:TILE, ph:TILE}
];
export const objSolid = new Set();
objs.forEach(o=>{
  if(o.kind==='plant') return;
  for(let y=o.tile[1]; y<o.tile[1]+o.h; y++)
    for(let x=o.tile[0]; x<o.tile[0]+o.w; x++) objSolid.add(x+','+y);
});

/* sanity check: every panel except the secret should live inside a building */
(function checkHomes(){
  const stray = objs.filter(o=>!o.secret && !o.outdoor && !o.home).map(o=>o.id+' @'+o.tile.join(','));
  if(stray.length) console.warn('Objects outside any building:', stray.join(' | '));
})();