'use strict';
// 구술 시험실 — CTC LAB의 운행선관리 구술 문제 은행(ctc/engine/oral-line.js, 233문항)과 판정·간격 반복(oral-relay.js)을 게임 화면으로.
//  · 서도희 교수가 묻고, 주인님이 답을 쓴다(Enter로 한 문장씩). 쓴 말에 핵심 항목이 들어 있으면 숨은 카드가 한 장씩 뒤집힌다.
//  · 연달아 맞히면 콤보, 힌트는 카드 반 장 값, 패스·시간 초과는 그대로 채점. 카드 모드는 정답을 보고 스스로 매긴다.
//  · 결과는 간격 반복으로 저장: 틀린 문제는 곧 다시, 맞힌 문제는 뜸하게(localStorage 'orpheia.oral.v1').
const Oral=(()=>{
 const KEY='orpheia.oral.v1',R=()=>window.SimOralRelay,esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const img=n=>typeof asset==='function'?asset(n):'assets/'+n;
 const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{};}catch{return {};}},save=d=>{try{localStorage.setItem(KEY,JSON.stringify(d));}catch{}};
 const sfx=n=>{try{SFX.play(n);}catch{}},bgm=n=>{try{BGM.play(n);}catch{}};
 const mastered=st=>!!st&&st.reps>=2&&(st.best||0)>=90;
 let D=load(),opt={scope:D.scope||'exam',count:D.count||5,mode:D.mode||'write',timer:D.timer??120},S=null,root=null,tick=0;
 const FACE={smile:'ui/face_smile.png',worry:'ui/face_worry.png',serious:'ui/face_serious.png',neutral:'ui/face_neutral.png',relief:'ui/face_relief.png'};
 const PROF={neutral:'chr_instructor_neutral.png',smile:'chr_instructor_smile.png',stern:'chr_instructor_stern.png'};
 const LINES={
  open:['자, 구술 시작해요. 생각나는 것부터 한 문장씩.','교재 몇 쪽인지는 안 물어요. 내용만.','이건 실제 시험에서도 나와요. 천천히.'],
  perfect:['……다 말했네요. 다음.','빠진 게 없어요. 그대로 외워 둬요.','좋아요. 이런 답이면 면접관이 펜을 내려놔요.'],
  good:['거의 다 왔어요. 빠진 것만 다시 봐요.','틀린 건 아니에요. 덜 말했을 뿐.'],
  low:['괜찮아요. 처음엔 다 그래요. 빨간 글씨만 소리 내서 읽어 봐요.','이 문제는 곧 다시 나와요. 그때 맞히면 돼요.'],
 };
 const pickLine=k=>LINES[k][Math.floor(Math.random()*LINES[k].length)];
 const pool=()=>R().pool(opt.scope);
 const chapters=()=>R().chapters();
 function mount(html,cls){
  clearInterval(tick);document.body.classList.remove('in-drill');document.body.classList.add('vn-mode');
  const m=document.querySelector('#main');m.innerHTML=`<section class="oral ${cls||''}">${html}</section>`;root=m.querySelector('.oral');return root;
 }
 // ── 시험실(로비)
 function lobby(){
  bgm('bgm_daily');D=load();const st=D.stats||{},all=R().pool('all'),now=Date.now();
  const due=all.filter(x=>st[x.id]?.due!=null&&st[x.id].due<=now).length,done=all.filter(x=>mastered(st[x.id])).length,seen=all.filter(x=>st[x.id]).length;
  const chs=chapters().map(c=>`<option value="ch:${esc(c)}" ${opt.scope==='ch:'+c?'selected':''}>${esc(c)} (${R().pool('ch:'+c).length})</option>`).join('');
  mount(`<img class="oral-bg" src="${img('bg_exam_hall.png')}" alt=""><div class="oral-lobby">
   <img class="oral-prof" src="${img(PROF.smile)}" alt="">
   <div class="oral-panel"><small>ORAL EXAM ROOM · 운행선관리 구술</small><h2>구술 시험실</h2>
    <p class="oral-say">「말로 설명하는 시험이에요. 답을 다 외웠는지가 아니라, <b>빠뜨리지 않고 말하는지</b>를 봐요.」</p>
    <div class="oral-meter"><div><b>${done}</b><span>익힘</span></div><div><b>${seen}</b><span>풀어 봄</span></div><div><b>${due}</b><span>복습 대기</span></div><div><b>${all.length}</b><span>전체</span></div></div>
    <div class="oral-bar"><i style="width:${Math.round(100*done/all.length)}%"></i></div>
    <label>범위<select data-o="scope"><option value="exam" ${opt.scope==='exam'?'selected':''}>기출 (${R().pool('exam').length})</option><option value="all" ${opt.scope==='all'?'selected':''}>전범위 (${all.length})</option><optgroup label="장별">${chs}</optgroup></select></label>
    <div class="oral-seg" data-o="count">${[5,10,20].map(n=>`<button data-v="${n}" class="${opt.count===n?'on':''}">${n}문제</button>`).join('')}</div>
    <div class="oral-seg" data-o="mode"><button data-v="write" class="${opt.mode==='write'?'on':''}">✍ 답안 쓰기</button><button data-v="card" class="${opt.mode==='card'?'on':''}">🃏 카드 넘기기</button></div>
    <div class="oral-seg" data-o="timer">${[[120,'2분'],[60,'1분'],[0,'시간 무제한']].map(([v,t])=>`<button data-v="${v}" class="${opt.timer===v?'on':''}">⏱ ${t}</button>`).join('')}</div>
    <div class="oral-go"><button class="primary" data-a="start">시험 시작 ▶</button><button data-a="title">타이틀로</button></div>
    ${D.best?`<p class="oral-rec">최고 랭크 ${esc(D.best.rank)} · 최고 콤보 ${D.best.combo||0} · 시험 ${D.plays||0}회</p>`:''}
   </div></div>`,'is-lobby');
  root.querySelector('[data-o="scope"]').onchange=e=>{opt.scope=e.target.value;keep();};
  root.querySelectorAll('.oral-seg').forEach(g=>g.querySelectorAll('button').forEach(b=>b.onclick=()=>{const k=g.dataset.o,v=b.dataset.v;opt[k]=k==='mode'?v:+v;keep();g.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));sfx('select');}));
  root.querySelector('[data-a="start"]').onclick=()=>{sfx('confirm');begin();};
  root.querySelector('[data-a="title"]').onclick=()=>VN.title();
 }
 const keep=()=>{D=load();Object.assign(D,{scope:opt.scope,count:opt.count,mode:opt.mode,timer:opt.timer});save(D);};
 // ── 한 판
 function begin(retry){
  const items=retry||pool();if(!items.length){lobby();return;}
  S={items,list:[],n:retry?retry.length:Math.min(opt.count,items.length),i:-1,score:0,combo:0,bestCombo:0,res:[],recent:[],retry:!!retry};
  bgm('bgm_exam');next();
 }
 function next(){
  S.i++;if(S.i>=S.n){result();return;}
  D=load();const st=D.stats||{},it=S.retry?S.items[S.i]:R().pick(S.items,st,{recent:S.recent});
  S.recent.push(it.id);S.q={it,done:[],hinted:new Set(),text:'',t0:Date.now(),left:opt.timer,ended:false,said:[]};
  opt.mode==='card'?cardQ():writeQ();
 }
 function hud(){
  return `<header class="oral-hud"><span>문제 <b>${S.i+1}</b> / ${S.n}</span><span class="oral-ch">${esc(S.q.it.ch)}${(S.q.it.tags||[]).includes('기출')||S.q.it.set==='기출'?' · <em>기출</em>':' · 교재'}${S.q.it.page?` · ${esc(S.q.it.page)}쪽`:''}</span><span>점수 <b class="oral-score">${S.score}</b></span><span class="oral-combo ${S.combo>1?'hot':''}">COMBO <b>${S.combo}</b></span><button data-a="quit" title="시험실로">✕</button></header>`;
 }
 function prof(face,text){return `<div class="oral-q"><img class="oral-prof" src="${img(PROF[face]||PROF.neutral)}" alt=""><div class="oral-bubble"><b>서도희 교수</b><p>${text}</p></div></div>`;}
 function writeQ(){
  const it=S.q.it,n=it.key.length;
  mount(`<img class="oral-bg dim" src="${img('bg_exam_hall.png')}" alt="">${hud()}${opt.timer?'<div class="oral-time"><i></i></div>':''}
   ${prof('neutral',esc(it.q))}
   <div class="oral-cards">${it.key.map((k,i)=>`<div class="oral-card" data-k="${i}"><span class="no">${i+1}</span><span class="face">?</span><span class="txt">${esc(k)}</span></div>`).join('')}</div>
   <div class="oral-said" aria-live="polite"></div>
   <div class="oral-input"><img class="oral-orp" src="${img(FACE.neutral)}" alt=""><textarea rows="2" placeholder="생각나는 대로 한 문장씩 쓰고 Enter (줄바꿈은 Shift+Enter). 핵심 항목 ${n}개를 찾아요."></textarea>
    <div class="oral-btns"><button data-a="hint" title="숨은 카드 하나의 앞 글자를 보여 줘요 (그 카드는 반 장 값)">💡 힌트</button><button data-a="pass">모르겠어요</button><button class="primary" data-a="submit">답안 제출</button></div></div>`,'is-q');
  const ta=root.querySelector('textarea');ta.focus();
  ta.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();say(ta.value);ta.value='';}};
  root.querySelector('[data-a="submit"]').onclick=()=>{if(ta.value.trim()){say(ta.value);ta.value='';}finishQ('submit');};
  root.querySelector('[data-a="pass"]').onclick=()=>finishQ('pass');
  root.querySelector('[data-a="hint"]').onclick=hint;
  root.querySelector('[data-a="quit"]').onclick=quit;
  typeIn(root.querySelector('.oral-bubble p'),it.q);
  if(opt.timer){const bar=root.querySelector('.oral-time i');tick=setInterval(()=>{if(document.querySelector('dialog[open]'))return;S.q.left-=.25;const r=S.q.left/opt.timer;bar.style.width=Math.max(0,100*r)+'%';bar.classList.toggle('low',r<.25);
   if(r<.25)orp('worry');if(S.q.left<=0)finishQ('time');},250);}
 }
 function typeIn(p,text){let i=0;p.textContent='';const t=setInterval(()=>{i+=2;p.textContent=text.slice(0,i);try{SFX.blip('instructor',text[i-1]);}catch{}if(i>=text.length||!p.isConnected){clearInterval(t);p.textContent=text;}},18);}
 const orp=f=>{const o=root?.querySelector('.oral-orp');if(o&&!o.src.endsWith(FACE[f]))o.src=img(FACE[f]);};
 function say(raw){
  const t=String(raw||'').trim();if(!t||S.q.ended)return;
  if(R().isSkip(t)){finishQ('pass');return;}
  S.q.text+=' '+t;S.q.said.push(t);
  const got=R().check(S.q.it,S.q.text,S.q.done);
  const log=root.querySelector('.oral-said'),line=document.createElement('p');line.textContent=t;log.append(line);log.scrollTop=log.scrollHeight;
  if(got.length){
   S.combo++;S.bestCombo=Math.max(S.bestCombo,S.combo);
   got.forEach((k,j)=>setTimeout(()=>{S.q.done.push(k);flip(k);},j*180));
   const pts=got.reduce((a,k)=>a+(S.q.hinted.has(k)?50:100),0)+(S.combo>1?S.combo*10:0);S.score+=pts;
   pop(`+${pts}${S.combo>1?` · COMBO ${S.combo}`:''}`);sfx('correct');orp('smile');line.classList.add('hit');
   setTimeout(()=>{const el=root.querySelector('.oral-score');if(el)el.textContent=S.score;const c=root.querySelector('.oral-combo');if(c){c.querySelector('b').textContent=S.combo;c.classList.toggle('hot',S.combo>1);}
    if(S.q.done.length>=S.q.it.key.length)finishQ('perfect');},got.length*180+120);
  }else{S.combo=0;sfx('card');orp('serious');line.classList.add('miss');const c=root.querySelector('.oral-combo');if(c){c.querySelector('b').textContent=0;c.classList.remove('hot');}}
 }
 function flip(k){const c=root?.querySelector(`.oral-card[data-k="${k}"]`);if(c){c.classList.add('open');if(S.q.hinted.has(k))c.classList.add('half');}}
 function pop(text){const p=document.createElement('div');p.className='oral-pop';p.textContent=text;root.append(p);setTimeout(()=>p.remove(),1100);}
 function hint(){
  const it=S.q.it,left=it.key.map((_,i)=>i).filter(i=>!S.q.done.includes(i)&&!S.q.hinted.has(i));if(!left.length)return;
  const k=left[0];S.q.hinted.add(k);const c=root.querySelector(`.oral-card[data-k="${k}"] .face`);
  const w=String(it.key[k]).replace(/^[^가-힣A-Za-z0-9]+/,'');c.textContent=w.slice(0,Math.min(4,Math.ceil(w.length/4)))+'…';c.parentElement.classList.add('hinted');sfx('select');
 }
 function finishQ(why){
  if(S.q.ended)return;S.q.ended=true;clearInterval(tick);
  const it=S.q.it,n=it.key.length,missed=it.key.map((_,i)=>i).filter(i=>!S.q.done.includes(i));
  const frac=Math.max(0,(S.q.done.length-0.5*[...S.q.hinted].filter(i=>S.q.done.includes(i)).length)/n);
  record(it,frac);S.res.push({it,frac,why,missed});
  if(frac<0.6)S.combo=0;
  review(it,frac,missed,why);
 }
 function record(it,frac){D=load();D.stats=D.stats||{};const was=mastered(D.stats[it.id]);D.stats[it.id]=R().grade(D.stats[it.id],frac);if(!was&&mastered(D.stats[it.id]))(S.newMastered=S.newMastered||[]).push(it.id);save(D);}
 function review(it,frac,missed,why){
  const pct=Math.round(frac*100),k=pct>=90?'perfect':pct>=60?'good':'low',hl=R().highlight(it,missed);
  if(k==='perfect'){sfx('clear');}else if(k==='low')sfx('wrong');
  const tag={perfect:'완벽!',time:'시간 종료',pass:'패스',submit:'제출'}[why]||'';
  mount(`<img class="oral-bg dim" src="${img('bg_exam_hall.png')}" alt="">${hud()}
   ${prof(k==='perfect'?'smile':k==='low'?'stern':'neutral',esc(pickLine(k)))}
   <div class="oral-review"><div class="oral-grade g-${k}"><b>${pct}</b><span>점 · ${esc(tag)} · ${it.key.length-missed.length}/${it.key.length} 항목</span></div>
    <div class="oral-cards small">${it.key.map((x,i)=>`<div class="oral-card open ${missed.includes(i)?'missed':''} ${S.q?.hinted?.has(i)?'half':''}"><span class="no">${i+1}</span><span class="txt">${esc(x)}</span></div>`).join('')}</div>
    <h4>모범 답안 <small>빨간 부분이 빠뜨린 말</small></h4>
    <ol class="oral-answer">${hl.map(parts=>`<li>${parts.map(p=>p.miss?`<mark>${esc(p.text)}</mark>`:esc(p.text)).join('')}</li>`).join('')}</ol>
    ${it.ref?.length?`<h4>참고</h4><ul class="oral-ref">${it.ref.map(r=>`<li>${esc(r)}</li>`).join('')}</ul>`:''}
    ${it.page?`<p class="oral-page">교재 ${esc(it.page)}쪽 · ${esc(it.ch)}</p>`:''}
    <div class="oral-go"><button class="primary" data-a="next">${S.i+1>=S.n?'결과 보기 ▶':'다음 문제 ▶'}</button></div></div>
   <img class="oral-orp float" src="${img(k==='perfect'?FACE.smile:k==='low'?FACE.worry:FACE.relief)}" alt="">`,'is-review');
  root.querySelector('[data-a="next"]').onclick=()=>{sfx('select');next();};
  root.querySelector('[data-a="quit"]').onclick=quit;
  root.querySelector('[data-a="next"]').focus();
 }
 // 카드 모드: 묻고 → 정답 보기 → 스스로 매긴다(모르겠음 0.3 · 헷갈림 0.7 · 알았음 1)
 function cardQ(){
  const it=S.q.it;
  mount(`<img class="oral-bg dim" src="${img('bg_study_room.png')}" alt="">${hud()}${prof('neutral',esc(it.q))}
   <div class="oral-flip"><div class="oral-flip-inner"><div class="front"><p>머릿속으로 (또는 소리 내서) 답을 말해 보세요.</p><p class="cnt">핵심 항목 <b>${it.key.length}</b>개</p><button class="primary" data-a="show">정답 보기 ↻</button></div>
    <div class="back"><ol class="oral-answer">${it.a.map(l=>`<li>${esc(String(l).replace(/^\s*(\d+[.)]|[①-⑳])\s*/,''))}</li>`).join('')}</ol>${it.ref?.length?`<ul class="oral-ref">${it.ref.map(r=>`<li>${esc(r)}</li>`).join('')}</ul>`:''}
     <div class="oral-self"><button data-g="0.3">😵 모르겠음</button><button data-g="0.7">🤔 헷갈림</button><button class="primary" data-g="1">😊 알았음</button></div></div></div></div>`,'is-card');
  typeIn(root.querySelector('.oral-bubble p'),it.q);
  root.querySelector('[data-a="quit"]').onclick=quit;
  root.querySelector('[data-a="show"]').onclick=()=>{root.querySelector('.oral-flip').classList.add('on');sfx('card');};
  root.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{const f=+b.dataset.g;record(it,f);S.res.push({it,frac:f,why:'card',missed:[]});
   if(f>=1){S.combo++;S.bestCombo=Math.max(S.bestCombo,S.combo);S.score+=100+(S.combo>1?S.combo*10:0);sfx('correct');}else{S.combo=0;S.score+=Math.round(f*60);sfx('card');}next();});
 }
 function result(){
  clearInterval(tick);bgm('bgm_result');
  const avg=S.res.reduce((a,r)=>a+r.frac,0)/Math.max(1,S.res.length),rank=avg>=.9?'S':avg>=.75?'A':avg>=.55?'B':'C';
  D=load();D.plays=(D.plays||0)+1;const order='CBAS';if(!D.best||order.indexOf(rank)>order.indexOf(D.best.rank)||(rank===D.best.rank&&S.score>(D.best.score||0)))D.best={rank,score:S.score,combo:Math.max(S.bestCombo,D.best?.combo||0)};else D.best.combo=Math.max(D.best.combo||0,S.bestCombo);save(D);
  const wrong=S.res.filter(r=>r.frac<0.9).map(r=>r.it);
  const say={S:'주인님, 완벽해요! 교수님이 펜을 내려놓으셨어요♪',A:'거의 다 말했어요! 빨간 글씨만 한 번 더 보면 S예요.',B:'반은 넘었어요. 틀린 문제는 곧 다시 나오니까, 그때 갚아 줘요!',C:'괜찮아요, 주인님. 구술은 말해 본 만큼 늘어요. 같이 한 번 더 해요.'}[rank];
  mount(`<img class="oral-bg" src="${img('bg_exam_hall.png')}" alt=""><div class="ch-result oral-result"><div class="ch-card"><img class="ch-emblem ${rank==='S'?'is-s':''}" src="${img('ui/emblem_'+(rank==='S'?'gold':'teal')+'.png')}" alt=""><small>구술 시험 결과 · ${esc(opt.mode==='card'?'카드':'답안')} · ${S.res.length}문제</small>
   <p class="score rank-${rank}">${rank}</p><p>점수 <b>${S.score}</b> · 평균 ${Math.round(avg*100)}점 · 최고 콤보 ${S.bestCombo}${S.newMastered?.length?` · 새로 익힘 ${S.newMastered.length}`:''}</p>
   <ul class="oral-list">${S.res.map(r=>`<li class="${r.frac>=.9?'ok':r.frac>=.6?'mid':'ng'}"><span>${Math.round(r.frac*100)}</span>${esc(r.it.q.length>48?r.it.q.slice(0,48)+'…':r.it.q)}</li>`).join('')}</ul>
   <p class="oral-orpline"><img src="${img(rank==='S'||rank==='A'?FACE.smile:FACE.worry)}" alt="">${esc(say)}</p>
   <div class="ch-btns"><button class="primary" data-a="again">한 번 더 ▶</button>${wrong.length?`<button data-a="wrong">틀린 문제만 (${wrong.length})</button>`:''}<button data-a="lobby">시험실로</button><button data-a="title">타이틀로</button></div></div></div>`,'is-result');
  const go={again:()=>begin(),wrong:()=>begin(wrong),lobby,title:()=>VN.title()};
  root.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{sfx('select');go[b.dataset.a]();});
 }
 function quit(){if(S&&S.res.length&&!confirm('시험을 그만둘까요? 지금까지 푼 문제는 기록돼요.'))return;clearInterval(tick);S=null;lobby();}
 function start(){if(!R()||!R().pool('all').length){alert('구술 문제 은행을 불러오지 못했어요.');return;}lobby();}
 return {start,_state:()=>S,_say:t=>say(t),_finish:w=>finishQ(w)};
})();
