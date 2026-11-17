# NovelAI 이미지 생성 — 주인님 기본 세팅과 프롬프트 공부 노트

> 2026-11-17 주인님 지정. 앞으로 게임 비주얼 에셋은 GPT 이미지 대신 **NovelAI Diffusion V5 Full**로 만든다.
> 기계가 읽는 사본: `tools/nai/preset.json`. 토큰은 **GitHub 저장소 시크릿**에만 있다(컨테이너·문서·커밋에 절대 쓰지 않는다).

## 1. 기본 세팅 (주인님 원문 그대로)

| 항목 | 값 |
|---|---|
| 모델 | NovelAI Diffusion **V5 Full** |
| 모드 | **Anime** (기본 모드. 태그 추가 없음. Furry 모드만 `fur dataset,`을 붙인다) |
| Effort | **High** (전체 모델, 모든 설정 가능) |
| 품질 태그 | **Standard** — 프롬프트 끝에 `, very aesthetic, masterpiece, no text`가 자동으로 붙는다 |
| UC 프리셋 | **None** — 아래 UC만 쓴다 |
| Steps | **28** |
| Guidance | **5** |
| Sampler | **Euler Ancestral** (`k_euler_ancestral`) |

**프롬프트 (앞머리, 매번 그대로)**
```
1.5::artist:tsunako::, 0.7::artist:mishima kurone, artist:toosaka asagi, artist:takeshima eku::, year 2026, 0.1::neptune (sereis)::, 0.1::date a live::, {best quality, very aesthetic, best details, highres, amazing quality, high complexity}, -6::artist collaboration::, 
```

**UC (Undesired Content)**
```
worst quality, bad quality, displeasing, very displeasing, lowres, bad anatomy, bad perspective, bad proportions, bad aspect ratio, bad face, long face, bad teeth, bad neck, long neck, bad arm, bad hands, bad ass, bad leg, bad feet, bad reflection, bad shadow, bad link, bad source, wrong hand, wrong feet, missing limb, missing eye, missing tooth, missing ear, missing finger, extra faces, extra eyes, extra eyebrows, extra mouth, extra tongue, extra teeth, extra ears, extra breasts, extra arms, extra hands, extra legs, extra digits, fewer digits, cropped head, cropped torso, cropped shoulders, cropped arms, cropped legs, mutation, deformed, disfigured, unfinished, chromatic aberration, text, error, jpeg artifacts, watermark, scan, scan artifacts, 
```

> ⚠ 확인 필요: `0.1::neptune (sereis)::` — 단부루 태그는 `neptune (series)`다. 오타라면 그 부분은 사실상 무시되는 토큰이 된다. 주인님 원문을 존중해 그대로 두었다.

## 2. 이 세팅을 읽는 법 (공부한 것)

- `1.5::tag::` — 숫자 가중치. `::`로 닫는다. 닫지 않으면 **끝까지** 그 가중치가 걸린다. 0~1은 약화, 1 이상은 강화.
- `-6::artist collaboration::` — **음수 가중치**(V4.5 이상). 「여러 화가 섞인 느낌」을 강하게 밀어낸다. 공식 예시 `-3::hat::`(모자 제거), `-6::simple illustration::`(디테일 증가).
- `{ … }` — 1.05배. 이중 `{{}}` 1.1025배. `[ ]`는 1/1.05.
- 화풍 블록 해석: **tsunako(넵튠 시리즈) 1.5가 주축**, 미시마 쿠로네·토오사카 아사기·타케시마 에쿠 0.7을 섞고, 작품 태그(넵튠·데이트 어 라이브) 0.1로 분위기만 살짝. `year 2026`은 최신 화풍 쪽으로.
- 품질 태그 Standard가 끝에 `no text`를 붙이므로, **글자가 필요한 그림(간판·화면 문구)은 품질 태그를 끄거나** 그 그림만 따로 판단한다. 우리 UC에도 `text`가 있다.
- UC에 `scan artifacts`, `chromatic aberration` 등이 이미 있으므로 공식 Heavy 프리셋을 겹쳐 쓰지 않는다(그래서 프리셋 None).

## 3. V5 프롬프트 규칙 (공식 문서 기준)

- 태그와 자연어 둘 다 된다. 태그는 소문자·쉼표+공백. 영어·일본어 공식 지원.
- 길이 한도: V5 Full 약 1471 토큰(화풍 블록도 포함해서 센다).
- **여러 인물**: 기본 프롬프트에 `2girls` 같은 인원 태그, 캐릭터 칸에는 `girl`/`boy`만(숫자 없이). V5는 최대 22명, 위치는 캔버스 자유 배치(0~1 좌표). 상호작용은 `source#hug`·`target#hug`·`mutual#hug`. 캐릭터 칸이 있으면 `|` 섞기는 꺼진다.
- **투명 배경**: `transparent background`(스탠딩·SD에 유용). 공식 예 `2.1::transparent background::`.
- **비주얼노벨 전용 태그**: `visual novel sprite`(스탠딩), `visual novel cg`(이벤트 CG), `visual novel bg`(배경), `visual novel chibi`, `visual novel art`. 배경은 `high complexity`·`depthness`와 잘 맞는다.
- 그 밖의 V5 태그: `depthness`, `low/medium/high/ultra complexity`, `meta:novel era`, `meta:golden era`.
- 이름 바뀐 태그: `v` → `peace sign`, `|_|` → `bar eyes`.
- 글자 렌더링: 따옴표 안 문자열은 `Text:` 블록으로 바뀐다(우리는 보통 글자 없는 그림).

## 4. API로 옮기면 (비공식 클라이언트 코드 기준 — 첫 실행에서 확인할 것)

NovelAI는 이미지 API 공식 문서를 공개하지 않는다. 아래는 공개 클라이언트(ComfyUI 노드 등) 코드에서 읽은 것이다.

- `POST https://image.novelai.net/ai/generate-image`, 헤더 `Authorization: Bearer <토큰>`, JSON 본문.
- `model`: `nai-diffusion-5-full`(Effort High) / `nai-diffusion-5-full-medium`(Effort Medium은 **별도 모델 ID**, 14스텝·Euler A 고정·UC 변경 불가).
- `parameters`: `width`, `height`, `scale`(=Guidance 5), `sampler: "k_euler_ancestral"`, `steps: 28`, `seed`, `n_samples: 1`, `noise_schedule`(보통 `karras`), `cfg_rescale: 0`, `negative_prompt`, `v4_prompt: {caption:{base_caption, char_captions:[{char_caption, centers:[{x,y}]}]}, use_coords, use_order}`, `v4_negative_prompt`(같은 모양).
- **확인이 필요한 갈림길**: `params_version`(코드마다 4 또는 3), 본문 형식(JSON 또는 multipart), 품질 태그·UC 프리셋 필드(`qualityToggle`/`ucPreset` 등). → 첫 생성 때 `params_version: 4` + JSON으로 보내고, 실패하면 3으로 바꿔 본다. 품질 태그는 **우리가 문자열로 직접 붙인다**(서버 토글에 기대지 않는다).
- 응답: PNG 한 장이 든 ZIP.
- Opus 무료 생성: 1장, 1024×1024 픽셀 수 이하, 28스텝 이하 → 주인님 세팅(28스텝)과 아래 크기는 모두 무료 범위.
- 요청 간격: 너무 붙이면 `429 Concurrent generation is locked`. 한 번에 한 장, 2초 이상 간격.

## 5. 우리 게임용 크기·형식 (제안)

| 용도 | 크기 | 추가 태그 |
|---|---|---|
| 스탠딩(차분) | 832×1216 | `visual novel sprite, full body, transparent background, standing` |
| 이벤트 CG | 1216×832 | `visual novel cg` |
| 배경 | 1216×832 | `visual novel bg, scenery, no humans, high complexity, depthness` |
| 얼굴 아이콘 | 1024×1024 → 잘라 쓰기 | `portrait, close-up` |

## 6. 캐릭터 태그 시트 (초안 — 첫 시험 생성 뒤 다듬는다)

기존 설정(`docs/최종-에셋-생성지침.md`)의 외형을 단부루 태그로 옮긴 것. 인물마다 같은 문자열을 고정해 써야 얼굴이 흔들리지 않는다.

- **오르페이아**: `1girl, solo, silver hair, very long hair, green eyes, maid, maid headdress, aqua ribbon, hair ribbon, frilled apron, white apron, black dress, puffy short sleeves, green brooch, smile`
- **서도희 교수**: `1girl, solo, mature female, black hair, streaked hair, white streak, short ponytail, glasses, thin-framed eyewear, gold-framed eyewear, tired eyes, grey cardigan, navy shirt, lanyard, id card, holding cup, paper cup`
- **유하린**: `1girl, solo, brown hair, short hair, short side ponytail, hair ornament, hairclip, yellow hairclip, amber eyes, white shirt, navy sweater vest, lanyard, id card, headset, :d`
- **류지안**: `1girl, solo, black hair, long hair, low ponytail, round eyewear, black-framed eyewear, white shirt, grey sweater vest, lanyard, id card, holding laptop, eye bags`

> 결정이 필요한 것: 지금 게임 그림은 **약 3등신 SD** 화풍이다. 주인님 세팅(tsunako 주축)은 등신대 미소녀 화풍이라, 새로 만들면 화풍이 바뀐다. 전부 새 화풍으로 갈아탈지, SD는 `chibi, visual novel chibi`로 맞출지 정해야 한다.

## 7. 자동화 (구현됨)

- **화풍 결정(2026-11-17)**: 게임 그림은 전부 이 세팅의 새 화풍(등신대)으로 갈아탄다. 치비가 필요한 장면도 같은 화풍으로 `chibi` 작업을 만든다(작업에 `"chibi": true`).
- 인물 외형 태그: `tools/nai/characters.json` (여기만 고치면 모든 작업에 반영).
- 생성기: `tools/nai/generate.mjs` — 앞머리·UC·품질·스텝·샘플러는 `preset.json`, 인물은 캐릭터 칸(V5 다인물), 인원 태그는 기본 프롬프트. 출력 옆에 같은 이름의 `.json`(프롬프트·시드)을 남겨 다시 만들 수 있게 한다. `--dry`로 요청만 확인.
- 워크플로: `.github/workflows/nai-generate.yml` — `tools/nai/jobs/*.json`을 고쳐 푸시하면 그 브랜치에서 실행, **아직 없는 그림만** 만들어 같은 브랜치에 커밋(`assets/nai/…`, 기록 `tools/nai/log/last-run.txt`). 시크릿은 `NAI_TOKEN`.
- 작업 순서: 시험 작업(시드 여러 개) → 주인님이 고른 시드 고정 → 차분 일괄 → 게임 에셋 이름으로 교체.

## 출처

- 공식: [V5 소개](https://novelai.net/v5), [V5 출시 글(일본어)](https://blognew.novelai.net/novelai-diffusion-v5-release-jp-343211a45664/), [V5 출시 글(영어)](https://journal.novelai.net/image-generation-novelai-diffusion-v5-is-here-c2df7c6b8d2d/), [강화·약화](https://docs.novelai.net/en/image/strengthening-weakening), [태그](https://docs.novelai.net/en/image/tags), [품질 태그](https://docs.novelai.net/en/image/qualitytags), [UC 프리셋](https://docs.novelai.net/en/image/undesiredcontent), [Effort](https://docs.novelai.net/en/image/effort), [여러 인물](https://docs.novelai.net/en/image/multiplecharacters), [FAQ(사용량)](https://docs.novelai.net/en/faq)
- 비공식(API 모양): [raspie10032/ComfyUI_RS_NAI_API_Request](https://github.com/raspie10032/ComfyUI_RS_NAI_API_Request/blob/main/nai_api.py), [LlmKira/novelai-python](https://github.com/LlmKira/novelai-python), [bedovyy/ComfyUI_NAIDGenerator](https://github.com/bedovyy/ComfyUI_NAIDGenerator), [Marinara-Engine #5343](https://github.com/Pasta-Devs/Marinara-Engine/issues/5343), [Miint-Sunny/nai5-prompting](https://github.com/Miint-Sunny/nai5-prompting)
