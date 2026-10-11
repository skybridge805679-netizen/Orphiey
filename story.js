'use strict';
// Story layer: derives ADV staging (prologue, transitions, partner voice, situation board,
// branch-specific endings) from DATA at runtime. Textbook answers, reasons and refs are never altered.
const STORY=(()=>{
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.codePointAt(0),16777619);return h>>>0;};
const pick=(list,seed)=>list[hash(seed)%list.length];
const fill=(t,v)=>t.replace(/\{(\w+)\}/g,(_,k)=>v[k]??'');
const josa=(w,a,b)=>{const c=String(w).trim().slice(-1).charCodeAt(0);if(c<0xac00||c>0xd7a3)return w+a;return w+((c-0xac00)%28?a:b);};

// ── Incident clock: only times the scenario itself states (H+N분) are shown.
const TIME=/H\+\s?(\d+)\s?(분|시간)/;
function clockOf(it){const m=(it.step.dialogue.narr+' '+it.step.dialogue.line).match(TIME);return m?(m[2]==='시간'?+m[1]*60:+m[1]):null;}
function clock(run,i=run.i){
 for(let k=i;k>=0;k--){const it=run.steps[k];if(k<i&&it.src!==run.steps[i].src)break;const m=clockOf(it);if(m!=null)return {min:m,label:`H+${m}분`,exact:k===i};}
 return i===0||run.mode==='wrong'?{min:0,label:'H+0',exact:true}:{min:null,label:'',exact:false};
}

// ── Situation board: lamps light up only from dispatches the player got right.
const LAMPS=[
 ['protect','방호',/방호|정차|정지|운행\s?중지|운행을?\s?중지|일괄정지|통제|속도\s?제한|일시중지|차단|서행|주의운전|폐색/],
 ['evac','대피',/대피|유도|안전문|하차|구호|구조|환자|응급/],
 ['notify','전파',/119|112|신고|보고|전파|통보|방송|연락|출동\s?요청|소집|가동/],
 ['recover','복구',/복구|재개|복귀|정상\s?운행|해제|완료|구원/],
];
function lamps(run){
 const lit=new Set();run.steps.forEach((it,i)=>{if(it.src!==run.steps[run.i]?.src&&run.mode!=='wrong')return;if(run.picks[i]!==it.step.ans||run.missed?.[i])return;const t=it.step.opts[it.step.ans].t;for(const [k,,re] of LAMPS)if(re.test(t))lit.add(k);});
 return LAMPS.map(([k,label])=>({key:k,label,on:lit.has(k)}));
}
function sync(run){const done=run.steps.filter((_,i)=>run.picks[i]!=null&&i<=run.i).length;if(!done)return 70;const clean=run.steps.filter((it,i)=>run.picks[i]===it.step.ans&&!run.missed?.[i]).length;return Math.max(20,Math.min(99,70+clean*6-(run.rewinds||0)*9));}

// ── Category tone for briefings and failure codas.
const TONE={
 '충돌·탈선':{brief:'충돌과 탈선은 첫 번째 사고보다 두 번째 사고가 더 무서워요. 무엇을 먼저 멈춰 세워야 할지부터 떠올려 주세요.',air:'금속이 긁힌 냄새가 무전 너머로까지 전해지는 것 같다.'},
 '화재':{brief:'화재는 연기가 시간보다 빨라요. 열차를 어디에 세우고, 승객을 어느 쪽으로 보낼지가 전부예요.',air:'무전 잡음 사이로 화재경보의 고음이 끊기지 않는다.'},
 '사상':{brief:'사람이 다친 현장이에요. 구호와 신고, 그리고 그 곁을 지나갈 다른 열차를 함께 생각해 주세요.',air:'현장의 목소리가 평소보다 반 박자 빠르다.'},
 '차량·설비고장':{brief:'고장 그 자체보다, 고장 난 채로 멈춰 선 시간이 위험해요. 확인과 구원의 순서를 놓치지 마세요.',air:'고장 표시등의 점멸이 관제 화면 위에서 반복된다.'},
 '전력':{brief:'전기가 끊기면 열차도, 조명도, 환기도 함께 멈춰요. 무엇이 살아 있고 무엇이 꺼졌는지부터예요.',air:'운행 표시반의 일부 구간이 회색으로 꺼져 있다.'},
 '운전취급(폐색·신호)':{brief:'신호가 말해주지 않는 구간에서는 주인님의 지령이 곧 신호예요. 한 글자도 흐리게 말하면 안 돼요.',air:'평소라면 신호가 대신 해줄 말을, 오늘은 관제석이 해야 한다.'},
 '자연재해':{brief:'날씨는 기다려 주지 않아요. 기준값과 운행 통제를 정확히, 그리고 너무 늦지 않게요.',air:'관제실 창밖에서도 날씨가 거칠어지는 소리가 들린다.'},
 '테러·위험물':{brief:'정체를 모르는 위험이에요. 직접 손대지 않기, 넓게 떼어 놓기, 그리고 빠르게 알리기예요.',air:'보고하는 목소리가 억지로 차분함을 유지하고 있다.'},
 '지휘·보고':{brief:'오늘은 지휘와 보고의 흐름을 보는 날이에요. 누가, 언제, 누구에게 — 순서가 곧 정답이에요.',air:'상황판 위로 보고 체계의 칸이 하나씩 채워질 차례다.'},
};
const tone=sc=>TONE[sc.cat]||TONE['지휘·보고'];

// ── Scene transitions: keep authored narration, bridge the silent gaps.
const ROLE_AIR={
 driver:['운전실의 경보음이 무전 너머로 희미하게 섞여 든다.','기관사의 숨소리가 송신 버튼을 누르기 전부터 들린다.','차내 방송을 잠시 끊고 기관사가 관제를 부른다.'],
 stationmaster:['역 구내 안내방송을 배경으로 역장의 호출이 들어온다.','승강장의 웅성거림이 역장의 목소리 뒤로 번진다.','역무실 전화가 연달아 울리는 가운데 역장이 무전을 잡는다.'],
 engineer:['현장의 공구 소리 사이로 점검 담당자의 목소리가 끼어든다.','손전등 불빛이 선로를 훑는 동안 현장 보고가 이어진다.'],
 evacuation:['안내 방송과 발소리가 겹친 채로 승무원이 무전을 잡는다.'],
 system:['관제 화면의 표시가 바뀌고, 다음 호출을 알리는 램프가 켜진다.','잠깐의 정적. 그리고 다시 교신 램프가 깜박인다.','상황판의 칸 하나가 채워지자마자 다음 보고가 들어온다.'],
};
const EXAM_AIR_STORY=['교신이 잠깐 빈 틈, 뒤에 서 있던 서도희 교관이 커피잔을 내려놓고 묻는다.','서 교관이 화면에서 눈을 떼지 않은 채 질문을 던진다. 현장은 잠시 복창을 기다리는 중이다.','“상철 씨, 하나만 묻죠.” 서 교관의 목소리는 무전보다 낮다.'];
const EXAM_AIR=['감독관이 시뮬레이터를 잠시 멈추고 관제석 쪽으로 몸을 기울인다.','교신이 멈춘 사이, 뒤편에서 감독관의 질문이 날아온다.','화면 속 시간이 멈춘다. 지금은 감독관에게 답할 차례다.'];
function roleOf(st){const s=st.dialogue.spk;return /기관사|기장|운전원/.test(s)?'driver':/역장|역무|운전취급실/.test(s)?'stationmaster':/현장|선로|시설|복구|작업|기술|전력|전철|신호/.test(s)?'engineer':/차장|승무원/.test(s)?'evacuation':st.role||'system';}
function narration(run,i=run.i){
 const it=run.steps[i],st=it.step,d=st.dialogue,prev=run.steps[i-1],seed=it.src.id+'#'+it.idx;
 let head='';
 if(run.mode==='wrong'&&(!prev||prev.src!==it.src))head=`다른 사건 기록 · ${it.src.title}. `;
 const own=(d.narr||'').trim();
 if(own.length>=14)return head+own;
 const air=d.exam?(run.mode==='story'?pick(EXAM_AIR_STORY,seed):pick(EXAM_AIR,seed)):pick(ROLE_AIR[roleOf(st)]||ROLE_AIR.system,seed);
 const bridge=d.exam?'':i===0?tone(it.src).air+' ':prev&&prev.src===it.src?pick(['직전 지령의 복창이 끝나기 무섭게,','교신 기록에 한 줄이 더해진다.','상황판이 갱신된다.'],seed+'b')+' ':'';
 return (head+(own?own+' ':'')+bridge+air).trim();
}

// ── Partner voice: the question is framed by ORPHEIA instead of hidden.
function prompt(run){
 const it=run.steps[run.i],st=it.step,q=(st.dialogue.q||st.q).trim(),seed=it.src.id+'#'+it.idx;
 if(run.rewoundAt===run.i)return pick(['시간을 되감았어요. 아까의 기록은 잊지 말고, 이번엔 이 질문만 봐요 —','괜찮아요, 주인님. 같은 순간으로 돌아왔어요. 다시 한 번 —','되감기 완료예요. 이번에는 오르페이아도 같이 숨을 고를게요 —'],seed+'r')+` 「${q}」`;
 if(st.dialogue.exam&&run.mode==='story')return pick(['교관님 질문이에요. 지금까지 한 순서를 그대로 말로 꺼내 보면 돼요 —','서 교관님이 시험하시는 거예요. 침착하게요 —'],seed)+` 「${q}」`;
 if(st.dialogue.exam)return pick(['감독관님 질문이에요. 교재의 순서 그대로 답하면 돼요 —','이건 실기 구술 질문이에요. 담당과 시점을 같이 떠올려 주세요 —','교신은 잠시 멈췄어요. 대신 감독관님께 답할 차례예요 —'],seed)+` 「${q}」`;
 return pick(['주인님, 지금 판단하실 것은 이거예요 —','보고는 다 들어왔어요. 관제석의 차례예요 —','현장이 주인님의 지령을 기다려요 —','침착하게요, 주인님. 물어야 할 건 하나예요 —'],seed)+` 「${q}」`;
}
const CHEER=['정확해요, 주인님! 현장이 바로 움직이기 시작했어요.','복창까지 깔끔하게 돌아왔어요. 오르페이아, 조금 감동했어요.','네, 그 순서가 맞아요. 상황판에 불이 하나 더 들어왔어요.','좋아요. 지금 그 지령 덕분에 현장이 몇 분을 벌었어요.','역시 주인님이에요. 목소리에 흔들림이 없었어요.'];
const CHEER_ROLE={driver:'기관사님 목소리가 한결 차분해졌어요.',stationmaster:'역장님이 바로 승객 쪽으로 움직였어요.',engineer:'현장 점검이 지령대로 시작됐어요.',evacuation:'안내 방송이 승객을 제대로 이끌고 있어요.'};
function react(run){
 const it=run.steps[run.i],st=it.step,seed=it.src.id+'#'+it.idx,right=run.picks[run.i]===st.ans,last=run.i===run.steps.length-1;
 if(!right)return '방금 건 정답 지령을 보냈을 때의 응답이에요. 주인님이 고른 지령과 무엇이 달랐는지, 아래 근거로 같이 확인해요.';
 let streak=0;for(let k=run.i;k>=0&&run.picks[k]===run.steps[k].step.ans&&!run.missed?.[k];k--)streak++;
 if(st.dialogue.exam)return pick(['감독관님이 고개를 끄덕였어요. 다음 교신으로 돌아가요.','구술도 완벽해요. 이 순서, 시험장에서도 그대로 말하면 돼요.'],seed);
 if(last)return '마지막 교신까지 닿았어요. 주인님, 끝까지 놓지 않아 주셔서 고마워요.';
 if(run.missed?.[run.i])return '되감은 보람이 있었어요. 이번엔 현장이 무사히 움직였어요.';
 if(streak>=3)return pick([`벌써 ${streak}번 연속이에요! 주인님과 오르페이아, 지금 완전히 동기화돼 있어요.`,`${streak}연속 정답이에요. 현장의 목소리가 점점 안정되는 게 들려요.`],seed);
 const role=roleOf(st);return pick(CHEER,seed)+(CHEER_ROLE[role]&&hash(seed)%2?' '+CHEER_ROLE[role]:'');
}

// ── Prologue and briefing.
function castLine(sc){const c=Object.entries(sc.cast||{});return c.length?c.map(([k,v])=>`${k} ${v}`).join(' · '):'';}
function prologue(sc){return sc.intro||sc.brief;}
function briefing(sc){
 const c=castLine(sc);
 return `주인님, 이번 출동은 「${sc.title}」이에요.${c?` 현장 정보는 ${c}.`:''} ${tone(sc).brief} 첫 호출이 들어오면, 오르페이아가 곁에서 질문을 짚어 드릴게요.`;
}

// ── Branch-specific endings: the wrong dispatch itself decides the shape of the failure.
const KIND=[
 ['actor','책임 주체 혼동',/직접|맡긴|맡겨|단독|본인|스스로|대신/],
 ['order','순서 착오',/먼저|부터|우선|뒤에|후에|나중|때까지|마친 뒤|한 뒤|이후/],
 ['scope','통제 범위 축소',/[가-힣\d]만\s|에만|한 곳|한 방향|일부만/],
 ['omit','필수 조치 누락',/생략|하지 않|않는다|않고|없이|만 한다|만 지시|만 정차|만으로/],
 ['wait','대기·방치',/기다|그대로|계속|유지|보류|지켜본/],
 ['standard','기준값 착오',/\d+\s?(km|㎞|분|일|m|미터|도|mm|초)/],
 ['move','위험한 운행 지시',/후진|이동|출발|진행|통과|회송|복귀|운행시킨|운행한|운전한|최고속도|추진|퇴행|접근시|들여보내|선로로|하차시/],
];
const BRIDGE={
 actor:['책임질 손이 엇갈렸다. 지시받은 사람은 해서는 안 될 일을 떠안고, 해야 할 사람은 지시를 받지 못했다.','누가 할 일인지가 흐려진 순간, 그 일은 아무의 손에도 쥐어지지 않는다.'],
 order:['지령의 내용이 틀린 것은 아니었다. 다만 지금 이 순간에 먼저 나가야 할 말이 아니었다.','순서 하나가 뒤바뀌었다. 정말 먼저 필요했던 조치는 아무도 시작하지 못한 채 시간이 흐른다.'],
 omit:['꼭 있어야 할 한 줄이 지령에서 빠졌다. 현장은 지시받은 만큼만 움직이고, 빠진 조치의 자리는 비어 있다.','현장은 복창하고 그대로 따른다. 빠뜨린 조치는 누구도 대신 채워 주지 않는다.'],
 wait:['기다리라는 말은 가장 쉬운 지령이다. 그리고 비상시에는 가장 비싼 지령이기도 하다.','멈춰 서 있는 동안에도 상황은 멈추지 않는다.'],
 standard:['숫자 하나가 어긋났다. 규정의 기준은 여유분이 아니라 마지막 안전선이다.','기준값은 현장이 그대로 믿고 따르는 숫자다. 그래서 틀린 숫자는 그대로 위험이 된다.'],
 scope:['지령은 닿았다. 다만 닿아야 할 곳의 일부에만. 통제선 바깥에 남은 열차와 사람은 아무 지시도 받지 못한다.','범위를 좁힌 만큼 위험은 경계 밖으로 비어져 나간다.'],
 move:['지령을 받은 현장은 망설임 없이 움직인다. 아직 확인되지 않은 위험 쪽으로.','열차가 다시 움직이기 시작한다. 확인되지 않은 선로와 함께.'],
 misc:['현장은 지령을 복창하고 그대로 따른다. 판단의 무게는 고스란히 관제석으로 돌아온다.','교신은 정확히 전달되었다. 문제는 전달된 내용 그 자체였다.'],
};
const CLOSING=/^이번 훈련의 시간은/;
// Butterfly chain for endings nobody has hand-written yet (story/endings.js wins when present):
// the dispatch goes out → the one needed action never happens → the textbook consequence → an absurd
// escalation tied to this scenario's places and trains → an aftermath punchline.
const ESCALATE={
 '충돌·탈선':['몇 정거장 떨어진 {station} 다음 역에서는, 아무것도 모르는 승객들이 평소처럼 승강장에 줄을 선다. 줄이 점점 길어지자 누군가 돗자리를 편다.','현장 사진이 SNS에 먼저 올라온다. 관제실은 그 사진으로 {train}의 정확한 위치를 처음 확인한다.','출동한 복구 기중기가, 아무도 통제하지 않은 {station} 앞 교차로에서 웨딩카 행렬과 마주친다. 하객 120명이 기중기를 배경으로 단체 사진을 찍는다.'],
 '화재':['연기 냄새를 맡은 옆 건물 고깃집 손님들이 자기 가게에 불이 난 줄 알고 뛰쳐나온다. 계산한 사람은 아무도 없었다.','{station} 주변 화재 감지기들이 줄줄이 울리고, 근처 아파트 단지 주민 단톡방이 메시지 300개로 폭발한다.'],
 '사상':['구급차는 왔지만 들어갈 통로를 아무도 열어 두지 않았다. 구급대원들은 {station} 출입구 다섯 곳을 차례로 돌며 문을 두드린다.','현장 주변에 모인 사람들이 저마다 휴대전화를 들고, 관제실보다 먼저 상황을 생중계한다.'],
 '차량·설비고장':['{train} 승객들은 멈춘 객실에서 휴대전화 배터리가 닳는 순서대로 하나둘 체념한다. 마지막 보조배터리 하나를 두고 즉석 경매가 열린다.','고장 열차 뒤로 열차가 한 대, 두 대, 다섯 대 줄을 선다. 하늘에서 보면 노선 전체가 주차장이다.'],
 '전력':['{train}의 실내등이 꺼지고 승객들이 일제히 휴대전화 손전등을 켠다. 객실이 점점 콘서트장처럼 보이기 시작한다.','하필 그 시각, 가장 가까운 변전소 당직자는 야식 배달을 받으러 정문에 나가 있었다.'],
 '운전취급(폐색·신호)':['같은 구간에 열차 두 대가 서로를 모른 채 들어선다. 두 기관사는 동시에 상대 열차의 전조등을 보고, 동시에 같은 단어를 외친다.','{station} 역장은 관제 지시와 신호기와 시간표가 세 가지 다른 말을 하는 것을 보고, 역무실 달력에 「오늘은 쉬는 날」이라고 적고 싶어진다.'],
 '자연재해':['빗물은 기다려 주지 않는다. {station} 대합실에 들어온 물이 어느새 발목을 넘고, 누군가 고무 오리를 띄운다.','바람에 날아온 현수막 하나가 전차선에 걸린다. 현수막에는 「안전 최우선」이라고 적혀 있었다.'],
 '테러·위험물':['의심물체 주변으로 사람들이 오히려 모여든다. 몇몇은 사진을 찍고, 한 명은 그 가방이 자기 것과 같은 모델이라며 브랜드를 묻는다.','통제되지 않은 {station} 대합실에서는 영문을 모르는 승객들이 평소처럼 커피를 사고 키오스크 앞에 줄을 선다.'],
 '지휘·보고':['보고가 엇갈리면서 같은 사고가 본사 시스템에 세 건으로 등록된다. 세 건 모두 서로 다른 담당자가 배정된다.','사장, 본부장, 단장이 각자 다른 경로로 소식을 듣고 각자 다른 지시를 내린다. 현장은 세 가지 지시를 전부 복창한다.'],
};
const PUNCH=['다음 날 아침 뉴스 자막: 「{line} {station} 사고… 원인은 "그 순간 아무도 하지 않은 한 가지"」.','그날 밤 실시간 검색어 1위는 「#{station}_무슨일」이었다.','사고조사 보고서는 412쪽에 이른다. 결론은 단 한 줄이었다. 「그때 그걸 했어야 했다.」','{station} 역 고양이는 그날 이후 무전기 소리만 들으면 숨는다.','1년 뒤, 이 사건은 신입 관제사 교육 첫 시간의 단골 사례가 된다. 슬라이드 제목은 「하지 않은 한 줄」.'];
const PUNCH_STORY=['서 교관은 보고서를 끝까지 읽고, 식은 커피를 한 번에 비운 뒤 말없이 형광펜을 꺼낸다.','하린은 그날 일기장에 적는다. 「오늘의 또?!: 아직 끝나지 않음.」'];
function places(sc){
 const vals=Object.values(sc.cast||{}).join(' ')+' '+(sc.intro||'');
 const station=(vals.match(/[가-힣]{1,5}역(?![가-힣])/)||[''])[0]||'현장';
 const train=((vals.match(/KTX\s?제?\d+열차|[KT]?\d{3,4}열차|제\d+열차/)||[''])[0])||'멈춘 열차';
 const line=(sc.cast?.['노선']||sc.cast?.['선']||sc.cast?.['선구']||'').split(/[(\s]/)[0]||(sc.part==='도시철도'?'하늘선':'한빛선');
 return {station,train,line};
}
const shortAct=t=>{const a=t.split(/\s[—–]\s/)[0].trim();return a.length>46?a.slice(0,44)+'…':a;};
function ending(run,i=run.i,choice=run.picks[i]){
 const it=run.steps[i],st=it.step,base=st.failures?.[choice];if(!base)return null;
 const t=st.opts[choice].t,kind=KIND.find(([,,re])=>re.test(t))||['misc','판단 착오'],seed=`${it.src.id}#${it.idx}#${choice}`;
 const c=clock(run,i),sp=st.speech[choice],story=run.mode==='story';
 const open=st.dialogue.exam&&story?'서 교관이 커피잔을 내려놓는다. “그 답대로 현장이 움직였다면 — 이렇게 됐겠지.”':st.dialogue.exam?'감독관이 기록지에서 눈을 들고, 짧게 고개를 젓는다. “실제 상황이었다면 — 그 답이 이렇게 전해졌을 겁니다.”':`${c.label?c.label+'. ':''}${josa(sp.to.replace(/^발화\s*·\s*/,''),'을','를')} 향한 지령이 송신된다.`;
 const close=story?'— 여기까지가, 송신 버튼에 손이 닿기 전 0.3초 동안 오르페이아가 계산한 미래였다. 지령은 아직 나가지 않았다.':`${c.label?c.label+', ':''}훈련 기록은 이 지점에서 멈춘다. 오르페이아가 이 판단 직전의 순간을 붙잡아 두었다.`;
 const hand=typeof ENDINGS!=='undefined'&&ENDINGS[seed];
 let body,title=base.title;
 if(hand){body=hand.text;title=hand.title;}
 else{
  const paras=base.text.split(/\n\n+/).filter(p=>!CLOSING.test(p)&&!p.startsWith('“')&&p!==st.dialogue.narr&&!p.startsWith('(비교)'));
  const consequence=paras[paras.length-1]||'',v=places(it.src);
  const esc=fill(pick(ESCALATE[it.src.cat]||ESCALATE['지휘·보고'],seed+'e'),v),punch=fill(pick(story?[...PUNCH,...PUNCH_STORY]:PUNCH,seed+'p'),v);
  body=[pick(BRIDGE[kind[0]],seed),`— 그 순간 정말 필요했던 일, 「${shortAct(st.opts[st.ans].t)}」는 끝내 아무도 하지 않았다.`,consequence,esc,punch].join('\n\n');
 }
 const text=[open,`“${sp.line}”`,body,close].join('\n\n');
 return {...base,title,text,tag:kind[1],kind:kind[0],hand:!!hand};
}
function comfort(run){const it=run.steps[run.i],f=ending(run);return pick([`주인님, 괜찮아요. 「${f.tag}」였을 뿐이에요. 오르페이아가 그 순간 바로 앞까지 시간을 되감아 둘게요.`,`읏… 아팠죠. 하지만 실제 현장이 아니라 다행이에요. 같은 보고부터 다시 받아 볼까요?`,`이건 주인님의 실수가 아니라 연습이 해 준 경고예요. 「${f.tag}」 — 오르페이아가 꼭 기억해 둘게요.`],it.src.id+'#'+it.idx+'c');}

// ── Epilogue for the clear screen.
function epilogue(run){
 const sc=run.sc,clean=run.steps.filter((it,i)=>run.picks[i]===it.step.ans&&!run.missed?.[i]).length,end=clock(run,run.steps.length-1);
 if(run.mode==='wrong')return `오답으로 남아 있던 교신 ${run.steps.length}개를 다시 보냈다. 같은 보고를 두 번 들은 관제사는, 첫 번째보다 반 박자 빨리 송신 버튼을 누른다.`;
 const tail=clean===run.steps.length?'모든 지령이 처음 한 번에 현장에 닿았다.':run.rewinds?`${run.rewinds}번의 되감기 끝에, 지령은 결국 현장에 닿았다.`:'몇 번의 어긋남이 있었지만, 교신은 끊기지 않았다.';
 return `${end.min?end.label+' 이후, ':''}${sc.title} 상황이 종료되었다. 관제 화면의 경보 표시가 하나씩 꺼지고, 무전기에는 평소의 정시 보고가 돌아온다. ${tail}`;
}
return {clock,lamps,sync,narration,prompt,react,prologue,briefing,ending,comfort,epilogue,castLine,roleOf};
})();
