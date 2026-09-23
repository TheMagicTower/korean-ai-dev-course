"""Build static course: pip install Markdown==3.8.2 then python scripts/build_course.py."""
from pathlib import Path
import re,html
import markdown
from course_visuals import build_visuals
ROOT=Path(__file__).resolve().parents[1]
items=[('start','시작하기','course/start.md'),('week1','01 · 문제와 AI 선택','course/week1.md'),('week2','02 · 목업에서 구현','course/week2.md'),('week3','03 · 진단과 검증','course/week3.md'),('week4','04 · 전달과 회고','course/week4.md'),('build-lab','제작실 · 실제 데모와 소요 시간','course/build-lab.md'),('flyblock-update','업데이트 · 실시간 게임 개선','course/updates/flyblock-keyboard.md'),('production-comparison','실험 · PoC와 운영 서비스 비교','course/production-comparison.md'),('cases','사례 선택 · 세 가지 프로젝트','course/cases/index.md'),('flyblock','사례 · 초파리 신경회로 게임','course/cases/flyblock.md'),('magazine','사례 · AI 뉴스 매거진','course/cases/signal-magazine.md'),('case','사례 · ApplyFlow 서비스','course/case-study.md'),('playbook','실전 · 프로젝트 실행 매뉴얼','docs/playbooks/applyflow-runbook.md'),('execution','실제 수행 기록 · AF-104','docs/playbooks/applyflow-af104-record.md'),('adaptive','수준별 프로세스 적용','docs/adaptive-process.md'),('templates','워크북 · 복사 서식','docs/templates.md'),('levels','완성 수준','docs/project-completion-levels.md'),('workflow','전체 워크플로우','docs/workflow.md'),('standard','18단계 운영 기준','docs/project-operating-standard.md'),('models','모델·프로바이더 선택','docs/model-selection.md'),('frontier','Astra·Jev 분석','docs/frontier-models.md'),('agents','코딩 에이전트 8종','docs/coding-agents-report.md'),('skills','스킬 패키지 안내','docs/korean-skill-package.md'),('schedule','강사용 과정 설계','docs/course-design.md')]
mapping={Path(path).name:id for id,_,path in items}
visuals=build_visuals(ROOT)
sections=[]
for id,label,path in items:
 text=(ROOT/path).read_text()
 text=re.sub(r'\]\(([^):]+\.md)(?:#[^)]*)?\)',lambda m:'](#'+mapping[Path(m[1]).name]+')' if Path(m[1]).name in mapping else '](https://github.com/TheMagicTower/korean-ai-dev-course/blob/main/'+str((Path(path).parent/m[1]))+')',text)
 body=markdown.markdown(text,extensions=['tables','fenced_code','sane_lists'])
 body=body.replace('<table>','<div class="table-wrap"><table>').replace('</table>','</table></div>')
 body=re.sub(r'<li>\[ \] (.*?)</li>',lambda m:'<li class="check"><label><input type="checkbox"> <span>'+m[1]+'</span></label></li>',body)
 body=body.replace('<pre><code class="language-mermaid">','<pre class="mermaid">').replace('</code></pre>','</code></pre>')
 body=re.sub(r'(<pre class="mermaid">.*?)</code></pre>',r'\1</pre>',body,flags=re.S)
 body=re.sub(r'<!-- visual:([a-z-]+) -->',lambda m:visuals[m[1]],body)
 sections.append(f'<article id="{id}" class="lesson" aria-label="{label}"><div class="eyebrow">FIELD NOTES / {label}</div>{body}<div class="chapter-end">내 프로젝트에 필요한 결정과 증거를 남기고 다음 단계로 이동하세요.</div></article>')
nav=''.join(f'<a href="#{id}">{label}</a>' for id,label,_ in items)
css=(ROOT/'course/style.css').read_text()+'\n'+(ROOT/'course/visuals.css').read_text();js=(ROOT/'course/app.js').read_text()+'\n'+(ROOT/'course/visuals.js').read_text()
page='''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI로 만드는 나의 첫 완성품 · 4주 프로젝트 과정</title><style>'''+css+'''</style><noscript><style>.lesson{display:block}.mock-actions,.cost-controls{display:none}</style></noscript></head><body><a class="skip" href="#content">본문으로</a><header><a class="brand" href="#start">THE MAGIC TOWER <small>AI DEVELOPMENT LAB</small></a><div><span class="edition">첫 교재 · 4주 × 2시간</span><button id="print" type="button">인쇄 / PDF</button></div></header><aside><div class="nav-title">과정 안내</div><nav aria-label="교재 목차">'''+nav+'''</nav><div class="nav-foot"><strong id="progress">체크리스트 준비 중</strong><p>이 기기의 브라우저에 저장됩니다.</p><a href="https://github.com/TheMagicTower/korean-ai-dev-course">GitHub · 소스와 스킬 ↗</a></div></aside><main id="content" tabindex="-1"><div class="masthead"><p>아이디어에서 실제 사용까지</p><h1>작게 시작하고,<br>끝까지 완성합니다.</h1><p>AI 목업으로 경험을 확인하고, 규칙과 설계를 도출해<br>자신만의 프로젝트를 전달하는 실습 교재입니다.</p><div class="tags"><span>개인 아이디어</span><span>한국어 스킬 8개</span><span>목적에 맞는 완료 기준</span></div></div>'''+''.join(sections)+'''<footer>2026 · TheMagicTower · 교육 초판. 조사 자료의 확인일과 검증 한계는 각 부록을 참고하세요.</footer></main><div id="toast" role="status" aria-live="polite"></div><script>'''+js+'''</script><script type="module">try {const {default:mermaid}=await import('https://cdn.jsdelivr.net/npm/mermaid@11.12.0/dist/mermaid.esm.min.mjs');mermaid.initialize({startOnLoad:false,securityLevel:'strict',theme:'neutral'});let queue=Promise.resolve();function render(){queue=queue.then(async()=>{for(const el of document.querySelectorAll('.lesson.active .mermaid:not([data-processed])')){const source=el.textContent;try{await mermaid.run({nodes:[el]});}catch(e){el.textContent=source;el.setAttribute('data-processed','failed');el.setAttribute('aria-label','텍스트 흐름도');}}});}render();addEventListener('hashchange',render);}catch(e){document.querySelectorAll('.mermaid').forEach(x=>x.setAttribute('aria-label','온라인 다이어그램 로딩 실패: 텍스트 흐름도'));}</script></body></html>'''
figure_numbers=iter(range(1,100))
page=re.sub(r'FIGURE \d{2}',lambda m:f'FIGURE {next(figure_numbers):02}',page)
(ROOT/'index.html').write_text(page)
print('Built index.html:',len(items),'chapters',len(page),'characters')
