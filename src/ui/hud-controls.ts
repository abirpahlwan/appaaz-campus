// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */
import { $S, $R } from '../core/state';
import { track } from '../core/analytics';
import { objs } from '../world/objects';
import { keys, P, resize } from '../entities/player';
import { loop, start3d } from '../render/loop3d';
import { closeModal, modal, openModal, toast, tryInteract, updateFound } from './modal';
import { AudioManager } from '../core/audio';
import { buildClassic, toggleClassic } from './contact-classic';


const classicLnk=document.getElementById('lnkClassic'); if(classicLnk) classicLnk.onclick=e=>{e.preventDefault(); toggleClassic(true);};
const soundButton=document.getElementById('btnSound');
const volumeControl=document.getElementById('audioVolume');
soundButton.textContent=$S.soundOn?'♪ on':'♪ off';
volumeControl.value=String(AudioManager.getVolume());
soundButton.onclick      = e=>{ $S.soundOn=!$S.soundOn; AudioManager.setMuted(!$S.soundOn); e.target.textContent=$S.soundOn?'♪ on':'♪ off'; if($S.soundOn) AudioManager.play('ui'); };
volumeControl.addEventListener('input', e=>AudioManager.setVolume(e.target.value));
document.getElementById('btnHelp').onclick       = ()=>openModal('How to explore','controls',
  `<ul>
     <li><b>Move</b> — WASD or arrow keys (mobile: the stick at the bottom center, or drag the lower-left of the screen; drag elsewhere to orbit)</li>
     <li><b>Go inside</b> — walk through a lit doorway; the roof lifts off</li>
     <li><b>Interact</b> — stand by something glowing and press <b>E</b></li>
     <li><b>Jetpack</b> — hold <b>Space</b> (or <b>Z</b>); add <b>Shift</b> to descend; release mid-air to hover — on mobile hold <b>▲</b> to rise or <b>▼</b> to descend</li>
     <li><b>Close</b> — <b>Esc</b>, or click outside the panel</li>
     <li><b>Text version</b> — press <b>M</b> or hit "Text version"</li>
   </ul>
   <p>Eight buildings and ${objs.filter(o=>!o.secret).length} things to read across the campus.</p>`, 'wave');
const spd=document.getElementById('spd'), spdVal=document.getElementById('spdVal');
function setSpeed(v){ P.speed=parseFloat(v); spdVal.textContent=P.speed.toFixed(1)+'\u00d7'; }
spd.addEventListener('input', e=>setSpeed(e.target.value));
setSpeed(spd.value);
/* keep the keyboard on the game, not the slider; hand focus back when done */
spd.addEventListener('keydown', e=>e.preventDefault());
spd.addEventListener('change', ()=>spd.blur());

/* camera sliders: hand focus back to the game field after a value changes,
   so the next WASD/Space press moves the hero instead of the slider */
for (const id of ['camAngle', 'camDist']) {
  const el = document.getElementById(id);
  if (!el) continue;
  el.addEventListener('keydown', e=>e.preventDefault());
  el.addEventListener('change', ()=>el.blur());
  el.addEventListener('pointerup', ()=>setTimeout(()=>el.blur(), 0));   // mouse + touch release
}

document.getElementById('btnStart').onclick = ()=>{
  AudioManager.unlock();
  document.getElementById('intro').style.display='none';
  toast('Walk through a doorway to go inside'); AudioManager.play('success',{frequency:880}); AudioManager.startAmbience(); AudioManager.startBgm();
  track('start-playing');
};

/* --- Collapsible HUD: on phones the panels fold away so the 3D view
   gets the whole screen; touch controls, prompt and minimap stay. The
   choice is remembered (per device) across visits. --- */
const hud = document.getElementById('hud');
const hudToggle = document.getElementById('hudToggle');
const HUD_KEY = 'appaaz.hudMin';
let hudMin = false;
try { hudMin = localStorage.getItem(HUD_KEY) !== null ? localStorage.getItem(HUD_KEY) === '1' : matchMedia('(pointer:coarse)').matches; } catch(err){ hudMin = matchMedia('(pointer:coarse)').matches; }
function applyHud(){
  hud.classList.toggle('min', hudMin);
  hudToggle.textContent = hudMin ? '▾ HUD' : '▴ HUD';
  hudToggle.setAttribute('aria-expanded', String(!hudMin));
  try { localStorage.setItem(HUD_KEY, hudMin ? '1' : '0'); } catch(err){}
}
hudToggle.addEventListener('click', ()=>{ hudMin = !hudMin; applyHud(); });
applyHud();

document.addEventListener('visibilitychange', ()=>document.hidden ? AudioManager.pause() : AudioManager.resume());
addEventListener('pagehide', ()=>AudioManager.dispose(), {once:true});

/* ------------------------------------------------------------------
   Touch controls.

   The stick is "floating": put a finger down anywhere on the left side of
   the screen and the stick jumps to that spot, so you never have to look
   for it. Touches are tracked by identifier, so you can steer and tap LOOK
   at the same time.
   ------------------------------------------------------------------ */
const stick = document.getElementById('stick');
const nub   = document.getElementById('nub');
const abtn  = document.getElementById('abtn');
const STICK_MAX = 46;
let stickId = null, sc = {x:0, y:0};
let lookId = null, lookLast = null;

/* Movement model for the 3D scenes:
   - $S.touchVec  — analog move vector in screen space, -1..1 per axis
     (x right, y down). Scenes convert it to camera-relative motion, so
     stick-up always walks away from the camera.
   - $S.touchLook — camera drag deltas in px, accumulated between frames
     and consumed (zeroed) by the active 3D scene each frame. */
$S.touchVec = {x:0, y:0};
$S.touchLook = {x:0, y:0};

function isUiTarget(t){
  return !!(t && t.closest && t.closest('button, a, input, textarea, select, #modal, #classic'));
}
function placeStick(x, y){
  /* CSS centers the resting stick with left:50% + translateX(-50%);
     when floating we park that same centered box under the finger. */
  stick.style.left = x + 'px';
  stick.style.top  = (y - 62) + 'px';
  stick.style.bottom = 'auto';
  stick.classList.add('live');
}
function restStick(){
  stick.style.left = '';      // back to CSS default: bottom center
  stick.style.top = 'auto';
  stick.style.bottom = '';
  stick.classList.remove('live');
  nub.style.transform = '';
}
function applyStick(t){
  let dx = t.clientX - sc.x, dy = t.clientY - sc.y;
  const d = Math.hypot(dx, dy);
  if(d > STICK_MAX){ dx = dx/d*STICK_MAX; dy = dy/d*STICK_MAX; }
  nub.style.transform = `translate(${dx}px,${dy}px)`;
  /* small dead zone so a resting finger doesn't creep the hero forward */
  $S.touchVec = d < 6 ? {x:0, y:0} : {x: dx/STICK_MAX, y: dy/STICK_MAX};
}
function endStick(){
  if(stickId === null) return;
  stickId = null;
  $S.touchVec = {x:0, y:0};
  restStick();
}
function endLook(){
  lookId = null; lookLast = null;
  $S.touchLook.x = 0; $S.touchLook.y = 0;
}

/* Touches inside the (now centered) stick always belong to the stick,
   even though its right half sits past the 55% "look zone" line. */
function inStickZone(t){
  const r = stick.getBoundingClientRect();
  const cx = r.left + r.width/2, cy = r.top + r.height/2;
  return Math.hypot(t.clientX - cx, t.clientY - cy) <= r.width*0.6 + 10;
}

addEventListener('touchstart', e=>{
  if(!matchMedia('(pointer:coarse)').matches) return;
  for(const t of e.changedTouches){
    if(isUiTarget(t.target)) continue;                 // buttons and panels keep their taps
    if(t.clientY < 96) continue;                       // keep clear of the HUD
    if(stickId === null && (t.clientX <= innerWidth*0.55 || inStickZone(t))){
      stickId = t.identifier;                          // left side: floating stick
      placeStick(t.clientX, t.clientY);
      sc = {x: t.clientX, y: t.clientY};
      applyStick(t);
    } else if(lookId === null){
      lookId = t.identifier;                           // anywhere else: camera orbit
      lookLast = {x: t.clientX, y: t.clientY};
    }
  }
}, {passive:true});

addEventListener('touchmove', e=>{
  for(const t of e.changedTouches){
    if(t.identifier === stickId) applyStick(t);
    else if(lookId !== null && t.identifier === lookId && lookLast){
      $S.touchLook.x += t.clientX - lookLast.x;
      $S.touchLook.y += t.clientY - lookLast.y;
      lookLast = {x: t.clientX, y: t.clientY};
    }
  }
}, {passive:true});

function endTouch(e){
  for(const t of e.changedTouches){
    if(t.identifier === stickId) endStick();
    if(t.identifier === lookId)  endLook();
  }
}
addEventListener('touchend', endTouch, {passive:true});
addEventListener('touchcancel', endTouch, {passive:true});
addEventListener('blur', ()=>{ endStick(); endLook(); });
/* 3D scenes call this when a multi-finger gesture (pinch zoom) starts,
   so steering doesn't fight the camera gesture */
$R.endTouchControls = ()=>{ endStick(); endLook(); };

/* LOOK: fire on touchstart so it feels instant, and don't let the same tap
   also count as a click afterwards. */
let lookLock = 0;
function pressLook(e){
  if(e){ e.preventDefault(); e.stopPropagation(); }
  const now = Date.now();
  if(now - lookLock < 250) return;
  lookLock = now;
  abtn.style.transform = 'translateY(3px)';
  setTimeout(()=>{ abtn.style.transform=''; }, 120);
  if(navigator.vibrate) { try{ navigator.vibrate(12); }catch(err){} }
  tryInteract();
}
abtn.addEventListener('touchstart', pressLook, {passive:false});
abtn.addEventListener('click', e=>{
  if(Date.now() - lookLock < 400) return;   // already handled by the touch
  pressLook(e);
});

/* FLY: two stacked buttons — hold ▲ to rise, hold ▼ to descend, release to
   hover in place. Both 3D modes read keys[' ']/keys['z'] for thrust and
   keys['shift'] for descend, so these buttons drive jetpack + hover +
   landing everywhere. */
const flyUpBtn = document.getElementById('flyup');
const flyDownBtn = document.getElementById('flydown');
let flyHeld = null;                              // 'up' | 'down' | null, only while a pad button is held
function flyPress(btn, dir, e){
  if(e){ e.preventDefault(); e.stopPropagation(); }
  flyHeld = dir;
  btn.classList.add('active');
  keys[' '] = true; keys['z'] = true;
  if(dir === 'down') keys['shift'] = true; // ▼ descends
  if(navigator.vibrate){ try{ navigator.vibrate(10); }catch(err){} }
}
function flyRelease(btn){
  if(!flyHeld) return;                      // never clear keys held on the keyboard
  if(btn && btn !== (flyHeld === 'up' ? flyUpBtn : flyDownBtn)) return;   // the other pad button is still held
  flyHeld = null;
  flyUpBtn.classList.remove('active'); flyDownBtn.classList.remove('active');
  keys[' '] = false; keys['z'] = false; keys['shift'] = false;
}
for(const [btn, dir] of [[flyUpBtn,'up'],[flyDownBtn,'down']]){
  btn.addEventListener('touchstart', e=>flyPress(btn, dir, e), {passive:false});
  btn.addEventListener('touchend', ()=>flyRelease(btn), {passive:true});
  btn.addEventListener('touchcancel', ()=>flyRelease(btn), {passive:true});
  btn.addEventListener('pointerdown', e=>{ if(e.pointerType !== 'touch') flyPress(btn, dir, e); });
  btn.addEventListener('pointerup', e=>{ if(flyHeld && e.pointerType !== 'touch') flyRelease(btn); });
  btn.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); });   // taps are fully handled above
}

/* tapping the dimmed area outside a panel closes it on touch too */
modal.addEventListener('touchstart', e=>{
  if(e.target === modal) closeModal();
}, {passive:true});

buildClassic();
updateFound();
resize();
loop();
if(new URLSearchParams(location.search).get('scene')!=='legacy'){
  import('../campus/scene').then(m=>{ m.startCampus(); toast('WASD move, drag to look, Space jetpack, E to open a panel, L look panel'); });
} else {
  start3d().catch(e=>{ console.error(e); toast('Could not start 3D: '+(e&&e.message||e)); });
}