import {readFile,writeFile} from 'node:fs/promises';
import {fourDaySchedule} from './pacing.mjs';
import {modeTotals} from '../public/lecture-utils.js';
const load=async p=>JSON.parse(await readFile(p,'utf8'));
const sessions=await Promise.all([1,2,3,4,5].map(id=>load(`content/revision/session-${id}.json`)));
// Slide sources own their visual metadata and copy; assembly only combines them.
const expected=[{explain:75,demo:30,lab:80,discussion:35,break:20},{explain:50,demo:45,lab:100,discussion:25,break:20},{explain:60,demo:35,lab:100,discussion:25,break:20},{explain:45,demo:30,lab:120,discussion:25,break:20},{explain:41,demo:20,lab:125,discussion:34,break:20}];
for(const [i,s]of sessions.entries())for(const [k,n]of Object.entries(expected[i]))if(modeTotals(s.slides)[k]!==n)throw Error(`Timing ${s.id} ${k}`);
await writeFile('content/slides.json',JSON.stringify({revision:'2026-10-28',sessions},null,2)+'\n');
const w=await load('content/workshop.json');w.timeBudget=modeTotals(sessions.flatMap(s=>s.slides));w.revision='2026-10-28';
for(const session of sessions){const s=w.sessions.find(x=>x.id===session.id);s.title=session.title;s.slideCount=session.slides.length;s.timeBudget=modeTotals(session.slides);s.agenda=[];for(const [i,slide]of session.slides.entries()){let block=s.agenda.at(-1);if(block?.title!==slide.block||block.mode!==slide.mode){block={title:slide.block,mode:slide.mode,minutes:0,description:'',firstSlide:i+1};s.agenda.push(block);}block.minutes+=slide.minutes;block.description+=(block.description?' / ':'')+slide.title;}}
// Reuse complete activities; never split a quiz, demo or lab at a clock boundary.
w.fourDay=fourDaySchedule(sessions);
w.fourDayNote='4회 진행안은 같은 5개 주제 모듈을 300분씩 이어서 사용합니다. 활동을 중간에 자르지 않고 완료·인계 후 다음 날로 넘어갑니다. 일자별 휴식20분(총80분)과 추가 기록·재검증 실습20분을 포함합니다. 실습 합계545분이며, 기본 5회안은 실습525분·휴식100분입니다. 과제 번호는 주제 기준0~5를 유지합니다. 각 활동의 링크로 해당 자료를 여십시오. 슬라이드 상단 누적 시간은 기본5회안 기준이므로 이 진행안의 시각을 따릅니다.';
await writeFile('content/workshop.json',JSON.stringify(w,null,2)+'\n');
console.log('Assembled',sessions.map(s=>s.slides.length).join('/'),'slides;',w.timeBudget);
