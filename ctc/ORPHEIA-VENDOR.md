# CTC LAB 시뮬레이터 (오르페이아 VN 내장본)

`skybridge805679-netizen/ctc-lab-ls-mmi`의 `simulator/` 폴더를 복사한 것입니다(원본 커밋 82924dc, v0.39.58).
시험 파일(e2e, *.test.*)만 뺐습니다. 갱신할 때는 원본 `simulator/`를 다시 복사한 뒤 아래 수정만 다시 적용하세요.

| 파일 | 수정 |
|---|---|
| ui/page-engine.js | 전체 초기화가 `localStorage.clear()` 대신 `orpheia.*`·`ctclab-*` 키만 지움 (VN 세이브 보호) |
| index.html | `?embed=1`이면 전체 초기화·FTS 버튼을 숨김 |
