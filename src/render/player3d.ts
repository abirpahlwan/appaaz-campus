// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */


export function buildPlayer3d(){
  const g=new THREE.Group();
  const M=c=>new THREE.MeshLambertMaterial({color:c});
  const add=(w,h,d,c,x,y,z)=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), M(c));
    m.position.set(x,y,z); m.castShadow=true; g.add(m); return m;
  };
  const limb=(w,h,d,c,x,y)=>{
    const geo=new THREE.BoxGeometry(w,h,d); geo.translate(0,-h/2+1,0);
    const m=new THREE.Mesh(geo, M(c)); m.position.set(x,y,0); m.castShadow=true; g.add(m); return m;
  };
  const legL=limb(3,7,3.4,'#39404f',-2,7), legR=limb(3,7,3.4,'#39404f',2,7);
  add(9,8,5,'#3e7d4f',0,11,0);
  add(2.5,1.5,0.8,'#EAB308',0,12,2.8);
  const armL=limb(2.4,7,2.6,'#2f613d',-5.8,14), armR=limb(2.4,7,2.6,'#2f613d',5.8,14);
  add(7,6.5,6.5,'#e9b183',0,18.5,0);
  add(7.6,3,7,'#1b1a20',0,21,0);
  add(7.6,5,2,'#1b1a20',0,19,-3);
  add(6,9,4,'#43584f',0,11,-4.5);
  add(1.8,3,1.8,'#2b2b33',-2,3.5,-4.5); add(1.8,3,1.8,'#2b2b33',2,3.5,-4.5);
  const flame=new THREE.Mesh(new THREE.ConeGeometry(2.2,7,8),
    new THREE.MeshBasicMaterial({color:'#ff9f2e', transparent:true, opacity:0.9}));
  flame.rotation.x=Math.PI; flame.position.set(0,1,-4.5); flame.visible=false;
  g.add(flame);
  return {group:g, legL, legR, armL, armR, flame};
}