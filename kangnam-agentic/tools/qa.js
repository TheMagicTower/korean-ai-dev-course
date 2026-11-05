// QA: screenshot every slide of a session, flag overflow, write a contact sheet.
// Usage: NODE_PATH=$(npm root -g) node tools/qa.js 1 [fromSlide toSlide]   or  qa.js p5  (after build.py p5)
// Output: qa/session-N/sNN.png, qa/session-N-sheet-K.png (12 slides per sheet), overflow report on stdout
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const root = path.resolve(__dirname, '..'); const n = process.argv[2] || '1';
const from = +(process.argv[3] || 1), to = +(process.argv[4] || 9999);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 940 } });
  const isP = n.startsWith('p'); const pn = isP ? 'p' + n.slice(1).padStart(2, '0') : null; const src = isP ? path.join(root, 'preview', pn + '.html') : path.join(root, `session-${n}.html`);
  const out = path.join(root, 'qa', isP ? pn : `session-${n}`); fs.mkdirSync(out, { recursive: true });
  await p.goto('file://' + src); await p.waitForTimeout(1500);
  const total = await p.evaluate(() => document.querySelectorAll('.slide').length);
  const shots = []; const problems = [];
  for (let k = from; k <= Math.min(total, to); k++) {
    await p.evaluate(k => { location.hash = '#s' + k; }, k); await p.waitForTimeout(350);
    const issues = await p.evaluate(() => {
      const s = document.querySelector('.slide.on'); const r = s.getBoundingClientRect(); const bad = [];
      s.querySelectorAll('*').forEach(el => { if (el.closest('aside')) return; const e = el.getBoundingClientRect(); if (!e.width || !e.height) return;
        if (e.bottom > r.bottom + 2 || e.right > r.right + 2) bad.push((el.className || el.tagName).toString().slice(0, 30) + ' ' + Math.round(e.bottom - r.bottom) + 'px'); });
      s.querySelectorAll('img').forEach(i => { if (!i.complete || !i.naturalWidth) bad.push('img-missing ' + i.getAttribute('src')); });
      return [...new Set(bad)].slice(0, 5);
    });
    if (issues.length) problems.push(`s${k}: ${issues.join(' | ')}`);
    const f = path.join(out, `s${String(k).padStart(2, '0')}.png`); await p.screenshot({ path: f }); shots.push(f);
  }
  // contact sheets: 12 per page, 4 columns
  for (let g = 0; g < shots.length; g += 12) {
    const group = shots.slice(g, g + 12);
    const cells = group.map(f => `<figure><img src="file://${f}"><figcaption>${path.basename(f)}</figcaption></figure>`).join('');
    await p.setContent(`<style>body{margin:0;background:#888;font:12px monospace}div{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:6px}figure{margin:0}img{width:100%;display:block}figcaption{color:#fff}</style><div>${cells}</div>`);
    await p.setViewportSize({ width: 1500, height: 1200 }); await p.waitForTimeout(800);
    await p.screenshot({ path: path.join(root, 'qa', `${isP ? pn : 'session-' + n}-sheet-${g / 12 + 1}.png`), fullPage: true });
    await p.setViewportSize({ width: 1600, height: 940 });
  }
  console.log(`slides ${total}, checked ${shots.length}`); console.log(problems.length ? problems.join('\n') : 'no overflow');
  await b.close();
})();
