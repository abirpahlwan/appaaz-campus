// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */
import { $R } from '../core/state';
import { track } from '../core/analytics';
import { CONTENT } from '../content/content';
import { closeModal, toast } from './modal';
import { AudioManager } from '../core/audio';



const CONTACT_EMAIL = 'hello@appaaz.com';
function sendMail(e){
  if(e) e.preventDefault();
  const s = document.getElementById('cSubject');
  const b = document.getElementById('cBody');
  const subject = s && s.value ? s.value.trim() : '';
  const body = b && b.value ? b.value.trim() : '';
  const url = 'mailto:' + CONTACT_EMAIL
    + '?subject=' + encodeURIComponent(subject)
    + '&body=' + encodeURIComponent(body);
  try{ track('contact:mailto'); }catch(err){}
  window.location.href = url;
}
function copyEmail(btn){
  const done = ()=>{
    if(btn){
      const t = btn.textContent;
      btn.textContent = 'Copied ✓';
      setTimeout(()=>{ btn.textContent = t; }, 1600);
    } else toast('Copied ' + CONTACT_EMAIL);
  };
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(CONTACT_EMAIL).then(done, ()=>fallbackCopy(done));
    } else fallbackCopy(done);
  }catch(err){ fallbackCopy(done); }
}
function fallbackCopy(done){
  try{
    const ta = document.createElement('textarea');
    ta.value = CONTACT_EMAIL;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    done();
  }catch(err){ window.prompt('Copy this address:', CONTACT_EMAIL); }
}

export function buildClassic(){
  document.getElementById('cName').textContent=CONTENT.name;
  document.getElementById('cRole').textContent=CONTENT.role;
  document.getElementById('cBlurb').textContent=CONTENT.blurb;
  const host=document.getElementById('cSections'); host.innerHTML='';
  CONTENT.objects.filter(o=>!o.secret).forEach(o=>{
    const s=document.createElement('section'); s.className='sec';
    s.innerHTML=`<h2>${o.title}</h2><div class="card-body">${o.html}</div>`;
    host.appendChild(s);
  });
}
export function toggleClassic(force){
  const c=document.getElementById('classic');
  const on = force!==undefined ? force : !c.classList.contains('on');
  c.classList.toggle('on', on);
  document.getElementById('hud').style.display = on ? 'none' : 'block';
  if(on){ AudioManager.stopBgm(); closeModal(); document.getElementById('intro').style.display='none'; c.scrollTop=0;
          track('skip-to-plain-version'); }
  else if(document.getElementById('intro').style.display==='none') AudioManager.startBgm();
}

document.getElementById('whoami').textContent    = CONTENT.name;
document.getElementById('introName').textContent = CONTENT.name;
document.getElementById('introSub').textContent  = CONTENT.tagline;
document.getElementById('btnClassic').onclick    = ()=>toggleClassic(true);
document.getElementById('btnBackGame').onclick   = ()=>toggleClassic(false);
$R.toggleClassic = toggleClassic;
/* the contact panel uses inline onsubmit/onclick handlers, which need globals */
Object.assign(window, { sendMail, copyEmail });
