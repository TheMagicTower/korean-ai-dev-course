import {$,esc,shell,download} from './app.js';

const stylesheet=document.createElement('link');
stylesheet.rel='stylesheet';stylesheet.href='/office.css';document.head.append(stylesheet);
shell();

const stages=[
 {id:'plan',name:'기획',role:'목표와 완료 조건',letter:'P',x:330,y:225},
 {id:'execute',name:'실행',role:'허용된 도구로 작업',letter:'E',x:735,y:225},
 {id:'review',name:'검토',role:'근거를 확인하고 재시도',letter:'R',x:330,y:430},
 {id:'done',name:'완료',role:'승인된 결과를 전달',letter:'D',x:735,y:430},
];
const statuses={running:'진행 중',waiting_approval:'승인 대기',failed:'검증 실패',completed:'완료',idle:'대기'};
const desk=({id,name,letter,x,y})=>`<g class="office-station" data-station="${id}" transform="translate(${x} ${y})">
 <ellipse class="station-halo" cx="0" cy="-3" rx="155" ry="78"/>
 <ellipse class="desk-shadow" cx="0" cy="24" rx="112" ry="46"/>
 <g class="office-person"><ellipse cx="-66" cy="-20" rx="30" ry="13" fill="#24483d" opacity=".12"/><path d="M-83-64v33l15 9v-30m20-12v33l-15 10v-30" stroke="#344c42" stroke-width="12" stroke-linecap="round" fill="none"/><path d="M-94-97q25-18 51 0v39l-25 14-26-15z" class="person-shirt"/><circle cx="-68" cy="-117" r="19" fill="#d9a886"/><path d="M-88-117q-2-28 21-27 27 0 22 27l-11-9-32 9" fill="#39483b"/><path d="M-89-86l-11 27 31 15m23-41 21 23" stroke="#d9a886" stroke-width="10" stroke-linecap="round" fill="none"/></g>
 <path d="M-116-29v43l10 6v-43M0 28v43l11-6V23M116-29v43l-10 6v-43" fill="#5d735b"/>
 <path class="desk-front" d="M-120-28 0 31 120-28v12L0 44-120-16z"/>
 <path class="desk-top" d="M-120-28 0-88 120-28 0 32z"/>
 <path d="M-19-32 30-7 74-29 25-54z" fill="#748c77"/><path d="M25-54v-49l49 25v49z" fill="#183f35"/><path class="monitor-screen" d="M31-94 68-75v35L31-59z"/>
 <path d="m-14-31 44 22 32-16-44-22z" fill="#e9ede2"/><path d="m-52-28 24 12 21-11-24-12z" fill="#fffdf5"/><path d="m-46-27 12 6m-8-8 14 7" stroke="#9fae99" stroke-width="2"/>
 <path d="M-71-58v18q10 7 20 0v-18" fill="#c66a44"/><ellipse cx="-61" cy="-58" rx="10" ry="5" fill="#e1a47c"/><path d="M-50-55q14-1 10 10-2 5-10 3" fill="none" stroke="#c66a44" stroke-width="3"/>
 <g class="station-sign" transform="translate(-36 63)"><rect x="0" y="0" width="98" height="34" rx="3"/><text x="49" y="24" text-anchor="middle">${name}</text></g>
 <g class="station-badge" transform="translate(91 -105)"><circle r="19"/><text y="6" text-anchor="middle">${letter}</text></g>
 </g>`;
const plant=(x,y,scale=1)=>`<g transform="translate(${x} ${y}) scale(${scale})"><ellipse cy="13" rx="25" ry="11" fill="#203c33" opacity=".09"/><path d="M-20-4l6 27q14 9 28 0l6-27z" fill="#c39b74"/><ellipse cy="-4" rx="20" ry="9" fill="#7c7957"/><path d="M0-5v-68m0 44q-42-4-34-33 31-2 34 33m0-14q28-27 44-14-6 32-44 27m0-17q-20-29-1-47 22 13 1 47" fill="#557751" stroke="#416346" stroke-width="3"/></g>`;

$('#main').innerHTML=`<div class="office-page container">
 <header class="office-heading"><div><p class="eyebrow">JARVIS LAB · 2.5D AI OFFICE</p><h1>작업이 흘러가는<br class="office-mobile-break"> 나만의 AI 오피스</h1><p>캐릭터의 움직임 뒤에는 목표, 도구, 권한, 검증, 승인 규칙이 있습니다.</p></div><button class="secondary" id="office-present" type="button" aria-pressed="false">발표 화면</button></header>
 <div class="office-mode-line"><span class="office-mode" id="office-mode">강의용 시뮬레이션</span><p id="office-mode-note">정해진 이벤트를 재생합니다. 이 화면은 모델·외부 도구를 실행하지 않습니다.</p></div>
 <form class="office-setup" id="office-setup"><div class="office-task-field"><label for="office-task">에이전트에게 맡기고 싶은 작업 한 가지</label><input id="office-task" name="task" maxlength="100" required value="공공데이터로 우리 동네 도서관 안내 초안 만들기" autocomplete="off"></div><div><label for="office-scenario">시연할 상황</label><select id="office-scenario"><option value="approval">공개 전 사람의 승인</option><option value="failure">검증 실패와 재시도</option><option value="normal">정상 완료</option></select></div><button type="submit" id="office-start">시뮬레이션 시작</button></form>
 <section class="office-workspace" aria-label="AI 오피스 시연">
  <div class="office-stage-panel"><div class="office-now"><div><span id="office-step">READY · 0 / 8</span><h2 id="office-action">작업 하나부터 시작합니다.</h2></div><span id="office-status" class="office-status" data-status="idle">대기</span></div>
   <div class="office-scene"><svg class="office-room" viewBox="0 0 1100 640" role="img" aria-labelledby="office-room-title office-room-desc"><title id="office-room-title">기획·실행·검토·완료를 연결한 2.5D AI 오피스</title><desc id="office-room-desc">네 작업 공간 중 현재 단계가 강조됩니다. 아래 단계 목록과 작업 기록에서도 동일한 상태를 확인할 수 있습니다.</desc>
    <path d="M65 315 550 72 1035 315 550 558z" fill="#203c33" opacity=".08" transform="translate(0 22)"/>
    <path d="M65 308 550 65 1035 308v22L550 573 65 330z" fill="#c6cbb8"/>
    <path d="M65 308 550 65 1035 308 550 551z" fill="#e5e7d6" stroke="#c6ceb9" stroke-width="2"/>
    <path d="M65 308V176L550-67V65z" fill="#e8dbc0"/><path d="M550-67 1035 176v132L550 65z" fill="#f0e7d4"/>
    <path d="m65 176 485-243 485 243" fill="none" stroke="#d2c3a4" stroke-width="6"/>
    <path d="m196 241 354-177 356 178M196 373 354-177 354 177M328 438 354-177M683 132 354 177M418 132 354 177M154 264 354 177" stroke="#d2d9c4" stroke-width="2" fill="none"/>
    <g transform="translate(201 121)"><path d="M0 0 145-73v85L0 85z" fill="#fffdf1" stroke="#c2cbb3" stroke-width="5"/><path d="m8 39 128-64M73-31v68" stroke="#d1d9c3" stroke-width="4"/></g>
    <g transform="translate(776 97)"><path d="M0 0 137 69v73L0 73z" fill="#cfd9c1" stroke="#728c68" stroke-width="4"/><path d="m15 26 105 53m-105-35 72 36" stroke="#6a855f" stroke-width="5"/></g>
    <path class="office-route" d="M330 253H735V440H330V253"/>
    ${plant(121,320,.8)}${plant(980,325,.85)}${stages.map(desk).join('')}
    <g class="office-package" id="office-package" transform="translate(550 330)"><ellipse cy="14" rx="27" ry="11" fill="#203c33" opacity=".15"/><path d="M-17-13 0-22 17-13 0-4z" fill="#e2ac6b"/><path d="M-17-13 0-4v23l-17-9z" fill="#ba7539"/><path d="M17-13 0-4v23l17-9z" fill="#d5914b"/><path d="m-7-18 17 9v9" stroke="#fff3d7" stroke-width="4" fill="none"/></g>
   </svg><div class="office-scene-note">하나의 작업 · 네 가지 책임</div></div>
   <ol class="office-stages" aria-label="현재 작업 단계">${stages.map((s,i)=>`<li data-stage="${s.id}"><span class="office-stage-number">${String(i+1).padStart(2,'0')}</span><div><strong>${s.name}</strong><span>${s.role}</span></div><span class="office-stage-state">대기</span></li>`).join('')}</ol>
   <div class="office-controls"><button id="office-play" class="secondary" type="button" disabled>자동 재생</button><button id="office-next" class="secondary" type="button" disabled>다음 단계</button><button id="office-reset" class="secondary" type="button">처음으로</button><span id="office-timing">정상 흐름 약 30초 · 승인·실패 지점에서는 멈춥니다.</span></div>
  </div>
  <aside class="office-inspector" aria-label="하네스가 관리하는 상태"><p class="eyebrow">HARNESS · 실행 규칙</p><h2 id="office-inspector-title">캐릭터보다 먼저 설계할 것</h2><p id="office-message" class="office-message" role="status" aria-live="polite">작업을 시작하면 하네스가 무엇을 허용하고 어떤 증거를 기다리는지 보입니다.</p><dl class="office-contract"><div><dt>도구</dt><dd id="office-tool">아직 선택하지 않았습니다.</dd></div><div><dt>권한</dt><dd id="office-permission">기본값은 읽기 전용입니다.</dd></div><div><dt>검증 근거</dt><dd id="office-evidence">결과와 함께 남깁니다.</dd></div></dl><div class="office-gate" id="office-gate" hidden><b id="office-gate-title"></b><p id="office-gate-copy"></p><button type="button" id="office-resolve"></button></div><p class="office-truth">오피스는 상태를 보여주는 UI입니다.<br>실제 하네스는 실행·권한·실패 처리를 담당합니다.</p></aside>
 </section>
 <section class="office-records" aria-labelledby="office-record-title"><div class="office-record-heading"><div><p class="eyebrow">EVENT LOG · 관찰 가능한 실행</p><h2 id="office-record-title">무엇이 일어났는지 남깁니다.</h2></div><button class="secondary small" id="office-export" disabled type="button">현재 기록 JSON 저장</button></div><ol id="office-events" class="office-events"><li class="office-empty">아직 실행 기록이 없습니다. 위에서 작업을 시작해 주세요.</li></ol></section>
 <section class="office-connect" aria-label="나만의 하네스로 연결"><div><p class="eyebrow">OPTIONAL · SDK / JSON</p><h2>선택 보조 실습 · 내 실행 기록 재생</h2><p>스타터 키트로 로컬에서 작업을 실행한 뒤 이벤트 JSON을 저장합니다. 이 오피스에서는 그 파일을 읽어 흐름을 재생할 수 있습니다.</p><div class="actions"><a class="button" href="/downloads/jarvis-kit.zip">SDK·JSON 보조 키트</a><a class="button secondary" href="/jarvis/">구독 연결·실습 안내</a></div></div><div class="office-import"><label for="office-file">이벤트 JSON 파일</label><input type="file" id="office-file" accept="application/json,.json"><p>파일은 브라우저에서만 읽습니다. 서버 업로드나 모델 실행은 하지 않습니다. 최대 128KB·200개 이벤트입니다.</p><p id="office-import-status" role="status" aria-live="polite"></p><details><summary>이벤트 형식 보기</summary><pre>{"title":"내 작업", "events":[
 {"stage":"plan", "status":"running",
  "message":"완료 조건을 정했습니다."},
 {"stage":"done", "status":"completed",
  "message":"검증 근거를 저장했습니다."}
]}</pre></details></div></section>
</div>`;

let events=[],index=-1,timer=null,playing=false,mode='simulation',task='',gate=false;
let stageState={};
let importedMetadata={source:'',provider:''};
let importRequest=0;
const interval=4000;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const event=(stage,status,message,tool,permission,evidence)=>({stage,status,message,tool,permission,evidence});
function scenarioEvents(title,scenario){
 const common=[
  event('plan','running',`“${title}”를 한 번에 확인할 수 있는 작업으로 나눕니다.`,'작업 계획','읽기 전용','완료 조건: 초안 1개 + 출처 + 검증 결과'),
  event('plan','completed','입력·출력·완료 조건을 정했습니다. 이제 실행 역할에 전달합니다.','작업 명세','계획만 작성','입력과 기대 결과를 기록한 작업 명세'),
  event('execute','running','허용 목록에 있는 도구만 사용합니다. 실행 결과와 도구 호출을 기록합니다.','자료 읽기 → 초안 작성','샘플 자료 읽기 · 작업 폴더 쓰기','도구 결과·입력 출처·작성한 파일'),
  event('execute','completed','초안을 만들었습니다. 생성했다는 사실만으로 완료 처리하지 않습니다.','초안 저장','작업 폴더 쓰기','검토할 초안 1개'),
 ];
 if(scenario==='failure')return [...common,
  event('review','failed','출처 하나가 빠졌습니다. 검증 실패로 작업을 멈추고 수정할 부분을 돌려보냅니다.','출처 검사','외부 공개 금지','실패 조건: 출처 없는 주장 1개'),
  event('execute','completed','누락한 출처를 보완했습니다. 실패 원인을 기록에 남깁니다.','초안 수정','작업 폴더 쓰기','누락 항목 수정 기록'),
  event('review','completed','같은 검증을 다시 실행해 누락 항목이 해결됐는지 확인합니다.','출처 재검사','읽기 전용','재검증 통과 · 수정 전후 기록'),
  event('done','completed','검증된 초안과 근거를 사용자에게 전달합니다. 재시도도 완료 기록의 일부입니다.','결과 묶음','사용자에게 로컬 결과 전달','초안 + 출처 + 실패·재검증 기록')];
 if(scenario==='approval')return [...common,
  event('review','running','요구한 형식·출처·민감한 정보 포함 여부를 검사합니다.','결과 검사','읽기 전용','형식·출처 확인 완료'),
  event('review','waiting_approval','검증은 통과했지만 외부 공개는 별도 권한입니다. 사람의 승인을 기다립니다.','공개 요청','승인 전 실행 차단','검증 결과 + 공개할 초안'),
  event('review','completed','사람의 승인 이벤트를 기록합니다. 승인 범위 안에서만 다음 단계로 이동합니다.','승인 기록','이 초안의 전달만 승인','승인 시점과 대상 기록'),
  event('done','completed','승인된 결과와 근거를 전달했습니다. 이 시뮬레이션은 실제로 외부에 공개하지 않습니다.','결과 전달 시뮬레이션','승인한 결과만 전달','초안 + 검증 결과 + 승인 기록')];
 return [...common,
  event('review','running','완료 조건과 실제 결과를 비교합니다. “잘 된 것 같다” 대신 검사 결과를 남깁니다.','결과 검사','읽기 전용','형식·출처·요구사항 확인'),
  event('review','completed','필수 검증을 통과했습니다. 외부 공개 없이 로컬 결과로 전달하는 작업입니다.','검증 기록','외부 공개 권한 없음','모든 필수 완료 조건 통과'),
  event('done','running','초안과 검증 결과를 사용자가 확인할 수 있는 묶음으로 정리합니다.','결과 묶음 작성','작업 폴더 쓰기','결과 파일 + 검증 기록'),
  event('done','completed','작업을 마쳤습니다. 어떤 도구를 썼고 무엇을 확인했는지 다시 추적할 수 있습니다.','로컬 결과 전달','사용자가 결과 확인','초안 + 출처 + 검증 결과')];
}
function stop(){clearTimeout(timer);timer=null;playing=false;}
function schedule(){clearTimeout(timer);if(playing&&index<events.length-1&&!gate)timer=setTimeout(()=>advance(),interval);}
function writeText(id,value){$(id).textContent=value||'기록 없음';}
function paint(){
 const current=events[index];
 const finished=index>=0&&index===events.length-1;
 $('#office-play').disabled=index<0||finished||gate;
 $('#office-play').textContent=playing?'일시 정지':'자동 재생';
 $('#office-next').disabled=index<0||finished||gate;
 $('#office-export').disabled=index<0;
 $('#office-start').disabled=index>=0;
 $('#office-task').disabled=index>=0;
 $('#office-scenario').disabled=index>=0;
 $('#office-step').textContent=index<0?'READY · 0 / 8':`${mode==='import'?'REPLAY':'DEMO'} · ${index+1} / ${events.length}`;
 $('#office-status').textContent=current?statuses[current.status]:'대기';
 $('#office-status').dataset.status=current?.status||'idle';
 $('#office-mode').textContent=mode==='import'?'가져온 기록 재생':'강의용 시뮬레이션';
 $('#office-mode-note').textContent=mode==='import'?`파일에 기록된 출처: ${importedMetadata.source||'기록 없음'} · 제공자: ${importedMetadata.provider||'기록 없음'} · 진위 미검증. 이 화면은 모델을 실행하지 않습니다.`:'정해진 이벤트를 재생합니다. 이 화면은 모델·외부 도구를 실행하지 않습니다.';
 for(const s of stages){
  const item=$(`[data-stage="${s.id}"]`);const status=stageState[s.id]||'idle';
  item.dataset.status=status;item.classList.toggle('active',current?.stage===s.id);
  item.querySelector('.office-stage-state').textContent=mode==='import'&&status!=='idle'&&current?.stage!==s.id?`${statuses[status]} 기록`:statuses[status];
  const station=$(`[data-station="${s.id}"]`);station.classList.toggle('active',current?.stage===s.id);station.dataset.status=status;
 }
 $('#office-gate').hidden=!gate;
 if(!current){
  writeText('#office-action','작업 하나부터 시작합니다.');writeText('#office-inspector-title','캐릭터보다 먼저 설계할 것');writeText('#office-message','작업을 시작하면 하네스가 무엇을 허용하고 어떤 증거를 기다리는지 보입니다.');writeText('#office-tool','아직 선택하지 않았습니다.');writeText('#office-permission','기본값은 읽기 전용입니다.');writeText('#office-evidence','결과와 함께 남깁니다.');
  $('#office-events').innerHTML='<li class="office-empty">아직 실행 기록이 없습니다. 위에서 작업을 시작해 주세요.</li>';
  $('#office-package').setAttribute('transform','translate(550 330)');return;
 }
 const stage=stages.find(s=>s.id===current.stage);
 writeText('#office-action',current.stage==='done'&&current.status==='completed'?(mode==='import'?'기록 재생이 끝났습니다.':'작업을 마쳤습니다.'):`${stage.name} · ${statuses[current.status]}`);
 writeText('#office-inspector-title',task);writeText('#office-message',current.message);
 writeText('#office-tool',current.tool);writeText('#office-permission',current.permission);writeText('#office-evidence',current.evidence);
 const marker=$('#office-package');
 if(!reduced)marker.classList.add('moving');
 marker.setAttribute('transform',`translate(${stage.x+132} ${stage.y+24})`);
 if(gate){
  const approval=current.status==='waiting_approval';
  writeText('#office-gate-title',approval?'승인하기 전까지 움직이지 않습니다.':'실패가 다음 행동을 바꿉니다.');
  writeText('#office-gate-copy',approval?'버튼을 눌러 승인 이벤트를 만들어 보세요. 실제 외부 공개는 일어나지 않습니다.':'수정한 뒤 같은 검증을 다시 수행하는 경로로 이동해 보세요.');
  writeText('#office-resolve',approval?'승인하고 계속':'수정·재검증 시뮬레이션');
 }
 $('#office-events').innerHTML=events.slice(0,index+1).map((e,i)=>`<li${i===index?' class="current"':''}><span class="office-event-number">${String(i+1).padStart(2,'0')}</span><span class="office-event-stage">${esc(stages.find(s=>s.id===e.stage).name)}<small>${esc(statuses[e.status])}</small></span><p>${esc(e.message)}</p></li>`).join('');
 const log=$('#office-events');log.scrollTop=log.scrollHeight;
}
function advance(){
 if(gate||index>=events.length-1)return;
 index++;const current=events[index];stageState[current.stage]=current.status;
 gate=mode==='simulation'&&['waiting_approval','failed'].includes(current.status);
 if(gate||index===events.length-1)stop();
 paint();schedule();
}
function reset(){importRequest++;stop();$('#office-task').setCustomValidity('');events=[];index=-1;stageState={};gate=false;mode='simulation';task='';importedMetadata={source:'',provider:''};$('#office-import-status').textContent='';$('#office-file').value='';paint();}
$('#office-setup').addEventListener('submit',e=>{e.preventDefault();task=$('#office-task').value.trim();if(!task){$('#office-task').setCustomValidity('작업을 한 문장으로 적어 주세요.');$('#office-task').reportValidity();return;}importRequest++;events=scenarioEvents(task,$('#office-scenario').value);mode='simulation';index=-1;stageState={};playing=true;advance();});
$('#office-task').addEventListener('input',()=>$('#office-task').setCustomValidity(''));
$('#office-play').addEventListener('click',()=>{if(playing)stop();else playing=true;paint();schedule();});
$('#office-next').addEventListener('click',()=>{stop();advance();});
$('#office-reset').addEventListener('click',reset);
$('#office-resolve').addEventListener('click',()=>{gate=false;playing=true;advance();});
$('#office-present').addEventListener('click',()=>{const active=document.body.classList.toggle('office-present');$('#office-present').setAttribute('aria-pressed',String(active));$('#office-present').textContent=active?'일반 화면':'발표 화면';if(active)window.scrollTo({top:0,behavior:'instant'});});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('office-present'))$('#office-present').click();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing){stop();paint();}});
window.addEventListener('pagehide',stop);
$('#office-export').addEventListener('click',()=>download('office-events.json',JSON.stringify({version:1,source:mode==='simulation'?'lecture-simulation':'imported-replay',...(mode==='import'?{recordedSource:importedMetadata.source,provider:importedMetadata.provider}:{}),title:task,exportedAt:new Date().toISOString(),events:events.slice(0,index+1)},null,2),'application/json'));

function cleanText(value,max=280){return typeof value==='string'?value.slice(0,max):'';}
function normalizeImport(raw){
 const entries=Array.isArray(raw)?raw:raw?.events;
 if(!Array.isArray(entries)||entries.length===0||entries.length>200)throw new Error('events 배열에 1~200개의 이벤트가 필요합니다.');
 const stageAliases={planning:'plan',planner:'plan',execution:'execute',work:'execute',worker:'execute',working:'execute',reviewing:'review',verification:'review',verify:'review',approval:'review',complete:'done',completed:'done',delivery:'done'};
 const statusAliases={started:'running',in_progress:'running',success:'completed',complete:'completed',done:'completed',passed:'completed',error:'failed',blocked:'waiting_approval',approval_required:'waiting_approval',awaiting_approval:'waiting_approval',waiting:'waiting_approval'};
 const result=entries.map((entry,i)=>{
  if(!entry||typeof entry!=='object'||Array.isArray(entry))throw new Error(`${i+1}번째 이벤트가 올바른 객체가 아닙니다.`);
  const rawStage=cleanText(entry.stage||entry.phase,32);const stage=stageAliases[rawStage]||rawStage;
  const rawStatus=cleanText(entry.status,32)||'running';const status=statusAliases[rawStatus]||rawStatus;
  const message=cleanText(entry.message||entry.detail||entry.summary);
  if(!stages.some(s=>s.id===stage)||!Object.hasOwn(statuses,status)||!message)throw new Error(`${i+1}번째 이벤트의 stage, status, message를 확인해 주세요.`);
  return{stage,status,message,tool:cleanText(entry.tool,160),permission:cleanText(entry.permission,160),evidence:cleanText(entry.evidence,240),...(typeof entry.at==='string'?{at:cleanText(entry.at,80)}:{})};
 });
 return{title:cleanText(raw?.title||raw?.task,100)||'가져온 하네스 작업',source:cleanText(raw?.recordedSource||raw?.source||raw?.mode,80),provider:cleanText(raw?.provider,80),events:result};
}
$('#office-file').addEventListener('change',async e=>{
 const request=++importRequest;
 const file=e.target.files?.[0];if(!file)return;
 try{
  if(file.size>128*1024)throw new Error('128KB 이하의 JSON 파일을 선택해 주세요.');
  const fileText=await file.text();
  if(request!==importRequest)return;
  const imported=normalizeImport(JSON.parse(fileText));
  stop();mode='import';importedMetadata={source:imported.source,provider:imported.provider};task=imported.title;$('#office-task').value=task;events=imported.events;index=-1;stageState={};gate=false;advance();
  $('#office-import-status').textContent=`${events.length}개 이벤트를 불러왔습니다. 자동 재생 또는 다음 단계로 기록을 확인합니다.`;
  $('#office-action').focus?.();
 }catch(error){if(request!==importRequest)return;$('#office-import-status').textContent=error instanceof SyntaxError?'JSON 형식을 읽을 수 없습니다. 파일 내용을 확인해 주세요.':error.message;}
});
paint();
