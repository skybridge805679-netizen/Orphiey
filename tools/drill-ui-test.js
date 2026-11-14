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
  console.log('PASS: 출발 지시 순서 UI, 체크 없는 알람 확인 거부, 선택 알람만 확인, 구원 취소 후 합병 목표 없음');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
