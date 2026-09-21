// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */
import { $S, $R } from '../core/state';
import { LOOK, sunDirection } from './look';
import { quality, tickQuality } from './quality';
import { SHOTS } from './devpanel';
import * as THREE_NS from 'three';
import { H, W } from '../world/config';
import { renderWater } from '../world/water';
import { P, keys } from '../entities/player';
import { cows, deer, dismount, ducklings, goats, mother, rabbits } from '../entities/critters';
import { update } from '../core/update';
import { RM, gliders } from './sky-legacy';
import { drawMinimap } from '../ui/minimap';
import { R3X, R3Z, groundHeightAt, terrainH } from '../world/terrain3d';
import { loadFlora, loadSprites } from '../assets/loaders';
import { init3d } from './scene3d';


function render3d(){
  const R=$S.R3; $S.T++; renderWater();
  R.wtex.needsUpdate=true;
  for(const e of R.blds){
    e.mesh.material.opacity=e.b.a;
    e.label.material.opacity=e.b.a;
    e.label.quaternion.copy(R.cam.quaternion);
    e.door.material.color.set(e.b.a<=0.5?'#4ADE80':'#c98d4f');
  }
  /* high-rise occlusion fade (HR): raycast camera->player, interposing towers 0.25 */
  if(!R.occ) R.occ={ray:new THREE.Raycaster(), dir:new THREE.Vector3(), tgt:new THREE.Vector3()};
  R.occ.tgt.set(R3X(P.x), (P.alt||0)+10, R3Z(P.y));
  R.occ.dir.copy(R.occ.tgt).sub(R.cam.position);
  const occD=R.occ.dir.length()||1;
  R.occ.ray.set(R.cam.position, R.occ.dir.multiplyScalar(1/occD));
  R.occ.ray.far=occD-8;
  for(const e of R.blds){
    if(e.mesh.material.opacity>0.26&&R.occ.ray.intersectObject(e.mesh,false).length){
      e.mesh.material.opacity=0.25; e.label.material.opacity=0.25;
    }
  }
  /* player humanoid */
  if(P.alt===undefined){ P.alt=0; P.vy=0; }
  const pl=R.player, s=Math.sin(P.anim*1.6), flying=(P.alt||0)>2;
  const gy=groundHeightAt(P.x,P.y,P.alt);
  pl.group.position.set(R3X(P.x), P.alt, R3Z(P.y));
  pl.group.rotation.y=[Math.PI,Math.PI/2,0,-Math.PI/2][P.dir]||0;
  const sw=P.moving&&!flying?s:0;
  pl.legL.rotation.x=sw*0.55; pl.legR.rotation.x=-sw*0.55;
  pl.armL.rotation.x=-sw*0.4; pl.armR.rotation.x=sw*0.4;
  pl.armL.rotation.z=0.08; pl.armR.rotation.z=-0.08;
  if(flying){
    pl.legL.rotation.x=pl.legR.rotation.x=-0.8;
    pl.armL.rotation.z=0.9; pl.armR.rotation.z=-0.9;
  }
  if(!flying) pl.group.position.y+=Math.abs(sw)*0.8;
  pl.flame.visible=!!P._thrust;
  if(P._thrust) pl.flame.scale.set(1,0.8+Math.random()*0.5,1);
  /* critters: cylindrical Y-billboards — face the camera around Y (stay
     upright), pick front/back/side art by movement relative to the camera */
  let ci=0;
  const putSprite=(x,y,vx,vy,duck,hop)=>{
    const e=R.critters[ci++]; if(!e) return;
    const m=e.mesh;
    const sp=Math.hypot(vx||0,vy||0);
    const moving=!RM&&(duck?true:sp>0.02);
    if(sp>0.02) e.heading=Math.atan2(vx,vy);
    /* cylindrical billboard: yaw the plane normal (+Z) at the camera */
    const camYaw=Math.atan2(R.cam.position.x-m.position.x, R.cam.position.z-m.position.z);
    m.rotation.y=camYaw;
    let rel=e.heading-camYaw;
    while(rel>Math.PI) rel-=Math.PI*2;
    while(rel<-Math.PI) rel+=Math.PI*2;
    const dir=(rel>=-Math.PI/4&&rel<Math.PI/4)?'front'
      :(rel>=Math.PI/4&&rel<3*Math.PI/4)?'right'
      :(rel>=-3*Math.PI/4&&rel<-Math.PI/4)?'left':'back';
    const set=e.dirs[dir];
    const fr=(moving&&set.walk.length)?set.walk[Math.floor($S.T/8+e.phase)%set.walk.length]:set.idle;
    if(m.material.map!==fr.t){ m.material.map=fr.t; m.customDepthMaterial.map=fr.t; }
    const lift=(hop>0)?2.5*Math.abs(Math.sin($S.T*0.3)):0;
    /* upright cutouts pivot at the feet: subtract the cell's transparent
       bottom padding so visible hooves (not the plane edge) sit on the
       ground; -0.3 plants them firmly. Ducks swim: waterline at -0.2. */
    const ground=duck?-0.2:terrainH(x,y);
    m.position.set(R3X(x),ground-fr.pad*e.h-0.3+lift,R3Z(y));
  };
  for(const c of cows) putSprite(c.x,c.y,c.vx,c.vy);
  for(const r of rabbits) putSprite(r.x,r.y,r.vx,r.vy,false,r.hop);
  for(const g of goats) putSprite(g.x,g.y,g.vx,g.vy);
  for(const d of deer) putSprite(d.x,d.y,d.vx,d.vy);
  putSprite(mother.x,mother.y,Math.cos(mother.a),Math.sin(mother.a),true);
  for(const k of ducklings) putSprite(k.x,k.y,Math.cos(mother.a),Math.sin(mother.a),true);
  /* tree sway */
  for(const td of R.treeData){
    R.dummy.position.set(td.x, td.gy, td.z);
    R.dummy.rotation.set(0,0,Math.sin($S.T*0.02+td.ph)*0.05);
    R.dummy.scale.setScalar(td.s);
    R.dummy.updateMatrix();
    td.im.setMatrixAt(td.idx, R.dummy.matrix);
  }
  for(const tm of R.treeMeshes) tm.im.instanceMatrix.needsUpdate=true;
  /* gliders ride high */
  if(!RM){ for(const gg of gliders){ gg.x+=gg.v; if(gg.x>W+60){ gg.x=-60; gg.y=Math.random()*H*0.7; } } }
  R.gl3.forEach((grp,i)=>{ grp.position.set(R3X(gliders[i].x), 215+i*16, R3Z(gliders[i].y));
    grp.rotation.z=Math.sin($S.T*0.003+gliders[i].ph)*0.08; });
  /* follow camera + travelling sun */
  const fy=Math.max(gy, P.alt||0);
  R.camS.x+=(P.x-R.camS.x)*0.12; R.camS.z+=(P.y-R.camS.z)*0.12; R.camS.y+=(fy-R.camS.y)*0.12;
  const shotJob=$S.shotJob;
  if(shotJob){ if(!shotJob.saved) shotJob.saved=[$S.camAngleDeg,$S.camDist]; const sh=SHOTS[shotJob.i]; $S.camAngleDeg=sh.pitch; $S.camDist=sh.dist; }
  const pitch=$S.camAngleDeg*Math.PI/180, D=$S.camDist;
  const camY=R.camS.y+D*Math.sin(pitch);
  R.cam.position.set(R3X(R.camS.x), camY, R3Z(R.camS.z)+D*Math.cos(pitch));
  R.cam.lookAt(R3X(R.camS.x), R.camS.y+14, R3Z(R.camS.z));
  if($S.debugCam){ const dc=$S.debugCam; R.cam.position.set(dc.pos[0],dc.pos[1],dc.pos[2]); R.cam.lookAt(dc.target[0],dc.target[1],dc.target[2]); if(dc.fov&&R.cam.fov!==dc.fov){ R.cam.fov=dc.fov; R.cam.updateProjectionMatrix(); } }
  const SD=sunDirection(new THREE_NS.Vector3());
  R.sun.position.set(R3X(P.x)+SD.x*700, SD.y*700, R3Z(P.y)+SD.z*700);
  R.sun.target.position.set(R3X(P.x), 0, R3Z(P.y));
  R.rimLight.position.set(R3X(P.x)+300, 280, R3Z(P.y)+300);
  R.rimLight.target.position.set(R3X(P.x), 0, R3Z(P.y));
  /* pollen motes sink slowly, always around the action (3D-look pass) */
  if(!RM){
    const mp=R.motes.geometry.attributes.position;
    for(let i=0;i<mp.count;i++){ const y=mp.getY(i)-0.22; mp.setY(i, y<1?52:y); }
    mp.needsUpdate=true;
    R.motes.position.set(R3X(R.camS.x), 0, R3Z(R.camS.z));
  }
  /* cloud drift */
  if(R.cloud3d){ for(const c of R.cloud3d){ c.group.position.x+=c.speed; if(c.group.position.x>2400) c.group.position.x=-2400; } }
  /* birds circle and bob */
  if(R.bird3){ for(const b of R.bird3){
    b.phase+=b.speed;
    b.group.position.x=b.cx+Math.cos(b.phase)*b.r;
    b.group.position.z=b.cz+Math.sin(b.phase)*b.r;
    b.group.position.y=b.baseY+Math.sin(b.bobPhase+$S.T*0.004)*8;
    b.group.rotation.y=b.phase+Math.PI/2;
  }}
  const nowMs=performance.now(), dtMs=nowMs-(R.lastMs||nowMs); R.lastMs=nowMs;
  R.sky.update(nowMs/1000, R.cam.position); R.ocean.update(nowMs/1000);
  R.sun.color.set(LOOK.sunColor); R.sun.intensity=LOOK.sunIntensity;
  R.hemi.color.set(LOOK.hemiSky); R.hemi.groundColor.set(LOOK.hemiGround); R.hemi.intensity=LOOK.hemiIntensity;
  R.scene.fog.color.set(LOOK.fogColor); R.scene.fog.near=LOOK.fogNear; R.scene.fog.far=LOOK.fogFar;
  R.scene.background.set(LOOK.skyHorizon);
  if(tickQuality(dtMs)) R.applyQuality();
  R.post.render(dtMs/1000);
  if(shotJob){ shotJob.frames++; if(shotJob.frames>=4){
    const a=document.createElement('a'); a.href=R.renderer.domElement.toDataURL('image/png'); a.download='campus-'+SHOTS[shotJob.i].name+'.png'; a.click();
    shotJob.i++; shotJob.frames=0;
    if(shotJob.i>=SHOTS.length){ $S.camAngleDeg=shotJob.saved[0]; $S.camDist=shotJob.saved[1]; $S.shotJob=null; } } }
  drawMinimap();
}
export function start3d(){
  return Promise.all([loadFlora(), loadSprites()]).then(([F,SP])=>{ $S.R3flora=F; $S.R3sprites=SP; if(!init3d(F,SP)) throw new Error('3D failed to start'); flip3d(); });
}
function flip3d(){
  $S.R3on=true;
  document.getElementById('game3d').style.display='block';
  document.getElementById('game').style.display='none';
  document.getElementById('flybtn').style.display=(matchMedia('(pointer:coarse)').matches)?'block':'none';
  if(P.alt===undefined){ P.alt=0; P.vy=0; }
  if($S.riding) dismount();
  $R.toast('WASD / stick to move \u00b7 hold SPACE / FLY for jetpack \u00b7 E interacts');
  $S.R3.size3d();
}


















document.getElementById('camAngle').oninput=e=>{
  $S.camAngleDeg=+e.target.value;
  document.getElementById('camAngleVal').textContent=$S.camAngleDeg+'°';
};
document.getElementById('camDist').oninput=e=>{
  $S.camDist=+e.target.value;
  document.getElementById('camDistVal').textContent=$S.camDist;
};
const flyBtn=document.getElementById('flybtn');
let flyHeld=false;
flyBtn.addEventListener('pointerdown', e=>{ e.preventDefault(); flyHeld=true; keys['z']=true; });
addEventListener('pointerup', ()=>{ if(flyHeld){ flyHeld=false; keys['z']=false; } });

export function loop(){
  update();
  if($S.R3on) render3d();

  requestAnimationFrame(loop);
}