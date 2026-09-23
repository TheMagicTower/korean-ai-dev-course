# Signal Magazine 고도화 서비스 RC

소규모 단일 편집국용 Django/SQLite 서비스입니다. 편집자 작성 → 발행자 근거 검토·승인 → 공개 발행, 보류·정정·이전 발행본 보존을 제공합니다. 기록된 AI 자료를 가져오며 외부 URL을 서버에서 호출하거나 실시간 AI 생성하지 않습니다. NASA 발췌문과 주장 간 의미 검증은 담당자의 책임입니다.

## 로컬 실행

Python 3.13.12, Django 5.2.17, Gunicorn 26.2.0으로 검증했습니다. 저장소 루트에서 이 디렉터리로 이동한 뒤 실행하세요.

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
export SIGNAL_ENV=local
export SIGNAL_DB="$(pwd)/signal.sqlite3"
.venv/bin/python manage.py migrate
.venv/bin/python manage.py ingest_recorded ../shared/source-fixture.json
# 비밀번호를 셸 기록에 쓰지 않도록 대화형으로 환경변수에 읽습니다.
read -s SIGNAL_OPERATOR_PASSWORD
export SIGNAL_OPERATOR_PASSWORD
.venv/bin/python manage.py create_operator --username editor --role editor
unset SIGNAL_OPERATOR_PASSWORD
# 같은 방법으로 서로 다른 비밀번호를 입력하고 publisher 계정을 생성합니다.
read -s SIGNAL_OPERATOR_PASSWORD
export SIGNAL_OPERATOR_PASSWORD
.venv/bin/python manage.py create_operator --username publisher --role publisher
unset SIGNAL_OPERATOR_PASSWORD
.venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8871 --workers 1 --threads 4 --no-control-socket
```

`http://127.0.0.1:8871/` 공개 목록, `/desk/` 편집국, `/accounts/login/` 로그인입니다. editor로 수정 후 로그아웃하고 publisher로 로그인하여 승인·발행합니다. 새로고침 없이 오래 열린 편집 화면의 저장은 409 충돌로 거부됩니다. 동시 SQLite writer 경합도 409 재시도 응답으로 처리합니다. 소규모 편집국(최대 5명 목표) 부하 한계는 측정하지 않았습니다.

## PoC 이전

`manage.py ingest_recorded <JSON 경로>`로 기존 `projects/signal-magazine/data.json`, 공통 fixture 또는 브라우저 `signal-magazine-v1` localStorage 값을 JSON으로 내보낸 파일을 가져옵니다. 원문 해시·AI 기록은 보존하고 기존 승인·발행은 신뢰하지 않아 새 미승인 초안만 만듭니다. 기존 editions/corrections는 공개 서비스로 자동 이전되지 않습니다. 기존 원본 JSON을 보존하여 과거 브라우저 기록의 별도 아카이브로 관리하세요. 정확히 같은 JSON은 중복 import하지 않습니다. 입력 64 KiB/제목 200/요약 5,000/근거 1~3/주장 1~20개, NASA HTTPS 호스트와 SHA-256을 검사합니다.

## API와 권한

Django 세션 쿠키와 CSRF token을 사용합니다. API 목록/상세도 운영자만 읽습니다. editor만 생성/편집, publisher만 승인/보류/발행할 수 있습니다. 본인이 편집한 기사는 승인할 수 없습니다. 모든 변경은 version 증가와 트랜잭션을 사용하며 stale version은 409입니다. 발행은 승인된 현재 버전만 가능하며 idempotency key 재요청은 같은 edition을 반환합니다. 같은 키를 다른 요청에 사용하면 409입니다. 공개 독자는 저장된 Edition snapshot만 봅니다. 편집 API는 원문의 sources/provenance를 바꾸지 않습니다. 수정에는 기존 claims를 함께 보내야 합니다.

## 검증

```sh
SIGNAL_ENV=local .venv/bin/python manage.py test tests -v 2
.venv/bin/python tests/ops_smoke.py
```

실제 결과와 실패 수정 이력은 `evidence/tests.txt`입니다. 15개 검사에는 실제 스레드 동시 수정·동시 발행을 포함합니다. 운영 검사는 임시 디스크 DB에서 migration, import, 역할 계정, 발행, 온라인 backup API, 새 DB 복구, counts+snapshot 비교, 새 Python 프로세스 조회, 안전한 production check, 잘못된 production 설정 거부를 수행합니다. 루트의 공통 HTTP/브라우저 검증은 별도 증거입니다.

## 운영 설정 및 출시 전 미수행 사항

`.env.example`의 형식으로 환경변수를 공급합니다. 기본 모드는 production이며 안전한 secret/절대 DB 경로/명시 hosts가 없으면 시작하지 않습니다. local은 loopback host만 허용하며 공개 서버에서 사용하지 마세요. production에는 HTTPS redirect, Secure/HttpOnly 세션, HSTS, 호스트 검증 및 clickjacking 방지가 켜집니다. 프록시 환경에서는 프록시가 TLS를 종료한 경우의 안전한 헤더 전달 정책을 별도로 검증해야 하며 현재 임의 `X-Forwarded-Proto`를 신뢰하지 않습니다. Django 애플리케이션은 동봉한 두 정적 자산만 고정 경로로 제공합니다.

배포 전에 실제 DNS/TLS, 방화벽, 서버 프로세스 감독·재시작, 개인별 운영자 계정/비밀번호, 디스크 용량·권한(서비스 OS 계정 전용 DB 디렉터리), 암호화 백업 저장소, RPO/RTO, 운영 책임자, 모니터링/알림을 설정하고 검증해야 합니다. HTTPS 리버스 프록시와 공개 운영은 이번 실험에서 수행하지 않았습니다. 장기 soak, 고가용성, 대규모 부하, 외부 발행·통신도 미측정입니다. 따라서 실제 공개 프로덕션 출시 완료를 뜻하지 않습니다.

`/healthz`는 생존, `/readyz`는 실제 Article 테이블 조회입니다. API 예외 로그는 action/article 식별자만 기록하며 요청 본문·키·비밀번호를 기록하지 않습니다. audit 테이블에는 actor/action/article/version/UTC 시간이 남습니다. 로그인은 계정/IP 조합별 10분 창에서 실패 5회 후 제한하며 영구 잠금이 아닙니다. 현재 잠금 기록 청소는 운영자가 주기적으로 관리해야 합니다.

## 백업·복구와 릴리스 롤백

1. 변경 전 현재 소스 릴리스 식별자와 migration 목록을 기록합니다. `manage.py backup_db /절대/새파일.db`는 SQLite online backup API로 일관 스냅샷을 만들며 기존 출력 파일을 덮어쓰지 않습니다. 파일 권한은 0600입니다.
2. 새 릴리스 적용 전에 백업을 별도 저장소로 안전하게 옮기고 복구를 검사합니다. 변경 중에는 쓰기 중단 창을 확보하여 복구 지점 이후 데이터 손실 범위를 명시합니다.
3. 복구는 애플리케이션을 중지한 상태에서 **존재하지 않는 새 경로**를 `SIGNAL_DB`로 지정하고 `manage.py restore_db /백업.db`를 실행합니다. 기존/실행 중 DB를 덮어쓰는 복구는 거부합니다.
4. 원래 릴리스 소스·의존성으로 되돌리고 복구 DB에서 `migrate --plan`을 확인합니다. 지원이 확인되지 않은 downgrade migration은 실행하지 않습니다. health/readiness와 counts, 공개 snapshot을 비교한 뒤 새 DB 경로로 재시작합니다. 잘못된 릴리스의 DB는 조사용으로 별도 보존합니다.
5. `tests/ops_smoke.py`는 disposable DB에서 초기 migration 및 0002 발행본 불변 트리거와 발행 후 백업/복구, 동일 릴리스 migration no-op 및 새 프로세스 조회와 실제 Gunicorn 중지 후 복구 DB 경로로 재기동하여 익명 공개 HTML 일치까지 실제 연습합니다. 후속 schema 릴리스가 없는 초기 RC이므로 버전 간 schema downgrade 호환성은 검증하지 않았습니다.

API와 UI는 release candidate 범위입니다. 편집자·발행자 권한 관리 화면, 관리자 UI, 계정 셀프서비스, 다중 조직, 결제는 범위 밖입니다.
