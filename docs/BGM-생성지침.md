# 오르페이아 BGM — Suno 생성 지침

게임에 들어갈 배경음악 13곡과 보컬곡 2곡입니다. 각 곡의 **Style**(스타일 칸)과 **Lyrics**(가사 칸)를 그대로 복사해 Suno에 넣으면 됩니다.

## 넣는 방법

1. Suno에서 곡을 만들고, 마음에 드는 버전을 **MP3로 다운로드**합니다.
2. 파일 이름을 아래 표의 **파일명** 그대로 바꿔서 `assets/bgm/`에 올립니다. 예: `assets/bgm/bgm_title.mp3`
3. 끝. 게임이 장면 배경을 보고 알아서 틀어 줍니다. 없는 곡은 조용히 넘어갑니다.

## 생성 요령

- **BGM(13곡)**: Suno의 **Instrumental** 스위치를 켜고, Lyrics 칸은 비우거나 `[Instrumental]`만 넣습니다.
- **보컬곡(2곡)**: Instrumental을 끄고 아래 가사를 그대로 넣습니다. 한국어 가사가 어색하게 들리면 몇 번 다시 생성해 가장 발음이 깨끗한 버전을 고릅니다.
- 게임에서는 곡을 **반복 재생**합니다. 끝부분이 갑자기 끊기기보다 페이드아웃되거나 처음과 비슷하게 끝나는 버전을 고르면 이음새가 자연스럽습니다.
- 대사를 읽는 동안 흐르는 곡이라, 너무 화려한 리드 멜로디보다 **배경에 깔리는 버전**이 좋습니다(특히 일상·야간 곡).
- 2분 이상이면 충분합니다. 용량을 위해 MP3 192kbps 정도면 됩니다.

## 곡 목록

| 파일명 | 곡 | 자동으로 나오는 곳 |
|---|---|---|
| `bgm_title.mp3` | 메인 테마 | 타이틀 화면 |
| `bgm_daily.mp3` | 관제센터의 하루 | 관제실·로비·구내식당·개발팀 작업실 |
| `bgm_night_shift.mp3` | 야간 근무 | 휴게실·파견 숙소·합숙 스터디룸 |
| `bgm_outing.mp3` | 주말 외출 | 강변·벚꽃길·차량기지·열차 창가·붕어빵 가게·국밥집·소방 훈련장 |
| `bgm_orpheia.mp3` | 오르페이아의 테마 | 옥상 장면 (센터 옥상·한빛센터 옥상) |
| `bgm_heavy.mp3` | 숫자 뒤의 사람들 | 교관의 수첩, 재부팅 순간, 초기화 통보 장면 |
| `bgm_hanbit.mp3` | 한빛 광역관제센터 | 한빛센터 관제실 (2부) |
| `bgm_festival.mp3` | 여름 축제 | 강변 여름 축제 |
| `bgm_winter.mp3` | 첫눈과 송년회 | 첫눈 퇴근길·송년회 고깃집 |
| `bgm_emergency.mp3` | 비상호출 | 모든 비상호출과 교신 훈련 (회상 연습 포함) |
| `bgm_forecast.mp3` | 0.3초 뒤의 최악 | 오답 예측 엔딩 (BAD END 화면) |
| `bgm_exam.mp3` | 실기 평가 | 최종장 평가장·평가 중 교신 |
| `bgm_result.mp3` | 결과 발표 | 합격 발표·노멀 엔딩 |
| `song_block.mp3` | 폐색방식의 노래 (보컬) | 9장 오르페이아가 노래하는 장면 |
| `song_ending.mp3` | 뒤돌아보지 않는 노래 (주제가) | 트루 엔딩·스태프 크레딧 |

---

## 1. 메인 테마 — `bgm_title.mp3`

**Title**: Orpheia Main Theme

**Style**
```text
anime visual novel title theme, instrumental, gentle piano lead with soft strings and light synth pads, subtle music box and glockenspiel sparkles, hopeful and slightly nostalgic, night city train lights mood, mid tempo 92 bpm, emotional build in second half, clean mix, loopable ending
```

**Lyrics**
```text
[Instrumental]
```

## 2. 관제센터의 하루 — `bgm_daily.mp3`

**Title**: A Day at Control Center

**Style**
```text
lighthearted slice of life anime BGM, instrumental, pizzicato strings, bouncy acoustic piano, light marimba, soft brushed drums, playful and warm office comedy mood, 112 bpm, unobtrusive background for dialogue, loopable
```

**Lyrics**
```text
[Instrumental]
```

## 3. 야간 근무 — `bgm_night_shift.mp3`

**Title**: Night Shift

**Style**
```text
calm lo-fi night ambience, instrumental, mellow electric piano, soft vinyl texture, warm bass, gentle rim shots, quiet vending machine hum feeling, late night city, relaxed and intimate, 78 bpm, background music for conversation, loopable
```

**Lyrics**
```text
[Instrumental]
```

## 4. 주말 외출 — `bgm_outing.mp3`

**Title**: Weekend Outing

**Style**
```text
bright city pop instrumental, cheerful acoustic guitar strumming, clean electric guitar licks, light synth brass, upbeat bass, spring breeze and riverside bicycle feeling, 120 bpm, sunny and carefree anime opening vibe without vocals, loopable
```

**Lyrics**
```text
[Instrumental]
```

## 5. 오르페이아의 테마 — `bgm_orpheia.mp3`

옥상에서 오르페이아가 서툰 피아노를 들려주는 그 곡입니다. 9장 「폐색방식의 노래」, 주제가와 같은 멜로디 계열이면 더 좋습니다.

**Title**: Orpheia's Theme

**Style**
```text
solo piano ballad, instrumental, tender and bittersweet melody, sparse right hand melody over soft arpeggios, light reverb, night rooftop with distant train lights, memory and promise, slow 70 bpm, delicate dynamics, anime emotional scene, loopable
```

**Lyrics**
```text
[Instrumental]
```

## 6. 숫자 뒤의 사람들 — `bgm_heavy.mp3`

**Title**: People Behind the Numbers

**Style**
```text
somber ambient strings, instrumental, low cello sustain, soft piano notes with long pauses, quiet and serious, grief and resolve, no percussion, 60 bpm, cinematic but restrained, background for serious dialogue, loopable
```

**Lyrics**
```text
[Instrumental]
```

## 7. 한빛 광역관제센터 — `bgm_hanbit.mp3`

**Title**: Hanbit Control

**Style**
```text
modern orchestral electronic hybrid, instrumental, steady pulsing synth bass, light staccato strings, soft taiko-like percussion, wide spacious pads, focused and determined professional mood, large control room with huge display wall, 104 bpm, building confidence, loopable
```

**Lyrics**
```text
[Instrumental]
```

## 8. 여름 축제 — `bgm_festival.mp3`

**Title**: Summer Festival by the River

**Style**
```text
japanese summer festival anime BGM, instrumental, shinobue flute melody, light taiko, shamisen accents, warm strings, nostalgic and joyful night festival with lanterns and fireworks, 100 bpm, gentle and sentimental bridge, loopable
```

**Lyrics**
```text
[Instrumental]
```

## 9. 첫눈과 송년회 — `bgm_winter.mp3`

**Title**: First Snow

**Style**
```text
cozy winter christmas anime BGM, instrumental, sleigh bells, celesta, warm piano, soft strings and pizzicato, snowy street lights and year end party warmth, 96 bpm, gentle and heartwarming, loopable
```

**Lyrics**
```text
[Instrumental]
```

## 10. 비상호출 — `bgm_emergency.mp3`

교신 훈련 내내 깔리는 곡입니다. 긴장감은 있되, 대사를 읽고 판단할 수 있게 너무 시끄럽지 않아야 합니다.

**Title**: Emergency Call

**Style**
```text
tense dispatch thriller BGM, instrumental, urgent ostinato strings, ticking clock percussion, low pulsing synth bass, subtle radio static texture, alarm-like motif used sparingly, focused not chaotic, 128 bpm, suitable under dialogue for decision making, loopable
```

**Lyrics**
```text
[Instrumental]
```

## 11. 0.3초 뒤의 최악 — `bgm_forecast.mp3`

오답 엔딩은 「어이없을 만큼 구체적인 최악」이라 반쯤 코미디입니다. 비장하지만 우스꽝스러운 느낌이 어울립니다.

**Title**: Worst Case in 0.3 Seconds

**Style**
```text
tragicomic anime bad ending BGM, instrumental, melodramatic orchestra hits, mournful oboe, out of tune toy piano, slow sad trombone glissando accents, over the top despair played for laughs, 84 bpm, dramatic but funny, loopable
```

**Lyrics**
```text
[Instrumental]
```

## 12. 실기 평가 — `bgm_exam.mp3`

**Title**: Practical Examination

**Style**
```text
minimal tense exam BGM, instrumental, quiet repeating piano motif, soft clock ticking, thin high strings, deep sub bass swells, lonely and focused, no assistance, holding breath, 90 bpm, sparse and cold, loopable
```

**Lyrics**
```text
[Instrumental]
```

## 13. 결과 발표 — `bgm_result.mp3`

**Title**: Results

**Style**
```text
uplifting anime emotional climax BGM, instrumental, piano intro growing into full strings and warm horns, triumphant but gentle, relief and joy after long effort, morning light, 88 bpm, heartfelt crescendo, loopable ending
```

**Lyrics**
```text
[Instrumental]
```

---

## 14. 폐색방식의 노래 (보컬) — `song_block.mp3`

9장에서 오르페이아가 폐색방식을 외우라고 만든 노래입니다. 1절은 오르페이아가 쓰고, 4절(Verse 2)은 상철이 지은 가사예요. 가사는 교재 내용과 맞춰 두었습니다.

**Title**: 폐색방식의 노래

**Style**
```text
cute j-pop idol song, bright female vocal, playful kids learning song energy, bouncy piano and synth, handclaps, glockenspiel, catchy simple melody easy to memorize, 132 bpm, korean lyrics, cheerful
```

**Lyrics**
```text
[Intro]
신호가 침묵하면~ 관제사의 말이 신호!

[Verse 1]
화면이 보이면 지령식
관제가 무전으로 직접
화면이 꺼지면 통신식
역장님끼리 전화로 확인

[Pre-Chorus]
복선은 지령, 통신 둘
단선은 지령, 지도통신, 지도 셋

[Chorus]
하나뿐인 선로엔 지도통신식
지도표 없으면 못 달려요
그래도 안 되면 전령법
한 구간에 전령자는 딱 한 명

[Verse 2]
정방향은 신호대로
역방향은 지령식
시흥, 대전북만 지령식
나머지는 신호 따라

[Bridge]
정지신호 앞에 멈췄다면
번호 못 받으면 열다섯
번호 받으면 스물다섯
다음 열차는 마흔다섯

[Chorus]
하나뿐인 선로엔 지도통신식
지도표 없으면 못 달려요
그래도 안 되면 전령법
한 구간에 전령자는 딱 한 명

[Outro]
들은 건 복창하고
한 일은 기록해요
```

## 15. 뒤돌아보지 않는 노래 (주제가) — `song_ending.mp3`

이야기 전체를 담은 주제가입니다. 트루 엔딩의 봄 장면과 스태프 크레딧에서 흐릅니다.

**Title**: 뒤돌아보지 않는 노래

**Style**
```text
emotional anime ending theme, j-pop ballad, clear gentle female vocal, piano intro, strings and soft band build, heartfelt and hopeful, spring morning after a long journey, 84 bpm, powerful final chorus then soft piano outro, korean lyrics
```

**Lyrics**
```text
[Intro]
(piano)

[Verse 1]
처음 들은 목소리는
떨리던 "와" 한마디
그날부터 나는 너의
뒤를 지키는 사람

[Pre-Chorus]
노래 하나로 길을 연
옛날이야기 속 그 사람은
마지막에 뒤를 돌아봐
모든 걸 잃었대

[Chorus]
그러니 너는 앞만 봐
망설이지 말고 말해 줘
0.3초 뒤의 미래는
내가 대신 볼게
들은 건 복창하고
한 일은 기록할게
뒤돌아보지 않는 노래
너에게 닿을 때까지

[Verse 2]
멈춰 선 열차를 데리러
너는 어둠 속을 달려
움직이지 말고 기다려
그 자리에서, 나를

[Pre-Chorus]
숫자 뒤에 사람이 있어
기록 속에 약속이 있어
다음엔 꼭, 다음엔 꼭
작게 되뇌던 밤

[Chorus]
이번엔 내가 기다릴게
구원을 부른 열차처럼
뒤돌아보지 않아도
너는 반드시 오니까

[Bridge]
벚꽃이 지는 고가 아래
다시 처음 뵙겠습니다
이번엔 아무것도
잃어버리지 않았어

[Final Chorus]
그러니 우리 앞만 봐
지령을 보내 줘, 망설이지 마
0.3초 뒤의 미래도
이젠 무섭지 않아
들은 건 복창하고
한 일은 기록할게
뒤돌아보지 않는 노래
오늘도 무전 너머로

[Outro]
(soft piano)
주인님
```

---

## 대본에서 곡을 직접 고르고 싶을 때

장면 배경과 다른 분위기가 필요하면 대본에 한 줄을 넣습니다. 다음 배경이 바뀔 때까지 유지됩니다.

```text
@bgm bgm_heavy      ← 이 곡으로 바꾸기
@bgm off            ← 음악 끄기
@bgm auto           ← 배경에 맞는 곡으로 되돌리기
```

설정 화면에서 음악 볼륨과 음악 끄기를 조절할 수 있습니다.
