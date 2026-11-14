// 실습 장면 자동 플레이: node tools/drill-test.js <장면id> [늦게 부를 need id]   (python3 -m http.server 8765 를 먼저 띄운다)
const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const DIR=require('os').tmpdir()+'/';
const scene=process.argv[2]||'ch02-report',lateId=process.argv[3]||'';
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:810}});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 p.on('console',m=>{if(m.type()==='error'&&!/404|textLength/.test(m.text()))errs.push('c: '+m.text().slice(0,200));});
 await p.goto('http://localhost:8765/index.html');await p.waitForTimeout(700);
 if(scene==='challenge')console.log('CHALLENGE',JSON.stringify(await p.evaluate(()=>{window.__R=null;const info=Challenge._build();CTCDrill.mode({forecasts:2,salt:String(Math.random()),keepHint:true});CTCDrill.start('challenge',R=>window.__R=R);return info;})));   // 도전 모드: 무작위 장면 + 상황 변경 (힌트는 테스트용으로 유지)
 else await p.evaluate(s=>{window.__R=null;CTCDrill.start(s,R=>window.__R=R);},scene);
 await p.waitForFunction(()=>CTCDrill.debug(),null,{timeout:30000});
 await p.evaluate(()=>{const h=document.querySelector('#ctcHint');if(!h.checked){h.checked=true;h.dispatchEvent(new Event('change'));}});   // 도전 모드에서는 힌트 칸이 숨겨져 있어서 클릭 대신 직접 켠다
 const where=()=>p.evaluate(()=>{const o=[];for(const [st,s] of Object.entries(CTCDrill.frame().SimRemote.snapshot.ls.stations))for(const [slot,rows] of Object.entries(s.windows))for(const r of rows)o.push(r.number+'='+st+'/'+slot);return o.sort().join(' ');});
 console.log('start:',await where());
 let stuck=0,last='',fc=0,rushN=0,idle=false,opsShot=false,mv=false;
 for(let it=0;it<12000;it++){
  const st=await p.evaluate(()=>{if(window.__R)return {done:true};const d=CTCDrill.debug();if(!d)return null;return {dock:d.dock,talking:d.talking,fc:!document.querySelector('.ctc-forecast').hidden,wait:[...document.querySelectorAll('.dk-c.wait')].map(x=>[x.dataset.id,parseFloat(x.querySelector('.dk-g b').style.width)]),moving:/열차가 움직이고/.test(document.querySelector('.dk-main').textContent)};});
  if(!st||st.done)break;
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
   const t=todo[0];if(t){const ST={'금천구청':'geumcheon','구로':'guro','안양':'anyang','군포':'gunpo','금정':'geumjeong','종각':'jonggak','지하서울':'underground-seoul','석수':'seoksu','동묘앞':'dongmyo'};const st=ST[Object.keys(ST).find(k=>t.includes(k+'역'))]||'guro';let a=null,m;
    if(/CCM/.test(t))a={type:'mode',value:'CCM'};else if(/AUTO/.test(t))a={type:'mode',value:'AUTO'};
    else if(m=t.match(/(\w+) 신호 취소/))a={type:'stop',id:m[1]};else if(m=t.match(/(\w+-\w+) (출발 진행|장내 진행|입환표지)/))a={type:'route',id:m[1]};
    const r=await p.evaluate(([st,a])=>JSON.stringify(CTCDrill.frame().SimRemote.command({type:'control',station:st,action:{...a,source:'LS'}})||'').slice(0,120),[st,a]);
    console.log('OPS',t.slice(0,40),JSON.stringify(a),r);}
   await p.waitForTimeout(500);continue;
  }
  if(st.dock==='who'){await p.click('.dk-c.hinted');await p.waitForTimeout(60);continue;}
  if(st.dock==='call'||st.dock==='choice'){const h=await p.$('.dk-p.hinted');if(h)await h.click();else await p.click('.dk-end');await p.waitForTimeout(60);continue;}
  if(st.moving){if(!mv){mv=true;console.log('MOVE from:',await where());}await p.waitForTimeout(300);continue;}else if(mv){mv=false;console.log('MOVE to  :',await where());console.log('JOBS',await p.evaluate(()=>{const s=CTCDrill.frame().SimRemote.snapshot;return JSON.stringify((s.scenario.jobs||[]).filter(j=>/G12/.test(j.number)).map(j=>[j.number,j.status,j.wait||j.reason||j.waiting,JSON.stringify(j).slice(0,400)])).slice(0,500)+' sig '+JSON.stringify(s.states.guro.signals).slice(0,300)+' routes '+Object.keys(s.states.guro.routes).join(',')+' mode '+s.states.guro.mode;}));}
  if(st.talking){await p.keyboard.press('Space');await p.waitForTimeout(20);continue;}
  await p.waitForTimeout(60);
 }
 await p.waitForTimeout(400);
 console.log('end:',await p.evaluate(()=>CTCDrill.frame()?'open':'closed'));
 console.log('RESULT',JSON.stringify(await p.evaluate(()=>window.__R)).slice(0,220));
 console.log('log tail:',await p.evaluate(()=>[...document.querySelectorAll('.dk-b')].slice(-4).map(x=>x.innerText.replace(/\n+/g,': ').slice(0,60)).join(' | ')));
 console.log('errors',errs.slice(0,5));
 await b.close();
})();
