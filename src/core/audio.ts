// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */
import { $S, $R } from './state';
import { reducedMotion } from '../world/landmark';


const startedAt = Date.now();

/* ---------- self-contained audio ---------- */
const AUDIO_PREF_KEY = 'appaaz-park-audio-v1';
export const AudioManager = (() => {
  let ctx = null, master = null, bgmGain = null, bgmTimer = 0, bgmStep = 0;
  let muted = false, volume = 0.55, hidden = document.hidden, biome = 'village';
  const active = new Set();
  const motifs = {
    village:[261.63,329.63,392,329.63,293.66,349.23,440,349.23],
    mountain:[196,246.94,293.66,392,329.63,246.94,220,293.66],
    water:[220,277.18,329.63,415.3,329.63,277.18,246.94,277.18],
    desert:[185,233.08,277.18,311.13,277.18,233.08,207.65,233.08]
  };
  const presets = {
    ui:{freq:660,type:'square',duration:.08,gain:.035},
    building:{freq:392,type:'triangle',duration:.16,gain:.05},
    landmark:{freq:246.94,type:'sine',duration:.28,gain:.055},
    animal:{freq:520,type:'sine',duration:.14,gain:.045,second:780},
    summit:{freq:880,type:'sine',duration:.34,gain:.05,second:1174.66},
    transport:{freq:185,type:'sawtooth',duration:.28,gain:.04,second:370},
    environment:{freq:310,type:'triangle',duration:.2,gain:.04,second:465},
    success:{freq:880,type:'sine',duration:.22,gain:.06,second:1320},
    failure:{freq:180,type:'square',duration:.16,gain:.04,second:130}
  };
  function readPrefs(){
    try{
      const p=JSON.parse(localStorage.getItem(AUDIO_PREF_KEY)||'null');
      if(p && typeof p==='object'){
        muted=p.muted===true;
        if(Number.isFinite(p.volume)) volume=Math.max(0,Math.min(1,p.volume));
      }
    }catch(e){}
  }
  function writePrefs(){ try{ localStorage.setItem(AUDIO_PREF_KEY,JSON.stringify({muted,volume})); }catch(e){} }
  function ensure(){
    if(ctx) return ctx;
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx) return null;
    try{
      ctx=new Ctx();
      master=ctx.createGain(); master.gain.value=muted?0:volume; master.connect(ctx.destination);
      bgmGain=ctx.createGain(); bgmGain.gain.value=0.16; bgmGain.connect(master);
      return ctx;
    }catch(e){ ctx=null; return null; }
  }
  function unlock(){
    const c=ensure();
    if(c && c.state==='suspended') c.resume().catch(()=>{});
    return !!c;
  }
  function setMuted(next){
    muted=!!next;
    if(muted) stopBgm();
    if(master) master.gain.setTargetAtTime(muted?0:volume,ctx.currentTime,.02);
    writePrefs();
    if(!muted && document.getElementById('intro').style.display==='none') startBgm();
  }
  function setVolume(next){ volume=Math.max(0,Math.min(1,Number(next)||0)); if(master&&!muted) master.gain.setTargetAtTime(volume,ctx.currentTime,.02); writePrefs(); }
  function add(node){ active.add(node); node.addEventListener('ended',()=>active.delete(node),{once:true}); }
  function tone(freq,type,duration,gain,when,output){
    if(!ctx || muted || hidden) return;
    const now=Math.max(ctx.currentTime,when||ctx.currentTime), o=ctx.createOscillator(), g=ctx.createGain();
    o.type=type; o.frequency.setValueAtTime(freq,now);
    g.gain.setValueAtTime(Math.max(.0001,gain),now);
    g.gain.exponentialRampToValueAtTime(.0001,now+duration);
    o.connect(g); g.connect(output||master); add(o); o.start(now); o.stop(now+duration+.02);
  }
  function play(name, options){
    const p=presets[name]||presets.ui, c=unlock();
    if(!c || muted || hidden) return;
    const o=options||{}, when=ctx.currentTime+.005;
    tone(o.frequency||p.freq,p.type||p.type,p.duration||p.duration,(o.gain||p.gain),when);
    if(o.second||p.second) tone(o.second||p.second,p.type||p.type,(o.duration||p.duration)*.8,(o.gain||p.gain)*.7,when+.025);
  }
  function scheduleBgm(){
    if(!ctx || muted || hidden || document.getElementById('intro').style.display!=='none') return;
    const notes=motifs[biome]||motifs.village, f=notes[bgmStep++%notes.length];
    tone(f,'sine',.42,.018,ctx.currentTime+.02,bgmGain);
    tone(f*2,'triangle',.18,.006,ctx.currentTime+.05,bgmGain);
    bgmTimer=window.setTimeout(scheduleBgm, reducedMotion?1100:760);
  }
  function startBgm(){
    if(!unlock() || bgmTimer || hidden) return;
    scheduleBgm();
  }
  function stopBgm(){ if(bgmTimer){ clearTimeout(bgmTimer); bgmTimer=0; } }
  function setBiome(next){ biome=motifs[next]?next:'village'; }
  function pause(){ hidden=true; stopBgm(); if(ctx&&ctx.state==='running') ctx.suspend().catch(()=>{}); }
  function resume(){ hidden=false; if(ctx&&ctx.state==='suspended') ctx.resume().catch(()=>{}); if(document.getElementById('intro').style.display==='none') startBgm(); }
  function dispose(){
    stopBgm(); active.forEach(n=>{try{n.stop();}catch(e){}}); active.clear();
    if(ctx){ ctx.close().catch(()=>{}); ctx=null; master=null; bgmGain=null; }
  }
  readPrefs();
  return {unlock,play,startBgm,stopBgm,setBiome,setMuted,setVolume,isMuted:()=>muted,getVolume:()=>volume,pause,resume,dispose};
})();
$S.soundOn = !AudioManager.isMuted();
function blip(freq){ AudioManager.play('ui',{frequency:freq}); }
$R.AudioManager = AudioManager;
$R.blip = blip;
$R.startedAt = startedAt;
