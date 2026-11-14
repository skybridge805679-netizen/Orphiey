# 오르페이아 BGM — 리부트 버전 Suno 프롬프트

리부트 스토리(교육장 · 비상시조치 실습)에서 실제로 쓰이는 곡만 추렸습니다. 곡 11개, 전부 **Instrumental**입니다. 예전 지침서(`docs/BGM-생성지침.md`)의 한빛센터·축제·송년회·폐색방식의 노래는 리부트에서 쓰지 않습니다.

## 넣는 방법

1. Suno에서 **Instrumental** 스위치를 켜고, Lyrics 칸은 비우거나 `[Instrumental]`만 넣습니다.
2. 아래 **Style**을 그대로 붙여 넣습니다. Style 칸 글자 수 제한 때문에 잘리면 뒤쪽 키워드부터 지웁니다.
3. 마음에 드는 버전을 MP3로 받아 **파일명**을 아래 표대로 바꿔 `assets/bgm/`에 올립니다. 없는 곡은 조용히 건너뜁니다.
4. 곡은 반복 재생됩니다. 끝이 갑자기 끊기는 버전보다 페이드아웃되거나 처음과 비슷하게 끝나는 버전이 이음새가 자연스럽습니다.
5. 대사를 읽는 동안 흐르는 곡이라, 튀는 리드 멜로디보다 배경에 깔리는 버전을 고릅니다.

## 곡 목록

| 파일명 | 곡 | 나오는 곳 | 권장 길이 |
|---|---|---|---|
| `bgm_title.mp3` | 메인 테마 | 타이틀 화면 | 2분+ |
| `bgm_daily.mp3` | 교육장의 하루 | 실습실·로비·구내식당 (기본 곡) | 2분+ |
| `bgm_night_shift.mp3` | 불 꺼진 실습실 | 밤 장면(`bg_training_room_night`) | 2분+ |
| `bgm_outing.mp3` | 출근길 전동차 | 출근길·퇴근길 장면 | 2분+ |
| `bgm_orpheia.mp3` | 오르페이아의 테마 | 밤 자취방·최종장 TRUE END 밤 장면 | 2분+ |
| `bgm_heavy.mp3` | 십 년 전 | 7장 서도희의 고백, 8장 복도 장면 | 2분+ |
| `bgm_emergency.mp3` | 비상호출 | **모든 비상 실습** (한 번에 7~10분 흐름) | **3~4분** |
| `bgm_challenge.mp3` | 도전 모드 | 도전 모드 실습 | 3분+ |
| `bgm_forecast.mp3` | 0.3초 뒤의 최악 | 오답 결말이 뜰 때(예측 연산) | 1~2분 |
| `bgm_exam.mp3` | 실기시험 | 최종장 실기시험 실습 | 3분+ |
| `bgm_result.mp3` | 수료 | 최종장 수료·엔딩 장면 | 2분+ |

> `bgm_emergency`는 플레이어가 가장 오래 듣는 곡입니다(실습 한 번이 7~10분). 큰 클라이맥스 없이 일정한 긴장감으로 이어지는 곡이어야 지치지 않습니다. 3~4분짜리를 만들고, 피곤하면 Suno의 Extend로 늘립니다.

---

## 1. `bgm_title.mp3` — 메인 테마

```text
anime visual novel title theme, instrumental, gentle piano lead with soft strings and light synth pads, subtle music box and glockenspiel sparkles, faint radio pulse and distant train rhythm underneath, hopeful and slightly nostalgic, early spring night city lights, 96 bpm
```

## 2. `bgm_daily.mp3` — 교육장의 하루

```text
lighthearted slice of life anime BGM, instrumental, pizzicato strings, bouncy acoustic piano, light marimba, soft brushed drums, playful and warm training academy comedy mood, 108 bpm, unobtrusive background for dialogue, loopable
```

## 3. `bgm_night_shift.mp3` — 불 꺼진 실습실

```text
calm lo-fi night ambience, instrumental, mellow electric piano, soft vinyl texture, warm bass, gentle rim shots, empty training room lit only by monitors, a faint uneasy sustained synth underneath, quiet and intimate, 76 bpm, background for conversation, loopable
```

## 4. `bgm_outing.mp3` — 출근길 전동차

```text
bright morning commute anime BGM, instrumental, clean electric guitar, light acoustic strumming, soft synth brass, steady train-rhythm hi-hats, cheerful but sleepy morning energy, spring breeze through a train window, 112 bpm, unobtrusive, loopable
```

## 5. `bgm_orpheia.mp3` — 오르페이아의 테마

이름의 유래(오르페우스)를 살려, 하프 아르페지오를 넣었습니다.

```text
solo piano ballad, instrumental, tender and bittersweet melody, sparse right hand over soft harp arpeggios like a lyre, a faint music box layer, light reverb, night room lit by a phone screen, memory and promise, slow 68 bpm, delicate dynamics
```

## 6. `bgm_heavy.mp3` — 십 년 전

```text
somber ambient strings, instrumental, low cello sustain, soft piano notes with long pauses, quiet and serious, regret and resolve, no percussion, 58 bpm, cinematic but restrained, background for serious dialogue, loopable
```

## 7. `bgm_emergency.mp3` — 비상호출

```text
tense dispatch thriller BGM, instrumental, steady ostinato strings, ticking clock percussion, low pulsing synth bass, subtle radio static texture, alarm-like motif used sparingly, focused not chaotic, 120 bpm, constant energy with no big climax, designed to loop for ten minutes
```

## 8. `bgm_challenge.mp3` — 도전 모드

비상호출보다 한 단계 빠르고 거칩니다. 어떤 상황 변경이 튀어나올지 모르는 새벽 관제실 느낌입니다.

```text
relentless high pressure thriller BGM, instrumental, fast driving staccato strings, aggressive pulsing synth bass, punchy industrial percussion, tension risers, radio glitch and alarm stabs, sleepless control room at 3am, 148 bpm, intense but loopable, melody kept minimal
```

## 9. `bgm_forecast.mp3` — 0.3초 뒤의 최악

오답 결말은 「어이없을 만큼 구체적인 최악」이라 반쯤 코미디입니다. 비장하지만 우스꽝스럽게.

```text
tragicomic anime bad ending BGM, instrumental, melodramatic orchestra hits, mournful oboe, out of tune toy piano, slow sad trombone glissando accents, over the top despair played for laughs, 84 bpm, dramatic but funny, loopable
```

## 10. `bgm_exam.mp3` — 실기시험

```text
minimal tense exam BGM, instrumental, quiet repeating piano motif, soft clock ticking, thin high strings, deep sub bass swells, lonely and focused, holding breath, 90 bpm, sparse and cold, loopable
```

## 11. `bgm_result.mp3` — 수료

```text
uplifting anime emotional climax BGM, instrumental, piano intro growing into full strings and warm horns, triumphant but gentle, relief and joy after a long training, spring cherry blossom evening, 88 bpm, heartfelt crescendo, loopable ending
```

---

## 게임 쪽 연결 (이미 되어 있음)

- 밤 실습실 배경은 `bgm_night_shift`, 나머지 교육장 배경은 `bgm_daily`, 출근길·퇴근길은 `bgm_outing`로 자동 연결됩니다.
- 모든 비상 실습은 `bgm_emergency`, 최종장 실기시험은 `bgm_exam`, 도전 모드는 `bgm_challenge`, 오답 결말이 뜰 때는 `bgm_forecast`로 바뀝니다.
- 이야기 대본에서는 `@bgm 곡이름`으로 곡을 지정할 수 있고, 다음 `@bg`가 나오면 자동으로 원래대로 돌아갑니다. 지금 7장·8장의 어두운 장면에 `bgm_heavy`, 밤 자취방·TRUE END 밤 장면에 `bgm_orpheia`, 수료 장면에 `bgm_result`가 지정되어 있습니다.
- 곡 이름만 바꿔 넣으면 되는 구조라, 마음에 안 드는 곡은 같은 파일명으로 덮어쓰면 됩니다.
