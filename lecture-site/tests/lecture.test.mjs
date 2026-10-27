import test from 'node:test';
import assert from 'node:assert/strict';
import {timeline,remainingSeconds,clockText,slideIndex,modeTotals,labMarkdown,resolveSlideHash} from '../public/lecture-utils.js';
test('활동 시간은 중복 없이 누적되며 휴식도 포함한다',()=>{const s=[{mode:'explain',minutes:5},{mode:'lab',minutes:20},{mode:'break',minutes:10}];assert.deepEqual(timeline(s),[{start:0,end:5},{start:5,end:25},{start:25,end:35}]);assert.deepEqual(modeTotals(s),{explain:5,lab:20,break:10});});
test('타이머는 백그라운드 지연 뒤에도 실제 마감시각으로 계산한다',()=>{assert.equal(remainingSeconds(8000,1000),7);assert.equal(remainingSeconds(8000,7901),1);assert.equal(remainingSeconds(8000,9000),0);assert.equal(clockText(125),'02:05');assert.equal(clockText(-1),'00:00');});
test('잘못된 URL 또는 이전 진도는 첫 슬라이드로 안전하게 돌아간다',()=>{for(const value of [NaN,Infinity,-1,44,1.5,'abc'])assert.equal(slideIndex(value,44),0);assert.equal(slideIndex('43',44),43);});
test('실습 다운로드는 실행·완료·대안·심화 지시를 모두 보존한다',()=>{const md=labMarkdown({title:'실습',minutes:15,objective:'목표',steps:['단계'],deliverable:'파일',success:['조건'],fallback:'대안',stretch:'추가'});for(const x of ['15분','1. 단계','파일','- 조건','대안','추가'])assert(md.includes(x));});

test('사례의 고정 ID 링크는 삽입·재배치 뒤에도 같은 슬라이드를 연다',()=>{
 const slides=[{id:'first'},{id:'new'},{id:'case'}];
 assert.equal(resolveSlideHash('#case',slides),2);assert.equal(resolveSlideHash('#2',slides),1);
 assert.equal(resolveSlideHash('#missing',slides,2),0);assert.equal(resolveSlideHash('',slides,1),1);
 assert.equal(resolveSlideHash('#999',slides),0);assert.equal(resolveSlideHash('#main',slides,2),2);
});
test('실습 안내에는 준비부터 기록까지의 시간과 중간 전환 기준이 남는다',()=>{
 const md=labMarkdown({title:'실습',minutes:10,objective:'목표',steps:['파일 준비','실행·기록'],pacing:[{minutes:2},{minutes:8}],checkpoint:'5분에 대안 전환',deliverable:'기록',success:['조건'],fallback:'대안',stretch:'심화'});
 for(const part of ['2분 · 파일 준비','8분 · 실행·기록','5분에 대안 전환'])assert(md.includes(part));
});
