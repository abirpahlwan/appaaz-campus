// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */
import { $S, $R } from '../core/state';
import { BUILDINGS, DESERT, GRASS, H, MAP_H, MAP_W, SAND, TILE, TREE, W, WALL, WATER } from '../world/config';
import { map } from '../world/map';
import { WPH, WPW, WSC, WX0, WY0, wcv } from '../world/water';
import { MOUNTAIN_FEATURES, PROPS, REEDS, TREES, objs } from '../world/objects';
import { P } from '../entities/player';
import { cows, deer, ducklings, goats, mother, rabbits } from '../entities/critters';
import { gliders } from './sky-legacy';
import { HGRID, R3X, R3Z, WALL_H, terrainH } from '../world/terrain3d';
import { GeoBatch, batPutGeo, tileFaceColor } from './geo';
import { kioskAt, propMesh3 } from '../assets/loaders';
import { buildPlayer3d } from './player3d';
import { LOOK, sunDirection } from './look';
import { createSky } from './sky';
import { createOcean, buildShoreTexture } from './ocean';
import { createPost } from './post';
import { quality } from './quality';
import { initDevPanel } from './devpanel';



/* ---------------- 3D renderer (real geometry) ----------------
   Same sim, Three.js scene: heightfield terrain, merged-geometry towers,
   instanced trees, sprite critters, jointed player + jetpack. Lazy-loads
   vendor/three.min.js on first toggle; falls back to 2D without WebGL. */
$S.R3on=false; $S.R3=null; $S.R3loading=false; $S.R3flora=null; $S.R3sprites=null;
$S.camAngleDeg=(document.getElementById('camAngle').value-0)||22;
$S.camDist=(document.getElementById('camDist').value-0)||600;
function r3tex(cv){
  const t=new THREE.CanvasTexture(cv);
  t.magFilter=THREE.NearestFilter; t.minFilter=THREE.NearestFilter;
  t.generateMipmaps=false; t.colorSpace=THREE.SRGBColorSpace;
  return t;
}
/* (billboard cutout helper retired with the 2.5D spike) */
/* vertical wall around the terrain mesh: reuses its edge triangles, extends
   them down to -30 and re-tints dark soil, so the island has solid sides. */
function skirtGeometry(tg){
  const P3=tg.getAttribute('position'), C3=tg.getAttribute('color');
  const pos=[], col=[], idx=[];
  const DEPTH=-30;
  const isEdge=(x,z)=>Math.abs(x)>W/2-TILE-0.01||Math.abs(z)>H/2-TILE-0.01;
  for(let t=0;t<P3.count/3;t++){
    const a=t*3,b=t*3+1,c=t*3+2;
    const ea=isEdge(P3.getX(a),P3.getZ(a)), eb=isEdge(P3.getX(b),P3.getZ(b)), ec=isEdge(P3.getX(c),P3.getZ(c));
    if(ea&&eb&&ec){
      const n=pos.length/3;
      for(const i of [a,b,c]){
        pos.push(P3.getX(i),P3.getY(i),P3.getZ(i));
        col.push(C3.getX(i)*0.55,C3.getY(i)*0.5,C3.getZ(i)*0.42);
      }
      for(const i of [a,b,c]){
        pos.push(P3.getX(i),DEPTH,P3.getZ(i));
        col.push(C3.getX(i)*0.30,C3.getY(i)*0.26,C3.getZ(i)*0.20);
      }
      idx.push(n,n+4,n+5, n,n+5,n+1, n+1,n+5,n+6, n+1,n+6,n+2, n+2,n+6,n+7, n+2,n+7,n); // wall quads
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col,3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
export function init3d(F,S){
  const cv=document.createElement('canvas'); cv.id='game3d';
  cv.style.cssText='position:fixed;inset:0;display:none;';
  document.body.appendChild(cv);
  let renderer;
  try{ renderer=new THREE.WebGLRenderer({canvas:cv, antialias:false}); }
  catch(e){ $R.toast('WebGL unavailable — staying in 2D.'); return false; }
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=LOOK.exposure;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFShadowMap;
  const scene=new THREE.Scene();
  const sky=createSky(); scene.add(sky.mesh);
  scene.background=new THREE.Color(LOOK.skyHorizon);
  scene.fog=new THREE.Fog(LOOK.fogColor, LOOK.fogNear, LOOK.fogFar);
  const cam=new THREE.PerspectiveCamera(50, innerWidth/innerHeight, 1, 9000);
  const sun=new THREE.DirectionalLight(LOOK.sunColor, LOOK.sunIntensity);
  sun.castShadow=true;
  sun.shadow.mapSize.set(quality.tier.shadowMap,quality.tier.shadowMap);
  const SB=380;
  sun.shadow.camera.left=-SB; sun.shadow.camera.right=SB;
  sun.shadow.camera.top=SB; sun.shadow.camera.bottom=-SB;
  sun.shadow.camera.near=100; sun.shadow.camera.far=2000;
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias=-0.0003; sun.shadow.normalBias=2;
  scene.add(sun); sun.target.position.set(0,0,0); scene.add(sun.target);
  const hemi=new THREE.HemisphereLight(LOOK.hemiSky, LOOK.hemiGround, LOOK.hemiIntensity);
  scene.add(hemi);
  const ambient=new THREE.AmbientLight('#fff5e6',0.12);
  scene.add(ambient);
  const rimLight=new THREE.DirectionalLight('#bcd6f5',0.7);
  rimLight.position.set(300,280,300);
  scene.add(rimLight);
  /* faceted heightfield terrain, one draw call */
  const tp=[], tc=[], col=new THREE.Color();
  for(let ty=0;ty<MAP_H;ty++) for(let tx=0;tx<MAP_W;tx++){
    const x0=tx*TILE-W/2, x1=x0+TILE, z0=ty*TILE-H/2, z1=z0+TILE;
    const y00=HGRID[ty][tx], y10=HGRID[ty][tx+1], y01=HGRID[ty+1][tx], y11=HGRID[ty+1][tx+1];
    col.set(tileFaceColor(map[ty][tx],tx,ty,Math.max(y00,y10,y01,y11)));
    tp.push(x0,y00,z0, x0,y01,z1, x1,y11,z1,  x0,y00,z0, x1,y11,z1, x1,y10,z0);
    for(let k=0;k<6;k++) tc.push(col.r,col.g,col.b);
  }
  const tg=new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.Float32BufferAttribute(tp,3));
  tg.setAttribute('color', new THREE.Float32BufferAttribute(tc,3));
  tg.computeVertexNormals();
  const terrain=new THREE.Mesh(tg, new THREE.MeshLambertMaterial({vertexColors:true}));
  terrain.receiveShadow=true; terrain.castShadow=true;
  scene.add(terrain);
  /* ocean: deep-tone plane far below the terrain lowlands, so it can never
     slice through beaches; shorelines get a bright surf rim (3D-look pass) */
  const shoreTex=buildShoreTexture(map,WATER,MAP_W,MAP_H);
  const ocean=createOcean({world:new THREE.Vector2(W,H), tile:TILE, shore:shoreTex, size:new THREE.Vector2(W*4.2,H*4.2)});
  ocean.mesh.position.y=-16; scene.add(ocean.mesh);
  const surfBat=new GeoBatch();
  for(let ty=0;ty<MAP_H;ty++) for(let tx=0;tx<MAP_W;tx++){
    if(map[ty][tx]!==WATER) continue;
    const nb=[[1,0],[-1,0],[0,1],[0,-1]], px=tx*TILE+8, pz=ty*TILE+8;
    for(const [dx,dy] of nb){
      const t2=(map[ty+dy]||[])[tx+dx];
      if(t2===undefined||t2===WATER) continue;
      surfBat.box(dx?3.2:16, 0.5, dx?16:3.2, R3X(px+(dx?dx*7.2:0)), -1.2, R3Z(pz+(dy?dy*7.2:0)), '#bdeef2');
    }
  }
  /* surf rim now comes from the ocean shader's foam lines */
  const wtex=r3tex(wcv);
  const pond=new THREE.Mesh(new THREE.PlaneGeometry(WPW*WSC, WPH*WSC),
    new THREE.MeshBasicMaterial({map:wtex, transparent:true}));
  pond.rotation.x=-Math.PI/2;
  pond.position.set(WX0*TILE+WPW*WSC/2-W/2, -0.4, WY0*TILE+WPH*WSC/2-H/2);
  scene.add(pond);
  /* high-rise heights keyed by building id (HR): landmarks tall, others mid/low */
  const HR_H={games:680,multi:610,xr:560,about:420,craft:390,contact:370,sys:310,career:300};
  /* buildings: one fading mesh each (walls+roof together, like the 2D lift) */
  const blds=[];
  for(const b of BUILDINGS){
    b.roofH=HR_H[b.id]||70;
    const RH=b.roofH;
    const bat=new GeoBatch();
    for(let ty=b.y; ty<b.y+b.h; ty++) for(let tx=b.x; tx<b.x+b.w; tx++){
      if(map[ty][tx]!==WALL) continue;
      bat.box(16,WALL_H-1,16, R3X(tx*TILE+8), 1+(WALL_H-1)/2, R3Z(ty*TILE+8), '#FBF4E4');
    }
    const X0=R3X(b.x*TILE), X1=R3X((b.x+b.w)*TILE), Z0=R3Z(b.y*TILE), Z1=R3Z((b.y+b.h)*TILE);
    const cx=(X0+X1)/2, cz=(Z0+Z1)/2, wpx=b.w*TILE;
    bat.box(wpx+4,2.5,2, b.roof, cx, 28.5, Z0-1);
    bat.box(wpx+4,2.5,2, b.roof, cx, 28.5, Z1+1);
    bat.box(2,2.5,b.h*TILE+4, b.roof, X0-1, 28.5, cz);
    bat.box(2,2.5,b.h*TILE+4, b.roof, X1+1, 28.5, cz);
    const doorX=R3X(b.door*TILE+8);
    const winGeo=b.w>=20?F.winM:F.winN; /* corner-window variant per building size (R2) */
    for(let i=1;i<b.w-1;i++){
      if(i%3!==1) continue;
      const wx=R3X((b.x+i)*TILE+8);
      if(Math.abs(wx-doorX)<12) continue;
      batPutGeo(bat, winGeo, wx, 16, Z1-4, -Math.PI/2);
      batPutGeo(bat, winGeo, wx, 16, Z0+4, Math.PI/2);
    }
    /* high-rise massing (HR): podium + solid white core, 2-4 setback slabs, garden
       fins, glass bands, terrace rails, parapet, crown glasshouse — one batch */
    bat.box((b.w+1)*TILE,2,(b.h+1)*TILE,cx,0.05,cz,'#e8e8e0');
    const coreW=b.w*TILE-10, coreD=b.h*TILE-10;
    /* DEEP SOLARPUNK massing: stepped curtain slabs with aqua glass bands,
       teal grout + silver frames, garden terraces, corner trellis, glasshouse
       crown with gold solar + spires — one opaque batch, no new meshes */
    const nSlab=RH>=500?8:RH>=350?7:RH>=250?6:5;
    const FR=nSlab===8?[0.14,0.27,0.39,0.50,0.60,0.70,0.85,1.0]
      :nSlab===7?[0.16,0.30,0.43,0.55,0.67,0.82,1.0]
      :nSlab===6?[0.18,0.33,0.47,0.60,0.78,1.0]
      :[0.22,0.40,0.57,0.75,1.0];
    const AQUA0='#9fd8d0', AQUA1='#8fd4cf', GROUT='#2f7a74', FRAME='#F4F6F4';
    const LEAF='#4f9e5e', LEAF2='#6fbf73', GOLD='#EAB308', TRELLIS='#2f6b45', LIP='#3f8f5c';
    /* plain rectangular tower — no taper, all slabs same width */
    const stepW=0;
    const floorW=coreW;
    let yPrev=0;
    const terrY=[];
    for(let s=0;s<nSlab;s++){
      const yTop=RH*FR[s];
      const sh=yTop-yPrev;
      const iw=Math.max(floorW,coreW-s*stepW), id=Math.max(floorW,coreD-s*stepW);
      const yMid=yPrev+sh/2;
      bat.box(iw,sh,id,cx,yMid,cz,s%2?'#E2DFD2':'#F0E9D6');
      const gh=Math.min(10,Math.max(4,sh*0.12));
      const aqua=s%2?AQUA1:AQUA0;
      bat.box(iw+1,gh,1.2,cx,yMid,cz+id/2+0.3,aqua);
      bat.box(iw+1,gh,1.2,cx,yMid,cz-id/2-0.3,aqua);
      bat.box(1.2,gh,id+1,cx+iw/2+0.3,yMid,cz,aqua);
      bat.box(1.2,gh,id+1,cx-iw/2-0.3,yMid,cz,aqua);
      bat.box(iw+1.6,1,id+1.6,cx,yMid+gh/2+0.5,cz,GROUT);
      bat.box(iw+1.6,1,id+1.6,cx,yMid-gh/2-0.5,cz,GROUT);
      bat.box(iw+2,1.2,id+2,cx,yTop-0.6,cz,FRAME);
      bat.box(iw+2.4,1,id+2.4,cx,yTop-1.7,cz,b.roof);
      for(let mx=cx-iw/2+12;mx<cx+iw/2-6;mx+=24){
        const lowS=yMid<30&&Math.abs(mx-doorX)<27;
        bat.box(1.2,gh,1.4,mx,yMid,cz-id/2-0.6,GROUT);
        if(!lowS) bat.box(1.2,gh,1.4,mx,yMid,cz+id/2+0.6,GROUT);
      }
      for(let mz=cz-id/2+12;mz<cz+id/2-6;mz+=24){
        bat.box(1.4,gh,1.2,cx+iw/2+0.6,yMid,mz,GROUT);
        bat.box(1.4,gh,1.2,cx-iw/2-0.6,yMid,mz,GROUT);
      }
      /* vertical fins on every slab face for height rhythm */
      if(sh>20){
        for(let fx=cx-iw/2+20;fx<cx+iw/2-10;fx+=48){
          bat.box(1.2,sh,3,fx,yMid,cz-id/2-1.5,FRAME);
          bat.box(1.2,sh,3,fx,yMid,cz+id/2+1.5,FRAME);
        }
        for(let fz=cz-id/2+20;fz<cz+id/2-10;fz+=48){
          bat.box(3,sh,1.2,cx+iw/2+1.5,yMid,fz,FRAME);
          bat.box(3,sh,1.2,cx-iw/2-1.5,yMid,fz,FRAME);
        }
      }
      /* per-slab glassPane windows (not just tall terraces) */
      if(sh>15){
        for(let mx2=cx-iw/2+16;mx2<cx+iw/2-8;mx2+=28){
          const lowS2=yMid<30&&Math.abs(mx2-doorX)<27;
          batPutGeo(bat,F.glassPane,mx2,yTop-4,cz-id/2-0.4,0);
          if(!lowS2) batPutGeo(bat,F.glassPane,mx2,yTop-4,cz+id/2+0.4,Math.PI);
        }
        for(let mz2=cz-id/2+14;mz2<cz+id/2-8;mz2+=26){
          batPutGeo(bat,F.glassPane,cx+iw/2+0.4,yTop-4,mz2,-Math.PI/2);
          batPutGeo(bat,F.glassPane,cx-iw/2-0.4,yTop-4,mz2,Math.PI/2);
        }
      }
      if(s<nSlab-1) terrY.push({y:yTop,iw:iw,id:id,niw:Math.max(floorW,coreW-(s+1)*stepW),nid:Math.max(floorW,coreD-(s+1)*stepW),shN:RH*FR[s+1]-yTop});
      yPrev=yTop;
    }
    /* trellis climbs each slab face (segmented so it never floats free of the
       stepping massing): corner columns hugging the slab skin + leaf/gold.
       Column width scales with tower height so it reads at distance. */
    const tw=RH>=200?4:3;
    for(let s=0;s<nSlab;s++){
      const yB=Math.max(28,s===0?0:RH*FR[s-1]), yT2=RH*FR[s]-2;
      if(yT2-yB<3) continue;
      const sw=Math.max(floorW,coreW-s*stepW), sd=Math.max(floorW,coreD-s*stepW);
      const segY=(yB+yT2)/2;
      for(const [fx,fz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){
        bat.box(tw,yT2-yB,tw,cx+fx*(sw/2+tw/2-1),segY,cz+fz*(sd/2+tw/2-1),TRELLIS);
        bat.box(2,2,2,cx+fx*(sw/2+tw-0.15),segY,cz+fz*(sd/2+tw-0.15),(s+fx+fz)%2?LEAF2:LEAF);
        if((s+fx*2+fz)%3===0) bat.box(1.4,1.4,1.4,cx+fx*(sw/2+tw-0.15),segY+2.2,cz+fz*(sd/2+tw-0.15),GOLD);
      }
    }
    for(let ti=0;ti<terrY.length;ti++){
      const t=terrY[ti], ty=t.y, ow=t.iw, od=t.id;
      const lipY=ty+1.25, low=ty<32;
      /* thick green skirt at each slab break — makes the stepping read at distance */
      bat.box(ow+2,4,od+2,cx,ty+0.5,cz,'#3a8f52');
      bat.box(ow,2.5,3,cx,lipY,cz-od/2+1.5,LIP);
      bat.box(3,2.5,Math.max(4,od-6),cx+ow/2-1.5,lipY,cz,LIP);
      bat.box(3,2.5,Math.max(4,od-6),cx-ow/2+1.5,lipY,cz,LIP);
      if(!low){
        bat.box(ow,2.5,3,cx,lipY,cz+od/2-1.5,LIP);
      }else{
        const xL0=cx-ow/2, xL1=doorX-25, xR0=doorX+25, xR1=cx+ow/2;
        if(xL1-xL0>8) bat.box(xL1-xL0,2.5,3,(xL0+xL1)/2,lipY,cz+od/2-1.5,LIP);
        if(xR1-xR0>8) bat.box(xR1-xR0,2.5,3,(xR0+xR1)/2,lipY,cz+od/2-1.5,LIP);
      }
      const pzN=cz-od/2+4, pzS=cz+od/2-4;
      const px1=cx-ow/4, px2=cx+ow/4;
      const bump=(bx,bz)=>{
        if(ty<32&&bz>Z1-2&&Math.abs(bx-doorX)<27) return;
        bat.box(3,3,3,bx,ty+1.5,bz,LEAF);
        bat.box(1.5,1.5,1.5,bx+2.2,ty+3.6,bz,GOLD);
      };
      bump(px1,pzN); bump(px2,pzN); bump(px1,pzS); bump(px2,pzS);
      batPutGeo(bat,F.plantBox,cx-ow/2+8,ty,cz-od/2+8,0);
      batPutGeo(bat,F.plantBox,cx+ow/2-8,ty,cz-od/2+8,Math.PI/2);
      if(!low){
        batPutGeo(bat,F.plantBox,cx-ow/2+8,ty,cz+od/2-8,Math.PI);
        batPutGeo(bat,F.plantBox,cx+ow/2-8,ty,cz+od/2-8,-Math.PI/2);
      }else{
        if(Math.abs(cx-ow/2+8-doorX)>=27) batPutGeo(bat,F.plantBox,cx-ow/2+8,ty,cz+od/2-8,Math.PI);
        if(Math.abs(cx+ow/2-8-doorX)>=27) batPutGeo(bat,F.plantBox,cx+ow/2-8,ty,cz+od/2-8,-Math.PI/2);
      }
      batPutGeo(bat,F.rail,cx-ow/4,ty,cz-od/2+5,0);
      batPutGeo(bat,F.rail,cx+ow/4,ty,cz-od/2+5,0);
      batPutGeo(bat,F.rail,cx-ow/2+5,ty,cz,Math.PI/2);
      batPutGeo(bat,F.rail,cx+ow/2-5,ty,cz,Math.PI/2);
      if(!low){
        batPutGeo(bat,F.rail,cx-ow/4,ty,cz+od/2-5,0);
        batPutGeo(bat,F.rail,cx+ow/4,ty,cz+od/2-5,0);
      }
      if(t.shN>=11){
        for(let mx=cx-t.niw/2+16;mx<cx+t.niw/2-8;mx+=32){
          const lowS=ty<32&&Math.abs(mx-doorX)<27;
          batPutGeo(bat,F.glassPane,mx,ty,cz-t.nid/2-0.4,0);
          if(!lowS) batPutGeo(bat,F.glassPane,mx,ty,cz+t.nid/2+0.4,Math.PI);
        }
        for(let mz=cz-t.nid/2+14;mz<cz+t.nid/2-8;mz+=30){
          batPutGeo(bat,F.glassPane,cx+t.niw/2+0.4,ty,mz,-Math.PI/2);
          batPutGeo(bat,F.glassPane,cx-t.niw/2-0.4,ty,mz,Math.PI/2);
        }
      }
    }
    /* crown: roof slab matches full building width */
    const topW=coreW+4;
    const topD=coreD+4;
    bat.box(topW,2,topD,cx,RH,cz,'#EDE7D3');
    bat.box(topW,1.5,1.5,cx,RH+1.75,cz-topD/2+0.75,b.roof);
    bat.box(topW,1.5,1.5,cx,RH+1.75,cz+topD/2-0.75,b.roof);
    bat.box(1.5,1.5,topD,cx-topW/2+0.75,RH+1.75,cz,b.roof);
    bat.box(1.5,1.5,topD,cx+topW/2-0.75,RH+1.75,cz,b.roof);
    const dishX=cx-topW*0.28;
    const solZN=cz-topD/2+8, solZS=cz+topD/2-8;
    /* dense satellite dish array on crown */
    const dishRows=RH>=500?2:1;
    for(let dr=0;dr<dishRows;dr++){
      const dz=dr===0?solZN:solZS;
      for(const sx of [cx-topW*0.32,cx-topW*0.10,cx+topW*0.10,cx+topW*0.32]){
        if(Math.abs(sx-dishX)<18) continue;
        batPutGeo(bat,F.dish,sx,RH+1+dr*8,dz,dr*Math.PI);
      }
    }
    batPutGeo(bat,F.glassTop,cx+topW*0.02,RH+1,cz-28,0);
    if(RH>=350) batPutGeo(bat,F.glassTop,cx-topW*0.15,RH+1,cz+30,Math.PI);
    /* solar panels on crown — solarpunk signature */
    const solarKinds=[F.solarFlat,F.solarLand,F.solarPort];
    for(let si=0;si<(RH>=400?6:3);si++){
      const spx=cx+(si-2.5)*topW*0.16;
      const spz=cz+(si%2?topD*0.25:-topD*0.25);
      const sk=solarKinds[si%3];
      batPutGeo(bat,sk,spx,RH+3,spz,(si*0.7)%6.28);
    }
    /* dual glasshouses flanking the crown */
    for(const side of [-1,1]){
      const gX=cx+side*topW*0.25;
      const ghS=RH>=500?1.8:1.3;
      const ghW=30*ghS, ghH=10*ghS, ghD=18*ghS;
      bat.box(ghW+1,1,ghD+1,gX,RH+1.5,cz,GROUT);
      bat.box(ghW,ghH,ghD,gX,RH+1+ghH/2,cz,AQUA0);
      bat.box(1,ghH,1,gX-ghW/2,RH+1+ghH/2,cz-ghD/2,GROUT);
      bat.box(1,ghH,1,gX+ghW/2,RH+1+ghH/2,cz-ghD/2,GROUT);
      bat.box(1,ghH,1,gX-ghW/2,RH+1+ghH/2,cz+ghD/2,GROUT);
      bat.box(1,ghH,1,gX+ghW/2,RH+1+ghH/2,cz+ghD/2,GROUT);
      for(let i=0;i<3;i++){
        bat.box(ghW+4,1,ghD/3+2,gX,RH+1+ghH+1.5+i*0.7,cz-ghD/3+ghD/3*i,AQUA1);
      }
      bat.box(ghW+4.5,1,1.5,gX,RH+1+ghH+3.8,cz,GOLD);
      bat.box(3,3,3,gX-ghW/2-4,RH+2.5,cz,LEAF);
      bat.box(3,3,3,gX+ghW/2+4,RH+2.5,cz+4,LEAF2);
      bat.box(1.5,1.5,1.5,gX-ghW/2-4,RH+4.8,cz,GOLD);
      batPutGeo(bat,F.plantBox,gX-ghW/2-6,RH+1,cz-ghD/2-2,0);
      batPutGeo(bat,F.plantBox,gX+ghW/2+6,RH+1,cz+ghD/2+2,Math.PI/2);
    }
    /* light masts across the crown */
    for(const mx of [cx-topW*0.35,cx,cx+topW*0.35]){
      batPutGeo(bat,F.mast,mx,RH+1,cz-18,Math.PI);
      if(RH>=400) batPutGeo(bat,F.mast,mx,RH+1,cz+18,0);
    }
    if(b.id==='games'||b.id==='multi'||b.id==='xr'){
      const spH=b.id==='games'?80:65;
      bat.box(3,spH,3,cx,RH+1+spH/2,cz,GOLD);
      bat.box(5,2,5,cx,RH+1+spH+1,cz,GOLD);
      bat.box(2,3,2,cx,RH+1+spH+3,cz,GOLD);
    }else if(RH>=300){
      bat.box(2,40,2,cx,RH+21,cz,GOLD);
      bat.box(3.5,2,3.5,cx,RH+42,cz,GOLD);
    }
    /* kitbash roofs/entrances (3D-houses): dish + modular surround + barricade wings
       + steps + doormat, merged into this building's own batch so per-building fade works */
    const gyD=terrainH(b.door*TILE+8,(b.y+b.h)*TILE+8);
    batPutGeo(bat, F.dish, cx-topW*0.28, RH+1, cz, 0);
    /* entrance assembly (3D-look pass): door-window model sits IN the facade
       gap (faces +Z, bottom on the terrain), flanked by barricades, with
       steps + doormat outside on the path pad */
    batPutGeo(bat, F.doorWin, doorX, gyD, Z1-18.7, 0);
    batPutGeo(bat, F.steps, doorX, gyD, Z1+9.5, -Math.PI/2);
    batPutGeo(bat, F.doormat, doorX+5.4, gyD+0.1, Z1+10.5, 0);
    const mesh=bat.mesh();
    scene.add(mesh);
    const door=new THREE.Mesh(new THREE.PlaneGeometry(28,22),
      new THREE.MeshBasicMaterial({color:'#c98d4f'}));
    door.position.set(doorX, 12, Z1+1.2);
    scene.add(door);
    const lc=document.createElement('canvas'); lc.width=256; lc.height=32;
    const lg=lc.getContext('2d');
    lg.fillStyle='#f6e0b0'; lg.fillRect(0,0,256,32);
    lg.strokeStyle='#33241c'; lg.lineWidth=4; lg.strokeRect(2,2,252,28);
    lg.fillStyle='#33241c'; lg.font='bold 19px monospace'; lg.textAlign='center';
    lg.fillText(b.label, 128, 23);
    const label=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(wpx*0.7,150), 19),
      new THREE.MeshBasicMaterial({map:r3tex(lc), transparent:true}));
    label.position.set(cx, 28, Z1+2.5);
    scene.add(label);
    /* soil pad removed: buried under the podium, caused coplanar flicker */
    blds.push({b, mesh, door, label});
  }
  /* kiosks for every interactable + mountain feature */
  const kbat=new GeoBatch();
  for(const o of objs) kioskAt(kbat, o.x+o.pw/2, o.y+o.ph/2, o.accent||'#ffd23f', o.kind, F.cabinet);
  for(const f of MOUNTAIN_FEATURES) kioskAt(kbat, f.x+(f.pw||16)/2, f.y+(f.ph||16)/2, '#EAB308');
  scene.add(kbat.mesh());
  /* warm accent lights near landmarks (3D-look pass) */
  const accentDefs=[
    {id:'games',  color:'#ffd28a', intensity:0.35, range:120},
    {id:'contact',color:'#ffcc66', intensity:0.30, range:100},
    {id:'about',  color:'#ffe0a0', intensity:0.25, range:90}
  ];
  const accentLights=accentDefs.map(a=>{
    const b=BUILDINGS.find(x=>x.id===a.id);
    if(!b) return null;
    const pl=new THREE.PointLight(a.color,a.intensity*Math.PI*0.6,a.range,0);
    pl.position.set(R3X((b.x+b.w/2)*TILE), b.roofH*0.6, R3Z((b.y+b.h/2)*TILE));
    scene.add(pl);
    return {pl,b};
  }).filter(Boolean);
  /* railway landmark [70,47] + RAIL rows + rocket landmark [82,53] (3D-houses):
     track pieces + parked consist + station platform + stacked rocket, one mesh */
  const sbat=new GeoBatch();
  for(let tx=66; tx<MAP_W-2; tx++) for(const ty of [48,49])
    batPutGeo(sbat, F.track, R3X(tx*TILE+8), terrainH(tx*TILE+8,ty*TILE+8)-1.2, R3Z(ty*TILE+8), Math.PI/2);
  const stGy=terrainH(71.5*TILE,49*TILE+8);
  sbat.box(7*TILE,4,12,'#c9c2b4', R3X(71.5*TILE), stGy+2, R3Z(48.3*TILE));
  sbat.box(7*TILE,1,1,'#e07b3c', R3X(71.5*TILE), stGy+4, R3Z(48.3*TILE)+5.5);
  batPutGeo(sbat, F.loco, R3X(70.5*TILE), terrainH(70.5*TILE,49*TILE+8), R3Z(49*TILE+8), Math.PI/2);
  batPutGeo(sbat, F.carriage, R3X(72.8*TILE), terrainH(72.8*TILE,49*TILE+8), R3Z(49*TILE+8), Math.PI/2);
  const rkX=R3X(82.3*TILE), rkZ=R3Z(53.5*TILE), rkGy=terrainH(82.3*TILE,53.5*TILE);
  sbat.box(20,2,20,'#8f9aa6', rkX, rkGy+1, rkZ);
  batPutGeo(sbat, F.rBase, rkX, rkGy+2, rkZ, 0);
  batPutGeo(sbat, F.rFins, rkX, rkGy+10, rkZ, Math.PI/4);
  batPutGeo(sbat, F.rBody, rkX, rkGy+22, rkZ, 0);
  batPutGeo(sbat, F.rTop, rkX, rkGy+38, rkZ, 0);
  /* mountain camp [74,12] + dam [43,30] props, survival-kit (R2, 3D-houses) */
  batPutGeo(sbat, F.firepit, R3X(73.7*TILE), terrainH(73.7*TILE,12.8*TILE), R3Z(12.8*TILE), 0);
  batPutGeo(sbat, F.bedroll, R3X(75.2*TILE), terrainH(75.2*TILE,13.1*TILE)+1.202, R3Z(13.1*TILE), 0.4);
  batPutGeo(sbat, F.crate, R3X(74*TILE), terrainH(74*TILE,11.9*TILE), R3Z(11.9*TILE), 0.2);
  batPutGeo(sbat, F.crateL, R3X(75*TILE), terrainH(75*TILE,11.8*TILE), R3Z(11.8*TILE), 2.8);
  batPutGeo(sbat, F.cask, R3X(75.6*TILE), terrainH(75.6*TILE,12.2*TILE), R3Z(12.2*TILE), 0);
  batPutGeo(sbat, F.crateL, R3X(43*TILE), terrainH(43*TILE,31.5*TILE), R3Z(31.5*TILE), 1.2);
  batPutGeo(sbat, F.cask, R3X(44.8*TILE), terrainH(44.8*TILE,31.8*TILE), R3Z(31.8*TILE), 0);
  batPutGeo(sbat, F.crate, R3X(43.4*TILE), terrainH(43.4*TILE,30.4*TILE), R3Z(30.4*TILE), 0.7);
  /* scattered survival props across the 300x200 map */
  const scatterSpots=[
    [150,80],[30,55],[200,40],[80,120],[260,30],
    [10,100],[170,170],[50,160],[220,130],[130,10],
    [280,100],[60,90],[190,60],[110,170],[250,70],
    [40,130],[160,45],[270,160],[95,55],[210,110],
    [15,170],[140,130],[230,50],[75,145],[285,175]
  ];
  const scatterKits=[F.crate,F.crateL,F.cask,F.firepit];
  scatterSpots.forEach(([sx,sy],i)=>{
    if(sx<2||sy<2||sx>=MAP_W-2||sy>=MAP_H-2) return;
    const t=map[sy][sx];
    if(t!==GRASS&&t!==DESERT&&t!==SAND) return;
    const gk=scatterKits[i%scatterKits.length];
    const rot=i*1.37;
    batPutGeo(sbat, gk, R3X(sx*TILE+Math.random()*TILE*0.4), terrainH(sx*TILE,sy*TILE), R3Z(sy*TILE+Math.random()*TILE*0.4), rot);
  });
  scene.add(sbat.mesh());

  /* windmills */
  const wbat=new GeoBatch();
  [[40,25],[160,15],[280,35],[120,170],[240,160],[60,100],[200,90]].forEach(([wx,wy])=>{
    if(wx<2||wy<2||wx>=MAP_W-2||wy>=MAP_H-2) return;
    if(map[wy][wx]!==GRASS) return;
    batPutGeo(wbat,F.windmill,R3X(wx*TILE),terrainH(wx*TILE,wy*TILE),R3Z(wy*TILE),wx*0.1);
  });

  /* water tower near the pond */
  batPutGeo(wbat,F.waterTower,R3X(158*TILE),terrainH(158*TILE,85*TILE),R3Z(85*TILE),0.3);

  /* fences around some buildings */
  for(const b of BUILDINGS){
    if(b.id==='sys'||b.id==='career') continue;
    const fx0=R3X(b.x*TILE-4),fx1=R3X((b.x+b.w)*TILE+4);
    const fz0=R3Z(b.y*TILE-4),fz1=R3Z((b.y+b.h)*TILE+4);
    const fy=terrainH((b.x+b.w/2)*TILE,(b.y-1)*TILE);
    batPutGeo(wbat,F.fence4,(fx0+fx1)/2,fy,fz0-8,0);
    batPutGeo(wbat,F.fence4,(fx0+fx1)/2,fy,fz1+8,0);
  }

  /* === New Kenney kits === */
  /* vehicles — scattered in open areas */
  [[30,25,0],[70,55,Math.PI],[130,75,0],[190,115,Math.PI],[250,125,0],[60,155,0],[100,35,Math.PI],[220,45,0],[160,165,Math.PI],[40,45,0]].forEach(([vx,vy,rot])=>{
    if(vx>=MAP_W||vy>=MAP_H) return;
    batPutGeo(wbat,F.truckG,R3X(vx*TILE),terrainH(vx*TILE,vy*TILE),R3Z(vy*TILE),rot,8);
  });
  [[100,145,Math.PI],[160,35,0],[220,65,Math.PI],[40,165,0],[280,55,0],[15,155,Math.PI]].forEach(([vx,vy,rot])=>{
    if(vx>=MAP_W||vy>=MAP_H) return;
    batPutGeo(wbat,F.truckGr,R3X(vx*TILE),terrainH(vx*TILE,vy*TILE),R3Z(vy*TILE),rot,8);
  });
  /* scattered street furniture */
  [[25,30],[80,50],[140,80],[200,100],[60,150],[220,140],[30,170],[260,160]].forEach(([fx,fy],i)=>{
    if(fx>=MAP_W||fy>=MAP_H) return;
    batPutGeo(wbat,F.benchF,R3X(fx*TILE),terrainH(fx*TILE,fy*TILE),R3Z(fy*TILE),i*0.7,4);
    batPutGeo(wbat,F.trashF,R3X((fx+2)*TILE),terrainH((fx+2)*TILE,fy*TILE),R3Z(fy*TILE),0,4);
  });
  /* palm trees in circle around pond */
  for(let i=0;i<12;i++){
    const angle=i*0.524;
    const px2=150+Math.cos(angle)*22, pz2=90+Math.sin(angle)*20;
    batPutGeo(wbat,F.palm,R3X(px2*TILE),terrainH(px2*TILE,pz2*TILE),R3Z(pz2*TILE),i,10);
  }
  /* massive rock formations scattered */
  [[45,30],[160,40],[250,25],[80,130],[200,120],[30,170],[270,170],[140,20],[50,60],[230,60]].forEach(([rx,ry],i)=>{
    batPutGeo(wbat,i%2?F.rockLA:F.rockLB,R3X(rx*TILE),terrainH(rx*TILE,ry*TILE),R3Z(ry*TILE),i*1.3,8+i%4);
  });
  /* tents + campfire camp near mountain */
  batPutGeo(wbat,F.tentS,R3X(258*TILE),terrainH(258*TILE,18*TILE),R3Z(18*TILE),0.3,6);
  batPutGeo(wbat,F.tentD,R3X(263*TILE),terrainH(263*TILE,20*TILE),R3Z(20*TILE),0.8,6);
  batPutGeo(wbat,F.tentS,R3X(268*TILE),terrainH(268*TILE,16*TILE),R3Z(16*TILE),1.5,6);
  batPutGeo(wbat,F.campfireS,R3X(261*TILE),terrainH(261*TILE,19*TILE),R3Z(19*TILE),0,4);
  /* dumpsters behind every building */
  for(const b of BUILDINGS){
    batPutGeo(wbat,F.dumpster,R3X((b.x-2)*TILE),terrainH((b.x-2)*TILE,(b.y+b.h+1)*TILE),R3Z((b.y+b.h+1)*TILE),0,5);
  }
  /* === New Kenney kits === */
  /* Boats on the river/pond (center map ~150,90) */
  /* logs and stumps in forest areas */
  for(let i=0;i<15;i++){
    const lx=20+Math.random()*(MAP_W-40), ly=10+Math.random()*(MAP_H-20);
    const t2=(map[Math.floor(ly)]||[])[Math.floor(lx)];
    if(t2!==TREE) continue;
    batPutGeo(wbat,i%3?F.logN:F.stumpN,R3X(lx*TILE),terrainH(lx*TILE,ly*TILE),R3Z(ly*TILE),Math.random()*6,5);
  }
  /* fences in open areas */
  [[50,35],[110,65],[190,95],[250,130],[70,160]].forEach(([fx,fy],i)=>{
    if(fx>=MAP_W||fy>=MAP_H) return;
    batPutGeo(wbat,F.fenceL,R3X(fx*TILE),terrainH(fx*TILE,fy*TILE),R3Z(fy*TILE),i*0.5,5);
  });
  /* mushrooms in clusters */
  for(let i=0;i<30;i++){
    const mx=10+Math.random()*(MAP_W-20), my=10+Math.random()*(MAP_H-20);
    batPutGeo(wbat,F.mushR,R3X(mx*TILE),terrainH(mx*TILE,my*TILE),R3Z(my*TILE),Math.random()*6,3+Math.random()*3);
  }
  /* === New Kenney kits === */
  /* Boats on the river/pond (center map ~150,90) */
  batPutGeo(wbat,F.boatSailA,R3X(140*TILE),terrainH(140*TILE,88*TILE)-0.5,R3Z(88*TILE),0.5,10);
  batPutGeo(wbat,F.boatSpdA,R3X(155*TILE),terrainH(155*TILE,92*TILE)-0.5,R3Z(92*TILE),-0.3,6);
  batPutGeo(wbat,F.boatRowL,R3X(160*TILE),terrainH(160*TILE,85*TILE)-0.5,R3Z(85*TILE),0.8,5);
  batPutGeo(wbat,F.boatTug,R3X(148*TILE),terrainH(148*TILE,95*TILE)-0.5,R3Z(95*TILE),-0.6,8);
  batPutGeo(wbat,F.buoyW,R3X(145*TILE),terrainH(145*TILE,87*TILE)-0.5,R3Z(87*TILE),0,3);
  batPutGeo(wbat,F.buoyW,R3X(158*TILE),terrainH(158*TILE,93*TILE)-0.5,R3Z(93*TILE),1.2,3);
  /* Factory pieces in SE industrial zone (~250,145) */
  batPutGeo(wbat,F.conveyor,R3X(240*TILE),terrainH(240*TILE,148*TILE),R3Z(148*TILE),0,5);
  batPutGeo(wbat,F.conveyorC,R3X(244*TILE),terrainH(244*TILE,148*TILE),R3Z(148*TILE),0,5);
  batPutGeo(wbat,F.conveyorX,R3X(248*TILE),terrainH(248*TILE,148*TILE),R3Z(148*TILE),0,5);
  batPutGeo(wbat,F.conveyorSt,R3X(252*TILE),terrainH(252*TILE,148*TILE),R3Z(148*TILE),0,5);
  batPutGeo(wbat,F.crane,R3X(258*TILE),terrainH(258*TILE,150*TILE),R3Z(150*TILE),0.3,18);
  batPutGeo(wbat,F.catwalk,R3X(242*TILE),terrainH(242*TILE,152*TILE),R3Z(152*TILE),Math.PI/2,6);
  batPutGeo(wbat,F.catwalkStair,R3X(246*TILE),terrainH(246*TILE,152*TILE),R3Z(152*TILE),0,8);
  batPutGeo(wbat,F.pipeL,R3X(250*TILE),terrainH(250*TILE,155*TILE),R3Z(155*TILE),Math.PI/2,6);
  batPutGeo(wbat,F.pipeLBend,R3X(254*TILE),terrainH(254*TILE,155*TILE),R3Z(155*TILE),0,6);
  batPutGeo(wbat,F.machine,R3X(260*TILE),terrainH(260*TILE,145*TILE),R3Z(145*TILE),0.5,8);
  batPutGeo(wbat,F.hopper,R3X(262*TILE),terrainH(262*TILE,148*TILE),R3Z(148*TILE),0,6);
  batPutGeo(wbat,F.cogA,R3X(256*TILE),terrainH(256*TILE,152*TILE),R3Z(152*TILE),0.8,4);
  /* Pirate ship near river mouth */
  batPutGeo(wbat,F.pirateShipM,R3X(130*TILE),terrainH(130*TILE,82*TILE)-0.8,R3Z(82*TILE),-0.4,12);
  /* Cave features as terrain (mountains, scattered) */
  batPutGeo(wbat,F.caveGateR,R3X(270*TILE),terrainH(270*TILE,15*TILE),R3Z(15*TILE),0,8);
  batPutGeo(wbat,F.caveCorr,R3X(274*TILE),terrainH(274*TILE,18*TILE),R3Z(18*TILE),0.5,6);
  batPutGeo(wbat,F.caveRoomS,R3X(268*TILE),terrainH(268*TILE,22*TILE),R3Z(22*TILE),0.2,6);
  batPutGeo(wbat,F.caveStair,R3X(272*TILE),terrainH(272*TILE,20*TILE),R3Z(20*TILE),Math.PI/4,6);
  batPutGeo(wbat,F.caveLadder,R3X(266*TILE),terrainH(266*TILE,16*TILE),R3Z(16*TILE),0,5);
  batPutGeo(wbat,F.caveWall,R3X(276*TILE),terrainH(276*TILE,14*TILE),R3Z(14*TILE),0.3,6);
  /* === Survival camps scattered === */
  [[25,20],[260,17],[80,145],[200,155],[150,30]].forEach(([sx,sy],i)=>{
    if(sx>=MAP_W-5||sy>=MAP_H-5) return;
    batPutGeo(wbat,F.campPit,R3X(sx*TILE),terrainH(sx*TILE,sy*TILE),R3Z(sy*TILE),0,4);
    batPutGeo(wbat,F.tentSv,R3X((sx+3)*TILE),terrainH((sx+3)*TILE,sy*TILE),R3Z(sy*TILE),i*0.8,6);
    batPutGeo(wbat,F.barrelS,R3X((sx-2)*TILE),terrainH((sx-2)*TILE,(sy+2)*TILE),R3Z((sy+2)*TILE),0.3,5);
    batPutGeo(wbat,F.logA,R3X(sx*TILE),terrainH(sx*TILE,(sy+3)*TILE),R3Z((sy+3)*TILE),i,5);
  });
  /* Arcade machines near multi/craft buildings */
  const multiB=BUILDINGS.find(b=>b.id==='multi'), craftB=BUILDINGS.find(b=>b.id==='craft');
  if(multiB){
    batPutGeo(wbat,F.arcadeCab,R3X((multiB.x+multiB.w+2)*TILE),terrainH((multiB.x+multiB.w+2)*TILE,(multiB.y+2)*TILE),R3Z((multiB.y+2)*TILE),0,12);
    batPutGeo(wbat,F.pinball,R3X((multiB.x+multiB.w+2)*TILE),terrainH((multiB.x+multiB.w+2)*TILE,(multiB.y+5)*TILE),R3Z((multiB.y+5)*TILE),0,10);
    batPutGeo(wbat,F.danceMach,R3X((multiB.x+multiB.w+2)*TILE),terrainH((multiB.x+multiB.w+2)*TILE,(multiB.y+8)*TILE),R3Z((multiB.y+8)*TILE),0,10);
  }
  if(craftB){
    batPutGeo(wbat,F.clawMach,R3X((craftB.x+craftB.w+2)*TILE),terrainH((craftB.x+craftB.w+2)*TILE,(craftB.y+2)*TILE),R3Z((craftB.y+2)*TILE),0,10);
    batPutGeo(wbat,F.vendingMach,R3X((craftB.x+craftB.w+2)*TILE),terrainH((craftB.x+craftB.w+2)*TILE,(craftB.y+5)*TILE),R3Z((craftB.y+5)*TILE),0,8);
    batPutGeo(wbat,F.cashReg,R3X((craftB.x+craftB.w+2)*TILE),terrainH((craftB.x+craftB.w+2)*TILE,(craftB.y+8)*TILE),R3Z((craftB.y+8)*TILE),0,5);
  }
  /* Column pillars near tower base */
  for(let i=0;i<6;i++){
    const angle=i*1.047;
    const cx2=150+Math.cos(angle)*12, cz2=50+Math.sin(angle)*12;
    batPutGeo(wbat,F.columnW,R3X(cx2*TILE),terrainH(cx2*TILE,cz2*TILE),R3Z(cz2*TILE),angle,12);
  }
  scene.add(wbat.mesh());

  /* props: extend propMesh3 with a soil pad under each prop so nothing floats
     over bumpy heightfield ground (3D-look pass) */
  const pbat=new GeoBatch();
  for(const p of PROPS){
    propMesh3(p, pbat);
  }
  scene.add(pbat.mesh());
  /* Kenney flora for flower/rock/bush prop spots */
  const leafMat=new THREE.MeshLambertMaterial({vertexColors:true});
  const fvars=[F.flowerR, F.flowerY, F.flowerP];
  for(const p of PROPS){
    let g=null;
    if(p.k==='flowers') g=fvars[Math.abs(p.x+p.y)%3];
    else if(p.k==='rock') g=F.rock;
    else if(p.k==='bush') g=F.bush;
    if(!g) continue;
    const m=new THREE.Mesh(g, leafMat);
    m.position.set(R3X(p.x+8), terrainH(p.x+8,p.y+8), R3Z(p.y+8));
    m.rotation.y=p.x; m.castShadow=true;
    scene.add(m);
  }
  /* flower bushes near each building */
  const bldgFloraKinds=[F.bush, F.flowerR, F.flowerY, F.flowerP, F.bush];
  for(const b of BUILDINGS){
    const offsets=[
      [-1,-1],[b.w,0],[0,-1],[b.w,b.h],[-1,b.h],
      [b.w/2|0,-1],[b.w/2|0,b.h],[-1,b.h/2|0],[b.w,b.h/2|0]
    ];
    const count=3+((b.x*7+b.y*3)%3);
    for(let i=0;i<count&&i<offsets.length;i++){
      const ox=b.x+offsets[i][0], oy=b.y+offsets[i][1];
      if(ox<1||oy<1||ox>=MAP_W-1||oy>=MAP_H-1) continue;
      const t=map[oy][ox];
      if(t!==GRASS) continue;
      const fk=bldgFloraKinds[i%bldgFloraKinds.length];
      const fm=new THREE.Mesh(fk, leafMat);
      fm.position.set(R3X(ox*TILE+8), terrainH(ox*TILE+8,oy*TILE+8), R3Z(oy*TILE+8));
      fm.rotation.y=i*1.8; fm.castShadow=true;
      scene.add(fm);
    }
  }
  /* trees, instanced and swaying */
  const dummy=new THREE.Object3D(), treeData=[], treeMeshes=[];
  const treeVariants=[
    {geo:F.tree_default, test:t=>!(t.x/TILE>=64&&t.y/TILE<20)&&!t.v},
    {geo:F.tree_oak, test:t=>!(t.x/TILE>=64&&t.y/TILE<20)&&!!t.v},
    {geo:F.pine, test:t=>(t.x/TILE>=64&&t.y/TILE<20)}
  ];
  for(const v of treeVariants){
    v.list=TREES.filter(v.test);
    if(!v.list.length) continue;
    v.im=new THREE.InstancedMesh(v.geo, new THREE.MeshLambertMaterial({vertexColors:true}), v.list.length);
    v.im.castShadow=true; v.im.receiveShadow=true;
    scene.add(v.im);
    treeMeshes.push(v);
  }
  treeMeshes.forEach(v=>{ v.list.forEach((t,i)=>{
    const cxp=t.x+8, cyp=t.y+8, gy=terrainH(cxp,cyp), s=t.v?1.08:0.92;
    dummy.position.set(R3X(cxp), gy, R3Z(cyp));
    dummy.rotation.set(0,0,0); dummy.scale.setScalar(s); dummy.updateMatrix();
    v.im.setMatrixAt(i, dummy.matrix);
    treeData.push({im:v.im, idx:i, x:dummy.position.x, gy, z:dummy.position.z, s, ph:t.ph||0});
  }); v.im.instanceMatrix.needsUpdate=true; });
  /* reeds */
  const reedI=new THREE.InstancedMesh(F.grass, new THREE.MeshLambertMaterial({vertexColors:true}), Math.max(1,REEDS.length));
  reedI.receiveShadow=true;
  REEDS.forEach((r,i)=>{
    dummy.position.set(R3X(r.x), terrainH(r.x,r.y), R3Z(r.y));
    dummy.rotation.set(0,r.x,0); dummy.scale.setScalar(1); dummy.updateMatrix();
    reedI.setMatrixAt(i, dummy.matrix);
  });
  reedI.instanceMatrix.needsUpdate=true;
  scene.add(reedI);
  /* critters: upright Y-billboard cutouts, pivot at the feet (paper figures
     standing on the terrain). PlaneGeometry already faces +Z; translate up
     h/2 so the base sits at y=0. Yaw is set per-frame to face the camera. */
  if(!S) return false;
  const critters=[];
  const addSprite=(kind,sp,x,y)=>{
    const geo=new THREE.PlaneGeometry(sp.w,sp.h);
    geo.translate(0,sp.h/2,0);
    const first=sp.dirs.front.idle;
    const mat=new THREE.MeshBasicMaterial({map:first.t,transparent:false,alphaTest:0.4,side:THREE.DoubleSide});
    const mesh=new THREE.Mesh(geo,mat);
    mesh.castShadow=true;
    mesh.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:first.t,alphaTest:0.4});
    mesh.position.set(R3X(x),0,R3Z(y));
    scene.add(mesh);
    critters.push({mesh,kind,dirs:sp.dirs,h:sp.h,phase:Math.random()*10,heading:0});
  };
  for(const c of cows) addSprite('cow',S.cow,c.x,c.y);
  for(const r of rabbits) addSprite('rabbit',S.rabbit,r.x,r.y);
  for(const g of goats) addSprite('goat',S.goat,g.x,g.y);
  for(const d of deer) addSprite('deer',S.deer,d.x,d.y);
  addSprite('duck',S.mother,mother.x,mother.y);
  for(const k of ducklings) addSprite('duck',S.duckling,k.x,k.y);
  /* player humanoid + jetpack */
  const player=buildPlayer3d();
  scene.add(player.group);
  /* glider squadron, high up */
  const gl3=[];
  gliders.forEach((gg,i)=>{
    const grp=new THREE.Group();
    const wm=new THREE.MeshBasicMaterial({color:'#f4f6f8'});
    grp.add(new THREE.Mesh(new THREE.BoxGeometry(6,1,44), wm));
    grp.add(new THREE.Mesh(new THREE.BoxGeometry(14,2,3), wm));
    grp.position.set(R3X(gg.x), 215+i*16, R3Z(gg.y));
    grp.rotation.z=Math.sin($S.T*0.003+gg.ph)*0.08;
    scene.add(grp); gl3.push(grp);
  });
  /* flying birds: V-shaped silhouettes circling at mid altitude */
  const bird3=[];
  const birdMat=new THREE.MeshBasicMaterial({color:'#2a2a2a'});
  for(let i=0;i<20;i++){
    const grp=new THREE.Group();
    // left wing
    grp.add(new THREE.Mesh(new THREE.BoxGeometry(8,0.5,2), birdMat));
    // right wing
    const rw=new THREE.Mesh(new THREE.BoxGeometry(8,0.5,2), birdMat);
    rw.position.x=10; rw.rotation.z=0.3;
    grp.add(rw);
    const lw=new THREE.Mesh(new THREE.BoxGeometry(8,0.5,2), birdMat);
    lw.position.x=-10; lw.rotation.z=-0.3;
    grp.add(lw);
    const px=(Math.random()-0.5)*4000, pz=(Math.random()-0.5)*2800;
    grp.position.set(px, 120+Math.random()*200, pz);
    grp.scale.setScalar(0.4+Math.random()*0.4);
    scene.add(grp);
    bird3.push({group:grp, cx:px, cz:pz, r:60+Math.random()*120, 
      speed:0.0008+Math.random()*0.0012, phase:Math.random()*6.28,
      bobPhase:Math.random()*6.28, baseY:grp.position.y});
  }
  /* golden pollen motes drifting near the player (3D-look pass): faint life
     in the air between camera and ground; frozen under reduced motion */
  const moteGeo=new THREE.BufferGeometry();
  const motePos=new Float32Array(200*3);
  for(let i=0;i<200;i++){ motePos[i*3]=(Math.random()-0.5)*4800; motePos[i*3+1]=Math.random()*50+2; motePos[i*3+2]=(Math.random()-0.5)*3200; }
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos,3));
  const motes=new THREE.Points(moteGeo,
    new THREE.PointsMaterial({color:'#ffd97a', size:1.2, transparent:true, opacity:0.4, depthWrite:false}));
  motes.frustumCulled=false;
  scene.add(motes);
  /* procedural 3D clouds — puffy white box groups drifting at high altitude */
  const cloud3d=[];
  (function seedClouds3d(){
    const rng=(()=>{let s=37;return()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff;}})();
    const count=15;
    for(let i=0;i<count;i++){
      const grp=new THREE.Group();
      const lobeCount=4+(rng()*5|0);
      const cHex=['#f0f0f0','#ebebeb','#e8e8e8'][rng()*3|0];
      const mat=new THREE.MeshLambertMaterial({color:cHex,transparent:true,opacity:0.82});
      for(let k=0;k<lobeCount;k++){
        const w=30+rng()*50, h=8+rng()*12, d=20+rng()*30;
        const box=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
        box.position.set((rng()-0.5)*60,(rng()-0.5)*10,(rng()-0.5)*40);
        box.castShadow=false;
        grp.add(box);
      }
      const px=(rng()-0.5)*4800, pz=(rng()-0.5)*3200, py=300+rng()*200;
      grp.position.set(px,py,pz);
      scene.add(grp);
      cloud3d.push({group:grp,speed:0.12+rng()*0.25});
    }
  })();
  const post=createPost(renderer,scene,cam);
  function size3d(){
    post.resize(innerWidth, innerHeight);
    cam.aspect=innerWidth/innerHeight; cam.updateProjectionMatrix();
  }
  size3d();
  addEventListener('resize', ()=>{ if($S.R3on) size3d(); });
  $S.R3={sky,ocean,hemi,post,renderer,scene,cam,sun,rimLight,ambient,blds,critters,player,treeData,treeMeshes,dummy,gl3,wtex,motes,cloud3d,bird3,size3d,
      camS:{x:P.x, y:terrainH(P.x,P.y), z:P.y}};
  cloud3d.forEach(c=>{ c.group.visible=false; });
  function applyQuality(){
    post.applyTier();
    const n=quality.tier.shadowMap;
    if(sun.shadow.mapSize.x!==n){ if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map=null; } sun.shadow.mapSize.set(n,n); }
  }
  $S.R3.applyQuality=applyQuality;
  initDevPanel({ onChange:()=>applyQuality(), captureShots:()=>{ $S.shotJob={i:0,frames:0,saved:null}; } });
return true;
}