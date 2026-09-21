// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */
import { $R } from '../core/state';
import { BUILDINGS, DESERT, FLOOR, GRASS, H, MAP_H, MAP_W, RAIL, ROCK, RUNWAY, SAND, TILE, TREE, W, WALL, WATER, hash } from './config';
import { map } from './map';
import { objSolid, propSolid } from './objects';
import { P } from '../entities/player';



/* ================= REAL 3D WORLD =================
   Heightfield terrain + merged-geometry buildings, trees, props, critters,
   a jointed player humanoid with a jetpack, and a follow camera.
   The sim (movement intent, collision intent, interactions, saves, audio)
   stays 2D-grid based; this block only adds altitude + 3D presentation. */
export const WALL_H = 30, ROOF_H = 30, TREE_H = 27, FLY_CEIL = 750;
export const R3X = x => x - W/2, R3Z = y => y - H/2;
function tileBaseH(t, tx, ty){
  switch(t){
    case ROCK: return 26;
    case WATER: return -5;
    case DESERT: return 3 + hash(tx*7+3, ty*7+9)*2;
    case SAND: return 1;
    case FLOOR: case WALL: return 1;
    case RAIL: case RUNWAY: return 0.5;
    default: return (hash(tx*3+1, ty*3+2)-0.5)*3;
  }
}
export const HGRID = [];
for(let jy=0; jy<=MAP_H; jy++){ HGRID[jy]=[];
  for(let ix=0; ix<=MAP_W; ix++){
    let sum=0, n=0, flat=true;
    for(let ay=jy-1; ay<=jy; ay++) for(let ax=ix-1; ax<=ix; ax++){
      const t=(map[ay]&&map[ay][ax]!==undefined)?map[ay][ax]:GRASS;
      sum+=tileBaseH(t, Math.max(0,Math.min(MAP_W-1,ax)), Math.max(0,Math.min(MAP_H-1,ay))); n++;
      if(t!==FLOOR&&t!==WALL) flat=false;
    }
    HGRID[jy][ix]= flat ? 1 : sum/n;
  }
}
export function terrainH(px, py){
  let fx=px/TILE, fy=py/TILE;
  fx=Math.max(0,Math.min(MAP_W-0.001,fx)); fy=Math.max(0,Math.min(MAP_H-0.001,fy));
  const x0=Math.floor(fx), y0=Math.floor(fy), ax=fx-x0, ay=fy-y0;
  const a=HGRID[y0][x0], b=HGRID[y0][x0+1], c=HGRID[y0+1][x0], d=HGRID[y0+1][x0+1];
  return a+(b-a)*ax+(c-a)*ay+(a-b-c+d)*ax*ay;
}
function cornerMax(tx,ty){
  let m=-1e9;
  for(let jy=ty;jy<=ty+1;jy++) for(let ix=tx;ix<=tx+1;ix++)
    m=Math.max(m, HGRID[Math.max(0,Math.min(MAP_H,jy))][Math.max(0,Math.min(MAP_W,ix))]);
  return m;
}
function roofAt(tx,ty){
  for(const b of BUILDINGS)
    if(tx>=b.x&&tx<b.x+b.w&&ty>=b.y&&ty<b.y+b.h) return b.roofH||ROOF_H;
  return -1e9;
}
/* top of the tower covering a tile (HR high-rises); falls back to WALL_H pre-init */
function wallTopAt(tx,ty){
  for(const b of BUILDINGS)
    if(tx>=b.x&&tx<b.x+b.w&&ty>=b.y&&ty<b.y+b.h) return b.roofH||WALL_H;
  return WALL_H;
}
export function groundHeightAt(px,py,alt){
  const g=terrainH(px,py);
  const tx=Math.floor(px/TILE), ty=Math.floor(py/TILE);
  let top=-1e9;
  if(tx>=0&&ty>=0&&tx<MAP_W&&ty<MAP_H) top=roofAt(tx,ty);
  if(top>0&&(alt||0)>=top-2) return top;
  return g;
}
function passable3(tx,ty,alt){
  if(tx<0||ty<0||tx>=MAP_W||ty>=MAP_H) return false;
  const t=map[ty][tx], key=tx+','+ty;
  if(t===WATER) return alt>=2;
  if(t===WALL) return alt>=wallTopAt(tx,ty);
  if(t===TREE) return alt>=TREE_H;
  if(t===ROCK) return alt>=cornerMax(tx,ty)-2;
  if((objSolid.has(key)||propSolid.has(key)) && alt<16) return false;
  return true;
}
function movePlayer3d(dx,dy){
  if(P.alt===undefined){ P.alt=0; P.vy=0; }
  if(Math.abs(dx)>Math.abs(dy)) P.dir = dx>0?1:3; else P.dir = dy>0?2:0;
  const air=P.alt>0.5, sp=P.speed*2*(air?1.55:1), r=5;
  const ok=(nx,ny)=>{
    for(const [qx,qy] of [[nx-r,ny-r],[nx+r,ny-r],[nx-r,ny+r],[nx+r,ny+r]])
      if(!passable3(Math.floor(qx/TILE),Math.floor(qy/TILE),P.alt)) return false;
    return true;
  };
  const nx=P.x+dx*sp, ny=P.y+dy*sp;
  if(ok(nx,P.y) && groundHeightAt(nx,P.y,P.alt)<=P.alt+7) P.x=nx;
  if(ok(P.x,ny) && groundHeightAt(P.x,ny,P.alt)<=P.alt+7) P.y=ny;
  P.anim+=0.2;
}
$R.FLY_CEIL = FLY_CEIL;
$R.groundHeightAt = groundHeightAt;
$R.movePlayer3d = movePlayer3d;
