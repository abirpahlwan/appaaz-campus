// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */
import { $S, $R } from '../core/state';
import { BUILDINGS, TILE } from './config';



/* ---------- what he says ---------- */
const IDLE_LINES = [
  "Welcome to the campus. Every door opens onto something we build.",
  "Every dome here is part of the work.",
  "Careful near the water \u2014 the ducks have right of way.",
  "Roofs come off when you walk in. Go on.",
  "We build web, mobile and AI \u2014 and the habitats they run in.",
  "Somewhere out here there's a cow that flies.",
  "The cows are load-bearing. Don't ask.",
  "Ship it, then make it survive contact with real users.",
  "If it isn't usable in the first sixty seconds, it isn't usable.",
  "Sunlight in, software out.",
  "The project gallery is the big hall on the top row.",
  "Teams in Bangladesh and Germany, one project.",
  "There\u2019s a notice board by the pond \u2014 look for the sponsor slot.",
  "Sector 04: Green Heaven. Mind the ducks.",
  "The terminal in the south-east is where projects begin."
];
$S.bubble = null;                 // {text, until, lines}
let lastIdle = 0, idleGap = 460, saidIdx = -1;
let doorSpoken = null;

export function say(text, ms){
  const dur = ms || 210;
  $S.bubble = { text: text, born: $S.T, until: $S.T + dur, lines: null };
  const speechEl = document.getElementById('speech');
  if(speechEl){ speechEl.textContent = text; speechEl.classList.add('on'); }
}
export function maybeChatter(){
  if($S.bubble) return;
  if(!$R.P.moving) return;
  if($S.T - lastIdle < idleGap) return;
  lastIdle = $S.T;
  idleGap = 520 + Math.random()*640;
  let i;
  do { i = Math.floor(Math.random()*IDLE_LINES.length); } while(i === saidIdx && IDLE_LINES.length > 1);
  saidIdx = i;
  say(IDLE_LINES[i], 230);
}
/* standing outside a door: say what that building is about, once per approach */
export function doorChatter(){
  if($S.insideB){ doorSpoken = null; return; }
  let closest = null, cd = 1e9;
  for(const b of BUILDINGS){
    const dx = $R.P.x - (b.door*TILE + TILE/2);
    const dy = $R.P.y - ((b.y + b.h)*TILE + 6);
    const d = Math.hypot(dx, dy);
    if(d < 40 && d < cd){ cd = d; closest = b; }
  }
  if(!closest){ if(cd > 90) doorSpoken = null; return; }
  if(doorSpoken === closest.id) return;
  doorSpoken = closest.id;
  if(closest.line) say(closest.line, 260);
}