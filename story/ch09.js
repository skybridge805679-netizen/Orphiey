VN.chapter('ch09','제9장','신호가 침묵할 때',`
@chapter 제9장|신호가 침묵할 때
@bg bg_study_room
@day 3월 31일 (월) 19:00 · 한빛센터 합숙 스터디룸
월요일 저녁. 서 교관이 예고한 「폐색 합숙」이 시작됐다. 스터디룸 화이트보드에는 폐색방식 이름이 빼곡했다.
@show instructor stern right
[서도희|stern] 한빛선에서 신호가 침묵하면, 관제사의 말이 신호가 돼요. 말 한마디가 틀리면 열차 두 대가 같은 구간에 들어가요.
@show harin pout left
[유하린|pout] 교관님, 지령식이랑 통신식이랑 지도통신식이 자꾸 섞여요……
@phone on
@show orpheia explain center
[오르페이아|explain] 그럼 기본부터요! 주인님, 복선 구간에서 쓸 수 있는 대용폐색방식은?
@choice
> 지령식과 통신식 -> b_ok {study+1}
> 지도통신식과 지도식 -> b_single
> 전령법만 -> b_messenger
@label b_ok
[신상철] 복선은 지령식이랑 통신식.
[오르페이아|smile] 정답! 단선은 지령식·지도통신식·지도식, 셋이에요. 그것도 안 되면 전령법!
@jump b_after
@label b_single
[신상철] 지도통신식이랑 지도식……
[오르페이아|worry] 그건 단선 쪽이에요. 복선은 「지령·통신」 둘, 단선은 「지령·지도통신·지도」 셋이에요.
@jump b_after
@label b_messenger
[신상철] 전령법……?
[오르페이아|worry] 전령법은 대용폐색도 안 될 때 쓰는 폐색준용법이에요. 복선의 대용폐색은 지령식·통신식이에요.
@label b_after
[유하린|neutral] ……나 지금 또 섞였어.
[오르페이아|shy] 그럼…… 제가 노래로 만들어 볼까요?
[서도희|coffee] 노래요?
[오르페이아|shy] 제 이름, 음악가 이름이잖아요. 외우기 쉬운 노래요.
@cg cg_vn_block_song
폰 스피커에서 경쾌한 피아노 반주가 흐르고, 화면 위로 음표가 통통 튀어 오른다.
[오르페이아] ♪ 화면이 보이면 지령식~ 관제가 무전으로 직접~
[오르페이아] ♪ 화면이 꺼지면 통신식~ 역장님끼리 전화로 확인~
[오르페이아] ♪ 하나뿐인 선로엔 지도통신식~ 지도표 없으면 못 달려요~
[오르페이아] ♪ 그래도 안 되면 전령법~ 한 구간에 전령자는 딱 한 명~
[유하린|excited] ……외워졌어! 진짜 외워졌어!
[서도희|smile] ……틀린 데가 없네요. 각주까지 달아 주고 싶을 만큼.
[신상철] 오르페이아. 너 이거 언제 만들었어?
[오르페이아|shy] 주인님이 주무실 때요. 1년 치 밤을 썼어요.
@cg off
@phone off
@alarm 한빛선 초롱~산들 · 자동폐색신호기 2기 고장
[유하린|surprised] 또?! 노래 1절 끝나자마자!
[서도희|stern] 실습이 와 줬네요. 상철 씨, 관제석으로. 하린 씨는 옆에서 노래 2절 외워요.
@drill R-2-06

@bg bg_hanbit_center
@hide all
@day 4월 1일 (화) 14:20 · 한빛센터
@show orpheia explain center
[오르페이아|explain] 주인님, 오늘의 1절 복습! 궤도회로 장애로 출발신호기가 안 켜져요. 그런데 CTC 화면도 보이고 무전도 돼요. 그럼?
[신상철] 화면이 보이면 지령식.
[오르페이아|smile] 딩동댕! 그리고 전동열차는 45km/h 이하예요♪
@alarm 한빛선 윤슬~고요 · 궤도회로 장애, 출발신호 불가
@show harin surprised left
[유하린|surprised] 또?! 그리고 오늘 만우절이야! 거짓말이지?!
[오르페이아|worry] 거짓말이면 좋겠는데, 진짜예요.
@drill R-2-09

@bg bg_hanbit_center
@hide all
@day 4월 2일 (수) 09:50 · 한빛센터
@show harin neutral left
[유하린|neutral] 오늘은 2절이다. 화면이 꺼지면 통신식~
@show orpheia smile right
[오르페이아|smile] 역장님끼리 전화로 확인~
대형 표시반의 한쪽 구역이 갑자기 회색으로 꺼진다. 열차 표시도, 신호 표시도 사라진다.
[신상철] ……화면이 꺼졌네.
[유하린|surprised] 내가 노래 불러서?!
@alarm 한빛선 봄내~청솔 · CTC 표시 불가
[오르페이아|explain] 화면이 안 보이면 지령식은 못 써요! 주인님, 통신식이에요!
@drill R-2-10

@bg bg_study_room
@hide all
@phone on
@day 4월 2일 (수) 22:30 · 합숙 스터디룸
@show harin pout left
[유하린|pout] 나 이제 노래 부르기 무서워. 3절 부르면 단선 구간에서 뭐 터질 것 같아.
@show orpheia pout right
[오르페이아|pout] 노래 탓이 아니에요. 순서상 원래 그 차례였던 거예요.
[신상철] 그게 더 무서운데.
@show instructor coffee center
[서도희|coffee] 그럼 오늘은 조용히 지도표 그리는 연습이나 해요. 운전허가증을 직접 그려 보면 왜 순서를 바꿀 때 말소하는지 알게 돼요.
[유하린|neutral] 지도표를 그려요? 손으로?
[서도희] 손으로 그려야 머리에 남아요. 수첩처럼.
늦은 밤, 셋은 화이트보드 앞에서 서툰 지도표를 그렸다. 하린의 지도표에는 열차 그림이 하나 더 그려져 있었다.
[오르페이아|smile] 하린 씨, 지도표에 열차 그림은 없어도 돼요.
[유하린|smile] 있으면 귀엽잖아.

@bg bg_hanbit_center
@hide all
@phone off
@day 4월 3일 (목) 11:40 · 한빛센터
@show orpheia explain center
[오르페이아|explain] 주인님, 3절이에요. 하나뿐인 선로엔—
[신상철] 지도통신식. 지도표 없으면 못 달려.
[오르페이아|smile] 그리고 순서가 바뀌면, 통행증을 찢고 새로!
@alarm 한빛선 달내~모래내 · 일시 단선운전 중 CTC 장애
@show harin surprised left
[유하린|surprised] 3절은 안 불렀는데 또?!
[오르페이아|shy] 제가 불렀어요……
@drill R-2-11

@bg bg_hanbit_center
@hide all
@day 4월 4일 (금) 16:15 · 한빛센터
@show instructor neutral right
[서도희] 오늘은 병용취급이에요. 노래에 없는 거.
@show orpheia pout center
[오르페이아|pout] 4절을 아직 못 만들었어요……
[서도희|smile] 그럼 상철 씨가 만들어 봐요.
[신상철] 제가요? ……음. 「정방향은 신호대로, 역방향은 지령식~」?
[오르페이아|surprised] 주인님! 박자가 맞아요! 작곡 재능이 있어요!
[서도희|coffee] 연결선은요?
[신상철] 「시흥·대전북만 지령식~ 나머지는 신호 따라~」
@show harin excited left
[유하린|excited] 상철이 천재다!
@alarm 한빛선 솔숲~해든 · 하선 장애로 상선 양방향 운행
[유하린|surprised] 그리고 상철이 노래도 소환한다!
[신상철] 나까지?!
@drill R-2-12

@bg bg_hanbit_center
@hide all
@day 4월 7일 (월) 08:20 · 한빛센터
주말이 지나고 월요일. 합숙의 마지막 주제는 수신호였다.
@show orpheia explain center
[오르페이아|explain] 수신호는 노래보다 숫자예요. 「진로 확인 → 화면 확인 → 승인」, 그리고 생략 승인 열차는 25로 살금살금!
@show harin neutral left
[유하린|neutral] 장내신호기가 고장 나서 정지신호만 나오면, 역장님이 깃발로 대신 말해 주는 거지?
[오르페이아|smile] 맞아요. 신호기가 침묵할 때, 사람이 신호가 되는 거예요.
@alarm 한빛선 여울역 · 하선 장내신호기 고장, 1702 접근
[유하린|surprised] 또?! 설명 끝나자마자!
@drill R-2-17

@bg bg_hanbit_center
@hide all
@day 4월 8일 (화) 19:50 · 한빛센터
@show orpheia explain center
[오르페이아|explain] 합숙 마지막 퀴즈! 자동폐색신호기 정지신호 앞에 열차가 멈췄어요. 승인번호를 받은 첫 열차는 몇 km/h?
@choice
> 25km/h 이하 -> s_ok {study+1}
> 45km/h 이하 -> s_45
> 15km/h 이하 -> s_15
@label s_ok
[신상철] 25. 승인번호 못 받으면 일단정차 후 15. 다음 열차는 45.
[오르페이아|smile] 「15·25·45」! 합숙 졸업이에요, 주인님♪
@jump s_after
@label s_45
[신상철] 45……?
[오르페이아|worry] 45는 그다음 후속열차예요. 승인번호를 받은 첫 열차는 25, 못 받으면 15예요.
@jump s_after
@label s_15
[신상철] 15……?
[오르페이아|worry] 15는 승인번호를 못 받았을 때예요. 받은 첫 열차는 25, 후속은 45. 「15·25·45」!
@label s_after
@show instructor smile right
[서도희|smile] 합숙 끝. 다들 고생했어요. 오늘은 일찍—
@alarm 한빛선 가람~나래 하선 · 1234호 자동폐색신호기 정지신호
[서도희|stern] ……졸업 시험이네요.
[유하린|surprised] 교관님, 방금 「일찍」이라고 하셨잖아요!
[서도희|coffee] 그러니까 미리 말해 두는 게 중요해요.
@drill R-2-19

@bg bg_hanbit_dorm
@hide all
@phone on
@day 4월 8일 (화) 23:30 · 파견 숙소
@show orpheia neutral center
[오르페이아] 주인님. 이번 주에 신호가 일곱 번 침묵했어요.
[신상철] 그리고 일곱 번 다 말로 열차를 움직였지.
[오르페이아|smile] 네. 「관제사는 말로 열차를 움직이는 사람이다」— 주인님 면접 때 들은 말이었죠?
[신상철] 그걸 어떻게 알아?
[오르페이아|shy] 주인님 수첩 첫 장 맨 위에 적혀 있잖아요. 카메라로 비춰 주셨을 때 읽었어요.
[신상철] 거긴 맨 윗줄이라 아무도 안 볼 줄 알았는데.
[오르페이아|smile] 그리고 하나 더 고백하면요. 첫날 관제실에서 전원 넣기 전에, 주인님이 「와……」 하셨죠. 대기 모드였던 제가 처음 들은 소리가 그거였어요.
[오르페이아|shy] 그다음이 「네? 잠깐, 지금 뭐라고」였고요. 그래서 주인님이 주인님이 된 거예요.
[신상철] ……
[오르페이아|neutral] 다음 주에 지안 씨가 오세요. 4월에 같이 듣기로 한 대답, 그때 할게요.
@end
`);
