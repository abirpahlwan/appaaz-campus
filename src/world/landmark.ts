// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */
import { $S, $R } from '../core/state';



/* ---------- landmark sequences ---------- */
export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
$S.landmarkSeq = null;
export function startLandmarkSeq(obj){
  if($S.landmarkSeq) return;
  $S.landmarkSeq = { obj, frame:0, total: reducedMotion?30:120, paused:false, skipped:false };
}
export function updateLandmarkSeq(){
  if(!$S.landmarkSeq) return;
  if($S.landmarkSeq.paused) return;
  $S.landmarkSeq.frame++;
  if($S.landmarkSeq.frame >= $S.landmarkSeq.total || $S.landmarkSeq.skipped){
    const o = $S.landmarkSeq.obj;
    $S.landmarkSeq = null;
    o.seen = true; $R.updateFound();
    $R.openModal(o.title, o.tag, o.html, $R.POSE_BY_ID[o.id]||'wave');
  }
}