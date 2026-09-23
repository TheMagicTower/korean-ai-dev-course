# 고도화 계획
PoC CSS와 제목/요약/근거, 승인 무효, 정정 이유 및 이전 호 보존 규칙을 Python으로 이식합니다. Django 인증·그룹 역할과 CSRF를 사용하며 Article/Edition/Audit/ImportRecord 테이블에 저장합니다. 각 변경은 원자 트랜잭션과 version 조건부 UPDATE로 충돌을 검출합니다. 공개 페이지는 immutable Edition만 읽습니다. 실제 NASA recorded 입력과 기존 JSON 상태를 검증 후 미승인 초안으로 가져옵니다. 백업은 SQLite backup API, 복구는 존재하지 않는 새 DB만 대상으로 합니다. 먼저 인증·발행/정정·중복·입력 검사를 작성하고 실패를 확인한 뒤 구현하며 실제 동시성/운영 명령을 검증합니다.
