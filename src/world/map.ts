// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */
import { BUILDINGS, DESERT, FLOOR, GRASS, MAP_H, MAP_W, PATH, RAIL, ROCK, RUNWAY, SAND, TREE, WALL, WATER, hash } from './config';



/* pond */
export const POND = {cx:150, cy:90, rx:15, ry:10};
export function inPond(tx,ty){
  const dx=(tx-POND.cx)/POND.rx, dy=(ty-POND.cy)/POND.ry;
  return dx*dx+dy*dy <= 1;
}
function pondEdge(tx,ty){
  const dx=(tx-POND.cx)/(POND.rx+1.1), dy=(ty-POND.cy)/(POND.ry+1.1);
  return dx*dx+dy*dy <= 1;
}

/* ---------- terrain ---------- */
export const map = [];
for(let y=0;y<MAP_H;y++){ map[y]=[]; for(let x=0;x<MAP_W;x++) map[y][x]=GRASS; }

/* pond + sandy shore */
for(let y=0;y<MAP_H;y++) for(let x=0;x<MAP_W;x++){
  if(inPond(x,y)) map[y][x]=WATER;
}

/* paths */
function lay(x,y,c){ if(map[y]&&map[y][x]!==undefined && map[y][x]===GRASS) map[y][x]=c; }
function forceLay(x,y,c){ if(map[y]&&map[y][x]!==undefined) map[y][x]=c; }

/* main road network: large cross + ring around pond */
for(let x=60;x<=240;x++){ lay(x,50,PATH); lay(x,51,PATH); }
for(let x=60;x<=240;x++){ lay(x,140,PATH); lay(x,141,PATH); }
for(let y=20;y<=180;y++){ lay(120,y,PATH); lay(121,y,PATH); }
for(let y=20;y<=180;y++){ lay(180,y,PATH); lay(181,y,PATH); }
for(let x=120;x<=181;x++){ lay(x,95,PATH); lay(x,96,PATH); }
for(let x=120;x<=181;x++){ lay(x,105,PATH); lay(x,106,PATH); }
for(let y=95;y<=106;y++){ lay(118,y,PATH); lay(119,y,PATH); }
for(let y=95;y<=106;y++){ lay(182,y,PATH); lay(183,y,PATH); }

/* diagonal connecting paths between main roads */
for(let i=0;i<=60;i++){ lay(60+i,50+i,PATH); lay(61+i,51+i,PATH); }
for(let i=0;i<=60;i++){ lay(180-i,50+i,PATH); lay(181-i,51+i,PATH); }
for(let i=0;i<=40;i++){ lay(60+i,140-i,PATH); lay(61+i,141-i,PATH); }
for(let i=0;i<=40;i++){ lay(240-i,140-i,PATH); lay(241-i,141-i,PATH); }
for(let i=0;i<=50;i++){ lay(120-i,95-i,PATH); lay(121-i,96-i,PATH); }
for(let i=0;i<=50;i++){ lay(181+i,95-i,PATH); lay(182+i,96-i,PATH); }

/* stubs from each building door to nearest road */
BUILDINGS.forEach(b=>{
  const dy=b.y+b.h;
  let targetY;
  if(dy<95) targetY=50;
  else if(dy<140) targetY=140;
  else targetY=180;
  const from=Math.min(dy,targetY), to=Math.max(dy,targetY);
  for(let y=from;y<=to;y++){ lay(b.door,y,PATH); lay(b.door+1,y,PATH); }
});

/* border trees + scattered woods */
for(let y=0;y<MAP_H;y++) for(let x=0;x<MAP_W;x++){
  if(x<2||y<2||x>MAP_W-3||y>MAP_H-3){ map[y][x]=TREE; continue; }
  if(map[y][x]===GRASS && hash(x,y)>0.942) map[y][x]=TREE;
}

/* ---------- expanded world regions ---------- */
/* mountains: outer edges (N, E, W, S) */
for(let y=1;y<25;y++) for(let x=1;x<MAP_W-1;x++){
  if(map[y][x]===GRASS){
    const h=hash(x,y);
    if(h>0.65) map[y][x]=ROCK;
    else if(h>0.45) map[y][x]=TREE;
  }
}
for(let y=1;y<MAP_H-1;y++) for(let x=1;x<15;x++){
  if(map[y][x]===GRASS){
    const h=hash(x,y);
    if(h>0.70) map[y][x]=ROCK;
    else if(h>0.55) map[y][x]=TREE;
  }
}
for(let y=1;y<MAP_H-1;y++) for(let x=MAP_W-15;x<MAP_W-1;x++){
  if(map[y][x]===GRASS){
    const h=hash(x,y);
    if(h>0.70) map[y][x]=ROCK;
    else if(h>0.55) map[y][x]=TREE;
  }
}
for(let y=MAP_H-20;y<MAP_H-1;y++) for(let x=1;x<MAP_W-1;x++){
  if(map[y][x]===GRASS){
    const h=hash(x,y);
    if(h>0.72) map[y][x]=ROCK;
    else if(h>0.55) map[y][x]=TREE;
  }
}
/* desert: SE corner */
for(let y=140;y<MAP_H-20;y++) for(let x=240;x<MAP_W-15;x++){
  if(map[y][x]===GRASS){
    const h=hash(x,y);
    if(h>0.82) map[y][x]=ROCK;
    else map[y][x]=DESERT;
  }
}
/* south gardens: dense trees in the SW */
for(let y=140;y<MAP_H-20;y++) for(let x=15;x<100;x++){
  if(map[y][x]===GRASS && hash(x+99,y+77)>0.88) map[y][x]=TREE;
}
/* rail track through SE */
for(let x=250;x<MAP_W-10;x++){ lay(x,160,RAIL); lay(x,161,RAIL); }
for(let x=255;x<270;x++){ lay(x,168,RUNWAY); lay(x,169,RUNWAY); lay(x,170,RUNWAY); }
/* path connecting railway station area */
for(let x=240;x<=260;x++){ lay(x,155,PATH); lay(x,156,PATH); }
for(let y=141;y<=160;y++){ lay(245,y,PATH); lay(246,y,PATH); }
/* path to mountain peak area (260,10) - walkable switchback */
for(let y=25;y>=15;y--){ forceLay(258,y,PATH); forceLay(259,y,PATH); }
for(let x=250;x<=265;x++){ forceLay(x,15,PATH); forceLay(x,16,PATH); }
for(let y=15;y>=8;y--){ forceLay(263,y,PATH); forceLay(264,y,PATH); }
for(let x=255;x<=270;x++){ forceLay(x,25,PATH); }
/* level 5 crossing */
for(const [bx,by] of [[255,15],[256,15],[257,15],[258,15]]) forceLay(bx,by,PATH);
/* pond outlet: short stream feeding the river */
for(let y=80;y<=85;y++){
  if(map[y] && (map[y][165]===GRASS || map[y][165]===TREE)) map[y][165]=WATER;
}
/* winding river through the center from top to bottom */
for(let y=1;y<MAP_H-1;y++){
  const rx = 165 + Math.round(Math.sin(y*0.04)*12 + Math.cos(y*0.07)*6);
  if(rx>0 && rx<MAP_W-1 && map[y][rx]===GRASS) map[y][rx]=WATER;
  if(rx+1>0 && rx+1<MAP_W-1 && map[y][rx+1]===GRASS) map[y][rx+1]=WATER;
  if(y>30 && rx-1>0 && map[y][rx-1]===GRASS) map[y][rx-1]=WATER;
}
/* terraced fields: tilled bands in the SW */
for(let y=160;y<MAP_H-20;y++) for(let x=15;x<=60;x++){
  if((y-160)%6>=4 && (map[y][x]===GRASS || map[y][x]===TREE)) map[y][x]=SAND;
}
/* border trees for expanded area */
for(let y=0;y<MAP_H;y++) for(let x=0;x<MAP_W;x++){
  if(x<1||y<1||x>MAP_W-2||y>MAP_H-2) map[y][x]=TREE;
}

/* clear walkable area around landmarks */
const landmarkTiles = [
  {tx:258, ty:8, w:3, h:2},
  {tx:150, ty:48, w:2, h:2},
  {tx:245, ty:158, w:3, h:2},
  {tx:255, ty:166, w:3, h:2},
  {tx:265, ty:166, w:2, h:3}
];
for(const lm of landmarkTiles){
  for(let y=lm.ty-1;y<=lm.ty+lm.h;y++) for(let x=lm.tx-1;x<=lm.tx+lm.w;x++){
    if(map[y]&&map[y][x]!==undefined){
      const t=map[y][x];
      if(t===ROCK||t===TREE||t===WATER) map[y][x]=GRASS;
    }
  }
}

/* buildings punch into the terrain */
BUILDINGS.forEach(b=>{
  for(let y=b.y; y<b.y+b.h; y++) for(let x=b.x; x<b.x+b.w; x++){
    const edge = (x===b.x||x===b.x+b.w-1||y===b.y||y===b.y+b.h-1);
    map[y][x] = edge ? WALL : FLOOR;
  }
  map[b.y+b.h-1][b.door] = FLOOR;              // the doorway
  for(let y=b.y+b.h; y<b.y+b.h+2 && y<MAP_H-1; y++){ map[y][b.door]=PATH; map[y][b.door+1]=PATH; }
});

export function insideBuildingAt(tx,ty){
  for(const b of BUILDINGS)
    if(tx>=b.x && tx<b.x+b.w && ty>=b.y && ty<=b.y+b.h-2) return b;
  return null;
}