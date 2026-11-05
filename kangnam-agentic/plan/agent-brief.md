# 교시 제작 서브에이전트 지침

프로젝트 루트: /tmp/claude-0/-home-claude/1e61c45b-9ca0-544b-985f-74ce7a96fb3a/scratchpad/ka (모든 명령은 여기서 cd 후 실행)

1. 읽기: HANDOFF.md, plan/style-guide.md(규칙, 반드시 지킴), src/periods/p01.html(견본, 끝까지), plan/course-plan.md에서 내 교시 절, plan/research-timeline.md. 필요하면 plan/instructor/*.md.
2. 조사: 내 교시 블록의 사실·날짜를 WebSearch/WebFetch로 1차 출처에서 확인. 확인 못 한 것은 쓰지 않음.
3. 캡처: tools/capture.js로 실제 화면 캡처, 이름은 반드시 pNN-로 시작. 찍은 뒤 Read로 확인(쿠키 배너·빈 화면이면 다시). 기존 assets/captures/* 재사용 가능.
4. 도식: diagrams/src/pNN-*.d2 (또는 .mmd), `node tools/diagrams.mjs pNN-이름`으로 렌더.
5. 작성: src/periods/pNN.html 하나만 새로 씀. 공용 파일(src/deck.*, tools/*, 다른 교시 파일, plan/* 중 capture-todo.md 제외) 수정 금지. capture-todo.md에는 줄 추가만 허용(동시 편집 주의: 한 번에 append).
6. 검사: `python3 tools/build.py pNN` → `NODE_PATH=$(npm root -g) node tools/qa.js pNN` → 넘침·이미지 누락 0이 될 때까지 고침. qa/pNN-sheet-*.png를 Read로 직접 보고 글자 겹침, 너무 작은 도식, 빈 장이 없게.
7. 보고(마지막 메시지, 300자 이내): 장 수, 새 캡처 목록, 새 도식 목록, 확인하지 못해 뺀 내용, 강사 화면이 필요한 장.
