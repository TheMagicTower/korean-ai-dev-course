# MAKE FOR GOOD · 강남대 AI 소프트웨어 엔지니어링

공개 주소: https://kangnam-ai-engineering.jih7hc.workers.dev

20시간 강의 홈페이지, 인터랙티브 HTML 슬라이드, 공공데이터 실습, 학생 과제 제출과 강사 평가를 함께 제공합니다.

## 화면

| 주소 | 기능 |
| --- | --- |
| `/` | 강의 소개와 학습 경로 |
| `/prework/` | 0교시 아이디어 카드, 브라우저 임시 저장·다운로드·제출 화면 연결 |
| `/course/` | 5회×4시간·4회×5시간 진행안, 실습, 과제, 평가 기준 |
| `/slides/` | 회차 선택, 키보드 이동, 목차, 발표 노트, 전체 화면, 확대 이미지, 인터랙티브 예시 |
| `/data/` | 공식 공공데이터 8개 분야와 아이디어 |
| `/demo/` | 실제 용인시 도서관 27개 기록 검색·후보 저장·가상 사용자 시나리오 |
| `/assignments/` | 확인 코드 로그인, 회차별 제출·수정, 평가·피드백 이력 |
| `/instructor/` | 강사 로그인, 제출물 검색·필터, 루브릭 평가, 피드백, 내보내기·삭제 |
| `/privacy/` | 저장 정보, 접근 범위, 확인 코드, 삭제 안내 |

## 개발과 검증

Node.js 22 이상을 사용합니다. Wrangler는 package-lock.json에 고정합니다.

```sh
npm ci
npm run build
npx wrangler d1 migrations apply kangnam-ai-course --local
# .dev.vars에 ADMIN_PASSWORD를 준비합니다. 이 파일은 Git에서 제외됩니다.
npm run dev
```

```sh
npm run check
npm run test:isolated
# TEST_ADMIN_PASSWORD는 셸 이력에 남기지 않고 환경에서 전달합니다.
npm run test:api
npx wrangler deploy --dry-run
```

테스트는 자신이 생성한 학생을 종료 시 삭제합니다. `TEST_BASE_URL`로 검증 환경을 선택합니다. 기본은 `http://localhost:8787`입니다. 운영 환경 테스트도 고유한 테스트 학생만 사용하며, 기존 학습자의 자료는 수정하지 않습니다.

## Cloudflare 배포

새 Worker `kangnam-ai-engineering`과 D1 `kangnam-ai-course`를 사용합니다. 기존 저장소의 8시간 교재와 배포는 변경하지 않습니다. Wrangler 계정과 리소스 ID는 wrangler.jsonc에 있습니다.

```sh
npm run build
npx wrangler d1 migrations apply kangnam-ai-course --remote
npx wrangler secret bulk private/secrets.json
npm run deploy
```

`private/secrets.json`, `.dev.vars`, `private/강사-로그인.txt`는 공개·커밋 대상이 아닙니다. 강사 비밀번호를 변경할 때는 `npx wrangler secret put ADMIN_PASSWORD`의 입력 프롬프트를 사용합니다. 코드·명령 인자·로그에 비밀번호를 넣지 않습니다. 로컬 파일만 바꾸면 운영 비밀번호는 바뀌지 않습니다.

배포 후 공개 페이지와 `/api/health`를 확인하고, 학생 제출→강사 평가→학생 피드백 재조회→재제출을 검증합니다. 배포 성공만으로 서비스 동작을 확인했다고 기록하지 않습니다.

## 강사 운영

1. 수업 전에 강사 화면에 로그인합니다. 비밀번호는 로컬 비공개 안내 파일에서 확인합니다.
2. 학생에게 공개 홈페이지와 0교시 주소를 공유합니다. 학생의 확인 코드는 강사가 보관하지 않습니다.
3. 초기 과제는 점수 없이 서술형 피드백을 남길 수 있습니다. 최종 평가 기준은 20/25/20/20/15점입니다.
4. 학생이 새 버전을 제출하면 기존 평가는 이력에 남습니다. 현재 버전에 대한 평가만 현재 점수로 표시합니다.
5. 종료 후 자료 보관 기간을 학생에게 안내합니다. 내보내기 파일도 비공개로 관리합니다. 삭제 요청은 본인을 확인한 후 처리합니다.

## 자료 수정

- `content/workshop.json`: 시간표·실습·과제·루브릭·교수자 노트
- `content/slides.json`: 슬라이드 문구·발표 노트·공식 출처
- `content/data-catalog.json`: 공식 데이터셋과 아이디어
- `public/data/libraries.json`: 실제 공개데이터의 교육용 스냅샷
- `content/data-provenance.md`: 수집·변환·이용 조건 근거

수정 후 `npm run build`로 공개 콘텐츠를 갱신합니다. 강의 예시와 가상 사용자 시나리오의 결과는 실서비스의 품질이나 실제 사용자 만족도 증거로 사용하지 않습니다. 도서관 데이터의 수집일은 2026-10-22지만 기록 기준일은 2024-11-20입니다.

## 범위

강의 자료는 공개, 과제와 평가는 본인과 강사에게 비공개로 제공합니다. 현재 글과 HTTPS 링크 제출을 지원합니다. 첨부 파일 업로드, 이메일 알림, 학교 SSO는 포함하지 않습니다. 확인 코드를 분실한 학생에게 이름만으로 접근을 허용하지 않습니다. 강사가 본인 확인 후 삭제·재시작 등 처리 방법을 안내합니다.

직접 배포한 Cloudflare Worker입니다. GitHub 푸시의 자동 운영 배포는 설정하지 않았으며, 위 명령으로 명시적으로 재배포합니다.
