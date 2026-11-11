'use strict';
// CTC drills — the CTC LAB simulator (ctc/, same-origin iframe) runs the real LS/MMI and its FTS (the instructor's
// exam controller) scores the problem. The game runs it as a sequence of decisions (the script's reference order):
//  · a communication step asks whom to call, then what to say; the cast answers in role-play (유하린 the drivers,
//    류지안 the stations, 서도희 the chief controller and operations room, ORPHEIA the recovery and inspection teams)
//    and FTS records the communication, so its reaction happens on the LS;
//  · an operation step asks which operation is needed, then the player does it on the LS or the game MMI terminal
//    and the engine recognises it;
//  · a wrong pick plays out as a 0.3-second forecast and is rewound with that option struck out. Only the right
//    decision moves on, and the result is ranked by first-try decisions.
const CTCDrill=(()=>{
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pick=(a,seed)=>a[Math.abs(seed)%a.length];
 const hash=s=>[...String(s)].reduce((h,c)=>(h*31+c.charCodeAt(0))|0,7);
 const ACTOR={harin:'하린',jian:'지안',instructor:'서 교수',orpheia:'오르페이아'};
 const FACE={harin:'chr_harin_neutral.png',jian:'chr_jian_neutral.png',instructor:'chr_instructor_neutral.png',
  orpheia:'ui/face_neutral.png',orpheia_smile:'ui/face_smile.png',orpheia_worry:'ui/face_worry.png',orpheia_serious:'ui/face_serious.png'};
 let el=null,frame=null,W=null,M=null,G=null,onDone=null,tick=0,typer=null,advanceFn=null,toastTimer=0;
 const $=s=>el.querySelector(s);

 // ── Script text → utterances. "(기)" / "(관)" / "(석수역)" open an utterance; indented lines continue it;
 // whole-line parentheses are alternative phrasings, "※" lines are operator notes: neither is speech.
 function utterances(text){
  const out=[];let cur=null,note=false;
  for(const raw of String(text).split('\n')){
   const l=raw.replace(/\(_|_\)/g,'').replace(/_/g,''),drop=t=>t.replace(/\s{2,}\([^)]*\)/g,' ');
   if(/^\s*[\d-]+\s*$/.test(l)||!l.trim())continue;
   if(/^\s*※/.test(l)){note=true;continue;}
   const m=l.match(/^\s*\(?([^()\s\d][^()\s]{0,13})\)\s*(.*)$/);
   if(m){note=false;cur={sp:m[1],text:drop(m[2])};out.push(cur);continue;}
   const t=drop(l).trim();if(note||!t||/^\(.*\)$/.test(t))continue;
   if(cur)cur.text+=' '+t.replace(/^-\s*/,'');else out.push(cur={sp:'관',text:t});
  }
  for(const u of out)u.text=u.text.replace(/~{2,}/g,' — ').replace(/\s+/g,' ').trim();
  return out.filter(u=>u.text);
 }
 function role(sp,text){
  const train=(text.match(/([A-Z]\d{3,4})\s*열차/)||[])[1];
  if(sp==='관')return {who:'sangcheol',name:'신상철 · 관제'};
  if(sp==='기'||sp==='충돌열차')return {who:'harin',name:`${train||''} 기관사`.trim()};
  if(/팀장|운영실/.test(sp))return {who:'instructor',name:sp};
  if(/복구반|검수반|전기/.test(sp))return {who:'orpheia',name:sp};
  return {who:'jian',name:sp.replace('역/열차','역')};
 }
 // Whom a communication is addressed to (the radio's first choice).
 function recipient(c){
  const us=utterances(c.text),first=us[0],mine=us.find(u=>u.sp==='관');
  const t=(mine?.text||c.text).replace(/^\([^)]*\)\s*/,'');
  if(first&&first.sp!=='관'){const r=role(first.sp,first.text);return {key:'in:'+r.name,name:r.name,who:r.who,incoming:true};}
  if(/확인!?$/.test(t)&&/전환|정지|진행|해정|취급/.test(t)&&!/관제 이상/.test(t))return {key:'self',name:'지적확인 환호 (혼잣말)',who:''};
  if(/^철도관제에서 알립니다/.test(t))return {key:'all',name:'전 열차 (일제 통보)',who:'harin',reply:'전 열차'};
  if(/^(비상!|관제팀장|관제운영실)/.test(t))return {key:'chief',name:'관제팀장 · 관제운영실',who:'instructor',reply:'관제팀장'};
  let m;
  if((m=t.match(/^(사고복구반|기동검수반|전기운용자)/)))return {key:m[1],name:m[1],who:'orpheia',reply:m[1]};
  if((m=t.match(/^((?:[가-힣]+,\s*)+[가-힣]+역)/)))return {key:'stations',name:'관계역 (일제 통보)',who:'jian',reply:'각 역'};
  if((m=t.match(/^([가-힣]+역)[,.\s]/)))return {key:m[1],name:m[1],who:'jian',reply:m[1]};
  if((m=t.match(/^(후속열차|선행열차|[상하]\d선 열차)/)))return {key:m[1],name:m[1]+' 기관사',who:'harin',reply:m[1]};
  if((m=t.match(/^([A-Z]\d{3,4})(?:\s*,\s*[A-Z]\d{3,4})*\s*열차/)))return {key:m[1],name:m[1]+' 기관사',who:'harin',reply:m[1]+'열차'};
  return {key:'etc',name:'그 밖의 통보',who:'instructor',reply:''};
 }
 const label=c=>/\n|^\s*\(/.test(c.text)&&/^\d+\.\s/.test(c.label)?c.label.replace(/^\d+\.\s*/,''):(c.text.split('\n')[0].replace(/^\([^)]*\)\s*/,''));
 // A scripted exchange for one communication. One-line communications get the addressee's read-back.
 function exchange(c,r){
  const us=utterances(c.text);
  if(us.length>1||us[0]?.sp!=='관'||/\n/.test(c.text))return us.map(u=>({...role(u.sp,u.text),text:u.text}));
  const text=us[0].text.replace(/^\([^)]*\)\s*/,''),out=[{who:'sangcheol',name:'신상철 · 관제',text}];
  if(r.key==='self')return out;
  const ans=/수리 완료됐습니까/.test(text)?'네, 수리 완료됐습니다. 이상!':/신호 확인/.test(text)?`${r.reply}, 신호 확인! 이상!`:`${r.reply}, 수신 이상!`;
  out.push({who:r.who,name:r.name,text:ans});return out;
 }

 // ── Reference order (FTS "조치사항"): which operations come before each communication.
 function order(p){
  const seq=[...String(p.actions||'').matchAll(/^\d+\.\s*\[(통보|조작)\]\s*(.*)$/gm)].map(m=>({kind:m[1],text:m[2]}));
  const ok=seq.filter(s=>s.kind==='통보').length===p.communications.length,byId=id=>p.objectives.find(o=>o.id===id);
  const names=Object.fromEntries(W.SimNetwork.stations.map(x=>[x.name,x.id])),home=p.setup?.reset?.[0]||p.setup?.trains?.[0]?.station||'';
  let ci=0;const taken=new Set();
  for(const s of seq){
   if(s.kind==='통보'){s.comm=ok?p.communications[ci++]:null;continue;}
   const t=s.text,st=names[(t.match(/([가-힣]+)역/)||[])[1]]||home,ids=[];let m;
   if(/CCM 전환/.test(t))ids.push('ccm-'+st);
   else if(/AUTO/.test(t))ids.push('auto-'+st);
   else if((m=t.match(/열차번호 \w+ → (\w+) 수정/)))ids.push('rename-'+m[1]);
   else if((m=t.match(/열차번호 (\w+) 삭제/)))ids.push('delete-'+m[1]);
   else if((m=t.match(/^(\w+) 열차번호 .*이동/)))ids.push('move-'+m[1]);
   else if(/스케줄/.test(t))ids.push(...p.objectives.filter(o=>o.id.startsWith('schedule-')).map(o=>o.id));
   else if(/접근쇄정 \d+초가 지나/.test(t))ids.push(...(t.match(/\d+[A-Z]/g)||[]).map(x=>`free-${st}-${x}`));
   else if((m=t.match(/([0-9A-Z]+-[0-9A-Z]+)/)))ids.push(`route-${st}-${m[1]}`);
   else if(/정지|해정/.test(t))ids.push(...(t.replace(/\(.*/,'').match(/\d+[A-Z]?(?=[\s·]|$)/g)||[]).map(x=>`stop-${st}-${x}`));
   s.objs=ids.map(byId).filter(o=>o&&!taken.has(o.id));s.objs.forEach(o=>taken.add(o.id));
  }
  return {seq,ok,rest:p.objectives.filter(o=>!taken.has(o.id))};
 }
 // The steps: the reference order, then anything left (branch items are added when they appear).
 function stepsFor(p){
  const o=G.order,steps=[];
  if(o.ok){for(const s of o.seq)if(s.kind==='통보'&&s.comm)steps.push({kind:'comm',comm:s.comm});else if(s.objs?.length)steps.push({kind:'op',text:s.text,objs:s.objs});
   for(const ob of o.rest)steps.push({kind:'op',text:ob.label,objs:[ob]});}
  else{for(const c of p.communications)steps.push({kind:'comm',comm:c});for(const ob of p.objectives)steps.push({kind:'op',text:ob.label,objs:[ob]});}
  return steps;
 }
 const ACK=t=>/^(철도관제\s*)?(수신\s*)?이상!?$/.test(t.replace(/[.,]/g,'').trim());
 // what the controller opens with (the line the player picks)
 function opener(c){const us=utterances(c.text),k=us.findIndex(u=>u.sp==='관'&&!ACK(u.text)),i=k>=0?k:us.findIndex(u=>u.sp==='관');return {i,text:(us[i]?.text||label(c)).replace(/^\([^)]*\)\s*/,'')};}
 // a situation cue before the choice: what is happening, not who to call
 function cue(c){
  const t=label(c)+' '+c.text;
  return /상황수보|재확인/.test(label(c))?'무전이 들어왔어요. 응답하고 상황을 확인해요.'
   :/^전 열차|전 열차 · 통보/.test(label(c))?'사고를 알았어요. 그런데 노선 위의 열차들은 아직 몰라요.'
   :/인접선|후속|선행|열차통제|통과 지시/.test(label(c))?'사고 지점으로 다른 열차들이 다가오고 있어요.'
   :/^역 ·|역 · 안내|역 · 운행선/.test(label(c))?'현장 역은 아직 아무 지시도 받지 못했어요.'
   :/전파|보고|센터|본사/.test(label(c))?'관제실 밖에도 이 일을 알아야 할 사람들이 있어요.'
   :/초기대응|구호|지원요청/.test(label(c))?'현장에 사람이 필요해요.'
   :/안내방송/.test(label(c))?'승객들은 영문도 모른 채 기다리고 있어요.'
   :/복구반|검수반|파악|차량상태|상황파악/.test(t)?'현장은 지금 어떤 상태일까요?'
   :/운행선 변경|변경/.test(t)?'지연이 길어지고 있어요. 열차를 돌릴 방법이 필요해요.'
   :/정상운행|운행재개|출발 지시|복구완료|회송/.test(t)?'고비를 넘겼어요. 이제 다시 움직일 차례예요.'
   :/확인!$/.test(c.text.trim())?'방금 한 조작, 그냥 넘어가도 될까요?'
   :pick(['다음 조치는요, 주인님?','지금 누가 주인님의 무전을 기다리고 있을까요?','다음 한마디를 정해요.'],hash(c.id));
 }

 // ── Forecasts.
 const FUTURE={
  evac:['{열차} 기관사는 지령대로 출발했다. 신호는 정지였고, 진로는 본선 그대로였다. 30초 뒤 관제실의 모든 전화가 동시에 울렸고, 그날의 녹취록은 「복창의 중요성」 교재 1쪽에 실렸다.','진로가 없는데 「가라」는 무전이 나갔다. 기관사는 세 번 되물었고, 네 번째에는 무전 대신 노조 사무실에 전화를 걸었다.','연동장치는 침착하게 모든 진로를 거부했다. 화면엔 빨간 신호만 남았고, 실습실 화이트보드에는 「오늘의 교훈: 조작 먼저, 지시는 그다음」이 유성펜으로 적혔다. 지워지지 않는다.'],
  flood:['물이 빠지지 않은 선로로 출발 지시가 나갔다. 열차가 만든 물보라에 역사 전광판이 합선되어 「곧 도착」만 영원히 반복했다.'],
  collision:['진로가 서지 않은 채 구원열차가 움직였다. 멈춰 선 두 열차 뒤로 세 번째 열차의 전조등이 다가왔고, 그 장면은 교육 영상 「하면 안 되는 일 TOP 1」로 10년간 상영되었다.'],
  casualty:['구호가 끝나기 전에 운행 재개가 먼저 나갔다. 그날 밤 오르페이아는 처음으로 아무 말도 하지 않았다.'],
  breakdown:['운행선 변경 진로가 없는데 출발 지시가 나갔다. 열차는 고장열차 바로 뒤까지 가서 섰고, {역}부터 서울역까지 거대한 「열차 기차놀이」가 완성되었다.'],
  fire:['신호를 막기 전에 출발 지시가 나갔다. 열차는 연기 속으로 그대로 진입했고, 다음 날 신문 1면 제목은 「관제는 어디에」였다.'],
  plan:['시간표가 바뀌기 전에 지시가 먼저 나갔다. 두 열차는 같은 시각 같은 선로를 서로 양보하다 30분을 보냈고, 승객들은 그사이 끝말잇기 대회를 열었다.'],
 };
 function group(p){const t=p.name+' '+(p.source||'');return /침수/.test(t)?'flood':/충돌|탈선/.test(t)?'collision':/사상/.test(t)?'casualty':/화재/.test(t)?'fire':/차량고장 시/.test(t)?'breakdown':p.subject==='열차 운행 계획'?'plan':'evac';}
 const WRONG={
  breakdown:['후속열차는 아무 연락도 받지 못한 채 다가왔다. 고장열차 뒤 30미터에서 비상제동을 건 기관사는, 그날 이후 커피를 끊었다.','승객들은 「곧 출발합니다」만 들은 채 40분을 기다렸다. 누군가 객실에서 시작한 끝말잇기는 6량 전체로 번졌고, 결국 「관제」에서 끝났다.','{역} 승강장에는 사람이 계속 쌓였다. 역무원은 아무 지시도 받지 못했고, 안내방송 대신 자판기 음료가 매진되었다.'],
  casualty:['연락이 한 박자 늦었다. 현장은 무엇을 해야 할지 몰랐고, 그날의 녹취록에는 3분 동안 침묵만 남았다.','인접선 열차가 그대로 진입했다. 현장에 있던 사람들은 그 소리를 평생 기억하게 되었다.'],
  flood:['물은 기다려 주지 않았다. 아무 지시도 받지 못한 열차가 {역}으로 들어섰고, 물보라에 역사 전광판이 「곧 도착」만 영원히 반복했다.','안내방송이 없었다. 승객들은 젖은 계단에서 우산을 들고 셀카를 찍었고, 그 사진이 다음 날 모든 포털 메인을 장식했다.'],
  fire:['연기를 본 승객이 비상코크를 당겼다. 열차는 하필 터널 한가운데 멈췄고, 그 뒤의 일은 소방 교재의 새 장이 되었다.','반대편 열차를 막지 않았다. 연기 속으로 들어온 열차의 기관사는 무전에 대고 「관제? 관제?」만 열두 번 불렀다.'],
  collision:['후속열차에 통보가 가지 않았다. 멈춰 선 두 열차 뒤로 세 번째 전조등이 다가왔다.','인접선 지장을 아무도 확인하지 않았다. 반대편 열차 기관사의 비명이 열차무선을 타고 전 노선에 생중계되었다.'],
  evac:['고장열차는 본선에서 47분간 「관제승인 1호」를 기다렸다. 기관사는 그 사이 자격증 하나를 더 땄다.','후속열차가 세 번 「대피는 언제?」를 물었다. 세 번째 무전은 승객 전원의 단체 민원이 되었다.'],
  plan:['두 열차는 같은 시각 같은 선로를 서로 양보하다 30분을 보냈고, 승객들은 그사이 끝말잇기 대회를 열었다.'],
 };
 const OPWRONG=['연동장치는 침착하게 그 조작을 받아들였다. 문제는 그곳이 엉뚱한 곳이었다는 것. 진로가 열린 것을 본 {열차} 기관사는 「관제가 그러라는데?」 하며 출발했다.','엉뚱한 신호기가 정지했다. 아무 상관 없던 열차가 멈춰 섰고, 그 열차에 탄 면접 응시생 열두 명이 전원 지각했다.','제어권이 엉뚱한 역으로 넘어갔다. 역무원은 매뉴얼을 펼친 채 20분 동안 같은 페이지만 읽었다.','막아야 할 신호는 그대로 진행을 띄우고 있었다. {열차}는 아무것도 모른 채 그 신호를 지나갔다.'];
 function forecast(said,needed,ops){
  const p=G.p0,place=(p.name.match(/([가-힣]+역)/)||[])[1]||'현장',train=(needed.match(/([A-Z]\d{3,4})/)||said.match(/([A-Z]\d{3,4})/)||p.setup?.trains?.[0]?.number?[0,p.setup.trains[0].number]:[])[1]||'그 열차';
  const short=t=>t.length>80?t.slice(0,79)+'…':t,pool=ops?OPWRONG:WRONG[group(p)]||WRONG.breakdown;
  const future=pick(pool,hash(said+needed+G.rewinds)).replaceAll('{역}',place).replaceAll('{열차}',train);
  return `<p class="ctc-said">「${esc(short(said))}」</p><p>— 그 순간 정말 필요했던 건 <b>「${esc(short(needed))}」</b>였다.</p><p>${esc(future)}</p>`;
 }

 // ── Screen.
 function build(){
  el=document.createElement('section');el.id='ctcDrill';el.hidden=true;
  el.innerHTML=`<div class="ctc-screens"><iframe id="ctcFrame" title="LS 대형표시반"></iframe><iframe id="ctcMMI" title="MMI (원본, 숨김)"></iframe><div class="ctc-mmi" id="ctcTerm"></div></div>
  <div class="ctc-loading" hidden><img src="${asset(FACE.orpheia_smile)}" alt=""><p>LS 기동 중이에요… 잠시만요, 주인님!</p></div>
  <div class="ctc-hud"><span class="ctc-step"></span>
   <span class="ctc-view" role="tablist"><button type="button" data-view="ls" class="on" title="앞쪽 대형표시반 (Tab)">▲ LS 표시반</button><button type="button" data-view="mmi" title="책상 위 관제 단말 (Tab)">▼ MMI 단말<i hidden>!</i></button></span>
   <span class="ctc-title"></span><span class="ctc-score" title="판단 첫 시도"></span>
   <button type="button" id="ctcSkip" title="시간을 10초 넘깁니다 (접근쇄정 대기 등)">+10초</button><button type="button" id="ctcSit">📋 상황</button><label><input type="checkbox" id="ctcHint"> 힌트</label><button type="button" id="ctcLog">기록</button></div>
  <div class="ctc-task" hidden></div>
  <aside class="ctc-panel" id="ctcRadioPanel" hidden></aside>
  <aside class="ctc-panel left" id="ctcHintPanel" hidden></aside>
  <div class="ctc-toast" hidden><img alt=""><span></span></div>
  <div class="ctc-dialogue" hidden><div class="ctc-face"><img alt=""></div><div class="ctc-talk"><div class="ctc-name"></div><div class="ctc-text"></div></div><div class="ctc-next">▼</div><small class="ctc-peekhint">H · 대화창 숨기고 LS 보기</small></div>
  <div class="ctc-forecast" hidden><div class="ctc-fc-box"><small>0.3초 예측 연산</small><h3>그 무전이 나간 미래</h3><div class="ctc-fc-body"></div><button type="button" class="primary">↺ 되감기</button></div></div>
  <dialog id="ctcDlg"><div class="ctc-dlg-body"></div><form method="dialog"><button class="primary">닫기</button></form></dialog>`;
  document.body.appendChild(el);frame=$('#ctcFrame');
  $('.ctc-dialogue').addEventListener('click',()=>advanceFn?.());
  $('#ctcHint').onchange=e=>{records.hint=e.target.checked;save();hintPanel();G?.redraw?.();if(G)G.mm.sig='';mmi();};
  el.querySelectorAll('.ctc-view button').forEach(b=>b.onclick=()=>look(b.dataset.view));
  $('#ctcSkip').onclick=()=>{if(G&&!G.busy&&!G.ending)W.SimRemote.command({type:'tick',seconds:10});};
  $('#ctcSit').onclick=()=>dlg(`<h3>${esc(G.p0.name)}</h3><pre>${esc(G.p0.situation||G.p0.voice||'')}</pre><p class="ctc-hint">관계 열차의 위치는 LS 표시반에서도 확인할 수 있어요.</p>`);
  $('#ctcLog').onclick=()=>dlg('<h3>무전 기록</h3>'+(G.log.map(l=>`<p><b>${esc(l.name)}</b> ${esc(l.text)}</p>`).join('')||'<p>아직 무전이 없어요.</p>'));
  document.addEventListener('keydown',keys,true);
 }
 function keys(e){
  if(!el||el.hidden||!G||document.querySelector('dialog[open]')||e.target.closest?.('input:not([type=checkbox]),textarea,select,[contenteditable]'))return;
  if((e.key===' '||e.key==='Enter')&&advanceFn){e.preventDefault();e.stopPropagation();advanceFn();}
  else if(e.key==='Tab'){e.preventDefault();look(G.view==='mmi'?'ls':'mmi');}
  else if((e.key==='h'||e.key==='H'||e.key==='ㅗ')&&!e.ctrlKey&&!e.metaKey){e.preventDefault();el.classList.toggle('peek');}
 }
 // Two screens, as in a control room: the LS wall display ahead, the MMI terminal on the desk. Tab looks up or down.
 function look(v){if(!G)return;G.view=v;el.classList.toggle('show-mmi',v==='mmi');el.querySelectorAll('.ctc-view button').forEach(b=>b.classList.toggle('on',b.dataset.view===v));if(v==='mmi')$('.ctc-view i').hidden=true;SFX.play('select');if(v==='mmi')mmi(true);else W?.focus();}
 // ── MMI terminal, drawn for the game: the same engine commands as the simulator's MMI (source "MMI").
 const SIG={GO:'go',STOP:'stop'};
 function mmiStations(){const s=W.SimRemote.snapshot.states;return W.SimNetwork.stations.map(x=>x.id).filter(id=>G.used.has(id)&&s[id]);}
 function alarms(){return [...(M?.document||W.document).querySelectorAll('.mmi-alarm #alarmText p')].map(x=>x.textContent.replace(/\s+/g,' ').trim()).filter(t=>!/열차번호 중복/.test(t));}
 function mmi(force){
  const box=$('#ctcTerm');if(!G||!W||(G.view!=='mmi'&&!force))return;
  const snap=W.SimRemote.snapshot,list=mmiStations(),mm=G.mm;if(!list.includes(mm.station))mm.station=list[0]||'';
  const st=mm.station,state=snap.states[st],core=st&&W.SimCore.forStation(st),nm=id=>W.SimNetwork.catalog[id]?.name||id;
  if(!st){box.innerHTML='<p class="mm-empty">이 문제에는 취급역이 없어요.</p>';return;}
  const T=records.hint&&G.target||null,tg=(k,v)=>T&&T[k]?.has(v)?' target':'';
  const sig=JSON.stringify([st,mm.signal,mm.form,mm.msg,G.stepIndex,!!T,list.map(id=>snap.states[id].mode),state.signals,Object.keys(state.routes),snap.ls.stations[st]?.windows,state.logs.length,alarms()]);
  if(sig===mm.sig)return;if(mm.form&&box.contains(document.activeElement)&&document.activeElement.matches('input,select')&&!force)return;mm.sig=sig;
  const kinds={};for(const [id,g] of Object.entries(core.signals))(kinds[g.kind]??=[]).push(id);
  const routes=mm.signal?Object.keys(core.routes).filter(r=>core.routes[r].signal===mm.signal):[];
  const wins=Object.entries(snap.ls.stations[st]?.windows||{}).flatMap(([slot,rows])=>rows.map(r=>({slot,...r})));
  const al=alarms(),f=mm.form;
  const form=f?.type==='rename'?`<div class="mm-form">열차번호 수정 <b>${esc(f.number)}</b> → <input id="mmNew" value="${esc(f.number)}" maxlength="6"><button data-do="rename">적용</button><button data-do="cancel">취소</button></div>`
   :f?.type==='move'?`<div class="mm-form">열차번호 이동 <b>${esc(f.number)}</b> → <select id="mmSt">${W.SimNetwork.stations.filter(x=>W.SimTrainWindows.data[x.id]&&snap.ls.stations[x.id]).map(x=>`<option value="${x.id}"${x.id===(f.to||st)?' selected':''}>${esc(x.name)}</option>`).join('')}</select><select id="mmSlot">${(W.SimTrainWindows.data[f.to||st]||[]).map(w=>`<option>${esc(w.slot)}</option>`).join('')}</select><button data-do="move">이동</button><button data-do="cancel">취소</button></div>`:'';
  box.innerHTML=`<nav class="mm-side"><h4>취급역</h4>${list.map(id=>`<button data-st="${id}" class="${id===st?'on':''}${tg('st',id)}">${esc(nm(id))}<i class="m-${snap.states[id].mode}">${snap.states[id].mode}</i></button>`).join('')}<p>고개를 들면 LS 표시반 (Tab)</p></nav>
  <section class="mm-main"><header><h3>${esc(nm(st))}역 <small>현장설비제어</small></h3><div class="mm-mode">${['AUTO','CCM','LOCAL'].map(m=>`<button data-mode="${m}" class="${state.mode===m?'on':''}${T&&T.st?.has(st)?tg('mode',m):''}">${m}</button>`).join('')}</div></header>
   ${Object.entries(kinds).map(([k,ids])=>`<div class="mm-sigs"><b>${esc(k)}</b>${ids.map(id=>`<button data-sig="${esc(id)}" class="${SIG[state.signals[id]]||'go'}${id===mm.signal?' on':''}${T&&T.st?.has(st)?tg('sig',id):''}">${esc(id)}</button>`).join('')}</div>`).join('')}
   <div class="mm-detail">${mm.signal?`<h4>신호기 ${esc(mm.signal)} <small>${esc(core.signals[mm.signal]?.kind||'')} · 현재 ${state.signals[mm.signal]==='STOP'?'정지':'진행'}</small></h4><button data-do="stop" class="mm-stop${T&&T.st?.has(st)&&T.stop?.has(mm.signal)?' target':''}">■ 신호 정지</button><div class="mm-routes">${routes.map(r=>`<button data-route="${esc(r)}" class="${state.routes[r]?'set':''}${tg('route',r)}">${esc(r)}</button>`).join('')||'<span>이 신호기에서 시작하는 진로가 없어요.</span>'}</div>`:'<p>신호기를 고르면 정지 취급과 진로 설정을 할 수 있어요. (CCM 모드에서만)</p>'}</div>
   <div class="mm-set"><b>설정된 진로</b>${Object.keys(state.routes).map(r=>`<span>${esc(r)}</span>`).join('')||'<span class="none">없음</span>'}</div></section>
  <aside class="mm-right"><h4>열차번호 <small>${esc(nm(st))}역 열번창</small></h4><div class="mm-trains">${wins.map(w=>`<div><b>${esc(w.number)}</b><small>${esc(w.slot)}</small><button class="${tg('num',w.number)}" data-edit="rename" data-uid="${w.uid}" data-slot="${esc(w.slot)}" data-n="${esc(w.number)}">수정</button><button data-edit="move" data-uid="${w.uid}" data-slot="${esc(w.slot)}" data-n="${esc(w.number)}">이동</button><button data-edit="delete" data-uid="${w.uid}" data-slot="${esc(w.slot)}" data-n="${esc(w.number)}">삭제</button></div>`).join('')||'<p>이 역 열번창에 열차가 없어요.</p>'}</div>${form}
   <h4>알람 <small>${al.length}건</small>${al.length?'<button data-do="ack" class="mm-ack">확인</button>':''}</h4><div class="mm-alarms">${al.map(a=>`<p>${esc(a)}</p>`).join('')||'<p class="none">미확인 알람 없음</p>'}</div>
   <h4>이벤트 로그</h4><div class="mm-log">${state.logs.slice(0,7).map(l=>`<p class="${l.result==='완료'?'':'bad'}">${esc(l.message||'')}</p>`).join('')}</div>
   <div class="mm-msg ${mm.bad?'bad':''}">${esc(mm.msg||'')}</div></aside>`;
  const said=r=>{mm.msg=r?.message||'';mm.bad=r?.ok===false;SFX.play(mm.bad?'wrong':'confirm');if(mm.bad)toast('거부됐어요: '+mm.msg,'worry');mm.sig='';mmi(true);update();};
  const ctl=a=>said(W.SimRemote.command({type:'control',station:st,action:{...a,source:'MMI'}})),num=a=>said(W.SimRemote.command({type:'numbers',action:a}));
  box.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{mm.station=b.dataset.st;mm.signal='';mm.form=null;SFX.play('select');mmi(true);});
  box.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>ctl({type:'mode',value:b.dataset.mode}));
  box.querySelectorAll('[data-sig]').forEach(b=>b.onclick=()=>{mm.signal=b.dataset.sig;SFX.play('select');mmi(true);});
  box.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>ctl({type:'route',id:b.dataset.route}));
  box.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{const d=b.dataset;if(d.edit==='delete'){if(confirm(`${d.n} 열차번호를 삭제할까요? (지적확인환호)`))num({op:'delete',station:st,slot:d.slot,uid:d.uid});}else{mm.form={type:d.edit,uid:d.uid,slot:d.slot,number:d.n,to:st};mmi(true);}});
  box.querySelector('#mmSt')?.addEventListener('change',e=>{mm.form.to=e.target.value;mmi(true);});
  box.querySelectorAll('[data-do]').forEach(b=>b.onclick=()=>{const d=b.dataset.do,f=mm.form;
   if(d==='stop')ctl({type:'stop',id:mm.signal});
   else if(d==='cancel'){mm.form=null;mmi(true);}
   else if(d==='rename'){const v=box.querySelector('#mmNew').value.trim().toUpperCase();mm.form=null;num({op:'rename',station:st,slot:f.slot,uid:f.uid,number:v});}
   else if(d==='move'){const to=box.querySelector('#mmSt').value,slot=box.querySelector('#mmSlot').value;mm.form=null;num({op:'move',station:st,slot:f.slot,uid:f.uid,targetStation:to,targetSlot:slot});}
   else if(d==='ack'){const d2=(M?.document||W.document);d2.querySelectorAll('.mmi-alarm #alarmText input[type=checkbox]').forEach(x=>{if(!x.checked)x.click();});d2.querySelector('.mmi-alarm [data-alarm-ok]')?.click();said({ok:true,message:'알람 확인'});}});
 }
 function dlg(html){$('.ctc-dlg-body').innerHTML=html;$('#ctcDlg').showModal();}
 // Role-play face icons (docs/리부트-에셋-생성지침.md) once delivered; until then the standing's head crop.
 const ROLE_FACE={harin:'face_harin_driver',jian:'face_jian_station',instructor:'face_instructor_chief',sangcheol:'face_sangcheol_radio'};
 const has=f=>typeof ART_READY!=='undefined'&&ART_READY.has(f);
 function roleFace(who,name,mood){
  const k=who==='orpheia'&&/복구반|검수반|전기/.test(name||'')?'face_orpheia_engineer':ROLE_FACE[who];if(!k)return '';
  if(mood==='urgent'&&has(k+'_urgent.png'))return k+'_urgent.png';return has(k+'.png')?k+'.png':'';
 }
 function face(box,who,mood='',name=''){
  const icon=roleFace(who,name,mood);
  if(icon){const wrap=box.querySelector('.ctc-face')||box,img=box.querySelector('img');if(wrap!==box){wrap.className='ctc-face';wrap.style.display='';}img.src=asset(icon);return;}
  const f=who==='orpheia'?FACE['orpheia'+(mood&&mood!=='urgent'?'_'+mood:'')]||FACE.orpheia:FACE[who],wrap=box.querySelector('.ctc-face')||box,img=box.querySelector('img');
  if(wrap!==box){wrap.className='ctc-face'+(f&&who!=='orpheia'?' crop crop-'+who:'');wrap.style.display=f?'':'none';}
  if(f)img.src=asset(f);
 }
 // One line of dialogue; resolves when the player advances.
 function say(who,name,text,mood){
  return new Promise(done=>{
   clearInterval(typer);const box=$('.ctc-dialogue');box.hidden=false;face(box,who,mood,name);
   const actor=ACTOR[who]&&name!==ACTOR[who]&&!(who==='instructor'&&/교수/.test(name))?` <small>${esc(ACTOR[who])}</small>`:'';
   $('.ctc-name').innerHTML=esc(name)+actor;$('.ctc-name').className='ctc-name c-'+(who||'self');
   const t=$('.ctc-text'),speed=records.textSpeed??28;let i=0;t.textContent='';$('.ctc-next').hidden=true;
   if(!(who==='orpheia'&&name==='오르페이아'))G.log.push({name,text});
   const next=()=>{advanceFn=null;SFX.play('select');done();};
   const finish=()=>{clearInterval(typer);t.textContent=text;$('.ctc-next').hidden=false;advanceFn=next;};
   if(!speed)return finish();
   advanceFn=finish;
   typer=setInterval(()=>{i++;t.textContent=text.slice(0,i);SFX.blip(who||'narration',text[i-1]);if(i>=text.length)finish();},speed);
  });
 }
 const hush=()=>{$('.ctc-dialogue').hidden=true;advanceFn=null;};
 function toast(text,mood='smile'){const t=$('.ctc-toast');face(t,'orpheia',mood);t.querySelector('span').textContent=text;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.hidden=true,3200);}
 const clock=paused=>W?.SimRemote.command({type:'clock',paused});

 // ── FTS state.
 const session=()=>W.SimRemote.snapshot.fts.session;
 const item=()=>session()?.items[G.index];
 const view=()=>W.SimFTS.view(G.p0,item());
 function hud(){
  if(!G.steps)return;const n=G.steps.length,i=Math.min(G.stepIndex+1,n);
  $('.ctc-step').textContent=`단계 ${i} / ${n}`;
  $('.ctc-score').textContent=G.dec?`첫 시도 ${G.first}/${G.dec}`:'';
 }
 function hintPanel(){
  const box=$('#ctcHintPanel');box.hidden=!records.hint||!G||!!G.scene;if(box.hidden)return;
  const it=item(),od=o=>it.obj?.[o.id]!=null||it.missed?.[o.id]!=null,done=s=>s.comm?it.comm?.[s.comm.id]!=null:s.objs.every(od);
  const rows=G.steps||[],cur=G.steps?.[G.stepIndex];
  const html=`<h4>조치사항 (참고 순서)</h4><ol>${rows.map(s=>`<li class="${done(s)?'done':''}${s===cur?' now':''}"><i>${s.kind==='op'?'🖱':'📻'}</i>${esc(s.comm?label(s.comm):s.text)}</li>`).join('')}</ol><p>힌트를 켜면 정답에 색이 들어가요.</p>`;
  if(box.dataset.html!==html){box.dataset.html=html;box.innerHTML=html;}
 }

 // ── Decisions. One choice at a time in the panel; a wrong pick shows its forecast, is struck out and asked again.
 const written=(said,bad,why)=>`<p class="ctc-said">「${esc(said)}」</p><p>${esc(bad)}</p>${why?`<p class="ctc-why">💡 ${esc(why)}</p>`:''}`;
 async function choose(prompt,title,options,answer,said,ops,mood='serious'){
  G.dec++;let first=true;const struck=new Set(),opts=[...options].sort((a,b)=>hash(a.text+G.p0.id)-hash(b.text+G.p0.id));
  for(;;){
   clock(true);
   const box=$('.ctc-dialogue');box.hidden=false;face(box,'orpheia',struck.size?'worry':mood);advanceFn=null;
   $('.ctc-name').innerHTML='오르페이아';$('.ctc-name').className='ctc-name c-orpheia';$('.ctc-next').hidden=true;
   $('.ctc-text').textContent=struck.size?'예측을 되감았어요. 다시 골라요, 주인님.':prompt;
   const got=await new Promise(res=>{
    const panel=$('#ctcRadioPanel');panel.hidden=false;
    const draw=()=>{panel.innerHTML=`<h4>${esc(title)}</h4>${opts.map((o,k)=>`<button type="button" class="ctc-opt${o.text.length>40?' msg':''}${records.hint&&o.key===answer?' hinted':''}" data-k="${k}" ${struck.has(o.key)?'disabled':''}>${esc(o.text.length>110?o.text.slice(0,109)+'…':o.text)}</button>`).join('')}`;
     panel.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>res(opts[+b.dataset.k]));};
    G.redraw=draw;draw();
   });
   G.redraw=null;$('#ctcRadioPanel').hidden=true;
   if(got.key===answer){if(first)G.first++;SFX.play('select');hud();return got;}
   first=false;struck.add(got.key);G.rewinds++;SFX.play('wrong');hush();
   const fc=$('.ctc-forecast');fc.querySelector('.ctc-fc-body').innerHTML=got.bad?written(got.text,got.bad,got.why):forecast(said(got),said(options.find(o=>o.key===answer)),ops);
   fc.style.backgroundImage=has('ui_forecast_bg.png')?`url(${asset('ui_forecast_bg.png')})`:'';fc.hidden=false;if(typeof BGM!=='undefined')BGM.play('bgm_forecast');
   await new Promise(res=>fc.querySelector('button').onclick=res);
   fc.hidden=true;SFX.play('rewind');if(typeof BGM!=='undefined')BGM.play('bgm_emergency');
  }
 }
 const FALLBACK_WHO=[{key:'all',name:'전 열차 (일제 통보)'},{key:'chief',name:'관제팀장 · 관제운영실'},{key:'사고복구반',name:'사고복구반'},{key:'self',name:'지적확인 환호 (혼잣말)'}];
 async function commStep(c){
  const r=recipient(c),op=opener(c),us=utterances(c.text);
  // incoming: the call plays first, then the reply is the decision
  if(r.incoming){
   await play(c,r,0,op.i);
  }else{
   const later=G.steps.slice(G.stepIndex+1).filter(s=>s.comm).map(s=>recipient(s.comm)),all=G.steps.filter(s=>s.comm).map(s=>recipient(s.comm));
   const pool=[];for(const x of [...later,...all,...FALLBACK_WHO])if(x.key!==r.key&&!x.incoming&&!pool.some(y=>y.key===x.key))pool.push(x);
   const who=[{key:r.key,text:r.name},...pool.slice(0,2).map(x=>({key:x.key,text:x.name}))];
   await choose(cue(c),'📻 누구를 부를까요?',who,r.key,o=>o.text+'에게 무전',false);
  }
  // what to say: this opener vs. openers of other steps (same addressee first, then what comes next)
  const others=G.steps.filter(s=>s.comm&&s.comm.id!==c.id).map(s=>({c:s.comm,r:recipient(s.comm)}));
  const pool=[];const key=t=>t.slice(0,30);
  for(const x of [...others.filter(x=>x.r.key===r.key),...others.slice(Math.max(0,others.findIndex(x=>G.steps.indexOf(G.steps.find(s=>s.comm===x.c))>G.stepIndex))),...others]){const t=opener(x.c).text;if(key(t)!==key(op.text)&&!pool.some(y=>key(y)===key(t)))pool.push(t);}
  const what=[{key:'ok',text:op.text},...pool.slice(0,2).map((t,k)=>({key:'x'+k,text:t}))];
  await choose(r.incoming?`${r.name}의 보고예요. 뭐라고 답할까요?`:`${r.name}에게 무엇을 말할까요?`,r.incoming?'📻 응답':'📻 '+r.name,what,'ok',o=>o.text,false);
  await play(c,r,Math.max(0,op.i));
  W.SimRemote.command({type:'fts',op:'manual',key:'comm:'+c.id,checked:true});update();
 }
 // operation: pick it, then do it
 function mutate(text){
  const names=[...G.used].map(id=>W.SimNetwork.catalog[id]?.name).filter(Boolean),here=names.find(n=>text.includes(n+'역'))||names.find(n=>text.includes(n));
  const out=new Set();
  for(const n of names)if(here&&n!==here)out.add(text.replace(here,n));
  const st=[...G.used].find(id=>W.SimNetwork.catalog[id]?.name===here),sigs=st?Object.keys(W.SimCore.forStation(st).signals):[];
  const tok=text.match(/\b(\d+[A-Z])\b/);
  if(tok)for(const x of sigs.filter(x=>/^\d+[A-Z]$/.test(x)&&x!==tok[1]).sort((a,b)=>hash(a+text)-hash(b+text)).slice(0,3))out.add(text.replace(tok[1],x));
  if(/CCM 전환/.test(text))out.add(text.replace('CCM','LOCAL'));if(/AUTO/.test(text))out.add(text.replace('AUTO','LOCAL'));
  out.delete(text);return [...out].sort((a,b)=>hash(a+G.p0.id)-hash(b+G.p0.id));
 }
 function targets(objs){
  const T={st:new Set(),mode:new Set(),sig:new Set(),stop:new Set(),route:new Set(),num:new Set()};
  const walk=c=>{if(!c)return;if(c.station)T.st.add(c.station);
   if(c.type==='event'&&c.eventType==='mode'||c.type==='mode')T.mode.add(c.value);
   if(c.type==='signalCancelled'||c.type==='signalStop'){T.sig.add(c.signal);T.stop.add(c.signal);}
   if(c.type==='route'){T.route.add(c.route);T.sig.add(c.route.split('-')[0]);}
   if(c.number)T.num.add(c.number);if(c.from)T.num.add(c.from);
   (c.conditions||[]).forEach(walk);walk(c.condition);};
  for(const o of objs)walk(o.condition);return T;
 }
 async function opStep(s,quiz=true){
  const done=()=>{const it=item();return s.objs.every(o=>it.obj?.[o.id]!=null||it.missed?.[o.id]!=null);};
  if(quiz&&!done()){
   const wrong=mutate(s.text).slice(0,2);
   if(wrong.length)await choose(pick(['LS를 봐요. 이제 손을 쓸 차례예요. 지금 필요한 조작은?','무전만으로는 열차가 멈추지 않아요. 어떤 조작이 필요할까요?','설비를 만질 차례예요. 무엇을 할까요?'],hash(s.text)),'🖱 필요한 조작은?',[{key:'ok',text:s.text},...wrong.map((t,k)=>({key:'x'+k,text:t}))],'ok',o=>o.text,true);
   await say('orpheia','오르페이아',/접근쇄정/.test(s.text)?'접근쇄정이 풀릴 때까지 기다려야 해요. 위쪽 「+10초」로 시간을 넘길 수 있어요.':pick(['좋아요! 그럼 직접 해 주세요. MMI 단말은 Tab이에요.','맞아요. LS나 MMI에서 직접 취급해 주세요!'],hash(s.text)),'smile');hush();
  }
  G.target=targets(s.objs);if(records.hint&&G.target.st.size){G.mm.station=[...G.target.st][0];G.mm.signal='';}G.mm.sig='';mmi();
  const task=$('.ctc-task');task.innerHTML=`🖱 <b>${esc(s.text)}</b><small>LS 표시반 또는 MMI 단말(Tab)에서 직접 조작하세요</small>`;task.hidden=done();
  clock(false);G.busy=false;
  while(G&&!done())await new Promise(r=>setTimeout(r,250));
  if(!G)return;G.busy=true;task.hidden=true;G.target=null;G.mm.sig='';mmi();
 }

 // ── Written scenes (story/ctc/drill-*.js). A scene replaces the generated steps with authored beats:
 //  say    {t:'say',lines:[[who,name,text,mood]…]}
 //  choice {t:'choice',ask,opts:[{text,ok:true,then:[lines]},{text,bad:'what follows',why:'the lesson'}…]}
 //  board  {t:'board',ask,places:[…],rows:[{train,act:'stop|caution|hold|run',at,bad:{…}}],then:[lines]}  (train control sheet; the LS stays in view)
 //  ops    {t:'ops',text,objs:[objective ids]}   (done by hand on the LS or the MMI terminal)
 //  comm   {t:'comm',ids:[…]}                    (records communications in FTS so their reactions happen on the LS)
 const SCENES={};
 const NAMES={harin:'기관사',jian:'역',instructor:'서도희 교수',orpheia:'오르페이아',sangcheol:'신상철 · 관제'};
 async function lines(list){clock(true);for(const [who,name,text,mood] of list||[]){SFX.play(who==='sangcheol'?'transmit':who==='orpheia'&&!name?'select':'radio');await say(who,name||NAMES[who],text,mood);}hush();}
 const ACTS={stop:'역에 정차',caution:'주의운전',hold:'3분 추가 정차',run:'그대로 운행'};
 async function board(b){
  G.dec++;let first=true;hush();clock(true);const panel=$('#ctcRadioPanel'),val={};
  for(;;){
   const bad=await new Promise(res=>{
    panel.hidden=false;panel.classList.add('board');
    const draw=()=>{panel.innerHTML=`<h4>🚦 열차 통제 지시판</h4><p class="ctc-sub">${esc(b.ask)}</p>${b.rows.map((r,k)=>{const v=val[r.train]||{};return `<div class="ctc-row"><b>${esc(r.train)}</b><select data-k="${k}" data-f="act"><option value="">지시…</option>${Object.entries(ACTS).map(([a,t])=>`<option value="${a}"${v.act===a?' selected':''}>${t}</option>`).join('')}</select><select data-k="${k}" data-f="at"${v.act==='stop'?'':' hidden'}><option value="">어느 역…</option>${b.places.map(x=>`<option${v.at===x?' selected':''}>${esc(x)}</option>`).join('')}</select>${records.hint?`<small>힌트 · ${ACTS[r.act]}${r.at?' · '+esc(r.at):''}</small>`:''}</div>`;}).join('')}<button type="button" class="ctc-opt go">📻 이대로 지시한다</button><button type="button" class="ctc-back">◀▶ 지시판 옮기기</button><p>LS 아래쪽 역 버튼으로 화면을 넘기며 열차 위치를 찾아요.</p>`;
     panel.querySelectorAll('select').forEach(x=>x.onchange=()=>{const r=b.rows[+x.dataset.k];(val[r.train]??={})[x.dataset.f]=x.value;if(x.dataset.f==='act')draw();});
     panel.querySelector('.ctc-back').onclick=()=>panel.classList.toggle('left');
     panel.querySelector('.go').onclick=()=>{
      const blank=b.rows.find(r=>!val[r.train]?.act||val[r.train].act==='stop'&&!val[r.train].at);if(blank){toast(`${blank.train}열차 지시가 비어 있어요.`,'worry');return;}
      res(b.rows.find(r=>val[r.train].act!==r.act||r.act==='stop'&&val[r.train].at!==r.at)||null);};};
    G.redraw=draw;draw();
   });
   G.redraw=null;panel.hidden=true;panel.classList.remove('board','left');
   if(!bad){if(first)G.first++;SFX.play('correct');hud();break;}
   first=false;G.rewinds++;SFX.play('wrong');
   const v=val[bad.train],msg=(v.act===bad.act?bad.bad.place:bad.bad[v.act])||bad.bad.other||'',said=`${bad.train}열차 — ${ACTS[v.act]}${v.act==='stop'?' ('+v.at+')':''}`;
   const fc=$('.ctc-forecast');fc.querySelector('.ctc-fc-body').innerHTML=written(said,msg.replaceAll('{at}',v.at||''),bad.bad.why);
   fc.style.backgroundImage=has('ui_forecast_bg.png')?`url(${asset('ui_forecast_bg.png')})`:'';fc.hidden=false;if(typeof BGM!=='undefined')BGM.play('bgm_forecast');
   await new Promise(res=>fc.querySelector('button').onclick=res);
   fc.hidden=true;SFX.play('rewind');if(typeof BGM!=='undefined')BGM.play('bgm_emergency');delete val[bad.train];
  }
  await lines(b.then);
 }
 async function runScene(sc){
  const beats=sc.beats;G.steps=beats.filter(b=>['choice','board','ops'].includes(b.t)).map(b=>({kind:b.t,beat:b}));G.stepIndex=0;hud();
  for(const b of beats){
   if(!G)return;while(G.queue.length)await branch(G.queue.shift());
   const k=G.steps.findIndex(s=>s.beat===b);if(k>=0){G.stepIndex=k;hud();}
   if(b.t==='say')await lines(b.lines);
   else if(b.t==='choice'){const opts=b.opts.map((o,i)=>({...o,key:o.ok?'ok':'x'+i}));const got=await choose(b.ask,b.title||'어떻게 할까요?',opts,'ok',o=>o.text,false);await lines(got.then);}
   else if(b.t==='board')await board(b);
   else if(b.t==='ops'){const objs=b.objs.map(id=>view().objectives.find(o=>o.id===id)).filter(Boolean);hush();await opStep({text:b.text,objs},false);if(G){SFX.play('correct');}}
   else if(b.t==='comm'){for(const id of b.ids)W.SimRemote.command({type:'fts',op:'manual',key:'comm:'+id,checked:true});clock(false);await new Promise(r=>setTimeout(r,b.wait??700));update();}
  }
  if(!G)return;G.stepIndex=G.steps.length-1;
  clock(false);for(let k=0;k<24&&G&&item().status==='진행';k++)await new Promise(r=>setTimeout(r,250));
  if(!G)return;if(item().status==='진행')W.SimRemote.command({type:'fts',op:'next'});
  await finish(item().status);
 }

 // The clock stops while people talk. A stop order asks where: the answer is on the LS (or in 📋 상황).
 async function play(c,r,from=0,to=Infinity){
  clock(true);
  const lines=exchange(c,r).slice(from,to),stops=lines.filter(l=>l.who==='sangcheol').map(l=>l.text.match(/^([A-Z]\d{3,4})\s*열차\s*([가-힣]+역)\s*정차/)).filter(Boolean),places=[...new Set(stops.map(m=>m[2]))];
  for(const [k,line] of lines.entries()){
   const m=line.who==='sangcheol'&&places.length>1&&line.text.match(/^([A-Z]\d{3,4})\s*열차\s*([가-힣]+역)\s*정차/);
   if(m)await ask(`${m[1]}열차를 어디에 세울까요?`,places,m[2]);
   SFX.play(line.who==='sangcheol'?'transmit':'radio');await say(line.who,line.name,line.text,line.who!=='sangcheol'&&(k===0&&c===G.p0.communications[0]||/비상|화재|연기|충돌|침수|사상/.test(line.text))?'urgent':'');
  }
  hush();
 }
 async function ask(question,options,answer){
  const opts=[...options].sort((a,b)=>hash(a+question)-hash(b+question));G.dec++;let first=true;
  for(;;){
   const got=await new Promise(res=>{
    const box=$('.ctc-dialogue');box.hidden=false;face(box,'orpheia','serious');advanceFn=null;
    $('.ctc-name').innerHTML='오르페이아';$('.ctc-name').className='ctc-name c-orpheia';$('.ctc-next').hidden=true;
    $('.ctc-text').innerHTML=`${esc(question)} <small>(LS에서 열차 위치를 확인하세요)</small><span class="ctc-ask">${opts.map(o=>`<button type="button" class="${records.hint&&o===answer?'hinted':''}">${esc(o)}</button>`).join('')}</span>`;
    $('.ctc-text').querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();res(b.textContent);});
   });
   if(got===answer){if(first)G.first++;SFX.play('correct');hud();return;}
   first=false;G.wrong++;SFX.play('wrong');await say('orpheia','오르페이아',`${got}이 아니에요, 주인님. 그 열차가 지금 어디 있는지 LS를 다시 봐요!`,'worry');
  }
 }

 // ── Watch the FTS: recognised operations, situation changes, the end.
 function update(){
  if(!G||!W?.SimRemote?.snapshot?.fts)return;const s=session(),it=item();if(!s||!it)return;
  hud();hintPanel();mmi();
  if(W.SimFTSUI?.problemOpen?.())W.SimFTSUI.closeProblem();
  // the scripted cast starts stacked in one train window, which the MMI reports as "열차번호 중복": not the player's doing
  const ps=[...(M?.document||W.document).querySelectorAll('.mmi-alarm:not([hidden]) #alarmText p')];if(ps.length&&ps.every(x=>/열차번호 중복/.test(x.textContent)))W.SimMMI.clearAlarms();
  else if(ps.some(x=>!/열차번호 중복/.test(x.textContent))&&G.view!=='mmi'&&$('.ctc-view i').hidden){$('.ctc-view i').hidden=false;if(!G.busy)toast('MMI 단말에 알람이 떴어요! (Tab)','worry');}
  const p=view();
  for(const o of p.objectives){const done=it.obj?.[o.id]!=null;if(done&&!G.seen.has(o.id)){G.seen.add(o.id);if(!G.busy&&!G.ending){SFX.play('correct');toast('조작 확인! '+o.label);}}else if(!done&&o.final)G.seen.delete(o.id);}
  for(const b of G.p0.branches||[])if(it.branch?.[b.id]!=null&&!G.branches.has(b.id)){G.branches.add(b.id);G.queue.push(b);}
 }
 async function branch(b){
  clock(true);SFX.play('alarm');
  await say('instructor','서도희 교수','상황 변경. '+String(b.text||b.label).split('\n')[0].replace(/^[\s▪•·-]+/,''));
  await say('orpheia','오르페이아','또?! ……주인님, 대본과 달라졌어요. 상황을 다시 확인해요!','worry');hush();
  // the branch brings its own items: add the ones not yet done as steps after the current one
  const it=item(),p=view(),have=new Set(G.steps.flatMap(s=>s.comm?['c:'+s.comm.id]:s.objs.map(o=>'o:'+o.id))),add=[];
  for(const c of p.communications)if(!have.has('c:'+c.id)&&it.comm?.[c.id]==null)add.push({kind:'comm',comm:c});
  for(const o of p.objectives)if(!have.has('o:'+o.id)&&it.obj?.[o.id]==null)add.push({kind:'op',text:o.label,objs:[o]});
  G.steps.splice(G.stepIndex+1,0,...add);
 }
 async function run(){
  for(G.stepIndex=0;G&&G.stepIndex<G.steps.length;G.stepIndex++){
   while(G.queue.length)await branch(G.queue.shift());
   const s=G.steps[G.stepIndex],it=item();hud();hintPanel();
   if(s.kind==='comm'){if(it.comm?.[s.comm.id]==null)await commStep(s.comm);}
   else await opStep(s);
   if(!G)return;
  }
  // let the last reactions play out, then close the problem
  clock(false);for(let k=0;k<40&&G&&item().status==='진행';k++)await new Promise(r=>setTimeout(r,250));
  if(!G)return;if(item().status==='진행')W.SimRemote.command({type:'fts',op:'next'});
  await finish(item().status);
 }
 async function finish(status){
  G.ending=true;$('#ctcRadioPanel').hidden=true;G.busy=true;clock(true);
  const it=item(),p=view(),mo=p.objectives.filter(o=>it.obj?.[o.id]==null&&it.missed?.[o.id]==null),mc=p.communications.filter(c=>it.comm?.[c.id]==null);
  const ratio=G.dec?G.first/G.dec:1,rank=ratio===1&&!G.hinted?'S':ratio>=.9?'A':ratio>=.75?'B':'C';
  const R={id:G.id,title:G.scene?.title||p.name,rank,firstTry:G.first,decisions:G.dec,score:it.score??0,status,rewinds:G.rewinds,wrong:G.wrong,hint:G.hinted,
   missed:G.scene?[]:[...mo.map(o=>'🖱 '+o.label),...mc.map(c=>'📻 '+label(c))],deductions:(p.deductions||[]).filter((d,i)=>it.deducted?.[i]).map(d=>d.label)};
  SFX.play('clear');
  await say('instructor','서도희 교수',rank==='S'?'……한 번도 안 틀렸네요. 거기까지.':rank==='A'?'거기까지. 거의 완벽해요.':rank==='B'?'거기까지. 흐름은 잡았어요. 되감은 곳을 복습해요.':'거기까지. 순서가 아직 몸에 안 붙었어요. 다시 해 봐요.');
  await say('orpheia','오르페이아',rank==='S'?'랭크 S! 완벽해요, 주인님♪ 예측 연산을 한 번도 안 썼어요!':rank==='A'?'랭크 A예요! 거의 다 맞히셨어요♪':rank==='B'?'랭크 B! 되감은 곳만 다시 보면 금방이에요.':'랭크 C…… 괜찮아요. 처음엔 다 그래요. 같이 다시 해요!',rank<'C'?'smile':'worry');
  close(R);
 }
 function close(R){
  clearInterval(tick);clearInterval(typer);clearTimeout(toastTimer);el.hidden=true;document.body.classList.remove('in-ctc');
  try{W?.SimRemote.command({type:'fts',op:'stop'});}catch{}
  frame.src='about:blank';W=null;M=null;G=null;advanceFn=null;el.classList.remove('show-mmi');onDone?.(R);
 }

 // ── Start: a fresh simulator, then the FTS problem.
 // `id` is a script id (yongsan-5, em-05-1 …), a problem id (P-…) or an FTS scenario id (SC-…).
 function start(id,done){
  if(!el)build();onDone=done;el.hidden=false;el.classList.remove('peek');document.body.classList.add('in-ctc');
  $('#ctcHint').checked=!!records.hint;$('.ctc-loading').hidden=false;el.classList.remove('show-mmi');el.querySelectorAll('.ctc-view button').forEach(b=>b.classList.toggle('on',b.dataset.view==='ls'));$('.ctc-view i').hidden=true;
  const old=$('#ctcMMI'),fresh=document.createElement('iframe');fresh.id='ctcMMI';fresh.title=old.title;old.replaceWith(fresh);
  for(const s of ['.ctc-dialogue','#ctcRadioPanel','#ctcHintPanel','.ctc-toast','.ctc-forecast','.ctc-hud','.ctc-task'])$(s).hidden=true;
  if(typeof BGM!=='undefined')BGM.play('bgm_emergency');
  frame.onload=()=>{
   W=frame.contentWindow;if(!W||!/ctc\/index/.test(W.location.href)){W=null;return;}let tries=0;
   const wait=setInterval(()=>{
    if(!W?.SimRemote?.snapshot?.ftsLibrary){if(++tries>300){clearInterval(wait);fail('시뮬레이터를 불러오지 못했어요.');}return;}
    clearInterval(wait);begin(id).catch(e=>{console.error(e);fail(e.message);});
   },50);
  };
  frame.src='ctc/index.html?embed=1&t='+Date.now();
 }
 async function begin(id){
  const lib=W.SimRemote.snapshot.ftsLibrary,pid=id.startsWith('P-')?id:'P-'+id;
  const single=s=>{const st=s.situations.length===1&&lib.situations.find(x=>x.id===s.situations[0]);return st&&st.problems.length===1&&st.problems[0]===pid;};
  const sc=lib.scenarios.find(s=>s.id===id)||lib.scenarios.find(single);
  if(!sc)throw Error('알 수 없는 문제: '+id);
  // decisions are not timed: give the problem a long limit so FTS never closes it on the clock
  const relaxed=structuredClone(lib),ids=new Set(relaxed.situations.filter(x=>sc.situations.includes(x.id)).flatMap(x=>x.problems));
  for(const x of relaxed.problems)if(ids.has(x.id))x.limit=Math.max(x.limit||0,7200);for(const x of relaxed.situations)if(sc.situations.includes(x.id)&&x.limit)x.limit=Math.max(x.limit,7200);
  W.SimRemote.command({type:'fts',op:'library',library:relaxed});
  const r=W.SimRemote.command({type:'fts',op:'start',scenario:sc.id,professor:'001',student:'tester'});
  if(!r?.ok)throw Error(r?.message||'교육을 시작하지 못했어요.');
  clock(true);
  const runLib=W.SimRemote.snapshot.ftsRunLibrary||lib,s=W.SimRemote.snapshot.fts.session,p0=runLib.problems.find(p=>p.id===s.items[0].problem);
  G={id,view:'ls',index:0,p0,wrong:0,mm:{station:'',signal:'',form:null,msg:''},log:[],seen:new Set(),branches:new Set(),queue:[],rewinds:0,dec:0,first:0,hinted:!!records.hint,stepIndex:0,busy:true,ending:false};
  G.order=order(p0);G.steps=stepsFor(p0);
  const station=p0.setup?.trains?.[0]?.station||p0.setup?.reset?.[0];
  if(station)W.document.querySelector(`#stationTabs [data-view="${station}"]`)?.click();
  const onKey=e=>{if(!e.target.closest?.('input:not([type=checkbox]),textarea,select,[contenteditable]'))keys(e);};
  W.document.addEventListener('keydown',onKey,true);
  // The simulator can move its MMI into another window (its LS/MMI split); here that window is the second screen.
  M=$('#ctcMMI').contentWindow;W.open=()=>M;W.SimWorkspace.detach();M.document.addEventListener('keydown',onKey,true);
  
  // Game skin: the HUD above replaces the simulator's own top bar, and only this problem's stations keep a tab.
  const used=G.used=new Set([...JSON.stringify(p0).matchAll(/"(?:station|targetStation)":"([\w-]+)"/g)].map(m=>m[1]));
  const st=W.document.createElement('style');st.textContent='.ls-topbar,#extraLSBtn{display:none!important}'+(used.size<2?'.ctc-one-station{display:none!important}':'')+(used.size?`#stationTabs [data-view]${[...used].map(x=>`:not([data-view="${x}"])`).join('')}{display:none!important}`:'');W.document.head.appendChild(st);W.document.querySelector('.ls-bottom')?.classList.add('ctc-one-station');
  $('.ctc-title').textContent=SCENES[id]?.title||p0.name;
  $('.ctc-loading').hidden=true;$('.ctc-hud').hidden=false;$('.ctc-task').hidden=true;hud();hintPanel();
  tick=setInterval(update,300);
  // Briefing with the clock paused: the report, the problem, then the floor is the player's.
  SFX.play('alarm');
  const first=p0.communications[0],fr=first&&recipient(first),train=p0.setup?.trains?.[0]?.number;
  if(!SCENES[id]){if(!fr?.incoming&&train&&/고장/.test(p0.voice||''))await say('harin',`${train} 기관사`,`철도관제, ${train}열차 이상! 차량고장으로 정상 운행이 어렵습니다. 이상!`,'urgent');
  await say('instructor','서도희 교수',`문제. 「${p0.name}」 관계 열차는 LS와 📋 상황에서 확인하세요.`);}
  const scene=SCENES[id];
  if(scene){G.scene=scene;hush();return runScene(scene).catch(e=>{console.error(e);fail(e.message);});}
  await say('orpheia','오르페이아',`조치는 ${G.steps.length}단계예요. 단계마다 누구에게 무엇을 말할지, 어떤 조작을 할지 골라요. 틀리면 그 미래를 보여 드리고 되감을게요!`,'serious');
  hush();run().catch(e=>{console.error(e);fail(e.message);});
 }
 function fail(msg){$('.ctc-loading').hidden=true;G=G||{log:[]};say('orpheia','오르페이아',msg+' 이야기로 돌아갈게요.','worry').then(()=>close({id:'',error:msg}));}
 // Test helpers.
 return {start,look,scene:(id,def)=>{SCENES[id]=def;},mmi:()=>M,debug:()=>G&&{view:G.view,p:view(),item:item(),order:G.order,steps:G.steps,stepIndex:G.stepIndex,busy:G.busy,ending:G.ending,talking:!!advanceFn,choosing:!$('#ctcRadioPanel').hidden,task:!$('.ctc-task').hidden,target:G.target},frame:()=>W,recipient,label,opener};
})();
