// Keep complete teaching activities together across breaks and calendar days.
export function fourDaySchedule(sessions){
 const queue=sessions.flatMap(s=>s.slides.filter(x=>x.mode!=='break').map(x=>({title:x.title,mode:x.mode,minutes:x.minutes,session:s.id,slideId:x.id,description:`${s.id}회차 주제 자료 · ${x.id}`})));
 const days=[];let at=0,bonus=0;
 for(let day=1;day<=4;day++){
  const items=[];let used=0;
  while(at<queue.length&&used+queue[at].minutes<=280){items.push(queue[at]);used+=queue[at++].minutes;}
  const extra=280-used;bonus+=extra;
  if(extra)items.push({title:day===4?'최종 사용자 재검증·인계 보완':'오늘의 결과 보존·다음 시작점 확인',mode:'lab',minutes:extra,description:'4일 진행안의 추가 실습입니다. 마지막 활동의 실제 결과와 다음 첫 행동을 저장합니다.'});
  const sums=[0];for(const x of items)sums.push(sums.at(-1)+x.minutes);
  let best;
  for(let a=1;a<items.length-1;a++)for(let b=a+1;b<items.length;b++){
   const lengths=[sums[a],sums[b]-sums[a],280-sums[b]];
   if(lengths.some(x=>x<60||x>110))continue;
   const score=lengths.reduce((v,x)=>v+(x-280/3)**2,0);
   if(!best||score<best.score)best={a,b,score};
  }
  if(!best)throw Error('Cannot schedule whole activities with suitable breaks');
  const pause={title:'휴식',mode:'break',minutes:10,description:'현재 결과를 보존하고 쉽니다.'};
  const agenda=[...items.slice(0,best.a),{...pause},...items.slice(best.a,best.b),{...pause},...items.slice(best.b)];
  days.push({id:day,title:['문제 정의·UX·데이터 읽기','데이터 연결·작업 분할·검사 설계','누적 통합·가상 사용자·실패 검증','실제 관찰·공개·개선·인계'][day-1],minutes:300,outcome:'같은 주제 자료를 순서대로 사용합니다. 설명·퀴즈·실습을 휴식이나 다음 날 경계에서 자르지 않습니다.',agenda});
 }
 if(at!==queue.length||bonus!==20)throw Error(`4day coverage mismatch: ${at}/${queue.length}, extra ${bonus}`);
 return days;
}
