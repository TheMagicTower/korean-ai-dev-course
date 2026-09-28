# Merge Train Course Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox syntax for tracking.

**Goal:** 병렬 AI 개발의 PR·CI 병목을 DDD 경계, TDD, 변경 영향 분석, 머지트레인으로 연결하는 한국어 교재를 추가합니다.

**Architecture:** 기존 정적 Markdown 교재 구조를 유지하고 독립 부록을 목차에 등록합니다. 주차 본문은 선택 실습으로 연결하며 120분 시간표를 유지합니다.

**Tech Stack:** Markdown, 기존 Python 정적 빌더, HTML, Mermaid.

**Spec:** ../specs/2026-09-28-merge-train-course-design.md

## Chunk 1: 교재 보강

### Task 1: 본문·연결·HTML 생성

**Files:** Create course/parallel-ai-merge-train.md; modify course/ci-cd-optimization.md, course/week2.md, course/week3.md, course/week4.md, docs/course-design.md, docs/README.md, README.md, scripts/build_course.py, index.html, course/VALIDATION.md.

- [x] 공식 GitHub/GitLab/Nx 문서와 Fowler의 DDD/TDD 설명을 확인하고 출처와 확인일을 남깁니다.
- [x] 승인된 설계의 모든 학습 목표를 새 부록에 작성합니다. 실제 적용용 완성 CI로 오인할 수 있는 미구현 스크립트 예시는 피하고 발췌·의사코드를 명시합니다.
- [x] 2주차 경계/TDD, 3주차 영향 범위, 4주차 통합 병목에 연결합니다. 기존 선택 실습 시간을 대체합니다.
- [x] 목차·색인을 연결하고 `python3 scripts/build_course.py`로 HTML을 재생성합니다.
- [x] `git diff --check`, 로컬 링크/HTML 앵커/중복 ID/주차별 120분을 확인합니다. 문서 변경에 무관한 앱 테스트를 추가하지 않습니다.
- [x] 로컬 브라우저에서 새 단원·도해·표·모바일을 확인하고 실제 검증만 course/VALIDATION.md에 기록합니다.
- [x] 독립 검토에서 설계 충족과 기술 정확성을 확인하고 발견된 실질적인 문제를 수정합니다.

## 실행 판단

Task 1은 본문 → 링크/목차 → 생성 HTML 순서로 의존하며 하나의 작업자가 수행합니다. 별도 reviewer가 문서의 정확성과 생성 결과를 검토합니다. 운영 CI·외부 게시·배포는 이 보강 범위에 포함하지 않습니다.

## 완료 기록

2026-09-28: 교재 구현 c4a2569. 로컬 HTML 27단원, 링크·앵커·시간표·TDD 예시·브라우저 확인 완료. 독립 최종 검토 Critical 0 / Important 0 / Minor 0. 공개 배포는 수행하지 않았으며 작업 브랜치와 워크트리를 보존합니다.

## Chunk 2: 사용자 요청 — 중복·연관 이슈와 PR 통합

### Task 2: 이슈 분류와 통합 절차 보강

2026-09-28 추가 요청: 중복·유사·부분 중첩·연결된 이슈를 정리하고 하나의 PR로 묶거나 분리하는 정석적 기법을 문서화합니다. 같은 부록과 워크트리에서 이어갑니다.

**Files:** course/parallel-ai-merge-train.md, docs/templates.md, docs/project-operating-standard.md, course/week2.md, index.html, course/VALIDATION.md.

- [x] 공식 GitHub 중복 표시·이슈/PR 연결·하위 이슈·의존 관계와 Google의 작은 변경 지침 확인.
- [x] 분류표·통합/분리 기준·이미 중복 PR이 생긴 경우의 보존/이관·부분 완료/종료/되돌리기 절차를 추가.
- [x] 이슈별 수용 조건과 검증 증거 매핑, 대표 이슈와 상위 추적 이슈의 차이, PR 본문 서식·ApplyFlow 예시/문제/해설 추가.
- [x] 문서/워크북 연결 및 HTML 재생성. 링크·앵커·시간표와 브라우저에서 보강된 내용 확인.
- [x] 독립 검토와 검증 기록 후 같은 브랜치에 커밋. 실제 GitHub 이슈/PR의 상태는 변경하지 않음.

Task 2 검증: HTML 27단원 유지, 이슈 분류/통합 본문 및 워크북 연결 확인. 데스크톱1280·모바일390 가로 넘침 없음, 부록 표14개와 Mermaid3개 정상. 독립 검토 Critical 0 / Important 0 / Minor 0. 실제 GitHub 이슈/PR 상태와 공개 사이트는 변경하지 않았습니다.
