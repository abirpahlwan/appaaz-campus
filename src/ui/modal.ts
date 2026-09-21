// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */
import { $S, $R } from '../core/state';
import { track } from '../core/analytics';
import { objs } from '../world/objects';
import { say } from '../world/chatter';
import { dismount, mountAnimal, nearAnimal, petAnimal, save, writeSave } from '../entities/critters';
import { startLandmarkSeq } from '../world/landmark';



/* ==================================================================
   4.  UI
   ================================================================== */
export const modal = document.getElementById('modal');

/* which little performance he gives in each panel */
const POSE_BY_ID = {
  about:'wave',
  c1:'controller', c2:'controller', c3:'controller', c4:'controller', c5:'controller',
  m1:'controller', m2:'controller', m3:'controller', m4:'controller',
  systems:'laptop', craft:'wrench', exp:'marker', side:'trophy',
  xr:'vr', ar:'tablet', brand:'tablet', contact:'envelope', cow:'wave',
  railway:'wrench', aircraft:'vr', rocket:'trophy', mountain:'marker', dam:'laptop', garden:'wave',
  play:'controller', blog:'envelope', cb:'tablet', ball:'wave', tea:'wave',
  toys:'wrench', chess:'marker', bat:'wave', rickshaw:'wave'
};

export function openModal(title, tag, html, pose){
  
  document.getElementById('mTitle').textContent=title;
  document.getElementById('mTag').textContent=tag||'';
  document.getElementById('mBody').innerHTML=html;
  modal.classList.add('on'); $R.blip(660);
}
export function closeModal(){
  modal.classList.remove('on');
  $R.AudioManager.play('click');
  if(pendingCongrats) setTimeout(showCongrats, 320);
}
modal.addEventListener('click', e=>{ if(e.target===modal) closeModal(); });

let toastTimer=null;
export function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove('on'), 1900);
}

function interactMountainFeature(f){
  if(f.feature==='sign'){
    toast(f.id.includes('upper') ? 'Upward to the cloud overlook.' : 'Switchbacks ahead: take the sunny side.');
    say('The trail sign points up, but never rushes the climb.', 190);
    $R.AudioManager.play('environment');
  } else if(f.feature==='bridge'){
    toast('The rope bridge gives a tiny friendly creak.');
    say('Three careful steps and the valley opens up.', 190);
    $R.AudioManager.play('environment',{frequency:520});
  } else if(f.feature==='overlook'){
    toast('A rose-gold balloon drifts beyond the far peaks.');
    say('The whole world looks like a map from here.', 210);
    $R.AudioManager.play('summit',{frequency:820});
  } else if(f.feature==='camp'){
    toast('The climber camp glows warmly.');
    say('Rest is part of the route, too.', 180);
    $R.AudioManager.play('environment',{frequency:580});
  } else if(f.feature==='ptarmigan'){
    toast('Breeze the ptarmigan flutters hello.');
    say('Breeze leaves one snow feather on the trail.', 190);
    $R.AudioManager.play('animal',{frequency:700});
  } else if(f.feature==='marmot'){
    toast('Rocky the marmot peeks from the stones.');
    say('Rocky approves of your excellent boots.', 190);
    $R.AudioManager.play('animal',{frequency:460});
  } else if(f.feature==='telescope'){
    toast('A tiny constellation winks above the river.');
    say('The summit telescope finds the Balloon Bear constellation.', 220);
    $R.AudioManager.play('summit',{frequency:880});
  } else if(f.feature==='bell'){
    toast('The summit bell answers on the wind.');
    say('One clear chime for every brave step uphill.', 190);
    $R.AudioManager.play('summit',{frequency:640});
  } else {
    toast('Pipkin the snow hare shares the lookout.');
    say('Pipkin says: the clouds look like soft mountains.', 190);
    $R.AudioManager.play('animal',{frequency:760});
  }
}

export function tryInteract(){
  if($S.landmarkSeq){ $S.landmarkSeq.skipped=true; $R.AudioManager.play('success',{frequency:740}); return; }
  if(modal.classList.contains('on')){ closeModal(); return; }
  if(document.getElementById('intro').style.display!=='none') return;
  if($S.riding){ dismount(); return; }
  const nearA = $S.campusMode ? null : nearAnimal();
  if(nearA){
    if(nearA.rideable && nearA.affinity>=3 && $S.lastPetAnimal===nearA && ($S.T-$S.lastPetTime)<90 && !$S.R3on){
      mountAnimal(nearA); $S.lastPetAnimal=null; return;
    }
    petAnimal(nearA);
    $S.lastPetAnimal=nearA; $S.lastPetTime=$S.T;
    return;
  }
  if(!$S.near) return;
  if($S.near.kind==='mountain-feature'){
    interactMountainFeature($S.near);
    return;
  }
  const isLandmark = $S.near.kind==='landmark';
  if(isLandmark && !$S.near.seen){
    save.landmarkSeen[$S.near.id] = true; writeSave();
    startLandmarkSeq($S.near);
    $R.AudioManager.play(['railway','aircraft','rocket'].includes($S.near.id)?'transport':'landmark');
    track('landmark:'+$S.near.id);
    return;
  }
  const first = !$S.near.seen;
  $S.near.seen=true; updateFound();
  if(first) track('panel:'+$S.near.id);
  $R.AudioManager.play(first && !$S.near.secret ? 'discovery' : $S.near.secret ? 'environment' : 'building');
  openModal($S.near.title, $S.near.tag, $S.near.html, POSE_BY_ID[$S.near.id]);
}
let pendingCongrats = false;
export function updateFound(){
  const total = objs.filter(o=>!o.secret).length;
  const got   = objs.filter(o=>!o.secret && o.seen).length;
  const sTot  = objs.filter(o=>o.secret).length;
  const sGot  = objs.filter(o=>o.secret && o.seen).length;

  const el = document.getElementById('found');
  el.textContent = `Discovered ${got} / ${total}` + (got===total ? '  \u2713' : '');
  if(got===total) el.style.color = 'var(--good)';

  const sl = document.getElementById('secretsLine');
  if(sGot > 0){
    sl.style.display = 'block';
    sl.textContent = `Secrets ${sGot} / ${sTot}` + (sGot===sTot ? '  \u2713' : '');
  }

  if(got===total && !updateFound._done){
    updateFound._done = true;
    track('found-everything');
    pendingCongrats = true;                    // wait until they close the last panel
  }
}

function showCongrats(){
  pendingCongrats = false;
  const sTot = objs.filter(o=>o.secret).length;
  const sGot = objs.filter(o=>o.secret && o.seen).length;
  const mins = Math.max(1, Math.round((Date.now() - $R.startedAt)/60000));
  const secretLine = sTot === 0 ? '' : sGot === sTot
    ? `<p><b>And every hidden thing, too.</b> The cow, the football, the tea, the toys, the
       chess game, the cricket bat and the rickshaw \u2014 all ${sTot} of them.</p>`
    : `<p>You also found <b>${sGot} of ${sTot}</b> hidden things scattered around the village.
       ${sGot === 0 ? 'There are seven of them, and they are the ones that say something about me rather than about the work.'
                    : 'The rest are still out there.'}</p>`;
  
  openModal('You found everything', 'the whole campus',
    `<p style="font-size:30px;margin:0 0 12px">&#127881;</p>
     <p>That's all ${objs.filter(o=>!o.secret).length} of them \u2014 every building, every cabinet,
     every panel \u2014 in about ${mins} minute${mins>1?'s':''}. Thank you for actually playing it.</p>
     ${secretLine}
     <p>Everything you just walked through is also here as a plain page, if you want to reread it,
     copy something out of it, or send it to someone who would rather not use a joystick.</p>
     <p style="margin-top:18px">
       <button class="cbtn" onclick="goPlain()">Read the plain version &rarr;</button>
       <button class="cbtn ghost" onclick="closeModal()">Keep wandering</button>
     </p>`, 'trophy');
  $R.blip(880); setTimeout(()=>$R.blip(1180), 130); setTimeout(()=>$R.blip(1480), 260);
  $S.confettiUntil = $S.T + 240;
}
function goPlain(){ closeModal(); $R.toggleClassic(true); track('congrats:to-plain'); }
$R.POSE_BY_ID = POSE_BY_ID;
$R.closeModal = closeModal;
/* the congrats panel uses inline onclick handlers, which need globals */
Object.assign(window, { closeModal, goPlain });
$R.openModal = openModal;
$R.toast = toast;
$R.tryInteract = tryInteract;
$R.updateFound = updateFound;
