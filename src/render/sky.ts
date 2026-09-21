/* Sky dome: gradient, sun disc + halo and soft toon-lit clouds, all in one shader. */
import * as THREE from 'three';
import { LOOK, sunDirection } from './look';

const vert = /* glsl */ `
varying vec3 vDir;
void main(){
  vDir = normalize(position);
  vec4 p = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * p;
}`;

const frag = /* glsl */ `
precision highp float;
varying vec3 vDir;
uniform vec3 uTop, uMid, uHorizon, uHaze, uSunDir, uSunColor;
uniform float uTime, uCover, uSoft;

float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){
  float a = 0.5, s = 0.0;
  for(int i=0;i<5;i++){ s += a*noise(p); p = p*2.03 + 17.1; a *= 0.5; }
  return s;
}
void main(){
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.22, h));
  col = mix(col, uTop, smoothstep(0.18, 0.75, h));
  if(h < 0.0) col = mix(uHorizon, uHaze, smoothstep(0.0, -0.2, h));

  float cs = dot(d, normalize(uSunDir));
  float halo = pow(max(cs, 0.0), 6.0) * 0.10 + pow(max(cs, 0.0), 64.0) * 0.30;
  col += uSunColor * halo;
  float disc = smoothstep(0.99935, 0.9997, cs);
  col = mix(col, vec3(1.0, 0.98, 0.9) * 2.2, disc);

  if(h > 0.015){
    vec2 p = d.xz / (h + 0.08) * 0.55 + vec2(uTime*0.006, uTime*0.002);
    float n = fbm(p);
    float dens = smoothstep(uCover - uSoft, uCover + uSoft, n) * smoothstep(0.015, 0.16, h);
    float n2 = fbm(p + normalize(uSunDir).xz * 0.09);
    float light = clamp(0.62 + (n - n2) * 5.5, 0.0, 1.0);
    vec3 shadow = mix(vec3(0.62, 0.74, 0.92), uMid, 0.25);
    vec3 lit = mix(vec3(1.0), uSunColor, 0.35);
    vec3 cloud = mix(shadow, lit, light);
    cloud += uSunColor * pow(max(cs, 0.0), 12.0) * 0.35 * (1.0 - dens*0.4);
    col = mix(col, cloud, dens * 0.95);
  }
  gl_FragColor = vec4(col, 1.0);
}`;

export function createSky() {
  const mat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uTop: { value: new THREE.Color() }, uMid: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() }, uHaze: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunColor: { value: new THREE.Color() },
      uTime: { value: 0 }, uCover: { value: 0.5 }, uSoft: { value: 0.2 },
    },
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(8000, 32, 20), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  const sd = new THREE.Vector3();
  return {
    mesh,
    update(time: number, camPos: THREE.Vector3) {
      mesh.position.copy(camPos);
      const u = mat.uniforms;
      u.uTop.value.set(LOOK.skyTop); u.uMid.value.set(LOOK.skyMid);
      u.uHorizon.value.set(LOOK.skyHorizon); u.uHaze.value.set(LOOK.skySeaHaze);
      u.uSunColor.value.set(LOOK.sunColor);
      u.uSunDir.value.copy(sunDirection(sd));
      u.uTime.value = time; u.uCover.value = LOOK.cloudCover; u.uSoft.value = LOOK.cloudSoftness;
    },
  };
}
