고도화 경로 구현과 자체 검증을 완료했습니다.

- Django API·한국어 편집국·공개 발행 화면, 편집자/발행자 권한, CSRF, 낙관적 동시성, 재시도 키, 정정·이전 호 보존을 구현했습니다.
- PoC CSS를 재사용하고 JS 도메인 규칙을 Python으로 이식했습니다. 기존 JSON 상태는 출처 해시와 AI 기록을 보존한 미승인 초안으로 가져옵니다. 파일별 근거는 reused.md입니다.
- 최종 migration은 0002_immutable_editions입니다. 공개 발행본의 UPDATE/DELETE를 SQLite 트리거로 차단합니다.
- 15개 테스트가 통과했습니다. 권한·CSRF·입력 오류·정정·승인 무효·idempotency·직접 DB 수정/삭제 거부·실제 스레드 동시 편집/발행을 포함합니다.
- SQLite online backup→새 DB 복구의 counts/snapshot 일치, 실제 Gunicorn 중지→복구 DB 경로 재기동 후 공개 HTML 일치, production check --deploy 경고 0, 잘못된 production 설정 fail-closed를 확인했습니다.
- 발견/수정: 동시성 테스트 로그인 준비 경합, XFrameOptionsMiddleware 누락, malformed evidenceId/URL 오류 처리, DB 직접 발행본 수정 경로. 실패와 재검증 출력은 evidence/tests.txt에 보존했습니다.

공통 서버/브라우저 검증은 루트가 새 DB와 8871 포트에서 수행합니다. 제가 띄운 8765 Gunicorn은 종료했습니다. 외부 HTTPS/DNS·운영 계정·실제 배포/장기 soak·후속 schema downgrade는 미측정이며 공개 운영 출시 완료를 주장하지 않습니다. README.md에 실행·환경·백업복구·릴리스 롤백과 미수행 운영 전제를 기록했습니다. 원본 PoC/다른 경로/루트 파일은 수정하지 않았고 커밋하지 않았습니다.
