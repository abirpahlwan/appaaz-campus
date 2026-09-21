/* Ocean and water: turquoise shallows, shore foam lines, sun glitter, sky fresnel.
   Uses a small "distance to shore" texture built from the tile map. */
import * as THREE from 'three';
import { LOOK, sunDirection } from './look';

export function buildShoreTexture(map: number[][], waterId: number, w: number, h: number) {
  const dist = new Int16Array(w * h).fill(-1);
  const q: number[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (map[y][x] !== waterId) { dist[y * w + x] = 0; q.push(y * w + x); }
  }
  for (let i = 0; i < q.length; i++) {
    const c = q[i], x = c % w, y = (c / w) | 0, d = dist[c];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const n = ny * w + nx;
      if (dist[n] === -1) { dist[n] = d + 1; q.push(n); }
    }
  }
  const data = new Uint8Array(w * h);
  for (let i = 0; i < data.length; i++) data[i] = Math.min(31, Math.max(0, dist[i])) * 8;
  const tex = new THREE.DataTexture(data, w, h, THREE.RedFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

const vert = /* glsl */ `
varying vec3 vWorld;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const frag = /* glsl */ `
precision highp float;
varying vec3 vWorld;
uniform sampler2D uShore;
uniform vec2 uWorldSize;
uniform float uTile, uTime, uGlitter, uFogNear, uFogFar;
uniform vec3 uShallow, uDeep, uFoam, uSunDir, uSunColor, uSky, uFogColor;

float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){ return noise(p)*0.55 + noise(p*2.1+7.3)*0.3 + noise(p*4.3+3.1)*0.15; }

/* a wind-driven sea: many waves with irregular wavelengths and a wide spread of directions,
   each one fading out when it is too small to resolve, with patchy gusts and warped crests */
vec3 waves(vec2 p, float t, float dist){
  vec2 warp = vec2(noise(p*0.006 + t*0.03), noise(p*0.006 + 7.3 - t*0.025)) * 2.0 - 1.0;
  p += warp * 38.0;
  vec2 s = vec2(0.0); float crest = 0.0;
    { float a = 0.26432 * dot(vec2(0.784, 0.621), p) + 1.785 * t + 2.92; float sl = 0.170 * (0.35 + 1.3 * noise(p * 0.0025 + 0.0 + t * 0.015)) * (1.0 - smoothstep(3328.0, 8082.0, dist)); s += sl * vec2(0.784, 0.621) * cos(a); }
  { float a = 0.18279 * dot(vec2(0.749, 0.663), p) + 1.282 * t + 3.21; float sl = 0.170 * (0.35 + 1.3 * noise(p * 0.0029 + 13.7 + t * 0.015)) * (1.0 - smoothstep(4812.0, 11687.0, dist)); s += sl * vec2(0.749, 0.663) * cos(a); }
  { float a = 0.12478 * dot(vec2(0.421, 0.907), p) + 1.039 * t + 1.91; float sl = 0.170 * (0.35 + 1.3 * noise(p * 0.0033 + 27.4 + t * 0.015)) * (1.0 - smoothstep(7049.0, 17120.0, dist)); s += sl * vec2(0.421, 0.907) * cos(a); }
  { float a = 0.09751 * dot(vec2(0.391, 0.920), p) + 1.038 * t + 0.26; float sl = 0.170 * (0.35 + 1.3 * noise(p * 0.0037 + 41.1 + t * 0.015)) * (1.0 - smoothstep(9021.0, 21908.0, dist)); s += sl * vec2(0.391, 0.920) * cos(a); }
  { float a = 0.05710 * dot(vec2(0.091, 0.996), p) + 0.788 * t + 3.87; float sl = 0.170 * (0.35 + 1.3 * noise(p * 0.0041 + 54.8 + t * 0.015)) * (1.0 - smoothstep(15405.0, 37413.0, dist)); s += sl * vec2(0.091, 0.996) * cos(a); }
  { float a = 0.04700 * dot(vec2(0.913, -0.408), p) + 0.698 * t + 0.37; float sl = 0.170 * (0.35 + 1.3 * noise(p * 0.0045 + 68.5 + t * 0.015)) * (1.0 - smoothstep(18716.0, 45452.0, dist)); s += sl * vec2(0.913, -0.408) * cos(a); crest += sin(a) * 0.10; }
  { float a = 0.03264 * dot(vec2(0.999, 0.034), p) + 0.524 * t + 2.91; float sl = 0.158 * (0.35 + 1.3 * noise(p * 0.0049 + 82.2 + t * 0.015)) * (1.0 - smoothstep(26951.0, 65453.0, dist)); s += sl * vec2(0.999, 0.034) * cos(a); crest += sin(a) * 0.22; }
  { float a = 0.02167 * dot(vec2(0.330, 0.944), p) + 0.473 * t + 4.02; float sl = 0.141 * (0.35 + 1.3 * noise(p * 0.0053 + 95.9 + t * 0.015)) * (1.0 - smoothstep(40597.0, 98593.0, dist)); s += sl * vec2(0.330, 0.944) * cos(a); crest += sin(a) * 0.22; }
  { float a = 0.01497 * dot(vec2(0.641, 0.767), p) + 0.388 * t + 1.75; float sl = 0.127 * (0.35 + 1.3 * noise(p * 0.0057 + 109.6 + t * 0.015)) * (1.0 - smoothstep(58750.0, 142679.0, dist)); s += sl * vec2(0.641, 0.767) * cos(a); crest += sin(a) * 0.22; }
  { float a = 0.00952 * dot(vec2(0.029, 1.000), p) + 0.334 * t + 4.45; float sl = 0.112 * (0.35 + 1.3 * noise(p * 0.0061 + 123.3 + t * 0.015)) * (1.0 - smoothstep(92379.0, 224348.0, dist)); s += sl * vec2(0.029, 1.000) * cos(a); crest += sin(a) * 0.22; }
  { float a = 0.00760 * dot(vec2(1.000, 0.009), p) + 0.267 * t + 0.44; float sl = 0.105 * (0.35 + 1.3 * noise(p * 0.0065 + 137.0 + t * 0.015)) * (1.0 - smoothstep(115705.0, 280997.0, dist)); s += sl * vec2(1.000, 0.009) * cos(a); crest += sin(a) * 0.22; }
  { float a = 0.00486 * dot(vec2(0.939, 0.344), p) + 0.239 * t + 2.43; float sl = 0.093 * (0.35 + 1.3 * noise(p * 0.0069 + 150.7 + t * 0.015)) * (1.0 - smoothstep(180955.0, 439462.0, dist)); s += sl * vec2(0.939, 0.344) * cos(a); crest += sin(a) * 0.22; }
  /* fine choppy detail that drifts with the wind */
  float fine = 1.0 - smoothstep(350.0, 1500.0, dist);
  vec2 q = p * 0.11 + vec2(t*0.12, t*0.07);
  float e = 0.06, n0 = fbm(q), nx = fbm(q + vec2(e,0.0)), nz = fbm(q + vec2(0.0,e));
  s += vec2(nx - n0, nz - n0) / e * 0.035 * fine;
  return vec3(s, crest);
}

void main(){
  vec2 uv = (vWorld.xz + uWorldSize*0.5) / uWorldSize;
  float d = texture2D(uShore, clamp(uv, 0.0, 1.0)).r * 255.0 / 8.0;
  vec2 outside = max(abs(uv - 0.5) * 2.0 - 1.0, 0.0) * uWorldSize * 0.5 / uTile;
  d += max(outside.x, outside.y);

  vec3 camv = cameraPosition - vWorld;
  float dist = length(camv);
  vec3 v = camv / dist;
  float fade = 1.0 - smoothstep(2500.0, 9000.0, dist);          // calm the far water so it does not shimmer

  vec3 w = waves(vWorld.xz, uTime, dist);
  vec3 n = normalize(vec3(-w.x * fade * 0.85, 1.0, -w.y * fade * 0.85));
  float crest = smoothstep(0.25, 0.9, w.z) * fade;

  float fres = 0.04 + 0.96 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
  fres = clamp(fres * 1.15, 0.0, 0.75);
  vec3 r = reflect(-v, n);

  float depthT = smoothstep(0.0, 16.0, d);
  vec3 base = mix(uShallow, uDeep, depthT);
  base *= 0.9 + 0.2 * fbm(vWorld.xz * 0.012 + uTime * 0.02);                   // patchy depth colour
  vec3 skyRefl = mix(uSky, uFogColor, smoothstep(0.30, 0.0, r.y) * 0.55);
  vec3 col = mix(base, skyRefl, fres);
  col += uShallow * crest * 0.22;                                               // light shining through wave tops

  /* caustic light lines in the shallows */
  vec2 cq = vWorld.xz * 0.07;
  float ca = 1.0 - abs(noise(cq + uTime * 0.07) - noise(cq * 1.35 - uTime * 0.09));
  ca = pow(clamp(ca, 0.0, 1.0), 9.0);
  col += vec3(0.75, 1.0, 0.95) * ca * (1.0 - smoothstep(0.0, 11.0, d)) * 0.30 * fade;

  /* sun: broad sheen plus sparkle */
  float sd = max(dot(r, normalize(uSunDir)), 0.0);
  float sparkle = smoothstep(0.55, 0.95, noise(vWorld.xz * 0.45 + uTime * 1.1));
  col += uSunColor * pow(sd, 240.0) * 3.0 * uGlitter * (0.3 + sparkle);
  col += uSunColor * pow(sd, 14.0) * 0.10 * uGlitter;

  /* foam: wobbly bands rolling in at the shore, plus a few white caps on big crests */
  float wob = fbm(vWorld.xz * 0.05 + uTime * 0.05) * 5.0;
  float band = sin(d * 2.6 - uTime * 0.8 + wob) * 0.6 + sin(d * 4.4 - uTime * 1.15 + wob * 1.7) * 0.4;
  float patchM = smoothstep(0.30, 0.75, noise(vWorld.xz * 0.035 + uTime * 0.04));
  float foam = smoothstep(0.35, 0.95, band) * patchM * (1.0 - smoothstep(1.0, 4.2, d)) * 0.9;
  foam += (1.0 - smoothstep(0.0, 0.7, d)) * 0.95;
  float cap = smoothstep(0.78, 1.0, w.z) * smoothstep(0.45, 0.8, noise(vWorld.xz * 0.2 + uTime * 0.4)) * smoothstep(3.0, 8.0, d) * fade;
  col = mix(col, uFoam, clamp(foam + cap * 0.6, 0.0, 1.0) * 0.85);

  col = mix(col, uFogColor, smoothstep(uFogNear, uFogFar, dist));
  gl_FragColor = vec4(col, 1.0);
}`;

export function createOcean(opts: { world: THREE.Vector2; tile: number; shore: THREE.DataTexture; size: THREE.Vector2 }) {
  const mat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag,
    uniforms: {
      uShore: { value: opts.shore }, uWorldSize: { value: opts.world }, uTile: { value: opts.tile },
      uTime: { value: 0 }, uGlitter: { value: 1 }, uFogNear: { value: 1000 }, uFogFar: { value: 8000 },
      uShallow: { value: new THREE.Color() }, uDeep: { value: new THREE.Color() }, uFoam: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3() }, uSunColor: { value: new THREE.Color() },
      uSky: { value: new THREE.Color() }, uFogColor: { value: new THREE.Color() },
    },
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(opts.size.x, opts.size.y), mat);
  mesh.rotation.x = -Math.PI / 2;
  const sd = new THREE.Vector3();
  return {
    mesh,
    update(time: number) {
      const u = mat.uniforms;
      u.uTime.value = time; u.uGlitter.value = LOOK.seaGlitter;
      u.uShallow.value.set(LOOK.seaShallow); u.uDeep.value.set(LOOK.seaDeep); u.uFoam.value.set(LOOK.seaFoam);
      u.uSunDir.value.copy(sunDirection(sd)); u.uSunColor.value.set(LOOK.sunColor);
      u.uSky.value.set(LOOK.skyMid); u.uFogColor.value.set(LOOK.fogColor);
      u.uFogNear.value = LOOK.fogNear; u.uFogFar.value = LOOK.fogFar;
    },
  };
}
