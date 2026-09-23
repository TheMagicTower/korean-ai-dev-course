신규 구현 경로를 최초 인계합니다.

- 구현: Django API·한국어 편집국·공개 발행 지면, 세션/역할/CSRF, 버전 충돌, 승인·보류·정정·불변 발행본, 중복 발행 방지, AI 입력 import, 운영자 발급, 백업·새 DB 복구 명령.
- 검증: Django 테스트 10개 통과. 실제 두 스레드 수정 200/409, 동시 발행 201/200 및 단일 Edition, 온라인 백업/복구 전체 테이블 일치, disposable schema/release rollback, production 배포 검사 통과.
- 수정: 보류 내부 메모의 공개 정정 사유 혼입, 비문자열 근거 ID의 500 응답, 알 수 없는 API 경로의 HTML 오류 응답을 수정했습니다.
- 실행: config.wsgi:application, 루트 지정 8872 포트. 최신 코드 사용 전 manage.py migrate(0002) 및 Gunicorn 재시작이 필요합니다. 기존 시험 발행본은 불변이므로 보류 사유 재검증은 새 DB/기사로 수행하십시오.
- 증거: evidence/tests.txt, operations.txt, self-review.md, events.jsonl. 운영 절차는 README.md에 있습니다.

공통 브라우저/HTTP 최종 검증은 루트가 수행하며 외부 HTTPS/DNS·운영 책임·복구 목표·장기 soak는 미완료입니다. 공개 운영 출시 완료는 아닙니다.
