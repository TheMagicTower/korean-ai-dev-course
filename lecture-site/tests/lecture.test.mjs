import test from 'node:test';
import assert from 'node:assert/strict';
import {timeline,remainingSeconds,clockText,slideIndex,modeTotals,labMarkdown} from '../public/lecture-utils.js';
test('활동 시간은 중복 없이 누적되며 휴식도 포함한다',()=>{const s=[{mode:'explain',minutes:5},{mode:'lab',minutes:20},{mode:'break',minutes:10}];assert.deepEqual(timeline(s),[{start:0,end:5},{start:5,end:25},{start:25,end:35}]);assert.deepEqual(modeTotals(s),{explain:5,lab:20,break:10});});
test('타이머는 백그라운드 지연 뒤에도 실제 마감시각으로 계산한다',()=>{assert.equal(remainingSeconds(8000,1000),7);assert.equal(remainingSeconds(8000,7901),1);assert.equal(remainingSeconds(8000,9000),0);assert.equal(clockText(125),'02:05');assert.equal(clockText(-1),'00:00');});
test('잘못된 URL 또는 이전 진도는 첫 슬라이드로 안전하게 돌아간다',()=>{for(const value of [NaN,Infinity,-1,44,1.5,'abc'])assert.equal(slideIndex(value,44),0);assert.equal(slideIndex('43',44),43);});
test('실습 다운로드는 실행·완료·대안·심화 지시를 모두 보존한다',()=>{const md=labMarkdown({title:'실습',minutes:15,objective:'목표',steps:['단계'],deliverable:'파일',success:['조건'],fallback:'대안',stretch:'추가'});for(const x of ['15분','1. 단계','파일','- 조건','대안','추가'])assert(md.includes(x));});
