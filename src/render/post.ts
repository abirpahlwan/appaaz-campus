/* Post-processing: MSAA scene render -> bloom -> tone mapping/sRGB -> colour grade + vignette. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { LOOK } from './look';
import { quality } from './quality';

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uSat: { value: 1.1 }, uContrast: { value: 1.05 }, uVignette: { value: 0.2 },
    uShadowTint: { value: new THREE.Vector3(0.6, 0.72, 0.9) },
    uHighTint: { value: new THREE.Vector3(1.0, 0.94, 0.82) },
  },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uSat, uContrast, uVignette; uniform vec3 uShadowTint, uHighTint;
    varying vec2 vUv;
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, uSat);
      c = (c - 0.5) * uContrast + 0.5;
      float sh = 1.0 - smoothstep(0.0, 0.55, l);
      float hi = smoothstep(0.45, 1.0, l);
      c = mix(c, c * uShadowTint * 1.35, sh * 0.35);
      c = mix(c, c * uHighTint, hi * 0.25);
      vec2 q = vUv - 0.5;
      c *= 1.0 - uVignette * smoothstep(0.25, 0.85, dot(q, q) * 2.0);
      gl_FragColor = vec4(max(c, 0.0), 1.0);
    }`,
};

export function createPost(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
  let composer: EffectComposer;
  let bloom: UnrealBloomPass;
  let grade: ShaderPass;
  let builtSamples = -1;
  let w = innerWidth, h = innerHeight, ratio = 1;
  const rgb = (hex: string): [number, number, number] => { const n = parseInt(hex.replace('#', ''), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };

  function build() {
    const samples = quality.tier.msaa;
    const rt = new THREE.WebGLRenderTarget(w * ratio, h * ratio, { type: THREE.HalfFloatType, samples });
    composer = new EffectComposer(renderer, rt);
    composer.setPixelRatio(ratio);
    composer.setSize(w, h);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(w, h), LOOK.bloomStrength, LOOK.bloomRadius, LOOK.bloomThreshold);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    grade = new ShaderPass(GradeShader);
    composer.addPass(grade);
    builtSamples = samples;
  }

  function applyTier() {
    ratio = Math.min(devicePixelRatio || 1, quality.tier.maxPixelRatio) * quality.scale;
    renderer.setPixelRatio(ratio);
    renderer.setSize(w, h);
    if (builtSamples !== quality.tier.msaa) { composer?.dispose(); build(); }
    composer.setPixelRatio(ratio);
    composer.setSize(w, h);
  }

  applyTier();

  return {
    resize(nw: number, nh: number) { w = nw; h = nh; applyTier(); },
    applyTier,
    render(dt: number) {
      renderer.toneMappingExposure = LOOK.exposure;
      bloom.enabled = quality.tier.bloom;
      bloom.strength = LOOK.bloomStrength; bloom.radius = LOOK.bloomRadius; bloom.threshold = LOOK.bloomThreshold;
      const u = grade.uniforms;
      u.uSat.value = LOOK.saturation; u.uContrast.value = LOOK.contrast; u.uVignette.value = LOOK.vignette;
      u.uShadowTint.value.set(...rgb(LOOK.shadowTint));
      u.uHighTint.value.set(...rgb(LOOK.highlightTint));
      composer.render(dt);
    },
  };
}
