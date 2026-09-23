# PoC 재사용 및 이식 기록
- `projects/signal-magazine/style.css`: 전체 복사 유지. 종이색·녹색 편집국, 원문 sidebar와 편집 카드 및 반응형 레이아웃을 재사용했습니다.
- `model.js`: 제목·요약·근거 검사, 수정 후 승인 무효, 발행 전 승인, 정정 사유, 이전 호 보존 규칙을 `magazine/domain.py`로 Python 이식했습니다. 서비스용 역할·DB 트랜잭션·version 증가 및 idempotency 규칙을 추가했습니다.
- `app.js`: 원문/AI 기록/주장·근거 표시와 저장/보류/승인/발행 흐름을 Django template과 `static/desk.js`로 이식했습니다. localStorage 저장·전체 초기화·클라이언트 승인 권한은 폐기했습니다.
- `index.html`: 편집국 정보 구조를 한국어 Django template으로 이식했습니다. 공개 목록과 로그인 화면을 분리했습니다.
- `data.json`, `evidence/model-run.json`, `evidence/agent-draft.json`: 원본은 수정하지 않았습니다. 공통 fixture 및 원래 `data.json` 또는 브라우저 localStorage 내보내기를 `ingest_recorded`로 읽을 수 있습니다. 원문 발췌 해시와 AI provenance는 보존하며 모든 import는 새 미승인 초안으로 시작합니다. 과거 로컬 승인·발행은 권위가 없으므로 공개하지 않습니다.
- `test.cjs`: 근거 누락/미승인 발행/중복/정정/승인 무효 시나리오를 Django 테스트로 이식하고 역할·CSRF·동시성·DB 검사를 추가했습니다.
- `prepare.py`, `evidence/record.py`: 외부 수집/분류 실행은 범위 밖이어서 폐기했습니다. 기록된 입력만 사용합니다.
- `README.md`: 서비스 운영·복구·배포 절차로 새로 작성했습니다.

JS→Python 포팅, DB 모델링 및 인증 연결 시간은 모두 고도화 경과에 포함합니다. CSS 외에 기존 JS를 서버에서 직접 실행하지 않습니다. 원본 PoC는 변경하지 않았습니다.
