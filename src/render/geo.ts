// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */
import { DESERT, FLOOR, PATH, RAIL, ROCK, RUNWAY, SAND, WALL, WATER, hash } from '../world/config';


/* merge static boxes into one mesh: few draw calls, keeps the pixel look */
export function GeoBatch(){ this.pos=[]; this.nor=[]; this.col=[]; this.idx=[]; this.n=0; }
GeoBatch.prototype.put=function(geo,x,y,z,c,ry){
  if(ry) geo.rotateY(ry);
  geo.translate(x,y,z);
  const p=geo.getAttribute('position'), n=geo.getAttribute('normal'), col=new THREE.Color(c);
  for(let i=0;i<p.count;i++){ this.pos.push(p.getX(i),p.getY(i),p.getZ(i)); this.nor.push(n.getX(i),n.getY(i),n.getZ(i)); this.col.push(col.r,col.g,col.b); }
  const ix=geo.getIndex();
  if(ix){ for(let i=0;i<ix.count;i++) this.idx.push(ix.getX(i)+this.n); }
  else { for(let i=0;i<p.count;i++) this.idx.push(i+this.n); }
  this.n+=p.count;
  geo.dispose();
};
GeoBatch.prototype.box=function(w,h,d,x,y,z,c,ry){ this.put(new THREE.BoxGeometry(w,h,d),x,y,z,c,ry); };
GeoBatch.prototype.mesh=function(mat){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos,3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor,3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(this.col,3));
  g.setIndex(this.idx);
  const m=new THREE.Mesh(g, mat||GeoBatch.lamb());
  m.castShadow=true; m.receiveShadow=true;
  return m;
};
GeoBatch.lamb=function(){
  if(!GeoBatch._l) GeoBatch._l=new THREE.MeshLambertMaterial({vertexColors:true});
  return GeoBatch._l;
};
/* Merge a shared Kenney geometry into a batch WITHOUT flattening its baked vertex
   colors (GeoBatch.put tints everything one color). Clones so the cached geometry
   stays reusable across placements. Additive helper; GeoBatch untouched. 3D-houses. */
export function batPutGeo(bat, geo, x,y,z, ry, sc){
  if(!geo) return;
  const g=geo.clone();
  if(sc&&sc!==1){ const p=g.getAttribute('position'); for(let i=0;i<p.count;i++){ p.setX(i,p.getX(i)*sc); p.setY(i,p.getY(i)*sc); p.setZ(i,p.getZ(i)*sc); } }
  if(ry) g.rotateY(ry);
  g.translate(x,y,z);
  const p=g.getAttribute('position'), n=g.getAttribute('normal'), c=g.getAttribute('color');
  for(let i=0;i<p.count;i++){ bat.pos.push(p.getX(i),p.getY(i),p.getZ(i));
    bat.nor.push(n.getX(i),n.getY(i),n.getZ(i)); bat.col.push(c.getX(i),c.getY(i),c.getZ(i)); }
  const ix=g.getIndex();
  if(ix){ for(let i=0;i<ix.count;i++) bat.idx.push(ix.getX(i)+bat.n); }
  else { for(let i=0;i<p.count;i++) bat.idx.push(i+bat.n); }
  bat.n+=p.count;
  g.dispose();
}
export function tileFaceColor(t,tx,ty,h){
  const j=(hash(tx*13+5,ty*13+11)-0.5)*0.07 + Math.sin(tx*0.11)*Math.sin(ty*0.09)*0.05;
  const c=new THREE.Color(
    t===PATH?'#e8cf9a' : t===SAND?'#f0dda6' : t===DESERT?'#e0bd76' :
    t===WATER?'#1f7a9e' : t===FLOOR?'#e0e0d8' : t===WALL?'#FBF4E4' :
    t===ROCK?(h>22?'#d3e2ff':'#7d94c0') : t===RAIL?'#8f7360' : t===RUNWAY?'#56687e' : '#93d65c');
  c.offsetHSL(0,0,j);
  return '#'+c.getHexString();
}