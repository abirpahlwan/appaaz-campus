// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */
import { $S, $R } from '../core/state';
import { TILE } from './config';
import { POND } from './map';



/* ==================================================================
   WATER — software shader over the pond.
   Layers, after godotshaders.com/shader/2d-water-for-topdown-games:
     fbm wave field · expanding ripple emitters · normals -> specular
     · depth-blended colour · animated shoreline foam
   ================================================================== */
const WPAD = 2;
export const WX0 = Math.floor(POND.cx-POND.rx-WPAD), WY0 = Math.floor(POND.cy-POND.ry-WPAD);
const WX1 = Math.ceil (POND.cx+POND.rx+WPAD), WY1 = Math.ceil (POND.cy+POND.ry+WPAD);
export const WSC = 2;                                   // world px per water pixel
export const WPW = (WX1-WX0)*TILE/WSC, WPH = (WY1-WY0)*TILE/WSC;

export const wcv = document.createElement('canvas');
wcv.width = WPW; wcv.height = WPH;
const wctx = wcv.getContext('2d', {willReadFrequently:true});
const wimg = wctx.createImageData(WPW, WPH);
const wbuf = new Uint32Array(wimg.data.buffer);
const wDepth = new Float32Array(WPW*WPH);       // 0 at the shoreline, 1 mid-pond
const wRad   = new Float32Array(WPW*WPH);       // normalised radius, for the shore band
const wH     = new Float32Array(WPW*WPH);       // height field

function ihash(x,y){
  let n = (x|0)*374761393 + (y|0)*668265263;
  n = (n ^ (n>>13)) * 1274126177;
  return ((n ^ (n>>16))>>>0) / 4294967296;
}
function vnoise(x,y){
  const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi;
  const u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf);
  const a=ihash(xi,yi), b=ihash(xi+1,yi), c=ihash(xi,yi+1), d=ihash(xi+1,yi+1);
  return (a+(b-a)*u) + ((c+(d-c)*u) - (a+(b-a)*u))*v;
}
function fbm(x,y){
  /* rotated octaves, as in the reference shader */
  let f = vnoise(x,y)*0.55;
  const rx =  x*0.80 + y*0.60, ry = -x*0.60 + y*0.80;
  f += vnoise(rx*2.1, ry*2.1)*0.30;
  f += vnoise(x*4.3 - 11.7, y*4.3 + 5.1)*0.15;
  return f;
}

/* depth mask: soft distance to the pond boundary, with a wobbly edge */
(function bakeDepth(){
  for(let py=0; py<WPH; py++) for(let px2=0; px2<WPW; px2++){
    const wx = WX0*TILE + px2*WSC, wy = WY0*TILE + py*WSC;
    const tx = wx/TILE, ty = wy/TILE;
    const wob = (vnoise(tx*1.6, ty*1.6)-0.5)*0.10;
    const dx=(tx-POND.cx)/POND.rx, dy=(ty-POND.cy)/POND.ry;
    const r = Math.sqrt(dx*dx+dy*dy) + wob;
    wRad[py*WPW+px2]   = r;
    wDepth[py*WPW+px2] = r>=1 ? -1 : Math.min(1, (1-r)/0.34);
  }
})();

/* ripple emitters */
const emitters = [];
function emit(wx, wy, strength){
  if(emitters.length>8) emitters.shift();
  emitters.push({x:(wx-WX0*TILE)/WSC, y:(wy-WY0*TILE)/WSC, t:0, s:strength||1});
}
let emitTick=0;

export function updateWater(){
  emitTick++;
  if(emitTick%46===0){
    const a=Math.random()*6.283, r=Math.sqrt(Math.random());
    emit((POND.cx + Math.cos(a)*POND.rx*0.8*r)*TILE,
         (POND.cy + Math.sin(a)*POND.ry*0.8*r)*TILE, 0.75);
  }
  if(emitTick%26===0) emit($R.mother.x, $R.mother.y+2, 1.15);
  for(let i=emitters.length-1;i>=0;i--){
    emitters[i].t += 1;
    if(emitters[i].t>210) emitters.splice(i,1);
  }
}

const RIPPLE_STRENGTH = 0.9, HIGHLIGHT_POW = 16;
export function renderWater(){
  const t = $S.T*0.016;
  const active=[], nAct0=emitters.length;
  for(let k=0;k<nAct0;k++){
    const e=emitters[k];
    e.rad = e.t*0.31;
    const f = 1 - e.t/210; e.fade = f*f;
    e.rMax = e.rad + 6;
    if(e.fade>0.01) active.push(e);
  }
  const nAct=active.length;

  /* pass 1 — height field */
  for(let py=0; py<WPH; py++){
    for(let px2=0; px2<WPW; px2++){
      const idx=py*WPW+px2;
      if(wDepth[idx]<0){ wH[idx]=0; continue; }
      const x=px2, y=py;
      /* drifting fbm swell */
      let h = fbm(x*0.090 + t*0.35, y*0.090 - t*0.22)*0.92;
      /* two crossing sine waves */
      h += Math.sin(x*0.22 + y*0.12 + t*1.9)*0.22;
      h += Math.sin(x*0.12 - y*0.26 - t*1.4)*0.18;
      /* fine chop, so the swell doesn't read as blotches */
      h += (vnoise(x*0.52 + t*2.1, y*0.52 - t*1.5)-0.5)*0.34;
      /* expanding ripples */
      for(let k=0;k<nAct;k++){
        const e=active[k];
        const dy=(y-e.y)*1.9;
        if(dy>e.rMax || dy<-e.rMax) continue;
        const dx=x-e.x;
        if(dx>e.rMax || dx<-e.rMax) continue;
        const d=Math.sqrt(dx*dx+dy*dy);
        const age=e.t, radius=age*0.62;
        const band=Math.abs(d-radius);
        if(band<6){
          h += Math.sin((d-radius)*1.10) * (1-band/6) * e.fade * RIPPLE_STRENGTH * e.s;
        }
      }
      wH[idx]=h;
    }
  }

  /* pass 2 — normals, specular, colour */
  for(let py=0; py<WPH; py++){
    for(let px2=0; px2<WPW; px2++){
      const idx=py*WPW+px2;
      const dep=wDepth[idx];
      if(dep<0){
        const rad=wRad[idx];
        if(rad<1.14){                                   // sandy shore, smooth-edged
          const n=vnoise(px2*0.30, py*0.30);
          const near = rad < 1.04+n*0.04;
          wbuf[idx] = (255<<24) | ((near?126:143)<<16) | ((near?214:224)<<8) | (near?238:243);
        } else wbuf[idx]=0;
        continue;
      }

      const l = px2>0 ? wH[idx-1] : wH[idx];
      const r = px2<WPW-1 ? wH[idx+1] : wH[idx];
      const u = py>0 ? wH[idx-WPW] : wH[idx];
      const dn= py<WPH-1 ? wH[idx+WPW] : wH[idx];
      let nx=(l-r)*1.5, ny=(u-dn)*1.5;
      const nl=Math.sqrt(nx*nx+ny*ny+1); nx/=nl; ny/=nl;
      const nz=1/nl;

      /* directional light from the upper left */
      let spec = nx*(-0.62) + ny*(-0.62) + nz*0.48;
      spec = spec>0 ? Math.pow(spec, HIGHLIGHT_POW) : 0;

      /* cartoon cel water: a handful of flat bands, hard edges */
      const hv = wH[idx];
      const v  = dep - hv*0.16;                 // waves push the band edges around
      let R,G,B;
      if(v < 0.16){ R=150; G=235; B=250; }      // shallow
      else if(v < 0.42){ R= 80; G=212; B=240; } // mid
      else { R= 45; G=175; B=220; }             // deep
      /* crest lines and specular read as flat white flecks */
      if(hv > 0.66 || spec > 0.42){ R=246; G=253; B=255; }
      /* shoreline foam */
      if(dep < 0.17){
        const f = 1 - dep/0.17;
        const churn = fbm(px2*0.36 + t*1.1, py*0.36 - t*0.8);
        if(f*f*(0.5+churn*0.95) > 0.34){ R=255; G=255; B=255; }
      }

      wbuf[idx] = (255<<24) | (B<<16) | (G<<8) | R;
    }
  }
  wctx.putImageData(wimg,0,0);
}