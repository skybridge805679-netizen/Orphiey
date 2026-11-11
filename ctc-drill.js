'use strict';
// CTC drills — the CTC LAB simulator (ctc/, same-origin iframe) fills the screen and its FTS (the instructor's
// exam controller) runs the problem: free-order objectives on the real LS/MMI, communications, situation
// reactions (trains move), the time limit and the score sheet. This layer is the radio and the cast:
//  · 📻 radio (R): the player decides whom to call and what to say; the cast answers as the other side
//    (유하린 the drivers, 류지안 the stations, 서도희 the chief controller and operations room, ORPHEIA the
//    recovery and inspection teams), then FTS records the communication and its reaction happens on the LS.
//  · A go-ahead ("신호 확인하고 진입…") sent before its operations are done is the dangerous mistake:
//    it plays out as a 0.3-second forecast and is rewound.
//  · The dialogue box is translucent, sits over the LS and shows only while someone is speaking.
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
 const GO=/신호 확인|진입하|발차|출발하|운행 재개|운행하세요/;
 function unmetBefore(c){
  if(!G.order.ok)return null;const it=item();
  for(const s of G.order.seq){if(s.comm?.id===c.id)return null;const o=(s.objs||[]).find(o=>!o.final&&it.obj?.[o.id]==null&&it.missed?.[o.id]==null);if(o)return o;}
  return null;
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
 function forecast(c,need){
  const p=G.p0,place=(p.name.match(/([가-힣]+역)/)||[])[1]||'현장',train=(c.text.match(/([A-Z]\d{3,4})/)||[])[1]||'그 열차',short=t=>t.length>70?t.slice(0,69)+'…':t;
  const future=pick(FUTURE[group(p)],hash(c.id+p.id+G.rewinds)).replaceAll('{역}',place).replaceAll('{열차}',train);
  return `<p class="ctc-said">「${esc(short(label(c)))}」</p><p>— 그런데 아직 <b>${esc(need.label)}</b>이(가) 끝나지 않았다.</p><p>${esc(future)}</p>`;
 }

 // ── Screen.
 function build(){
  el=document.createElement('section');el.id='ctcDrill';el.hidden=true;
  el.innerHTML=`<div class="ctc-screens"><iframe id="ctcFrame" title="LS 대형표시반"></iframe><iframe id="ctcMMI" title="MMI (원본, 숨김)"></iframe><div class="ctc-mmi" id="ctcTerm"></div></div>
  <div class="ctc-loading" hidden><img src="${asset(FACE.orpheia_smile)}" alt=""><p>LS 기동 중이에요… 잠시만요, 주인님!</p></div>
  <div class="ctc-hud"><button type="button" id="ctcRadio" class="ctc-radio" title="무전 (R)">📻 무전 <kbd>R</kbd></button>
   <span class="ctc-view" role="tablist"><button type="button" data-view="ls" class="on" title="앞쪽 대형표시반 (Tab)">▲ LS 표시반</button><button type="button" data-view="mmi" title="책상 위 관제 단말 (Tab)">▼ MMI 단말<i hidden>!</i></button></span>
   <span class="ctc-title"></span><span class="ctc-score" title="FTS 채점"></span><span class="ctc-time" title="문제 제한시간"></span><span class="ctc-count"></span>
   <button type="button" id="ctcSkip" title="시간을 10초 넘깁니다 (접근쇄정 대기 등)">+10초</button><button type="button" id="ctcSit">📋 상황</button><label><input type="checkbox" id="ctcHint"> 힌트</label><button type="button" id="ctcLog">기록</button><button type="button" id="ctcSubmit">제출</button></div>
  <aside class="ctc-panel" id="ctcRadioPanel" hidden></aside>
  <aside class="ctc-panel left" id="ctcHintPanel" hidden></aside>
  <div class="ctc-toast" hidden><img alt=""><span></span></div>
  <div class="ctc-dialogue" hidden><div class="ctc-face"><img alt=""></div><div class="ctc-talk"><div class="ctc-name"></div><div class="ctc-text"></div></div><div class="ctc-next">▼</div></div>
  <div class="ctc-forecast" hidden><div class="ctc-fc-box"><small>0.3초 예측 연산</small><h3>그 무전이 나간 미래</h3><div class="ctc-fc-body"></div><button type="button" class="primary">↺ 되감기</button></div></div>
  <dialog id="ctcDlg"><div class="ctc-dlg-body"></div><form method="dialog"><button class="primary">닫기</button></form></dialog>`;
  document.body.appendChild(el);frame=$('#ctcFrame');
  $('.ctc-dialogue').addEventListener('click',()=>advanceFn?.());
  $('#ctcHint').onchange=e=>{records.hint=e.target.checked;save();hintPanel();if(!$('#ctcRadioPanel').hidden)radio(G.radioKey);};
  $('#ctcRadio').onclick=()=>toggleRadio();
  el.querySelectorAll('.ctc-view button').forEach(b=>b.onclick=()=>look(b.dataset.view));
  $('#ctcSkip').onclick=()=>{if(G&&!G.busy&&!G.ending)W.SimRemote.command({type:'tick',seconds:10});};
  $('#ctcSit').onclick=()=>dlg(`<h3>${esc(G.p0.name)}</h3><pre>${esc(G.p0.situation||G.p0.voice||'')}</pre><p class="ctc-hint">제한시간 ${Math.round(G.p0.limit/60)}분 · 조작과 통보의 순서는 관제사가 상황을 보고 정합니다. 빠뜨린 항목은 감점됩니다.</p>`);
  $('#ctcLog').onclick=()=>dlg('<h3>무전 기록</h3>'+(G.log.map(l=>`<p><b>${esc(l.name)}</b> ${esc(l.text)}</p>`).join('')||'<p>아직 무전이 없어요.</p>'));
  $('#ctcSubmit').onclick=()=>{if(G&&!G.ending&&!G.busy&&confirm('지금 상태로 제출할까요? 남은 항목은 감점됩니다.'))W.SimRemote.command({type:'fts',op:'next'});};
  document.addEventListener('keydown',keys,true);
 }
 function keys(e){
  if(!el||el.hidden||!G||document.querySelector('dialog[open]')||e.target.closest?.('input:not([type=checkbox]),textarea,select,[contenteditable]'))return;
  if((e.key===' '||e.key==='Enter')&&advanceFn){e.preventDefault();e.stopPropagation();advanceFn();}
  else if((e.key==='r'||e.key==='R'||e.key==='ㄱ')&&!e.ctrlKey&&!e.metaKey&&!advanceFn){e.preventDefault();toggleRadio();}
  else if(e.key==='Tab'){e.preventDefault();look(G.view==='mmi'?'ls':'mmi');}
  else if(e.key==='Escape'&&!$('#ctcRadioPanel').hidden){toggleRadio(false);}
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
  const sig=JSON.stringify([st,mm.signal,mm.form,mm.msg,list.map(id=>snap.states[id].mode),state.signals,Object.keys(state.routes),snap.ls.stations[st]?.windows,state.logs.length,alarms()]);
  if(sig===mm.sig)return;if(mm.form&&box.contains(document.activeElement)&&document.activeElement.matches('input,select')&&!force)return;mm.sig=sig;
  const kinds={};for(const [id,g] of Object.entries(core.signals))(kinds[g.kind]??=[]).push(id);
  const routes=mm.signal?Object.keys(core.routes).filter(r=>core.routes[r].signal===mm.signal):[];
  const wins=Object.entries(snap.ls.stations[st]?.windows||{}).flatMap(([slot,rows])=>rows.map(r=>({slot,...r})));
  const al=alarms(),f=mm.form;
  const form=f?.type==='rename'?`<div class="mm-form">열차번호 수정 <b>${esc(f.number)}</b> → <input id="mmNew" value="${esc(f.number)}" maxlength="6"><button data-do="rename">적용</button><button data-do="cancel">취소</button></div>`
   :f?.type==='move'?`<div class="mm-form">열차번호 이동 <b>${esc(f.number)}</b> → <select id="mmSt">${W.SimNetwork.stations.filter(x=>W.SimTrainWindows.data[x.id]&&snap.ls.stations[x.id]).map(x=>`<option value="${x.id}"${x.id===(f.to||st)?' selected':''}>${esc(x.name)}</option>`).join('')}</select><select id="mmSlot">${(W.SimTrainWindows.data[f.to||st]||[]).map(w=>`<option>${esc(w.slot)}</option>`).join('')}</select><button data-do="move">이동</button><button data-do="cancel">취소</button></div>`:'';
  box.innerHTML=`<nav class="mm-side"><h4>취급역</h4>${list.map(id=>`<button data-st="${id}" class="${id===st?'on':''}">${esc(nm(id))}<i class="m-${snap.states[id].mode}">${snap.states[id].mode}</i></button>`).join('')}<p>고개를 들면 LS 표시반 (Tab)</p></nav>
  <section class="mm-main"><header><h3>${esc(nm(st))}역 <small>현장설비제어</small></h3><div class="mm-mode">${['AUTO','CCM','LOCAL'].map(m=>`<button data-mode="${m}" class="${state.mode===m?'on':''}">${m}</button>`).join('')}</div></header>
   ${Object.entries(kinds).map(([k,ids])=>`<div class="mm-sigs"><b>${esc(k)}</b>${ids.map(id=>`<button data-sig="${esc(id)}" class="${SIG[state.signals[id]]||'go'}${id===mm.signal?' on':''}">${esc(id)}</button>`).join('')}</div>`).join('')}
   <div class="mm-detail">${mm.signal?`<h4>신호기 ${esc(mm.signal)} <small>${esc(core.signals[mm.signal]?.kind||'')} · 현재 ${state.signals[mm.signal]==='STOP'?'정지':'진행'}</small></h4><button data-do="stop" class="mm-stop">■ 신호 정지</button><div class="mm-routes">${routes.map(r=>`<button data-route="${esc(r)}" class="${state.routes[r]?'set':''}">${esc(r)}</button>`).join('')||'<span>이 신호기에서 시작하는 진로가 없어요.</span>'}</div>`:'<p>신호기를 고르면 정지 취급과 진로 설정을 할 수 있어요. (CCM 모드에서만)</p>'}</div>
   <div class="mm-set"><b>설정된 진로</b>${Object.keys(state.routes).map(r=>`<span>${esc(r)}</span>`).join('')||'<span class="none">없음</span>'}</div></section>
  <aside class="mm-right"><h4>열차번호 <small>${esc(nm(st))}역 열번창</small></h4><div class="mm-trains">${wins.map(w=>`<div><b>${esc(w.number)}</b><small>${esc(w.slot)}</small><button data-edit="rename" data-uid="${w.uid}" data-slot="${esc(w.slot)}" data-n="${esc(w.number)}">수정</button><button data-edit="move" data-uid="${w.uid}" data-slot="${esc(w.slot)}" data-n="${esc(w.number)}">이동</button><button data-edit="delete" data-uid="${w.uid}" data-slot="${esc(w.slot)}" data-n="${esc(w.number)}">삭제</button></div>`).join('')||'<p>이 역 열번창에 열차가 없어요.</p>'}</div>${form}
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
  const it=item(),p=view(),task=W.SimRemote.snapshot.assessment?.task,rem=Math.max(0,Math.round(task?.remaining??0));
  $('.ctc-score').textContent=`${it?.score??0}점`;
  $('.ctc-time').textContent=`⏱ ${String(Math.floor(rem/60)).padStart(2,'0')}:${String(rem%60).padStart(2,'0')}`;$('.ctc-time').classList.toggle('low',rem<60);
  const od=p.objectives.filter(o=>it?.obj?.[o.id]!=null).length,cd=p.communications.filter(c=>it?.comm?.[c.id]!=null).length;
  $('.ctc-count').textContent=`조작 ${od}/${p.objectives.length} · 통보 ${cd}/${p.communications.length}`;
 }
 function hintPanel(){
  const box=$('#ctcHintPanel');box.hidden=!records.hint||!G;if(box.hidden)return;
  const it=item(),p=view(),od=o=>it.obj?.[o.id]!=null,done=s=>s.comm?it.comm?.[s.comm.id]!=null:s.objs?.length?s.objs.every(od):!!s.obj&&od(s.obj);
  const rows=G.order.ok?[...G.order.seq,...G.order.rest.map(o=>({kind:'조작',obj:o}))]:[...p.objectives.map(o=>({kind:'조작',obj:o})),...p.communications.map(c=>({kind:'통보',comm:c}))];
  const firstOpen=rows.find(s=>!done(s));
  const html=`<h4>조치사항 (참고 순서)</h4><ol>${rows.map(s=>`<li class="${done(s)?'done':''}${s===firstOpen?' now':''}"><i>${s.kind==='조작'?'🖱':'📻'}</i>${esc(s.comm?label(s.comm):s.obj?s.obj.label:s.text)}</li>`).join('')}</ol><p>순서는 예시예요. 상황을 보고 주인님이 정하세요.</p>`;
  if(box.dataset.html!==html){box.dataset.html=html;box.innerHTML=html;}
 }

 // ── Radio: whom → what.
 function toggleRadio(on){const box=$('#ctcRadioPanel'),open=on??box.hidden;if(open&&(advanceFn||G.busy||G.ending))return;box.hidden=!open;if(open){SFX.play('radio');radio('');}}
 function radio(key){
  G.radioKey=key;const box=$('#ctcRadioPanel'),it=item(),p=view();
  const open=p.communications.filter(c=>it.comm?.[c.id]==null).map(c=>({c,r:recipient(c)}));
  const nextRef=records.hint&&G.order.ok?G.order.seq.find(s=>s.comm&&it.comm?.[s.comm.id]==null)?.comm:null;
  if(!key){
   const groups=new Map();for(const x of open)if(!groups.has(x.r.key))groups.set(x.r.key,x.r);
   const list=[...groups.values()].sort((a,b)=>hash(a.key+G.p0.id)-hash(b.key+G.p0.id));
   box.innerHTML=`<h4>📻 누구를 부를까요?</h4>${list.length?list.map(r=>`<button type="button" class="ctc-opt${nextRef&&recipient(nextRef).key===r.key?' hinted':''}" data-key="${esc(r.key)}">${esc(r.name)}</button>`).join(''):'<p>보낼 무전을 모두 마쳤어요.</p>'}<button type="button" class="ctc-close">닫기 (Esc)</button>`;
  }else{
   const mine=open.filter(x=>x.r.key===key).sort((a,b)=>hash(a.c.id+G.p0.id)-hash(b.c.id+G.p0.id)),short=t=>t.length>90?t.slice(0,89)+'…':t;
   box.innerHTML=`<h4>📻 ${esc(mine[0]?.r.name||'')}</h4><p class="ctc-sub">무엇을 말할까요?</p>${mine.map(x=>`<button type="button" class="ctc-opt msg${nextRef?.id===x.c.id?' hinted':''}" data-id="${esc(x.c.id)}">${esc(short(label(x.c)))}</button>`).join('')}<button type="button" class="ctc-back">← 다른 상대</button>`;
  }
  box.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>{SFX.play('select');radio(b.dataset.key);});
  box.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>send(p.communications.find(c=>c.id===b.dataset.id)));
  box.querySelector('.ctc-back')?.addEventListener('click',()=>radio(''));
  box.querySelector('.ctc-close')?.addEventListener('click',()=>toggleRadio(false));
 }
 async function send(c){
  if(!c||G.busy||G.ending)return;G.busy=true;$('#ctcRadioPanel').hidden=true;
  const r=recipient(c),need=unmetBefore(c),text=utterances(c.text).filter(u=>u.sp==='관').map(u=>u.text).join(' ');
  if(need&&r.key==='self'){SFX.play('wrong');G.early++;await say('orpheia','오르페이아','주인님, 그 환호는 조작을 마친 다음에 하는 거예요. LS에서 먼저 취급해 주세요!','worry');hush();G.busy=false;return;}
  if(need&&GO.test(text)){
   G.rewinds++;clock(true);SFX.play('transmit');await say('sangcheol','신상철 · 관제',exchange(c,r)[0].text);hush();SFX.play('wrong');
   const fc=$('.ctc-forecast');fc.querySelector('.ctc-fc-body').innerHTML=forecast(c,need);fc.style.backgroundImage=has('ui_forecast_bg.png')?`url(${asset('ui_forecast_bg.png')})`:'';fc.hidden=false;if(typeof BGM!=='undefined')BGM.play('bgm_forecast');
   await new Promise(res=>fc.querySelector('button').onclick=res);
   fc.hidden=true;SFX.play('rewind');if(typeof BGM!=='undefined')BGM.play('bgm_emergency');
   await say('orpheia','오르페이아','예측을 되감았어요. 그 지시는 LS 조작이 끝난 뒤에 내야 해요, 주인님.','worry');hush();clock(false);G.busy=false;return;
  }
  await play(c,r);G.busy=false;
 }
 // The clock stops while people talk. A stop order asks where: the answer is on the LS (or in 📋 상황).
 async function play(c,r){
  clock(true);
  const lines=exchange(c,r),stops=lines.filter(l=>l.who==='sangcheol').map(l=>l.text.match(/^([A-Z]\d{3,4})\s*열차\s*([가-힣]+역)\s*정차/)).filter(Boolean),places=[...new Set(stops.map(m=>m[2]))];
  for(const [k,line] of lines.entries()){
   const m=line.who==='sangcheol'&&places.length>1&&line.text.match(/^([A-Z]\d{3,4})\s*열차\s*([가-힣]+역)\s*정차/);
   if(m)await ask(`${m[1]}열차를 어디에 세울까요?`,places,m[2]);
   SFX.play(line.who==='sangcheol'?'transmit':'radio');await say(line.who,line.name,line.text,line.who!=='sangcheol'&&(k===0&&c===G.p0.communications[0]||/비상|화재|연기|충돌|침수|사상/.test(line.text))?'urgent':'');
  }
  hush();clock(false);W.SimRemote.command({type:'fts',op:'manual',key:'comm:'+c.id,checked:true});update();
 }
 async function ask(question,options,answer){
  const opts=[...options].sort((a,b)=>hash(a+question)-hash(b+question));
  for(;;){
   const got=await new Promise(res=>{
    const box=$('.ctc-dialogue');box.hidden=false;face(box,'orpheia','serious');advanceFn=null;
    $('.ctc-name').innerHTML='오르페이아';$('.ctc-name').className='ctc-name c-orpheia';$('.ctc-next').hidden=true;
    $('.ctc-text').innerHTML=`${esc(question)} <small>(LS에서 열차 위치를 확인하세요)</small><span class="ctc-ask">${opts.map(o=>`<button type="button" class="${records.hint&&o===answer?'hinted':''}">${esc(o)}</button>`).join('')}</span>`;
    $('.ctc-text').querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();res(b.textContent);});
   });
   if(got===answer){SFX.play('correct');return;}
   G.wrong++;SFX.play('wrong');await say('orpheia','오르페이아',`${got}이 아니에요, 주인님. 그 열차가 지금 어디 있는지 LS를 다시 봐요!`,'worry');
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
  for(const b of G.p0.branches||[])if(it.branch?.[b.id]!=null&&!G.branches.has(b.id)){G.branches.add(b.id);branch(b);}
  if(!G.ending&&(it.status!=='진행'||s.finished))finish(it.status);
 }
 const idle=async()=>{while(G?.busy)await new Promise(r=>setTimeout(r,200));};
 async function branch(b){
  await idle();if(!G||G.ending)return;G.busy=true;clock(true);SFX.play('alarm');
  await say('instructor','서도희 교수','상황 변경. '+String(b.text||b.label).split('\n')[0].replace(/^[\s▪•·-]+/,''));
  await say('orpheia','오르페이아','또?! ……주인님, 대본과 달라졌어요. 상황을 다시 확인해요!','worry');hush();clock(false);G.busy=false;
 }
 async function finish(status){
  G.ending=true;$('#ctcRadioPanel').hidden=true;await idle();if(!G)return;G.busy=true;
  const it=item(),p=view(),mo=p.objectives.filter(o=>it.obj?.[o.id]==null),mc=p.communications.filter(c=>it.comm?.[c.id]==null);
  const R={id:G.id,title:p.name,score:it.score??0,status,seconds:Math.round((it.endedAt??0)-(it.startedAt??0)),limit:p.limit,
   ops:[p.objectives.length-mo.length,p.objectives.length],comms:[p.communications.length-mc.length,p.communications.length],
   missed:[...mo.map(o=>'🖱 '+o.label),...mc.map(c=>'📻 '+label(c))],deductions:(p.deductions||[]).filter((d,i)=>it.deducted?.[i]).map(d=>d.label),
   rewinds:G.rewinds,early:G.early,wrong:G.wrong,hint:!!records.hint};
  SFX.play(status==='완료'?'clear':'wrong');
  await say('instructor','서도희 교수',status==='완료'?`거기까지. ${R.score}점.`:status==='시간초과'?`시간 종료. ${R.score}점. 빠뜨린 항목을 확인해요.`:`제출 확인. ${R.score}점.`);
  await say('orpheia','오르페이아',R.score>=90?'완벽해요, 주인님! 무전도 조작도 빠짐없이 해내셨어요♪':R.score>=60?'수고하셨어요! 빠뜨린 항목은 채점표에서 같이 봐요.':'괜찮아요, 주인님. 처음엔 누구나 그래요. 채점표를 보고 다시 해 봐요!',R.score>=60?'smile':'worry');
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
  if(!el)build();onDone=done;el.hidden=false;document.body.classList.add('in-ctc');
  $('#ctcHint').checked=!!records.hint;$('.ctc-loading').hidden=false;el.classList.remove('show-mmi');el.querySelectorAll('.ctc-view button').forEach(b=>b.classList.toggle('on',b.dataset.view==='ls'));$('.ctc-view i').hidden=true;
  const old=$('#ctcMMI'),fresh=document.createElement('iframe');fresh.id='ctcMMI';fresh.title=old.title;old.replaceWith(fresh);
  for(const s of ['.ctc-dialogue','#ctcRadioPanel','#ctcHintPanel','.ctc-toast','.ctc-forecast','.ctc-hud'])$(s).hidden=true;
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
  const r=W.SimRemote.command({type:'fts',op:'start',scenario:sc.id,professor:'001',student:'tester'});
  if(!r?.ok)throw Error(r?.message||'교육을 시작하지 못했어요.');
  clock(true);
  const run=W.SimRemote.snapshot.ftsRunLibrary||lib,s=W.SimRemote.snapshot.fts.session,p0=run.problems.find(p=>p.id===s.items[0].problem);
  G={id,view:'ls',index:0,p0,order:order(p0),wrong:0,mm:{station:'',signal:'',form:null,msg:''},log:[],seen:new Set(),branches:new Set(),rewinds:0,early:0,busy:true,ending:false,radioKey:''};
  const station=p0.setup?.trains?.[0]?.station||p0.setup?.reset?.[0];
  if(station)W.document.querySelector(`#stationTabs [data-view="${station}"]`)?.click();
  const onKey=e=>{if(!e.target.closest?.('input:not([type=checkbox]),textarea,select,[contenteditable]'))keys(e);};
  W.document.addEventListener('keydown',onKey,true);
  // The simulator can move its MMI into another window (its LS/MMI split); here that window is the second screen.
  M=$('#ctcMMI').contentWindow;W.open=()=>M;W.SimWorkspace.detach();M.document.addEventListener('keydown',onKey,true);
  
  // Game skin: the HUD above replaces the simulator's own top bar, and only this problem's stations keep a tab.
  const used=G.used=new Set([...JSON.stringify(p0).matchAll(/"(?:station|targetStation)":"([\w-]+)"/g)].map(m=>m[1]));
  const st=W.document.createElement('style');st.textContent='.ls-topbar,#extraLSBtn{display:none!important}'+(used.size<2?'.ctc-one-station{display:none!important}':'')+(used.size?`#stationTabs [data-view]${[...used].map(x=>`:not([data-view="${x}"])`).join('')}{display:none!important}`:'');W.document.head.appendChild(st);W.document.querySelector('.ls-bottom')?.classList.add('ctc-one-station');
  $('.ctc-title').textContent=p0.name;
  $('.ctc-loading').hidden=true;$('.ctc-hud').hidden=false;hud();hintPanel();
  tick=setInterval(update,300);
  // Briefing with the clock paused: the report, the problem, then the floor is the player's.
  SFX.play('alarm');
  const first=p0.communications[0],fr=first&&recipient(first),train=p0.setup?.trains?.[0]?.number;
  if(!fr?.incoming&&train&&/고장/.test(p0.voice||''))await say('harin',`${train} 기관사`,`철도관제, ${train}열차 이상! 차량고장으로 정상 운행이 어렵습니다. 이상!`,'urgent');
  await say('instructor','서도희 교수',`문제. 「${p0.name}」 제한시간 ${Math.round(p0.limit/60)}분. 관계 열차는 LS와 📋 상황에서 확인하세요.`);
  await say('orpheia','오르페이아','무전은 📻 버튼이나 R 키예요. 앞쪽 LS 표시반과 책상 위 MMI 단말은 Tab 키로 오가요. 순서는 주인님이 정하세요. 시작할게요!','serious');
  hush();clock(false);G.busy=false;
  if(fr?.incoming){G.busy=true;await play(first,fr);G.busy=false;}
 }
 function fail(msg){$('.ctc-loading').hidden=true;G=G||{log:[]};say('orpheia','오르페이아',msg+' 이야기로 돌아갈게요.','worry').then(()=>close({id:'',error:msg}));}
 // Test helpers.
 return {start,look,mmi:()=>M,debug:()=>G&&{view:G.view,p:view(),item:item(),order:G.order,busy:G.busy,ending:G.ending,talking:!!advanceFn},frame:()=>W,recipient,label,send:id=>send(view().communications.find(c=>c.id===id))};
})();
