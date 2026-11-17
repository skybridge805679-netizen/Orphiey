// 구술 시험실 회귀 검사. 실행: python3 -m http.server 8765 & 뒤 node tools/oral-test.js
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
(async()=>{const b=await chromium.launch();try{
 const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8765/');const g=p.locator('.sound-gate');if(await g.count())await g.click();
 await p.evaluate(()=>localStorage.removeItem('orpheia.oral.v1'));
 await p.click('[data-t="oral"]');await p.waitForSelector('.oral-panel');
 assert.match(await p.locator('.oral-meter').innerText(),/233/,'문제 은행 233문항');
 await p.click('[data-o="count"] [data-v="5"]');await p.click('[data-o="timer"] [data-v="0"]');await p.click('[data-a="start"]');
 // 1문제: 전부 말하면 바로 완벽 채점
 await p.waitForSelector('.oral-card');let it=await p.evaluate(()=>Oral._state().q.it);
 await p.fill('.oral-input textarea',it.key.join('. '));await p.keyboard.press('Enter');
 await p.waitForSelector('.oral-review',{timeout:8000});assert.match(await p.locator('.oral-grade').innerText(),/100/,'전부 말하면 100점');
 // 2문제: 패스하면 0점, 빠진 항목이 빨갛게
 await p.click('[data-a="next"]');await p.waitForSelector('.oral-card');await p.click('[data-a="pass"]');
 await p.waitForSelector('.oral-review');assert.match(await p.locator('.oral-grade').innerText(),/^0/,'패스는 0점');
 assert((await p.locator('.oral-card.missed').count())>0,'빠진 항목 표시');
 // 나머지는 패스로 끝내고 결과
 for(let i=0;i<3;i++){await p.click('[data-a="next"]');await p.waitForSelector('.oral-card');await p.click('[data-a="pass"]');await p.waitForSelector('.oral-review');}
 await p.click('[data-a="next"]');await p.waitForSelector('.oral-result');
 assert.match(await p.locator('.oral-result').innerText(),/틀린 문제만 \(4\)/,'틀린 문제만 다시');
 const st=await p.evaluate(()=>JSON.parse(localStorage.getItem('orpheia.oral.v1')));
 assert.equal(Object.keys(st.stats).length,5,'간격 반복 기록 5문항');
 assert(Object.values(st.stats).some(s=>s.due<Date.now()+10*60*1000),'틀린 문제는 곧 다시');
 // 틀린 문제만 다시 → 4문제
 await p.click('[data-a="wrong"]');await p.waitForSelector('.oral-card');assert.equal(await p.evaluate(()=>Oral._state().n),4);
 await p.click('[data-a="quit"]');p.once('dialog',d=>d.accept());await p.waitForSelector('.oral-panel');
 // 카드 모드: 정답 보기 → 알았음
 await p.click('[data-o="mode"] [data-v="card"]');await p.click('[data-a="start"]');await p.waitForSelector('.oral-flip');await p.click('[data-a="show"]');await p.click('[data-g="1"]');
 await p.waitForFunction(()=>Oral._state()?.res.length===1);
 // 휴대폰 폭에서 가로 넘침 없음
 await p.setViewportSize({width:390,height:844});const over=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert(!over,'휴대폰 폭 가로 넘침 없음');
 assert.deepEqual(errs,[],'페이지 오류 없음');
 console.log('PASS: 구술 시험실 233문항, 완벽·패스 채점, 빠진 항목 표시, 간격 반복 기록, 틀린 문제만 다시, 카드 모드, 휴대폰 폭');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
