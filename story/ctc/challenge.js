'use strict';
// 도전 모드 — 본편을 끝내면 열린다. 교수가 사고와 「상황 변경」을 무작위로 낸다.
//  · 사고: 2장~최종장의 실습 장면 중 하나를 무작위로 고른다.
//  · 상황 변경: 아래 TWISTS에서 무작위로 뽑아 그 장면에 끼워 넣는다.
//      rush형 — 가장 바쁜 호출 중간에 끼어드는 무전 (짧은 인내 게이지)
//      choice형 — 교수가 「상황 변경.」을 선언하고 내는 판단
//  · 규칙: 힌트·대본 없음, 예측 연산 ◆ 2개, 인내 게이지 0.6배, 선택지 순서도 매번 다름.
//  · 난수는 crypto.getRandomValues. 같은 판은 다시 나오지 않는다.
// 새 상황 변경을 더하려면 TWISTS에 항목을 추가한다. 어떤 사고에서도 말이 되도록, 열차·역 이름은 인자로 받아 쓴다.
const Challenge=(()=>{
 const POOL=['ch02-report','ch03-rescue','ch04-casualty','ch05-flood','ch06-fire','ch07-collision','final-exam'];
 const RULES={forecasts:2,patience:.6};
 const KEY='orpheia-challenge-v1';   // 'orpheia.' 으로 시작하는 키는 시뮬레이터 초기화 때 지워지므로 쓰지 않는다
 const rnd=()=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/2**32;};
 const pick=a=>a[Math.floor(rnd()*a.length)];
 const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{};}catch{return {};}};
 const save=r=>{try{localStorage.setItem(KEY,JSON.stringify(r));}catch{}};

 // ── 상황 변경 목록. kind:'rush' → need를 돌려준다(t=끼어드는 상대의 명단 항목). kind:'choice' → beats 배열을 돌려준다.
 const TWISTS=[
  {id:'nag',kind:'rush',who:'chief',name:'팀장의 독촉',make:r=>({who:r.id,patience:16,title:'관제팀장',ask:'열차 통제 한가운데에 팀장이 불렀어요. 어떻게 답할까요?',
   open:[[r.who,'관제팀장','관제사님! 본사에서 전화가 왔어요. 지금 상황 어떻게 됩니까?','urgent']],autoEnd:true,
   late:{said:'(늦음) 관제팀장',bad:'팀장은 대답을 기다리다 직접 관제석으로 걸어왔다. 그는 관제사의 어깨 너머로 LS를 보며 질문을 시작했다. 질문은 열한 개였고, 그동안 무전기는 세 번 울렸다.',why:'윗선의 호출도 무전이에요. 짧게라도 바로 답해야 더 큰 방해가 안 돼요.'},
   say:[{text:'열차 통제 중이며, 끝나는 대로 상세 보고하겠다고 짧게 답한다',line:'현재 열차 통제 중입니다. 통제 끝나는 대로 상세 보고드리겠습니다. 이상!',reply:[[r.who,'관제팀장','……알겠어요. 통제부터 하세요.']],bad:'',why:''}],
   no:[{text:'통제를 멈추고 처음부터 상세히 보고한다',bad:'보고는 3분이 걸렸다. 꼼꼼하고 정확한 보고였다. 그 3분 동안 아직 지시를 받지 못한 열차들은 계속 달렸다.',why:'달리는 열차가 먼저예요. 보고는 한 문장으로 하고 통제로 돌아가요.'},
    {text:'「바쁩니다」 하고 끊는다',bad:'팀장은 끊긴 무전기를 한참 보았다. 그리고 본사에 「파악 중」이라고 답했다. 본사는 30초 뒤 다시 전화했다. 이번에는 팀장이 직접 관제석으로 왔다.',why:'무엇을 하는 중이고 언제 보고할지, 한 문장은 줘야 해요.'}]})},
  {id:'cock',kind:'rush',who:'train',name:'비상코크',make:r=>({who:r.id,patience:18,title:r.name,ask:'세워 둔 열차에서 급한 무전이 왔어요.',
   open:[[r.who,r.name,`철도관제! ${r.call}, 객실에서 승객이 비상코크를 취급했습니다! 출입문 하나가 열렸습니다!`,'urgent']],
   late:{said:`(늦음) ${r.call}`,bad:'열린 문으로 승객 한 명이 선로에 내려섰다. 뒤따라 세 명이 더 내렸다. 그들은 역을 향해 걷기 시작했다. 옆 선로에는 열차가 다니고 있었다.',why:'문이 열린 열차는 바로 받아요. 승객이 선로에 내려서기 전에요.'},
   say:[{text:'승객이 선로로 내려가지 않게 안내방송하고 출입문을 복구하게 한다',line:`${r.call}, 승객이 선로로 내려가지 않도록 안내방송 하시고 출입문 복구하세요.`,bad:'기관사는 옆 선로만 확인했다. 그동안 열린 문으로 승객 둘이 선로에 내려섰다.',why:'먼저 승객을 객실에 붙잡아요. 방송과 문 복구.'},
    {text:'선로에 내려간 승객이 있는지 확인해 통보하게 한다',line:'선로에 내려간 승객 있는지 확인 후 통보 바랍니다. 관제 이상!',reply:[[r.who,r.name,'출입문 복구했습니다! 선로에 내려간 승객 없습니다! 이상!']],bad:'문은 닫혔다. 그 전에 내려간 승객이 있는지는 아무도 확인하지 않았다. 관제는 옆 선로 열차를 보내도 되는지 알 수 없었다.',why:'내려간 사람이 있으면 옆 선로도 세워야 해요. 확인을 받아요.'}],
   no:[{text:'문이 열렸으니 승객을 모두 내리게 한다',bad:'승객 900명이 문 하나로 내리기 시작했다. 승강장이 아닌 쪽 문이었다.',why:'열린 문이 승강장 쪽이라는 보장이 없어요. 내리게 하는 게 아니라 붙잡아요.'},
    {text:'문이 열린 채로 다음 역까지 가게 한다',bad:'열차는 문 하나를 연 채 출발했다. 3호차 승객들은 서로의 팔을 붙잡고 다음 역까지 갔다.',why:'문이 열린 열차는 움직이지 않아요.'}]})},
  {id:'sick',kind:'rush',who:'train',name:'응급환자',make:r=>({who:r.id,patience:18,title:r.name,ask:'세워 둔 열차에서 급한 무전이 왔어요.',
   open:[[r.who,r.name,`철도관제! ${r.call}, 객실에 응급환자 발생했습니다! 승객 한 분이 쓰러졌습니다!`,'urgent']],
   late:{said:`(늦음) ${r.call}`,bad:'기관사는 관제의 대답을 기다리다 스스로 119에 전화했다. 구급대가 물었다. 「지금 어느 역입니까?」 관제가 세워 둔 역이었다. 역은 아무것도 모르고 있었다.',why:'사고 대응 중에도 응급환자 무전은 바로 받아요.'},
   say:[{text:'지금 서 있는 역에서 환자를 내려 역무원에게 인계하게 한다',line:`${r.call}, 정차 중인 역에서 환자 하차시켜 역무원에게 인계하세요.`,bad:'관제는 119만 불렀다. 구급대는 역에 도착했고, 환자는 아직 객실에 있었다. 열차 문은 닫혀 있었다.',why:'열차는 이미 역에 서 있어요. 환자를 승강장으로 내려 역에 넘겨요.'},
    {text:'그 역에 119 요청과 환자 인수를 지시하겠다고 알린다',line:'해당 역에 119 요청 및 환자 인수 지시하겠습니다. 관제 이상!',reply:[[r.who,r.name,'환자 하차, 역무원 인계! 수신 이상!']],bad:'환자는 승강장에 내려졌다. 역무원은 왜 사람이 누워 있는지 몰랐다. 119는 아무도 부르지 않았다.',why:'환자를 받을 역과 119까지 이어 줘야 끝나요.'}],
   no:[{text:'큰 병원이 있는 역까지 운행하게 한다',bad:'열차는 출발했다. 관제가 세워 둔 이유는 그대로였다. 열차는 사고 지점 앞에서 다시 섰다. 이번에는 역과 역 사이였다.',why:'세워 둔 열차예요. 지금 있는 역에서 인계해요.'},
    {text:'객실에 의사가 있는지 방송으로 찾게만 한다',bad:'방송이 나갔다. 치과의사 한 명이 손을 들었다. 그는 최선을 다해 환자의 입안을 살폈다.',why:'찾는 것으로 끝내지 않아요. 역과 119에 넘겨요.'}]})},
  {id:'crowd',kind:'rush',who:'station',name:'승강장 혼잡',make:r=>({who:r.id,patience:18,title:r.name,ask:'역에서 급한 무전이 왔어요.',
   open:[[r.who,r.name,`철도관제! ${r.call}, 승강장이 꽉 차서 승객이 선로 쪽으로 밀립니다!`,'urgent']],autoEnd:true,
   late:{said:`(늦음) ${r.call}`,bad:'승강장 끝에 선 사람들이 노란 선을 넘었다. 역무원 둘이 팔을 벌려 막았다. 그들은 관제의 대답을 12분 동안 기다렸다.',why:'역의 급한 무전은 열차만큼 급해요.'},
   say:[{text:'개찰구에서 승강장 진입을 통제하고 안내방송하게 한다',line:`${r.call}, 개찰구에서 승강장 진입 통제하고 안내방송 하세요. 관제 이상!`,reply:[[r.who,r.name,'진입 통제, 안내방송. 수신 이상!']],bad:'',why:''}],
   no:[{text:'세워 둔 열차를 빨리 들여보내 승객을 태우게 한다',bad:'세워 둔 열차가 출발했다. 세운 이유는 그대로였다. 열차는 역에 닿기 전에 다시 섰다.',why:'열차를 세운 이유가 풀리지 않았어요. 사람이 더 들어오지 않게 막는 게 먼저예요.'},
    {text:'승강장의 승객을 모두 역 밖으로 내보내게 한다',bad:'꽉 찬 승강장의 승객들이 한꺼번에 계단으로 몰렸다. 계단이 승강장보다 더 위험해졌다.',why:'안에 있는 사람을 한꺼번에 움직이지 않아요. 더 들어오는 것을 막아요.'}]})},
  {id:'silent',kind:'choice',name:'무전 불통',make:(t,st)=>[
   {t:'say',lines:[['instructor','','상황 변경.'],['instructor','',`${t.name}가 무전에 응답하지 않아요. 세 번 불렀는데 대답이 없어요.`]]},
   {t:'choice',title:'무전 불통',ask:`${t.call}이 응답하지 않아요. 그 열차에 전할 지시가 있어요.`,opts:[
    {text:'열차가 서 있는 역을 불러 역무원이 기관사에게 직접 전하게 한다',ok:true},
    {text:'응답할 때까지 계속 호출한다',bad:'관제는 같은 열차를 열일곱 번 불렀다. 그동안 다른 열차 여섯 대가 자기 차례를 기다렸다. 그 기관사의 무전기는 배터리가 떨어져 있었다.',why:'무전이 안 되면 다른 길로 전해요. 역, 휴대폰, 열차무선 비상 채널.'},
    {text:'뒤 열차를 보내서 확인하게 한다',bad:'뒤 열차는 지시대로 출발했다. 앞 열차가 서 있는 구간으로. 신호가 세워 주었다. 이제 응답 없는 열차 뒤에, 역도 아닌 곳에 열차가 한 대 더 섰다.',why:'열차가 있는 구간에 열차를 넣지 않아요.'},
    {text:'지시를 들었을 거라 보고 그대로 진행한다',bad:'그 기관사는 듣지 못했다. 그는 마지막으로 들은 지시대로 움직였다. 그건 10분 전의 지시였다.',why:'복창을 받지 못한 지시는 전달되지 않은 지시예요.'},
   ]},
   {t:'say',lines:[['sangcheol','',`${st?st.call:'해당 역'}, 관제 이상! ${t.call} 기관사에게 직접 가서 관제 무전 수신하도록 전해 주세요.`],[t.who,t.name,`……${t.call}, 이상! 죄송합니다, 무전기 채널이 돌아가 있었습니다!`]]}]},
  {id:'ghost',kind:'choice',name:'사라진 점유',make:t=>[
   {t:'say',lines:[['instructor','','상황 변경.'],['instructor','',`LS에서 ${t.call}의 열번이 사라졌어요. 궤도 점유 표시도 꺼졌어요.`]]},
   {t:'choice',title:'사라진 점유',ask:`방금까지 있던 ${t.call}이 LS에서 사라졌어요. 그 선로로 곧 다른 열차를 보내야 해요.`,opts:[
    {text:'기관사를 불러 현재 위치를 직접 확인한다',ok:true},
    {text:'LS에 없으니 빈 선로로 보고 다음 열차를 보낸다',bad:'다음 열차가 그 선로로 들어섰다. 열차는 사라지지 않았다. 화면에서만 사라졌을 뿐이었다. 신호가 세워 주었고, 두 열차 사이는 40미터였다.',why:'LS는 설비예요. 설비가 틀릴 수 있어요. 열차 위치는 기관사에게 물어서 확인해요.'},
    {text:'LS가 다시 표시해 줄 때까지 기다린다',bad:'관제는 화면을 보며 기다렸다. 화면은 돌아오지 않았다. 20분 뒤 신호 담당이 전화를 받았다. 「궤도회로 단선입니다. 한 시간 걸립니다.」',why:'기다리지 않고 물어요. 무전이 있어요.'},
    {text:'열번을 원래 자리에 다시 넣어 두고 넘어간다',bad:'관제는 열번을 손으로 다시 넣었다. 화면은 깨끗해졌다. 그 열차가 정말 거기 있는지는 여전히 아무도 몰랐다.',why:'화면을 고치는 게 아니라 사실을 확인해요.'},
   ]},
   {t:'say',lines:[['sangcheol','',`${t.call}, 관제 이상! 현재 위치 알려 주세요.`],[t.who,t.name,`${t.call}, 지시받은 역에 그대로 정차 중입니다! 이상!`],['sangcheol','','정차 중 확인. 신호 담당에 궤도회로 점검 요청하겠습니다. 관제 이상!']]}]},
  {id:'eager',kind:'choice',name:'임의 출발',make:t=>[
   {t:'say',lines:[['instructor','','상황 변경.'],[t.who,t.name,`철도관제! ${t.call}, 승객 항의가 심합니다! 신호가 열려 있으니 출발하겠습니다!`,'urgent']]},
   {t:'choice',title:'임의 출발',ask:`세워 둔 ${t.call}이 출발하겠다고 해요. 신호는 정말 열려 있어요.`,opts:[
    {text:'관제 지시 없이 출발하지 말라고 다시 지시하고, 지연 안내방송을 하게 한다',ok:true},
    {text:'신호가 열려 있으니 출발해도 된다고 한다',bad:'열차는 출발했다. 신호는 다음 역까지만 열려 있었다. 그다음 신호는 정지였고, 그곳은 역과 역 사이였다. 승객 항의는 두 배가 되었다.',why:'신호는 한 구간만 말해 줘요. 전체를 보는 건 관제예요. 세운 이유가 풀리지 않았어요.'},
    {text:'항의하는 승객을 내리게 한다',bad:'항의하던 승객 열 명이 내렸다. 남은 890명도 내리고 싶어 했다. 기관사는 문 앞에서 한 명씩 설득했다.',why:'승객에게 필요한 건 하차가 아니라 이유예요. 안내방송을 하게 해요.'},
    {text:'대답하지 않고 다른 무전부터 처리한다',bad:'기관사는 대답이 없자 승낙으로 받아들였다. 열차는 출발했다.',why:'대답하지 않으면 기관사는 스스로 판단해요.'},
   ]},
   {t:'say',lines:[['sangcheol','',`${t.call}, 관제 지시 있을 때까지 출발하지 마세요. 지연 사유 안내방송 하시기 바랍니다. 관제 이상!`],[t.who,t.name,`${t.call}, 출발 대기, 안내방송. 수신 이상!`]]}]},
 ];

 // 장면 하나를 복제해 도전용으로 바꾼다.
 function build(){
  const base=pick(POOL),def=structuredClone(CTCDrill.sceneDef(base)),used=[];
  const rushes=def.beats.filter(b=>b.t==='rush');
  for(const b of rushes)for(const n of b.needs)n.patience=Math.max(8,Math.round(n.patience*RULES.patience));
  const trains=def.roster.slice(1).filter(r=>/^[ak]\d/.test(r.id)),station=def.roster.find(r=>r.id==='station'),chief=def.roster.find(r=>r.id==='chief');
    // rush형: 무작위 rush 1~2곳에, 그 rush에 없는 상대를 끼워 넣는다
  let rk=0;
  for(const b of shuffle(rushes).slice(0,1+Math.floor(rnd()*2))){
   const busy=new Set(b.needs.map(n=>n.who));let got=null;
   for(const t of shuffle(TWISTS.filter(t=>t.kind==='rush'&&!used.includes(t)))){
    const free=(t.who==='train'?trains:t.who==='station'?[station]:[chief]).filter(r=>r&&!busy.has(r.id));
    if(free.length){got=[t,pick(free)];break;}
   }
   if(!got)continue;const [t,r]=got;
   b.needs.push({...t.make(r),id:'tw'+(rk++),afterCount:1+Math.floor(rnd()*Math.max(1,b.needs.length-1))});used.push(t);
  }
  // choice형: 첫 rush 뒤의 무작위 자리에 1~2개
  if(trains.length){
   const first=def.beats.indexOf(rushes[0]);
   for(const t of shuffle(TWISTS.filter(t=>t.kind==='choice')).slice(0,1+Math.floor(rnd()*2))){
    const safe=def.beats.map((b,i)=>i).filter(i=>i>first&&['call','rush','ops','choice'].includes(def.beats[i].t));   // 판단 비트 바로 앞에만 끼운다
    if(!safe.length)break;
    def.beats.splice(pick(safe),0,...t.make(pick(trains),station));used.push(t);
   }
  }
  def.title='도전 · '+def.title.replace(/^(제\d+장 실습|실기시험) · /,'');
  CTCDrill.scene('challenge',def);
  return {base,twists:used.map(t=>t.name)};
 }

 function result(R,info){
  const rec=load();rec.plays=(rec.plays||0)+1;rec.ranks=rec.ranks||{};
  if(!R.error){rec.ranks[R.rank]=(rec.ranks[R.rank]||0)+1;rec.streak=['S','A'].includes(R.rank)?(rec.streak||0)+1:0;rec.best=Math.max(rec.best||0,rec.streak);}
  save(rec);
  const box=document.createElement('div');box.className='ch-result';
  box.innerHTML=R.error?`<div class="ch-card"><small>도전 모드</small><h2>시뮬레이터를 불러오지 못했어요</h2><p>${R.error}</p><div class="ch-btns"><button data-a="title">타이틀로</button></div></div>`
   :`<div class="ch-card"><small>도전 결과 · ${info.twists.length?'상황 변경 '+info.twists.length+'건':'상황 변경 없음'}</small><h2>${R.title}</h2><p class="score rank-${R.rank}">${R.rank}</p>
   <p>판단 첫 시도 정답 ${R.firstTry} / ${R.decisions}${R.rewinds?` · 예측 되감기 ${R.rewinds}회`:''}</p>
   <p class="ch-tw">${info.twists.map(t=>`<span>⚡ ${t}</span>`).join('')||'<span>교수님이 봐주셨어요</span>'}</p>
   <p class="ch-rec">연속 A 이상 ${rec.streak||0}회 · 최고 ${rec.best||0}회 · 도전 ${rec.plays}회 (S ${rec.ranks.S||0} · A ${rec.ranks.A||0} · B ${rec.ranks.B||0} · C ${rec.ranks.C||0})</p>
   <div class="ch-btns"><button class="primary" data-a="again">다시 도전 ▶</button><button data-a="title">타이틀로</button></div></div>`;
  document.body.append(box);
  box.querySelectorAll('button').forEach(b=>b.onclick=()=>{box.remove();b.dataset.a==='again'?start():VN.title();});
 }
 function start(){
  const info=build();
  CTCDrill.mode({forecasts:RULES.forecasts,salt:String(rnd()),keepHint:!!start.test});   // start.test=true 는 자동 테스트용(힌트 유지)
  CTCDrill.start('challenge',R=>result(R,info));
 }
 return {start,record:load,_build:build,TWISTS};
})();
