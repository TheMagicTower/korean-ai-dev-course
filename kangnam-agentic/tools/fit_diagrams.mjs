// For each D2 diagram used on a slide, try layout variants and keep the one whose text renders largest in its slot.
// Usage: node tools/fit_diagrams.mjs ctx.json   (ctx.json: {name: "full"|"col"})
import fs from 'node:fs'; import path from 'node:path';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const ctx=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const { D2 } = await import('@terrastruct/d2'); const d2=new D2();
const SLOT={full:[1424,560],col:[640,600]};
const strip=s=>s.replace(/^(direction|grid-columns|grid-rows):.*\n/gm,'');
function inner(s){const out=[];let depth=0;for(const l of s.split('\n')){out.push(l);if(depth===0&&/^[A-Za-z_][\w-]*\s*:.*\{\s*$/.test(l))out.push('  grid-columns: 1');depth+=(l.match(/\{/g)||[]).length-(l.match(/\}/g)||[]).length;}return out.join('\n');}
const report=[];
for(const [name,where] of Object.entries(ctx)){
  const f=path.join(root,'diagrams/src',name+'.d2'); if(!fs.existsSync(f)) continue;
  const base=strip(fs.readFileSync(f,'utf8'));
  const top=base.split('\n').filter(l=>/^[A-Za-z_][\w-]*\s*:/.test(l)&&!/^(vars|classes|style)\b/.test(l)&&!/->/.test(l));
  const hasC=top.some(l=>/\{\s*$/.test(l)); const n=top.length;
  const vars=[];
  for(const dir of ['right','down']) for(const inn of [false]){
    vars.push(`direction: ${dir}\n`+(inn?inner(base):base));
    if(false) vars.push(`direction: right\ngrid-columns: ${k}\n`+(inn?inner(base):base));
  }
  let best=null;
  for(const v of [...new Set(vars)]){
    try{const r=await d2.compile(v,{layout:'elk'});const svg=await d2.render(r.diagram,{noXMLTag:true,pad:20});
      const [,, w,h]=svg.match(/viewBox="([-\d. ]+)"/)[1].split(' ').map(Number);
      const [W,H]=SLOT[where]; const s=Math.min(W/w,H/h); if(!best||s>best.s) best={s,v};
    }catch(e){}
  }
  if(best){fs.writeFileSync(f,best.v); report.push(`${name} ${where} scale=${best.s.toFixed(2)}`);}
}
console.log(report.join('\n')); process.exit(0);
