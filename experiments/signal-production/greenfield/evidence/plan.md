# 신규 구현 계획

승인된 공통 서비스 계약을 따릅니다. 기존 PoC·고도화 코드·UI는 열람하지 않습니다.

- Django 세션과 editor/publisher 그룹, 로컬 SQLite를 사용합니다. Article은 현재 초안·버전·승인 revision을 보관하고 Edition은 불변 공개 스냅샷을 보관합니다. Audit은 별도 append 이력입니다.
- 모든 변경은 원자 트랜잭션과 버전 비교를 거칩니다. 발행 key는 전역 고유값이며 같은 요청 재시도만 같은 Edition을 반환합니다. SQLite 잠금은 409로 재시도 안내합니다.
- 근거는 HTTPS NASA 주소·길이·해시·claim 연결을 검증합니다. 입력 AI 기록은 보관하되 승인권한과 상태를 가져오지 않습니다.
- 공개 지면 /, 운영자 로그인, 한국어 편집국(기사 목록/편집 폼/승인·보류·발행)을 서버 API에 연결합니다. 출처와 recorded-run 한계를 공개합니다.
- 계약 검사를 먼저 실패시키고 구현 후 권한/CSRF/동시성/정정/중복 요청/백업복구/배포 설정을 검사합니다. 실제 Gunicorn 서버와 브라우저 검증은 루트와 연결합니다.
- 온라인 SQLite backup, 새 DB로만 restore, disposable DB migration 및 코드 rollback 연습을 제공합니다. 외부 HTTPS/DNS·운영 승인·장기 soak는 미수행으로 남깁니다.
