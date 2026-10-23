import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {modeTotals,timeline} from '../public/lecture-utils.js';
const load=async p=>JSON.parse(await readFile(p,'utf8'));
const w=await load('content/workshop.json');
assert.equal(w.sessions.length,5);for(const s of w.sessions)assert.equal(s.agenda.reduce((n,x)=>n+x.minutes,0),240,`session ${s.id} time`);
assert.equal(w.fourDay.length,4);for(const s of w.fourDay)assert.equal(s.agenda.reduce((n,x)=>n+x.minutes,0),300);
assert.equal(w.rubric.reduce((n,x)=>n+x.points,0),100);assert.deepEqual(w.rubric.map(x=>x.points),[20,25,20,20,15]);
const slides=await load('content/slides.json');let count=0;const ids=new Set(),images=new Set();
const kinds=new Set(['title','bullets','columns','quote','image','contributions','merge','checklist','flow','exercise','code','comparison','reference','quiz','lab','break','visual']);
const expected=[{explain:75,demo:30,lab:80,discussion:35,break:20},{explain:50,demo:45,lab:100,discussion:25,break:20},{explain:60,demo:35,lab:100,discussion:25,break:20},{explain:45,demo:30,lab:120,discussion:25,break:20},{explain:41,demo:20,lab:125,discussion:34,break:20}];
for(const s of slides.sessions){
 assert(s.slides.length>=40&&s.slides.length<=50,`session ${s.id}: density`);
 assert.equal(timeline(s.slides).at(-1).end,240);
 for(const [key,n]of Object.entries(expected[s.id-1]))assert.equal(modeTotals(s.slides)[key],n);
 for(const [kind,min]of Object.entries({lab:4,quiz:3,reference:2,break:2}))assert(s.slides.filter(x=>x.kind===kind).length>=min,`${s.id} ${kind}`);
 for(const x of s.slides){
  count++;assert(x.title&&x.notes?.length>=80,`${x.id} notes`);assert(kinds.has(x.kind),`${x.id} kind`);assert(x.block&&Number.isInteger(x.minutes)&&x.minutes>0);assert(!ids.has(x.id));ids.add(x.id);
  if(x.image){await access('public'+x.image);images.add(x.image);}
  if(x.kind==='lab'){assert.equal(x.pacing.reduce((n,p)=>n+p.minutes,0),x.minutes,`${x.id} paced minutes`);assert.equal(x.pacing.length,x.steps.length);assert(x.pacing.every(p=>p.minutes>0&&p.label));assert(x.checkpoint);assert.equal(x.slideSteps.length,x.steps.length);for(const key of ['objective','deliverable','fallback','stretch'])assert(x[key]?.length,`${x.id} ${key}`);assert(x.steps.length>=3&&x.success.length>=2);}
  if(x.kind==='quiz'){assert(x.options.length>=3&&x.options.length<=4);assert(Number.isInteger(x.answerIndex)&&x.answerIndex>=0&&x.answerIndex<x.options.length);assert(x.explanation);}
  if(x.kind==='reference')assert(x.sources?.length&&x.findings.length>=2&&x.application&&x.caveat);
  if(x.kind==='code')assert(x.code?.split('\n').length<=12,`${x.id} code length`);
  for(const src of x.sources||[])assert.equal(new URL(src.url).protocol,'https:');
  if(x.link?.url.startsWith('/')){const p=x.link.url.split(/[?#]/)[0];await access('public'+p+(p.endsWith('/')?'index.html':''));}
 }
}
for(const session of slides.sessions){
 const times=timeline(session.slides);let last=0;
 assert(times[session.slides.findIndex(s=>s.kind==='lab')].start<=30,'First practice within 30min');
 for(const [i,s]of session.slides.entries())if(s.mode==='break'){assert(times[i].start-last<=90,'Teaching block max 90min');last=times[i].end;}
 assert.equal(session.slides.filter(s=>s.mode==='break').length,2);assert(240-last<=90);
}
const originals=slides.sessions.flatMap(s=>s.slides).filter(s=>s.mode!=='break');
const fourDayItems=w.fourDay.flatMap(s=>s.agenda).filter(s=>s.slideId);
assert.deepEqual(fourDayItems.map(s=>[s.slideId,s.minutes]),originals.map(s=>[s.id,s.minutes]),'4day must preserve order and whole activities');
for(const day of w.fourDay){let run=0;for(const a of day.agenda){if(a.mode==='break'){assert(run<=110);run=0;}else run+=a.minutes;}assert(run<=110);}
assert(count>=210);assert.equal([...images].filter(x=>x.includes('/generated/')).length,5);assert.equal(w.timeBudget.lab,525);
const coverage=await load('content/repository-coverage.json');
const mappedFiles=[];for(const row of coverage.entries){for(const f of row.files){await access('../'+f);mappedFiles.push(f);}for(const id of row.slides)assert(ids.has(id),`Coverage missing ${id}`);assert(row.decision);}
assert.equal(new Set(mappedFiles).size,mappedFiles.length,'Duplicate source mapping');
for(const dir of ['course','course/cases','course/updates'])for(const f of await readdir('../'+dir))if(f.endsWith('.md'))assert(mappedFiles.includes(dir+'/'+f),`Missing curriculum source ${dir}/${f}`);
const personas=await load('review/personas.json'),review=await load('review/persona-round-5.json');
assert.deepEqual(review.checks.map(x=>[x.id,x.questions]),personas.personas.flatMap(x=>x.checks.map(c=>[c.id,c.questions])),'Preserve all 25 original persona questions');
for(const check of review.checks)for(const id of check.slides)assert(ids.has(id),`Review missing ${id}`);
const catalog=await load('content/data-catalog.json');assert(catalog.length>=8);for(const x of catalog)assert.equal(new URL(x.url).hostname,'www.data.go.kr');
const libraries=await load('public/data/libraries.json');assert.equal(libraries.rows.length,27);assert.equal(new Set(libraries.rows.map(x=>x.name)).size,27);assert(libraries.rows.every(x=>x.referenceDate==='2024-11-20'));
for(const file of ['worker.js',...['app.js','pages.js','slides.js','demo.js','submissions.js','learning.js','lecture-utils.js','cases.js'].map(x=>'public/'+x)])execFileSync(process.execPath,['--check',file]);
const csp=await load('lab-csp.json');for(const [path,hashes]of Object.entries(csp)){const html=await readFile('public'+path,'utf8');const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>'sha256-'+createHash('sha256').update(x[1]).digest('base64'));assert.deepEqual(hashes,scripts,`${path} CSP hashes`);}
async function files(dir){const result=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())result.push(...await files(p));else result.push(p);}return result;}
const publicFiles=await files('public');assert(publicFiles.every(p=>!/secrets|\.dev\.vars|private\/|worker\.js/.test(p)));
const privateSecret=await load('private/secrets.json').catch(()=>null);if(privateSecret){for(const p of publicFiles.filter(p=>/\.(js|html|json|css|md)$/.test(p)))assert(!(await readFile(p,'utf8')).includes(privateSecret.ADMIN_PASSWORD),`Secret exposed in ${p}`);}
console.log(`PASS: ${count} substantive slides, five 240min schedules, four 300min schedules, 525min labs, five generated illustrations, quiz/lab/reference fields, CSP hashes and public secret exclusion.`);
