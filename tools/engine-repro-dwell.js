// 엔진 이슈 A7·A8 재현: python3 -m http.server 8765 뒤 node tools/engine-repro-dwell.js (게임 없이 내장 시뮬레이터만 돌린다)
const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('http://localhost:8765/ctc/index.html?embed=1');await p.waitForFunction(()=>window.SimRemote&&SimRemote.snapshot&&SimRemote.snapshot.ftsLibrary);
console.log(await p.evaluate(async()=>{const R=SimRemote,L=R.snapshot.ftsLibrary,log=[],w=ms=>new Promise(r=>setTimeout(r,ms));
 const sc=L.scenarios.find(s=>s.situations.length===1&&L.situations.find(x=>x.id===s.situations[0])?.problems[0]==='P-em-06');
 log.push('start '+JSON.stringify(R.command({type:'fts',op:'start',scenario:sc.id,professor:'001',student:'tester'})));R.command({type:'clock',paused:true});await w(600);
 for(const k of ['n1','n2','n3','n4','n5','n6'])R.command({type:'fts',op:'manual',key:'comm:'+k,checked:true});await w(300);
 const pos=n=>{for(const [st,s] of Object.entries(R.snapshot.ls.stations))for(const [sl,rows] of Object.entries(s.windows))for(const r of rows)if(r.number===n)return st+'/'+sl;return '-';};
 const job=n=>{const j=(R.snapshot.scenario.jobs||[]).find(j=>j.number===n&&!['done','cancelled'].includes(j.phase));return j?j.phase+' '+j.station+'/'+j.from+'→'+j.to+' '+(j.reason||'')+' clk='+R.snapshot.states[j.station]?.clock+' until='+j.until:'(no job)';};
 for(let i=0;i<50;i++){R.command({type:'tick',seconds:30});await w(80);if(i%3===0)log.push('t+'+(i+1)*30+' K0450 '+pos('K0450')+' | '+job('K0450'));}
 const f=n=>{for(const [st,s] of Object.entries(R.snapshot.ls.stations))for(const [slot,rows] of Object.entries(s.windows))for(const r of rows)if(r.number===n)return {station:st,slot,uid:r.uid};};
 const k=f('K0450');log.push('kick (game runTrain) '+JSON.stringify(R.command({type:'scenario:move',auto:true,action:{op:'delete',station:k.station,slot:k.slot,uid:k.uid}})));
 for(let i=0;i<40;i++){R.command({type:'tick',seconds:30});await w(80);if(i%3===0)log.push('k+'+(i+1)*30+' K0450 '+pos('K0450')+' | '+job('K0450'));}
 return log.join('\n');}));await b.close();})();
