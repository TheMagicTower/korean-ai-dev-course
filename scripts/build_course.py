"""Build static course: pip install Markdown==3.8.2 then python scripts/build_course.py."""
from pathlib import Path
import re
import markdown
from course_visuals import build_visuals

ROOT = Path(__file__).resolve().parents[1]

# Article order: existing 29 preserved, 1 new unit appended at the end.
# Checklist storage keys derive from this order, so never reorder it.
ITEMS = [
    ('start', '시작하기', 'course/start.md'),
    ('week1', '01 · 문제와 AI 선택', 'course/week1.md'),
    ('week2', '02 · 목업에서 구현', 'course/week2.md'),
    ('week3', '03 · 진단과 검증', 'course/week3.md'),
    ('week4', '04 · 전달과 회고', 'course/week4.md'),
    ('ci-cd-optimization', '실전 · CI/CD 시간과 캐시 최적화', 'course/ci-cd-optimization.md'),
    ('parallel-ai-merge-train', '실전 · 병렬 AI 개발과 머지트레인', 'course/parallel-ai-merge-train.md'),
    ('build-lab', '제작실 · 실제 데모와 소요 시간', 'course/build-lab.md'),
    ('flyblock-update', '업데이트 · 실시간 게임 개선', 'course/updates/flyblock-keyboard.md'),
    ('production-comparison', '실험 · PoC와 운영 서비스 비교', 'course/production-comparison.md'),
    ('evolve-or-rebuild', '판단 · 고도화와 재구현', 'course/evolve-or-rebuild.md'),
    ('cases', '사례 선택 · 제작과 운영', 'course/cases/index.md'),
    ('flyblock', '사례 · 초파리 신경회로 게임', 'course/cases/flyblock.md'),
    ('magazine', '사례 · AI 뉴스 매거진', 'course/cases/signal-magazine.md'),
    ('case', '사례 · ApplyFlow 서비스', 'course/case-study.md'),
    ('playbook', '실전 · 프로젝트 실행 매뉴얼', 'docs/playbooks/applyflow-runbook.md'),
    ('execution', '실제 수행 기록 · AF-104', 'docs/playbooks/applyflow-af104-record.md'),
    ('adaptive', '수준별 프로세스 적용', 'docs/adaptive-process.md'),
    ('templates', '워크북 · 복사 서식', 'docs/templates.md'),
    ('levels', '완성 수준', 'docs/project-completion-levels.md'),
    ('workflow', '전체 워크플로우', 'docs/workflow.md'),
    ('standard', '18단계 운영 기준', 'docs/project-operating-standard.md'),
    ('models', '모델·프로바이더 선택', 'docs/model-selection.md'),
    ('frontier', 'Astra·Jev 분석', 'docs/frontier-models.md'),
    ('agents', '코딩 에이전트 8종', 'docs/coding-agents-report.md'),
    ('skills', '스킬 패키지 안내', 'docs/korean-skill-package.md'),
    ('schedule', '강사용 과정 설계', 'docs/course-design.md'),
    ('issue-pr-management', '심화 · 이슈·PR 관리', 'course/issue-pr-management.md'),
    ('domain-testing', '심화 · DDD·TDD와 테스트 경계', 'course/domain-testing.md'),
    ('linear-ci', '외부 운영 사례 · Linear CI 최적화', 'course/cases/linear-ci.md'),
]

# Navigation-only grouping. Article DOM order follows ITEMS; nav order follows this.
NAV_GROUPS = [
    ('4주 핵심 과정', ['start', 'week1', 'week2', 'week3', 'week4']),
    ('사례·실습', ['cases', 'case', 'flyblock', 'magazine', 'playbook', 'execution',
                'build-lab', 'flyblock-update', 'production-comparison', 'linear-ci']),
    ('협업·통합 심화', ['issue-pr-management', 'domain-testing', 'ci-cd-optimization',
                   'parallel-ai-merge-train', 'evolve-or-rebuild']),
    ('도구·서식', ['templates', 'models', 'frontier', 'agents', 'skills']),
    ('운영 기준·강사용', ['levels', 'adaptive', 'workflow', 'standard', 'schedule']),
]

# Required-flow chain for prev/next pager (article ids in learning order).
CORE_FLOW = ['start', 'week1', 'week2', 'week3', 'week4']


def rewrite_md_links(text, source_path, mapping):
    def repl(m):
        name = Path(m[1]).name
        if name in mapping:
            return '](#' + mapping[name] + ')'
        return '](https://github.com/TheMagicTower/korean-ai-dev-course/blob/main/' + str((Path(source_path).parent / m[1])) + ')'
    return re.sub(r'\]\(([^):]+\.md)(?:#[^)]*)?\)', repl, text)


def render_body(text):
    body = markdown.markdown(text, extensions=['tables', 'fenced_code', 'sane_lists'])
    body = body.replace('<table>', '<div class="table-wrap"><table>').replace('</table>', '</table></div>')
    body = re.sub(r'<li>\[ \] (.*?)</li>',
                  lambda m: '<li class="check"><label><input type="checkbox"> <span>' + m[1] + '</span></label></li>', body)
    body = body.replace('<pre><code class="language-mermaid">', '<pre class="mermaid">').replace('</code></pre>', '</code></pre>')
    body = re.sub(r'(<pre class="mermaid">.*?)</code></pre>', r'\1</pre>', body, flags=re.S)
    return body


def apply_visuals(body, visuals):
    return re.sub(r'<!-- visual:([a-z-]+) -->', lambda m: visuals[m[1]], body)


def pager_for(article_id, labels):
    if article_id not in CORE_FLOW:
        return ''
    pos = CORE_FLOW.index(article_id)
    links = []
    if pos > 0:
        prev = CORE_FLOW[pos - 1]
        links.append(f'<a class="pager-prev" href="#{prev}">← 이전 · {labels[prev]}</a>')
    if pos < len(CORE_FLOW) - 1:
        nxt = CORE_FLOW[pos + 1]
        links.append(f'<a class="pager-next" href="#{nxt}">다음 · {labels[nxt]} →</a>')
    else:
        links.append('<span class="pager-done">필수 4주를 마쳤습니다. 선택 자료는 목차 그룹에서 고르세요.</span>')
    return '<nav class="pager" aria-label="핵심 과정 이전·다음">' + ''.join(links) + '</nav>'


def build_article(article_id, label, path, mapping, visuals, labels):
    text = (ROOT / path).read_text()
    text = rewrite_md_links(text, path, mapping)
    body = apply_visuals(render_body(text), visuals)
    pager = pager_for(article_id, labels)
    return (f'<article id="{article_id}" class="lesson" aria-label="{label}">'
            f'<div class="eyebrow">FIELD NOTES / {label}</div>{body}{pager}'
            '<div class="chapter-end">내 프로젝트에 필요한 결정과 증거를 남기고 다음 단계로 이동하세요.</div></article>')


def build_nav(groups, labels):
    parts = []
    for title, ids in groups:
        links = ''.join(f'<a href="#{i}">{labels[i]}</a>' for i in ids)
        parts.append(f'<details class="nav-group" open><summary class="nav-group-title">{title}</summary>{links}</details>')
    return ''.join(parts)


def build_page(sections, nav, css, js):
    return ('''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI로 만드는 나의 첫 완성품 · 4주 프로젝트 과정</title><style>''' + css + '''</style><noscript><style>.lesson{display:block}.mock-actions,.cost-controls{display:none}</style></noscript></head><body><a class="skip" href="#content">본문으로</a><header><a class="brand" href="#start">THE MAGIC TOWER <small>AI DEVELOPMENT LAB</small></a><div><span class="edition">첫 교재 · 4주 × 2시간</span><button id="print" type="button">인쇄 / PDF</button></div></header><aside><div class="nav-title">과정 안내</div><nav aria-label="교재 목차">''' + nav + '''</nav><div class="nav-foot"><strong id="progress">체크리스트 준비 중</strong><p>이 기기의 브라우저에 저장됩니다.</p><a href="https://github.com/TheMagicTower/korean-ai-dev-course">GitHub · 소스와 스킬 ↗</a></div></aside><main id="content" tabindex="-1"><div class="masthead"><p>아이디어에서 실제 사용까지</p><h1>작게 시작하고,<br>끝까지 완성합니다.</h1><p>AI 목업으로 경험을 확인하고, 규칙과 설계를 도출해<br>자신만의 프로젝트를 전달하는 실습 교재입니다.</p><div class="tags"><span>개인 아이디어</span><span>한국어 스킬 8개</span><span>목적에 맞는 완료 기준</span></div></div>''' + ''.join(sections) + '''<footer>2026 · TheMagicTower · 교육 초판. 조사 자료의 확인일과 검증 한계는 각 부록을 참고하세요.</footer></main><div id="toast" role="status" aria-live="polite"></div><script>''' + js + '''</script><script type="module">try {const {default:mermaid}=await import('https://cdn.jsdelivr.net/npm/mermaid@11.12.0/dist/mermaid.esm.min.mjs');mermaid.initialize({startOnLoad:false,securityLevel:'strict',theme:'neutral'});let queue=Promise.resolve();function render(){queue=queue.then(async()=>{for(const el of document.querySelectorAll('.lesson.active .mermaid:not([data-processed])')){const source=el.textContent;try{await mermaid.run({nodes:[el]});}catch(e){el.textContent=source;el.setAttribute('data-processed','failed');el.setAttribute('aria-label','텍스트 흐름도');}}});}render();addEventListener('hashchange',render);}catch(e){document.querySelectorAll('.mermaid').forEach(x=>x.setAttribute('aria-label','온라인 다이어그램 로딩 실패: 텍스트 흐름도'));}</script></body></html>''')


def main():
    mapping = {Path(path).name: id for id, _, path in ITEMS}
    labels = {id: label for id, label, _ in ITEMS}
    flat_nav = [i for _, ids in NAV_GROUPS for i in ids]
    assert sorted(flat_nav) == sorted(labels), 'nav groups must cover every article id exactly once'
    visuals = build_visuals(ROOT)
    sections = [build_article(id, label, path, mapping, visuals, labels) for id, label, path in ITEMS]
    nav = build_nav(NAV_GROUPS, labels)
    css = (ROOT / 'course/style.css').read_text() + '\n' + (ROOT / 'course/visuals.css').read_text()
    js = (ROOT / 'course/app.js').read_text() + '\n' + (ROOT / 'course/visuals.js').read_text()
    page = build_page(sections, nav, css, js)
    figure_numbers = iter(range(1, 100))
    page = re.sub(r'FIGURE \d{2}', lambda m: f'FIGURE {next(figure_numbers):02}', page)
    (ROOT / 'index.html').write_text(page)
    print('Built index.html:', len(ITEMS), 'chapters', len(page), 'characters')


if __name__ == '__main__':
    main()
