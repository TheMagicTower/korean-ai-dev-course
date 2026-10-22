import {readFile,writeFile} from 'node:fs/promises';
import {modeTotals} from '../public/lecture-utils.js';
const load=async p=>JSON.parse(await readFile(p,'utf8'));
const sessions=await Promise.all([1,2,3,4,5].map(id=>load(`content/revision/session-${id}.json`)));
const visuals={
 2:{index:2,image:'ux-to-system',caption:'AI 생성 개념 이미지 · 화면의 흐름에서 데이터와 규칙으로',bullets:['먼저 사용자가 끝내고 싶은 행동을 정합니다.','화면 뒤에서 필요한 데이터·검증·실패 처리를 배치합니다.','실제 제약을 발견하면 UX도 다시 수정합니다.']},
 3:{index:4,image:'parallel-integration',caption:'AI 생성 개념 이미지 · 독립 작업과 공통 통합 검사',bullets:['검색·데이터 읽기·저장의 책임을 나눕니다.','입력과 출력의 계약을 서로 합의합니다.','각 작업 검사 뒤 합쳐진 사용자 흐름을 검사합니다.']},
 4:{title:'가상 검사와 실제 사용자 관찰은 다른 질문에 답합니다',image:'persona-evidence',caption:'AI 생성 개념 이미지 · 가상 시나리오와 실제 관찰은 별도 근거',bullets:['가상 사용자는 여러 조건의 실패 가능성을 탐색합니다.','실제 사람의 사용에서는 관찰한 행동을 기록합니다.','AI의 추정을 실제 사용자 반응으로 바꾸지 않습니다.']},
 5:{index:0,image:'release-feedback',caption:'AI 생성 개념 이미지 · 공개 → 사용 관찰 → 개선',bullets:['다른 기기에서 접근할 수 있는 주소를 만듭니다.','실제 사용자의 핵심 과업 수행을 관찰합니다.','확인한 문제 하나를 고치고 같은 조건에서 다시 봅니다.']}
};
for(const session of sessions){const v=visuals[session.id];if(v){const slide=v.title?session.slides.find(s=>s.title===v.title):session.slides[v.index];if(!slide)throw Error('Missing visual target '+session.id);slide.kind='visual';slide.dark=false;slide.image=`/images/generated/${v.image}.png`;slide.caption=v.caption;slide.bullets=v.bullets;delete slide.subtitle;}}
const expected=[{explain:80,demo:30,lab:75,discussion:35,break:20},{explain:50,demo:45,lab:100,discussion:25,break:20},{explain:60,demo:35,lab:100,discussion:25,break:20},{explain:45,demo:30,lab:120,discussion:25,break:20},{explain:35,demo:20,lab:125,discussion:40,break:20}];
for(const [i,s]of sessions.entries())for(const [k,n]of Object.entries(expected[i]))if(modeTotals(s.slides)[k]!==n)throw Error(`Timing ${s.id} ${k}`);
await writeFile('content/slides.json',JSON.stringify({revision:'2026-10-23',sessions},null,2)+'\n');
const w=await load('content/workshop.json');w.timeBudget=modeTotals(sessions.flatMap(s=>s.slides));w.revision='2026-10-23';
for(const session of sessions){const s=w.sessions.find(x=>x.id===session.id);s.slideCount=session.slides.length;s.timeBudget=modeTotals(session.slides);s.agenda=[];for(const [i,slide]of session.slides.entries()){let block=s.agenda.at(-1);if(block?.title!==slide.block||block.mode!==slide.mode){block={title:slide.block,mode:slide.mode,minutes:0,description:'',firstSlide:i+1};s.agenda.push(block);}block.minutes+=slide.minutes;block.description+=(block.description?' / ':'')+slide.title;}}
// Four teaching days reuse the same five topic modules; practice split at time boundaries continues, not repeats.
const queue=sessions.flatMap(s=>s.slides.filter(x=>x.mode!=='break').map((x,i)=>({title:x.title,mode:x.mode,minutes:x.minutes,session:s.id,slideId:x.id,description:`${s.id}회차 주제 자료 · ${x.id}`})));
queue.push({title:'최종 사용자 재검증과 회고 보완',mode:'lab',minutes:20,description:'4회 진행안의 추가 실습: 수정한 핵심 흐름을 다른 사람에게 다시 확인받습니다.'});
let at=0;w.fourDay=[];for(let day=1;day<=4;day++){const agenda=[];for(const [chunk,budget]of [90,90,100].entries()){let left=budget;while(left>0){const item=queue[at];if(!item)throw Error('4day schedule too short');const take=Math.min(left,item.minutes);const last=agenda.at(-1);if(last?.title===item.title&&last.mode===item.mode)last.minutes+=take;else agenda.push({...item,minutes:take});item.minutes-=take;left-=take;if(item.minutes===0)at++;else item.title=item.title.includes('이어서')?item.title:item.title+' · 이어서';}if(chunk<2)agenda.push({title:'휴식',mode:'break',minutes:10,description:'진행 결과를 저장하고 쉽니다.'});}w.fourDay.push({id:day,title:['변화 이해·문제 정의·UX와 데이터','구현·검증·작업 분할','통합·실패 조건·가상 사용자','사용자 관찰·공개·개선'][day-1],minutes:300,outcome:'동일한 5개 주제 모듈을 순서대로 진행하며 아래 활동의 결과물을 남깁니다.',agenda});}
if(at!==queue.length)throw Error('4day schedule remains');w.fourDayNote='4회 진행안은 같은 5개 주제 모듈을 300분씩 재배치합니다. 각 일자 휴식20분을 포함하며, 마지막 날 사용자 재검증20분을 추가합니다. 과제 번호는 주제 기준0~5를 유지합니다. “이어서” 표시된 활동은 새로 반복하지 않고 이전 작업을 이어갑니다.';
await writeFile('content/workshop.json',JSON.stringify(w,null,2)+'\n');
console.log('Assembled',sessions.map(s=>s.slides.length).join('/'),'slides;',w.timeBudget);
