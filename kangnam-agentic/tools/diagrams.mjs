// Render diagrams/src/*.mmd (Pele) and *.d2 (D2 wasm, same engine Kroki uses) to diagrams/out/*.svg
// Usage: node tools/diagrams.mjs [name ...]   (no args = all)
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const srcDir = path.join(root,'diagrams/src'), outDir = path.join(root,'diagrams/out');
const only = process.argv.slice(2);
const pele = require('pele');
let d2 = null;
const files = fs.readdirSync(srcDir).filter(f=>/\.(mmd|d2)$/.test(f)).filter(f=>!only.length||only.includes(f.replace(/\.(mmd|d2)$/,'')));
const HOT = /#ff00ff/i;
function normD2(svg){
  svg = svg.replace(/<\?xml[^>]*>/,'').replace(/<style[\s\S]*?<\/style>/g,'');
  // background rect
  svg = svg.replace(/<rect x="-?[\d.]+" y="-?[\d.]+" width="[\d.]+" height="[\d.]+" rx="0\.000000" fill="#FFFFFF" class=" fill-N7" stroke-width="0" \/>/,'');
  svg = svg.replace(/<rect([^>]*?) stroke="([^"]*)" fill="([^"]*)" class="([^"]*)"([^>]*)\/>/g,(m,a,stroke,fill,cls,b)=>{
    const outer = /fill-B4|fill-AA4|fill-N/.test(cls) && !/fill-B5|fill-B6/.test(cls);
    const hot = HOT.test(stroke);
    return `<rect${a} class="${outer?'box-outer':'box-inner'}${hot?' hot':''}"${b.replace(/style="[^"]*"/,'')}/>`;
  });
  svg = svg.replace(/class="text fill-N1" style="([^"]*)"/g,'class="label-outer" style="$1"');
  svg = svg.replace(/class="text-bold fill-N1" style="([^"]*)"/g,'class="label-inner" style="$1"');
  svg = svg.replace(/class="text-italic fill-N2" style="([^"]*)"/g,'class="edge-label" style="$1"');
  svg = svg.replace(/ fill="#[0-9A-Fa-f]{6}"(?= class="(label|edge))/g,'');
  svg = svg.replace(/stroke="#[0-9A-Fa-f]{6}" fill="none" class="connection stroke-B1"/g,'class="edge"');
  svg = svg.replace(/fill="#[0-9A-Fa-f]{6}" class="connection fill-B1"/g,'class="arrow-head"');
  svg = svg.replace(/<svg xmlns=/,'<svg class="d2" xmlns=');
  return svg;
}
for (const f of files){
  const name = f.replace(/\.(mmd|d2)$/,''); const src = fs.readFileSync(path.join(srcDir,f),'utf8');
  try{
    let svg;
    if (f.endsWith('.mmd')) { svg = pele.render(src).svg; }
    else {
      if(!d2){ const { D2 } = await import('@terrastruct/d2'); d2 = new D2(); }
      const r = await d2.compile(src, { layout:'elk', pad:20 });
      svg = normD2(await d2.render(r.diagram, { ...(r.renderOptions||{}), pad:20, noXMLTag:true }));
    }
    fs.writeFileSync(path.join(outDir,name+'.svg'), svg); console.log('ok', name, svg.length);
  }catch(e){ console.log('FAIL', name, String(e.message||e).slice(0,300)); }
}
process.exit(0);
