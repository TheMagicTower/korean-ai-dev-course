import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const load=async p=>JSON.parse(await readFile(p,'utf8'));
const w=await load('content/workshop.json');
assert.equal(w.sessions.length,5);for(const s of w.sessions)assert.equal(s.agenda.reduce((n,x)=>n+x.minutes,0),240,`session ${s.id} time`);
assert.equal(w.fourDay.length,4);for(const s of w.fourDay)assert.equal(s.agenda.reduce((n,x)=>n+x.minutes,0),300);
assert.equal(w.rubric.reduce((n,x)=>n+x.points,0),100);
assert.deepEqual(w.rubric.map(x=>x.points),[20,25,20,20,15]);
const slides=await load('content/slides.json');let count=0;
const kinds=new Set(['title','bullets','columns','quote','image','contributions','merge','checklist','flow','exercise']);
for(const s of slides.sessions){assert(s.slides.length>=10);for(const x of s.slides){count++;assert(x.title&&x.notes);assert(kinds.has(x.kind));if(x.image)await access('public'+x.image);for(const src of x.sources||[])assert.equal(new URL(src.url).protocol,'https:');if(x.link?.url.startsWith('/')){const p=x.link.url.split(/[?#]/)[0];await access('public'+p+(p.endsWith('/')?'index.html':''))}}}
assert(count>=55);
const catalog=await load('content/data-catalog.json');assert(catalog.length>=8);for(const x of catalog)assert.equal(new URL(x.url).hostname,'www.data.go.kr');
const libraries=await load('public/data/libraries.json');assert.equal(libraries.rows.length,27);assert.equal(new Set(libraries.rows.map(x=>x.name)).size,27);assert(libraries.rows.every(x=>x.referenceDate==='2024-11-20'));
for(const file of ['worker.js',...['app.js','pages.js','slides.js','demo.js','submissions.js'].map(x=>'public/'+x)])execFileSync(process.execPath,['--check',file]);
async function files(dir){const result=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())result.push(...await files(p));else result.push(p)}return result}
const publicFiles=await files('public');assert(publicFiles.every(p=>!/secrets|\.dev\.vars|private\/|worker\.js/.test(p)));
const privateSecret=await load('private/secrets.json').catch(()=>null);if(privateSecret){for(const p of publicFiles.filter(p=>/\.(js|html|json|css|md)$/.test(p)))assert(!(await readFile(p,'utf8')).includes(privateSecret.ADMIN_PASSWORD),`Secret exposed in ${p}`)}
console.log(`PASS: ${count} slides, 5×240 / 4×300 minutes, 100-point rubric, 8 datasets, 27 real records, JS syntax and public secret exclusion.`);
