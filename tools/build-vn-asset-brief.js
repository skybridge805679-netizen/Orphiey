// Builds docs/추가-에셋-생성지침-VN.{md,json} — third round: cast, daily-life backgrounds and story CGs
// for the visual-novel mode. Run: node tools/build-vn-asset-brief.js
'use strict';
const fs=require('fs'),path=require('path');
const {STYLE_CHAR,STYLE_BG,EXCLUDE,OUT}=require('./build-asset-brief.js');
const STYLE_CAST='기존 오르페이아 PNG와 같은 화풍으로 새 인물을 그린다: 약 3등신의 SD 애니메이션 비율, 깨끗하고 섬세한 선화, 부드러운 셀 채색, 짙은 남색·청록·절제된 금색 팔레트, 은은한 차가운 윤곽광. 오르페이아의 얼굴형·은발·녹색 눈·메이드 복장을 복제하지 않는다. 같은 인물의 표정 차분은 자세·배율·발 기준점을 고정하고 표정과 손만 바꾼다.';
const REF={orp:'orpheia_sd_maid_v2.png (필수), orpheia_sd_praise_v2.png, orpheia_sd_worried_v2.png (표정 폭 참고)',cast:'orpheia_sd_maid_v2.png, orpheia_sd_stationmaster_v2.png (화풍·등신·선 굵기 기준 — 인물 자체는 복제하지 않음)',bg:'bg_control_room_night.png, bg_break_room이 있으면 함께 (화풍·채도 기준)'};
const set=(stem,list)=>list.map(([k,label,desc])=>({file:`${stem}_${k}.png`,label,desc}));
const INSTRUCTOR=set('chr_instructor',[['neutral','기본','입을 다문 무표정. 한 손에 종이컵 커피.'],['stern','엄격','미간을 살짝 좁히고 시선을 내려다본다. 커피는 그대로.'],['smile','옅은 미소','입꼬리만 아주 조금 올라간, 본인은 숨기려는 미소.'],['coffee','커피','종이컵을 입가에 대고 눈을 감은 채 한 모금. 피곤과 여유가 섞인 표정.']]);
const HARIN=set('chr_harin',[['neutral','기본','밝은 기본 표정.'],['smile','웃음','눈을 감고 활짝 웃는다.'],['surprised','놀람 (또?!)','눈이 동그래지고 입을 크게 벌린다. 양손을 어깨 높이로 든다.'],['pout','삐짐','볼을 부풀리고 입술을 내민다.'],['excited','신남','주먹을 쥐고 눈이 반짝인다. 몸이 약간 앞으로 기운다.']]);
const ORP=set('orpheia_sd',[['surprised','놀람 (또?!)','녹색 눈이 커지고 입을 동그랗게 벌린다. 한 손을 입가에.'],['pout','삐침','볼을 살짝 부풀리고 시선을 옆으로. 팔짱 또는 두 손을 앞치마 앞에 모은다.'],['shy','수줍음','볼이 붉고 시선을 아래로. 두 손을 가슴 앞에서 맞잡는다.']]);
const ITEMS=[
 {id:'CHR-03',priority:'P0',kind:'chr',style:'cast',title:'서도희 교관 스탠딩 4종',type:'투명 캐릭터',use:'모든 장의 교관 대사 (현재는 이름표만 표시됨)',files:INSTRUCTOR.map(x=>x.file),ref:REF.cast,
  scene:'수석 관제사 서도희. 40대 후반 여성, 어깨 위로 짧게 묶은 검은 머리에 흰 머리카락 몇 가닥, 가는 금테 안경과 날카롭지만 피곤한 눈매, 무뚝뚝하지만 차갑지 않은 인상. 남색 근무 셔츠에 회색 카디건, 목에 건 사원증, 한 손에 종이컵 커피. 오르페이아보다 머리 하나 정도 큰 SD 비율(약 3.5등신). 네 장을 각각 독립 생성한다.\n'+INSTRUCTOR.map(x=>`· ${x.file} (${x.label}): ${x.desc}`).join('\n'),
  comp:'발끝까지 포함한 전신, 캔버스 상하 8% 여백. 네 장 모두 같은 위치·크기·발 기준점.'},
 {id:'CHR-04',priority:'P0',kind:'chr',style:'cast',title:'유하린 스탠딩 5종',type:'투명 캐릭터',use:'모든 장의 동기 대사 (현재는 이름표만 표시됨)',files:HARIN.map(x=>x.file),ref:REF.cast,
  scene:'주인공 신상철의 동기 수습 관제사 유하린. 20대 초반 여성, 밝은 갈색 단발에 짧은 옆 묶음, 열차 모양 노란 머리핀, 호박색 큰 눈. 흰 셔츠에 남색 니트 조끼, 사원증, 손목에 작은 수첩 고무줄. 철도를 좋아하는 활발한 인상. 오르페이아와 같은 SD 비율. 다섯 장을 각각 독립 생성한다.\n'+HARIN.map(x=>`· ${x.file} (${x.label}): ${x.desc}`).join('\n'),
  comp:'발끝까지 포함한 전신, 캔버스 상하 8% 여백. 다섯 장 모두 같은 위치·크기·발 기준점.'},
 {id:'ORP-01',priority:'P0',kind:'chr',style:'char',title:'오르페이아 일상 표정 3종',type:'투명 캐릭터',use:'「또?!」 장면, 티격태격, 수줍은 장면 (현재는 기본·걱정 스탠딩으로 대체 중)',files:ORP.map(x=>x.file),ref:REF.orp,
  scene:'기본 메이드 SD 오르페이아. orpheia_sd_maid_v2.png와 같은 복장·비율·배율. 세 장을 각각 독립 생성한다.\n'+ORP.map(x=>`· ${x.file} (${x.label}): ${x.desc}`).join('\n'),
  comp:'orpheia_sd_maid_v2.png와 같은 캔버스 크기·발 기준점·머리 높이.'},
 {id:'BG-19',priority:'P0',kind:'bg',title:'관제센터 로비 · 아침',type:'배경',use:'프롤로그 첫 장면',files:['bg_center_lobby.png'],ref:REF.bg,
  scene:'철도 관제센터 1층 로비의 이른 아침. 유리 출입문 너머 옅은 아침빛, 출입 게이트와 안내 데스크, 벽면의 작은 노선도 패널(글자 없음). 인물 없음.',comp:'바닥과 출입문은 하단, 중앙은 밝은 저대비 벽.'},
 {id:'BG-20',priority:'P0',kind:'bg',title:'구내식당 · 점심',type:'배경',use:'프롤로그 점심 장면 (첫 「또?!」)',files:['bg_cafeteria.png'],ref:REF.bg,
  scene:'직원 구내식당의 점심. 긴 테이블과 의자, 배식대, 창가 자리. 식판 한두 개만 놓여 있다. 따뜻한 형광등 빛에 청록 포인트. 인물 없음.',comp:'창가 테이블을 오른쪽에, 중앙은 단순한 벽과 창.'},
 {id:'BG-21',priority:'P0',kind:'bg',title:'야간 휴게실',type:'배경',use:'1장 야간 근무, 새벽 대화',files:['bg_break_room.png'],ref:REF.bg,
  scene:'관제실 옆 야간 휴게실. 낡은 소파와 담요, 작은 테이블, 자판기 불빛, 창밖의 도시 야경. 인물 없음.',comp:'소파는 왼쪽 하단, 자판기는 오른쪽. 중앙은 어두운 벽.'},
 {id:'BG-22',priority:'P0',kind:'bg',title:'관제센터 옥상 · 밤',type:'배경',use:'프롤로그 이름 이야기, 이후 장 마무리',files:['bg_rooftop_night.png'],ref:REF.bg,
  scene:'관제센터 건물 옥상의 밤. 낮은 난간과 환기 설비, 멀리 고가 위로 지나가는 열차 불빛의 선, 도시 야경과 별 몇 개. 인물 없음.',comp:'난간은 하단을 가로지르고, 열차 불빛은 화면 가운데 높이의 원경.'},
 {id:'KV-01',priority:'P1',kind:'bg',style:'char',title:'타이틀 키 비주얼',type:'타이틀',use:'타이틀 화면 배경 (있으면 스탠딩 대신 이 그림만 표시)',files:['title_key_visual.png'],ref:REF.orp+', bg_control_room_night.png',
  scene:'밤의 관제실 대형 표시반 앞, 메이드 SD 오르페이아가 홀로그램 입자 속에서 돌아보며 손을 내민다. 표시반의 청록 노선 빛과 창밖의 고가 열차 불빛.',comp:'오르페이아는 오른쪽 1/3. 왼쪽 45%는 어둡고 단순하게 비워 타이틀 글자와 메뉴를 얹는다. 글자는 그리지 않는다.'},
 {id:'EV-01',priority:'P1',kind:'end',style:'char',title:'첫 기동',type:'이벤트 CG',use:'프롤로그 — 오르페이아가 처음 기동하는 순간',files:['cg_vn_first_boot.png'],ref:REF.orp,
  scene:'관제석 책상 위 홀로그램 패널에서 은빛 입자가 모여 메이드 SD 오르페이아가 막 형태를 갖추는 순간. 눈을 뜨며 이쪽(관제석의 상철)을 바라보고, 치맛자락을 살짝 잡아 인사한다. 앞쪽에 헤드셋과 키보드 끝이 보인다.',comp:'오르페이아는 중앙보다 약간 오른쪽, 하단 28%에는 책상 가장자리만.'},
 {id:'EV-02',priority:'P2',kind:'end',style:'char',title:'옥상, 이름 이야기',type:'이벤트 CG',use:'프롤로그 마지막 — 오르페우스 이야기',files:['cg_vn_rooftop_name.png'],ref:REF.orp+', bg_rooftop_night가 있으면 함께',
  scene:'옥상 난간에 세워 둔 업무용 태블릿. 화면 위로 작은 홀로그램 오르페이아가 떠올라 같은 야경을 올려다본다. 멀리 고가 위 열차 불빛. 상철은 화면 왼쪽 끝에 손과 소매만 보인다.',comp:'태블릿과 오르페이아는 오른쪽 하단에서 중앙으로, 야경은 상단.'},
 {id:'EV-04',priority:'P1',kind:'end',style:'char',title:'쏙! 스마트폰 이사',type:'이벤트 CG',use:'1장 마지막 — 오르페이아가 상철의 스마트폰으로 들어가는 순간',files:['cg_vn_phone_move.png'],ref:REF.orp,
  scene:'새벽의 관제실. 상철이 내민 스마트폰을 향해, 메이드 SD 오르페이아가 홀로그램 패널에서 다이빙하듯 뛰어든다. 몸이 은빛·청록 입자로 풀리며 화면 속으로 빨려 들어가고, 얼굴은 신난 표정. 상철은 손과 소매만 보인다.',comp:'스마트폰은 오른쪽 하단, 오르페이아는 왼쪽 위에서 대각선으로 날아든다. 중앙은 입자 궤적.'},
 {id:'EV-03',priority:'P2',kind:'end',style:'char',title:'새벽 세 시의 휴게실',type:'이벤트 CG',use:'1장 — 새벽 대화',files:['cg_vn_night_shift.png'],ref:REF.orp+', chr_harin_*가 있으면 함께',
  scene:'새벽 휴게실. 소파에서 담요를 둘둘 만 채 잠든 유하린, 테이블 위 비운 떡볶이 그릇 두 개. 테이블 위 단말 화면에서 작은 오르페이아가 손가락을 입에 대고 "쉿" 하며 이쪽을 본다. 창밖이 푸르스름하게 밝아 오기 시작한다.',comp:'하린은 왼쪽, 오르페이아 단말은 오른쪽 아래. 중앙은 창.'},
];
const styleOf=it=>it.style==='cast'?STYLE_CAST:it.style==='char'?STYLE_CHAR:STYLE_BG;
const promptOf=it=>[styleOf(it),'장면: '+it.scene,'구도: '+it.comp,'출력: '+OUT[it.kind],'제외: '+EXCLUDE+(it.style==='cast'?' 오르페이아 복제, 메이드 복장.':'')].join('\n');
const json=ITEMS.map(it=>({id:it.id,priority:it.priority,title:it.title,type:it.type,use:it.use,files:it.files,transparent_background:it.kind==='chr',attach_references:it.ref,prompt:promptOf(it)}));
const md=`# 오르페이아 VN 추가 에셋 생성 지침 (3차)

비주얼 노벨 모드(프롤로그·1장)에 필요한 에셋입니다. 1·2차 에셋은 모두 반영되어 있다는 전제입니다.

## 연결 방식

\`assets/\`에 파일명 그대로 넣으면 사이트가 시작할 때 감지해 해당 장면에 사용합니다. 없는 동안은 다음처럼 대체됩니다.
- 교관·하린 스탠딩: 이름표만 표시
- 일상 배경: 야간 관제실 등 기존 배경
- 오르페이아 추가 표정: 기본·칭찬·걱정 스탠딩
- 이벤트 CG: 표시하지 않음

## 새 인물 설정 (생성 AI에 함께 전달)

- **서도희 교관** — 하늘선 종합관제센터 수석 관제사, 40대 후반 여성. 무뚝뚝하고 말수가 적지만 신입을 끝까지 지켜보는 사람. 입버릇은 "기록해 둬요", 늘 종이컵 커피를 들고 있음.
- **유하린** — 주인공 신상철의 동기 수습 관제사, 20대 초반 여성. 밝고 시끄러운 철도 마니아로 긴장하면 차량 제원을 외움. 오르페이아와 티격태격하는 친구.
- **신상철 (주인공)** — 수습 관제사. 화면에 스탠딩으로 나오지 않는 1인칭 주인공이라 그리지 않는다. 이벤트 CG에서는 손·소매·뒷모습만.

## 공통 아트 방향

- 오르페이아: ${STYLE_CHAR}
- 새 인물: ${STYLE_CAST}
- 배경: ${STYLE_BG}
- 스탠딩은 VN 화면 하단에 발을 맞춰 세웁니다. 같은 인물의 차분은 캔버스 크기·발 위치·머리 높이를 반드시 통일합니다.

## 우선순위

| ID | 우선 | 에셋 | 종류 | 파일 | 쓰이는 곳 |
|---|---|---|---|---|---|
${ITEMS.map(it=>`| ${it.id} | ${it.priority} | ${it.title} | ${it.type} | ${it.files.length>1?`${it.files.length}장`:'`'+it.files[0]+'`'} | ${it.use} |`).join('\n')}

## 개별 생성 지시문

${ITEMS.map(it=>`### ${it.id} · ${it.title} (${it.priority})

- 쓰이는 곳: ${it.use}
- 파일명: ${it.files.map(f=>'`'+f+'`').join(', ')}
- 함께 첨부할 원본: ${it.ref}
- 배경: ${it.kind==='chr'?'완전 투명':'불투명'}

\`\`\`text
${promptOf(it)}
\`\`\`
`).join('\n')}
## 납품 검수

1. 새 인물의 표정 차분을 겹쳐 보고 몸 위치·크기가 어긋나지 않는지 확인합니다.
2. 오르페이아와 나란히 놓고 등신·선 굵기·채색 톤이 같은 작품처럼 보이는지 확인합니다.
3. 투명 PNG를 밝은 바탕과 어두운 바탕에 올려 테두리 번짐과 가짜 체크무늬를 확인합니다.
4. 배경 위에 하단 대사창(약 28%)과 좌상단 날짜 표시를 겹쳐 글자가 읽히는지 확인합니다.
`;
const out=path.join(__dirname,'..','docs');
fs.writeFileSync(path.join(out,'추가-에셋-생성지침-VN.json'),JSON.stringify(json,null,2)+'\n');
fs.writeFileSync(path.join(out,'추가-에셋-생성지침-VN.md'),md);
console.log(ITEMS.length+' items, '+ITEMS.reduce((n,it)=>n+it.files.length,0)+' files');
module.exports={ITEMS};
