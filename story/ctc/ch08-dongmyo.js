VN.chapter('ch07b','제8장','뒤집히는 정답',`
@chapter 제8장|뒤집히는 정답
@bg bg_training_lobby
@day 3월 16일 (월) 08:40 · 교육장 로비
시험까지 이틀. 로비 게시판에 실기시험 시간표가 붙었다.
@show harin pout left
[유하린|pout] 상철아, 나 주말 내내 꿈에서 무전했어. 「수신 이상!」 하고 깼더니 엄마가 「뭐가 이상한데」 하더라.
[신상철] 나는 꿈에서 LS가 나왔어.
[유하린] 무슨 역?
[신상철] 상1선. 아무것도 없는.
[유하린|smile] ……그건 좋은 꿈이네.
@phone on
@show orpheia smile right
[오르페이아|smile] 주인님, 오늘이 시험 전 마지막 실습이래요. 교수님이 「가장 긴 대본」이라고 하셨어요.
[신상철] 긴 건 괜찮아. 어려운 게 문제지.
[오르페이아|shy] ……둘 다래요.
@phone off
@hide all

@bg bg_training_room
@day 09:00 · 관제 실습실
@show instructor neutral center
[서도희] 자리에. 오늘은 동묘앞역, 지하 구간이에요. 7장처럼 충돌이에요.
@show jian neutral right
[류지안] 7장과 같으면, 앞 열차는 회송, 뒤 열차는 구원. 역 사이 승객은 구원 연결 뒤에 역까지.
[서도희] 맞아요. 지난주에는 그게 정답이었어요.
[서도희|stern] ……오늘은 그 정답을 의심해 보세요. 사고는 대본대로 일어나지 않아요. 상황이 하나 바뀌면, 정답이 오답이 돼요.
@show harin neutral left
[유하린] 교수님, 그 말 무서워요.
[서도희|coffee] 무섭게 하려고 한 말이에요.
@show orpheia explain center
[오르페이아|explain] 주인님, 오늘은 하선을 단선지령식으로 써요. 시청역 침수 때는 상선이었죠. 이번엔 반대예요. 그리고 사고 역 옆을 지나가요.
@hide all
@alarm 동묘앞역 · 열차충돌
@ctc ch08-dongmyo
@show instructor neutral right
@if ctcRank >= 3 -> good
[서도희] 되감은 곳이 「구원을 기다리게 한 곳」이었다면, 그게 오늘의 전부예요. 탈선이면 걸어서 내린다. 다시 봐요.
@jump after
@label good
[서도희|smile] 좋아요. 정답이 뒤집힌 순간을 알아챘네요.
@label after
[서도희] 7장의 정답을 외운 사람은 오늘 틀려요. 왜 그게 정답인지 안 사람은 오늘도 맞아요. 시험도 그래요.
@hide all

@bg bg_cafeteria
@day 12:30 · 교육장 구내식당
@show harin neutral left
@show jian neutral right
[유하린] ……탈선, 나 기관사 때 한 번 봤어. 차량기지에서. 아주 천천히 들어가다가, 분기기에서 바퀴 하나가 툭.
[류지안] 다친 사람은요?
[유하린] 없었어. 시속 10킬로미터였으니까. 근데 그거 다시 레일에 올리는 데 다섯 시간 걸렸어. 사람들이 노란 상자 같은 걸로 60톤을 1센티미터씩 들어 올리더라.
[신상철] 재크키트.
[유하린|surprised] 오, 오늘 배웠다고 바로 쓰네.
[유하린|smile] 그때 생각했어. 열차는 레일 위에 있을 때만 열차구나. 레일에서 내려오면 그냥 쇳덩어리구나.
[류지안] 그래서 승객도 걸어서 내리는 거군요. 쇳덩어리는 누구도 데려다주지 않으니까.
[류지안|smile] ……기록해 둘게요. 「3월 16일, 유하린, 철학자가 됨」.
[유하린|pout] 그건 기록하지 마!

@bg bg_training_room_night
@hide all
@day 20:10 · 실습실 앞 복도
@bgm bgm_heavy
@show instructor neutral center
[서도희] 신상철 씨. 잠깐.
[서도희] 그 모터카 운전원분께 연락했어요. 십 년 만에.
[신상철] ……뭐라고 하셨어요?
[서도희] 처음엔 말이 없었어요. 그리고 이렇게 물었어요. 「요즘 관제사들은, 번호 없는 차도 기억합니까.」
[서도희] 대답을 못 했어요. 모레 대답할 수 있으면 좋겠어요.
@hide all
@phone on
@show orpheia serious center
[오르페이아|serious] ……주인님.
[신상철] 응.
[오르페이아] 오늘 실습에서 정답이 뒤집히는 걸 봤잖아요. 저, 조금 무서워졌어요. 시험에서도 뭔가 바뀌면 어떡하죠.
[신상철] 바뀌면, 왜 그게 정답이었는지 생각하면 돼. 오늘처럼.
[오르페이아|shy] ……주인님이 저보다 더 교수님 같아요.
[신상철] 그건 칭찬이야?
[오르페이아|smile] 반쯤요. 후후.
@add affection 1
@phone off
@end
`);
