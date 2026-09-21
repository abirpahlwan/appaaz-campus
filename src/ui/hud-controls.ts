// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */
import { $S } from '../core/state';
import { track } from '../core/analytics';
import { objs } from '../world/objects';
import { P, resize } from '../entities/player';
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
     <li><b>Move</b> — WASD or arrow keys (drag the on-screen stick on mobile)</li>
     <li><b>Go inside</b> — walk through a lit doorway; the roof lifts off</li>
     <li><b>Interact</b> — stand by something glowing and press <b>E</b></li>
     <li><b>Jetpack</b> — hold <b>Space</b> (or <b>Z</b>); add <b>Shift</b> to descend</li>
     <li><b>Close</b> — <b>Esc</b>, or click outside the panel</li>
     <li><b>Text version</b> — press <b>M</b> or hit "Text version"</li>
   </ul>
   <p>Eight buildings and ${objs.filter(o=>!o.secret).length} things to read across the campus.</p>`, 'wave');
const spd=document.getElementById('spd'), spdVal=document.getElementById('spdVal');
function setSpeed(v){ P.speed=parseFloat(v); spdVal.textContent=P.speed.toFixed(1)+'\u00d7'; }
spd.addEventListener('input', e=>setSpeed(e.target.value));
setSpeed(spd.value);
/* keep the keyboard on the game, not the slider */
spd.addEventListener('keydown', e=>e.preventDefault());
spd.addEventListener('change', ()=>spd.blur());

document.getElementById('btnStart').onclick = ()=>{
  AudioManager.unlock();
  document.getElementById('intro').style.display='none';
  toast('Walk through a doorway to go inside'); AudioManager.play('success',{frequency:880}); AudioManager.startBgm();
  track('start-playing');
};

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
let stickId = null, sc = {x:0, y:0}, homeStick = true;

function isUiTarget(t){
  return !!(t && t.closest && t.closest('button, a, input, textarea, select, #modal, #classic'));
}
function placeStick(x, y){
  stick.style.left = (x - 62) + 'px';
  stick.style.top  = (y - 62) + 'px';
  stick.style.bottom = 'auto';
  stick.classList.add('live');
  homeStick = false;
}
function restStick(){
  stick.style.left = '26px';
  stick.style.top = 'auto';
  stick.style.bottom = '26px';
  stick.classList.remove('live');
  nub.style.transform = '';
  homeStick = true;
}
function applyStick(t){
  let dx = t.clientX - sc.x, dy = t.clientY - sc.y;
  const d = Math.hypot(dx, dy);
  if(d > STICK_MAX){ dx = dx/d*STICK_MAX; dy = dy/d*STICK_MAX; }
  nub.style.transform = `translate(${dx}px,${dy}px)`;
  $S.touchVec = {x: dx/STICK_MAX, y: dy/STICK_MAX};
}

addEventListener('touchstart', e=>{
  if(!matchMedia('(pointer:coarse)').matches) return;
  for(const t of e.changedTouches){
    if(isUiTarget(t.target)) continue;                 // buttons and panels keep their taps
    if(stickId !== null) continue;
    if(t.clientX > innerWidth*0.58) continue;          // right side is for LOOK
    if(t.clientY < 96) continue;                       // keep clear of the HUD
    stickId = t.identifier;
    placeStick(t.clientX, t.clientY);
    sc = {x: t.clientX, y: t.clientY};
    applyStick(t);
  }
}, {passive:true});

addEventListener('touchmove', e=>{
  if(stickId === null) return;
  for(const t of e.changedTouches){
    if(t.identifier !== stickId) continue;
    applyStick(t);
  }
}, {passive:true});

function endStick(e){
  if(stickId === null) return;
  for(const t of e.changedTouches){
    if(t.identifier !== stickId) continue;
    stickId = null;
    $S.touchVec = {x:0, y:0};
    restStick();
  }
}
addEventListener('touchend', endStick, {passive:true});
addEventListener('touchcancel', endStick, {passive:true});

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