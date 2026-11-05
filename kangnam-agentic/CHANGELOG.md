# 작업 이력

## 2026-10-28
- 조사·구성: 변천사 20단계 검증 연표, 20교시 배치안 v2, 1회차 구성안 v2 (Docs 문서).
- 견본 6장 강사 승인 → 이 스타일로 20교시 전체 제작 지시.
- 제작 틀: deck.css/deck.js, diagrams.mjs(Pele+D2 오프라인), build.py(회차·교시 미리보기), qa.js, capture.js.
- 1교시 완성: 36장, 도식 7개(timeline-4eras, two-axes, ide-vs-terminal, loop-human-agent, sdd-tdd-ddd, coordinator-batch, stack-order, developer-role), 캡처 30여 장. QA 넘침 없음.
- 핸드오프 문서: HANDOFF.md, plan/style-guide.md, plan/course-plan.md, plan/research-timeline.md, plan/capture-todo.md, plan/instructor/.
- 다음: 2–16교시를 Sonnet 서브에이전트로 교시별 제작, 17–20교시 발표·마무리.

## 2026-10-29
- 2~20교시 작성(교시별 Sonnet 에이전트). 사용량 한도로 중단된 뒤 남은 캡처 19장 보충, 넘침 수정.
- 도식 자동 재배치: tools/fit_diagrams.mjs가 자리(전체 폭/두 단)에 맞춰 레이아웃 후보 중 글자가 가장 크게 보이는 것을 고름.
- deck.css: 두 단 안의 캡처가 칸에 맞게 줄어들도록 수정(설명 글과 겹치던 문제).
- 강사 브라우저 캡처: Karpathy X 게시물(공식 임베드 저장 → tools/render-saved.js), OpenAI 원문 그림. 1교시에 ‘바이브 코딩에서’ 장 추가(37장).
- 1교시 단독 아티팩트 게시(교수 컨펌용): https://claude.ai/artifact/KCBih2hury8jWXe2mr865f
- 강사 전용 강의 노트(Docs, 비공개): https://claude.ai/artifact/2QTf7CBKNZEJ2G9ZSxBgWM
- 도식 재작업(55개): ELK는 컨테이너 안 direction을 무시하므로, 긴 흐름은 grid-rows/grid-columns + 인접 칸만 잇는 뱀 모양 배치로(빈 칸은 opacity 0). 글자 34px, 간선 라벨 26px.
- build.py: 도식을 넣을 때마다 SVG id를 고유하게 바꿔, 같은 도식을 두 번 써도 화살촉이 사라지지 않음.
- 17교시 평가표를 16교시 배점(구조 25·기록 25·점검 20·실패 분석 20·발표 10)과 일치시킴.
- 11교시 Karpathy 장에 원 X 게시물, 16교시 REA 장에 GitHub 저장소 화면.
- 게시: 1교시(교수 컨펌용, v2) https://claude.ai/artifact/KCBih2hury8jWXe2mr865f
  1회차 https://claude.ai/artifact/RJqh2iuFq7srpdGDXKcFUX · 2회차 https://claude.ai/artifact/GMHj2jtgWKbcB8LGgCCSuz
  3회차 https://claude.ai/artifact/D2xMt2XmK1b5Rn8KPQsfnR · 4회차 https://claude.ai/artifact/QFaZQKXsymbXnv1pcqH65n
  5회차 https://claude.ai/artifact/QvocmJgC6nRR9UZoWDh5tX
- 남은 일: 강사 화면 4곳(plan/capture-todo.md), 약한 도식 몇 개(p09-goal-eval, p11-progressive, p11-superpowers-flow, p04-loop-v0, coordinator-batch).

## 2026-10-29 (오전, 강사 피드백 반영)
- 설명 보강: 영문 캡처마다 한국어 요약(.ko), 인용 번역(.tr), 수치 맥락, 레퍼런스마다 장점/단점·한계/의미 카드(.pmi).
- 확인 질문 장 제거 → 교시 중간 ‘여기까지, 질문 받습니다(약 5분)’ 장. 원본은 plan/bak-0929/.
- 설치 안내 제거. 3교시 ‘4교시 실습 예고’ 수정.
- 실습 4·8·12·16교시를 에이전틱 엔지니어링 프로세스(18단계 + 이슈별 워크플로우)로 재작성: 에이전트에게 설계 질문부터 → 문서·ADR → 승인 → 구현 → 일부러 어겨 보기 → 기록. 지침 plan/practice-brief.md.
  - 8교시: 옛 protect-tests.sh가 추적 파일 전부를 막던 버그 수정(검토 포인트 ①). 과제 2 배점 25/25/25/15/10.
  - 16교시: 실습·최종 과제 장 14장으로(전체 30장).
- 1교시에도 중간 질문 시간 장(18장, 1·2부 뒤) 추가 → 38장. 4교시 ‘설계 질문 9가지’ 문구를 여섯 가지로 바로잡음.
- 전 회차 재게시(1교시 컨펌용 v4, 1회차 v4, 2~5회차 v2). 강의 노트 원본(plan/notes)과 Docs 강의 노트 갱신.
- 기기 동기화: kangnam-agentic/_sync/ka-rest.tgz, ka-assets-new.tgz.

## 2026-10-29 (10:25~ 강사 피드백 2차)
- 설치 명령 전부 제거(Orca·Spec Kit·플러그인·REA·rtk). 노트에 “설치는 각자”.
- 용어 먼저: 10교시 ‘개념: LSP와 문서 조회’ 장 신설(도식 p10-lsp-docs). Context7은 문서 조회, Serena는 LSP. Claude Code LSP 도구 2.0.74(2025-12-19). 전 교시에서 도구 이름보다 개념을 먼저(지침 plan/voice-term-brief.md).
- 소개 말투: “오늘의 지도/배웁니다/기억하세요” 등 약 170곳을 소개·공유 말투로.
- SDD·ADR 용어 계보: 5교시 4–5장(1987 IEEE 1016 Software Design Description → 2004 Ostroff 외 → MDD·BDD → 2025 Kiro·Spec Kit → Böckeler 세 수준, 설계 기술서 vs 스펙 주도 개발 비교표), 14교시 7–8장(1992 Perry·Wolf → 2005 Tyree·Akerman → 2011 ISO/IEC/IEEE 42010 → 2011-11-15 Nygard → 2016·2017 Thoughtworks Radar, 2018 MADR, 비교표). 1교시 노트에도 기원 한 줄.
- 13교시 표지 제목: 에이전트 팩토리, 병렬 에이전트 관리, 코디네이터-배치.
- 재게시: 1교시 v5, 1회차 v5, 2~5회차 v3.

## 2026-10-29 (11:19~ 강사 피드백 3차)
- 실습 4·8·12·16교시: 코드 블록·검토 표시 제거 → 프롬프트 + 스모크(시나리오·기대·실제·통과). 결과 값은 예시로 진행(사전 실행 불필요). 지침 plan/prompt-smoke-brief.md.
- 하네스 형태·구조 강제 없음, 채점·평가·배점 없음(과제 → 다음 회차까지 해 볼 것, 발표 = 공유). 지침 plan/free-harness-brief.md.

## 2026-10-29 (11:52~ 강사 피드백 4차)
- 약어를 교시 첫 등장마다 `약어(영어 원말, 한국어 뜻)`로 풀어 씀(슬라이드·노트). MRCR·REA 원문 확인.
- ‘점수 없음/평가 아님’ 류 문구 전부 삭제.
- 5회차: 발표 템플릿·5분+2분·타이머·기준 과제 제거 → 자유 공유와 토론(17교시 4장, 18·19교시 각 4장), 이야기 거리 카드, 스터디로 이어 가기. 지침 plan/free-share-brief.md.
- 재게시: 1교시 v7, 1회차 v8, 2~5회차 v6.
