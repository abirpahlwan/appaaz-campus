// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */
import { $S, $R } from '../core/state';
import { DESERT, GRASS, H, MAP_H, MAP_W, PATH, RAIL, ROCK, RUNWAY, SAND, TILE, TREE, W, WALL, WATER, cvs } from '../world/config';
import { map } from '../world/map';
import { objSolid, propSolid } from '../world/objects';



/* ---------- player ---------- */
export const P = { x: 28.5*TILE, y: 30*TILE, w:10, h:12, dir:0, moving:false, anim:0, speed:1.5 };

/* ---------- input ---------- */
export const keys = {};
$S.touchVec = {x:0,y:0};
addEventListener('keydown', e=>{
  const t=e.target, tag=t&&t.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA'){ if(e.key==='Escape') t.blur(); return; }
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','z'].includes(e.key)) e.preventDefault();
  keys[e.key.toLowerCase()] = true;
  if(e.shiftKey) keys['shift']=true;
  if(e.key==='Escape'){
    if($S.landmarkSeq){ $S.landmarkSeq.paused = !$S.landmarkSeq.paused; return; }
    $R.closeModal();
  }
  if(e.key.toLowerCase()==='e' || e.key==='Enter' || (e.key===' ' && !$S.R3on)) $R.tryInteract();
  if(e.key.toLowerCase()==='m') $R.toggleClassic();
});
addEventListener('keyup', e=>{ keys[e.key.toLowerCase()]=false; if(!e.shiftKey) keys['shift']=false; });
addEventListener('blur', ()=>{ for(const k in keys) keys[k]=false; });

/* ---------- camera ---------- */
$S.ZOOM = 2; $S.camX = 0; $S.camY = 0; $S.camInit = false;
export function resize(){
  const dpr = Math.min(devicePixelRatio||1, 1.5);   // chunky art: full retina buys little, costs a lot
  cvs.width = innerWidth*dpr; cvs.height = innerHeight*dpr;
  cvs.style.width = innerWidth+'px'; cvs.style.height = innerHeight+'px';
  $S.ctx.setTransform(dpr,0,0,dpr,0,0);
  $S.ctx.imageSmoothingEnabled = true;
  $S.ZOOM = Math.max(2, Math.min(3, Math.floor(Math.min(innerWidth/W, innerHeight/H))));
  document.getElementById('touch').style.display =
    matchMedia('(pointer:coarse)').matches ? 'block' : 'none';
}
addEventListener('resize', resize);

/* ---------- collision ---------- */
function solidTile(t){ return t===WALL || t===WATER || t===TREE || t===ROCK; }
function solidAt(px,py){
  const tx = Math.floor(px/TILE), ty = Math.floor(py/TILE);
  if(tx<0||ty<0||tx>=MAP_W||ty>=MAP_H) return true;
  if(solidTile(map[ty][tx])) return true;
  const key = tx+','+ty;
  return objSolid.has(key) || propSolid.has(key);
}
export function canMove(nx,ny){
  const hw=P.w/2, hh=P.h/2-2;
  return !(solidAt(nx-hw,ny-hh)||solidAt(nx+hw-1,ny-hh)||solidAt(nx-hw,ny+hh)||solidAt(nx+hw-1,ny+hh));
}

/* ---------- critters ---------- */
export function walkableForCow(tx,ty){
  if(tx<1||ty<1||tx>=MAP_W-1||ty>=MAP_H-1) return false;
  const t = map[ty][tx];
  if(t!==GRASS && t!==PATH && t!==SAND && t!==DESERT && t!==RAIL && t!==RUNWAY) return false;
  return !objSolid.has(tx+','+ty) && !propSolid.has(tx+','+ty);
}
$R.P = P;
