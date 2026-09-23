"""Build an evidence gallery from observed worker timestamps; never infer missing stages."""
from pathlib import Path
from datetime import datetime, timezone
import json, html
ROOT=Path(__file__).resolve().parents[1]
RUN=ROOT/'docs/execution/2026-09-23'
PROJECTS=[
 ('applyflow','ApplyFlow','개인용 지원 관리','기존 예제 재사용 + 가져오기·삭제 구현'),
 ('flyblock','FlyBlock Arena','신경회로 대전 실험','실제 연결지도 부분회로 + 사람이 설계한 입출력'),
 ('signal-magazine','Signal Magazine','AI 편집국','실제 자료·모델 실행 기록 + 브라우저 편집 데모'),
]
STAGES=[('started','시작'),('onboarded','온보딩 보고'),('plan_ready','계획 보고'),('implementation_ready','구현 보고'),('tests_passed','검증 보고'),('handoff','인계')]
def dt(value):return datetime.fromisoformat(value.replace('Z','+00:00'))
def esc(value):return html.escape(str(value))
def duration(seconds):
 return f'{int(seconds//60)}분 {int(seconds%60)}초'
def main():
 cards=[];sections=[];rows=[];starts=[];ends=[];summaries=[]
 for slug,name,subtitle,reuse in PROJECTS:
  folder=ROOT/'projects'/slug
  log=folder/'evidence/events.jsonl'
  events=[json.loads(line) for line in log.read_text().splitlines() if line.strip()] if log.exists() else []
  times={}
  for e in events:
   stage=e.get('stage',e.get('event'))
   stamp=e.get('at',e.get('timestamp'))
   if stage and stamp and stage not in times:times[stage]=dt(stamp)
  first=times.get('started');last=times.get('handoff')
  elapsed=(last-first).total_seconds() if first and last else None
  if first:starts.append(first)
  if last:ends.append(last)
  label=duration(elapsed) if elapsed is not None else '인계 기록 대기'
  follow_seconds=(times['followup_handoff']-times['followup_started']).total_seconds() if 'followup_handoff' in times and 'followup_started' in times else None
  review_fix_seconds=(times['review_fix_handoff']-times['review_fix_started']).total_seconds() if 'review_fix_handoff' in times and 'review_fix_started' in times else None
  follow_note=f'<p>후속 수정 요청→재인계: <strong>{duration(follow_seconds)}</strong> (최초 인계 시간에 합산하지 않음)</p>' if follow_seconds is not None else ''
  if review_fix_seconds is not None:follow_note+=f'<p>검토 오류 수정 요청→재인계: <strong>{duration(review_fix_seconds)}</strong> (별도 추가 경과)</p>'
  if slug=='flyblock':follow_note+='<p><a href="flyblock/updates/keyboard-realtime-01/">후속 업데이트: 키보드·실시간 대전의 프롬프트와 별도 측정 시간 →</a></p><p>위 시간과 최초 캡처는 원래 라운드 버전의 기록입니다. 데모 링크는 최신 버전입니다.</p>'
  intervals=[];previous=first
  for key,title in STAGES[1:]:
   stamp=times.get(key)
   if stamp is not None and previous is not None:
    seconds=(stamp-previous).total_seconds()
    if seconds<0:raise ValueError(f'Nonmonotonic stage: {slug} {key}')
    intervals.append({'stage':key,'label':title,'seconds':seconds,'ended_at':stamp.isoformat()})
    previous=stamp
  bars=''.join(f'<div class="time-row"><span>{esc(i["label"])}</span><div class="track"><i style="width:{max(1,i["seconds"]/max(elapsed or 1,1)*100):.2f}%"></i></div><b>{duration(i["seconds"])}</b></div>' for i in intervals)
  original=(RUN/'prompts'/f'{slug}.txt').read_text()
  messages=''.join(f'<details><summary>{esc(e.get("stage",e.get("event","")))} · {esc(e.get("at",e.get("timestamp","")))}</summary><pre>{esc(e.get("message",e.get("text","")))}</pre></details>' for e in events if e.get('kind')=='response')
  final=(folder/'evidence/response.md').read_text() if (folder/'evidence/response.md').exists() else '최종 응답 기록 대기'
  extra=''
  for file,title in [('followup-prompt.txt','후속 수정 요청 원문'),('followup-response.md','후속 수정 완료 응답'),('review-fix-prompt.txt','독립 검토 오류 수정 요청'),('review-fix-response.md','독립 검토 수정 응답'),('agent-draft.json','실제 기사 생성 지시와 응답'),('model-run.json','실제 AI API 요청과 응답')]:
   ep=folder/'evidence'/file
   if ep.exists():extra+=f'<details><summary>{title}</summary><pre>{esc(ep.read_text())}</pre></details>'
  screenshot=f'<img src="{slug}/evidence/demo.png" alt="{esc(name)} 실제 브라우저 검증 화면" loading="lazy">' if (folder/'evidence/demo.png').exists() else ''
  cards.append(f'<article class="card">{screenshot}<small>{esc(subtitle)}</small><h2>{esc(name)}</h2><p>{esc(reuse)}</p><p class="duration">{label}<small>에이전트 시작 → 최초 인계</small></p><a class="button" href="{slug}/">데모 열기 ↗</a><a href="#{slug}">프롬프트와 응답 보기 ↓</a></article>')
  sections.append(f'<section id="{slug}"><p class="eyebrow">실제 실행 기록</p><h2>{esc(name)}</h2><p>{esc(reuse)}. 막대는 공개 진행 보고 사이의 경과입니다. 테스트는 구현 도중에도 실행되며, 서로 배타적인 순수 작업 시간은 아닙니다.</p>{bars}{follow_note}<details><summary>실제로 전달한 작업 프롬프트 원문</summary><pre>{esc(original)}</pre></details>{messages}{extra}<details><summary>최초 인계 응답 원문</summary><pre>{esc(final)}</pre></details><p><a href="{slug}/evidence/events.jsonl">타임스탬프 원본</a> · <a href="{slug}/evidence/tests.txt">실행 검사 기록</a> · <a href="{slug}/README.md">실행 안내 원문</a></p></section>')
  rows.append(f'| [{name}](https://themagictower.github.io/korean-ai-dev-course/projects/{slug}/) | {reuse} | {label} |')
  summaries.append({'project':slug,'started_at':first.isoformat() if first else None,'handoff_at':last.isoformat() if last else None,'elapsed_seconds':elapsed,'followup_seconds':follow_seconds,'review_fix_seconds':review_fix_seconds,'intervals':intervals})
 total=(max(ends)-min(starts)).total_seconds() if len(ends)==3 and len(starts)==3 else None
 aggregate=sum(s['elapsed_seconds'] for s in summaries) if all(s['elapsed_seconds'] is not None for s in summaries) else None
 integration_path=RUN/'integration.jsonl'
 integration_events=[json.loads(line) for line in integration_path.read_text().splitlines() if line.strip()] if integration_path.exists() else []
 session=json.loads((RUN/'session.json').read_text()) if (RUN/'session.json').exists() else {}
 local_event=next((e for e in reversed(integration_events) if e['stage']=='local_delivery_verified'),None)
 local_seconds=(dt(local_event['at'])-dt(session['root_observed_start_utc'])).total_seconds() if local_event and session else None
 local_label=duration(local_seconds) if local_seconds is not None else '검증 진행 중'
 public_event=next((e for e in integration_events if e['stage']=='first_public_demo_verified'),None)
 public_seconds=(dt(public_event['at'])-dt(session['root_observed_start_utc'])).total_seconds() if public_event and session else None
 public_label=duration(public_seconds) if public_seconds is not None else '배포 확인 대기'
 integration_html='<section id=integration><h2>주 에이전트 통합·브라우저 검증</h2><p>아래는 관찰한 완료 시각입니다. 앞선 병렬 구현과 일부 겹칩니다.</p>'+''.join(f'<details><summary>{esc(e["stage"])} · {esc(e["at"])}</summary><pre>{esc(e["message"])}</pre></details>' for e in integration_events)+'</section>'
 overall=duration(total) if total is not None else '전체 인계 대기'
 summed=duration(aggregate) if aggregate is not None else '집계 대기'
 meta={'generated_at':datetime.now(timezone.utc).isoformat(),'parallel_start_to_last_handoff_seconds':total,'sum_worker_elapsed_seconds':aggregate,'projects':summaries,'root_start_to_local_verified_seconds':local_seconds,'root_start_to_first_public_verified_seconds':public_seconds}
 (RUN/'timings.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
 css="""*{box-sizing:border-box}body{margin:0;background:#f5f4ef;color:#18372e;font:16px/1.7 system-ui,sans-serif}header,main,footer{max-width:1180px;margin:auto;padding:28px}header{display:flex;justify-content:space-between;gap:16px}a{color:#246951;text-underline-offset:4px}h1{font-size:clamp(32px,5vw,58px);line-height:1.2;max-width:900px}h2{font-size:28px}small,.eyebrow{display:block;letter-spacing:.06em;color:#537268}.intro{max-width:850px}.stats{display:flex;gap:32px;flex-wrap:wrap;margin:32px 0}.stats b{font-size:32px;display:block}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.card,section{border:1px solid #d7dfd8;background:white;border-radius:16px;padding:24px}.card img{width:100%;height:185px;object-fit:cover;object-position:top;border:1px solid #e4e7e4;border-radius:8px}.card h2{font-size:25px}.duration{font-size:24px;font-weight:700}.duration small{font-size:12px;font-weight:400}.button{display:block;background:#1f5b48;color:white;padding:10px 16px;border-radius:8px;text-decoration:none;margin:15px 0}section{margin:32px 0;scroll-margin-top:20px}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f3f5f2;padding:20px;font:14px/1.8 ui-monospace,monospace}details{margin:12px 0;border-top:1px solid #dae1da;padding-top:12px}summary{cursor:pointer;font-weight:600}.time-row{display:grid;grid-template-columns:100px 1fr 95px;gap:14px;align-items:center;margin:10px 0}.track{height:16px;background:#edf2ee;border-radius:4px}.track i{display:block;height:100%;background:#39775f;border-radius:4px}.time-row b{font-size:13px}aside{border-left:4px solid #c79743;padding:14px 22px;background:#fff9e9;margin:25px 0}@media(max-width:800px){.grid{grid-template-columns:1fr}header,main,footer{padding:18px}.time-row{grid-template-columns:80px 1fr 85px;gap:8px}.card img{height:220px}}"""
 page=f'''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>세 프로젝트 제작실 · 실제 프롬프트와 시간</title><style>{css}</style><header><strong>THE MAGIC TOWER / BUILD LAB</strong><a href="../index.html#build-lab">강의자료로 돌아가기</a></header><main><p class="eyebrow">2026-09-23 · SUBAGENT BUILD RECORD</p><h1>프롬프트에서 데모까지,<br>실제로 만든 세 프로젝트.</h1><p class="intro">독립 서브에이전트의 실제 작업 요청, 공개 응답, 단계별 시각과 결과물을 연결했습니다. 개발 중의 내부 추론 전체나 모든 도구 호출 원문은 포함하지 않습니다.</p><div class="stats"><div><small>병렬 실행 실제 경과</small><b>{overall}</b></div><div><small>개별 에이전트 경과 합계</small><b>{summed}</b></div><div><small>주 작업 관찰 시작 → 로컬 통합 검증</small><b>{local_label}</b></div><div><small>주 작업 관찰 시작 → 데모 첫 공개 확인</small><b>{public_label}</b></div></div><aside>병렬 실행 수치는 첫 에이전트 시작부터 마지막 최초 인계까지입니다. 로컬 통합 검증 수치는 주 작업 관찰 시작부터 후속 수정·검토를 포함합니다. 데모 첫 공개 확인은 실제 배포 대기까지 포함합니다. 이 증거 보고서 자체의 후속 게시 시간은 제외합니다. 기존 코드 재사용과 새 연구 통합의 조건이 달라 속도 순위나 학생의 8시간 완성 예측으로 비교하지 않습니다. 토큰·비용은 전체 집계하지 않았습니다.</aside><div class="grid">{''.join(cards)}</div>{''.join(sections)}{integration_html}</main><footer><a href="../docs/execution/2026-09-23/timings.json">계산 근거 JSON</a> · <a href="../docs/execution/2026-09-23/dispatch.json">실제 위임 메시지</a> · 공개 기록의 원문 언어와 시각을 보존했습니다.</footer></html>'''
 (ROOT/'projects/index.html').write_text(page)
 md='''# 실제 서브에이전트 제작실
세 프로젝트를 독립 서브에이전트에 실제로 위임했습니다. **[최종 데모·단계별 시간·프롬프트와 응답](https://themagictower.github.io/korean-ai-dev-course/projects/)**을 함께 열어 비교하세요.

| 데모 | 출발 조건 | 시작→인계 경과 |
|---|---|---|
'''+ '\n'.join(rows)+f'''

병렬 실행의 첫 시작→마지막 인계는 **{overall}**, 개별 에이전트 경과 합계는 **{summed}**입니다. 개별 시간의 합을 사용자가 기다린 시간으로 표현하지 않습니다.

주 에이전트의 첫 시각 관찰부터 수정·재검토를 포함한 로컬 통합 검증까지는 **{local_label}**입니다. 데모 첫 공개 확인까지는 **{public_label}**입니다. 최초 공개 이후 이 증거 보고서를 갱신·게시한 시간은 제외합니다. [배포 실행 기록](https://github.com/TheMagicTower/korean-ai-dev-course/actions/runs/35806098688)과 제작실의 통합 기록에서 확인할 수 있습니다.

## 후속 업데이트
[FlyBlock 키보드·실시간 개선](updates/flyblock-keyboard.md)은 최초 제작과 분리해서 프롬프트·응답·시간을 기록했습니다. 제작실의 최초 화면과 시간은 초기 버전에 해당하며, 게임 실행 링크는 최신 버전입니다.

## 무엇을 캡처했나요?
- 실제 위임 메시지와 에이전트가 읽은 작업 프롬프트 원문.
- 단계별 공개 응답과 UTC 관찰 시각, 최종 인계 응답.
- 실행한 검사와 결과, 데모의 브라우저 검증 화면.
- 기존 구현·외부 연구 코드·실제 모델 응답의 재사용 조건.

이것은 전체 내부 추론이나 모든 도구 호출 원시 로그가 아닙니다. 기록된 공개 응답은 문장을 매끄럽게 재작성하지 않았습니다. 다른 언어로 답한 구간이 있더라도 원문을 보존합니다.

## 시간을 해석하는 방법
단계 시간은 시작→온보딩 보고→계획 보고→구현 보고→검증 보고→인계 사이의 관찰 경과입니다. 테스트 명령은 구현 도중에도 실행됩니다. 예를 들어 ApplyFlow의 첫 통과 검사 시각은 구현 완료 보고보다 이르므로 막대를 실제 구현/테스트 작업 시간의 엄밀한 분리로 해석하지 않습니다. 조사·도구·대기·수정이 포함되며 순수 모델 추론 시간은 아닙니다. 최초 인계 뒤의 수정과 최종 전달은 [별도 통합 기록](https://themagictower.github.io/korean-ai-dev-course/projects/#integration)에 남깁니다.

ApplyFlow는 기존 예제를 재사용했고, 게임은 외부 연결지도 준비가 필요하며, 매거진은 자료 수집과 실제 AI 호출을 포함합니다. 조건이 다르므로 세 모델의 속도 비교나 일반적인 생산성 배수를 주장할 수 없습니다. 수강생의 학습·이해 시간도 포함하지 않습니다.

## 수업에서 보여주는 순서
1. 프롬프트의 포함·제외·완료 조건을 읽습니다.
2. 실제 중간 응답에서 불확실성과 실패가 어떻게 드러났는지 확인합니다.
3. 완료 응답을 읽고 데모를 직접 조작해 주장과 결과를 비교합니다.
4. 단계별 시간과 재사용 범위를 보고 자신의 프로젝트 계획을 수정합니다.

[원본 기록 안내](https://github.com/TheMagicTower/korean-ai-dev-course/tree/main/docs/execution/2026-09-23) · [계산 근거](https://themagictower.github.io/korean-ai-dev-course/docs/execution/2026-09-23/timings.json)

각 데모의 실제 모델 연결·저장 범위·미구현은 해당 화면과 README를 따릅니다. 초파리 부분회로 실험을 생물학적 전뇌 지능으로, 브라우저 편집 프리뷰를 외부 뉴스 자동 발행 서비스로 표시하지 않습니다.
'''
 (ROOT/'course/build-lab.md').write_text(md)
 print('Built project evidence gallery:',overall)
if __name__=='__main__':main()
