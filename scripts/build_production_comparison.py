"""Generate an evidence report; absent checkpoints remain unmeasured."""
from pathlib import Path
from datetime import datetime,timezone
import json,html,re
ROOT=Path(__file__).resolve().parents[1]
RUN=ROOT/'docs/execution/production-comparison-2026-09-23'
DEST=ROOT/'projects/production-comparison'
DEST.mkdir(parents=True,exist_ok=True)
def read_events(p):return [json.loads(s) for s in p.read_text().splitlines() if s.strip()] if p.exists() else []
def dt(x):return datetime.fromisoformat(x.replace('Z','+00:00'))
def esc(x):return re.sub(r'[ \t]+(?=\n|$)',lambda m:''.join('&#32;' if c==' ' else '&#9;' for c in m[0]),html.escape(str(x)))
def duration(x):return '미측정' if x is None else f'{int(x//60)}분 {int(x%60)}초'
def first(events,stage):return next((dt(e['at']) for e in events if e.get('stage')==stage or (stage=='onboarded' and e.get('stage')=='onboarding')),None)
root_events=read_events(RUN/'integration.jsonl')
data=[]
for key,title,path in [('poc','최초 PoC','projects/signal-magazine'),('upgrade','기존 PoC 고도화','experiments/signal-production/upgrade'),('greenfield','동일 계약 신규 구현','experiments/signal-production/greenfield')]:
 folder=ROOT/path;events=read_events(folder/'evidence/events.jsonl');start=first(events,'started');end=first(events,'handoff');verified=first([e for e in root_events if e.get('route')==key],'route_verified')
 intervals=[];previous=start
 for stage,label in [('onboarded','온보딩 보고'),('plan_ready','계획 보고'),('implementation_ready','구현 보고'),('tests_passed','검증 보고'),('handoff','최초 인계')]:
  now=first(events,stage)
  if previous and now:
   intervals.append({'label':label,'seconds':(now-previous).total_seconds()});previous=now
 data.append({'key':key,'title':title,'path':path,'start':start.isoformat() if start else None,'handoff':end.isoformat() if end else None,'handoff_seconds':(end-start).total_seconds() if end and start else None,'verified_at':verified.isoformat() if verified else None,'verified_seconds':(verified-start).total_seconds() if verified and start else None,'intervals':intervals,'events':events})
session=json.loads((RUN/'session.json').read_text())
root_start=dt(session['root_observed_start_utc'])
verified_times=[dt(d['verified_at']) for d in data[1:] if d['verified_at']]
common_verified=(max(verified_times)-root_start).total_seconds() if len(verified_times)==2 else None
worker_starts=[dt(d['start']) for d in data[1:] if d['start']]
worker_ends=[dt(d['handoff']) for d in data[1:] if d['handoff']]
parallel=(max(worker_ends)-min(worker_starts)).total_seconds() if len(worker_starts)==len(worker_ends)==2 else None
poc=data[0]['handoff_seconds'];upgrade=data[1]['handoff_seconds'];fresh=data[2]['handoff_seconds']
maxsec=max([d['handoff_seconds'] or 0 for d in data]+[1])
rows=''.join(f'<tr><th>{d["title"]}</th><td>{duration(d["handoff_seconds"])}</td><td>{"기존 기록에 개별 통합 시간 없음" if d["key"]=="poc" else duration(d["verified_seconds"])}</td><td>{"브라우저 내부 PoC" if d["key"]=="poc" else ("공통 서버 계약 검증 완료" if d["verified_seconds"] is not None else "실행·검증 진행 중")}</td></tr>' for d in data)
chart=''.join(f'<div class="bar-row"><span>{d["title"]}</span><div class="track"><i style="width:{(d["handoff_seconds"] or 0)/maxsec*100:.1f}%"></i></div><b>{duration(d["handoff_seconds"])}</b></div>' for d in data)
sections=[]
for d in data:
 folder=ROOT/d['path'];proof='../../'+d['path']+'/evidence/';events=d['events']
 records=''.join(f'<details><summary>{esc(e.get("stage"))} · {esc(e.get("at"))}</summary><pre>{esc(e.get("message",""))}</pre></details>' for e in events)
 prompt=ROOT/'docs/execution/2026-09-23/prompts/signal-magazine.txt' if d['key']=='poc' else RUN/'prompts'/f'{d["key"]}.txt'
 shot=folder/'evidence/service.png' if d['key']!='poc' else folder/'evidence/demo.png'
 shots=f'<img class="shot" src="../../{shot.relative_to(ROOT)}" alt="{d["title"]} 실제 브라우저 화면" loading="lazy">' if shot.exists() else '<p>브라우저 캡처 대기</p>'
 tests=''.join(f'<details><summary>{esc(p.name)} 실제 기록</summary><pre>{esc(p.read_text())}</pre></details>' for p in [folder/'evidence/tests.txt',folder/'evidence/root-http.json',folder/'evidence/root-recovery.json',folder/'evidence/root-release.json',folder/'evidence/operations.txt',folder/'evidence/response.md',folder/'reused.md'] if p.exists())
 stages=''.join(f'<li>{esc(x["label"])}: {duration(x["seconds"])}</li>' for x in d['intervals'])
 sections.append(f'<section id="{d["key"]}"><h2>{d["title"]}</h2>{shots}<p><a href="https://github.com/TheMagicTower/korean-ai-dev-course/tree/main/{d["path"]}">실행 가능한 소스와 README ↗</a></p><h3>최초 단계 보고 사이의 경과</h3><ul>{stages}</ul><details><summary>실제 작업 프롬프트 원문</summary><pre>{esc(prompt.read_text())}</pre></details>{records}{tests}<a href="{proof}events.jsonl">원본 이벤트 JSONL</a></section>')
all_evidence=''.join(f'<details><summary>{esc(e.get("route","공통"))} · {esc(e.get("stage"))} · {esc(e.get("at"))}</summary><pre>{esc(e.get("message",""))}</pre></details>' for e in root_events)
comparison=f'과거 PoC 최초 인계 + 이번 고도화 최초 인계의 합성 경과는 {duration(poc+upgrade if poc is not None and upgrade is not None else None)}입니다. 서로 다른 시점의 두 관찰을 더한 값이며 한 번의 연속 실험 시간은 아닙니다.'
status='운영 서비스 후보 비교 · 실제 실행 기록'
css='''*{box-sizing:border-box}body{margin:0;background:#f4f2ec;color:#203b32;font:16px/1.75 system-ui}header,main,footer{max-width:1160px;margin:auto;padding:24px}a{color:#226c51}h1{font-size:clamp(34px,5vw,58px);line-height:1.2;max-width:940px}h2{font-size:28px}section,.panel{margin:28px 0;background:white;border:1px solid #d6ded5;border-radius:14px;padding:28px}aside{padding:18px 22px;border-left:4px solid #bd8e35;background:#fff8e8}.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;min-width:650px}th,td{padding:15px;text-align:left;border-bottom:1px solid #dce3da}.bar-row{display:grid;grid-template-columns:160px 1fr 110px;align-items:center;gap:16px;margin:14px 0}.track{height:24px;background:#edf1e8;border-radius:5px}.track i{display:block;height:100%;background:#357b60;border-radius:5px}.path{display:flex;flex-wrap:wrap;align-items:center;gap:12px}.path strong{padding:12px 18px;background:#edf2e9;border-radius:8px}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f0f3ed;padding:20px;font:13px/1.8 monospace}details{margin:14px 0;border-top:1px solid #dce3da;padding-top:12px}summary{cursor:pointer;font-weight:650}.shot{width:100%;max-height:700px;object-fit:contain;object-position:left top;border:1px solid #dce3da}.eyebrow{letter-spacing:.08em;font-size:13px;color:#577260}@media(max-width:650px){header,main,footer{padding:15px}section,.panel{padding:18px}.bar-row{grid-template-columns:110px 1fr 90px;gap:8px}}'''
page=f'''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{status}</title><style>{css}</style><header><strong>THE MAGIC TOWER / DELIVERY LAB</strong> · <a href="../../index.html#production-comparison">강의로 돌아가기</a></header><main><p class="eyebrow">SIGNAL MAGAZINE · ONE SERVICE, TWO DELIVERY PATHS</p><h1>PoC 다음에는 무엇에<br>시간이 들어갈까요?</h1><p>소규모 편집국의 서버 서비스: 기존 데모를 고도화하는 경로와 같은 계약으로 새로 만드는 경로를 실제 에이전트에게 맡겼습니다.</p><aside><b>측정의 경계</b> · ‘프로덕션 수준’은 정해진 운영 위험의 구현·검증 조건입니다. 이 기록은 실행 가능한 서비스 후보와 로컬 검증을 다룹니다. 외부 운영 도메인·HTTPS·배포 계정·장기 운영은 확인하지 않았으므로 <b>프로덕션 공개 출시 완료 시간은 미측정</b>입니다. GitHub Pages는 보고서와 소스만 제공하며 Django 서버를 실행하지 않습니다.</aside><div class="panel"><h2>실제 최초 인계 시간</h2>{chart}<p>두 구현의 병렬 시작→마지막 인계: <b>{duration(parallel)}</b>. 공통 준비를 포함한 루트 관찰 시작→두 후보 통합 검증: <b>{duration(common_verified)}</b>. 이후 CI·보고서 게시 작업은 아래 통합 기록에서 별도로 확인합니다.</p><p>막대는 각 구현자의 시작→최초 인계 경과이며 같은 품질 보증을 뜻하지 않습니다. 최종 검증과 후속 수정은 아래 별도 열에 표시합니다. 루트 검증 시각은 두 경로의 공동 검토 종료 시점이어서 대기가 포함되며 순수 작업 속도 순위가 아닙니다.</p><div class="table-wrap"><table><thead><tr><th>경로</th><th>시작→최초 인계</th><th>시작→루트 검증</th><th>관찰 상태</th></tr></thead><tbody>{rows}</tbody></table></div><p>{comparison}</p></div><section><h2>지금 새로 만들까요, 계속 고칠까요?</h2><p>이미 PoC가 있는 시점에서 최초 인계까지의 추가 경과를 비교하면, 이번 관찰값은 고도화 11분 51초와 신규 구현 13분 36초입니다. 과거 PoC 7분 14초는 두 선택에 공통인 과거 비용입니다. PoC+고도화 합계와 신규 구현만을 비교하여 재작성이 빠르다고 판단하면 출발점이 달라집니다. 이 단일 실험은 일반적인 속도 우열을 입증하지 않습니다.</p><p><a href="../../index.html#evolve-or-rebuild">고도화·부분 교체·새 구현: 판단 흐름도, 세 사례, 트레이드오프와 실습 프롬프트 →</a></p></section><section><h2>비교할 수 있도록 고정한 것</h2><div class="path"><strong>과거 PoC</strong><span>→</span><strong>기존 코드 고도화</strong><span>／</span><strong>공통 계약 → 신규 구현</strong></div><p>같은 Python 3.13.12, Django 5.2.17, Gunicorn 26.2.0, SQLite와 같은 기사 입력·인수 검사를 사용했습니다. 두 구현자는 새 컨텍스트의 같은 상속 모델/사고 설정입니다. 정확한 런타임 모델 ID는 노출되지 않아 확정하지 않습니다. 단순 계산 검토는 GPT-5.6 Luna max에 위임했습니다. Jev의 실제 작업분류 요청·응답도 보존했습니다.</p><p>기존 경로는 코드·스타일·검증 지식을 재사용하고, 신규 경로는 공통 계약과 자료만 받았습니다. 신규 코드 격리는 프롬프트 지시이며 OS 샌드박스 강제 격리는 아닙니다. 같은 기기에서 병렬 수행한 단일 표본이므로 자원 경합·모델 변동이 있습니다. 과거 PoC에는 외부 API 시도도 있었고 이번 서비스는 동일 recorded 입력을 재사용합니다. 일반 생산성 배수나 모든 프로젝트에 대한 최적 경로를 입증하지 않습니다.</p><details><summary>공통 완료 계약 원문</summary><pre>{esc((RUN/'contract.md').read_text())}</pre></details><p><a href="../../docs/execution/production-comparison-2026-09-23/classification.json">Jev 실제 분류</a> · <a href="../../docs/execution/production-comparison-2026-09-23/dispatch.json">실제 위임 메시지</a></p></section><section><h2>왜 추가 작업이 필요한가요?</h2><div class="table-wrap"><table><tr><th>PoC에서 확인한 것</th><th>서버 서비스에서 추가하는 것</th><th>막으려는 실제 실패</th></tr><tr><td>내 브라우저의 승인 버튼</td><td>서버 세션·역할·CSRF</td><td>누구나 발행 권한을 흉내 내는 문제</td></tr><tr><td>localStorage 기록</td><td>DB·버전 충돌·트랜잭션</td><td>두 편집자의 수정 유실·중복 공개</td></tr><tr><td>정정 화면</td><td>불변 발행본·승인 무효·audit</td><td>검토하지 않은 내용을 승인본처럼 게시</td></tr><tr><td>다시 실행하는 데모</td><td>백업 복구·readiness·운영 설정</td><td>데이터 유실 후 복구 불가·조용한 장애</td></tr></table></div><p>AI는 동일하게 기존 실제 분류·초안 기록을 입력으로 씁니다. 새 라이브 생성/자동 수집·발행 기능의 시간으로 해석하지 않습니다. 고도화의 마이그레이션 비용도 구현 시간에 포함됩니다.</p></section>{''.join(sections)}<section><h2>독립 검토·수정·통합 검증</h2><p><a href="../../docs/execution/production-comparison-2026-09-23/integration.jsonl">통합 타임스탬프 원본 JSONL</a></p>{all_evidence}</section><section><h2>직접 실행하는 방법</h2><p>각 경로 README의 환경 설정 → migrate → 운영자 생성 → 기록 입력 → Gunicorn 실행 순서를 따르세요. 계정 비밀번호와 DB는 저장소에 포함하지 않습니다. 두 서버를 서로 다른 포트로 띄워 편집자와 발행자를 바꾸어 체험할 수 있습니다. 보고서의 화면은 실제 서버에서 캡처했습니다.</p><p>‘빠르다’보다 중요한 질문은 같은 완료 계약을 지켰는가, 기존 자산을 얼마나 활용했는가, 고친 문제와 남은 운영 조건이 무엇인가입니다.</p></section></main><footer><a href="../../docs/execution/production-comparison-2026-09-23/timings.json">시각·계산 근거 JSON</a> · 보고 간격에는 작업·시험·대기가 섞여 있습니다. 전체 내부 추론과 모든 도구 호출 원문은 포함하지 않습니다.</footer></html>'''
(DEST/'index.html').write_text(page)
summary=[{k:v for k,v in d.items() if k!='events'} for d in data]
(RUN/'timings.json').write_text(json.dumps({'generated_at':datetime.now(timezone.utc).isoformat(),'routes':summary,'synthetic_poc_plus_upgrade_handoff_seconds':poc+upgrade if poc is not None and upgrade is not None else None,'root_start_to_two_candidates_verified_seconds':common_verified,'parallel_first_start_to_last_handoff_seconds':parallel,'live_production_release_seconds':None},ensure_ascii=False,indent=2)+'\n')
md=f'''# PoC 이후 · 고도화와 신규 구현의 실제 비교

**[세 경로의 시간 차트·실제 프롬프트·응답·서버 화면](https://themagictower.github.io/korean-ai-dev-course/projects/production-comparison/)**

Signal Magazine을 소규모 편집국 서비스로 만들 때, 기존 PoC를 이식하는 경로와 같은 요구로 새로 구현하는 경로를 독립 에이전트에 맡겼습니다. 운영 범위는 사용자가 선택한 운영자 계정·권한, DB, 승인·발행·정정, 백업·복구입니다.

| 경로 | 시작→최초 인계 | 시작→공통 서버 계약 검증 |
|---|---|---|
'''+''.join(f'| {d["title"]} | {duration(d["handoff_seconds"])} | {"개별 원본 기록 없음" if d["key"]=="poc" else duration(d["verified_seconds"])} |\n' for d in data)+f'''
{comparison}

## 완료 기준이 바뀌면 시간의 의미도 바뀝니다

PoC의 7분 14초는 브라우저 안의 실제 AI 기록·편집·승인·발행 미리보기 구현입니다. 서버 서비스 후보에는 인증, 역할, SQL 저장, 동시 편집 충돌, 승인 무효, 원자적 중복 방지, 공개 발행본, 실제 백업·복구를 요구했습니다. 최초 인계는 검토 종료와 같지 않으며 후속 수정·통합 확인은 별도 기록합니다.

운영 출시까지의 시간은 아직 측정하지 않았습니다. 외부 운영 HTTPS·DNS·배포 계정·장기 가용성·책임자의 운영 수락이 없는 상태에서 로컬 검증을 상용 운영 완료라고 부르지 않습니다. GitHub Pages에서는 Django 서버가 실행되지 않습니다. 소스의 README로 각 서버를 실행하고 실제 서버 캡처와 검증 원문을 함께 확인하세요.

## 무엇을 같게 하고 무엇을 다르게 했나요?

두 경로는 동일 스택·기사 자료·API 완료 계약·검증기를 사용했습니다. 고도화는 기존 코드·디자인·규칙을 볼 수 있고 새 구현은 공통 계약과 자료만 받았습니다. 후자의 분리는 지시 기반이며 운영체제 차단에 의한 격리는 아닙니다. JS PoC에서 Python 서버로 이식한 비용은 고도화에 포함됩니다. 스택을 유지한 재사용 실험과 결과가 다를 수 있습니다.

두 루트 검증 시각은 공동 검토 종료 시점이어서 대기를 포함하며 순수 구현 속도 순위가 아닙니다. 반복된 단계 보고는 원문에 모두 보존하고 간격 계산에는 해당 단계의 최초 보고만 사용했습니다. 병렬 실행의 시간 합은 사용자가 기다린 시간이 아닙니다. 공통 준비·검증 작업은 루트 기록에 분리했습니다. 정확한 런타임 모델 ID가 노출되지 않아 모델 간 속도 비교도 하지 않습니다. 과거 PoC에는 외부 자료 수집·API 시도가 포함됐고 이번 두 경로는 같은 기록 입력을 재사용했습니다. 따라서 순수 기능량만의 차이를 측정한 통제 실험도 아닙니다. 단일 사례·단일 실행이므로 ‘언제나 신규가 빠르다’거나 ‘프로덕션은 PoC의 몇 배다’라는 일반 결론을 낼 수 없습니다.

## 다음 경로를 선택하기

이미 PoC가 있다면 앞으로의 비용끼리 비교합니다. 과거 PoC 비용을 고도화에만 더하면 출발점이 달라집니다. [고도화·부분 교체·새 구현의 선택 기준과 사례, 판단 프롬프트](evolve-or-rebuild.md)를 사용해 자신의 프로젝트에 적용하세요.

## 수업에서 사용할 질문

1. 내 브라우저의 승인 버튼을 여러 직원이 쓰는 서버로 옮길 때 어떤 실패가 새로 생기나요?
2. 최초 인계·검토 통과·실제 운영 출시는 왜 다른 시점인가요?
3. 기존 코드를 버리면 다시 검증할 지식과 데이터는 무엇인가요?
4. 하나의 기능을 줄이더라도 남겨야 하는 권한·복구 조건은 무엇인가요?

이 사례는 기존 3·4주차의 검증·전달 사례 시간을 대체합니다. 추가 주차나 필수 실습 시간을 늘리지 않습니다.

[Django 공식 배포 체크리스트](https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/)는 서버·보안 설정을 검토하는 근거로 사용했습니다. 프로젝트의 실제 검증 여부는 공통 계약과 실행 기록을 따릅니다.
'''
(ROOT/'course/production-comparison.md').write_text(md)
print([(d['key'],duration(d['handoff_seconds']),duration(d['verified_seconds'])) for d in data])
