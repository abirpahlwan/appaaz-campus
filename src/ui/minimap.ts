// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */
import { $S } from '../core/state';
import { BUILDINGS, H, TILE, W, mm, mmx } from '../world/config';
import { POND } from '../world/map';
import { objs } from '../world/objects';
import { P } from '../entities/player';
import { mother } from '../entities/critters';
import { shade } from '../core/util';



export function drawMinimap(){
  mmx.clearRect(0,0,mm.width,mm.height);
  const sx=mm.width/W, sy=mm.height/H;
  mmx.fillStyle='#6fc24e'; mmx.fillRect(0,0,mm.width,mm.height);
  mmx.fillStyle='#e0bd76'; mmx.fillRect(240*TILE*sx,140*TILE*sy,45*TILE*sx,35*TILE*sy);
  mmx.fillStyle='#93a1b8'; mmx.fillRect(1*TILE*sx,1*TILE*sy,14*TILE*sx,23*TILE*sy);
  mmx.fillStyle='#5f6f88'; mmx.fillRect(255*TILE*sx,166*TILE*sy,8*TILE*sx,3*TILE*sy);
  mmx.fillStyle='#46d6ea';
  mmx.beginPath();
  mmx.ellipse(POND.cx*TILE*sx, POND.cy*TILE*sy, POND.rx*TILE*sx, POND.ry*TILE*sy,0,0,6.3);
  mmx.fill();
  for(const b of BUILDINGS){
    mmx.fillStyle=(b===$S.insideB)? shade(b.roof,.18) : b.roof;
    mmx.fillRect(b.x*TILE*sx, b.y*TILE*sy, b.w*TILE*sx, b.h*TILE*sy);
  }
  for(const o of objs){
    mmx.fillStyle = o.seen ? 'rgba(51,36,28,.45)' : '#fff45c';
    mmx.beginPath(); mmx.arc(o.x*sx, o.y*sy, o.seen?1.4:2.2, 0, 6.3); mmx.fill();
  }
  mmx.fillStyle='#fff'; mmx.beginPath(); mmx.arc(mother.x*sx, mother.y*sy, 1.4,0,6.3); mmx.fill();
  mmx.fillStyle='#eab308'; mmx.strokeStyle='#fff'; mmx.lineWidth=1.4;
  mmx.beginPath(); mmx.arc(P.x*sx, P.y*sy, 3,0,6.3); mmx.fill(); mmx.stroke();
}