'use strict';
// 도전 모드 — 본편을 끝내면 열린다. 교수가 사고와 「상황 변경」을 무작위로 낸다.
//  · 사고: 2장~최종장의 실습 장면 중 하나를 무작위로 고른다.
//  · 상황 변경: 아래 TWISTS에서 무작위로 뽑아 그 장면에 끼워 넣는다.
//      rush형 — 가장 바쁜 호출 중간에 끼어드는 무전 (짧은 인내 게이지)
//      choice형 — 교수가 「상황 변경.」을 선언하고 내는 판단
//      문서형(DOC) — CTC LAB 상황변경 대본에서 옮긴 것. 그 사고에만 붙고, 탈선처럼 흐름을 통째로 바꾸기도 한다
//  · 규칙: 힌트·대본 없음, 예측 연산 ◆ 2개, 인내 게이지 0.6배, 선택지 순서도 매번 다름.
//  · 난수는 crypto.getRandomValues. 같은 판은 다시 나오지 않는다.
// 새 상황 변경을 더하려면 TWISTS에 항목을 추가한다. 어떤 사고에서도 말이 되도록, 열차·역 이름은 인자로 받아 쓴다.
const Challenge=(()=>{
 const POOL=['ch02-report','ch03-rescue','ch04-casualty','ch05-flood','ch06-fire','ch07-collision','ch08-dongmyo','final-exam'];
 const RULES={forecasts:2,patience:.6};
 const KEY='orpheia-challenge-v1';   // 'orpheia.' 으로 시작하는 키는 시뮬레이터 초기화 때 지워지므로 쓰지 않는다
 let seededRandom=null;
 const rnd=()=>{if(seededRandom)return seededRandom();const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/2**32;};
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
    {text:'LS가 다시 표시해 줄 때까지 기다린다',bad:'관제는 화면을 보며 기다렸다. 화면은 돌아오지 않았다. 20분 뒤 신호 담당이 전화를 받았다. 「표시장치 장애입니다. 점검이 필요합니다.」',why:'기다리지 않고 물어요. 무전이 있어요.'},
    {text:'열번을 원래 자리에 다시 넣어 두고 넘어간다',bad:'관제는 열번을 손으로 다시 넣었다. 화면은 깨끗해졌다. 그 열차가 정말 거기 있는지는 여전히 아무도 몰랐다.',why:'화면을 고치는 게 아니라 사실을 확인해요.'},
   ]},
   {t:'say',lines:[['sangcheol','',`${t.call}, 관제 이상! 현재 위치 알려 주세요.`],[t.who,t.name,`${t.call}, 지시받은 역에 그대로 정차 중입니다! 이상!`],['sangcheol','','정차 중 확인. 신호 담당에 표시장치 점검 요청하겠습니다. 관제 이상!']]}]},
  {id:'eager',kind:'choice',name:'임의 출발',make:t=>[
   {t:'say',lines:[['instructor','','상황 변경.'],[t.who,t.name,`철도관제! ${t.call}, 승객 항의가 심합니다! 출발해도 되겠습니까? 더는 기다리기 어렵습니다!`,'urgent']]},
   {t:'choice',title:'임의 출발',ask:`세워 둔 ${t.call}이 출발하겠다고 해요. 출발 여부는 관제 지시와 현재 신호를 함께 확인해야 해요.`,opts:[
    {text:'관제 지시 없이 출발하지 말라고 다시 지시하고, 지연 안내방송을 하게 한다',ok:true},
    {text:'신호가 열려 있으니 출발해도 된다고 한다',bad:'열차는 출발했다. 신호는 다음 역까지만 열려 있었다. 그다음 신호는 정지였고, 그곳은 역과 역 사이였다. 승객 항의는 두 배가 되었다.',why:'신호는 한 구간만 말해 줘요. 전체를 보는 건 관제예요. 세운 이유가 풀리지 않았어요.'},
    {text:'항의하는 승객을 내리게 한다',bad:'항의하던 승객 열 명이 내렸다. 남은 890명도 내리고 싶어 했다. 기관사는 문 앞에서 한 명씩 설득했다.',why:'승객에게 필요한 건 하차가 아니라 이유예요. 안내방송을 하게 해요.'},
    {text:'대답하지 않고 다른 무전부터 처리한다',bad:'기관사는 대답이 없자 승낙으로 받아들였다. 열차는 출발했다.',why:'대답하지 않으면 기관사는 스스로 판단해요.'},
   ]},
   {t:'say',lines:[['sangcheol','',`${t.call}, 관제 지시 있을 때까지 출발하지 마세요. 지연 사유 안내방송 하시기 바랍니다. 관제 이상!`],[t.who,t.name,`${t.call}, 출발 대기, 안내방송. 수신 이상!`]]}]},
 ];


 // ── 문서의 상황 변경 (CTC LAB 상황변경 대본에서 옮긴 것). 특정 사고에만 붙는다.
 //    apply(def)가 장면을 직접 고친다. 자리를 못 찾으면 false를 돌려주고 그 판에서는 빠진다.
 //    major:true 는 사고의 흐름 자체를 바꾸는 것(탈선, 구원 취소)이라 한 판에 하나만, 다른 문서 상황 변경과 섞지 않는다.
 const H=(n,t,m)=>['harin',n,t,m],S=t=>['sangcheol','',t],I=t=>['instructor','',t],J=(n,t)=>['jian',n,t],R=t=>['orpheia','사고복구반',t];
 const at=(def,fn)=>def.beats.findIndex(fn),cueIs=x=>b=>b.t==='call'&&(b.cue||'').startsWith(x);
 const guro=def=>{if(!def.roster.find(r=>r.id==='guro'))def.roster.push({id:'guro',who:'jian',name:'구로역',sub:'차량교체',call:'구로역',idle:'구로역, 이상. 교체 차량 준비 중입니다.'});};
 // 구원을 취소하고 구로역 차량교체로 끝내는 결말 (05 고장대차 차단, 06 자력 운행 가능 공통)
 const swapEnd=({train,place,stationLine,why})=>[
  {t:'rush',cue:'구원은 취소예요. 열차가 스스로 구로역까지 가요. 그 전에 알아야 할 역이 둘이에요.',needs:[
   {id:'sw-st',who:'station',patience:22,autoEnd:true,title:place,ask:'사고 역이에요. 승객과 초기대응팀은 아직 「구원」으로 알고 있어요.',
    open:[S(`${place}, 관제 이상!`),J(place,`${place}, 이상.`)],
    late:{said:`(늦음) ${place}`,bad:`${train}은 승객을 태운 채 출발했다. 역 방송은 「구원열차를 기다리고 있습니다」를 반복하고 있었다. 승강장의 승객들은 떠나는 열차와 스피커를 번갈아 보았다.`,why:'계획이 바뀌면 처음 알린 곳에 다시 알려요.'},
    say:[{text:`${train}이 조치 완료로 정상운행한다고 알리고 안내방송을 하게 한다`,line:stationLine,reply:[J(place,'수신 이상.')],bad:'',why:''}],
    no:[{text:'혹시 모르니 구원 준비는 그대로 두게 한다',bad:'초기대응팀은 오지 않는 구원열차를 한 시간 더 기다렸다.',why:'바뀐 계획을 분명히 알려요.'}]},
   {id:'sw-guro',who:'guro',patience:28,autoEnd:true,title:'구로역',ask:'열차를 바꿀 역이에요. 미리 준비해야 승객이 바로 갈아타요.',
    open:[S('구로역, 관제 이상!'),J('구로역','구로역, 이상.')],
    late:{said:'(늦음) 구로역',bad:`${train}은 구로역에 도착했다. 교체할 차량은 차량기지에서 아직 출고 점검 중이었다. 승객 900명이 승강장에서 25분을 더 기다렸다.`,why:'차량교체는 받는 역이 먼저 준비해야 해요.'},
    say:[{text:`${train}을 구로역에서 차량교체하니 준비하게 한다`,line:`${train}열차 구로역에서 관제승인으로 차량교체합니다. 차량교체 준비해 주세요. 관제 이상!`,reply:[J('구로역','차량교체 준비. 구로역 수신 이상!')],bad:'',why:''}],
    no:[{text:`${train}을 구로역에서 무정차 통과시킨다고 알린다`,bad:'고장 난 열차가 승객을 태운 채 구로역을 지나쳤다. 교체할 차량은 구로역에 서 있었다.',why:'구로역에서 열차를 바꿔요.'}]},
  ]},
  {t:'do',ctl:[['guro',{type:'mode',value:'CCM'}],['guro',{type:'route',id:'2A-5T'}],['guro',{type:'mode',value:'AUTO'}]]},
  {t:'call',who:String(train).toLowerCase(),cue:'두 역 모두 알아요. 열차는 움직일 수 있지만 멀쩡한 건 아니에요.',whoWhy:'사고 열차에 출발 지시를 내려요.',
   open:[S(`${train}열차, 출발 준비 되었습니까?`),H(`${train} 기관사`,'출발 준비 완료! 이상!')],
   say:[
    {text:'구로역에서 관제승인으로 차량교체한다고 알린다',line:`${train}열차는 관제승인으로 구로역에서 차량교체합니다.`,bad:`${train}은 구로역에 섰다가 평소처럼 문을 닫고 떠났다. 교체할 차량은 옆 선로에서 그 뒷모습을 보았다.`,why:'어디서 차량을 바꾸는지 기관사가 알아야 해요.'},
    {text:'구로역까지 제동 취급에 주의하며 안전하게 운행, 신호 확인 출발',line:'구로역까지 제동 취급 주의하며 안전하게 운행하시기 바랍니다. 신호 확인 출발. 관제 이상!',reply:[H(`${train} 기관사`,`${train}열차, 구로역 차량교체, 신호 확인 출발! 이상!`)],bad:`${train}은 평소처럼 달렸다. ${why} 구로역에서 정지위치를 15미터 지나서 섰다.`,why:'응급조치만 한 차량이에요. 조심해서 가게 해요.'},
   ],
   no:[{text:'조치됐으니 종착역까지 정상 영업하게 한다',bad:`${train}은 응급조치만 한 채 종착역까지 달렸다. 일곱 정거장 뒤에 다시 섰다. 이번에는 역과 역 사이였다.`,why:'응급조치는 임시예요. 가까운 구로역에서 차량을 바꿔요.'},
    {text:'지연을 만회하도록 회복운전하게 한다',bad:`${train}은 속도를 냈다. ${why}`,why:'응급조치만 한 차량은 서두르지 않아요.'}]},
 ];
 const swapArrival=train=>[
  {t:'waitTrain',train,station:'guro',slot:'5T',text:'구로역 도착을 확인한 뒤 차량교체를 진행하세요.'},
  {t:'call',who:'guro',cue:'구로역에 도착했어요. 차량교체 완료와 승객 인계를 확인하세요.',say:[{text:'차량교체 및 승객 인계 완료를 확인한다',line:`구로역, ${train}열차 차량교체 및 승객 인계 완료했습니까?`,reply:[J('구로역','차량교체 및 승객 인계 완료했습니다. 이상.')],bad:'차량교체가 끝났는지 확인하지 않았습니다.',why:'도착과 교체 완료는 별도로 확인하세요.'}],autoEnd:true},
 ];
 const DOC=[
  {id:'derail',base:'ch07-collision',major:true,name:'탈선',apply(def){
    const iTwo=at(def,b=>b.t==='choice'&&b.title==='두 열차'),iGo=at(def,b=>b.t==='call'&&(b.title||'').startsWith('G0454')),iMerge=at(def,cueIs('연결됐어요. K0452 객실')),iSt=at(def,cueIs('K0452를 석수역 승강장으로 보내기 전에'));
    if([iTwo,iGo,iMerge,iSt].some(i=>i<0))return false;
    // 뒤쪽부터 고친다 (앞에 끼우면 번호가 밀리므로)
    Object.assign(def.beats[iSt],{cue:'탈선 복구를 마친 K0452가 빈 차로 회송해요. 석수역에는 걸어서 대피해 온 승객들이 아직 있어요.',
     say:[{text:'K0452가 회송 운행하니 고객 안내방송을 하게 한다',line:'K0452열차는 구로차량기지로 회송 운행합니다. 대피한 고객 안내방송 해 주세요. 관제 이상!',reply:[J('석수역','석수역 수신, 이상.')],bad:'대피해 온 승객들은 승강장에 들어오는 K0452를 보고 다시 타려고 줄을 섰다. 문은 열리지 않았다.',why:'회송열차라는 걸 역이 승객에게 알려야 해요.'}]});
    Object.assign(def.beats[iMerge],{cue:'연결됐어요. K0452 객실은 비어 있어요. 승객들은 아까 걸어서 대피했으니까요.',
     say:[{text:'복구한 차량이니 주의운전으로 회송, 진로 확인 출발',line:'탈선 복구한 차량이니 주의운전으로 회송 운행합니다. 진로 확인 출발. 관제 이상!',reply:[H('K0452 기관사','K0452열차, 주의운전, 진로 확인 출발. 이상.')],bad:'합병한 열차는 평소 속도로 출발했다. 방금 레일 위에 다시 올려놓은 바퀴가 첫 번째 분기기에서 크게 흔들렸다.',why:'탈선했던 차량이에요. 복구 뒤에도 주의운전이에요.'}],
     no:[{text:'석수역에 세워 승객을 태우게 한다',bad:'탈선했던 열차의 문이 석수역에서 열렸다. 아무도 타지 않았다. 다들 한 시간 전에 그 열차에서 사다리로 내려온 사람들이었다.',why:'탈선 복구 차량은 회송해요.'}]});
    def.beats.splice(iGo-1,0,
     {t:'call',who:'recovery',cue:'구원열차를 보내기 전이에요. 탈선한 차량은 레일 위에 다시 올라왔을까요? 선로는 멀쩡할까요?',whoWhy:'탈선은 복구 완료와 시설물 피해를 확인한 뒤에 구원해요.',
      whoBad:{k0454:'구원열차가 출발했다. K0452의 맨 앞 차량은 아직 레일 밖에 있었다. 재크키트 위에 올라앉은 차량을 뒤에서 민다는 무전을 듣고, 복구반장이 헬멧을 벗어 던졌다.'},
      open:[S('사고복구반, 관제 이상.'),R('사고복구반, 이상.')],
      say:[{text:'탈선 복구 상황과 철도시설물 피해 현황을 통보하게 한다',line:'열차 탈선 복구 상황 및 철도시설물 피해 현황 통보 바랍니다.',reply:[R('탈선 복구 완료했고 철도시설물 피해 없습니다. 이상.'),S('복구 완료, 시설물 피해 없음. 수신.')],bad:'관제는 「거의 됐습니까?」라고만 물었다. 복구반은 「네」라고 했다. 레일이 휘었는지는 아무도 말하지 않았다.',why:'차량만이 아니라 선로 시설도 확인해요. 탈선은 선로를 망가뜨려요.'},
       {text:'구원열차를 운행하니 안전한 곳으로 대피하게 한다',line:'구원열차 운행하겠으니 안전한 장소로 대피하시기 바랍니다. 관제 이상!',reply:[R('대피 완료. 수신 이상.')],bad:'복구반은 재크키트를 정리하고 있었다. 선로 한가운데에서. 구원열차가 오는 줄 아무도 몰랐다.',why:'열차를 보내기 전에 선로의 사람부터 비켜 서게 해요.'}],
      no:[{text:'복구가 덜 됐어도 구원열차로 밀어서 레일에 올리게 한다',bad:'복구반장은 한참 말이 없었다. 「……관제사님. 열차는 그렇게 올리는 게 아닙니다.」',why:'복구는 복구 장비로 해요. 구원은 복구가 끝난 뒤예요.'}]});
    def.beats.splice(iTwo,0,
     {t:'say',lines:[I('상황 변경.'),H('K0452 기관사','철도관제! K0452열차, 다시 확인하니 맨 앞 차량이 탈선해 있습니다! 바퀴가 레일 밖으로 나갔습니다!','urgent'),['orpheia','','……탈선이에요, 주인님.','serious']]},
     {t:'call',who:'k0452',cue:'탈선한 열차는 움직일 수 없어요. 열차는 역 사이에 있고, 객실에는 승객이 있어요.',whoWhy:'탈선 열차의 승객을 어떻게 할지, 그 기관사에게 바로 지시해요.',
      open:[S('K0452열차, 탈선 확인. 관제 이상!')],
      say:[{text:'관제승인으로 운행중지시킨다',line:'K0452열차는 관제승인으로 운행중지합니다.',bad:'기관사는 승객을 내리면서도 생각했다. 「복구되면 다시 영업하는 건가?」 그는 승객들에게 「잠시 후 다시 탑승하겠습니다」라고 방송했다.',why:'탈선 열차는 그 자리에서 영업을 끝내요. 운행중지를 분명히 해요.'},
       {text:'비상사다리로 선로 반대편(운행방향 좌측)으로 승객을 내려 석수역으로 이동시키게 한다',line:'비상사다리 이용하여 운행방향 좌측, 선로 반대편으로 승객 하차시키고 석수역으로 이동하도록 안내 바랍니다. 관제 이상!',reply:[H('K0452 기관사','운행중지, 비상사다리, 선로 반대편 하차, 석수역 이동. 수신 이상.')],bad:'기관사는 승객을 내리라는 말만 들었다. 어느 쪽으로인지는 듣지 못했다. 그는 가까운 쪽 문을 열었다. 옆 선로 쪽이었다.',why:'내리는 방향이 중요해요. 다른 선로가 없는 쪽, 선로 반대편으로요.'}],
      no:[{text:'구원열차로 연결해 석수역까지 끌고 가서 내리게 한다',bad:'구원열차가 탈선한 열차를 밀었다. 레일 밖으로 나간 바퀴가 침목을 긁으며 30미터를 갔다. 선로 복구는 사흘이 걸렸다.',why:'탈선한 열차는 움직일 수 없어요. 승객이 걸어서 나와야 해요.'},
       {text:'복구될 때까지 객실에서 기다리게 한다',bad:'탈선 복구는 세 시간이 걸렸다. 승객 900명은 기울어진 객실에서 세 시간을 서 있었다.',why:'탈선 복구는 오래 걸려요. 승객을 먼저 대피시켜요.'},
       {text:'가까운 쪽 출입문을 모두 열어 내리게 한다',bad:'문이 양쪽으로 열렸다. 절반은 옆 선로 쪽으로 내렸다. 옆 선로는 아직 지장 여부도 확인되지 않은 선로였다.',why:'선로 반대편, 한쪽으로만 내려요.'}]},
     {t:'rush',cue:'승객 900명이 선로를 걸어 석수역으로 와요. 역, 팀장, 복구반 — 탈선이면 할 말이 전부 달라져요.',needs:[
      {id:'dr-st',who:'station',patience:20,title:'석수역',ask:'걸어서 대피하는 승객을 받을 역이에요.',
       open:[S('석수역, 관제 이상!'),J('석수역','석수역, 이상.')],
       late:{said:'(늦음) 석수역',bad:'승객들은 선로를 걸어 석수역에 닿았다. 승강장안전문은 닫혀 있었다. 사람들은 선로에 선 채 유리문 너머의 승강장을 바라보았다.',why:'걸어오는 승객이 올라올 문을 역이 먼저 열어 둬야 해요.'},
       say:[{text:'K0452가 탈선해 운행중지했다고 알린다',line:'K0452열차 열차충돌 탈선사고로 관제승인으로 운행중지합니다.',bad:'역은 「문을 열라」는 말만 들었다. 왜인지 몰랐다. 역무원은 문을 하나만 열었다.',why:'탈선이라는 것과 운행중지를 알려야 역이 크게 움직여요.'},
        {text:'승강장안전문을 전체 수동 개방해 대피를 유도하게 한다',line:'승강장안전문 전체 수동 개방하여 승객이 안전하게 대피할 수 있도록 유도하시기 바랍니다. 관제 이상!',reply:[J('석수역','안전문 전체 수동 개방, 대피 유도. 석수역 수신 이상.')],bad:'승강장안전문은 열차가 정위치에 서야 열린다. 걸어온 승객 앞에서는 열리지 않았다.',why:'열차 없이 문을 열려면 수동 개방이에요. 전체를요.'}],
       no:[{text:'승객을 다음 역까지 선로로 걷게 한다',bad:'승객들은 석수역을 지나 계속 걸었다. 다음 역까지는 1.4킬로미터였다.',why:'가장 가까운 석수역으로 올려요.'}]},
      {id:'dr-ch',who:'chief',patience:26,title:'관제팀장 · 운영실',ask:'충돌이 탈선이 됐어요. 보고도, 부를 장비도 달라져요.',
       open:[S('비상! 비상! 비상! 석수역 상2선 열차 충돌 탈선사고 발생!')],
       late:{said:'(늦음) 관제팀장 · 운영실',bad:'사고복구반은 충돌 복구 장비만 들고 왔다. 탈선한 차량을 들어 올릴 장비는 차량기지 창고에 있었다. 그걸 가지러 가는 데 한 시간이 걸렸다.',why:'탈선은 따로 보고하고, 복구 장비를 따로 불러요.'},
       say:[{text:'충돌 탈선사고로 다시 보고한다',line:'관제팀장님, 관제운영실! 석수역 상2선 열차 충돌 탈선사고 발생했습니다. 매뉴얼대로 안전하게 조치하겠습니다.',reply:[['instructor','관제팀장','탈선, 수신.']],bad:'본사 상황판에는 「충돌」만 떠 있었다. 복구 예상 시간은 30분으로 적혔다. 실제로는 세 시간이었다.',why:'사고 종류가 바뀌면 다시 보고해요.'},
        {text:'운영실에 탈선복구장비(재크키트) 지원 통보를 요청한다',line:'관제운영실! 관계처 및 사고복구반, 탈선복구장비 재크키트 지원 통보 바랍니다.',reply:[['instructor','관제운영실','재크키트 출동 통보하겠습니다.']],bad:'복구반은 맨손으로 탈선한 차량 앞에 섰다. 60톤이었다.',why:'탈선 복구에는 전용 장비(재크키트)가 필요해요.'}],
       no:[{text:'구원열차를 한 대 더 요청한다',bad:'구원열차 두 대가 준비됐다. 탈선한 차량은 열차 두 대로도 끌 수 없었다.',why:'탈선은 구원이 아니라 복구 장비가 먼저예요.'}]},
      {id:'dr-rc',who:'recovery',patience:32,autoEnd:true,title:'사고복구반',ask:'탈선 차량 위에는 전차선이 있어요. 복구 작업과 관계가 있을까요?',
       open:[S('사고복구반, 관제 이상.'),R('사고복구반, 이상.')],
       late:{said:'(늦음) 사고복구반',bad:'복구반은 재크키트로 차량을 들어 올리기 시작했다. 머리 위 전차선에는 전기가 흐르고 있었다. 누군가 뒤늦게 소리쳤다. 「단전했습니까?」 아무도 대답하지 못했다.',why:'탈선 복구 전에 전차선 단전이 필요한지 확인해요.'},
       say:[{text:'전차선 단전이 필요한지 확인해 통보하게 한다',line:'탈선 복구에 전차선 단전 필요한지 확인 후 통보 바랍니다. 관제 이상!',reply:[R('현재 단전 불필요합니다. 필요 시 요청하겠습니다. 이상.')],bad:'',why:''}],
       no:[{text:'안전을 위해 전 구간 전차선을 바로 단전시킨다',bad:'전 구간이 단전됐다. 역에 세워 둔 열차 열 대의 냉난방과 조명이 꺼졌다. 승객들은 어두운 객실에서 이유를 몰랐다.',why:'단전은 필요한지 확인한 뒤, 필요한 구간만 해요.'}]},
     ]},
     {t:'choice',title:'대피 확인',ask:'인접선 지장은 없대요. 옆 선로를 다시 움직이고 싶어요. 그런데 승객 900명이 선로를 걷고 있었어요.',opts:[
      {text:'석수역과 K0452 기관사 양쪽에서 승객 대피 완료를 확인한 뒤 방호장치를 해제시킨다',ok:true},
      {text:'인접선 지장 없음이 확인됐으니 바로 방호장치를 해제시킨다',bad:'옆 선로 열차가 사고 지점에 다가왔다. 선로 옆 통로에는 아직 승객 200명이 줄지어 걷고 있었다. 기관사가 급제동을 걸었다.',why:'탈선에서는 승객이 선로에 있어요. 대피 완료를 확인하기 전에는 옆 선로도 못 움직여요.'},
      {text:'기관사에게만 대피 완료를 묻는다',bad:'기관사는 마지막 승객이 사다리를 내려간 것을 보고 「완료」라고 답했다. 그 승객들은 아직 석수역까지 300미터를 걷는 중이었다.',why:'열차에서 내린 것과 역에 도착한 것은 달라요. 역에도 확인해요.'},
      {text:'탈선 복구가 끝날 때까지 모든 선로를 세워 둔다',bad:'탈선 복구는 세 시간이 걸렸다. 지장 없는 옆 선로 세 개도 세 시간을 쉬었다.',why:'대피가 끝나고 지장이 없으면 옆 선로는 다시 움직여요.'}]},
     {t:'say',lines:[S('석수역, K0452열차 승객 안전한 곳으로 대피 완료했습니까?'),J('석수역','대피 완료했습니다. 이상.'),S('K0452열차, 승객 대피 완료했습니까?'),H('K0452 기관사','K0452열차, 대피 완료했습니다. 이상.')]});
    const two=def.beats.find(b=>b.t==='choice'&&b.title==='두 열차');two.ask='K0450(앞)은 회송 가능. K0452(뒤)는 탈선해서 자력운전 불가예요. 승객은 대피했어요. 어떻게 할까요?';two.opts.find(o=>o.ok).text='K0450은 회송시키고, K0452는 탈선 복구 뒤 후속 K0454로 구원한다';
   }},
  {id:'brake',base:'ch07-collision',name:'제동관 파손',apply(def){
    const i=at(def,b=>b.t==='call'&&(b.title||'').startsWith('G0454'));if(i<1)return false;
    def.beats.splice(i-1,0,
     {t:'say',lines:[I('상황 변경.'),R('사고복구반입니다. K0452열차, 충돌로 제동관이 파손되어 있습니다. 조치 중입니다.'),S('제동관 파손되었다고요. 조치 완료되면 통보 바랍니다.')]},
     {t:'choice',title:'제동관 파손',ask:'구원열차가 곧 떠나요. 끌려갈 K0452의 제동관이 파손됐었어요.',opts:[
      {text:'구원 연결 전에, 제동관 조치가 끝나 제동 기능에 이상 없는지 복구반에 다시 확인한다',ok:true},
      {text:'「조치 중」이라고 했으니 됐다고 보고 구원열차를 보낸다',bad:'구원열차가 K0452를 밀고 출발했다. 제동을 걸자 앞 열 칸은 서지 않았다. 스무 칸짜리 열차는 석수역 정지위치를 60미터 지나서 섰다.',why:'「조치 중」은 「조치 완료」가 아니에요. 제동은 다시 확인해요.'},
      {text:'제동이 안 되는 채로 천천히 끌고 간다',bad:'천천히 가도 내리막은 내리막이었다. 뒤 열차의 제동만으로 스무 칸을 세워야 했다.',why:'제동 기능을 확인하지 않은 차량은 끌지 않아요.'},
      {text:'구원을 취소하고 K0452를 그 자리에 두기로 한다',bad:'K0452는 본선 한가운데에 남았다. 상2선은 그날 막차까지 다니지 못했다.',why:'조치가 끝나면 구원할 수 있어요. 확인하고 진행해요.'}]},
     {t:'say',lines:[S('사고복구반, 제동관 파손 고장은 조치 완료되어 제동 기능에 이상 없습니까?'),R('조치 완료, 제동 기능 이상 없습니다. 이상.')]});
   }},
  {id:'adjacent',base:'ch07-collision',name:'인접선 확인 불가',apply(def){
    const i=at(def,cueIs('인접선 지장이 없대요. 옆 선로를 다시 움직이려면'));if(i<0)return false;
    def.beats.splice(i,0,
     {t:'say',lines:[I('상황 변경.'),R('사고복구반입니다. 정정합니다. 인접선 쪽에 파편이 있어 확인이 덜 끝났습니다. 인접선 지장 여부, 아직 확인 불가입니다.')]},
     {t:'choice',title:'인접선 확인 불가',ask:'인접선을 풀려던 참인데, 지장 여부를 아직 모른대요.',opts:[
      {text:'K0450 회송 준비처럼 할 수 있는 조치를 먼저 진행하고, 그 뒤 인접선 지장 여부를 재확인한다',ok:true},
      {text:'아까는 지장 없다고 했으니 그대로 인접선을 재개한다',bad:'첫 열차가 사고 지점 옆을 지났다. 선로 위의 파편이 바퀴에 튕겨 방음벽에 박혔다.',why:'정정된 보고가 최신이에요. 확인 불가면 재개하지 않아요.'},
      {text:'확인될 때까지 모든 조치를 멈추고 기다린다',bad:'관제는 기다렸다. 그동안 K0450은 회송 준비도 못 했고, 관악역은 구원 준비도 못 했다. 확인이 끝났을 때 할 일은 처음 그대로 쌓여 있었다.',why:'기다리는 동안 할 수 있는 다른 조치를 해요. 그러고 나서 다시 물어요.'},
      {text:'인접선 열차를 서행으로 보내 기관사가 눈으로 확인하게 한다',bad:'기관사는 서행하며 선로를 살폈다. 승객 800명을 태운 채로.',why:'영업열차로 확인하지 않아요. 확인은 현장의 복구반이 해요.'}]},
     {t:'say',lines:[S('사고복구반, 인접선 지장 유무 재통보 바랍니다.'),R('파편 제거 완료. 인접선 운행 지장 없습니다. 이상.')]});
   }},
  {id:'delay',base:'ch04-casualty',name:'사고조치 지연',apply(def){
    const i=at(def,b=>b.t==='say'&&b.lines.some(l=>/사고 조치 완료되어 사상자는 119로/.test(l[2])));if(i<0)return false;
    def.beats.splice(i,0,
     {t:'say',lines:[I('상황 변경.'),S('K0809열차, 사상사고 조치 상황 통보 바랍니다.'),H('K0809 기관사','K0809열차. 조치가 지연되고 있습니다. 이상.')]},
     {t:'choice',title:'사고조치 지연',ask:'조치가 길어진대요. 관제가 지금 할 수 있는 건?',opts:[
      {text:'조치 뒤의 계획(금정역까지 운행 → 운행중지 → 회송)을 기관사와 금정역에 미리 알려 두고, 완료 통보를 기다린다',ok:true},
      {text:'빨리 끝내라고 현장을 독촉한다',bad:'기관사는 무전기를 든 채 현장 쪽을 돌아보았다. 구급대원들이 일하고 있었다. 그는 그 말을 전하지 않았다.',why:'현장 시간은 관제가 정하지 않아요. 관제는 그 뒤를 준비해요.'},
      {text:'조치가 덜 끝났어도 일단 금정역까지 움직이게 한다',bad:'관제는 말을 꺼내다 멈췄다. 서도희 교수가 펜을 내려놓았기 때문이다.',why:'조치 완료 전에는 사고 열차를 움직이지 않아요.'},
      {text:'아무 말 없이 다음 보고를 기다린다',bad:'조치가 끝났다. 기관사는 다음에 뭘 해야 하는지 몰랐다. 금정역도 몰랐다. 관제는 그때부터 설명을 시작했다.',why:'기다리는 시간에 다음 단계를 미리 알려 둬요.'}]},
     {t:'say',lines:[S('조치 지연 수신. K0809열차는 조치 완료되면 금정역까지 운행 후 관제승인 3호로 운행중지, 병점차량기지까지 회송 예정입니다. 조치 완료되면 통보해 주세요.'),H('K0809 기관사','K0809열차, 수신 이상.')]});
   }},
  {id:'circuit',base:'ch05-flood',name:'궤도회로 낙하',apply(def){
    const i=at(def,cueIs('물에 둘러싸여 있던 K1135'));if(i<0)return false;
    def.beats[i].say.splice(2,0,{text:'폐색 7~6호주 궤도회로 낙하: 15km 이하 주의운전과 다음 신호 확인',line:'관제승인으로 폐색 7~6호주 사이 궤도회로 낙하 구간은 15키로 이하 주의운전하고 폐색 6호주 신호 현시 확인하세요.',reply:[H('K1135 기관사','궤도회로 낙하, 15키로 이하 주의운전, 폐색 6호주 신호 확인. 수신 이상.')],bad:'기관사는 궤도회로 고장 구간의 운행 조건을 전달받지 못했습니다.',why:'교수의 설명으로 끝내지 말고 기관사에게 지시하고 복창을 받으세요.'});
    def.beats.splice(i,0,
     {t:'say',lines:[I('상황 변경.'),I('종각~지하서울역 간 하선, 폐색 7~6호주 사이 궤도회로가 낙하했어요. 열차가 없는데 LS에는 점유로 떠요. 물 때문이에요.')]},
     {t:'choice',title:'궤도회로 낙하',ask:'하선을 재개하려는데 그 구간 궤도회로가 낙하했어요. 그 구간 신호는 정지로 나와요.',opts:[
      {text:'그 구간을 관제승인으로 15km 이하 주의운전시키고, 폐색 6호주 신호 현시를 확인하게 한다',ok:true},
      {text:'점유가 떠 있으니 하선 재개를 취소한다',bad:'하선은 다닐 수 있었다. 궤도회로가 마를 때까지 이틀 동안 다니지 못했다.',why:'설비 고장이에요. 관제승인으로 서행시켜 지나가게 할 수 있어요.'},
      {text:'설비 오작동이니 무시하고 평소 속도로 운행시킨다',bad:'열차는 정지 신호를 평소 속도로 지났다. 그 앞 구간에 정말 아무것도 없는지는 아무도 확인하지 않았다.',why:'궤도회로가 낙하한 구간은 설비가 지켜 주지 못해요. 서행하고 다음 신호를 확인해요.'},
      {text:'신호 담당이 고칠 때까지 열차를 대기시킨다',bad:'신호 담당은 물이 빠져야 고칠 수 있다고 했다. 하선 승객들은 그 말을 세 시간 동안 기다렸다.',why:'고칠 때까지 기다리지 않고, 승인으로 서행 운행해요.'}]},
     {t:'say',lines:[['orpheia','','K1135 출발 지시에 그 말을 덧붙여야겠네요. 「폐색 7~6호주 사이 궤도회로 낙하, 15키로 이하 주의운전, 폐색 6호주 신호 현시 확인」.','explain']]});
   }},
  {id:'bogie',base:'ch03-rescue',major:true,name:'고장대차 차단 (구원 취소)',apply(def){
    guro(def);const keep=def.beats.slice(0,2),B=DrillBlocks;
    def.beats=[...keep,
     {t:'say',lines:[I('상황 변경.'),H('K1208 기관사','철도관제, K1208열차! 고장대차 차단 조치했습니다! 운행 가능합니다! 이상!','urgent')]},
     {t:'choice',title:'운행 가능?',ask:'구원을 준비하려던 참에, 기관사가 운행 가능하다고 해요.',opts:[
      {text:'기동검수반에 차량 상태를 다시 확인한다',ok:true},
      {text:'기관사가 된다고 했으니 바로 출발시킨다',bad:'K1208은 출발했다. 기동검수반은 차량 밑에서 공구를 챙기던 중이었다. 그리고 그들은 관제에게 할 말이 하나 더 있었다. 「그 차, 구로역에서 바꿔야 합니다.」',why:'기관사와 검수반 양쪽에서 확인해요. 검수반은 조건을 붙일 수 있어요.'},
      {text:'이미 구원으로 정했으니 구원을 그대로 진행한다',bad:'움직일 수 있는 열차를 뒤에서 밀어 주려고, 승객 1,900명이 두 역에서 내렸다.',why:'상황이 바뀌면 계획도 바꿔요. 스스로 갈 수 있으면 구원하지 않아요.'},
      {text:'믿을 수 없으니 한 번 더 재기동해 보라고 한다',bad:'기관사는 방금 살려 놓은 열차를 껐다 켰다. 이번에는 켜지지 않았다.',why:'확인은 검수반에게 물어서 해요.'}]},
     {t:'say',lines:[S('기동검수반, 차량 상태 재통보 바랍니다.'),['orpheia','기동검수반','고장대차 차단 조치하여 운행 가능하나, 구로역 차량교체 바랍니다! 이상!'],S('운행 가능, 구로역 차량교체. 수신. 열차 운행 재개하겠으니 안전한 장소로 대피하여 주시기 바랍니다.'),['orpheia','기동검수반','대피 완료! 수신 이상!']]},
     ...swapEnd({train:'K1208',place:'가산디지털단지역',stationLine:'K1208열차 정상운행합니다. 안내방송 해 주세요. 관제 이상!',why:'대차 하나를 차단한 열차의 제동은 평소보다 약했다.'}),
     {t:'move',runs:[{train:'K1204'},{train:'K1206'},{train:'K1208',legs:[['guro','5T']]}],view:'guro',watch:9000,text:'K1208이 스스로 움직여요……!'},
     ...swapArrival('K1208'),
     ...B.recovery({place:'가산디지털단지역',comm:['n19'],cueAll:'고장열차가 떠났어요. 독산·금천구청·석수역의 열차들은 아직 서 있어요.'}),
     {t:'move',runs:[{train:'K1210'},{train:'K1212'},{train:'K1214'}],view:'guro',watch:8000,text:'세워 둔 열차들이 다시 달려요!'},
     {t:'say',lines:[I('구원할 뻔한 열차가 제 발로 갔네요. 계획은 상황을 따라가요.')]}];
   }},
  {id:'selfrun',base:'ch06-fire',major:true,name:'자력 운행 가능 (구원 취소)',apply(def){
    const i=at(def,b=>b.t==='move'&&(b.text||'').startsWith('옆 선로의 열차들이 화재 지점'));if(i<0)return false;
    guro(def);const B=DrillBlocks;
    def.beats=[...def.beats.slice(0,i+1),
     {t:'say',lines:[I('상황 변경.'),R('사고복구반입니다! 화재 차량 완전부동취급했습니다. MCB 차단, 판타그래프 하강. 연장급전 조치했습니다!')]},
     {t:'choice',title:'완전부동취급',ask:'불난 차량 한 량의 전기를 끊고 나머지 차량으로 전기를 이었대요. 아까는 구원 요청이었어요.',opts:[
      {text:'자력 운행이 가능한지 묻고, 가능하면 구원 대신 구로역 차량교체로 바꾼다',ok:true},
      {text:'구원 요청을 받았으니 그대로 구원을 준비한다',bad:'관악역에서 승객 900명이 내렸다. 구원열차가 석수역에 닿았을 때, K0452는 제 힘으로 출발 준비를 마치고 있었다.',why:'상황이 바뀌었어요. 스스로 갈 수 있는지 먼저 물어요.'},
      {text:'전기를 끊었으니 운행 불가로 보고 회송 장비를 요청한다',bad:'운영실은 견인 기관차를 수배했다. K0452는 그동안 석수역에서 멀쩡한 아홉 량의 전동기를 쉬게 했다.',why:'완전부동취급은 한 량만 죽이는 조치예요. 나머지로 달릴 수 있는지 물어요.'},
      {text:'바로 종착역까지 정상 영업을 재개시킨다',bad:'불탄 3호차를 단 열차가 다음 역에 들어왔다. 승객들은 그을린 창문을 보고 타지 않았다.',why:'달릴 수는 있어도 영업은 못 해요. 가까운 구로역에서 차량을 바꿔요.'}]},
     {t:'say',lines:[S('완전부동취급했다고요? 자력 운행 가능합니까?'),R('운행 가능합니다. 이상!'),S('자력 운행 가능, 수신.')]},
     ...swapEnd({train:'K0452',place:'석수역',stationLine:'K0452열차 조치 완료로 정상운행합니다. 안내방송 해 주세요. 관제 이상!',why:'한 량의 전기를 끊은 열차는 평소보다 힘이 약했다.'}),
     ...B.recovery({place:'석수역',what:'열차화재',comm:['n26'],cueAll:'K0452가 출발 준비를 마쳤어요. 상2선의 K0450은 아직 5분씩 늦추는 중이고, 관악·안양역 열차들도 기다려요.'}),
     {t:'move',runs:[{train:'K0452',legs:[['geumcheon','5T'],['guro','5T']]},{train:'K0454'},{train:'K0456'}],view:'geumcheon',watch:10000,text:'K0452가 제 힘으로 석수역을 떠나요.'},
     ...swapArrival('K0452'),
     {t:'say',lines:[I('구원열차는 출발도 안 했네요. 그게 제일 좋은 구원이에요.')]}];
   }},
  {id:'point23b',base:'ch08-dongmyo',name:'선로전환기 불량',apply(def){
    const i=at(def,b=>b.t==='call'&&b.who==='k0604'&&(b.cue||'').startsWith('연결됐어요. K0604 객실은 비어'));if(i<0)return false;
    def.beats.splice(i,0,
     {t:'say',lines:[I('상황 변경.'),R('사고복구반입니다! 탈선 복구는 완료했는데, 동묘앞역 23B 선로전환기가 불일치 상태입니다. 회송은 시속 45킬로미터 이하 서행으로 가능합니다!')]},
     {t:'choice',title:'선로전환기 불량',ask:'G0604가 지나갈 23B 선로전환기가 정위도 반위도 아닌 「불일치」예요. 출발신호가 안 열려요.',opts:[
      {text:'복구반에 23B를 정위 방향으로 키볼트 쇄정시키고, 동묘앞역에 출발 수신호를 현시하게 한 뒤 45km 이하 서행으로 회송한다',ok:true},
      {text:'선로전환기를 LS에서 다시 전환해 보고 출발신호가 열리면 보낸다',bad:'관제는 23B를 정위로, 반위로, 다시 정위로 돌렸다. 기계는 그때마다 「불일치」라고 답했다. 마지막 전환에서 전동기가 탔다.',why:'불일치는 설비가 고장 난 거예요. 사람이 현장에서 키볼트로 고정하고, 신호 대신 수신호로 보내요.'},
      {text:'신호가 안 열리니 선로전환기가 고쳐질 때까지 기다린다',bad:'신호 담당은 부품이 내일 온다고 했다. G0604는 동묘앞역 상선을 밤새 막고 서 있었다.',why:'고쳐질 때까지 기다리지 않아요. 키볼트 쇄정과 수신호로 보낼 수 있어요.'},
      {text:'신호를 무시하고 평소 속도로 출발시킨다',bad:'관제는 말을 꺼내다 멈췄다. 서도희 교수가 펜을 내려놓았다.',why:'불일치 선로전환기 위로는 쇄정 확인과 수신호, 그리고 서행이에요.'}]},
     {t:'say',lines:[S('사고복구반은 23B 선로전환기 정위 방향으로 키볼트 쇄정해 주세요.'),R('키볼트 쇄정 완료. 수신 이상!'),S('동묘앞역, 23B 선로전환기 불량입니다. 관제승인으로 상출발 수신호 현시해 주세요.'),J('동묘앞역','상출발 수신호 현시합니다. 수신 이상.'),['orpheia','','G0604 출발 지시에 「45키로 이하 서행, 수신호 확인 출발」을 꼭 넣어 주세요!','serious']]});
    const c=def.beats[i+3];c.say[1]={text:'45km 이하 서행, 동묘앞역 상출발 수신호를 확인하고 출발',line:'관제승인으로 서행 45키로 이하 운행하시고, 동묘앞역 상출발 수신호 현시하였으니 확인하고 출발하세요. 관제 이상!',reply:[H('G0604 기관사','G0604열차, 45키로 이하 서행, 수신호 확인 출발. 이상.')],bad:'G0604는 출발신호를 기다렸다. 출발신호는 열리지 않았다. 고장 난 선로전환기 너머의 신호였으니까. 역무원은 수신호를 든 채 20분을 서 있었다.',why:'신호가 아니라 수신호로 가요. 그걸 기관사에게 분명히 말해요.'};
   }},
  {id:'k602cannot',base:'ch08-dongmyo',name:'앞 열차 회송 불가',apply(def){
    const i=at(def,b=>b.t==='say'&&b.lines.some(l=>/K0602 회송은 7장과 같아요/.test(l[2])));const j=at(def,b=>b.t==='move'&&(b.text||'').startsWith('K0608이 하선을 거꾸로'));
    if(i<0||j<0)return false;
    const demo=def.beats.splice(i,4);   // say, do, comm, move (K0602 회송 시범)
    const jj=at(def,b=>b.t==='move'&&(b.text||'').startsWith('K0608이 하선을 거꾸로'));
    def.beats.splice(jj+1,0,{t:'say',lines:[S('K0602열차, 회송 가능 여부 재통보 바랍니다.'),H('K0602 기관사','후부 응급조치 끝났습니다. 회송 가능합니다. 이상.')]},...demo);
    def.beats.splice(i,0,
     {t:'say',lines:[I('상황 변경.'),H('K0602 기관사','철도관제, K0602열차! 후부 연결기가 걸려 회송이 불가합니다! 조치 중입니다! 이상!','urgent')]},
     {t:'choice',title:'회송 불가',ask:'K0602를 먼저 회송시키고 단선지령식을 하려던 참이에요. K0602가 못 움직여요.',opts:[
      {text:'K0608 하선 단선지령식을 먼저 시행하고, 그 뒤 K0602 회송 가능 여부를 다시 확인한다',ok:true},
      {text:'K0602가 회송될 때까지 다른 조치를 멈추고 기다린다',bad:'관제는 기다렸다. 시청역의 K0608도 기다렸다. 하선은 비어 있었다. 40분 뒤 K0602가 회송되었을 때, 할 일은 처음 그대로 쌓여 있었다.',why:'순서가 막히면 다른 순서로 가요. 단선지령식은 K0602와 상관없이 할 수 있어요.'},
      {text:'K0602도 구원 대상으로 바꿔 구원열차를 한 대 더 준비한다',bad:'구원열차 두 대가 준비됐다. 그사이 K0602의 연결기는 풀렸다.',why:'조치 중이라고 했어요. 다른 일을 먼저 하고 다시 물어요.'},
      {text:'K0606이 K0602까지 함께 밀고 가게 한다',bad:'구원열차는 탈선한 K0604를 밀어야 했다. 그 앞의 K0602까지는, 탈선 차량을 사이에 두고는 밀 수 없었다.',why:'구원은 탈선 차량 하나로도 벅차요.'}]});
   }},
 ];

 // 장면 하나를 복제해 도전용으로 바꾼다.
 function buildScene(force){   // force={base,doc} 는 테스트용 (예: {base:'ch07-collision',doc:'derail'})
  const base=force?.base||pick(POOL);if(!POOL.includes(base))throw Error('알 수 없는 도전 장면: '+base);
  let def=structuredClone(CTCDrill.sceneDef(base));const used=[];
  for(const b of def.beats)if(b.t==='rush')for(const n of b.needs)n.patience=Math.max(8,Math.round(n.patience*RULES.patience));
  // 문서의 상황 변경: 그 사고에 있는 것 중에서. 큰 것(major)은 60% 확률로 하나만, 아니면 작은 것 1~2개.
  const docs=DOC.filter(t=>t.base===base),majors=docs.filter(t=>t.major),minors=docs.filter(t=>!t.major);
  const requested=force&&Object.hasOwn(force,'doc')?String(force.doc||'').split('+').filter(Boolean):null;
  if(requested&&requested.some(id=>!docs.some(t=>t.id===id)))throw Error('장면에 없는 상황변경: '+requested.join('+'));
  if(requested&&new Set(requested).size!==requested.length)throw Error('중복 상황변경');
  const chosen=requested?requested.map(id=>docs.find(t=>t.id===id)):majors.length&&(rnd()<(base==='ch07-collision'?.8:.6)||!minors.length)?[pick(majors)]:shuffle(minors).slice(0,1+Math.floor(rnd()*2));
  if(chosen.some(t=>t.major)&&chosen.length>1)throw Error('주요 상황변경은 다른 문서 상황변경과 함께 적용할 수 없습니다.');
  for(const t of chosen){const draft=structuredClone(def);if(t.apply(draft)===false)throw Error('상황변경 적용 위치를 찾지 못했습니다: '+t.id);def=draft;used.push(t);}
  const rushes=def.beats.filter(b=>b.t==='rush');
  const allowed=TWISTS.filter(t=>!force?.twists||force.twists.includes(t.id));
  if(force?.twists?.some(id=>!TWISTS.some(t=>t.id===id)))throw Error('알 수 없는 공통 상황변경');
  const stops=rushes.flatMap(b=>b.needs.filter(n=>n.train&&n.home&&n.at).map(n=>({beat:b,need:n})));
  if(base==='ch03-rescue')stops.push({beat:def.beats.find(b=>b.t==='comm'),need:{id:'k1212',who:'k1212',train:'K1212',home:['geumcheon','5T'],at:'금천구청역'}});
  const station=def.roster.find(r=>r.id==='station'),chief=def.roster.find(r=>r.id==='chief');
  const selected=force?.twists?allowed:shuffle(allowed).slice(0,1+Math.floor(rnd()*2));
  for(const t of selected){
   if(t.who==='chief'||t.who==='station'){
    const r=t.who==='chief'?chief:station,b=rushes.find(b=>!b.needs.some(n=>n.who===r?.id));
    if(!r)throw Error('상황변경 통보 대상 없음: '+t.id);
    if(b)b.needs.push({...t.make(r),id:'tw-'+t.id,afterCount:1});else {const at=def.beats.indexOf(rushes[0]);def.beats.splice(at+1,0,{...t.make(r),t:'call',incoming:true});}
    used.push(t);continue;
   }
   if(!stops.length)throw Error('상황변경에 필요한 정차 열차 없음: '+t.id);
   const {beat,need}=pick(stops),r=def.roster.find(r=>r.id===need.who);
   const st={id:'tw-station-'+need.id,who:'jian',name:need.at,call:need.at};
   if(!def.roster.some(r=>r.id===st.id))def.roster.push(st);
   let added;
   if(t.kind==='rush'){
    const call={...t.make(r),id:'tw-'+t.id,t:'call',incoming:true};added=[call];
    if(t.id==='sick')added.push({t:'call',who:st.id,cue:`${need.at}에 정차한 ${r.call}에서 환자를 인계해요.`,say:[{text:'119 지원과 환자 인수를 지시한다',line:`${need.at}, ${r.call}의 응급환자 인수하고 119 지원 요청 바랍니다. 관제 이상!`,reply:[['jian',need.at,'환자 인수 및 119 지원 요청하겠습니다. 수신 이상.']],bad:'환자를 받을 역에 지시하지 않았습니다.',why:'기관사에게 예고한 지시를 역에도 전달하세요.'}],autoEnd:true});
   }else added=t.make(r,st);
   if(t.id==='ghost')added=[{t:'displayFault',number:need.train},...added,{t:'say',lines:[['instructor','','표시장치 점검 후 표시가 복구되었습니다. 실제 열차 위치와 다시 대조하세요.']]},{t:'displayFault',number:null}];
   // Immediately after its stop order: no departed, renamed or missing train can be selected.
   def.beats.splice(def.beats.indexOf(beat)+1,0,{t:'requireTrain',number:need.train,home:need.home},...added);
   used.push(t);
  }
  def.challenge={base,docs:chosen.map(t=>t.id),twists:used.filter(t=>!chosen.includes(t)).map(t=>t.id),seed:force?.seed??null};
  def.title='도전 · '+def.title.replace(/^(제\d+장 실습|실기시험) · /,'');
  CTCDrill.scene('challenge',def);
  return {base,docs:chosen.map(t=>t.id),twistIds:used.map(t=>t.id),seed:force?.seed??null,twists:used.map(t=>t.name)};
 }

 function build(force){
  const previous=seededRandom;
  if(force&&Object.hasOwn(force,'seed')){let state=Number(force.seed)>>>0;seededRandom=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
  try{return buildScene(force);}finally{seededRandom=previous;}
 }

 function result(R,info){
  const rec=load();rec.plays=(rec.plays||0)+1;rec.ranks=rec.ranks||{};
  if(!R.error){rec.ranks[R.rank]=(rec.ranks[R.rank]||0)+1;rec.streak=['S','A'].includes(R.rank)?(rec.streak||0)+1:0;rec.best=Math.max(rec.best||0,rec.streak);}
  save(rec);
  const box=document.createElement('div');box.className='ch-result';
  box.innerHTML=R.error?`<div class="ch-card"><small>도전 모드</small><h2>시뮬레이터를 불러오지 못했어요</h2><p>${R.error}</p><div class="ch-btns"><button data-a="title">타이틀로</button></div></div>`
   :`<div class="ch-card"><small>도전 결과 · ${info.twists.length?'상황 변경 '+info.twists.length+'건':'상황 변경 없음'}</small><h2>${R.title}</h2><p class="score rank-${R.rank}">${R.rank}</p>
   <p>판단 첫 시도 정답 ${R.firstTry} / ${R.decisions}${R.rewinds?` · 예측 되감기 ${R.rewinds}회`:''}</p>
   <p>${R.procedureComplete?'선택된 상황변경의 필수 절차 완료':'필수 절차 미완료'}</p>
   ${(R.missed||[]).length?'<ul>'+R.missed.map(x=>'<li>'+String(x).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</li>').join('')+'</ul>':''}
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
 return {start,record:load,_build:build,TWISTS,DOC};
})();
