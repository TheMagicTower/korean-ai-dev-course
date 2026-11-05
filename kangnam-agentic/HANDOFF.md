# 핸드오프 — 강남대 「Agentic Engineering 실무」 HTML 슬라이드

다른 에이전트가 이어받을 때 이 파일부터 읽습니다.

## 무엇을 만드는가
5회 × 4교시(20시간) 강의 슬라이드. 회차별 HTML 덱 `session-1.html` ~ `session-5.html`.
강사 변천사 서사(자동완성 → IDE 채팅 → 터미널 에이전트 → … → 페르소나 평가)를 시간순으로 따라갑니다.
결정 기록과 조사 원문: Claude Docs 문서 https://claude.ai/artifact/HvM6r94Z8wxkSVGrq5vCZn (탭: 요건/결정, 조사 노트, 변천사 기반 20시간 재구성, 1회차 구성안 v2).

## 먼저 읽을 것
1. `plan/style-guide.md` — 강사가 승인한 스타일 규칙(모든 장에 실제 캡처 또는 D2/Pele 도식, AI 생성 이미지 금지, 합니다체 노트, 날짜·출처 tag).
2. `src/periods/p01.html` — 스타일 견본(1교시, 36장).
3. `plan/course-plan.md` — 교시별 범위·블록·출처.
4. `plan/research-timeline.md` — 1차 출처로 검증한 연표와 ‘서사와 사실이 다른 곳’.
5. `plan/instructor/` — 강사 본인 운영 문서(ADR 서식, 18단계 운영 기준, 스킬 지도, 머지 트레인 등).
6. `plan/capture-todo.md` — 강사 브라우저/화면으로 교체할 캡처.

## 구조
```
src/deck.css, src/deck.js      공용 스타일·내비게이션(←/→, N 노트, F 전체 화면, 교시 이동)
src/periods/pNN.html           교시별 슬라이드 원본 (01~20)
diagrams/src/*.d2|*.mmd        도식 원본 → node tools/diagrams.mjs [이름] → diagrams/out/*.svg
assets/captures/*.jpg          실제 화면 캡처 (tools/capture.js)
tools/build.py                 python3 tools/build.py [회차…|pNN]  → session-N.html, _artifact/session-N.html, preview/pNN.html
tools/qa.js                    NODE_PATH=$(npm root -g) node tools/qa.js N|pNN  → qa/ 스크린샷·콘택트 시트·넘침 보고
tools/node_modules             pele@1.12.0, @terrastruct/d2@0.1.33 (오프라인 렌더)
```
회차 ↔ 교시: 1회차 1–4, 2회차 5–8, 3회차 9–12, 4회차 13–16, 5회차 17–20.

## 환경 메모
- kroki.io, jsdelivr, openai.com, x.com은 샌드박스에서 막힘. D2는 로컬 wasm으로, Kroki는 필요 없음.
- 아티팩트 게시는 스크래치패드 경로에서만 됨. 이미지는 `files` 맵으로 같이 올림.
- 강사 기기 폴더: SkillProject/kangnam-agentic/ (device_commit_files 또는 tar로 동기화). 기기 셸은 파일 삭제 불가.
- 비용: 큰 작업은 Sonnet 서브에이전트에게 교시 단위로 맡기고(공용 파일 수정 금지, 파일 이름에 pNN- 접두어), Opus는 검토.

## 진행 상황
20교시 전부 작성·검사 완료(2026-10-29). 게시 주소와 남은 일은 CHANGELOG.md 끝.
강의 노트(강사 전용 Docs): https://claude.ai/artifact/2QTf7CBKNZEJ2G9ZSxBgWM · 원본 plan/notes/*.md
도식 규칙 보충: plan/diagram-brief.md의 ‘행 컨테이너’ 방식은 이 렌더러에서 안 됨 → grid-rows 먼저, grid-columns 다음, 인접 칸만 연결.
게시 갱신: python3 tools/build.py N 후 _artifact/session-N.html을 같은 경로로 다시 게시(이미지는 files로).
