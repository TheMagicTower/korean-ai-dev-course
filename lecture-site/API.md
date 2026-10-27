# 과제 제출·평가 API

강의 자료는 공개하며 제출물·평가·피드백은 학생 본인과 강사에게만 제공합니다. 학생은 이름 또는 별명으로 시작하고 128비트 무작위 제출 확인 코드를 한 번 발급받습니다. 이메일·학번은 필수가 아닙니다. 확인 코드를 잃으면 스스로 복구할 수 없으므로 학생 화면에서 코드 저장을 안내해야 합니다. 코드는 비밀번호와 같으므로 공유하지 않습니다.

## 실행 준비

- D1 바인딩 이름: `DB`.
- 정적 파일 바인딩 이름: `ASSETS`.
- Worker secret: `ADMIN_PASSWORD`. 미설정 시 강사 로그인이 503으로 차단됩니다.
- 선택 변수: `REGISTER_LIMIT_PER_HOUR`(기본 100). 같은 강의실 공인 IP를 사용하는 수강생을 고려한 가입 제한입니다.
- `migrations/0001_init.sql`을 로컬·배포 대상 D1에 각각 적용합니다.
- 모든 경로에 Worker의 보안 헤더가 적용되도록 Static Assets의 `run_worker_first`를 설정합니다.

## 공통 규칙

요청·응답은 JSON입니다. POST·DELETE에는 현재 사이트와 같은 `Origin` 헤더가 필요합니다. POST는 `Content-Type: application/json`과 최대 32KiB 본문을 받습니다. 오류는 `{ "error": "사용자에게 보여줄 설명" }` 형태입니다. 인증 정보는 HttpOnly, SameSite=Strict 쿠키에 저장됩니다. HTTPS에서는 Secure 및 `__Host-` 접두사를 사용합니다. 학생 세션은 14일, 강사 세션은 8시간 동안 유지됩니다.

학생 확인 코드와 세션 토큰은 데이터베이스에 SHA-256 해시로만 저장합니다. 강사 비밀번호는 Cloudflare secret으로 관리하며 저장소·데이터베이스·내보내기에 포함하지 않습니다. 강사 로그인은 IP별 10회/10분, 학생 로그인은 IP와 확인 코드 조합별 10회/10분으로 제한하며 학생 로그인 전체에도 IP별 500회/10분 상한을 둡니다. IP는 원문으로 저장하지 않습니다.

## 경로

| 메서드·경로 | 입력 | 결과 |
|---|---|---|
| `GET /api/health` | 없음 | `{ok,service,database}` |
| `POST /api/student/register` | `{name}` | `{student:{id,name},recoveryCode}`; 학생 쿠키 설정 |
| `POST /api/student/login` | `{code}` | `{student:{id,name}}`; 학생 쿠키 설정 |
| `POST /api/student/logout` | 없음 | `{ok:true}`; 세션 폐기 |
| `GET /api/student/me` | 학생 쿠키 | `{student,submissions}` |
| `POST /api/submissions` | 아래 제출 형식 | `{submission}`; 최초 201, 수정 200 |
| `GET /api/submissions/:id` | 학생 쿠키 | 본인 제출물의 `{submission,versions,reviews}` |
| `POST /api/admin/login` | `{password}` | `{admin:true}`; 강사 쿠키 설정 |
| `POST /api/admin/logout` | 없음 | `{ok:true}`; 세션 폐기 |
| `GET /api/admin/me` | 강사 쿠키 | `{admin:true}` |
| `GET /api/admin/submissions` | 강사 쿠키 | `{submissions,stats}` |
| `GET /api/admin/submissions/:id` | 강사 쿠키 | `{submission,versions,reviews}` |
| `POST /api/admin/submissions/:id/review` | 아래 평가 형식 | `{review}`; 201 |
| `GET /api/admin/export` | 강사 쿠키 | 학생 표시명·제출물·버전·평가 JSON 다운로드 |
| `DELETE /api/admin/students/:id` | 강사 쿠키 | 해당 학생, 세션, 제출물, 평가 모두 삭제 |

학생·강사 API 응답은 `Cache-Control: no-store, private`입니다. 인증 없는 개인 자료 요청은 401, 타인의 제출물은 404입니다. 목록은 이 강의 전체 제출물을 반환하므로 학기 단위의 소규모 강의를 대상으로 합니다.

## 제출 형식과 버전

```json
{
  "assignment": 0,
  "title": "공원에서 함께 배우는 지역 게임",
  "body": "누구의 어떤 문제를 어떻게 해결하는지 구체적으로 작성합니다.",
  "projectUrl": "https://example.com/",
  "repositoryUrl": "https://github.com/example/project",
  "dataUrl": "https://www.data.go.kr/data/15012890/standard.do",
  "expectedVersion": 0
}
```

- 과제는 정수 0~5입니다. 0교시 사전 과제와 1~5회차 과제입니다.
- 제목 1~200자, 본문 10~16,000자입니다. 세 URL은 생략하거나 빈 문자열로 보낼 수 있습니다. 입력하면 HTTPS URL이어야 합니다.
- 한 학생은 과제별 제출물 하나를 가지며 수정할 때 버전이 증가합니다. 새 제출의 `expectedVersion`은 0 또는 생략, 수정은 현재 버전이 반드시 필요합니다.
- 버전이 다르거나 동시에 제출하면 409를 반환합니다. 화면에서 최신 내용을 다시 불러오도록 안내해야 합니다. 사용자 편집 내용을 임의로 덮어쓰지 않습니다.
- SQLite 트리거가 제출 변경과 같은 트랜잭션에서 버전 기록을 남깁니다. 재제출하면 상태는 `submitted`로 바뀌며 이전 버전의 평가 기록은 보존합니다.

`submission` 응답은 다음 필드를 가집니다.

```text
id, studentId, studentName, assignment, title, body,
projectUrl, repositoryUrl, dataUrl, version, status,
createdAt, updatedAt, review
```

`review`는 현재 제출 버전에 대한 최신 평가이며 없으면 `null`입니다. 이전 평가는 상세 응답의 `reviews`에서 확인합니다. 본문·이름·피드백은 일반 텍스트이므로 프런트엔드는 `textContent` 또는 HTML 이스케이프를 사용해야 합니다. 사용자 입력을 `innerHTML`로 직접 넣지 않습니다. 외부 링크에는 `rel="noopener noreferrer"`를 적용합니다.

## 평가 형식

```json
{
  "version": 1,
  "status": "revision_requested",
  "scores": {"problem":18,"ux":21,"engineering":17,"verification":17,"reflection":12},
  "feedback": "도움받는 사용자를 구체화했습니다. 실제 사용자 한 명과 확인해 주세요."
}
```

상태는 `reviewed` 또는 `revision_requested`입니다. 점수는 아래 기준에 맞는 정수로 입력하며 서버가 총점을 계산합니다. 아이디어 단계 등의 정성 평가에는 `scores`를 생략하거나 `null`로 보낼 수 있습니다. 피드백은 1~8,000자입니다. 평가 대상 버전이 최신 버전과 다르면 409를 반환합니다. 평가 삽입과 상태 갱신은 D1 batch 트랜잭션에서 처리합니다.

| 키 | 평가 기준 | 배점 |
|---|---|---|
| `problem` | 사용자 문제와 긍정적 가치 | 20 |
| `ux` | 핵심 흐름과 사용 가능한 결과물 | 25 |
| `engineering` | 검증과 데이터의 신뢰 범위 | 20 |
| `verification` | 피드백에 따른 개선 | 20 |
| `reflection` | AI 활용과 본인의 판단 설명 | 15 |

`review` 응답: `{id,version,status,scores,total,feedback,createdAt}`.

`stats` 응답: `{total,students,submitted,reviewed,revision_requested}`. 학생 수는 과제를 한 번 이상 제출한 학생 수입니다.

## 검증

로컬 Worker와 D1을 준비한 뒤 `TEST_BASE_URL`과 `TEST_ADMIN_PASSWORD` 환경 변수를 설정하고 `node --test tests/api.test.mjs`를 실행합니다. 비밀번호를 명령행 인자나 로그에 넣지 않습니다. 테스트는 학생 두 명을 새로 만들고 격리·CSRF·입력 검증·동시 수정·평가·재제출·세션 복구·내보내기·로그인 제한을 실제 HTTP로 검증한 뒤 자신이 만든 학생만 삭제합니다.

API 검증과 별도로 실제 브라우저에서 사용자 입력의 HTML 이스케이프, 확인 코드 보관 안내, 피드백 열람, 모바일 화면, 키보드 조작을 확인해야 합니다. 보관 기간과 학기 종료 후 삭제 시점은 강의 운영자가 안내하고 관리합니다.
