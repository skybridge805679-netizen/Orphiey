'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const scenes={},ctx=vm.createContext({CTCDrill:{scene:(id,s)=>scenes[id]=s,sceneDef:id=>scenes[id]},structuredClone,crypto:require('node:crypto').webcrypto,localStorage:{getItem:()=>null}});
for(const file of ['blocks.js',...fs.readdirSync('story/ctc').filter(f=>/^drill-(ch\d+|final)\.js$/.test(f)),'challenge.js'])vm.runInContext(fs.readFileSync('story/ctc/'+file,'utf8'),ctx,{filename:file});
const challenge=vm.runInContext('Challenge',ctx),original=JSON.stringify(scenes);
const cases=[];
for(const base of Object.keys(scenes).filter(x=>x!=='ch01-stop')){
 const docs=challenge.DOC.filter(x=>x.base===base);cases.push({base,doc:''});
 for(const d of docs)cases.push({base,doc:d.id});
 for(let i=0;i<docs.length;i++)for(let j=i+1;j<docs.length;j++)if(!docs[i].major&&!docs[j].major)cases.push({base,doc:docs[i].id+'+'+docs[j].id});
}
let count=0;
for(const c of cases)for(const seed of [1,42,20261114]){
 const args={...c,seed};const info=challenge._build(args),first=JSON.stringify(scenes.challenge);
 const roster=new Set(scenes.challenge.roster.map(r=>r.id));
 for(const b of scenes.challenge.beats){
  for(const call of b.t==='rush'?b.needs:b.t==='call'?[b]:[]){assert(roster.has(call.who),`${c.base}/${c.doc}: 호출 상대 없음 ${call.who}`);assert(call.say?.length,`${c.base}/${c.doc}: 필수 지시 없음`);}
 }
 challenge._build(args);assert.equal(JSON.stringify(scenes.challenge),first,'같은 seed 재현');assert.equal(info.docs.join('+'),c.doc,'요청한 분기 누락');count++;
}
for(const args of [{base:'missing'},{base:'ch03-rescue',doc:'missing'},{base:'ch07-collision',doc:'derail+brake'}])assert.throws(()=>challenge._build(args));
delete scenes.challenge;assert.equal(JSON.stringify(scenes),original,'본편 원본 변형 금지');
console.log(`PASS ${cases.length}개 허용 문서 조합 × 3 seed = ${count}개 생성·참조·재현 검사; 잘못된 요청 3개 거부`);
for(const base of Object.keys(scenes).filter(x=>x!=='ch01-stop'&&x!=='challenge'))for(const t of challenge.TWISTS){
 const info=challenge._build({base,doc:'',twists:[t.id],seed:42});
 assert(info.twistIds.includes(t.id),base+': 요청한 공통 상황변경 누락 '+t.id);
 const beats=scenes.challenge.beats;
 if(['cock','sick','silent','ghost','eager'].includes(t.id))assert(beats.some(b=>b.t==='requireTrain'),base+': 정차 위치 검사 누락');
 if(t.id==='sick')assert(beats.some(b=>b.t==='call'&&b.who.startsWith('tw-station-')),base+': 119 인수 지시 누락');
}
console.log('PASS 8개 기반 장면 × 공통 상황변경 7개 = 56개 대상·후속 통보 검사');
