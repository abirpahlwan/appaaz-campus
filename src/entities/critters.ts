// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */
import { $S, $R } from '../core/state';
import { DESERT, GRASS, H, MAP_H, MAP_W, PATH, SAND, TILE, W } from '../world/config';
import { POND, inPond, map } from '../world/map';
import { objSolid, objs, propSolid } from '../world/objects';
import { say } from '../world/chatter';
import { P, canMove, walkableForCow } from './player';


/* seeded PRNG for deterministic critter placement */
let critterSeed = 48271;
function critterRnd(){ critterSeed = (critterSeed * 1103515245 + 12345) & 0x7fffffff; return critterSeed / 0x7fffffff; }
export const cows = [];
const COW_NAMES = ['Mallow','Pepper','Pudding','Clover','Biscuit'];
for(let i=0;i<5;i++){
  let tx,ty,tries=0;
  do{ tx=2+Math.floor(critterRnd()*(MAP_W-4)); ty=2+Math.floor(critterRnd()*(MAP_H-4)); tries++; }
  while(!walkableForCow(tx,ty) && tries<400);
  cows.push({id:'cow'+i, name:COW_NAMES[i], x:tx*TILE+8, y:ty*TILE+8, vx:0, vy:0, t:critterRnd()*200, face:1, graze:0});
}
const duckPath = [];
export const mother = {id:'duck-mother', name:'Marigold', x:POND.cx*TILE, y:POND.cy*TILE, a:critterRnd()*6.28, t:0};
const DUCKLING_NAMES = ['Pebble','Pip','Puddle','Poppy','Plume'];
export const ducklings = [0,1,2,3,4].map(i=>({i, id:'duckling'+i, name:DUCKLING_NAMES[i], x:mother.x, y:mother.y}));

export function updateCritters(){
  /* cows: wander, pause to graze */
  for(const c of cows){
    c.t--;
    if(c.t<=0){
      c.t = 90 + Math.random()*220;
      if(Math.random()<0.45){ c.vx=0; c.vy=0; c.graze=60+Math.random()*120; }
      else{
        const a = Math.random()*Math.PI*2;
        c.vx = Math.cos(a)*0.22; c.vy = Math.sin(a)*0.22;
        if(Math.abs(c.vx)>0.02) c.face = c.vx>0?1:-1;
      }
    }
    if(c.graze>0){ c.graze--; continue; }
    const nx=c.x+c.vx, ny=c.y+c.vy;
    if(walkableForCow(Math.floor(nx/TILE), Math.floor(c.y/TILE))) c.x=nx; else { c.vx*=-1; c.face=c.vx>0?1:-1; }
    if(walkableForCow(Math.floor(c.x/TILE), Math.floor(ny/TILE))) c.y=ny; else c.vy*=-1;
  }
  /* mother duck paddles inside the pond, ducklings trail behind */
  mother.t += 0.02;
  mother.a += (Math.sin(mother.t*1.7)*0.06);
  let nx = mother.x + Math.cos(mother.a)*0.42;
  let ny = mother.y + Math.sin(mother.a)*0.42;
  if(!inPond(nx/TILE, ny/TILE)){
    const toC = Math.atan2(POND.cy*TILE-mother.y, POND.cx*TILE-mother.x);
    mother.a = toC + (Math.random()-0.5)*0.6;
    nx = mother.x + Math.cos(mother.a)*0.42; ny = mother.y + Math.sin(mother.a)*0.42;
  }
  mother.x=nx; mother.y=ny;
  duckPath.unshift({x:mother.x, y:mother.y});
  if(duckPath.length>140) duckPath.pop();
  ducklings.forEach((d,i)=>{
    const p = duckPath[Math.min(duckPath.length-1, 18+i*16)];
    if(p){ d.x=p.x; d.y=p.y; }
  });
}

/* fireflies */
export const flies = [];
for(let i=0;i<46;i++) flies.push({
  x:critterRnd()*W, y:critterRnd()*H, p:critterRnd()*6.28, s:0.3+critterRnd()*0.7
});

/* the flying cow */
export const flyCow = {id:'flying-cow', name:'Nimbus', active:false, x:0, y:0, t:0, next:420};

/* ---------- versioned localStorage ---------- */
const SAVE_KEY = 'appaaz-park-v1';
function loadSave(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return {v:2, affinity:{}, ridden:{}, landmarkSeen:{}};
    const s = JSON.parse(raw);
    if(!s || s.v!==2 || typeof s!=='object') return {v:2, affinity:{}, ridden:{}, landmarkSeen:{}};
    const affinity={}, ridden={}, landmarkSeen={}, care={};
    for(const [id,value] of Object.entries(s.affinity||{}))
      if(/^(?:cow|rabbit|goat|deer)\d+$/.test(id)) affinity[id]=Math.max(0,Math.min(10,Number(value)||0));
    for(const [id,value] of Object.entries(s.care||{}))
      if(/^(?:cow|rabbit|goat|deer)\d+$/.test(id)) care[id]=Math.max(0,Math.min(20,Number(value)||0));
    for(const [id,value] of Object.entries(s.ridden||{})) if(typeof id==='string'&&value===true) ridden[id]=true;
    for(const [id,value] of Object.entries(s.landmarkSeen||{})) if(typeof id==='string'&&value===true) landmarkSeen[id]=true;
    return {v:2, affinity, care, ridden, landmarkSeen};
  }catch(e){ return {v:2, affinity:{}, ridden:{}, landmarkSeen:{}}; }
}
export function writeSave(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }catch(e){} }
export const save = loadSave();
objs.forEach(o=>{ if(save.landmarkSeen[o.id]) o.seen=true; });

/* ---------- ambient animals ---------- */
export function walkableForAnimal(tx,ty){
  if(tx<1||ty<1||tx>=MAP_W-1||ty>=MAP_H-1) return false;
  const t = map[ty][tx];
  if(t!==GRASS && t!==PATH && t!==SAND && t!==DESERT) return false;
  return !objSolid.has(tx+','+ty) && !propSolid.has(tx+','+ty);
}
export const rabbits = [];
const RABBIT_NAMES = ['Nibbles','Cocoa','Thistle','Button','Mochi','Dandelion'];
(function seedRabbits(){
  for(let i=0;i<6;i++){
    let tx,ty,tries=0;
    do{ tx=2+Math.floor(critterRnd()*(MAP_W-4)); ty=2+Math.floor(critterRnd()*(MAP_H-4)); tries++; }
    while(!walkableForAnimal(tx,ty) && tries<400);
    rabbits.push({x:tx*TILE+8, y:ty*TILE+8, vx:0, vy:0, t:critterRnd()*200, face:1, hop:0, id:'rabbit'+i, name:RABBIT_NAMES[i],
      affinity: save.affinity['rabbit'+i]||0, care: save.care?.['rabbit'+i]||0, petting:0});
  }
})();
export const goats = [];
const GOAT_NAMES = ['Juniper','Fennel','Honey','Maple'];
(function seedGoats(){
  for(let i=0;i<4;i++){
    let tx,ty,tries=0;
    do{ tx=66+Math.floor(critterRnd()*26); ty=2+Math.floor(critterRnd()*16); tries++; }
    while(!walkableForAnimal(tx,ty) && tries<400);
    goats.push({x:tx*TILE+8, y:ty*TILE+8, vx:0, vy:0, t:critterRnd()*200, face:1, graze:0, id:'goat'+i, name:GOAT_NAMES[i],
      affinity: save.affinity['goat'+i]||0, care: save.care?.['goat'+i]||0, petting:0});
  }
})();
export const deer = [];
const DEER_NAMES = ['Willow','Fern','Starlight'];
(function seedDeer(){
  for(let i=0;i<3;i++){
    let tx,ty,tries=0;
    do{ tx=8+Math.floor(critterRnd()*50); ty=44+Math.floor(critterRnd()*14); tries++; }
    while(!walkableForAnimal(tx,ty) && tries<400);
    deer.push({x:tx*TILE+8, y:ty*TILE+8, vx:0, vy:0, t:critterRnd()*200, face:1, graze:0, id:'deer'+i, name:DEER_NAMES[i],
      affinity: save.affinity['deer'+i]||0, care: save.care?.['deer'+i]||0, petting:0, rideable:true, mounted:false});
  }
})();

cows.forEach((c,i)=>{ c.id='cow'+i; c.name=COW_NAMES[i]; c.affinity=save.affinity['cow'+i]||0; c.care=save.care?.['cow'+i]||0; c.petting=0; c.rideable=true; c.mounted=false; });

$S.riding = null;
$S.lastPetAnimal = null; $S.lastPetTime = 0;

/* ---------- animal interaction ---------- */
const MAX_AFFINITY = 10;
export function nearAnimal(){
  let best=null, bd=1e9;
  const all = [...cows,...rabbits,...goats,...deer];
  for(const a of all){
    const d=Math.hypot(P.x-a.x, P.y-a.y);
    if(d<28 && d<bd){ bd=d; best=a; }
  }
  return best;
}
export function petAnimal(a){
  if(!a) return;
  a.petting = 30;
  if(a.affinity < MAX_AFFINITY) a.affinity++;
  a.care = Math.min(20, (a.care||0) + 1);
  save.affinity[a.id] = a.affinity;
  save.care = save.care || {};
  save.care[a.id] = a.care;
  writeSave();
  $R.AudioManager.play('animal',{frequency:720 + a.affinity*40});
  const hearts = ['likes that.','trusts you more.','is very fond of you.','loves you!'];
  say(a.name + ' ' + hearts[Math.min(hearts.length-1, Math.floor(a.affinity/3))], 180);
}
export function mountAnimal(a){
  if(!a || !a.rideable || a.mounted) return;
  if(a.affinity < 3){ say('Not friendly enough yet. Pet it more.', 180); $R.AudioManager.play('failure'); return; }
  a.mounted = true;
  $S.riding = a;
  save.ridden[a.id] = true;
  writeSave();
  say('Riding ' + a.name + '! WASD to steer, E to dismount.', 200);
  $R.AudioManager.play('success');
}
export function dismount(){
  if(!$S.riding) return;
  $S.riding.mounted = false;
  const offsets = [[20,0],[-20,0],[0,20],[0,-20],[20,20],[-20,20],[20,-20],[-20,-20],[28,0],[-28,0],[0,28],[0,-28]];
  let safeX = $S.riding.x + 20, safeY = $S.riding.y + 10;
  for(const [ox,oy] of offsets){
    const tx = $S.riding.x + ox, ty = $S.riding.y + oy;
    if(canMove(tx, ty)){ safeX = tx; safeY = ty; break; }
  }
  P.x = safeX;
  P.y = safeY;
  $S.riding = null;
  say('Dismounted.', 140);
  $R.AudioManager.play('ui',{frequency:440});
}
$R.mother = mother;
