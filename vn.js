'use strict';
// Visual-novel layer: title, script runner, save/load, backlog, auto/skip, recollection and gallery locks.
// Story chapters live in story/*.js and register themselves with VN.chapter(id, title, subtitle, script).
const VN=(()=>{
const KEY='orpheia-vn-v1',SLOTS=12,LOG_MAX=300;
let meta={saves:{},read:{},seen:[],scenes:[],flags:{},settings:{auto:1600,unlockAll:false}};
try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');if(raw&&typeof raw==='object')meta={...meta,...raw,settings:{...meta.settings,...raw.settings}};}catch{}
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(meta));}catch{toast('이 브라우저에서는 세이브가 제한됩니다.');}};
const seenSet=new Set(meta.seen),sceneSet=new Set(meta.scenes);
function markSeen(file){if(file&&!seenSet.has(file)){seenSet.add(file);meta.seen=[...seenSet];persist();}}
function markScene(id){if(!sceneSet.has(id)){sceneSet.add(id);meta.scenes=[...sceneSet];persist();}}

// ── Cast. Planned art (docs/추가-에셋-생성지침-VN.md) is used once listed in ART_READY; otherwise the fallback.
const CAST={
 orpheia:{name:'오르페이아',cls:'c-orpheia',stand:{neutral:'orpheia_sd_maid_v2.png',smile:'orpheia_sd_praise_v2.png',worry:'orpheia_sd_worried_v2.png',explain:'orpheia_sd_briefing.png',surprised:['orpheia_sd_surprised.png','orpheia_sd_maid_v2.png'],pout:['orpheia_sd_pout.png','orpheia_sd_worried_v2.png'],shy:['orpheia_sd_shy.png','orpheia_sd_praise_v2.png'],excited:'orpheia_sd_praise_v2.png',casual:['orpheia_sd_casual.png','orpheia_sd_maid_v2.png'],yukata:['orpheia_sd_yukata.png','orpheia_sd_maid_v2.png'],santa:['orpheia_sd_santa.png','orpheia_sd_praise_v2.png'],coat:['orpheia_sd_coat.png','orpheia_sd_maid_v2.png'],suit:['orpheia_sd_suit.png','orpheia_sd_briefing.png'],driver:'orpheia_sd_driver_v2.png',stationmaster:'orpheia_sd_stationmaster_v2.png',engineer:'orpheia_sd_engineer_v2.png',evacuation:'orpheia_sd_evacuation_v2.png'},
  face:{casual:'smile',yukata:'smile',santa:'smile',coat:'neutral',suit:'serious',excited:'smile',driver:'serious',stationmaster:'serious',engineer:'serious',evacuation:'serious',neutral:'neutral',smile:'smile',worry:'worry',explain:'serious',surprised:'serious',pout:'worry',shy:'relief',serious:'serious',resolve:'resolve',relief:'relief'}},
 instructor:{name:'서도희 교관',cls:'c-instructor',stand:{neutral:['chr_instructor_neutral.png',''],stern:['chr_instructor_stern.png',''],smile:['chr_instructor_smile.png',''],coffee:['chr_instructor_coffee.png',''],casual:['chr_instructor_casual.png','chr_instructor_neutral.png']}},
 harin:{name:'유하린',cls:'c-harin',stand:{neutral:['chr_harin_neutral.png',''],smile:['chr_harin_smile.png',''],surprised:['chr_harin_surprised.png',''],pout:['chr_harin_pout.png',''],excited:['chr_harin_excited.png',''],casual:['chr_harin_casual.png','chr_harin_neutral.png'],yukata:['chr_harin_yukata.png','chr_harin_neutral.png']}},
 jian:{name:'류지안',cls:'c-jian',stand:{neutral:['chr_jian_neutral.png',''],smile:['chr_jian_smile.png',''],serious:['chr_jian_serious.png','']}},
 sangcheol:{name:'신상철',cls:'c-player',stand:{}},
};
const ALIAS={'오르페이아':'orpheia','서도희':'instructor','서 교관':'instructor','교관':'instructor','서도희 교관':'instructor','하린':'harin','유하린':'harin','상철':'sangcheol','신상철':'sangcheol','류지안':'jian','지안':'jian'};
// Expression changes give the standing a small one-shot motion; @shake/@hop/@tilt <who> force one.
const EXPR_FX={surprised:'shake',excited:'hop',smile:'hop',shy:'hop',pout:'tilt',worry:'sink',stern:'nod'};
// Third-round art (docs/추가-에셋-생성지침-VN.md) is probed with HEAD requests; found files join ART_READY and the gallery.
const VN_PLANNED=VN_ART.map(a=>[a.file,a.title,a.type]);
function probe(file){
 if(window.__ASSET_INLINE)return Promise.resolve(!!window.__ASSET_INLINE[file]);
 if(location.protocol==='file:')return new Promise(ok=>{const i=new Image();i.onload=()=>ok(true);i.onerror=()=>ok(false);i.src=asset(file);});
 return fetch(asset(file),{method:'HEAD'}).then(r=>r.ok,()=>false);
}
const ready=Promise.all(VN_PLANNED.map(([file,title,type])=>probe(file).then(ok=>{if(!ok)return;ART_READY.add(file);if(!CG_ART.some(a=>a.file===file))CG_ART.push({file,title,type});})));
const standFile=(who,expr)=>{const s=CAST[who]?.stand[expr]??CAST[who]?.stand.neutral;if(!s)return '';if(!Array.isArray(s))return s;const f=art(s[0],'');if(f)return f;return s[1]&&s[1].startsWith('chr_')?art(s[1],''):s[1];};
const BG_FALLBACK=Object.fromEntries(VN_ART.filter(a=>a.fallback).map(a=>[a.file.replace(/\.png$/,''),a.fallback]));BG_FALLBACK.title_key_visual='bg_control_room_night.png';
const bgFile=f=>{const k=f.replace(/\.png$/,'');return BG_FALLBACK[k]?art(k+'.png',BG_FALLBACK[k]):f.endsWith('.png')?f:f+'.png';};
const cgFile=f=>{const k=f.replace(/\.png$/,'')+'.png';return ART_READY.has(k)||CG_ART.some(a=>a.file===k)?k:'';};

// ── Script parser. Lines: "@cmd args", "[이름|표정] 대사", "> 선택지 -> label {flag+1}", "// 주석", 그 외는 서술.
const chapters=[],byId={};
function chapter(id,title,subtitle,src){const ops=parse(src,id);const ch={id,title,subtitle,ops,labels:{}};ops.forEach((o,i)=>{if(o.t==='label')ch.labels[o.arg]=i;});chapters.push(ch);byId[id]=ch;}
function parse(src,id){
 const ops=[];let choice=null;
 for(const [n,raw] of src.split('\n').entries()){
  const line=raw.trim();
  if(!line||line.startsWith('//')){choice=null;continue;}
  if(line.startsWith('>')&&choice){const m=line.match(/^>\s*(.+?)\s*->\s*(\S+)(?:\s*\{(.+)\})?$/);if(!m)throw new Error(`${id}:${n+1} 선택지 형식`);choice.opts.push({text:m[1],label:m[2],set:m[3]||''});continue;}
  choice=null;
  if(line.startsWith('@')){
   const [cmd,...rest]=line.slice(1).split(/\s+/),arg=rest.join(' ');
   if(cmd==='choice'){choice={t:'choice',opts:[]};ops.push(choice);}
   else if(cmd==='show'){const [who,expr='neutral',pos='center']=rest;ops.push({t:'show',who:ALIAS[who]||who,expr,pos});}
   else if(cmd==='hide')ops.push({t:'hide',who:ALIAS[rest[0]]||rest[0]||'all'});
   else if(cmd==='chapter'){const [num,...title]=arg.split('|');ops.push({t:'chapter',num:num.trim(),title:title.join('|').trim()});}
   else if(cmd==='if'){const m=arg.match(/^(\w+)\s*(>=|<=|==|>|<)?\s*(-?\d+)?\s*->\s*(\S+)$/);ops.push({t:'if',flag:m[1],op:m[2]||'>=',val:m[3]==null?1:+m[3],label:m[4]});}
   else if(cmd==='set'||cmd==='add'){const [flag,val='1']=rest;ops.push({t:cmd,flag,val:+val});}
   else ops.push({t:cmd,arg});
   continue;
  }
  const m=line.match(/^\[([^\]|]+)(?:\|(\w+))?\]\s*(.*)$/);
  if(m){const who=ALIAS[m[1].trim()]||m[1].trim();ops.push({t:'say',who,expr:m[2]||'',text:m[3]});}
  else ops.push({t:'narr',text:line});
 }
 return ops;
}

// ── State and runner.
let pendingFx={};
let S=null,typing=null,autoTimer=null,auto=false,skip=false,hidden=false,log=[],busy=false;
const fresh=ch=>({ch,pc:0,bg:'',cg:'',chars:{},day:'',line:null,flags:{...meta.flags}});
const curCh=()=>byId[S.ch];
function readKey(){return S.ch;}
function isRead(pc){return (meta.read[readKey()]||[]).includes(pc);}
function markRead(pc){const k=readKey(),a=meta.read[k]||(meta.read[k]=[]);if(!a.includes(pc)){a.push(pc);if(a.length%10===0)persist();}}
function evalSet(spec){for(const part of spec.split(/[,\s]+/).filter(Boolean)){const m=part.match(/^(\w+)([+-]=?|=)(-?\d+)$/);if(!m)continue;const [,f,op,v]=m;S.flags[f]=op==='='?+v:(S.flags[f]||0)+(op.startsWith('-')?-v:+v);}}
function step(){
 stopAuto();
 while(S&&!busy){
  const ch=curCh(),op=ch.ops[S.pc];
  if(!op){return finishChapter();}
  switch(op.t){
   case 'label':S.pc++;break;
   case 'jump':S.pc=ch.labels[op.arg]??S.pc+1;break;
   case 'if':{const v=S.flags[op.flag]||0,ok={'>=':v>=op.val,'<=':v<=op.val,'==':v===op.val,'>':v>op.val,'<':v<op.val}[op.op];S.pc=ok?ch.labels[op.label]:S.pc+1;break;}
   case 'set':S.flags[op.flag]=op.val;S.pc++;break;
   case 'add':S.flags[op.flag]=(S.flags[op.flag]||0)+op.val;S.pc++;break;
   case 'bg':S.bg=bgFile(op.arg);S.cg='';markSeen(S.bg);S.pc++;paint();break;
   case 'cg':{const f=op.arg==='off'?'':cgFile(op.arg);S.cg=f;if(f)markSeen(f);S.pc++;paint();break;}
   case 'show':{const was=S.chars[op.who];S.chars[op.who]={expr:op.expr,pos:op.pos};if(!was)pendingFx[op.who]='enter';else if(was.expr!==op.expr&&EXPR_FX[op.expr])pendingFx[op.who]=EXPR_FX[op.expr];S.pc++;paint();break;}
   case 'phone':S.phone=op.arg!=='off';if(S.phone&&S.chars.orpheia)pendingFx.orpheia='enter';S.pc++;paint();break;
   case 'hop':case 'tilt':case 'nod':case 'sink':if(op.arg)pendingFx[ALIAS[op.arg]||op.arg]=op.t;S.pc++;paint();break;
   case 'hide':if(op.who==='all')S.chars={};else delete S.chars[op.who];S.pc++;paint();break;
   case 'day':S.day=op.arg;return card('day',op.arg);
   case 'chapter':return card('chapter',op.num,op.title);
   case 'alarm':return alarm(op.arg);
   case 'flash':fx('flash');S.pc++;break;
   case 'shake':if(op.arg)pendingFx[ALIAS[op.arg]||op.arg]='shake';else fx('shake');S.pc++;paint();break;
   case 'wait':busy=true;setTimeout(()=>{busy=false;S.pc++;step();},+op.arg||600);return;
   case 'choice':return choose(op);
   case 'credits':return credits();
   case 'clear':meta.cleared=true;persist();S.pc++;break;
   case 'drill':return drill(op.arg);
   case 'end':return finishChapter(op.arg);
   case 'say':case 'narr':
    if(op.t==='say'&&op.expr&&S.chars[op.who]){if(S.chars[op.who].expr!==op.expr&&EXPR_FX[op.expr])pendingFx[op.who]=EXPR_FX[op.expr];S.chars[op.who].expr=op.expr;}
    S.line={who:op.who||'',text:op.text,expr:op.expr||S.chars[op.who]?.expr||'neutral'};
    log.push({who:nameOf(S.line.who),text:op.text});if(log.length>LOG_MAX)log.shift();
    if(skip&&!isRead(S.pc)&&!meta.settings.skipUnread)skip=false;
    markRead(S.pc);paint();return type();
   default:S.pc++;
  }
 }
}
function nameOf(who){return CAST[who]?.name??who;}
function advance(){
 if(!S||busy||$('#vn')?.classList.contains('menu-open'))return;
 if(hidden){setHidden(false);return;}
 if(typing){finishType();return;}
 if(S.line){S.line=null;S.pc++;step();}
}

// ── Typewriter (shares the drill's text speed setting).
function type(){
 const node=$('#vnText');if(!node)return;
 const text=S.line.text,speed=skip?0:records.textSpeed;
 clearTimeout(typing?.t);
 if(!speed){node.textContent=text;typing=null;return afterLine();}
 let i=0;typing={t:null};
 const tick=()=>{i++;node.textContent=text.slice(0,i);if(i>=text.length){typing=null;afterLine();return;}const c=text[i-1];typing.t=setTimeout(tick,speed+(/[.!?。…]/.test(c)?160:/[,，]/.test(c)?70:0));};
 tick();
}
function finishType(){clearTimeout(typing?.t);typing=null;const n=$('#vnText');if(n&&S.line)n.textContent=S.line.text;afterLine();}
function afterLine(){$('#vnCaret')?.classList.add('ready');if(skip)autoTimer=setTimeout(advance,40);else if(auto)autoTimer=setTimeout(advance,meta.settings.auto+S.line.text.length*25);}
function stopAuto(){clearTimeout(autoTimer);}

// ── Rendering.
function shell(){
 document.body.classList.add('vn-mode');
 $('#main').innerHTML=`<section class="vn" id="vn" aria-label="비주얼 노벨"><div class="vn-layer vn-bg"><img id="vnBg" alt=""></div><div class="vn-layer vn-chars" id="vnChars"></div><div class="vn-phone" id="vnPhone" hidden><div class="vn-phone-notch"></div><div class="vn-phone-screen"></div></div><div class="vn-layer vn-cg"><img id="vnCg" alt=""></div><div class="vn-layer vn-fx" id="vnFx"></div><div class="vn-day" id="vnDay"></div><div class="vn-card" id="vnCard" hidden></div><div class="vn-choices" id="vnChoices" hidden></div>
 <div class="vn-box" id="vnBox"><div class="vn-name" id="vnName"><span class="vn-face" id="vnFace"><img alt=""></span><b id="vnWho"></b></div><p class="vn-text" id="vnText" aria-live="polite"></p><span class="vn-caret" id="vnCaret">▼</span></div>
 <nav class="vn-menu" aria-label="메뉴">${[['log','로그'],['auto','오토'],['skip','스킵'],['qsave','Q.세이브'],['qload','Q.로드'],['save','세이브'],['load','로드'],['config','설정'],['hide','숨기기'],['title','타이틀']].map(([k,v])=>`<button data-vn="${k}">${v}</button>`).join('')}</nav></section>`;
 const vn=$('#vn');
 vn.addEventListener('click',e=>{if(e.target.closest('.vn-menu,.vn-choices,.vn-card button'))return;advance();});
 vn.addEventListener('contextmenu',e=>{e.preventDefault();setHidden(!hidden);});
 vn.addEventListener('wheel',e=>{if(e.deltaY<0)openLog();},{passive:true});
 vn.querySelectorAll('[data-vn]').forEach(b=>b.onclick=e=>{e.stopPropagation();menu(b.dataset.vn);});
}
function paint(){
 if(!$('#vn'))shell();
 const bg=$('#vnBg');if(bg&&S.bg&&bg.dataset.f!==S.bg){bg.dataset.f=S.bg;bg.src=asset(S.bg);}
 const cg=$('#vnCg');if(cg){cg.parentElement.classList.toggle('on',!!S.cg);if(S.cg&&cg.dataset.f!==S.cg){cg.dataset.f=S.cg;cg.src=asset(S.cg);}}
 paintChars();
 const day=$('#vnDay');if(day)day.textContent=S.day;
 const l=S.line,box=$('#vnBox');if(!box)return;
 box.className='vn-box'+(l?.who?' '+(CAST[l.who]?.cls||'c-other'):' is-narr');
 $('#vnWho').textContent=l?.who?nameOf(l.who):'';$('#vnName').hidden=!l?.who;
 const faceKey=l?.who==='orpheia'?(CAST.orpheia.face[l.expr]||'neutral'):'';const face=$('#vnFace');face.hidden=!faceKey;if(faceKey)face.querySelector('img').src=asset(ART_READY.has(`orpheia_face_${faceKey}.png`)?`ui/face_${faceKey}.png`:'orpheia_sd_maid_v2.png');
 $('#vnText').textContent='';$('#vnCaret').classList.remove('ready');
 $('#vn').querySelector('[data-vn="auto"]').classList.toggle('on',auto);$('#vn').querySelector('[data-vn="skip"]').classList.toggle('on',skip);
}
// Standings are kept as persistent nodes so idle motion keeps running and only real changes animate.
function paintChars(){
 const wrap=$('#vnChars'),phone=$('#vnPhone');if(!wrap)return;
 const inPhone=who=>S.phone&&who==='orpheia';
 phone.hidden=!(S.phone&&S.chars.orpheia);
 const keep=new Set();
 for(const [who,c] of Object.entries(S.chars)){
  const file=standFile(who,c.expr);if(!file)continue;keep.add(who);markSeen(file);
  const host=inPhone(who)?phone.querySelector('.vn-phone-screen'):wrap;
  let el=document.getElementById('chr-'+who);
  if(!el||el.parentElement!==host){el?.remove();el=document.createElement('div');el.id='chr-'+who;el.innerHTML='<div class="vn-chr-fx"><img alt=""></div>';host.appendChild(el);}
  el.className=`vn-chr pos-${c.pos}${S.line?.who===who||!S.line?.who?' speaking':''}`;
  const img=el.querySelector('img');if(img.dataset.f!==file){img.dataset.f=file;img.src=asset(file);img.alt=nameOf(who);}
  const fxName=pendingFx[who];if(fxName){const f=el.firstChild;f.className='vn-chr-fx';void f.offsetWidth;f.classList.add('fx-'+fxName);}
 }
 pendingFx={};
 for(const el of [...wrap.children,...(phone?.querySelector('.vn-phone-screen').children||[])])if(!keep.has(el.id.slice(4)))el.remove();
}
function setHidden(v){hidden=v;$('#vn')?.classList.toggle('ui-hidden',v);}
function fx(kind){const vn=$('#vn');if(!vn)return;vn.classList.remove(kind);void vn.offsetWidth;vn.classList.add(kind);setTimeout(()=>vn.classList.remove(kind),700);}
function card(kind,a,b){
 paint();busy=true;S.line=null;const c=$('#vnCard');$('#vnBox').classList.add('quiet');
 c.className='vn-card '+kind;c.hidden=false;c.style.backgroundImage=kind==='chapter'&&ART_READY.has('ui_chapter_card.png')?`linear-gradient(#03090f88,#03090fcc),url(${asset('ui_chapter_card.png')})`:'';c.innerHTML=kind==='chapter'?`<small>${esc(a)}</small><h2>${esc(b)}</h2>`:`<p>${esc(a)}</p>`;
 const done=()=>{if(c.hidden)return;c.hidden=true;$('#vnBox')?.classList.remove('quiet');busy=false;S.pc++;step();};
 c.onclick=e=>{e.stopPropagation();done();};setTimeout(done,skip?150:kind==='chapter'?2600:1700);
}
function alarm(text){
 S.line=null;paint();busy=true;S.flags.alarms=(S.flags.alarms||0)+1;
 const f=$('#vnFx'),again=S.flags.alarms>=2;f.innerHTML=`<div class="vn-alarm"><b>비상</b><span>${esc(text||'EMERGENCY CALL')}</span>${again?(ART_READY.has('ui_ttott_stamp.png')?`<img class="vn-stamp" src="${asset('ui_ttott_stamp.png')}" alt="또?!">`:'<i class="vn-stamp">또?!</i>'):''}</div>`;$('#vn').classList.add('alarming');fx('shake');
 setTimeout(()=>{f.innerHTML='';$('#vn')?.classList.remove('alarming');busy=false;S.pc++;step();},skip?200:1500);
}
function credits(){
 S.line=null;paint();busy=true;const c=$('#vnCard');$('#vnBox').classList.add('quiet');c.className='vn-card credits';c.hidden=false;
 const roll=[['ORPHEIA','電脳侍女의 비상관제 일지'],['출연','오르페이아 · 신상철 · 서도희 · 유하린 · 류지안'],['그리고','하늘선과 한빛선의 모든 기관사·역장·현장 담당자'],['원작 교재','철도 비상시 조치 실무 · 교재 74개 사고 432개 교신'],['시나리오·연출','Claude'],['일러스트','이미지 생성 AI와 주인님'],['기획','주인님'],['THANK YOU FOR PLAYING','들은 건 복창하고, 한 일은 기록한다.']];
 c.innerHTML=`<div class="credit-roll">${roll.map(([a,b])=>`<small>${esc(a)}</small><p>${esc(b)}</p>`).join('')}</div>`;
 const done=()=>{if(c.hidden)return;c.hidden=true;$('#vnBox').classList.remove('quiet');busy=false;S.pc++;step();};
 c.onclick=e=>{e.stopPropagation();done();};setTimeout(done,skip?300:16000);
}
function choose(op){
 S.line=null;paint();stopAuto();skip=false;const box=$('#vnChoices');box.hidden=false;$('#vnBox').classList.add('quiet');
 box.innerHTML=op.opts.map((o,i)=>`<button data-i="${i}"><span>${i+1}</span>${esc(o.text)}</button>`).join('');
 const pick=i=>{const o=op.opts[i];if(!o)return;box.hidden=true;box.innerHTML='';$('#vnBox').classList.remove('quiet');log.push({who:'▶ 선택',text:o.text});if(o.set)evalSet(o.set);S.pc=curCh().labels[o.label]??S.pc+1;step();};
 box.querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();pick(+b.dataset.i);});
 box.dataset.active='1';VN._pick=pick;
}

// ── Drills: the existing dispatch training runs inside the story.
function drill(id){
 const sc=BY_ID[id];if(!sc){S.pc++;return step();}
 autosave('교신 시작 직전');busy=true;stopAuto();skip=false;auto=false;
 document.body.classList.add('in-drill');
 initRun(sc,sc.steps.map((step,idx)=>({src:sc,idx,step})),'story',false);
}
function afterDrill(R){
 const score=cleanCount(R),sc=R.sc;markScene(sc.id);markSeen('cg_training_clear.png');
 document.body.classList.remove('in-drill');run=null;cancelStory();stopMedia();
 shell();paint();busy=true;
 const c=$('#vnCard');$('#vnBox').classList.add('quiet');c.className='vn-card drill-done';c.hidden=false;
 c.innerHTML=`<small>교신 종료 · ${esc(sc.id)}</small><h2>${esc(sc.title)}</h2><p>첫 시도 정답 ${score} / ${R.steps.length}${R.rewinds?` · 예측 되감기 ${R.rewinds}회`:''}${R.hinted&&Object.keys(R.hinted).length?` · 힌트 ${Object.keys(R.hinted).length}회`:''}</p><p class="unlock">회상 「사건 기록부」에 추가되었습니다.</p><button class="primary">이야기로 돌아가기 ▶</button>`;
 c.querySelector('button').onclick=e=>{e.stopPropagation();c.hidden=true;$('#vnBox').classList.remove('quiet');busy=false;S.pc++;step();};
}

function finishChapter(next){
 const i=chapters.indexOf(curCh()),nx=next?byId[next]:chapters[i+1];persist();
 if(nx){S={...fresh(nx.id),flags:S.flags,day:S.day,phone:S.phone};autosave('장 시작');paint();return step();}
 busy=true;S.line=null;paint();const c=$('#vnCard');c.className='vn-card chapter';c.hidden=false;$('#vnBox').classList.add('quiet');
 c.innerHTML=`<small>TO BE CONTINUED</small><h2>다음 이야기는 준비 중이에요</h2><p>주인님, 여기까지 함께해 주셔서 고마워요. 회상에서 겪은 사건을 다시 연습할 수 있어요.</p><button class="primary">타이틀로</button>`;
 c.querySelector('button').onclick=e=>{e.stopPropagation();busy=false;title();};
}

// ── Save / load.
function snapshot(label){return {state:JSON.parse(JSON.stringify(S)),log:log.slice(-60),time:Date.now(),label:label||'',chapter:`${curCh().title} · ${curCh().subtitle}`,preview:S.line?.text||label||'',bg:S.bg};}
function autosave(label){if(!S)return;meta.saves.auto=snapshot(label);persist();}
function saveTo(slot){if(!S||!S.line&&slot!=='auto'){toast('대사가 표시된 상태에서 저장할 수 있어요.');return false;}meta.saves[slot]=snapshot();persist();toast(slot==='quick'?'퀵 세이브 완료':'저장했습니다.');return true;}
function loadFrom(slot){const s=meta.saves[slot];if(!s||!byId[s.state.ch]){toast('불러올 데이터가 없습니다.');return;}
 if(run){cancelStory();stopMedia();run=null;}document.body.classList.remove('in-drill');
 S=JSON.parse(JSON.stringify(s.state));log=s.log||[];busy=false;skip=false;auto=false;setHidden(false);closeDialogs();shell();
 const line=S.line;S.line=null;paint();if(line){S.line=line;paint();type();}else step();}
function latest(){return Object.entries(meta.saves).sort((a,b)=>b[1].time-a[1].time)[0]?.[0];}
const fmt=t=>new Date(t).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
function slotsDialog(mode){
 const d=$('#vnSlots');d.dataset.mode=mode;
 const keys=[...(mode==='load'?['auto','quick']:[]),...Array.from({length:SLOTS},(_,i)=>'s'+(i+1))];
 d.innerHTML=`<div class="dialog-header"><div><small>${mode==='save'?'SAVE':'LOAD'}</small><h2>${mode==='save'?'어디에 기록할까요?':'어느 기록을 불러올까요?'}</h2></div><button class="quiet" data-close>닫기 ×</button></div><div class="vn-slot-grid">${keys.map(k=>{const s=meta.saves[k],name=k==='auto'?'오토':k==='quick'?'퀵':'No.'+k.slice(1);return `<button class="vn-slot" data-slot="${k}" ${!s&&mode==='load'?'disabled':''}>${s?`<img src="${asset('thumbs/'+(s.bg||'bg_control_room_night.png').replace(/\.png$/,'.jpg'))}" onerror="this.onerror=null;this.src=asset('${s.bg||'bg_control_room_night.png'}')" alt="">`:'<span class="vn-slot-empty">EMPTY</span>'}<span class="vn-slot-info"><b>${name}</b>${s?`<small>${esc(s.chapter)}</small><small>${esc(s.state.day||'')} · ${fmt(s.time)}</small><em>${esc((s.preview||'').slice(0,46))}</em>`:''}</span></button>`;}).join('')}</div>`;
 d.querySelector('[data-close]').onclick=()=>d.close();
 d.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{const k=b.dataset.slot;if(mode==='save'){if(meta.saves[k]&&!confirm('이 기록 위에 덮어쓸까요?'))return;if(saveTo(k))slotsDialog('save');}else loadFrom(k);});
 if(!d.open)d.showModal();
}
function openLog(){if(!S)return;const d=$('#vnLog');d.innerHTML=`<div class="dialog-header"><div><small>BACKLOG</small><h2>지난 대사</h2></div><button class="quiet" data-close>닫기 ×</button></div><div class="vn-log">${log.map(l=>`<p>${l.who?`<b>${esc(l.who)}</b>`:''}${esc(l.text)}</p>`).join('')||'<p>아직 기록이 없어요.</p>'}</div>`;d.querySelector('[data-close]').onclick=()=>d.close();d.showModal();const box=d.querySelector('.vn-log');box.scrollTop=box.scrollHeight;}
function config(){const d=$('#vnConfig'),st=meta.settings;
 d.innerHTML=`<div class="dialog-header"><div><small>CONFIG</small><h2>설정</h2></div><button class="quiet" data-close>닫기 ×</button></div><div class="vn-config">
 <label>대사 속도<select id="cfgText">${[[45,'여유롭게'],[28,'보통'],[16,'빠르게'],[0,'즉시 표시']].map(([v,n])=>`<option value="${v}" ${records.textSpeed===v?'selected':''}>${n}</option>`).join('')}</select></label>
 <label>오토 대기<select id="cfgAuto">${[[2600,'느리게'],[1600,'보통'],[800,'빠르게']].map(([v,n])=>`<option value="${v}" ${st.auto===v?'selected':''}>${n}</option>`).join('')}</select></label>
 <label class="check"><input type="checkbox" id="cfgSkip" ${st.skipUnread?'checked':''}> 읽지 않은 대사도 스킵</label>
 <label class="check"><input type="checkbox" id="cfgUnlock" ${st.unlockAll?'checked':''}> 회상·갤러리 전체 열람 (공부용)</label>
 <button class="quiet" id="cfgReset">이야기 진행 기록 초기화</button></div>`;
 d.querySelector('[data-close]').onclick=()=>d.close();
 $('#cfgText').onchange=e=>{records.textSpeed=+e.target.value;save();};$('#cfgAuto').onchange=e=>{st.auto=+e.target.value;persist();};
 $('#cfgSkip').onchange=e=>{st.skipUnread=e.target.checked;persist();};$('#cfgUnlock').onchange=e=>{st.unlockAll=e.target.checked;persist();};
 $('#cfgReset').onclick=()=>{if(!confirm('세이브·읽음·해금 기록을 모두 지울까요? 훈련 오답 기록은 남습니다.'))return;meta={saves:{},read:{},seen:[],scenes:[],flags:{},settings:st};seenSet.clear();sceneSet.clear();persist();d.close();title();};
 d.showModal();
}
function closeDialogs(){for(const id of ['vnSlots','vnLog','vnConfig','catalog','cgGallery'])if($('#'+id)?.open)$('#'+id).close();}
function menu(k){
 if(k==='log')return openLog();
 if(k==='auto'){auto=!auto;skip=false;paint();if(auto&&!typing&&S.line)afterLine();return;}
 if(k==='skip'){skip=!skip;auto=false;paint();if(skip){if(typing)finishType();else if(S.line)afterLine();}return;}
 if(k==='qsave')return saveTo('quick');
 if(k==='qload')return loadFrom('quick');
 if(k==='save')return slotsDialog('save');
 if(k==='load')return slotsDialog('load');
 if(k==='config')return config();
 if(k==='hide')return setHidden(true);
 if(k==='title'){if(confirm('타이틀로 돌아갈까요? 저장하지 않은 진행은 오토 세이브 시점까지만 남습니다.'))title();}
}

// ── Title.
function title(){
 stopAuto();clearTimeout(typing?.t);typing=null;busy=false;skip=false;auto=false;S=null;
 if(run){cancelStory();stopMedia();run=null;}document.body.classList.remove('in-drill');document.body.classList.add('vn-mode');closeDialogs();
 const cont=latest();
 $('#main').innerHTML=`<section class="vn-title"><img class="vn-title-bg${ART_READY.has(meta.cleared?'title_key_visual_clear.png':'title_key_visual.png')?' kv'+(meta.cleared?' kv-clear':''):''}" src="${asset(meta.cleared?art('title_key_visual_clear.png',art('title_key_visual.png',art('bg_spring_cherry.png','bg_control_room_night.png'))):art('title_key_visual.png','bg_control_room_night.png'))}" alt=""><img class="vn-title-chr" src="${asset(art('title_key_visual.png','')?'':'orpheia_sd_maid_v2.png')}" alt="" ${art('title_key_visual.png','')?'hidden':''}><div class="vn-title-body"><small>RAILWAY DISPATCH VISUAL NOVEL</small>${ART_READY.has('title_logo.png')?`<img class="vn-title-logo" src="${asset('title_logo.png')}" alt="오르페이아 — 電脳侍女의 비상관제 일지">`:'<h1>오르페이아<span>電脳侍女의 비상관제 일지</span></h1>'}${meta.cleared?'<p class="vn-cleared">ALL CLEAR · 회상과 갤러리가 모두 열렸어요</p>':''}<nav>
 <button class="primary" data-t="new">처음부터</button><button data-t="continue" ${cont?'':'disabled'}>이어하기</button><button data-t="load" ${Object.keys(meta.saves).length?'':'disabled'}>불러오기</button><button data-t="recall">회상 · 사건 기록부</button><button data-t="gallery">갤러리</button><button data-t="config">설정</button></nav>
 <p class="vn-title-note">교재 기반 74개 사고 · 432개 교신. 이야기 속에서 겪은 사건은 회상에서 다시 연습할 수 있어요.</p></div></section>`;
 const go={new:()=>{if(Object.keys(meta.saves).length&&!confirm('처음부터 시작할까요? 기존 세이브는 그대로 남습니다.'))return;S=fresh(chapters[0].id);log=[];shell();paint();step();},continue:()=>loadFrom(cont),load:()=>slotsDialog('load'),recall:()=>catalog(),gallery:()=>openCG(),config};
 document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>go[b.dataset.t]());
}

// ── Keyboard (only while the VN surface is active).
document.addEventListener('keydown',e=>{
 if(!$('#vn')||document.body.classList.contains('in-drill')||document.querySelector('dialog[open]'))return;
 const box=$('#vnChoices');
 if(box&&!box.hidden&&/^[1-9]$/.test(e.key)){e.preventDefault();VN._pick?.(+e.key-1);return;}
 if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat)advance();}
 else if(e.key==='Control'&&!e.repeat){skip=true;paint();if(typing)finishType();else if(S?.line)afterLine();}
 else if(e.key==='a'||e.key==='A')menu('auto');
 else if(e.key==='h'||e.key==='H')setHidden(!hidden);
 else if(e.key==='l'||e.key==='L')openLog();
 else if(e.key==='F5'){e.preventDefault();menu('qsave');}
 else if(e.key==='F9'){e.preventDefault();menu('qload');}
});
document.addEventListener('keyup',e=>{if(e.key==='Control'&&skip){skip=false;if($('#vn'))paint();}});

ready.then(()=>{if($('.vn-title'))title();else if(S&&$('#vn'))paint();});
return {flag:k=>S?.flags?.[k],cleared:()=>!!meta.cleared,chapter,title,ready,afterDrill,markSeen,markScene,isUnlocked:id=>meta.settings.unlockAll||meta.cleared||sceneSet.has(id),isSeen:f=>meta.settings.unlockAll||meta.cleared||seenSet.has(f),inStory:()=>!!S,_pick:null,chapters};
})();
