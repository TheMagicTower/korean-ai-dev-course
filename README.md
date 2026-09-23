# 한국어 AI 개발 스킬과 4주 프로젝트 교재

[온라인 4주 교재](https://themagictower.github.io/korean-ai-dev-course/) · [실제 프로젝트와 실행 기록](https://themagictower.github.io/korean-ai-dev-course/projects/) · [GitHub 저장소](https://github.com/TheMagicTower/korean-ai-dev-course)

**수강생 각자의 아이디어 하나를 4주 동안 발전시켜 작동하는 결과물로 전달하는 교육 자료와 실제 사례를 모은 공개 저장소입니다.** 수업은 주 1회, 회당 2시간입니다. 교재는 2026-09-23 기준 4주 과정과 확장 부록을 포함한 공개 초판입니다.

## 바로 시작하기

1. [온라인 교재](https://themagictower.github.io/korean-ai-dev-course/)에서 1주차부터 진행합니다. 수강생마다 자기 프로젝트를 정하고, 공통 완료 기준에 맞춰 같은 프로젝트를 4주간 발전시킵니다.
2. [프로젝트 제작실](https://themagictower.github.io/korean-ai-dev-course/projects/)에서 ApplyFlow, FlyBlock, Signal Magazine 데모를 실행해 보고 실제 프롬프트·단계별 시간·검증 기록을 확인합니다.
3. [한국어 스킬 패키지 설치 안내](INSTALL.md)와 [복사해 쓰는 한 줄 프롬프트](guides/one-line-prompts.md)를 이용합니다. 공개 스킬 묶음은 [v0.2.0 Release](https://github.com/TheMagicTower/korean-ai-dev-course/releases/tag/v0.2.0)에서 받습니다.

## 저장소에 들어 있는 것

| 자료 | 내용 | 시작점 |
|---|---|---|
| 4주 HTML 교재 | 문제 정의, 목업 우선 설계, 개발·검증·전달, 모델·도구 조사와 실전 부록 | [온라인 교재](https://themagictower.github.io/korean-ai-dev-course/) · [과정 구성](docs/course-design.md) |
| 한국어 개발 스킬 8개 | 시작·계획·구현·검토·디버그·모델 선택·전달·인계 | [스킬 목록](skills/README.md) · [설치 안내](INSTALL.md) |
| 세 가지 데모 | 개인용 지원 관리, 신경회로 유도 블록 대전, 실제 기록을 바탕으로 한 AI 뉴스 편집국 | [프로젝트 목록](projects/README.md) |
| 운영 서비스 비교 | 같은 소규모 편집국 계약을 구현한 기존 PoC 고도화 및 신규 Django 후보 | [실험 보고서](https://themagictower.github.io/korean-ai-dev-course/projects/production-comparison/) · [실행 계약과 증거](docs/execution/production-comparison-2026-09-23/contract.md) |
| 프로젝트 운영 기준 | 프로젝트 수준, 범위·ADR·작업 분해·리뷰·상태 판단·전달 방법 | [문서 목록](docs/README.md) |

## 수업에서 다루는 중요한 판단

- AI가 만든 저비용 목업으로 사용 경험을 먼저 확인하고, 그 결과에서 업무 규칙·API·데이터 구조를 도출합니다.
- 개인용·PoC·MVP·운영 서비스의 완료 기준을 구분합니다. 모든 프로젝트에 같은 보안·문서·CI/CD 절차를 요구하지 않습니다.
- 기존 것을 고칠지, 일부 계층을 교체할지, 새로 만들지와 각 선택의 비용·위험을 비교합니다. [고도화·재구현 판단 자료](course/evolve-or-rebuild.md)
- 프로젝트가 커질 때 CI/CD의 실제 병목을 측정하고, 안전한 캐시·병렬화·아티팩트 전달을 선택합니다. [CI/CD 최적화 자료](course/ci-cd-optimization.md)
- 주요 모델·프로바이더와 코딩 에이전트의 장단점을 작업에 맞춰 살펴봅니다. 조사 시점이 중요한 주장은 각 부록의 공식 자료와 확인일을 참고합니다.

## 프로젝트 실행

저장소 루트에서 정적 사이트 서버를 실행합니다.

```sh
python3 -m http.server 8765
```

- 교재: `http://localhost:8765/`
- 프로젝트 안내: `http://localhost:8765/projects/`
- 개별 프로젝트 실행 방법과 테스트 명령은 [`projects/README.md`](projects/README.md) 및 각 프로젝트의 README를 참고하세요.
- Django 서비스 후보는 각각의 `experiments/signal-production/upgrade/README.md`, `experiments/signal-production/greenfield/README.md`에 환경 설정·계정·백업·복구 방법을 기록했습니다. 공개 서버가 아니라 로컬 검증용 후보입니다.

## 교재 수정과 빌드

Python 환경에 저장소의 빌드 의존성을 설치한 다음 빌드합니다.

```sh
python3 -m pip install -r requirements-build.txt
python3 scripts/build_course.py
```

`course/`의 Markdown과 스타일·동작 파일이 루트 `index.html`로 합쳐집니다. 시각 자료 생성은 `scripts/course_visuals.py`가 담당합니다. 정적 HTML 본문과 이미지 자료는 저장소에 포함되어 있습니다. Mermaid 흐름도를 SVG로 바꾸려면 온라인 Mermaid 모듈을 불러올 수 있어야 하며, 불러오지 못하면 흐름도 원문이 남습니다.

## 저장소 구조

```text
course/                  학생용 4주 본문과 교육용 예제
skills/                  배포 가능한 한국어 SKILL.md 8개
projects/                세 가지 브라우저 데모와 프로젝트별 증거
experiments/              Signal Magazine 운영 서비스 비교 구현 2개
experiments/.../shared/   두 경로가 함께 사용한 입력과 완료 계약
scripts/                  교재 빌드와 재현·검증 보조 도구
docs/                     운영 기준, 조사 부록, 프롬프트와 실행 기록
index.html                 GitHub Pages에 배포하는 단일 HTML 교재
```

전체 프로젝트 설명과 실행·검증 명령은 [`projects/README.md`](projects/README.md), 수업·운영 문서 안내는 [`docs/README.md`](docs/README.md)에 모았습니다.

## 범위와 검증 경계

- GitHub Pages는 교재와 정적 데모를 제공합니다. Django Signal Magazine 후보 서버는 GitHub Pages에서 실행되지 않으며, 외부 HTTPS 운영 출시는 이 저장소의 실험 범위에 포함되지 않습니다.
- 실행 시간은 해당 작업의 실제 로그에 기록된 관찰값입니다. 서로 다른 시점의 값을 합한 예시나 단일 실험을 일반적인 생산성 보장으로 해석하지 않습니다. 사용자 경험인 “통상 약 6배”는 수업에서 제시된 경험담이며, 이 저장소가 통제 실험으로 입증한 배수가 아닙니다.
- 뉴스·모델·에이전트 기능과 가격은 달라질 수 있습니다. 실제 적용 전에 각 문서에 연결한 공식 출처와 조사 날짜를 다시 확인하세요.
- Agent 응답 기록에는 공개 진행 내용과 결과를 보관합니다. 비공개 내부 추론 전체를 수집하거나 공개하지 않습니다.

실제 프롬프트, 공개 응답, 단계 시각과 제한은 [`docs/execution/README.md`](docs/execution/README.md)에서 안내합니다.
