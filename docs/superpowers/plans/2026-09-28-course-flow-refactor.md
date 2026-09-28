# Course Flow Refactor Implementation Plan

> 실행자: 사용자 지시에 따라 Muse Code CLI / muse-spark-1.3-contributor만 구현합니다. Codex는 설계·관리·검토를 담당합니다. 사용자 승인은 완료되었습니다.

**Goal:** 4주 핵심 학습 흐름을 정리하고 선택 심화 자료를 분리합니다.

**Architecture:** Markdown 원문을 단일 출처로 유지하고 Python 빌더로 정적 HTML을 생성합니다. 기존 article 순서와 체크리스트를 보존하며 목차 그룹만 독립적으로 구성합니다.

**Tech Stack:** Python, Markdown 3.8.2, HTML/CSS/JavaScript, Muse Code CLI.

## Task 1: 기준 기록과 본문 재구성
- [x] 시작 SHA 27aa49c와 기존 27 article ID, 21 체크리스트 텍스트/키/순서를 기록합니다. (완료: baseline 27aa49c 유지, validator로 기존 27 순서·신규 2개 끝 추가·21 체크 텍스트/키/순서 일치 확인)
- [x] course/start.md, week1.md–week4.md를 목표/시간표/개념/시연/실습/완료/선택 읽기로 정리합니다. 각 주차 120분을 유지합니다. (완료: 1–4주차 각 연속 0–120분 확인)
- [x] course/parallel-ai-merge-train.md에서 course/issue-pr-management.md, course/domain-testing.md를 추출합니다. 기존 출처·예외·추적 기준을 보존합니다. (완료: 13개 공식 출처 합집합 보존, TDD 핵심 3행 보존)
- [x] README.md, docs/README.md 및 관련 문서의 중복 설명을 대표 단원 링크로 정리합니다. (완료)

## Task 2: 탐색과 빌드
- [x] scripts/build_course.py에서 기존 article 순서를 유지하고 두 새 단원을 끝에 추가합니다. 목차는 승인된 다섯 그룹으로 구성합니다. (완료: 전체 29단원, 목차 29개 1회 포함·그룹 순서 일치)
- [x] course/style.css 및 필요한 course/app.js를 최소 수정해 그룹 목차와 핵심 주차 앞/뒤 이동을 지원합니다. (완료: app.js 사이드바 선택자 1곳만 수정, 핵심 5단원 pager 존재·비핵심 없음)
- [x] 원래 21 체크리스트 문구와 키를 동일하게 유지합니다. 새 체크리스트를 추가하지 않습니다. (완료)
- [x] /tmp/merge-train-course-build/bin/python scripts/build_course.py로 index.html을 생성합니다. (완료: 최종 재빌드 성공)

## Task 3: 검증과 검토 전달
- [x] Markdown 링크/HTML ID/내부 앵커, 기존 27 ID 및 새 2 ID, 21 체크키, 주차별 120분, article별 H1 하나를 검증합니다. (완료: /tmp/validate_flow.py ALL PASS, node --check·git diff --check 통과)
- [x] DDD의 경계 설계와 실제 의존성 격리, TDD 테스트 구축, 전이적 affected CI, 누적 merge candidate 검증의 연결 및 전역 변경 fallback을 확인합니다. (완료: 5개 연결 키워드 포함, 자동-안전 긍정 표현 없음·부정 문장 보존)
- [x] 이슈 중복/중첩/공통 원인/의존/연관/상하위 처리와 원자적 PR·잔여 조건·종료 증거를 확인합니다. (완료)
- [x] course/VALIDATION.md에 실제 수행한 검사만 기록합니다. 브라우저 검사는 Codex가 관리하고 결과를 전달합니다. (완료: '최종 브라우저 검증 — Codex 관찰 전달' 절 추가, 이전 절에 시점 표기)
- [x] Codex 검토 지적은 Muse가 수정하며, 검증 후 명시적 파일만 커밋합니다. push/merge/deploy는 하지 않습니다. (완료 예정: 본 커밋만 수행, provenance — 실행자 Muse Code CLI / muse-spark-1.3-contributor, baseline 27aa49c 유지)
