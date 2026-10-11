'use strict';
// Every planned visual-novel asset in one place: the file name GPT should deliver, its gallery title,
// and the existing picture shown until it arrives. vn.js probes these; tools/build-final-asset-brief.js
// writes the generation prompts for the same file names.
const VN_ART=[
 // ── Characters (transparent standings)
 ...[['neutral','기본'],['stern','엄격'],['smile','옅은 미소'],['coffee','커피'],['casual','사복']].map(([k,t])=>({file:`chr_instructor_${k}.png`,title:`서도희 교관 · ${t}`,type:'캐릭터'})),
 ...[['neutral','기본'],['smile','웃음'],['surprised','놀람'],['pout','삐짐'],['excited','신남'],['casual','사복'],['yukata','유카타']].map(([k,t])=>({file:`chr_harin_${k}.png`,title:`유하린 · ${t}`,type:'캐릭터'})),
 ...[['neutral','기본'],['smile','웃음'],['serious','진지']].map(([k,t])=>({file:`chr_jian_${k}.png`,title:`류지안 · ${t}`,type:'캐릭터'})),
 ...[['surprised','놀람'],['pout','삐침'],['shy','수줍음'],['casual','외출복'],['yukata','유카타'],['santa','산타'],['coat','겨울 코트'],['suit','평가일 정장']].map(([k,t])=>({file:`orpheia_sd_${k}.png`,title:`오르페이아 · ${t}`,type:'캐릭터'})),
 // ── Backgrounds
 {file:'bg_center_lobby.png',title:'관제센터 로비 · 아침',type:'배경',fallback:'bg_control_room_night.png'},
 {file:'bg_cafeteria.png',title:'구내식당 · 점심',type:'배경',fallback:'bg_control_room_night.png'},
 {file:'bg_break_room.png',title:'야간 휴게실',type:'배경',fallback:'bg_control_room_night.png'},
 {file:'bg_rooftop_night.png',title:'관제센터 옥상 · 밤',type:'배경',fallback:'bg_mainline_signal_night.png'},
 {file:'bg_riverside_day.png',title:'강변 자전거길 · 주말',type:'배경',fallback:'bg_bridge_night.png'},
 {file:'bg_fire_training.png',title:'소방 합동훈련장',type:'배경',fallback:'bg_platform_emergency_emergency.png'},
 {file:'bg_bungeoppang_stall.png',title:'시계탑역 붕어빵 가게',type:'배경',fallback:'bg_platform_emergency_normal.png'},
 {file:'bg_cherry_street.png',title:'벚꽃 퇴근길',type:'배경',fallback:'bg_mainline_signal_night.png'},
 {file:'bg_depot_day.png',title:'차량기지 견학 · 낮',type:'배경',fallback:'bg_depot_night.png'},
 {file:'bg_dev_lab.png',title:'개발팀 연구실',type:'배경',fallback:'bg_control_room_night.png'},
 {file:'bg_summer_festival.png',title:'강변 여름 축제',type:'배경',fallback:'bg_bridge_night.png'},
 {file:'bg_year_end_party.png',title:'송년회 고깃집',type:'배경',fallback:'bg_control_room_night.png'},
 {file:'bg_snow_street.png',title:'첫눈 내린 퇴근길',type:'배경',fallback:'bg_highspeed_snow.png'},
 {file:'bg_train_window.png',title:'파견 가는 열차 창가',type:'배경',fallback:'bg_mainline_signal_night.png'},
 {file:'bg_hanbit_center.png',title:'한빛 광역철도관제센터',type:'배경',fallback:'bg_control_room_night.png'},
 {file:'bg_hanbit_dorm.png',title:'파견 숙소 · 밤',type:'배경',fallback:'bg_control_room_night.png'},
 {file:'bg_gukbap.png',title:'건널목 앞 국밥집',type:'배경',fallback:'bg_level_crossing_night.png'},
 {file:'bg_study_room.png',title:'합숙 스터디룸',type:'배경',fallback:'bg_control_room_night.png'},
 {file:'bg_hanbit_rooftop.png',title:'한빛센터 옥상 · 노을',type:'배경',fallback:'bg_mainline_signal_night.png'},
 {file:'bg_exam_hall.png',title:'실기 평가장 · 시뮬레이터실',type:'배경',fallback:'bg_control_room_night.png'},
 {file:'bg_spring_cherry.png',title:'다시 봄 · 고가 아래 벚꽃',type:'배경',fallback:'bg_mainline_signal_night.png'},
 // ── Event CGs (shown only once delivered)
 ...[
  ['cg_vn_first_boot','첫 기동'],['cg_vn_rooftop_name','옥상, 이름 이야기'],['cg_vn_night_shift','새벽 세 시의 휴게실'],['cg_vn_phone_move','쏙! 스마트폰 이사'],
  ['cg_vn_bike_riverside','폰 거치대의 첫 바깥 구경'],['cg_vn_cherry_commute','벚꽃 퇴근길'],['cg_vn_bungeoppang','붕어빵 사장님의 덤'],
  ['cg_vn_notebook','교관의 낡은 기록 노트'],['cg_vn_reboot','재부팅, 그리고 다시'],['cg_vn_fireworks','여름 축제의 불꽃'],['cg_vn_first_snow','첫눈과 산타 메이드'],
  ['cg_vn_hanbit_arrival','한빛센터 첫 출근'],['cg_vn_anniversary','기동 1주년'],['cg_vn_block_song','폐색방식의 노래'],['cg_vn_rooftop_promise','데리러 갈게'],
  ['cg_vn_opinion_letter','교관의 의견서'],['cg_vn_eve','평가 전날 밤'],['cg_vn_exam_start','평가장, 역장 복장의 오르페이아'],
  ['cg_end_true','다시 봄, 정식 배치'],['cg_end_normal','평소의 아침'],['cg_vn_epilogue','새 신입과 또?!'],
 ].map(([f,t])=>({file:f+'.png',title:t,type:'이벤트 CG'})),
 // ── Title and UI
 {file:'title_key_visual.png',title:'타이틀 키 비주얼',type:'타이틀'},
 {file:'title_key_visual_clear.png',title:'타이틀 · 클리어 후',type:'타이틀'},
 {file:'title_logo.png',title:'타이틀 로고',type:'UI'},
 {file:'ui_ttott_stamp.png',title:'「또?!」 도장',type:'UI'},
 {file:'ui_chapter_card.png',title:'장 타이틀 카드 배경',type:'UI'},
];
