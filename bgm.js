'use strict';
// Background music: tracks live in assets/bgm/<name>.mp3 (prompts in docs/BGM-생성지침.md).
// Scenes pick a track from their background; alarms, drills and forecasts switch to their own
// themes; a script can override with "@bgm name" until the next background change.
const BGM=(()=>{
 const KEY='orpheia-bgm-v1';
 const TRACKS=['bgm_title','bgm_daily','bgm_night_shift','bgm_outing','bgm_orpheia','bgm_heavy','bgm_hanbit','bgm_festival','bgm_winter','bgm_emergency','bgm_forecast','bgm_exam','bgm_result','song_block','song_ending'];
 const SCENE={
  bg_control_room_night:'bgm_daily',bg_center_lobby:'bgm_daily',bg_cafeteria:'bgm_daily',bg_dev_lab:'bgm_daily',
  bg_break_room:'bgm_night_shift',bg_hanbit_dorm:'bgm_night_shift',bg_study_room:'bgm_night_shift',
  bg_riverside_day:'bgm_outing',bg_cherry_street:'bgm_outing',bg_depot_day:'bgm_outing',bg_train_window:'bgm_outing',bg_bungeoppang_stall:'bgm_outing',bg_gukbap:'bgm_outing',bg_fire_training:'bgm_outing',bg_bridge_night:'bgm_outing',
  bg_rooftop_night:'bgm_orpheia',bg_hanbit_rooftop:'bgm_orpheia',
  bg_hanbit_center:'bgm_hanbit',bg_summer_festival:'bgm_festival',bg_snow_street:'bgm_winter',bg_year_end_party:'bgm_winter',
  bg_exam_hall:'bgm_exam',bg_spring_cherry:'song_ending',
 };
 let set={volume:.5,muted:false};
 try{Object.assign(set,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch{}
 const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(set));}catch{}};
 const ready=new Set(),src=n=>asset(`bgm/${n}.mp3`);
 const probed=Promise.all(TRACKS.map(n=>(location.protocol==='file:'?Promise.resolve(true):fetch(src(n),{method:'HEAD'}).then(r=>r.ok,()=>false)).then(ok=>{if(ok)ready.add(n);})));
 const decks=[new Audio(),new Audio()];decks.forEach(a=>{a.loop=true;a.preload='none';a.volume=0;});
 let front=0,cur='',wanted='',unlocked=false;
 function fade(a,to,ms,done){const from=a.volume,t0=performance.now();const step=t=>{const k=Math.min(1,(t-t0)/ms);a.volume=Math.max(0,Math.min(1,from+(to-from)*k));if(k<1)requestAnimationFrame(step);else done?.();};requestAnimationFrame(step);}
 const level=()=>set.muted?0:set.volume;
 function play(name){
  wanted=name||'';
  if(!unlocked||wanted===cur)return;
  const old=decks[front];cur=wanted;
  fade(old,0,700,()=>old.pause());
  if(!cur||!ready.has(cur))return;
  front^=1;const a=decks[front];a.src=src(cur);a.currentTime=0;a.volume=0;
  a.play().then(()=>fade(a,level(),900)).catch(e=>{console.warn('bgm',cur,e.name);if(cur===name)cur='';});
 }
 const scene=bg=>play(SCENE[String(bg||'').replace(/\.png$/,'')]||'bgm_daily');
 // Browsers only allow audio after a user gesture.
 const unlock=()=>{if(unlocked)return;unlocked=true;probed.then(()=>{const w=wanted;cur='';play(w);});};
 for(const ev of ['pointerdown','keydown'])document.addEventListener(ev,unlock,{once:true,capture:true});
 probed.then(()=>{if(unlocked){const w=wanted;cur='';play(w);}});
 function setVolume(v){set.volume=v;persist();decks[front].volume=level();}
 function setMuted(m){set.muted=m;persist();decks[front].volume=level();}
 return {current:()=>cur,play,scene,setVolume,setMuted,settings:()=>({...set}),tracks:TRACKS,ready};
})();
