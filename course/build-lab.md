# 실제 서브에이전트 제작실
세 프로젝트를 독립 서브에이전트에 실제로 위임했습니다. **[최종 데모·단계별 시간·프롬프트와 응답](https://themagictower.github.io/korean-ai-dev-course/projects/)**을 함께 열어 비교하세요.

| 데모 | 출발 조건 | 시작→인계 경과 |
|---|---|---|
| [ApplyFlow](https://themagictower.github.io/korean-ai-dev-course/projects/applyflow/) | 기존 예제 재사용 + 가져오기·삭제 구현 | 3분 29초 |
| [FlyBlock Arena](https://themagictower.github.io/korean-ai-dev-course/projects/flyblock/) | 실제 연결지도 부분회로 + 사람이 설계한 입출력 | 10분 39초 |
| [Signal Magazine](https://themagictower.github.io/korean-ai-dev-course/projects/signal-magazine/) | 실제 자료·모델 실행 기록 + 브라우저 편집 데모 | 7분 14초 |

병렬 실행의 첫 시작→마지막 인계는 **10분 52초**, 개별 에이전트 경과 합계는 **21분 23초**입니다. 개별 시간의 합을 사용자가 기다린 시간으로 표현하지 않습니다.

주 에이전트의 첫 시각 관찰부터 수정·재검토를 포함한 로컬 통합 검증까지는 **16분 54초**입니다. 데모 첫 공개 확인까지는 **19분 50초**입니다. 최초 공개 이후 이 증거 보고서를 갱신·게시한 시간은 제외합니다. [배포 실행 기록](https://github.com/TheMagicTower/korean-ai-dev-course/actions/runs/35806098688)과 제작실의 통합 기록에서 확인할 수 있습니다.

## 무엇을 캡처했나요?
- 실제 위임 메시지와 에이전트가 읽은 작업 프롬프트 원문.
- 단계별 공개 응답과 UTC 관찰 시각, 최종 인계 응답.
- 실행한 검사와 결과, 데모의 브라우저 검증 화면.
- 기존 구현·외부 연구 코드·실제 모델 응답의 재사용 조건.

이것은 전체 내부 추론이나 모든 도구 호출 원시 로그가 아닙니다. 기록된 공개 응답은 문장을 매끄럽게 재작성하지 않았습니다. 다른 언어로 답한 구간이 있더라도 원문을 보존합니다.

## 시간을 해석하는 방법
단계 시간은 시작→온보딩 보고→계획 보고→구현 보고→검증 보고→인계 사이의 관찰 경과입니다. 테스트 명령은 구현 도중에도 실행됩니다. 예를 들어 ApplyFlow의 첫 통과 검사 시각은 구현 완료 보고보다 이르므로 막대를 실제 구현/테스트 작업 시간의 엄밀한 분리로 해석하지 않습니다. 조사·도구·대기·수정이 포함되며 순수 모델 추론 시간은 아닙니다. 최초 인계 뒤의 수정과 최종 전달은 [별도 통합 기록](https://themagictower.github.io/korean-ai-dev-course/projects/#integration)에 남깁니다.

ApplyFlow는 기존 예제를 재사용했고, 게임은 외부 연결지도 준비가 필요하며, 매거진은 자료 수집과 실제 AI 호출을 포함합니다. 조건이 다르므로 세 모델의 속도 비교나 일반적인 생산성 배수를 주장할 수 없습니다. 수강생의 학습·이해 시간도 포함하지 않습니다.

## 수업에서 보여주는 순서
1. 프롬프트의 포함·제외·완료 조건을 읽습니다.
2. 실제 중간 응답에서 불확실성과 실패가 어떻게 드러났는지 확인합니다.
3. 완료 응답을 읽고 데모를 직접 조작해 주장과 결과를 비교합니다.
4. 단계별 시간과 재사용 범위를 보고 자신의 프로젝트 계획을 수정합니다.

[원본 기록 안내](https://github.com/TheMagicTower/korean-ai-dev-course/tree/main/docs/execution/2026-09-23) · [계산 근거](https://themagictower.github.io/korean-ai-dev-course/docs/execution/2026-09-23/timings.json)

각 데모의 실제 모델 연결·저장 범위·미구현은 해당 화면과 README를 따릅니다. 초파리 부분회로 실험을 생물학적 전뇌 지능으로, 브라우저 편집 프리뷰를 외부 뉴스 자동 발행 서비스로 표시하지 않습니다.
