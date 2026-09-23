# 문서와 실행 증거 안내

이 폴더는 학생용 강의 본문 바깥의 운영 기준, 조사 부록, 복사 가능한 서식과 실제 에이전트 실행 기록을 정리합니다. 과정을 처음 시작한다면 [온라인 교재](https://themagictower.github.io/korean-ai-dev-course/)와 [저장소 시작 안내](../README.md)를 먼저 보세요.

## 운영·설계 기준

| 주제 | 문서 |
|---|---|
| AI 활용 개발의 전체 흐름 | [workflow.md](workflow.md) · [project-operating-standard.md](project-operating-standard.md) |
| 사용자·프로젝트 수준에 맞춘 완성 조건 | [project-completion-levels.md](project-completion-levels.md) · [adaptive-process.md](adaptive-process.md) |
| 재사용할 계약·ADR·모델 결정·검증 서식 | [templates.md](templates.md) |
| 과정 구성과 4주 강사용 설계 | [course-design.md](course-design.md) |
| 한국어 스킬 패키지·모델 분석·코딩 에이전트 조사 | [korean-skill-package.md](korean-skill-package.md) · [model-selection.md](model-selection.md) · [frontier-models.md](frontier-models.md) · [coding-agents-report.md](coding-agents-report.md) |
| ApplyFlow 프롬프트·실행 절차와 한 건의 수행 기록 | [실행 매뉴얼](playbooks/applyflow-runbook.md) · [AF-104 기록](playbooks/applyflow-af104-record.md) |
| 고도화·부분 교체·새 구현 판단 | [course/evolve-or-rebuild.md](../course/evolve-or-rebuild.md) |
| CI/CD 측정과 캐시 최적화 | [course/ci-cd-optimization.md](../course/ci-cd-optimization.md) |

## 실제 제작·비교 기록

- [세 프로젝트 실제 에이전트 제작 기록](execution/2026-09-23/README.md): ApplyFlow, FlyBlock, Signal Magazine의 입력 프롬프트, 위임, 공개 응답, 이벤트와 시간 산정 경계.
- [Signal Magazine 운영 후보 비교](execution/production-comparison-2026-09-23/contract.md): 공통 완료 계약, 경로별 실제 프롬프트, Jev 분류 요청·응답, 환경, 통합 이벤트와 시간 원자료.
- [프로젝트 실행체 목록](../projects/README.md): 브라우저 데모와 검증 명령, 범위·미완료 조건.

원자료는 서로 다른 종류의 증거를 구분합니다. 이벤트 시각은 단계 경과를 보이며 순수 코딩 시간으로 분해하지 않습니다. 병렬 작업자의 시간을 더한 값은 벽시계 시간과 다릅니다. 보고서의 단일 비교는 일반적인 모델 성능이나 수강생 생산성 배수의 증명이 아닙니다. 내부 비공개 추론 전체는 기록하지 않습니다.

## 조사 자료의 최신성

모델·프로바이더·코딩 에이전트 문서는 공식 출처 링크와 확인 시점을 기준으로 읽습니다. 가격, 이름, 기능, 사용 한도는 변할 수 있으므로 실제 수업·구매·도입 전에 원 출처를 다시 확인하세요. 사용자가 제공한 개발 속도 경험, 직접 관찰된 실행 결과, 교육을 위해 제안한 선택 기준도 문서에서 서로 구분합니다.
