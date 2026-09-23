# 최초 인계 자체 검토

- 계약 입력과 fixture 이외 기존 PoC/upgrade 구현·테스트·UI는 읽지 않았습니다.
- Article, Edition, Audit 및 로그인 실패 저장소를 분리했습니다. 상태 변경과 발행본/감사 기록은 하나의 SQLite IMMEDIATE 트랜잭션으로 처리합니다.
- API의 editor/publisher 경계·익명 초안 차단·자기 승인 차단·세션/CSRF·미승인/철회/수정 후 발행 차단·버전 충돌·idempotency 충돌·정정/이전 snapshot을 시험했습니다.
- 입력 hash·NASA HTTPS allowlist·길이/필수 근거·JSON 형식·과대 요청·출력 HTML escape 검사를 포함합니다. 잘못된 evidenceId의 비문자열이 500으로 응답하던 것을 400으로 수정했습니다. 알 수 없는 API 경로도 JSON 404로 응답하도록 실패 재현 후 수정했습니다.
- 최초 구현의 보류 사유가 correction_reason을 덮어쓰던 문제가 자체 검토와 루트 브라우저 확인에서 발견됐습니다. Audit에만 저장하도록 수정했습니다. 최초 발행에 내부 메모가 없고 이미 작성한 정정 이유는 보류 후에도 유지되는 테스트가 통과했습니다. 이전 잘못된 시험 발행본은 불변 데이터이므로 루트 재검증은 새 시험 DB/기사로 수행해야 합니다.
- Edition UPDATE/DELETE 금지 DB 트리거를 추가하고 우회 ORM 수정/삭제가 실패하는 테스트를 통과했습니다. 관리자 DB 접근 자체를 금지하는 보안 경계는 아니며 OS/DB 파일 운영 권한이 필요합니다.
- 파일 기반 실제 동시 수정은 [409,200], 같은 key 동시 발행은 [200,201]이고 Edition은 하나입니다. SQLite lock은 일반화된 409로 응답합니다. 부하 성능이나 장기 soak는 측정하지 않았습니다.
- SQLite online backup 후 존재하지 않는 새 목적지로 복구하여 모든 테이블·발행 snapshot 일치를 검증했습니다. 기존 목적지 restore를 거부하며 덮어쓰지 않습니다.
- disposable DB에서 0002 보호 트리거 migration만 역적용/재적용하고 전체 사용자 데이터 유지를 확인했습니다. 파괴적 initial schema rollback은 수행하지 않습니다.
- 로컬 복사 release에 503 health 장애를 삽입하고 정상 보관 release로 current symlink를 전환하여 200 복귀와 DB 동일성을 확인했습니다. 외부 배포 복구나 과거 실제 제품 release 복구가 아닌 장애 모의훈련입니다.
- production 환경 누락 fail-closed와 안전한 값 주입 후 check --deploy --fail-level WARNING 무경고를 검증했습니다. HTTPS/DNS/proxy·백업 보관·운영 담당·복구 목표 수락은 외부 출시 전 미완료입니다.
- 최종 독립 Django 테스트 10개 통과. 공통 Gunicorn/HTTP/브라우저 및 스크린샷은 루트 별도 증거에 연결합니다. 프로덕션 공개 출시 완료를 주장하지 않습니다.
