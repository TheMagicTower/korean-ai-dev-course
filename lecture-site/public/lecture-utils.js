export const modeLabels = {explain:'설명',demo:'시연',lab:'실습',discussion:'토의·피드백',break:'휴식'};
export function timeline(slides){let elapsed=0;return slides.map(slide=>{const start=elapsed;elapsed+=slide.minutes;return {start,end:elapsed};});}
export function modeTotals(slides){return slides.reduce((result,slide)=>{result[slide.mode]=(result[slide.mode]||0)+slide.minutes;return result;},{});}
export function remainingSeconds(deadline,now=Date.now()){return Math.max(0,Math.ceil((deadline-now)/1000));}
export function clockText(seconds){const n=Math.max(0,Math.ceil(seconds));return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}
export function slideIndex(value,length){const n=Number(value);return Number.isInteger(n)&&n>=0&&n<length?n:0;}
export function labMarkdown(s){return `# ${s.title}\n\n예정 시간: ${s.minutes}분\n\n## 목표\n${s.objective}\n\n## 수행 순서\n${s.steps.map((x,i)=>`${i+1}. ${s.pacing?.[i]?s.pacing[i].minutes+"분 · ":""}${x}`).join('\n')}\n\n## 제출물\n${s.deliverable}\n\n## 완료 기준\n${s.success.map(x=>'- '+x).join('\n')}\n\n## 중간 점검\n${s.checkpoint||"진행 상태를 확인합니다."}\n\n## 막혔을 때\n${s.fallback}\n\n## 먼저 끝났다면\n${s.stretch}\n`;}

export function resolveSlideHash(hash,slides,fallback=0){if(hash==="#main")return slideIndex(fallback,slides.length);if(/^#\d+$/.test(hash))return slideIndex(Number(hash.slice(1))-1,slides.length);if(hash.startsWith("#")&&hash.length>1){const index=slides.findIndex(s=>s.id===hash.slice(1));return index<0?0:index;}return slideIndex(fallback,slides.length);}
