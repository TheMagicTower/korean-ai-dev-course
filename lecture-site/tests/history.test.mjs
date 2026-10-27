import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
const module=JSON.parse(await readFile('content/agentic-history.json','utf8'));
const slides=module.sessions.flatMap(s=>s.slides);
test('1강1교시는 34장·60분이며 각 장은 1~2분입니다',()=>{
 assert.equal(slides.length,34);assert.equal(slides.reduce((n,s)=>n+s.minutes,0),60);
 assert(slides.every(s=>s.minutes===1||s.minutes===2));assert.equal(new Set(slides.map(s=>s.id)).size,34);
});
test('각 장에는 독립 학습용 설명과 필요한 영상·그림 원문이 있습니다',async()=>{
 for(const s of slides){assert(s.notes.length>=150,s.id);if(s.image)await access('public'+s.image);if(s.poster)await access('public'+s.poster);for(const src of s.sources)assert.equal(new URL(src.url).protocol,'https:');if(s.videoUrl){assert(s.sources.length);assert.equal(new URL(s.videoUrl).protocol,'https:');}}
 const generated=new Set(slides.filter(s=>s.caption?.includes('AI 생성')).map(s=>s.image));assert.equal(generated.size,2);
});
test('확인된 날짜와 현재 기능 설명을 구분하고 영상은 허용된 공식 도메인만 사용합니다',()=>{
 assert(module.timeline.some(x=>x.date==='2021-06-29'));
 assert(module.timeline.some(x=>x.date==='2023-05-11'));
 assert(module.timeline.some(x=>x.date==='2026-10-27 확인'));
 for(const s of slides.filter(s=>s.videoUrl))assert(['github.blog','code.visualstudio.com','www.youtube.com'].includes(new URL(s.videoUrl).hostname));
});
