// 순서 회귀 검사. 실행: node tools/drill-procedure-test.js
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const scenes={};const ctx=vm.createContext({CTCDrill:{scene:(id,s)=>scenes[id]=s}});
for(const f of ['blocks.js','drill-ch03.js','drill-final.js'])vm.runInContext(fs.readFileSync('story/ctc/'+f,'utf8'),ctx,{filename:f});
const s=scenes['ch03-rescue'],beats=s.beats;
const op=id=>beats.findIndex(b=>b.t==='ops'&&b.objs.includes(id));
const departure=who=>beats.findIndex(b=>b.t==='call'&&b.who===who&&b.say.some(x=>x.last));
const go=departure('k1212'),routes=op('route-geumcheon-3B-B639T');
assert(routes<go,'진로 개통 뒤 기관사 출발 지시');
{const g=beats.findIndex((b,i)=>i<routes&&b.t==='call'&&b.who==='stations');assert(g>=0,'관계역 일괄 통보 누락');const c=beats[g],said=c.say.map(x=>x.line).join(' '),opened=c.open.map(x=>x[2]).join(' ');for(const n of ['금천구청','독산','가산디지털단지','구로'])assert(opened.includes(n),'관계역 호출 누락: '+n);assert(said.includes('상1선')&&said.includes('무정차')&&said.includes('안내방송'),'관계역 통보 내용 누락');}
assert(op('rename-G1210')<departure('k1210'),'구원 출발 전에 열번 변경');
assert(op('ack-G1210')<op('delete-G1210'),'중복 알람 확인 뒤 합병 열번 삭제');
assert(op('delete-G1210')<op('rename-G1208'),'합병 뒤 회송 열번 변경');
assert(op('rename-G1208')<departure('k1208'),'회송 출발 전에 열번 변경');
assert(!beats.some(b=>b.t==='do'&&(b.rename||b.del)),'3장 열번 자동 대행 금지');
const final=scenes['final-exam'].beats;
assert(final.findIndex(b=>b.t==='ops'&&b.objs.includes('route-geumcheon-3B-B639T'))<final.findIndex(b=>b.t==='call'&&b.who==='k1212'&&b.say.some(x=>x.last)),'최종장도 진로 개통 뒤 출발 지시');
console.log('PASS: 관계 4역 통보, 개통/출발 순서, 수동 열번/중복 알람, 최종장 출발 순서');
