'use strict';
// CTC drills — the CTC LAB simulator (ctc/, same-origin iframe) runs the real LS/MMI, and this layer turns the
// practical exam script into a radio drama. In the training room the cast plays the other side of the radio
// (as the instructors do in the real exam): 유하린 the drivers, 류지안 the stations, 서도희 교관 the chief
// controller and the operations room, ORPHEIA (in work clothes) the recovery and inspection teams.
// Spoken steps: incoming lines play as dialogue; at each controller turn the player picks what to say.
// Operation steps: the player works the LS/MMI; the simulator recognises the operation.
const CTCDrill=(()=>{
 const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pick=(a,seed)=>a[Math.abs(seed)%a.length];
 const hash=s=>[...String(s)].reduce((h,c)=>(h*31+c.charCodeAt(0))|0,7);
 const ACTOR={harin:'하린',jian:'지안',instructor:'서 교관',orpheia:'오르페이아'};
 const FACE={
  harin:'chr_harin_neutral.png',jian:'chr_jian_neutral.png',instructor:'chr_instructor_neutral.png',
  orpheia:'ui/face_neutral.png',orpheia_smile:'ui/face_smile.png',orpheia_worry:'ui/face_worry.png',orpheia_serious:'ui/face_serious.png'};
 let G_alarm=0,el=null,frame=null,W=null,G=null,onDone=null,pollTimer=null,typer=null,advanceFn=null;

 // ── Who speaks: script speaker tags → cast member and the name plate.
 function role(sp,text){
  const train=(text.match(/([A-Z]\d{3,4})\s*열차/)||[])[1];
  if(sp==='관')return {who:'sangcheol',name:'신상철 · 관제'};
  if(sp==='기'||sp==='충돌열차')return {who:'harin',name:`${train||(sp==='충돌열차'?'충돌열차':'')} 기관사`.trim()};
  if(/팀장|운영실/.test(sp))return {who:'instructor',name:sp};
  if(/복구반|검수반/.test(sp))return {who:'orpheia',name:sp};
  return {who:'jian',name:sp.replace('역/열차','역')};
 }
 // Script lines → utterances. "(기)" / "(관)" / "(석수역)" open a new utterance; indented lines continue it;
 // whole-line parentheses are alternative phrasings or stage notes and stay out of the dialogue.
 function utterances(lines){
  const out=[];let cur=null,note=false;
  for(const raw of lines){
   const l=raw.replace(/\(_|_\)/g,'').replace(/_/g,''),drop=t=>t.replace(/\s{2,}\([^)]*\)/g,' ');
   if(/^\s*[\d-]+\s*$/.test(l)||!l.trim())continue;
   if(/^\s*※/.test(l)){note=true;continue;}            // operator notes (and their continuation lines) are not speech
   const m=l.match(/^\s*\(?([^()\s\d][^()\s]{0,13})\)\s*(.*)$/);
   if(m){note=false;cur={sp:m[1],text:drop(m[2])};out.push(cur);continue;}
   const t=drop(l).trim();if(note||!t||/^\(.*\)$/.test(t))continue;
   if(cur)cur.text+=' '+t.replace(/^-\s*/,'');else out.push(cur={sp:'관',text:t});
  }
  for(const u of out)u.text=u.text.replace(/~{2,}/g,' — ').replace(/\s+/g,' ').trim();
  return out.filter(u=>u.text);
 }
 // Evacuation scripts give only the controller's words; the addressee answers "수신 이상!".
 function addressee(text){const m=text.match(/^(.{2,24}?)[,.]\s*관제 이상!/);return m&&!/관제/.test(m[1])?m[1].trim():'';}

 // ── Build the drama from the simulator's script.
 function beatsFor(sc,run){
  const fill=t=>String(t).replaceAll('{고장}',run.train||'고장열차').replace(/^\([^)]*\)\s*/,'');
  const beats=[];
  if(sc.group!=='emergency'&&sc.group!=='schedule'&&run.train)beats.push({k:'line',sp:'기',text:`철도관제, ${run.train}열차 이상! 차량고장으로 정상 운행이 어렵습니다. 이상!`});
  sc.steps.forEach((s,i)=>{
   if(s.kind==='do'){beats.push({k:'do',i,text:fill(s.text),hint:s.hint||''});return;}
   const us=s.lines?utterances(s.lines):[{sp:'관',text:fill(s.text)}];
   // the turn to decide is the first controller line that says something (a bare "철도관제 이상!" just answers the call)
   const ack=t=>/^(철도관제\s*)?(수신\s*)?이상!?$/.test(t.replace(/[.,]/g,'').trim());
   const turn=us.find(u=>u.sp==='관'&&!ack(u.text))||us.find(u=>u.sp==='관');
   let asked=false;
   for(const u of us){
    if(u===turn&&!asked){beats.push({k:'choice',i,text:u.text,heading:s.heading||''});asked=true;}
    else beats.push({k:'line',sp:u.sp,text:u.text});
    if(!s.lines&&u.sp==='관'){const a=addressee(u.text);if(a)beats.push({k:'line',sp:/역$/.test(a)?a:'기',text:`${a}, 수신 이상!`});}
   }
   beats.push({k:'said',i});
  });
  return beats;
 }
 function distractors(beat){
  const key=t=>t.slice(0,36),pool=G.beats.filter(b=>b.k==='choice'&&key(b.text)!==key(beat.text)),seen=new Set([key(beat.text)]),out=[];
  const at=G.beats.indexOf(beat),later=pool.filter(b=>G.beats.indexOf(b)>at),earlier=pool.filter(b=>G.beats.indexOf(b)<at);
  for(const list of [later.slice(0,4),later,earlier,pool]){
   for(const b of [...list].sort((a,c)=>hash(a.text+beat.text)-hash(c.text+beat.text))){if(out.length>=2)break;if(!seen.has(key(b.text))){seen.add(key(b.text));out.push(b.text);}}
  }
  return out;
 }

 // ── Butterfly forecasts for a wrong turn.
 const FUTURE={
  evac:['{역} 장내신호기 앞에서 기다리던 후속열차가 「대피는 언제?」라고 세 번 물었고, 세 번째 무전은 승객 전원의 단체 민원이 되었다.','부본선은 비어 있었지만 아무도 진로를 잡지 않았다. 고장열차는 본선에서 47분간 「관제승인 1호」를 기다리며 기관사는 그 사이 자격증 하나를 더 땄다.','하2선 열차가 대피 진로를 가로지르는 순간 연동장치가 모든 진로를 거부했다. LS 화면엔 빨간 신호만 남았고, 관제실 화이트보드에는 「오늘의 교훈: 상관관계」라는 글씨가 영구 보존되었다.'],
  flood:['물은 기다려 주지 않았다. {역} 승강장에 고인 물 위로 누군가 오리배를 띄웠고, 그 사진은 다음 날 아침 모든 포털 메인을 장식했다.','상선 열차가 그대로 진입했다. 바퀴가 물을 가르며 만든 물보라에 역사 안내전광판이 합선되어 「곧 도착」만 영원히 반복했다.'],
  collision:['후속열차에 통보가 늦었다. 이미 멈춰 선 두 열차 뒤로 세 번째 열차가 다가오는 소리가 들렸고 — 그 장면은 교육 영상 「하면 안 되는 일 TOP 1」로 10년간 상영되었다.','인접선 지장 여부를 아무도 확인하지 않았다. 반대편에서 들어온 열차의 기관사가 창밖을 보고 비명을 질렀고, 그 비명은 열차무선을 타고 전 노선에 생중계되었다.'],
  casualty:['구호보다 운행 재개가 먼저 나갔다. 출발한 열차 아래에서 들려온 소리는 관제실 모두가 평생 잊지 못했고, 그날 밤 오르페이아는 처음으로 아무 말도 하지 않았다.','119 출동 요청이 빠졌다. 현장에 도착한 건 구급대가 아니라 지나가던 배달 오토바이였고, 기사님은 결국 그날의 영웅이 되었다.'],
  breakdown:['기동검수반 통보가 빠졌다. 고장열차 기관사는 혼자 유튜브로 「비상제동 완해하는 법」을 검색했고, 그 영상의 조회수는 그날 하루에만 3만 회가 올랐다.','후속열차 정차 지시가 늦었다. 고장열차 뒤로 열차가 줄줄이 늘어서 {역}부터 서울역까지 거대한 「열차 기차놀이」가 완성되었다.'],
  fire:['연기를 본 승객이 비상코크를 당겼다. 열차는 하필 터널 한가운데 멈췄고, 그 뒤 일어난 일은 소방 교재의 새 챕터 「관제 무전 한 줄의 무게」가 되었다.','인접선 열차를 막지 않았다. 반대편 열차는 연기 속으로 그대로 진입했고, 다음 날 아침 신문 1면 제목은 「관제는 어디에」였다.'],
  schedule:['경합은 해소되지 않았다. 두 열차는 같은 시각 같은 선로를 서로 양보하다 30분을 보냈고, 승객들은 그사이 끝말잇기 대회를 열었다.'],
 };
 function groupOf(sc){
  if(sc.group==='schedule')return 'schedule';if(sc.group!=='emergency')return 'evac';
  const t=sc.title;return /침수/.test(t)?'flood':/충돌/.test(t)?'collision':/사상/.test(t)?'casualty':/화재/.test(t)?'fire':'breakdown';
 }
 function forecast(beat,said){
  const sc=G.sc,place=(sc.title.match(/([가-힣]+역)/)||[])[1]||'현장',short=t=>t.length>60?t.slice(0,59)+'…':t;
  const future=pick(FUTURE[groupOf(sc)],hash(said+beat.text)).replaceAll('{역}',place);
  return `<p class="ctc-said">「${esc(short(said))}」</p><p>— 그 순간 나가야 했던 말은 따로 있었다.</p><p>${esc(future)}</p>`;
 }

 // ── Screen.
 function build(){
  el=document.createElement('section');el.id='ctcDrill';el.hidden=true;
  el.innerHTML=`<div class="ctc-stage"><iframe id="ctcFrame" title="CTC LAB LS·MMI"></iframe><div class="ctc-loading" hidden><img src="${asset(FACE.orpheia_smile)}" alt=""><p>LS 기동 중이에요… 잠시만요, 주인님!</p></div></div>
  <div class="ctc-console">
   <div class="ctc-face"><img alt=""></div>
   <div class="ctc-talk"><div class="ctc-name"></div><div class="ctc-text"></div><div class="ctc-choices"></div><div class="ctc-next">▼</div></div>
   <aside class="ctc-side"><div class="ctc-title"></div><div class="ctc-progress"><span></span></div><div class="ctc-stat"></div>
    <div class="ctc-tools"><label><input type="checkbox" id="ctcHint"> 힌트</label><button type="button" id="ctcLog">무전 기록</button><button type="button" id="ctcHide">대화창 ▾</button></div></aside>
  </div>
  <div class="ctc-forecast" hidden><div class="ctc-fc-box"><small>0.3초 예측 연산</small><h3>그 무전이 나간 미래</h3><div class="ctc-fc-body"></div><button type="button" class="primary">↺ 되감기</button></div></div>
  <dialog id="ctcLogDlg"><div class="ctc-loglist"></div><form method="dialog"><button class="primary">닫기</button></form></dialog>`;
  document.body.appendChild(el);frame=el.querySelector('#ctcFrame');
  el.querySelector('.ctc-talk').addEventListener('click',()=>advanceFn?.());
  el.querySelector('#ctcHint').onchange=e=>{records.hint=e.target.checked;save();G&&rerender();};
  el.querySelector('#ctcLog').onclick=()=>{el.querySelector('.ctc-loglist').innerHTML=G.log.map(l=>`<p><b>${esc(l.name)}</b> ${esc(l.text)}</p>`).join('')||'<p>아직 무전이 없어요.</p>';el.querySelector('#ctcLogDlg').showModal();};
  el.querySelector('#ctcHide').onclick=()=>{el.classList.toggle('mini');el.querySelector('#ctcHide').textContent=el.classList.contains('mini')?'대화창 ▴':'대화창 ▾';};
  document.addEventListener('keydown',e=>{if(el.hidden||document.querySelector('dialog[open]'))return;if(e.key===' '||e.key==='Enter'){if(e.target.closest?.('#ctcDrill .ctc-choices')||e.target.tagName==='INPUT')return;e.preventDefault();advanceFn?.();}},true);
 }
 let rerender=()=>{};
 function face(who,mood=''){
  const img=el.querySelector('.ctc-face img'),box=el.querySelector('.ctc-face');
  const f=who==='orpheia'?FACE['orpheia'+(mood?'_'+mood:'')]||FACE.orpheia:FACE[who];
  box.className='ctc-face'+(who&&who!=='orpheia'&&FACE[who]?' crop crop-'+who:'');box.hidden=!f;if(f)img.src=asset(f);
 }
 function speak(who,name,text,done,mood){
  clearInterval(typer);advanceFn=null;face(who,mood);
  el.querySelector('.ctc-choices').innerHTML='';
  const actor=ACTOR[who]&&who!=='orpheia'||who==='orpheia'&&name!=='오르페이아'?` <small>${esc(ACTOR[who])}</small>`:'';
  el.querySelector('.ctc-name').innerHTML=esc(name)+actor;el.querySelector('.ctc-name').className='ctc-name c-'+who;
  const box=el.querySelector('.ctc-text'),speed=records.textSpeed??28;let i=0;box.textContent='';
  el.querySelector('.ctc-next').hidden=true;
  if(name!=='오르페이아')G.log.push({name,text});
  const finish=()=>{clearInterval(typer);box.textContent=text;el.querySelector('.ctc-next').hidden=false;advanceFn=()=>{advanceFn=null;SFX.play('select');done();};};
  if(!speed){finish();return;}
  advanceFn=finish;
  typer=setInterval(()=>{i++;box.textContent=text.slice(0,i);SFX.blip(who==='sangcheol'?'sangcheol':who,text[i-1]);if(i>=text.length)finish();},speed);
 }
 function status(text){el.querySelector('.ctc-stat').innerHTML=text;}
 function progress(){const said=G.run?.done||[],n=said.filter(Boolean).length;el.querySelector('.ctc-progress span').style.width=(said.length?100*n/said.length:0)+'%';el.querySelector('.ctc-title').innerHTML=`<b>${esc(G.sc.title)}</b><small>진행 ${n} / ${said.length}</small>`;}

 // ── Runner.
 function snap(){return W.SimRemote.snapshot.scenario.run;}
 function next(){
  G.run=snap();progress();
  const b=G.beats[G.at];if(!b)return finish();
  G.at++;
  if(b.k==='line'){const r=role(b.sp,b.text);SFX.play('radio');return speak(r.who,r.name,b.text,next);}
  if(b.k==='said'){W.SimRemote.command({type:'scenario:say',index:b.i,checked:true});return next();}
  if(b.k==='choice')return ask(b);
  if(b.k==='do')return operate(b);
 }
 function ask(b){
  const opts=G.opts.get(b)||(()=>{const o=[b.text,...distractors(b)].sort((x,y)=>hash(x+G.sc.id)-hash(y+G.sc.id));G.opts.set(b,o);return o;})();
  G.struck.get(b)||G.struck.set(b,new Set());
  const draw=()=>{
   face('orpheia',G.struck.get(b).size?'worry':'');
   el.querySelector('.ctc-name').innerHTML='오르페이아';el.querySelector('.ctc-name').className='ctc-name c-orpheia';
   el.querySelector('.ctc-text').textContent=G.struck.get(b).size?'예측을 되감았어요. 이번엔 어떤 무전을 낼까요, 주인님?':pick(['주인님, 지금 내보낼 무전은요?','관제 차례예요. 누구에게, 무엇을 말할까요?','무전 송신 대기 중이에요. 다음 한마디를 골라 주세요.'],hash(b.text));
   el.querySelector('.ctc-next').hidden=true;advanceFn=null;
   const short=t=>t.length>110?t.slice(0,109)+'…':t;
   el.querySelector('.ctc-choices').innerHTML=opts.map((t,k)=>`<button type="button" class="ctc-choice${records.hint&&t===b.text?' hinted':''}" data-k="${k}" ${G.struck.get(b).has(t)?'disabled':''}>${esc(short(t))}</button>`).join('')+(records.hint&&b.heading?`<p class="ctc-hint">힌트 · 이번 단계: ${esc(b.heading)}</p>`:'');
   el.querySelectorAll('.ctc-choice').forEach(btn=>btn.onclick=e=>{e.stopPropagation();choose(b,opts[+btn.dataset.k]);});
  };
  rerender=draw;draw();
 }
 function choose(b,said){
  rerender=()=>{};
  if(!G.firstTry.has(b))G.firstTry.set(b,said===b.text);
  if(records.hint&&said===b.text)G.hinted++;
  if(said!==b.text){
   G.rewinds++;G.struck.get(b).add(said);SFX.play('wrong');
   const fc=el.querySelector('.ctc-forecast');fc.querySelector('.ctc-fc-body').innerHTML=forecast(b,said);fc.hidden=false;
   if(typeof BGM!=='undefined')BGM.play('bgm_forecast');
   fc.querySelector('button').onclick=()=>{fc.hidden=true;SFX.play('rewind');if(typeof BGM!=='undefined')BGM.play('bgm_emergency');ask(b);};
   return;
  }
  SFX.play('transmit');speak('sangcheol','신상철 · 관제',b.text,next);
 }
 function operate(b){
  const run=snap();if(run?.done[b.i]){return next();}
  G.ops++;rerender=()=>operate(b);
  const hint=records.hint;
  speak('orpheia','오르페이아',hint?`LS 조작 차례예요! 「${b.text}」`:'여기서는 LS·MMI 조작이 필요해요. 무엇을 할지 떠올려 보세요!',()=>{},hint?'serious':'');
  el.querySelector('.ctc-next').hidden=true;
  el.querySelector('.ctc-choices').innerHTML=hint?(b.hint?`<p class="ctc-hint">방법 · ${esc(b.hint)}</p>`:''):`<button type="button" class="ctc-peek">무엇을 해야 하죠? (힌트 보기)</button>`;
  el.querySelector('.ctc-peek')?.addEventListener('click',e=>{e.stopPropagation();G.peeks++;el.querySelector('.ctc-choices').innerHTML=`<p class="ctc-hint">해야 할 조작 · ${esc(b.text)}${b.hint?'<br>방법 · '+esc(b.hint):''}</p>`;});
  status('<span class="ctc-wait">● LS 조작 대기</span>');
  clearInterval(pollTimer);
  pollTimer=setInterval(()=>{const r=snap();if(r?.done[b.i]){clearInterval(pollTimer);status('');SFX.play('correct');rerender=()=>{};speak('orpheia','오르페이아',pick(['확인했어요! 조작 완벽해요♪','좋아요, LS가 받아들였어요!','네, 들어갔어요. 다음으로 가요!'],hash(b.text)),next,'smile');}},300);
 }
 function finish(){
  clearInterval(pollTimer);rerender=()=>{};
  const asks=[...G.firstTry.values()],R={id:G.sc.id,title:G.sc.title,asks:asks.length,firstTry:asks.filter(Boolean).length,rewinds:G.rewinds,hinted:G.hinted,ops:G.ops,peeks:G.peeks,passed:!!snap()?.passed};
  status('<span class="ctc-ok">● 대본 완료</span>');
  speak('orpheia','오르페이아','수고하셨어요, 주인님! 무전도 조작도 전부 끝났어요.',()=>close(R),'smile');
 }
 function close(R){
  clearInterval(pollTimer);clearInterval(G_alarm);clearInterval(typer);el.hidden=true;document.body.classList.remove('in-ctc');
  frame.src='about:blank';W=null;G=null;onDone?.(R);
 }

 // ── Start: fresh simulator per drill (a clean LS), then the script.
 function start(id,done){
  if(!el)build();onDone=done;el.hidden=false;el.classList.remove('mini');document.body.classList.add('in-ctc');
  el.querySelector('#ctcHint').checked=!!records.hint;el.querySelector('.ctc-loading').hidden=false;
  el.querySelector('.ctc-choices').innerHTML='';el.querySelector('.ctc-text').textContent='';el.querySelector('.ctc-name').textContent='';status('');
  if(typeof BGM!=='undefined')BGM.play('bgm_emergency');
  frame.onload=()=>{
   W=frame.contentWindow;let tries=0;
   const wait=setInterval(()=>{
    if(!W?.SimRemote?.snapshot){if(++tries>200){clearInterval(wait);fail('시뮬레이터를 불러오지 못했어요.');}return;}
    clearInterval(wait);
    try{
     const evac=W.SimScenarios.list.find(s=>s.id===id),em=W.SimEmergency.list.find(s=>s.id===id);let train='';
     if(evac){const pr=W.SimFTSBuiltins.all().find(p=>p.id==='P-'+id);W.SimRemote.command({type:'timetable',method:'import',args:[W.SimFTSBuiltins.timetableFor(pr)]});train=W.SimScenarios.candidates(evac,W.SimDiagram.getModel())[0]||'';}
     else if(!em&&!W.SimScheduleScenarios.list.find(s=>s.id===id))return fail('알 수 없는 시나리오: '+id);
     const r=W.SimRemote.command({type:'scenario:start',id,train,ui:{},manualSay:true});
     if(!r?.ok)return fail(r?.message||'시나리오를 시작하지 못했어요.');
     // show the scenario's station on the LS and clear the start-up alarm (cast trains share one window)
     W.document.querySelector(`#stationTabs [data-view="${r.station}"]`)?.click();
     // the scripted cast starts stacked in one train window, which the MMI reports as "열차번호 중복": not the player's doing
     clearInterval(G_alarm);G_alarm=setInterval(()=>{const d=W?.document,ps=d?[...d.querySelectorAll('.mmi-alarm:not([hidden]) #alarmText p')]:[];if(ps.length&&ps.every(x=>/열차번호 중복/.test(x.textContent)))W.SimMMI.clearAlarms();},400);
     const run=W.SimRemote.snapshot.scenario.run;
     G={sc:run.sc,run,beats:beatsFor(run.sc,run),at:0,log:[],opts:new Map(),struck:new Map(),firstTry:new Map(),rewinds:0,hinted:0,ops:0,peeks:0};
     el.querySelector('.ctc-loading').hidden=true;SFX.play('alarm');next();
    }catch(e){console.error(e);fail(e.message);}
   },50);
  };
  frame.src='ctc/index.html?embed=1&t='+Date.now();
 }
 function fail(msg){el.querySelector('.ctc-loading').hidden=true;speak('orpheia','오르페이아',msg+' 이야기로 돌아갈게요.',()=>close({id:'',error:msg}),'worry');}
 // Test helpers: the scripted beats and the live run.
 return {start,debug:()=>G&&{at:G.at,beats:G.beats,run:snap()},frame:()=>W};
})();
