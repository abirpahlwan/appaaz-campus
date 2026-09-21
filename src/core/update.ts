// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */
import { $S, $R } from './state';
import { track } from './analytics';
import { BUILDINGS, DESERT, H, TILE, W, WATER } from '../world/config';
import { insideBuildingAt, map } from '../world/map';
import { updateWater } from '../world/water';
import { MOUNTAIN_FEATURES, objs } from '../world/objects';
import { doorChatter, maybeChatter } from '../world/chatter';
import { P, canMove, keys, walkableForCow } from '../entities/player';
import { cows, deer, flies, flyCow, goats, nearAnimal, rabbits, updateCritters, walkableForAnimal } from '../entities/critters';
import { updateLandmarkSeq } from '../world/landmark';



/* ---------- update ---------- */
$S.insideB = null; $S.lastInside = null;
export function update(){
  const blocked = document.getElementById('modal').classList.contains('on') ||
                  document.getElementById('classic').classList.contains('on') ||
                  document.getElementById('intro').style.display !== 'none' ||
                  !!$S.landmarkSeq;

  updateCritters();
  updateWater();
  if($S.T%30===0){
    const tx=Math.floor(P.x/TILE), ty=Math.floor(P.y/TILE), tile=map[ty]&&map[ty][tx];
    $R.AudioManager.setBiome(ty<20 && tx>=64 ? 'mountain' : tile===WATER ? 'water' : tile===DESERT ? 'desert' : 'village');
  }
  /* ambient animals: rabbits hop, goats/deer wander like cows */
  for(const r of rabbits){
    r.t--;
    if(r.petting>0) r.petting--;
    if(r.t<=0){
      r.t = 60+Math.random()*180;
      if(Math.random()<0.5){ r.vx=0; r.vy=0; r.hop=0; }
      else {
        const a=Math.random()*Math.PI*2;
        r.vx=Math.cos(a)*0.55; r.vy=Math.sin(a)*0.55;
        if(Math.abs(r.vx)>0.02) r.face=r.vx>0?1:-1;
        r.hop=20+Math.random()*30;
      }
    }
    if(r.hop>0) r.hop--;
    const nx=r.x+r.vx, ny=r.y+r.vy;
    if(walkableForAnimal(Math.floor(nx/TILE),Math.floor(r.y/TILE))) r.x=nx; else r.vx*=-1;
    if(walkableForAnimal(Math.floor(r.x/TILE),Math.floor(ny/TILE))) r.y=ny; else r.vy*=-1;
  }
  for(const g of goats){
    g.t--;
    if(g.petting>0) g.petting--;
    if(g.t<=0){
      g.t=90+Math.random()*220;
      if(Math.random()<0.45){ g.vx=0; g.vy=0; g.graze=60+Math.random()*120; }
      else { const a=Math.random()*Math.PI*2; g.vx=Math.cos(a)*0.18; g.vy=Math.sin(a)*0.18;
        if(Math.abs(g.vx)>0.02) g.face=g.vx>0?1:-1; }
    }
    if(g.graze>0){ g.graze--; continue; }
    const nx=g.x+g.vx, ny=g.y+g.vy;
    if(walkableForAnimal(Math.floor(nx/TILE),Math.floor(g.y/TILE))) g.x=nx; else { g.vx*=-1; g.face=g.vx>0?1:-1; }
    if(walkableForAnimal(Math.floor(g.x/TILE),Math.floor(ny/TILE))) g.y=ny; else g.vy*=-1;
  }
  for(const d2 of deer){
    d2.t--;
    if(d2.petting>0) d2.petting--;
    if(d2.mounted && $S.riding===d2){
      const nx=d2.x+$S.riding.vx, ny=d2.y+$S.riding.vy;
      if(walkableForAnimal(Math.floor(nx/TILE),Math.floor(d2.y/TILE))) d2.x=nx; else $S.riding.vx=0;
      if(walkableForAnimal(Math.floor(d2.x/TILE),Math.floor(ny/TILE))) d2.y=ny; else $S.riding.vy=0;
      continue;
    }
    if(d2.t<=0){
      d2.t=90+Math.random()*220;
      if(Math.random()<0.5){ d2.vx=0; d2.vy=0; d2.graze=60+Math.random()*120; }
      else { const a=Math.random()*Math.PI*2; d2.vx=Math.cos(a)*0.20; d2.vy=Math.sin(a)*0.20;
        if(Math.abs(d2.vx)>0.02) d2.face=d2.vx>0?1:-1; }
    }
    if(d2.graze>0){ d2.graze--; continue; }
    const nx=d2.x+d2.vx, ny=d2.y+d2.vy;
    if(walkableForAnimal(Math.floor(nx/TILE),Math.floor(d2.y/TILE))) d2.x=nx; else { d2.vx*=-1; d2.face=d2.vx>0?1:-1; }
    if(walkableForAnimal(Math.floor(d2.x/TILE),Math.floor(ny/TILE))) d2.y=ny; else d2.vy*=-1;
  }
  for(const c of cows){ if(c.petting>0) c.petting--; if(c.mounted && $S.riding===c){ const nx=c.x+$S.riding.vx, ny=c.y+$S.riding.vy; if(walkableForCow(Math.floor(nx/TILE),Math.floor(c.y/TILE))) c.x=nx; else $S.riding.vx=0; if(walkableForCow(Math.floor(c.x/TILE),Math.floor(ny/TILE))) c.y=ny; else $S.riding.vy=0; } }
  updateLandmarkSeq();
  for(const f of flies){ f.p += 0.02*f.s; f.x += Math.cos(f.p)*0.22; f.y += Math.sin(f.p*1.3)*0.16; }
  if(flyCow.active){
    flyCow.x += 1.5; flyCow.t++;
    if(flyCow.x > innerWidth+80) flyCow.active=false;
  } else if(--flyCow.next<=0){
    flyCow.active=true; flyCow.x=-90; flyCow.y=50+Math.random()*90; flyCow.t=0; flyCow.next=1400+Math.random()*1600;
  }

  if(!blocked){
    let dx=0, dy=0;
    if(keys['a']||keys['arrowleft'])  dx-=1;
    if(keys['d']||keys['arrowright']) dx+=1;
    if(keys['w']||keys['arrowup'])    dy-=1;
    if(keys['s']||keys['arrowdown'])  dy+=1;
    dx += $S.touchVec.x; dy += $S.touchVec.y;
    const len = Math.hypot(dx,dy);
    if(len>1){ dx/=len; dy/=len; }
    P.moving = len>0.08;
    if($S.riding){
      if(P.moving){
        $S.riding.vx = dx*P.speed*1.8;
        $S.riding.vy = dy*P.speed*1.8;
        if(Math.abs(dx)>Math.abs(dy)) $S.riding.face = dx>0?1:-1;
        P.x = $S.riding.x; P.y = $S.riding.y - 8;
        if(Math.abs(dx)>Math.abs(dy)) P.dir = dx>0?1:3; else P.dir = dy>0?2:0;
        P.anim += 0.2;
      } else { $S.riding.vx=0; $S.riding.vy=0; P.x=$S.riding.x; P.y=$S.riding.y-8; P.anim=0; }
    } else if(P.moving){
      if($S.R3on) $R.movePlayer3d(dx,dy);
    } else P.anim = 0;
  } else P.moving = false;

  /* 3D jetpack thrust — runs even without WASD */
  if($S.R3on && !blocked){
    if(P.alt===undefined){ P.alt=0; P.vy=0; }
    const fly=!!(keys[' ']||keys['z']), descend=!!(keys['shift']&&fly);
    const thrust=!descend&&fly;
    if(thrust) P.vy=Math.min(P.vy+0.55, 3.6);
    else if(descend) P.vy=Math.max(P.vy-0.8, -5.0);
    else P.vy=0;
    P.alt+=P.vy;
    if(P.alt>$R.FLY_CEIL){ P.alt=$R.FLY_CEIL; P.vy=0; }
    const g=$R.groundHeightAt(P.x,P.y,P.alt);
    const tt=(map[Math.floor(P.y/TILE)]||[])[Math.floor(P.x/TILE)];
    if(tt===WATER && P.alt<2){ P.alt=2; P.vy=0; }
    else if(P.alt<=g){ P.alt=g; if(P.vy<0) P.vy=0; }
    else if(!thrust && !descend && P.vy<=0 && P.alt-g<2.5){ P.alt=g; P.vy=0; }
    P._thrust=thrust;
  }

  /* which building am I in? */
  $S.insideB = insideBuildingAt(Math.floor(P.x/TILE), Math.floor(P.y/TILE));
  if($S.insideB !== $S.lastInside){
    if($S.insideB){
      $R.toast($S.insideB.label); $R.blip(560);
      if(!$S.insideB._entered) track('enter:'+$S.insideB.id);
      $S.insideB._entered=true;
    }
    $S.lastInside = $S.insideB;
  }
  for(const b of BUILDINGS){
    b.at = (b===$S.insideB) ? 0.10 : 1;
    b.a += (b.at - b.a) * 0.16;
  }

  if($S.bubble && $S.T > $S.bubble.until){ $S.bubble = null; const sp = document.getElementById('speech'); if(sp) sp.classList.remove('on'); }
  if(!blocked){ doorChatter(); maybeChatter(); }

  $S.near = $S.campusMode ? ($S.campusNear || null) : findNear();
  const nearA = (!$S.riding && !$S.campusMode) ? nearAnimal() : null;
  const pr = document.getElementById('prompt');
  if($S.riding && !blocked){
    pr.style.display='block';
    pr.innerHTML = (matchMedia('(pointer:coarse)').matches ? 'Tap <b>LOOK</b>' : 'Press <b>E</b>')
                 + ' — Dismount';
  } else if(nearA && !blocked){
    pr.style.display='block';
    const canMount = nearA.rideable && nearA.affinity>=3;
    const secondPress = canMount && $S.lastPetAnimal===nearA && ($S.T-$S.lastPetTime)<90;
    const act = secondPress ? 'Ride' : (canMount ? 'Pet (again to ride)' : 'Pet');
    pr.innerHTML = (matchMedia('(pointer:coarse)').matches ? 'Tap <b>LOOK</b>' : 'Press <b>E</b>')
                 + ' — ' + act + ' ' + nearA.name;
  } else if($S.near && !blocked){
    pr.style.display='block';
    pr.innerHTML = (matchMedia('(pointer:coarse)').matches ? 'Tap <b>LOOK</b>' : 'Press <b>E</b>')
                 + ' — ' + $S.near.label;
  } else pr.style.display='none';

}

$S.near = null;
function findNear(){
  if($S.R3on && (P.alt||0)>26) return null;   // jetpacking high above: nothing in reach
  let best=null, bd=1e9;
  for(const o of objs){
    if(o.home && o.home!==$S.insideB) continue;          // can't read what's under a roof
    const cx=o.x+o.pw/2, cy=o.y+o.ph/2;
    const d=Math.hypot(P.x-cx, P.y-cy);
    const reach = Math.max(o.pw,o.ph)/2 + 22;
    if(d<reach && d<bd){ bd=d; best=o; }
  }
  for(const f of MOUNTAIN_FEATURES){
    const d=Math.hypot(P.x-(f.x+8), P.y-(f.y+8));
    if(d<28 && d<bd){ bd=d; best=f; }
  }
  return best;
}