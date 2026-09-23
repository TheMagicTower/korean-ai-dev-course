# 프로젝트 구현체 안내

이 폴더에는 수업에서 설명만 하는 가상 사례가 아니라, 직접 실행할 수 있는 세 가지 브라우저 데모와 각 제작 단계의 기록이 들어 있습니다. 모든 데모는 저장소 루트의 정적 서버로 실행할 수 있습니다.

```sh
python3 -m http.server 8765
```

열 주소와 각 테스트 명령은 아래에 정리했습니다. Node.js 기반 검사는 브라우저 UI 검증과 다른 층입니다. 각 README에 기록한 범위와 제한을 함께 확인하세요.

| 구현체 | 무엇을 보여 주나요? | 사용자 수준 | 실행 문서 |
|---|---|---|---|
| ApplyFlow | 가상 채용 공고 저장, 검색, 지원 상태 관리, JSON 백업·복원 | 개인용 브라우저 도구 | [README](applyflow/README.md) · [`http://localhost:8765/projects/applyflow/`](http://localhost:8765/projects/applyflow/) |
| FlyBlock Arena | 사람과 초파리 연결지도에서 추출한 12개 뉴런·13개 연결 유도 회로의 실시간 블록 대전 | 연구 데이터 기반 인터랙티브 데모 | [README](flyblock/README.md) · [`http://localhost:8765/projects/flyblock/`](http://localhost:8765/projects/flyblock/) |
| Signal Magazine | 실제로 기록된 NASA RSS 입력·Jev 분류·에이전트 초안으로 편집, 보류, 승인, 로컬 발행·정정 흐름 재생 | 단일 편집자 로컬 데모 | [README](signal-magazine/README.md) · [`http://localhost:8765/projects/signal-magazine/`](http://localhost:8765/projects/signal-magazine/) |

## 테스트 명령

저장소 루트에서 실행합니다.

```sh
node projects/applyflow/test-model.cjs
node projects/flyblock/test-realtime.cjs
node projects/flyblock/test.cjs
node projects/signal-magazine/test.cjs
```

실패와 수정 이력, 실제 시간과 응답은 각 구현체의 `evidence/` 또는 `updates/` 폴더에 있습니다. 세 프로젝트의 최초 제작 요청·위임 메시지·공개 진행 기록은 [`docs/execution/2026-09-23/`](../docs/execution/2026-09-23/README.md)에서 확인할 수 있습니다. 에이전트 작업의 경과 시간은 수강생이 혼자 개발하는 예상시간이나 모델 간 통제 성능 비교가 아닙니다.

## 운영 서비스 수준 비교

Signal Magazine을 소규모 편집국 서비스 후보로 확장한 두 구현은 기본 데모와 별도 위치에 있습니다.

- [기존 PoC 고도화](../experiments/signal-production/upgrade/README.md): 기존 편집 흐름·데이터·규칙을 재사용하면서 Python/Django 서버, 계정·권한, DB, 승인·발행·정정, 백업·복구를 구현했습니다.
- [동일 계약 신규 구현](../experiments/signal-production/greenfield/README.md): 같은 완료 계약을 기준으로 별도 코드를 작성했습니다.
- [비교 보고서와 실행 화면](https://themagictower.github.io/korean-ai-dev-course/projects/production-comparison/) · [계약, 프롬프트, 이벤트와 시간 원자료](../docs/execution/production-comparison-2026-09-23/)

두 결과물은 로컬에서 검증한 운영 서비스 **후보**입니다. 외부 DNS·HTTPS, 운영 서버 배포 계정, 장기 운영을 검증한 공개 프로덕션 서비스가 아닙니다. 각 후보의 README에 미완료 조건과 제한을 기록했습니다.

## 이 사례로 가르치는 선택

[고도화·부분 교체·새 구현 판단](../course/evolve-or-rebuild.md)은 완료 조건과 유지할 자산을 기준으로 다음 경로를 고르는 연습입니다. [AI 개발 4주 교재](https://themagictower.github.io/korean-ai-dev-course/)에서 흐름도, 비용 표, 사례, 복사용 판단 프롬프트를 볼 수 있습니다.
