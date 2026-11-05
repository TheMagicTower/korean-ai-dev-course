#!/usr/bin/env python3
"""Assemble slides: src/periods/pNN.html -> session-N.html (local, full document) and _artifact/session-N.html (fragment).
Usage: python3 tools/build.py [session ...]   (no args = every session that has at least one period file)
Placeholders inside period files:
  {{svg:NAME}}  -> contents of diagrams/out/NAME.svg  (wrap Pele diagrams in <div class="diagram pele-theme">)
Every <section class="slide"> gets data-period from its file name automatically.
"""
import re, sys, pathlib, html
ROOT = pathlib.Path(__file__).resolve().parent.parent
SESSIONS = {1: range(1, 5), 2: range(5, 9), 3: range(9, 13), 4: range(13, 17), 5: range(17, 21)}
DATES = {1: '2026-11-03', 2: '2026-11-10', 3: '2026-11-17', 4: '2026-11-24', 5: '2026-12-01'}
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap">')

_SEQ = [0]
def svg(name):
    p = ROOT / 'diagrams/out' / f'{name}.svg'
    if not p.exists():
        print(f'  ! missing diagram {name}')
        return f'<p class="under">[도식 누락: {html.escape(name)}]</p>'
    # every insertion gets unique ids, so a diagram used twice keeps its arrowheads/masks
    _SEQ[0] += 1; k = f'u{_SEQ[0]}-'
    t = p.read_text()
    ids = set(re.findall(r'\sid="([^"]+)"', t))
    for i in sorted(ids, key=len, reverse=True):
        e = re.escape(i)
        t = re.sub(r'(\sid=")' + e + '"', r'\g<1>' + k + i + '"', t)
        t = re.sub(r'url\(#' + e + r'\)', 'url(#' + k + i + ')', t)
        t = re.sub(r'(href=")#' + e + '"', r'\g<1>#' + k + i + '"', t)
    return t

def build(n, periods=None, out=None):
    parts = []
    for p in (periods or SESSIONS[n]):
        f = ROOT / 'src/periods' / f'p{p:02d}.html'
        if not f.exists():
            continue
        t = f.read_text()
        t = re.sub(r'\{\{svg:([\w-]+)\}\}', lambda m: svg(m.group(1)), t)
        t = re.sub(r'<section class="slide', f'<section data-period="{p}" class="slide', t)
        parts.append(t)
    if not parts:
        return False
    body = '\n'.join(parts)
    count = len(re.findall(r'<section ', body))
    css = (ROOT / 'src/deck.css').read_text()
    js = (ROOT / 'src/deck.js').read_text()
    title = f'Agentic Engineering {n}회차'
    frag = (f'<title>{title}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n{FONTS}\n<style>\n{css}\n</style>\n'
            f'<div class="stage"><div class="deck" id="deck">\n{body}\n</div></div>\n'
            '<div class="notes" id="notes" hidden></div>\n'
            '<div class="hud"><span id="pos"></span><div class="bar"><i id="prog"></i></div>'
            '<select id="jump" aria-label="교시로 이동"></select>'
            '<button id="nb" type="button">노트 N</button><button id="fb" type="button">전체 화면 F</button></div>\n'
            f'<script>\n{js}\n</script>\n')
    full = ('<!doctype html>\n<html lang="ko"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
            '<style>html,body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>'
            f'</head><body>\n{frag}</body></html>\n')
    if out:
        out.parent.mkdir(exist_ok=True); out.write_text(full.replace('<meta charset="utf-8">', '<meta charset="utf-8"><base href="../">', 1)); print(f'{out.name}  {count} slides'); return True
    (ROOT / f'session-{n}.html').write_text(full)
    (ROOT / '_artifact').mkdir(exist_ok=True)
    (ROOT / '_artifact' / f'session-{n}.html').write_text(frag)
    print(f'session-{n}.html  {count} slides')
    return True

if __name__ == '__main__':
    # 'p5' -> preview/p05.html with only period 5 (safe for parallel authors)
    for a in sys.argv[1:]:
        if a.startswith('p'):
            k = int(a[1:]); n = next(s for s, r in SESSIONS.items() if k in r)
            build(n, [k], ROOT / 'preview' / f'p{k:02d}.html')
    want = [int(a) for a in sys.argv[1:] if not a.startswith('p')] or ([] if any(a.startswith('p') for a in sys.argv[1:]) else list(SESSIONS))
    for n in want:
        build(n)
