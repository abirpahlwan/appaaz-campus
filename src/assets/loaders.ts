// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */
import { R3X, R3Z, terrainH } from '../world/terrain3d';
import { batPutGeo } from '../render/geo';
import { FLORA, KIT3D } from './catalog';
import { parseKenneyOBJ } from './kenney-obj';



export function loadFlora(){
  const load=([key,file,h],base)=>Promise.all([
    fetch(base+file+'.obj').then(r=>{ if(!r.ok) throw 0; return r.text(); }),
    fetch(base+file+'.mtl').then(r=>{ if(!r.ok) throw 0; return r.text(); })
  ]).then(([o,m])=>[key, parseKenneyOBJ(o,m,h)]).catch(e=>{console.warn('loadFlora fail:',key,e);return null;});
  const jobs=Object.entries(FLORA).map(([key,[file,h]])=>{
    const base=file.includes('/')?'assets/kenney/':'assets/kenney/nature/';
    return load([key,file,h],base);
  });
  const jobs2=Object.entries(KIT3D).map(([key,[file,h]])=>
    load([key,file,h],'assets/kenney/'));
  return Promise.all(jobs.concat(jobs2)).then(es=>Object.fromEntries(es.filter(Boolean)));
}
export function kioskAt(bat,px,py,color,kind,geo){
  const gy=terrainH(px,py), x=R3X(px), z=R3Z(py);
  if(kind==='arcade'&&geo){
    /* mini-arcade cabinet, screen faces south (+Z); plinth flush on ground,
       cabinet on the plinth, accent marquee mounted on the cabinet top (3D-houses) */
    bat.box(9,1.5,11,'#23272e',x,gy+0.75,z);
    batPutGeo(bat, geo, x, gy+1.5, z, 0);
    bat.box(8,3,1.5,color,x,gy+17,z+4.5);
    return;
  }
  /* tapered plinth stack, every tier resting flush on the one below, cap +
     marker finial on top (3D-houses) */
  bat.box(9,3,9,'#36493f',x,gy+1.5,z);
  bat.box(7,6,7,color,x,gy+6,z);
  bat.box(5,5,5,'#36493f',x,gy+11.5,z);
  bat.box(4,3,4,color,x,gy+15.5,z);
  bat.box(7,2,7,'#ffffff',x,gy+18,z);
  bat.box(3,2,3,color,x,gy+20,z);
}
export function propMesh3(p,bat){
  const x=R3X(p.x+8), z=R3Z(p.y+8), gy=terrainH(p.x+8,p.y+8);
  switch(p.k){
    case 'bench':
      bat.box(16,2,6,'#9a6440',x,gy+7,z); bat.box(16,6,2,'#9a6440',x,gy+11,z-2);
      bat.box(2,6,2,'#7a4c2f',x-6,gy+3,z); bat.box(2,6,2,'#7a4c2f',x+6,gy+3,z); break;
    case 'crate': bat.box(10,10,10,'#a87b45',x,gy+5,z); break;
    case 'barrel': bat.put(new THREE.CylinderGeometry(4,4.5,11,8),x,gy+5.5,z,'#7a4c2f'); break;
    case 'lamp':
      bat.box(2,22,2,'#232f2a',x,gy+11,z);
      bat.put(new THREE.ConeGeometry(6,4,4),x,gy+24,z,'#36493f');
      bat.box(4,3,4,'#FDE047',x,gy+22.5,z); break;
    case 'flowers': break; /* Kenney flower meshes, placed in init3d */
    case 'rock': break;
    case 'sign':
      bat.box(2,12,2,'#7a4c2f',x,gy+6,z); bat.box(12,7,1.5,'#e8dcc0',x,gy+15.5,z); break;
    case 'bush': break; /* Kenney bush meshes, placed in init3d */
    case 'haybale': bat.box(10,7,8,'#e2bd7f',x,gy+3.5,z); break;
  }
}
/* CraftPix critter sprites as upright Y-billboards (paper figures standing on
   the terrain, pivot at the feet, face normal +Z). One square plane per
   species; world size matched to the 3D cast (player ~22 tall, walls 30):
   cow 22, deer 19, goat 17, rooster 13, hare 11, chick 8.5.
   Sheet layout: 6x8 sheets (bull/sheep/rooster/chick) rows 0-3 walk
   front/back/sideL/sideR, rows 4-7 idle front/back/sideL/sideR col 0;
   split sheets (deer/hare) walk file rows 0-3, idle file rows 0-3 col 0. */
export function loadSprites(){
  const loadImg=file=>new Promise((res,rej)=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=rej; im.src=file; });
  /* Cut one cell + measure transparent padding below the visible pixels
     (alphaTest 0.4 discards alpha<~102, so the hooves sit pad*h above the
     plane base). Grounding subtracts pad*h so visible feet touch terrain. */
  const cut=(img,cw,ch,c,r)=>{
    const cv=document.createElement('canvas'); cv.width=cw; cv.height=ch;
    const g=cv.getContext('2d');
    g.drawImage(img,c*cw,r*ch,cw,ch,0,0,cw,ch);
    let pad=0;
    try{
      const d=g.getImageData(0,0,cw,ch).data;
      let low=-1;
      for(let y=ch-1;y>=0&&low<0;y--)
        for(let x=0;x<cw;x++){ if(d[(y*cw+x)*4+3]>=102){ low=y; break; } }
      pad=low<0?1:(ch-1-low)/ch;
    }catch(e){ pad=0; }
    const t=new THREE.CanvasTexture(cv);
    t.magFilter=THREE.NearestFilter; t.minFilter=THREE.NearestFilter;
    t.generateMipmaps=false; t.colorSpace=THREE.SRGBColorSpace;
    return {t,pad};
  };
  const SPEC={
    cow:{w:22,h:22,cw:64,ch:64,n:6,walk:'assets/craftpix/bull.png',idle:'assets/craftpix/bull.png'},
    goat:{w:17,h:17,cw:32,ch:32,n:6,walk:'assets/craftpix/sheep.png',idle:'assets/craftpix/sheep.png'},
    mother:{w:13,h:13,cw:32,ch:32,n:6,walk:'assets/craftpix/rooster.png',idle:'assets/craftpix/rooster.png'},
    duckling:{w:8.5,h:8.5,cw:16,ch:16,n:6,walk:'assets/craftpix/chick.png',idle:'assets/craftpix/chick.png'},
    deer:{w:19,h:19,cw:32,ch:32,n:6,walk:'assets/craftpix/deer-walk.png',idle:'assets/craftpix/deer-idle.png'},
    rabbit:{w:11,h:11,cw:32,ch:32,n:5,walk:'assets/craftpix/hare-walk.png',idle:'assets/craftpix/hare-idle.png'}
  };
  const files=[...new Set(Object.values(SPEC).flatMap(s=>[s.walk,s.idle]))];
  return Promise.all(files.map(f=>loadImg(f).then(im=>[f,im]))).then(ps=>{
    const IM=Object.fromEntries(ps);
    const out={};
    for(const [k,s] of Object.entries(SPEC)){
      const wi=IM[s.walk], ii=IM[s.idle];
      const sameFile=s.walk===s.idle;
      const walkRow=r=>{ const a=[]; for(let i=0;i<s.n;i++) a.push(cut(wi,s.cw,s.ch,i,r)); return a; };
      const idleCell=(img,r)=>cut(img,s.cw,s.ch,0,r);
      const dirs={
        front:{walk:walkRow(0), idle:idleCell(ii,sameFile?4:0)},
        back:{walk:walkRow(1), idle:idleCell(ii,sameFile?5:1)},
        left:{walk:walkRow(2), idle:idleCell(ii,sameFile?6:2)},
        right:{walk:walkRow(3), idle:idleCell(ii,sameFile?7:3)}
      };
      out[k]={dirs,w:s.w,h:s.h};
    }
    return out;
  });
}