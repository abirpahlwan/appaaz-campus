// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */
import { $S } from '../core/state';




/* ==================================================================
   2.  WORLD
   ================================================================== */
export const TILE = 16, MAP_W = 300, MAP_H = 200;
export const W = MAP_W*TILE, H = MAP_H*TILE;

/* terrain codes */
export const GRASS=0, PATH=1, WATER=2, FLOOR=3, WALL=4, TREE=5, SAND=6, ROCK=7, DESERT=8, RAIL=9, RUNWAY=10;

export const cvs = document.getElementById('game');
$S.ctx = cvs.getContext('2d');
export const mm  = document.getElementById('minimap');
export const mmx = mm.getContext('2d');

/* deterministic per-tile noise */
export function hash(x,y){ let n = x*374761393 + y*668265263; n = (n^(n>>13))*1274126177; return ((n^(n>>16))>>>0)/4294967296; }

/* ---------- buildings ---------- */
export const BUILDINGS = [
  {id:'about', line:"Welcome to appaaz;. Every door in this campus opens onto something we build.",  label:'WELCOME',                    x:20,  y:15,  w:12, h:9, door:25,  roof:'#8c4b3a'},
  {id:'games', line:"Six things we've shipped, one cabinet each.",  label:'PROJECT GALLERY',        x:100, y:20,  w:26, h:9, door:111, roof:'#7a3f5e'},
  {id:'sys', line:"The quiet layer under everything: cloud, deployment, reliability.",    label:'CLOUD',        x:200, y:15,  w:12, h:9, door:205, roof:'#3f5f7a'},
  {id:'multi', line:"What we do: web, mobile, AI and data.",  label:'SERVICES',x:30, y:80, w:22, h:9, door:39, roof:'#8a6b34'},
  {id:'craft', line:"The toolbox. Languages, frameworks, data and platforms.",  label:'OUR STACK',                    x:150, y:100, w:12, h:9, door:155, roof:'#4a7a52'},
  {id:'xr', line:"How a project moves: discover, build, launch.",     label:'PROCESS', x:230,  y:80, w:24, h:9, door:240, roof:'#5b4a86'},
  {id:'career', line:"Where we work, and who we work with.", label:'GLOBAL HUB',                   x:80, y:150, w:15, h:9, door:86, roof:'#7a5a3a'},
  {id:'contact', line:"The terminal. If you want to build something, start here.",label:'START A PROJECT',                  x:200, y:150, w:11, h:9, door:204, roof:'#3f6f6a'}
];
BUILDINGS.forEach(b=>{ b.a=1; b.at=1; });