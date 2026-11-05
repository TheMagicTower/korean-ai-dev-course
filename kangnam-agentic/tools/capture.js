// Capture a real page (or one element of it) into assets/captures/NAME.jpg
// Usage: NODE_PATH=$(npm root -g) node tools/capture.js NAME URL [CSS_SELECTOR] [INDEX] [--scroll=PX] [--clip=x,y,w,h] [--width=1440] [--height=900]
// Without a selector it saves the visible viewport (after --scroll). With --clip it crops that region of the viewport (CSS px).
// Then: python3 tools/tojpg.py NAME  (done automatically below via sharp-free PIL call)
const { chromium } = require('playwright'); const path = require('path'); const { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2); const flags = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
const [name, url, sel, idx] = args.filter(a => !a.startsWith('--'));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +(flags.width || 1440), height: +(flags.height || 900) }, deviceScaleFactor: 2 });
  try { await p.goto(url, { waitUntil: 'networkidle', timeout: 45000 }); } catch (e) { console.log('slow load, continuing'); }
  await p.waitForTimeout(2500);
  // dismiss common cookie banners
  for (const t of ['Accept all', 'Accept', 'I agree', 'Got it', '동의', 'Reject all']) { const btn = p.getByRole('button', { name: t }); if (await btn.count()) { try { await btn.first().click({ timeout: 1000 }); } catch (_) {} } }
  if (flags.text) { const el = p.getByText(flags.text, { exact: false }).first(); try { await el.scrollIntoViewIfNeeded({ timeout: 5000 }); await p.evaluate(() => window.scrollBy(0, -120)); await p.waitForTimeout(1200); } catch (e) { console.log('text not found'); } }
  if (flags.scroll) { await p.evaluate(y => window.scrollTo(0, y), +flags.scroll); await p.waitForTimeout(1200); }
  const png = path.join(root, 'assets/captures', name + '.png');
  if (sel) {
    const els = await p.$$(sel); const el = els[+(idx || 0)];
    if (!el) { console.log('NOT FOUND', sel, 'count', els.length); process.exit(1); }
    await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(1200); await el.screenshot({ path: png });
  } else if (flags.clip) {
    const [x, y, w, h] = flags.clip.split(',').map(Number); await p.screenshot({ path: png, clip: { x, y, width: w, height: h } });
  } else { await p.screenshot({ path: png }); }
  await b.close();
  execFileSync('python3', ['-c', `
from PIL import Image; import os
src='${png}'; im=Image.open(src).convert('RGB')
if im.size[0]>1600: im=im.resize((1600,int(im.size[1]*1600/im.size[0])),Image.LANCZOS)
im.save(src[:-4]+'.jpg',quality=84); os.remove(src); print('saved', src[:-4]+'.jpg', im.size)`], { stdio: 'inherit' });
})();
