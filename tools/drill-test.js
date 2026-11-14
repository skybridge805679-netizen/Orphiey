// 실습 장면 자동 플레이: node tools/drill-test.js <장면id> [늦게 부를 need id]  |  도전 모드: node tools/drill-test.js challenge [장면id:문서상황변경id]   (python3 -m http.server 8765 를 먼저 띄운다)
const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const DIR=require('os').tmpdir()+'/';
const scene=process.argv[2]||'ch02-report',lateId=process.argv[3]||'';
(async()=>{
 const b=await chromium.launch();try{const p=await b.newPage({viewport:{width:1440,height:810}});
 const errs=[];p.on('requestfailed',r=>{if(r.failure()?.errorText!=='net::ERR_ABORTED'&&!r.url().startsWith('https://fonts.googleapis.com/'))errs.push(r.url()+': '+r.failure()?.errorText);});p.on('pageerror',e=>errs.push(e.message));
 p.on('console',m=>{if(m.type()==='warning'&&/\[do\]/.test(m.text()))console.log('DO',m.text());if(m.type()==='error'&&!/404|textLength|Failed to load resource/.test(m.text()))errs.push('c: '+m.text().slice(0,200));});
 await p.goto('http://localhost:8765/index.html');
 const gate=p.locator('.sound-gate');if(await gate.count()){await gate.click();await gate.waitFor({state:'detached'});}
 await p.waitForTimeout(700);
 if(scene==='challenge')console.log('CHALLENGE',JSON.stringify(await p.evaluate(f=>{window.__R=null;const info=Challenge._build(f);CTCDrill.mode({forecasts:2,salt:String(Math.random()),keepHint:true});CTCDrill.start('challenge',R=>window.__R=R);return info;},process.env.DRILL_FORCE?JSON.parse(process.env.DRILL_FORCE):lateId.includes(':')?{base:lateId.split(':')[0],doc:lateId.split(':')[1],seed:42,twists:[]}:null)));   // 도전 모드: 무작위 장면 + 상황 변경 (힌트는 테스트용으로 유지)
 else await p.evaluate(s=>{window.__R=null;CTCDrill.start(s,R=>window.__R=R);},scene);
 await p.waitForFunction(()=>CTCDrill.debug(),null,{timeout:30000});
 await p.evaluate(()=>{const h=document.querySelector('#ctcHint');if(!h.checked){h.checked=true;h.dispatchEvent(new Event('change'));}});   // 도전 모드에서는 힌트 칸이 숨겨져 있어서 클릭 대신 직접 켠다
 const where=()=>p.evaluate(()=>{const o=[];for(const [st,s] of Object.entries(CTCDrill.frame().SimRemote.snapshot.ls.stations))for(const [slot,rows] of Object.entries(s.windows))for(const r of rows)o.push(r.number+'='+st+'/'+slot);return o.sort().join(' ');});
 console.log('start:',await where());
 let departureMoved=false;
 const seenLog=new Set();let stuck=0,last='',fc=0,rushN=0,idle=false,opsShot=false,mv=false;
 for(let it=0;it<12000;it++){
  const st=await p.evaluate(()=>{if(window.__R)return {done:true};const d=CTCDrill.debug();if(!d)return null;return {dock:d.dock,talking:d.talking,fc:!document.querySelector('.ctc-forecast').hidden,wait:[...document.querySelectorAll('.dk-c.wait')].map(x=>[x.dataset.id,parseFloat(x.querySelector('.dk-g b').style.width)]),moving:/열차가 움직이고/.test(document.querySelector('.dk-main').textContent)};});
  if(!st||st.done)break;
  if(scene==='ch03-rescue'){
   const v=await p.evaluate(()=>{const d=CTCDrill.debug(),snap=CTCDrill.frame().SimRemote.snapshot;let at='';for(const [id,s] of Object.entries(snap.ls.stations))for(const [slot,rows] of Object.entries(s.windows))if(rows.some(r=>r.number==='K1212'))at=id+'/'+slot;return {sent:d.item.comm?.n15!=null,at};});
   if(!v.sent&&v.at!=='geumcheon/5T')throw Error('출발 지시 전에 K1212 이동: '+v.at);
   if(v.sent&&v.at!=='geumcheon/5T')departureMoved=true;
  }

  const sig=JSON.stringify({...st,wait:st.wait.map(w=>w[0])});if(sig===last)stuck++;else{stuck=0;last=sig;}
  if(stuck>1200){console.log('STUCK',sig);await p.screenshot({path:DIR+'drill-stuck.png'});break;}
  if(st.fc){fc++;await p.waitForTimeout(150);console.log('FC',(await p.evaluate(()=>document.querySelector('.ctc-fc-body').innerText)).replace(/\n+/g,' / ').slice(0,100));console.log('  at outcome:',await where());await p.click('.ctc-forecast button');await p.waitForTimeout(600);continue;}
  if(st.dock==='rush'){
   if(st.wait.length>1&&rushN<2){rushN++;await p.waitForTimeout(900);await p.screenshot({path:DIR+`drill-${scene}-rush${rushN}.png`});}
   if(!idle&&st.wait.length>1&&await p.$('.dk-c[data-id="a0168"]:not(.wait)')){idle=true;await p.click('.dk-c[data-id="a0168"]');await p.waitForTimeout(80);continue;}
   const cand=st.wait.filter(w=>w[0]!==lateId||fc>0).sort((a,b)=>a[1]-b[1]);
   if(!cand.length){await p.waitForTimeout(300);continue;}
   await p.click(`.dk-c[data-id="${cand[0][0]}"]`);await p.waitForTimeout(80);continue;
  }
  if(st.dock==='ops'){
   const todo=await p.evaluate(()=>[...document.querySelectorAll('.dk-task li:not(.done)')].map(x=>x.textContent));
   if(!opsShot&&todo.length){opsShot=true;await p.screenshot({path:DIR+`drill-${scene}-ops.png`});}
   const t=todo[0];
   if(t&&/열차번호.*(수정|삭제)|중복 알람 확인/.test(t)){
    const match=t.match(/열차번호 (\w+) → (\w+) 수정|열차번호 (\w+) 삭제/);
    await p.evaluate(()=>CTCDrill.look('mmi'));
    if(match){
     const from=match[1]||match[3],to=match[2];
     const f=await p.evaluate(n=>{for(const [st,x] of Object.entries(CTCDrill.frame().SimRemote.snapshot.ls.stations))for(const rows of Object.values(x.windows))for(const r of rows)if(r.number===n)return {st,uid:String(r.uid)};},from);
     if(!f)throw Error('열번 조작 대상 없음: '+from);
     await p.click('#ctcTerm [data-st="'+f.st+'"]');
     if(to){await p.click('#ctcTerm [data-edit="rename"][data-uid="'+f.uid+'"]');await p.fill('#mmNew',to);await p.click('#ctcTerm [data-do="rename"]');}
     else {p.once('dialog',d=>d.accept());await p.click('#ctcTerm [data-edit="delete"][data-uid="'+f.uid+'"]');}
    }else {await p.locator('#ctcTerm [data-alarm-check]').first().check();await p.click('#ctcTerm [data-do="ack"]');}
    console.log('MANUAL',t);await p.waitForTimeout(500);continue;
   }
   if(t){const ST={'금천구청':'geumcheon','구로':'guro','안양':'anyang','군포':'gunpo','금정':'geumjeong','종각':'jonggak','지하서울':'underground-seoul','석수':'seoksu','동묘앞':'dongmyo'};const st=ST[Object.keys(ST).find(k=>t.includes(k+'역'))]||'guro';let a=null,m;
    if(/CCM/.test(t))a={type:'mode',value:'CCM'};else if(/AUTO/.test(t))a={type:'mode',value:'AUTO'};
    else if(m=t.match(/(\w+) 신호 취소/))a={type:'stop',id:m[1]};else if(m=t.match(/(\w+-\w+) (출발 진행|장내 진행|입환표지|진로 설정)/))a={type:'route',id:m[1]};
    const r=await p.evaluate(([st,a])=>JSON.stringify(CTCDrill.frame().SimRemote.command({type:'control',station:st,action:{...a,source:'LS'}})||'').slice(0,120),[st,a]);
    console.log('OPS',t.slice(0,40),JSON.stringify(a),r);if(JSON.parse(r)?.ok===false)throw Error('필수 조작 거부: '+t+' '+r);}
   await p.waitForTimeout(500);continue;
  }
  if(st.dock==='who'){await p.click('.dk-c.hinted');await p.waitForTimeout(60);continue;}
  if(st.dock==='call'||st.dock==='choice'){const h=await p.$('.dk-p.hinted');if(h)await h.click();else await p.click('.dk-end');await p.waitForTimeout(60);continue;}
  if(st.moving){if(!mv){mv=true;console.log('MOVE from:',await where());}await p.waitForTimeout(300);continue;}else if(mv){mv=false;console.log('MOVE to  :',await where());if(process.env.DRILL_LOG){const L=await p.evaluate(re=>{const out=[];for(const [st,x] of Object.entries(CTCDrill.frame()?.SimRemote.snapshot.states||{}))for(const l of x.logs||[]){const t=typeof l==='string'?l:JSON.stringify(l);if(new RegExp(re).test(t))out.push(st+': '+t.slice(0,170));}return out;},process.env.DRILL_LOG).catch(()=>[]);for(const l of L)if(!seenLog.has(l)){seenLog.add(l);console.log('SIMLOG',l);}console.log('SIMJOB',await p.evaluate(re=>{const s=CTCDrill.frame().SimRemote.snapshot,o=[];for(const j of s.scenario.jobs||[])if(new RegExp(re).test(j.number))o.push(j.number+'#'+j.uid+' '+j.phase+' '+j.station+'/'+j.from+'→'+j.to+' '+(j.reason||''));for(const [st,x] of Object.entries(s.ls.stations))for(const [sl,rows] of Object.entries(x.windows))for(const r of rows)if(new RegExp(re).test(r.number))o.push('WIN '+r.number+'#'+r.uid+'@'+st+'/'+sl);return o.slice(-12).join(' | ');},process.env.DRILL_LOG).catch(e=>e.message));}console.log('JOBS',await p.evaluate(()=>{const s=CTCDrill.frame().SimRemote.snapshot;return JSON.stringify((s.scenario.jobs||[]).filter(j=>/^G/.test(j.number)&&j.phase!=='done').map(j=>[j.number,j.reason||j.wait,j.station+'/'+j.from+'→'+j.to])).slice(0,600)+' sig '+JSON.stringify(s.states.guro.signals).slice(0,300)+' routes '+Object.keys(s.states.guro.routes).join(',')+' mode '+s.states.guro.mode;}));}
  if(st.talking){await p.keyboard.press('Space');await p.waitForTimeout(20);continue;}
  await p.waitForTimeout(60);
 }
 await p.waitForTimeout(400);
 console.log('end:',await p.evaluate(()=>CTCDrill.frame()?'open':'closed'));
 console.log('RESULT',JSON.stringify(await p.evaluate(()=>window.__R)));
 console.log('log tail:',await p.evaluate(()=>[...document.querySelectorAll('.dk-b')].slice(-4).map(x=>x.innerText.replace(/\n+/g,': ').slice(0,60)).join(' | ')));
 console.log('errors',errs.slice(0,5));
 const result=await p.evaluate(()=>window.__R);
 if(result?.procedureComplete===false)throw Error('필수 절차 미완료: '+JSON.stringify(result.missed));
 if(!result||result.rank!==(lateId&&scene!=='challenge'?'A':'S'))throw Error('실습 미완료 또는 기대 랭크 실패: '+JSON.stringify(result));
 if(scene==='ch03-rescue'&&!departureMoved)throw Error('출발 지시 후 K1212 이동 없음');
 if(errs.length)throw Error('브라우저 오류: '+JSON.stringify(errs));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
