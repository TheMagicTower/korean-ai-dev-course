# Merge Train Course Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox syntax for tracking.

**Goal:** 병렬 AI 개발의 PR·CI 병목을 DDD 경계, TDD, 변경 영향 분석, 머지트레인으로 연결하는 한국어 교재를 추가합니다.

**Architecture:** 기존 정적 Markdown 교재 구조를 유지하고 독립 부록을 목차에 등록합니다. 주차 본문은 선택 실습으로 연결하며 120분 시간표를 유지합니다.

**Tech Stack:** Markdown, 기존 Python 정적 빌더, HTML, Mermaid.

**Spec:** ../specs/2026-09-28-merge-train-course-design.md

## Chunk 1: 교재 보강

### Task 1: 본문·연결·HTML 생성

**Files:** Create course/parallel-ai-merge-train.md; modify course/ci-cd-optimization.md, course/week2.md, course/week3.md, course/week4.md, docs/course-design.md, docs/README.md, README.md, scripts/build_course.py, index.html, course/VALIDATION.md.

- [ ] 공식 GitHub/GitLab/Nx 문서와 Fowler의 DDD/TDD 설명을 확인하고 출처와 확인일을 남깁니다.
- [ ] 승인된 설계의 모든 학습 목표를 새 부록에 작성합니다. 실제 적용용 완성 CI로 오인할 수 있는 미구현 스크립트 예시는 피하고 발췌·의사코드를 명시합니다.
- [ ] 2주차 경계/TDD, 3주차 영향 범위, 4주차 통합 병목에 연결합니다. 기존 선택 실습 시간을 대체합니다.
- [ ] 목차·색인을 연결하고 `python3 scripts/build_course.py`로 HTML을 재생성합니다.
- [ ] `git diff --check`, 로컬 링크/HTML 앵커/중복 ID/주차별 120분을 확인합니다. 문서 변경에 무관한 앱 테스트를 추가하지 않습니다.
- [ ] 로컬 브라우저에서 새 단원·도해·표·모바일을 확인하고 실제 검증만 course/VALIDATION.md에 기록합니다.
- [ ] 독립 검토에서 설계 충족과 기술 정확성을 확인하고 발견된 실질적인 문제를 수정합니다.

## 실행 판단

Task 1은 본문 → 링크/목차 → 생성 HTML 순서로 의존하며 하나의 작업자가 수행합니다. 별도 reviewer가 문서의 정확성과 생성 결과를 검토합니다. 운영 CI·외부 게시·배포는 이 보강 범위에 포함하지 않습니다.
