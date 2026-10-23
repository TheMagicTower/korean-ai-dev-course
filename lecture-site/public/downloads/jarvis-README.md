# 나만의 자비스 · 공공데이터 아이디어 도우미

주제가 없는 학생은 **아이디어를 정리해 주는 작은 하네스**를 자신의 MVP로 만듭니다. 사용자가 불편을 입력하면 계획 → 분석 → 형식 검증 → 사람 검토 → 완료를 보여 줍니다. 공공데이터를 이미 조회했다고 주장하지 않으며, 데이터를 찾을 질문과 검증 기준을 만듭니다.

하네스는 모델을 둘러싼 실행 구조입니다. 이 키트의 핵심은 캐릭터 수나 프롬프트 길이가 아니라 **작업 상태, 제한된 권한, 실패 처리, 사람의 확인, 남는 실행 기록**입니다. 2.5D 오피스는 이 상태를 보여 주는 창입니다.

## 5분 안에 실행합니다

Node.js 22 이상과 함께 설치되는 npm이 필요합니다. 아직 없다면 [Node.js 공식 다운로드](https://nodejs.org/en/download)에서 운영체제에 맞는 LTS 설치 파일을 설치합니다. 설치 후 터미널을 다시 열고 `node --version`이 v22 이상인지, `npm --version`이 출력되는지 확인합니다. 다운로드한 키트 폴더에서 실행합니다.

```sh
node --version
npm --version
npm start
```

브라우저에서 **http://127.0.0.1:4318** 을 엽니다. 기본 `mock` 모드는 설치 패키지·로그인·API 키·모델 호출 비용 없이 동작합니다. 한 가지 불편을 입력하고, `작업 시작 → 결과 검토 → 완료 → 실행 기록 JSON 저장`을 수행합니다. JSON은 강의 홈페이지의 2.5D 오피스에서 가져올 수 있습니다. 모형 기록에는 `source: "simulation"`이 표시됩니다.

실패도 실습합니다. `연결 실패 재현`을 선택하고 실패 메시지를 확인한 뒤, 결과 초안이 없어도 실행 기록 JSON을 저장합니다. 새 작업으로 재시도할 수 있어야 합니다. 종료는 터미널에서 `Ctrl+C`입니다. 서버 기록은 메모리에만 보관하므로 종료 전에 JSON을 저장합니다.

## 구독과 연결 방식은 구분합니다

2026-10-23 확인한 공식 문서를 기준으로 합니다. 수업 전 자신의 플랜·한도·학교 계정 정책을 다시 확인합니다.

| 경로 | 기존 구독 활용 | 연결 방법 | 이 키트의 표기 |
|---|---|---|---|
| Codex SDK | Codex를 사용할 수 있는 ChatGPT 계정의 로컬 로그인 | 실습 전용 Codex 인증 후 로컬 SDK 실행 | `local-sdk` |
| Claude 구독 화면 또는 Claude Code | 사용자가 자신의 화면에서 직접 실행 | 프롬프트 복사 → JSON 응답 붙여 넣기 | `manual-import` |
| Claude Agent SDK | Claude 앱 로그인/한도와 API 사용은 별개 | 별도 Anthropic API 키와 API 크레딧/과금 | `local-sdk` |
| 모형 | 필요 없음 | 고정 응답과 실패 시나리오 | `simulation` |

Claude Max·Team은 자격을 충족하면 Console에 연결해 월별 API 크레딧을 받을 수 있습니다. **자동으로 API 인증이 되는 것은 아니며, Pro는 이 크레딧 대상이 아닙니다.** 크레딧 수령 여부·잔액·과금 설정을 먼저 확인합니다. Claude Agent SDK에 claude.ai OAuth 토큰을 복사해 넣는 방법은 제공하지 않습니다.

Codex SDK와 OpenAI Agents SDK도 다른 제품입니다. 여기서는 로컬 Codex 스레드를 다루는 `@openai/codex-sdk`를 사용합니다. ChatGPT 구독을 일반 OpenAI API의 무제한 이용권으로 설명하지 않습니다. 계정/플랜 정책으로 로컬 SDK 로그인이 안 되면 모형·수동 경로로 동일한 실습을 완수합니다.

## Codex SDK 연결 — 선택 실습

본인 컴퓨터에서만 실행합니다. 공개 웹 서버·공유 교실 계정에 개인 인증을 넣지 않습니다. Codex CLI가 준비되어 있어야 합니다. 아직 설치하지 않았다면 Node.js/npm 준비 후 다음 명령을 실행합니다. [Codex CLI 공식 설치 안내](https://learn.chatgpt.com/docs/codex/cli)에서 운영체제별 지원도 확인합니다.

```sh
npm install -g @openai/codex
codex --version
```

이미 Codex CLI가 있으면 재설치하지 않아도 됩니다. 이어서 키트 폴더에서 SDK와 실습 전용 설정을 준비합니다.

```sh
npm install @openai/codex-sdk@0.164.0
npm run setup:codex
```

마지막 명령이 운영체제별 로그인 명령을 출력합니다. 예를 들어 macOS/Linux/WSL에서는 다음과 같습니다.

```sh
CODEX_HOME="$PWD/.jarvis-auth/codex" codex login
CODEX_HOME="$PWD/.jarvis-auth/codex" codex login status
npm run start:codex
```

`setup:codex`는 실습 폴더 안에 별도 설정을 만듭니다. 기존 개인 Codex 설정·MCP·hooks·인증을 복사하지 않습니다. 로그인은 공식 브라우저 흐름을 사용하며 SDK만 로컬 인증을 읽습니다. 브라우저 UI는 토큰을 받지 않습니다. 읽기 전용 sandbox, 셸·앱·hooks·멀티 에이전트·플러그인 비활성화, 웹 검색 비활성화 상태로 한 번의 텍스트 분석을 요청합니다.

SDK가 제공하는 기본 모델을 사용합니다. 자신의 계정에서 지원하는 모델을 지정하려면 시작할 때 `JARVIS_CODEX_MODEL`을 설정합니다. 지원하지 않는 이름을 넣으면 실패로 표시합니다. 모델 이름이나 권한을 브라우저 입력으로 바꾸지 않습니다.

## Claude 구독만으로 실습합니다 — 수동 경로

```sh
npm run start:manual
```

1. 주제를 입력합니다.
2. 생성된 프롬프트를 본인의 Claude 또는 Claude Code 화면에 붙여 넣습니다.
3. 반환된 JSON 객체만 복사합니다. 인증 정보나 대화 전체를 복사하지 않습니다.
4. `JSON 가져오기`에 붙여 넣고 형식 검증 결과를 확인합니다.
5. 요구사항을 검토하고 완료합니다.

이 경로는 **SDK 자동 연결이 아닙니다.** 자신의 구독을 활용해 하네스의 입력·출력 계약과 사람 검토를 먼저 완성하는 경로입니다. 자동 연결 여부와 관계없이 같은 검증 기준으로 제출합니다.

## Claude Agent SDK — API 키가 있는 경우의 선택 실습

```sh
npm install @anthropic-ai/claude-agent-sdk@0.3.309
npm run start:claude
```

시작 전에 터미널 환경에 `ANTHROPIC_API_KEY`를 설정합니다. 키는 브라우저·소스코드·과제 제출물에 쓰지 않습니다. 키가 없으면 명확한 안내와 함께 실패합니다. Claude 구독 OAuth로 자동 대체하지 않습니다. SDK의 기본 모델 또는 `JARVIS_CLAUDE_MODEL`로 지정한 사용 가능한 모델을 사용합니다.

모든 built-in 도구와 MCP·사용자/프로젝트 설정 로딩을 끄고 API 텍스트 분석만 허용합니다. 최대 2턴, SDK 예산 상한 0.25달러, 앱 시간 제한 120초입니다. SDK 예산 상한은 공급자의 최종 청구액 보증이 아니므로 Console의 프로젝트 지출 한도도 별도로 설정합니다.

## 20시간 과정에서의 대체 산출물

수업 시간을 추가하지 않습니다. 공공데이터·테스트의 공통 설명과 시연은 함께 듣고, 각 실습 시간에는 원래 프로젝트와 자비스 트랙 중 하나를 선택합니다. 두 트랙의 과제를 모두 수행하지 않습니다. 홈페이지의 실습별 대체 산출물 표에 따라 같은 시간 안에 자비스 결과물을 완성합니다.

| 회차 | 자비스 트랙 산출물 | 확인 질문 |
|---|---|---|
| 1회차 · 문제와 MVP | 누구의 어떤 생각 정리를 도울지 한 문장, 하네스가 하지 않을 일 | 사용자가 혼자 다시 쓸 이유가 있습니까? |
| 2회차 · UX와 데이터 | 입력 → 상태 → 검토 → 완료 화면, 데이터 존재 확인 체크리스트 | 처음 온 사용자가 작업을 시작할 수 있습니까? |
| 3회차 · AI 개발 환경 | mock·manual·지원되는 SDK 중 선택 어댑터, JSON 계약 | 연결 실패와 실제 분석을 구별할 수 있습니까? |
| 4회차 · 검증 | 실패·시간 초과·잘못된 JSON·취소·사람 검토 테스트 | 실패가 완료로 보이지 않습니까? |
| 5회차 · 공개와 운영 | 공개 소개/모형 데모 URL, 로컬 실행 ZIP/README, 기록 JSON | 다른 사람이 새 폴더에서 실행할 수 있습니까? |

최소 제출물: **본인만의 도움 한 가지 + 상태 5단계 이상 + 실패 재현 1개 + 사람 검토 + 테스트 결과 + 실행 기록 + 재현 가능한 실행 안내**입니다. 모형만 제출했다면 실제 SDK 연동이라고 쓰지 않습니다. 로컬 주소를 공개 서비스 URL이라고 제출하지 않습니다. 다른 사람이 이용하는 MVP는 공개 소개/모형 데모와 설치 가능한 로컬 앱을 묶어 전달합니다.

## 오피스 연결 계약

`GET /api/tasks/:id/export`와 UI의 저장 버튼은 다음 형식을 만듭니다. **JSON 가져오기**를 통해 공개 오피스에 기록만 전달합니다. 공개 사이트가 개인 컴퓨터의 SDK 실행 서버에 직접 연결하지 않습니다.

```json
{
  "title": "공공시설 접근성 아이디어",
  "provider": "mock",
  "source": "simulation",
  "state": "review",
  "events": [
    {"at":"2026-10-23T00:00:00.000Z","stage":"plan","status":"running","message":"문제를 정리합니다.","taskState":"planning"},
    {"at":"2026-10-23T00:00:01.000Z","stage":"execute","status":"running","message":"초안을 만듭니다.","taskState":"working"},
    {"at":"2026-10-23T00:00:02.000Z","stage":"review","status":"waiting_approval","message":"사람이 확인합니다.","taskState":"review"}
  ],
  "result": {"...":"실제 결과는 contract.mjs의 스키마를 따릅니다."}
}
```

허용 stage: `plan`, `execute`, `review`, `done`. 상태: `running`, `waiting_approval`, `failed`, `completed`. 원래 작업 상태는 `taskState`에 따로 보관합니다. 모형 결과·사용자 반입·실제 SDK 응답의 출처는 `source`로 구분합니다. UI에서 쓰는 텍스트는 `textContent`로 표시하며 모델 문자열을 HTML이나 명령으로 실행하지 않습니다.

## 코드 읽는 순서와 검증

```sh
npm test
```

- `contract.mjs`: 입력 프롬프트와 출력 JSON 계약, 검증 함수입니다.
- `server.mjs`: 작업 1개 제한, 상태 전이, 사람 검토, API·Origin 검증입니다.
- `adapters.mjs`: mock와 각 SDK의 정책을 한곳에서 확인합니다.
- `runner.mjs`, `provider-worker.mjs`: 실제 SDK를 별도 프로세스에서 실행하고 취소·시간 초과에 중단합니다.
- `ui/`: 로컬 입력·진행·검토 화면입니다.
- `test/harness.test.mjs`: 상태 전이·실패·시간 제한·권한 설정을 검증합니다.

테스트는 **실제 유료 모델을 호출하지 않습니다.** 실제 SDK 연결은 각 학생이 본인 계정으로 실행해 확인합니다. 키트 작성 시 공식 문서와 배포 패키지의 타입 선언은 확인했지만, 현재 설치된 모든 OS·플랜에서 라이브 실행이 성공했다고 보장하지 않습니다.

보호 범위: `127.0.0.1`만 listen, 정확한 Host/Origin 검사, CORS 미허용, JSON 16KB 제한, 주제 1000자 제한, 최근 기록 20개, 동시 작업 1개, 120초 제한, HTML 실행 방지, 비밀값을 응답에 포함하지 않는 오류 처리입니다. 외부 메시지·메일·파일 쓰기·배포 도구는 제공하지 않습니다. 검토 완료는 요구사항 승인일 뿐 외부 실행 승인으로 연결되지 않습니다.

## 확인한 공식 문서

확인일: 2026-10-23. SDK 패키지 타입 확인: `@openai/codex-sdk@0.164.0`, `@anthropic-ai/claude-agent-sdk@0.3.309`.

- [Codex SDK](https://learn.chatgpt.com/docs/codex-sdk): Node의 로컬 Codex 스레드 제어와 설정 오버라이드입니다.
- [Codex 인증](https://learn.chatgpt.com/docs/auth): ChatGPT 구독 로그인과 API 키 과금, 로컬 인증 저장을 구분합니다.
- [Codex 설정 참조](https://learn.chatgpt.com/docs/config-file/config-reference): 셸·앱·hooks·검색 및 권한 설정입니다.
- [Claude Agent SDK 개요](https://code.claude.com/docs/en/agent-sdk/overview): SDK 제품 인증과 claude.ai 로그인 제한입니다.
- [Claude Agent SDK Quickstart](https://code.claude.com/docs/en/agent-sdk/quickstart): 설치와 API 인증입니다.
- [Claude Agent SDK 권한](https://code.claude.com/docs/en/agent-sdk/permissions): 도구 허용·거부와 권한 모드입니다.
- [Claude Max·Team API 크레딧](https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers): 대상 플랜과 Console 연결, 크레딧 사용 조건입니다.
