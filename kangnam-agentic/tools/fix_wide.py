# Re-shape over-wide D2 diagrams based on where they sit on the slide.
import re, glob, math, pathlib, subprocess, json
R = pathlib.Path(__file__).resolve().parent.parent
def ratio(name):
    s = (R/'diagrams/out'/f'{name}.svg').read_text(); m = re.search(r'viewBox="([-\d. ]+)"', s)
    x,y,w,h = map(float, m.group(1).split()); return w/h
ctx = {}
for f in sorted(glob.glob(str(R/'src/periods/p*.html'))):
    t = open(f).read()
    for sec in re.findall(r'<section.*?</section>', t, re.S):
        for name in re.findall(r'\{\{svg:([\w-]+)\}\}', sec):
            i = sec.index('{{svg:'+name); before = sec[:i]
            col = bool(re.search(r'class="(row|lab|frames|compare)', before)) and before.count('<div') - before.count('</div') > 2
            ctx[name] = ctx.get(name, False) or col
changed = []
for f in sorted(glob.glob(str(R/'diagrams/src/p*.d2'))):
    name = pathlib.Path(f).stem
    if name not in ctx: continue
    src = open(f).read(); r = ratio(name)
    top = [l for l in src.splitlines() if re.match(r'^[A-Za-z_][\w-]*\s*:', l) and not re.match(r'^(direction|grid-\w+|vars|classes|style)\b', l)]
    containers = [l for l in top if l.rstrip().endswith('{')]
    new = src
    def setdir(d):
        global new
        new = re.sub(r'^direction:\s*\w+\s*$', f'direction: {d}', new, flags=re.M) if re.search(r'^direction:', new, re.M) else f'direction: {d}\n' + new
    if ctx[name] and r > 2.2:
        setdir('down'); why='column→down'
    elif not ctx[name] and r > 5:
        if containers: setdir('down'); why='containers→down'
        elif len(top) >= 4 and 'grid-' not in src: new = re.sub(r'^(direction:.*)$', r'\1\ngrid-columns: %d' % math.ceil(len(top)/2), new, count=1, flags=re.M) if re.search(r'^direction:', new, re.M) else 'grid-columns: %d\n' % math.ceil(len(top)/2) + new; why='grid'
        else: continue
    else: continue
    if new != src:
        open(f,'w').write(new); changed.append((name, round(r,1), why))
print(json.dumps(changed, ensure_ascii=False))
