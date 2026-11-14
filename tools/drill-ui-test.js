'use strict';
const assert=require('node:assert/strict');
const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
(async()=>{
 const b=await chromium.launch();
 try{
  const p=await b.newPage();await p.goto('http://localhost:8765/');
  const gate=p.locator('.sound-gate');if(await gate.count()){await gate.click();await gate.waitFor({state:'detached'});}
  await p.evaluate(()=>{CTCDrill.scene('procedure-ui-check',{problem:'em-05',roster:[{id:'driver',name:'기관사'}],whoBad:{},beats:[{t:'call',incoming:true,who:'driver',say:[{text:'운행 조건 전달',line:'운행 조건 전달합니다.'},{last:true,text:'신호 확인 출발',line:'신호 확인 출발.'}]}]});CTCDrill.start('procedure-ui-check',()=>{});});
  await p.waitForSelector('.dk-p',{timeout:30000});
  assert.equal(await p.getByRole('button',{name:'신호 확인 출발',exact:true}).count(),0);
  await p.getByRole('button',{name:'운행 조건 전달',exact:true}).click();
  for(let i=0;i<100;i++){if(await p.getByRole('button',{name:'신호 확인 출발',exact:true}).count())break;await p.keyboard.press('Space');await p.waitForTimeout(50);}
  assert.equal(await p.getByRole('button',{name:'신호 확인 출발',exact:true}).count(),1);
  await p.evaluate(()=>{const w=CTCDrill.frame();w.SimMMI.raiseAlarm('열차번호 중복 회귀검사');w.SimMMI.raiseAlarm('미선택 알람 회귀검사');CTCDrill.look('mmi');});
  const count=()=>p.locator('#ctcTerm [data-alarm-check]').count();
  assert.equal(await count(),2);
  await p.click('#ctcTerm [data-do="ack"]');assert.equal(await count(),2,'체크 없이 확인하면 알람 유지');
  await p.locator('#ctcTerm [data-alarm-check]').first().check();await p.click('#ctcTerm [data-do="ack"]');
  assert.equal(await count(),1,'선택한 알람만 확인');
  assert.match(await p.locator('#ctcTerm .mm-alarms').innerText(),/열차번호 중복/);
  const branches=await p.evaluate(()=>{Challenge._build({base:'ch03-rescue',doc:'bogie'});return CTCDrill.sceneDef('challenge').beats.filter(b=>b.t==='ops').flatMap(b=>b.objs);});
  assert(!branches.some(x=>/G1210|G1208/.test(x)));
  // 힌트 끔: 게이지 숨김, 재촉 무전, 재촉 뒤 호출은 첫 시도 하나를 잃음
  const q=await b.newPage();await q.goto('http://localhost:8765/');
  const gate2=q.locator('.sound-gate');if(await gate2.count()){await gate2.click();await gate2.waitFor({state:'detached'});}
  await q.evaluate(()=>{const h=document.querySelector('#ctcHint');if(h&&h.checked){h.checked=false;h.dispatchEvent(new Event('change'));}
   CTCDrill.scene('rush-blind-check',{problem:'em-05',roster:[{id:'a',who:'harin',name:'A 기관사',call:'A열차'},{id:'b',who:'jian',name:'B역',call:'B역'},{id:'ls',name:'LS 조작'}],whoBad:{},beats:[{t:'rush',needs:[
    {id:'a',who:'a',patience:4,autoEnd:true,title:'A',say:[{text:'A 지시',line:'A열차, 지시합니다. 관제 이상!'}],late:{bad:'늦음',why:'늦음'}},
    {id:'b',who:'b',patience:60,autoEnd:true,title:'B',nag:'철도관제, B역입니다! 재촉합니다!',say:[{text:'B 지시',line:'B역, 지시합니다. 관제 이상!'}],late:{bad:'늦음',why:'늦음'}}]}]});
   CTCDrill.start('rush-blind-check',()=>{});});
  await q.waitForSelector('.dk-contacts .dk-c.wait',{timeout:30000});
  const h=await q.evaluate(()=>document.querySelector('#ctcHint')?.checked);assert.equal(h,false,'힌트 꺼짐');
  assert.equal(await q.locator('.dk-contacts.blind').count(),1,'힌트 끔이면 blind');
  assert.equal(await q.locator('.dk-contacts .dk-g').first().evaluate(e=>getComputedStyle(e).visibility),'hidden','게이지 숨김');
  await q.waitForSelector('.dk-c.nag[data-id="a"]',{timeout:8000});
  assert.match(await q.locator('.dk-log').innerText(),/A열차! 지시 기다리고 있습니다/,'기본 재촉 무전');
  await q.click('.dk-c[data-id="a"]');
  await q.getByRole('button',{name:'A 지시',exact:true}).click();
  for(let i=0;i<100;i++){if(await q.locator('.dk-c[data-id="b"].wait').count())break;await q.keyboard.press('Space');await q.waitForTimeout(60);}
  assert.match(await q.locator('.ctc-score').innerText(),/첫 시도 1\/2/,'재촉 뒤 호출은 첫 시도 하나를 잃음');
  console.log('PASS: 힌트 끔 게이지 숨김·재촉 무전·재촉 감점, 출발 지시 순서 UI, 체크 없는 알람 확인 거부, 선택 알람만 확인, 구원 취소 후 합병 목표 없음');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
