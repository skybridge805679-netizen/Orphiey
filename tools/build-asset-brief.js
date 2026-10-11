// Builds docs/추가-에셋-생성지침.{md,json} — prompts handed to the image model.
// Run: node tools/build-asset-brief.js
'use strict';
const fs=require('fs'),path=require('path');
const STYLE_CHAR='기존 제공 PNG를 최우선 캐릭터 참조로 사용. 오르페이아는 긴 은색 머리, 선명한 녹색 눈, 청록색 리본, 약 3등신의 귀여운 SD 애니메이션 캐릭터. 얼굴형·앞머리·눈매·복식·소품은 참조와 일치. 깨끗하고 섬세한 선화, 부드러운 셀 채색, 머리카락과 의복 재질의 정돈된 명암. 짙은 남색·청록·절제된 금색 팔레트, 은은한 차가운 윤곽광. 기존 홀로그램 PNG와 같은 수준의 마감.';
const STYLE_BG='한국 철도 배경의 애니메이션 ADV 미술. 짙은 남색과 청록색, 정돈된 셀 채색, 섬세한 선화. 인물 없는 배경. 기존 bg_*.png 배경과 같은 시점 높이·채도·선 굵기로 맞춘다.';
const EXCLUDE='글자, 숫자, 자막, 말풍선, 로고, 워터마크, GAME OVER 문구, UI 버튼, 관제사 복장 오르페이아, 실사 얼굴, 성인 비율의 7~8등신, 선정적인 의상, 유혈과 신체 훼손, 과장된 눈물, 추가 팔다리, 손가락 오류, 잘린 모자와 발끝, 불투명 체크무늬, 판별 가능한 신호 현시·진로 표시·계기 수치, 기존 일러스트의 저해상도 확대와 JPEG 압축 흔적을 제외.';
const OUT={bg:'불투명 16:9 PNG, 2560×1440 이상. 글자와 UI를 그리지 않는다.',end:'불투명 16:9 PNG, 2560×1440 이상. 글자와 UI를 그리지 않는다.',chr:'투명 RGBA PNG, 세로 2:3, 1536×2304. 글자와 UI를 그리지 않는다.',face:'투명 RGBA PNG, 정사각 1024×1024. 글자와 UI를 그리지 않는다.',fx:'투명 RGBA PNG, 정사각 1536×1536. 글자와 UI를 그리지 않는다.'};
const REF={maid:'orpheia_sd_maid_v2.png (필수), cg_training_clear.png (표정·마감 참고)',bg:'bg_control_room_night.png, bg_platform_emergency_normal.png, bg_tunnel_stopped_clear.png (배경 화풍·채도 기준)',end:'end_lost_contact.png, end_second_emergency.png (엔딩 톤 기준)',fx:'fx_holo_connection_connecting_v2.png, fx_holo_connection_disconnected_v2.png (효과 굵기·색 기준)'};
const FACES=[['neutral','기본','브리핑과 평상시. 입을 살짝 다문 부드러운 미소, 눈은 정면.'],['smile','미소','정답 지령 직후. 눈꼬리가 내려간 밝은 미소, 볼에 옅은 홍조.'],['serious','진지','질문을 짚어 줄 때. 눈썹을 살짝 모으고 입은 작게 다문 집중한 표정, 시선은 정면.'],['worry','걱정','실패 엔딩 뒤 위로할 때. 눈썹 끝이 내려가고 입이 작게 벌어진 안타까운 표정. 눈물 없음.'],['resolve','결의','되감기 직후. 입술을 단단히 다물고 눈빛이 또렷한 표정, 한 손 주먹을 가슴 앞에 살짝 쥔다.'],['relief','안도','시나리오 종료. 눈을 반쯤 감고 숨을 내쉬는 듯한 편안한 미소.']];
const ITEMS=[
 // P0 — the story layer already calls these every step.
 {id:'PTR-01',priority:'P0',kind:'face',title:'오르페이아 파트너 표정 6종',type:'파트너 표정',use:'질문 제시·정답 반응·실패 위로·되감기·결과 화면의 대사 말풍선 아이콘 (지름 34~42px 원형으로 잘려 표시)',files:FACES.map(f=>`orpheia_face_${f[0]}.png`),ref:REF.maid,
  scene:'기본 메이드 SD 오르페이아의 가슴 위 바스트업. 여섯 장 모두 같은 각도(정면에서 약 10° 돌린 3/4), 같은 얼굴 크기와 위치로 각각 독립 생성한다. 표정과 손만 바꾼다.\n'+FACES.map(f=>`· ${f[0]} (${f[1]}): ${f[2]}`).join('\n'),
  comp:'얼굴 중심을 캔버스 중앙보다 약간 위(세로 45%)에 두고, 앞머리부터 턱까지가 캔버스 지름의 약 55%를 차지하게. 원형으로 잘라도 리본과 눈이 남아야 한다. 어깨 아래는 자연스럽게 투명 처리.'},
 {id:'BG-08',priority:'P0',kind:'bg',title:'역 운전취급실 · 신호 취급',type:'배경',use:'운전취급(폐색·신호) 시나리오의 역장 교신 — R-2-09·10·11·12·14·15·17·26 (32단계)',files:['bg_signal_cabin_night.png'],ref:REF.bg,
  scene:'일반철도 지상역의 야간 역 운전취급실. 신호 취급 콘솔과 전화기, 탁상 무전기, 창밖으로 보이는 어두운 구내 선로와 승강장 조명. 콘솔 화면은 추상적인 청록 선과 면으로만 표현하고 어느 진로·신호가 켜졌는지 읽을 수 없게 한다. 인물 없음.',
  comp:'콘솔은 하단 좌우로 길게, 창은 상단. 중앙(가로 20~80%, 세로 18~66%)은 어두운 창과 저대비 벽으로 비운다.'},
 {id:'BG-09',priority:'P0',kind:'bg',title:'야간 본선 · 신호기 앞',type:'배경',use:'일반철도 본선 교신 — 폐색·신호, 열차제어장치 고장, 구원운전, 선로 고장 (R-2-09~29, R-3-10 등 62단계)',files:['bg_mainline_signal_night.png'],ref:REF.bg,
  scene:'지상 복선 본선의 야간 직선 구간. 가공 전차선 기둥이 이어지고, 멀리 선로변 신호기의 실루엣과 멈춘 열차의 후부 표지등이 보인다. 신호기 등화는 꺼져 있거나 색을 판별할 수 없는 희미한 반사로만 처리한다. 인물 없음.',
  comp:'소실점은 오른쪽 위. 왼쪽 1/3은 어두운 법면과 하늘로 비워 홀로그램 합성 여백을 둔다.'},
 // P1
 {id:'PTR-02',priority:'P1',kind:'chr',title:'출동 브리핑 · 오르페이아',type:'투명 캐릭터',use:'시나리오 시작 시 「오르페이아 브리핑」 단계의 스탠딩 (관제실 배경 위 중앙)',files:['orpheia_sd_briefing.png'],ref:REF.maid,
  scene:'기본 메이드 SD 오르페이아가 표지가 공란인 사건 기록철을 한 팔로 가슴에 안고, 다른 손은 손바닥을 위로 해 살짝 들어 설명하는 자세. 표정은 진지하지만 따뜻한 미소. 메이드 복장을 다른 역할 복장과 섞지 않는다.',
  comp:'발끝과 머리 리본까지 포함한 전신, 캔버스 상하 10% 여백. 기존 orpheia_sd_maid_v2.png와 같은 발 기준점과 머리 높이.'},
 {id:'BG-10',priority:'P1',kind:'bg',title:'분기부의 선로전환기',type:'배경',use:'선로전환기 장애 — U-2-19, R-2-27, R-2-28 (15단계). 기존 cg_engineer_points_check.png의 인물 없는 짝',files:['bg_points_night.png'],ref:REF.bg+', cg_engineer_points_check.png (설비 형태 참고)',
  scene:'야간 분기부. 선로전환기 기계함과 텅레일, 작업등의 원형 빛. 어느 방향으로 개통되어 있는지 판별되지 않는 각도로 그린다. 공구나 사람 없음.',
  comp:'전환기는 오른쪽 하단 1/3. 중앙은 어두운 자갈과 하늘.'},
 {id:'BG-11',priority:'P1',kind:'bg',title:'경보가 울리는 건널목',type:'배경',use:'건널목 사고 — R-2-03, R-3-07 (11단계)',files:['bg_level_crossing_night.png'],ref:REF.bg,
  scene:'비에 젖은 야간 철도 건널목. 경보등의 붉은 반사가 노면에 번지고, 차단기와 경보기가 보인다. 차량·사람·충돌 흔적은 그리지 않는다. 멀리 도로의 흐릿한 헤드라이트 정도만.',
  comp:'건널목은 왼쪽, 선로는 오른쪽으로 사라진다. 붉은 빛은 가장자리 포인트로 제한.'},
 {id:'BG-12',priority:'P1',kind:'bg',title:'전기가 끊긴 구간',type:'배경',use:'전차선 단전·절연구간 정차 — U-2-18, R-2-30 (11단계)',files:['bg_power_outage.png'],ref:REF.bg,
  scene:'가공 전차선이 보이는 지상 구간에 멈춘 전동차. 객실 실내등이 꺼지고 비상등만 희미하게 켜져 있다. 하늘은 짙은 남색, 전차선은 빛 없이 실루엣. 스파크·화재 없음.',
  comp:'열차는 오른쪽 하단 대각선, 전차선은 상단을 가로지른다. 중앙은 어두운 하늘.'},
 {id:'BG-13',priority:'P1',kind:'bg',title:'고속선 고가 · 야간',type:'배경',use:'고속선 교신 — R-2-04B, R-2-06, R-2-16, R-2-28, R-3-14 등 (18단계)',files:['bg_highspeed_viaduct_night.png'],ref:REF.bg+', bg_highspeed_snow.png (고속선 형태 참고)',
  scene:'고속철도 콘크리트 고가 구간과 방음벽, 멀리 다가오지 않고 정차해 있는 고속열차 전조등. 눈·비 없는 맑은 밤. 속도감이나 특정 속도를 암시하는 모션 블러 없음.',
  comp:'고가는 화면 아래 1/3을 가로지른다. 중앙 하늘은 저대비.'},
 {id:'BG-14',priority:'P1',kind:'bg',title:'멈춘 열차의 객실',type:'배경',use:'열차 내 폭발물·독가스·응급환자 — U-2-15, R-2-33·34·36, R-3-08 (26단계)',files:['bg_train_cabin_night.png'],ref:REF.bg,
  scene:'정차한 열차의 빈 객실 내부. 좌석과 손잡이, 창밖의 어둠, 조명 일부가 약하게 깜박이는 느낌. 가방·의심물체·가스·환자는 그리지 않는다 (보고 전 단계에서 사실을 먼저 보여주지 않기 위해).',
  comp:'통로가 중앙에서 안쪽으로 이어지되 중앙은 어둡고 단순하게.'},
 {id:'BG-15',priority:'P1',kind:'bg',title:'비워진 대합실',type:'배경',use:'역사 내 독가스·폭발물 — R-2-35, R-3-09 (11단계)',files:['bg_concourse_night.png'],ref:REF.bg+', cg_hazmat_report.png (공간 분위기 참고)',
  scene:'일반철도 역의 넓은 야간 대합실. 승객이 빠져나가 비어 있고, 매표 창구 셔터와 의자 열, 천장 조명의 반사. 가방·연기·통제선은 그리지 않는다.',
  comp:'원근은 중앙 안쪽으로, 밝은 조명은 상단. 하단 28%는 어두운 바닥.'},
 // P2
 {id:'BG-16',priority:'P2',kind:'bg',title:'진동이 지나간 역',type:'배경',use:'지진 — U-2-22, R-2-05, R-3-14 (14단계)',files:['bg_station_quake.png'],ref:REF.bg,
  scene:'지진 직후 사람이 빠진 지상역 승강장. 흔들린 매달림 조명이 비스듬하고, 바닥에 작은 낙하물 몇 개. 구조물 붕괴·균열 과장·부상자 없음.',
  comp:'승강장은 왼쪽에서 오른쪽 위로. 중앙은 저대비.'},
 {id:'BG-17',priority:'P2',kind:'bg',title:'차량기지 입·출고선',type:'배경',use:'입·출고선 사용 불능 — U-2-21',files:['bg_depot_night.png'],ref:REF.bg,
  scene:'새벽 전의 도시철도 차량기지. 여러 갈래 선로와 유치된 전동차들, 기지 조명탑. 인물 없음.',
  comp:'선로가 아래에서 위로 부채꼴로 퍼진다. 중앙 하늘은 비운다.'},
 {id:'BG-18',priority:'P2',kind:'bg',title:'야간 선로 작업 현장',type:'배경',use:'작업 중 긴급상황·특수차 충돌 — U-2-07, R-2-22 (8단계)',files:['bg_track_work_night.png'],ref:REF.bg,
  scene:'야간 선로 작업 구간. 모터카와 작업등, 정리된 자재. 작업자는 원경의 안전조끼 실루엣 한두 명까지만. 사고 순간이나 부상 없음.',
  comp:'모터카는 오른쪽, 작업등 빛은 왼쪽 상단.'},
 {id:'END-05',priority:'P2',kind:'end',title:'통제선 바깥의 전조등',type:'실패 엔딩 CG',use:'「통제 범위 축소」「위험한 운행 지시」로 판정된 실패 엔딩 (기존이 end_lost_contact일 때 대체)',files:['end_outside_line.png'],ref:REF.end,
  scene:'어둠 속 멀리서 열차 전조등 한 쌍이 다가오고, 전경에는 아무도 서지 않은 선로와 붉은 비상등 반사. 충돌 순간·사람 없음. 「멈춰야 했던 열차가 멈추지 않았다」는 감각만 전달.',
  comp:'전조등은 오른쪽 위 원경, 중앙은 어둡게 비워 결말 제목 공간 확보.'},
 {id:'END-06',priority:'P2',kind:'end',title:'아무도 쥐지 않은 무전기',type:'실패 엔딩 CG',use:'「책임 주체 혼동」「필수 조치 누락」「대기·방치」로 판정된 실패 엔딩',files:['end_unheld_radio.png'],ref:REF.end+', bg_control_room_night.png (관제석 형태 참고)',
  scene:'빈 관제석 책상 위에 놓인 무전기 송수화기. 수신 램프만 붉게 깜박이고, 화면 빛이 꺼져 가는 관제실. 인물 없음.',
  comp:'무전기는 왼쪽 하단 전경, 나머지는 깊은 어둠. 붉은 빛은 작은 포인트.'},
 {id:'FX-02',priority:'P2',kind:'fx',title:'되감기 효과 레이어',type:'투명 효과',use:'GAME OVER에서 「이 판단 직전으로 되감기」를 누른 순간 0.9초간 무대 위에 회전하며 사라짐',files:['fx_rewind.png'],ref:REF.fx,
  scene:'청록색 시계 문자판 같은 얇은 동심원 링, 반시계 방향으로 휘는 빛줄기와 작은 입자. 숫자·눈금 글자·바늘 없음. 적색 없음.',
  comp:'중앙은 완전 투명, 링은 지름의 60~95% 영역. 완전 투명 배경 유지.'},
];
const promptOf=it=>[(it.kind==='bg'||it.kind==='end'&&!/오르페이아/.test(it.scene))?STYLE_BG:STYLE_CHAR,'장면: '+it.scene,'구도: '+it.comp,'출력: '+OUT[it.kind],'제외: '+EXCLUDE].join('\n');
const json=ITEMS.map(it=>({id:it.id,priority:it.priority,title:it.title,type:it.type,use:it.use,files:it.files,transparent_background:['chr','face','fx'].includes(it.kind),attach_references:it.ref,prompt:promptOf(it)}));
const md=`# 오르페이아 ADV 추가 에셋 생성 지침 (2차)

이미지 생성 AI에 넘기는 기획서입니다. 1차 지침(\`docs/gpt/추가-CG-제작지침.md\`)의 34장은 이미 제작되었다는 전제로, **스토리 레이어(story.js)가 새로 필요로 하는 에셋**과 **배경이 비어 있던 시나리오군**만 다룹니다.

## 왜 필요한가

- 운전취급(폐색·신호) 13개, 전력 2개, R계열 고장·구원, 지진, 건널목, 테러·위험물 시나리오가 지금은 모두 「지하 승강장」 배경으로 표시됩니다. 일반철도·고속선 교신에 도시철도 승강장이 나오는 셈입니다.
- 질문 제시·정답 반응·위로·되감기마다 오르페이아 말풍선이 뜨지만 아이콘은 기본 메이드 한 장뿐이라 감정 변화가 보이지 않습니다.
- 실패 엔딩은 7가지 판단 유형으로 나뉘었지만 엔딩 CG는 4장이라 「통신·지휘 실패」 계열이 같은 그림을 씁니다.

## 연결 방식

\`assets/\`에 **아래 파일명 그대로** PNG를 넣으면 사이트가 시작할 때 자동으로 감지해 해당 장면을 교체하고 CG 갤러리에도 추가합니다. 파일이 없으면 기존 그림을 그대로 씁니다. 코드 수정은 필요 없습니다.

## 공통 아트 방향

- 캐릭터: ${STYLE_CHAR}
- 배경: ${STYLE_BG}
- 플레이어가 관제사입니다. 관제사 오르페이아를 새로 만들지 않습니다. 오르페이아는 상대 역할 또는 학습 보좌(기본 메이드)로만 등장합니다.
- 실제 원본 PNG를 생성 AI에 함께 첨부합니다. 파일명만 적지 않습니다. 다른 역할의 의상을 섞지 않습니다.

## 화면 여백

- 선택지는 화면 중앙 약 x=20~80%, y=18~66%에 겹칩니다. 이 영역의 밝기와 복잡도를 낮춥니다.
- 하단 약 28%는 대사창이 덮습니다. 핵심 단서를 두지 않습니다.
- 상단 약 8%에는 상황판 HUD(경과 시각·조치 램프)가 얹힙니다. 밝은 하늘을 두지 않습니다.
- 모바일에서는 좌우가 잘립니다. 배경의 핵심 사물은 가로 25~75% 안에 둡니다.
- 한 장에 여러 컷을 합치지 않습니다. 차분은 모두 독립 PNG로 받습니다.

## 우선순위

P0: 매 교신마다 보이거나 가장 많은 단계를 덮는 에셋. P1: 시나리오군의 분위기를 바로잡는 배경. P2: 반복 플레이 완성도.

| ID | 우선 | 에셋 | 종류 | 파일 | 쓰이는 곳 |
|---|---|---|---|---|---|
${ITEMS.map(it=>`| ${it.id} | ${it.priority} | ${it.title} | ${it.type} | ${it.files.length>1?`${it.files.length}장`:'`'+it.files[0]+'`'} | ${it.use} |`).join('\n')}

## 개별 생성 지시문

각 블록을 그대로 복사해 전달하면 됩니다. 공통 아트 방향과 제외 지침이 이미 포함되어 있습니다.

${ITEMS.map(it=>`### ${it.id} · ${it.title} (${it.priority})

- 쓰이는 곳: ${it.use}
- 파일명: ${it.files.map(f=>'`'+f+'`').join(', ')}
- 함께 첨부할 원본: ${it.ref}
- 배경: ${['chr','face','fx'].includes(it.kind)?'완전 투명':'불투명'}

\`\`\`text
${promptOf(it)}
\`\`\`
`).join('\n')}
## 납품 검수

1. 원본 캐릭터와 얼굴·머리·눈 색·의상·등신을 비교합니다. 표정 6종은 나란히 놓고 얼굴 위치·크기가 같은지 확인합니다.
2. 표정 아이콘을 지름 40px 원형으로 줄여도 누구인지, 어떤 감정인지 읽히는지 확인합니다.
3. 투명 에셋을 밝은 바탕과 사이트의 어두운 바탕 모두에 올려 테두리 번짐과 가짜 체크무늬를 확인합니다.
4. 배경 위에 중앙 선택지 4개와 하단 대사창, 상단 HUD를 겹쳐 보고 글자가 읽히는지 확인합니다.
5. 신호 현시·진로·계기 수치·대피 방향·위험물의 정체 등, 보고 전 단계에서 아직 알려지지 않은 정보를 그림이 먼저 보여 주지 않는지 확인합니다.
6. 배경은 절차 도해가 아닙니다. 설비 상태를 새로 발명해 넣지 않습니다.
`;
const out=path.join(__dirname,'..','docs');
fs.writeFileSync(path.join(out,'추가-에셋-생성지침.json'),JSON.stringify(json,null,2)+'\n');
fs.writeFileSync(path.join(out,'추가-에셋-생성지침.md'),md);
console.log(ITEMS.length+' items, '+ITEMS.reduce((n,it)=>n+it.files.length,0)+' files');
