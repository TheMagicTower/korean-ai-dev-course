"""Render observed update evidence without changing original build records."""
from pathlib import Path
from datetime import datetime
import html,json
ROOT=Path(__file__).resolve().parents[1]
D=ROOT/'projects/flyblock/updates/keyboard-realtime-01'
def esc(x):return html.escape(str(x))
def stamp(x):return datetime.fromisoformat(x.replace('Z','+00:00'))
def duration(s):return f'{int(s//60)}분 {int(s%60)}초'
events=[]
for name in ['events.jsonl','integration.jsonl']:
 p=D/name
 if p.exists():events += [json.loads(x) for x in p.read_text().splitlines() if x.strip()]
def at(e):return e.get('at',e.get('timestamp'))
def stage(e):return e.get('stage',e.get('event'))
times={}
for e in events:
 if at(e) and stage(e) not in times:times[stage(e)]=stamp(at(e))
start=stamp(json.loads((D/'session.json').read_text())['root_observed_start_utc'])
metrics={}
for label,a,b in [('에이전트 시작 → 최초 인계',times.get('started'),times.get('handoff')),('관찰 시작 → 로컬 검증',start,times.get('local_verified')),('관찰 시작 → 첫 공개 확인',start,times.get('public_verified'))]:
 metrics[label]=(b-a).total_seconds() if a and b else None
stats=''.join(f'<li>{esc(k)}: <strong>{duration(v) if v is not None else "진행 중"}</strong></li>' for k,v in metrics.items())
intervals=[]
previous=times.get('started')
for key,label in [('onboarded','온보딩 보고'),('plan_ready','계획 보고'),('implementation_ready','구현 보고'),('tests_passed','검증 보고'),('handoff','최초 인계')]:
 current=times.get(key)
 if previous and current:
  seconds=(current-previous).total_seconds()
  if seconds<0:raise ValueError('Nonmonotonic report checkpoints')
  intervals.append((label,seconds))
  previous=current
bars=''.join(f'<div>{esc(label)} · {duration(seconds)}<div style="height:12px;background:#2f7459;width:{max(1,seconds/max([v for _,v in intervals],default=1)*100):.1f}%"></div></div>' for label,seconds in intervals)
records=''.join(f'<details><summary>{esc(stage(e))} · {esc(at(e))}</summary><pre>{esc(e.get("message",e.get("text",json.dumps(e,ensure_ascii=False))))}</pre></details>' for e in events)
files=['prompt.txt','dispatch.json','README.md','response.md','tests.txt','debug-prompt.txt','debug-response.md','review-prompt.txt','review-response.md']
originals=''.join(f'<details><summary>{esc(n)} 원문</summary><pre>{esc((D/n).read_text())}</pre></details>' for n in files if (D/n).exists())
shots=''.join(f'<figure><img src="{n}.png" alt="{label}"><figcaption>{label} · 실제 브라우저 캡처</figcaption></figure>' for n,label in [('before','변경 전: 드롭다운으로 매 수 선택'),('after','변경 후: 실시간 키보드 대전')] if (D/f'{n}.png').exists())
page=f'''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FlyBlock 실시간 업데이트 기록</title><style>body{{margin:auto;max-width:1080px;padding:24px;background:#f6f5ef;color:#17372d;font:17px/1.8 system-ui}}a{{color:#216b51}}h1{{font-size:clamp(30px,5vw,48px)}}section{{background:white;padding:24px;border:1px solid #d7dfd8;border-radius:14px;margin:24px 0}}pre{{white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.7 monospace;background:#f1f4f0;padding:16px}}summary{{cursor:pointer;font-weight:600}}details{{margin:16px 0}}.shots{{display:grid;grid-template-columns:1fr 1fr;gap:16px}}figure{{margin:0}}img{{width:100%;height:auto}}@media(max-width:700px){{.shots{{grid-template-columns:1fr}}}}</style><nav><a href="../../">게임 실행</a> · <a href="../../../../index.html#flyblock-update">강의의 업데이트 사례</a> · <a href="../../../">제작실</a></nav><h1>불편한 조작을 실제 플레이 경험으로 바꾸기</h1><p>FlyBlock · 키보드와 실시간성 개선 / UPDATE 01</p><section><h2>별도로 측정한 업데이트 시간</h2><ul>{stats}</ul>{bars}<p>막대는 직전 보고부터 다음 보고까지의 경과이며 서로 배타적인 작업 시간 분류가 아닙니다.</p><p>실제 UTC 관찰 시각의 차이입니다. 조사·구현·시험·대기를 포함하며 순수 코딩 시간은 아닙니다. 최초 제작 시간과 합산하지 않습니다. 첫 공개 확인 이후 보고서 재게시 시간은 제외합니다.</p></section><section><h2>전후 화면</h2><div class="shots">{shots}</div></section><section><h2>공개 진행 응답과 검증 기록</h2>{records}</section><section><h2>실제로 사용한 프롬프트와 응답</h2>{originals}<p>전체 내부 추론이나 모든 도구 호출을 수집한 자료는 아닙니다.</p></section><footer><a href="events.jsonl">에이전트 시간 원본</a> · <a href="timings.json">시간 계산 JSON</a></footer></html>'''
(D/'index.html').write_text(page)
(D/'timings.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2)+'\n')
print(metrics)
