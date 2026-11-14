// 원칙 14 회귀 검사: 3장부터 call·rush의 지시 항목은 완결된 문장이고, 항목마다 즉시 복창(reply)이 있어야 한다.
// 실행: node tools/dialogue-check.js
'use strict';
const fs=require('node:fs'),vm=require('node:vm');const scenes={};
const ctx=vm.createContext({CTCDrill:{scene:(id,s)=>scenes[id]=s,sceneDef:id=>scenes[id]}});
for(const f of ['blocks.js','drill-ch01.js','drill-ch02.js','drill-ch03.js','drill-ch04.js','drill-ch05.js','drill-ch06.js','drill-ch07.js','drill-ch08.js','drill-final.js'])vm.runInContext(fs.readFileSync('story/ctc/'+f,'utf8'),ctx,{filename:f});
const bad=[];
for(const [id,s] of Object.entries(scenes)){if(/^ch0[12]/.test(id))continue;   // 튜토리얼 제외
 const visit=c=>{if(!c.say)return;for(const x of c.say){const l=(x.line||'').trim();
  if(/[,，]$|하시고$|하고$/.test(l))bad.push(`${id} [${c.title||c.who}] 끊긴 대사: ${l}`);
  if(c.say.length>1&&!x.reply)bad.push(`${id} [${c.title||c.who}] 복창 없음: ${l}`);}};
 for(const b of s.beats){if(b.t==='call')visit(b);if(b.t==='rush')b.needs.forEach(visit);if(b.t==='source')bad.push(`${id} source 비트(원본 통째 읽기): ${b.ids}`);}}
if(bad.length){console.error(bad.join('\n'));process.exitCode=1;}else console.log(`PASS: ${Object.keys(scenes).length-2}개 장면, 끊긴 대사·복창 없는 항목·source 비트 0개`);
