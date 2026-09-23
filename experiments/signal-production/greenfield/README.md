# Signal Magazine — 독립 신규 구현

소규모 단일 편집국용 Django release candidate입니다. 기존 PoC 또는 고도화 구현을 열람·복사하지 않고 공통 계약과 `../shared/source-fixture.json`으로 작성했습니다. 독립성은 지시 기반이며 파일 접근 sandbox로 강제하지 않았습니다.

## 실행

Python 3.13.12, Django 5.2.17, Gunicorn 26.2.0, SQLite를 사용합니다. 새 환경에서는 `python -m venv .venv` 및 `pip install -r requirements.txt`로 설치합니다. 비교 실험 환경은 `/tmp/kdev-production-venv/bin/python`입니다.

```sh
export SIGNAL_ENV=local
export SIGNAL_DB="$PWD/.runtime/local.sqlite3"
export SIGNAL_ALLOWED_HOSTS=localhost,127.0.0.1
mkdir -p .runtime
python manage.py migrate
# 안전한 별도 입력으로 SIGNAL_OPERATOR_PASSWORD를 환경변수에 주입합니다.
python manage.py create_operator --username editor --role editor
python manage.py create_operator --username publisher --role publisher
unset SIGNAL_OPERATOR_PASSWORD
python manage.py ingest_recorded ../shared/source-fixture.json
python -m gunicorn config.wsgi:application --bind 127.0.0.1:8872 --workers 2 --threads 2 --timeout 30 --error-logfile -
```

계정 두 개에는 서로 다른 무작위 비밀번호를 주입하십시오. 계정 발급은 기존 계정을 덮어쓰지 않습니다. 런타임 계정·비밀번호·세션·DB·백업은 버전 관리에서 제외합니다. local 모드는 loopback host만 허용합니다. 기본 모드는 production이며 필수 설정이 없으면 시작을 거부합니다.

## 사용 흐름

1. `/accounts/login/`에서 편집자로 로그인하고 `/desk/`에서 기존 기록 초안을 선택하거나 새 기사를 작성합니다. 새 기사는 NASA 출처 제목·HTTPS 주소·발췌문 및 `주장 | nasa-1` 형식의 근거 연결을 입력합니다. SHA-256은 입력 발췌문으로 계산됩니다.
2. 초안 저장은 서버 DB에 반영됩니다. 수정 후에는 이전 승인이 무효화됩니다. 이미 발행한 기사는 정정 이유가 필수입니다.
3. 로그아웃한 뒤 다른 발행자 계정으로 들어가 제목·본문·근거·AI 기록을 확인하고 현재 버전을 승인합니다. 보류 이유는 내부 Audit에 남고 공개 정정 이유를 덮어쓰지 않습니다.
4. 발행하면 `/`와 `/editions/<id>/`에서 누구나 고정된 발행본을 읽을 수 있습니다. 정정 발행은 새 발행본을 만들고 이전 발행본을 유지합니다.

AI는 recorded-run 입력만 제공합니다. 라이브 생성·분류·예약 실행·자동 발행을 하지 않습니다. 서비스는 NASA 주소를 임의 fetch하지 않습니다. 근거 해시가 맞는다는 것은 발췌문 무결성 검사이며 의미적 사실 검증은 사람이 수행합니다.

## 상태·권한·동시성

Django 서버 세션과 CSRF, 비밀번호 해싱·validator, editor/publisher 그룹을 사용합니다. 실패 로그인은 계정/IP 조합별 10분 내 5회로 제한하고 10분 이후 재시도할 수 있습니다. X-Forwarded-For를 신뢰하지 않으므로 프록시 뒤에서는 관측 IP가 프록시 주소일 수 있습니다. 계정별 키가 함께 포함됩니다.

Article은 현재 초안입니다. 성공한 모든 수정·승인·보류·발행은 version을 증가시킵니다. 승인된 정확한 버전만 발행하며 편집자는 본인이 편집한 기사를 승인할 수 없습니다. SQLite `BEGIN IMMEDIATE` 트랜잭션에서 버전 검사→발행 스냅샷→감사 기록→상태 변경을 원자적으로 처리합니다. 오래된 버전 또는 DB 잠금 충돌은 409이며 최신 기사 조회 후 재시도해야 합니다. Edition은 DB 트리거로 UPDATE/DELETE를 차단하고 `(article, revision)`과 전역 idempotency key를 고유 제약으로 둡니다.

동일 key·article·version 재시도는 기존 Edition을 반환합니다. 다른 기사 또는 버전에서 key를 재사용하면 409입니다. 첫 발행 스냅샷에 내부 보류 메모를 공개하지 않습니다. 감사 이력은 actor/action/article/version/reason/at으로 저장됩니다. 사용자 내용·비밀번호·키를 오류 로그에 기록하지 않으며 예상하지 못한 API 오류는 일반 메시지와 고정 이벤트만 기록합니다.

## 검증

```sh
SIGNAL_ENV=local python manage.py test tests -v 2
SIGNAL_ENV=local python scripts/verify_operations.py
```

`evidence/tests.txt`: API 계약의 최초 실패, 구현 후 결과, 잘못된 evidenceId 및 불변 스냅샷 검사 실패와 수정, 최종 결과입니다. `evidence/operations.txt`: 파일 SQLite에서 실제 두 스레드 동시 수정(200/409), 같은 key 동시 발행(201/200·발행본 1개), online backup·새 DB 복구·전체 테이블 비교, schema rollback 및 release 디렉터리 rollback, production `check --deploy --fail-level WARNING`와 필수 환경 fail-closed 검증입니다. `evidence/events.jsonl`은 실제 UTC 공개 진행 기록입니다.

공통 HTTP·Gunicorn·한국어 브라우저 E2E와 스크린샷은 루트 비교 실행에서 별도로 검증합니다. 테스트 성공을 외부 출시나 장기 안정성 검증으로 표현하지 않습니다.

## 백업·복구 및 출시 rollback

```sh
# 실행 중인 원본 DB를 SQLite online backup API로 일관되게 백업합니다.
python manage.py backup_db /absolute/new/backup.sqlite3
# 서버를 멈춘 오프라인 상태에서 아직 존재하지 않는 목적지에 복구합니다.
SIGNAL_DB=/absolute/new/restored.sqlite3 python manage.py restore_db /absolute/new/backup.sqlite3
```

대상 파일이 이미 있으면 백업·복구는 거부됩니다. 백업은 0600 권한이며 DB와 동일하게 운영자 접근만 허용하십시오. 복구 후 테이블 건수·Edition snapshot·무결성을 확인하고 SIGNAL_DB를 새 DB로 전환한 뒤 서버를 시작합니다. 파일 복사는 WAL 상태에서 안전한 온라인 백업의 대체가 아닙니다. 운영 RPO/RTO는 아직 합의·측정하지 않았습니다.

출시 전 코드 release 디렉터리와 DB 백업을 함께 보관합니다. migration 계획을 읽고 백업 복구를 별도 DB에서 연습한 뒤 서버를 중지하여 배포합니다. 실패 시 호환되는 이전 release 디렉터리로 current 링크를 원자 전환하고 health/readiness를 확인합니다. DB 호환성이 없으면 복구 백업을 새 DB로 준비해 전환하며 백업 이후 데이터 손실 여부를 운영자가 판단해야 합니다. 초기 스키마를 지우는 `migrate news zero`는 운영 rollback 절차가 아닙니다.

검증 스크립트는 disposable DB에서 `0002 → 0001 → 0002`를 실제 실행하여 불변 보호 트리거만 제거·복원하고 데이터 유지 여부를 비교합니다. 이 동안 DB는 외부 서비스에 연결하지 않습니다. 별도로 의도적으로 health 503인 복사 release에서 보관된 정상 release로 링크를 전환하여 200 복귀 및 DB 동일성을 검증합니다. 이는 로컬 장애 모의훈련이며 외부 운영 배포 이력이나 실제 이전 제품 release 복구는 아닙니다.

## 외부 운영 전 미완료 조건

production에서는 무작위 50자 이상 SIGNAL_SECRET_KEY, 절대 SIGNAL_DB, 명시적인 SIGNAL_ALLOWED_HOSTS가 필수입니다. HTTPS redirect·Secure/HttpOnly 세션·Secure CSRF·HSTS·호스트 검증·클릭재킹 보호를 켭니다. 신뢰할 TLS 종료 구성을 실제 환경에서 확인해야 하며 임의 클라이언트의 forwarded 헤더를 신뢰하지 않습니다. 필요 시 운영 배포 설정에서 신뢰할 proxy 헤더를 별도 검토하십시오.

외부 DNS·HTTPS 인증서·호스트·전용 OS 계정·디스크 권한·프로세스 관리자·접근 로그/모니터링·백업 보관·운영 담당자·복구 목표 수락은 미완료입니다. 다중 고객·결제·회원가입·메일·라이브 AI·고가용성은 범위 밖입니다. 동시 편집자 최대 5명·기사 약 100개는 설계 목표이며 부하 목표 달성이나 장기 soak는 측정하지 않았습니다. 이 서버는 GitHub Pages에서 실행할 수 없습니다.
