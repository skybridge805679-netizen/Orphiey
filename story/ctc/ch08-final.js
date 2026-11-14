VN.chapter('ch08','최종장','상1선',`
@chapter 최종장|상1선
@bg bg_cherry_street
@day 3월 18일 (수) 07:50 · 출근길
벚나무 가지 끝이 붉다. 아직 꽃은 없다.
@phone on
@show orpheia neutral center
[오르페이아] 주인님. 어젯밤엔 무전이 안 들렸어요. 처음이에요.
[신상철] 왜일까.
[오르페이아|shy] ……기다리고 있는 것 같아요. 오늘을.
[오르페이아|smile] 퀴즈 하나만 낼게요. 마지막이에요. 길을 열기 전에 확인할 것은?
[신상철] 그 길 위에 있는 것. 번호가 없어도.
[오르페이아|excited] 정답이에요♪ ……정답이라서, 조금 울 것 같아요.
[신상철] 시험 전에 울지 마.
[오르페이아|pout] 안 울어요. 프로그램이니까요. ……아마도요.
@phone off
@hide all

@bg bg_exam_hall
@day 09:00 · 실기시험장
@show instructor neutral center
[서도희] 실기시험이에요. 한 명씩 해요. 첫 번째, 신상철 씨.
@show harin smile left
@show jian smile right
[유하린|smile] 상철아, 기관사는 나야. 내가 다 받아 줄게.
[류지안|smile] 역도 저예요. 전부 기록해 둘게요. 잘한 것만.
[유하린] 지안 씨 그건 기록이 아니라 편집이야.
@hide all
@show instructor neutral center
[서도희|stern] 장소는 가산디지털단지역. 3장과 같아요. 다른 게 하나 있어요. 그건 직접 보세요.
[서도희] ……시작해요.
@hide all
@alarm 실기시험 · 가산디지털단지역
@ctc final-exam
@if ctcRank >= 3 -> trueEnd
@jump normalEnd

@label trueEnd
@add trueEnd 1
@bg bg_training_room_night
@day 21:40 · 아무도 없는 실습실
@bgm bgm_orpheia
불 꺼진 실습실. LS 표시반만 켜져 있다. 상철과 서도희 교수가 그 앞에 서 있다.
@phone on
@show orpheia shy center
[오르페이아|shy] ……주인님, 교수님. 들려요. 그 무전이에요. 그런데 이번엔 끝까지예요.
잡음 섞인 무전이 흘렀다. 「철도관제, 모터카 이상. 상1선입니다. 작업 마치고 철수 중.」
그리고 대답. 이번에는 낯선 목소리였다. 아니, 아주 익숙한 목소리였다.
「모터카, 상1선 철수 중. 현재 위치 알려 주세요. 철수 완료되면 바로 통보 바랍니다.」
[신상철] ……내 목소리.
[오르페이아|smile] 오늘 시험에서 주인님이 하신 무전이에요. 제 안에서 그 녹음 뒤에 이어 붙었어요. 저절로요.
LS의 가산디지털단지역 상1선에 열번창 하나가 켜졌다. 이번에는 「???」가 아니었다. 「MC01」.
열번창은 천천히 구로역 쪽으로 움직였고, 측선으로 들어가 조용히 꺼졌다.
@show instructor smile right
[서도희] …….
[서도희|smile] 십 년 걸렸네요. 그 무전에 끝이 붙는 데.
[서도희] 고마워요, 신상철 씨. 그리고 오르페이아. 당신은 제가 만들다 만 시나리오가 아니라, 끝까지 간 시나리오예요.
[오르페이아|shy] ……교수님. 그 운전원분께도 이 끝을 들려 드릴 수 있을까요.
[서도희] 연락해 볼게요. 이번에는 제가 먼저.
@hide all
@bg bg_cherry_street
@day 3월 27일 (금) 18:30 · 수료식이 끝난 퇴근길
벚꽃이 피었다. 수료증이 든 봉투가 가방 안에서 바스락거린다.
@bgm bgm_result
@show harin smile left
@show jian smile right
[유하린|smile] 다음 주부터 진짜 관제실이다! 상철아, 나 다른 센터로 가도 무전으로는 매일 만나자.
[신상철] 하린이는 기관사 배역이 그리울걸.
[유하린|pout] 일곱 명분 성대는 이제 반납이야.
[류지안|smile] 마지막으로 기록해 둘게요. 「3월 27일, 우리 셋, 다 같이 수료」. 이건 지우지 않을 거예요.
@hide all
@phone on
@show orpheia smile center
[오르페이아|smile] 주인님. 저 이제 교육용 프로그램은 졸업이래요. 교수님이 그러셨어요.
[신상철] 그럼 어떻게 돼?
[오르페이아|shy] ……그건 주인님이 정해 주세요. 저는, 주인님 휴대폰에 계속 있고 싶어요. 첫 관제실 출근길에도, 야간 근무 끝나고 돌아오는 길에도.
[신상철] 퀴즈는 줄여.
[오르페이아|excited] 하루에 한 문제로 줄일게요! ……두 문제.
[신상철] ……세 문제까지.
[오르페이아|smile] 후후. 그 말, 기록해 뒀어요. 지우지 않을게요, 주인님.
@add affection 2
@phone off
@clear
@end

@label normalEnd
@bg bg_training_room
@day 12:00 · 관제 실습실
@show instructor neutral center
[서도희] 합격이에요. 수고했어요.
[서도희] ……상1선은, 조금 늦었네요. 실전이었다면 기관사가 비상제동을 걸었을 거예요.
[신상철] 죄송합니다.
[서도희] 사과할 일 아니에요. 그걸 실습에서 겪은 사람은, 실전에서 잊지 않아요. 저는 실전에서 겪었어요.
@phone on
@show orpheia shy left
[오르페이아|shy] ……교수님. 그 무전, 오늘 밤에도 재생될까요.
[서도희] 아마도요. 끝이 아직 안 붙었으니까. 언제든 다시 해 봐요. 부록에 시험이 남아 있어요.
@hide all
@bg bg_cherry_street
@day 3월 27일 (금) 18:30 · 수료식이 끝난 퇴근길
벚꽃이 피었다.
@bgm bgm_result
@show orpheia smile center
[오르페이아|smile] 수료 축하드려요, 주인님. 저는 계속 여기 있을게요. 언젠가 그 무전에 끝을 붙여 줄 때까지요.
[신상철] 금방 붙일게.
[오르페이아|excited] 기대할게요♪
@add affection 1
@phone off
@clear
@end
`);
