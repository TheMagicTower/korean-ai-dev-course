const $ = id => document.getElementById(id);
let current = null;
let mode = 'mock';
let timer;
const labels = { queued:'접수', planning:'계획', working:'실행', review:'검토 대기', done:'완료', failed:'실패' };
const fieldLabels = { title:'아이디어',beneficiary:'수혜자',problem:'문제',dataToVerify:'확인할 데이터',firstAction:'첫 행동',acceptance:'성공 기준',caveat:'확인할 한계' };
async function api(url, body) {
  const response = await fetch(url, body === undefined ? {} : { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message ?? '요청에 실패했습니다.');
  return result;
}
function error(error) { $('status').textContent = error.message; }
function render(task) {
  current = task;
  $('record-panel').hidden = false;
  $('export').disabled = false;
  $('status').textContent = `${labels[task.state]} · ${task.error?.message ?? task.title}`;
  $('start').disabled = !['done','failed'].includes(task.state);
  $('cancel').hidden = ['done','failed'].includes(task.state);
  $('timeline').replaceChildren(...task.events.map(event => {
    const li = document.createElement('li');
    const strong = document.createElement('strong'); strong.textContent = labels[event.taskState] ?? event.stage;
    const small = document.createElement('small'); small.textContent = event.message;
    li.append(strong, small); return li;
  }));
  $('manual').hidden = mode !== 'manual' || task.state !== 'working';
  $('prompt').value = task.prompt ?? '';
  $('result-panel').hidden = !task.result;
  $('approve').hidden = task.state !== 'review';
  if (task.result) {
    const dl = document.createElement('dl');
    for (const [key,value] of Object.entries(task.result)) {
      const dt = document.createElement('dt'); dt.textContent = fieldLabels[key] ?? key;
      const dd = document.createElement('dd');
      if (Array.isArray(value)) { const ul = document.createElement('ul'); for (const text of value) { const li = document.createElement('li'); li.textContent = text; ul.append(li); } dd.append(ul); }
      else dd.textContent = value;
      dl.append(dt,dd);
    }
    $('result').replaceChildren(dl);
  }
  clearTimeout(timer);
  if (['queued','planning','working'].includes(task.state) && mode !== 'manual') timer = setTimeout(async () => { try { render(await api(`/api/tasks/${task.id}`)); } catch(e) { error(e); $('start').disabled=false; } },500);
}
$('task-form').addEventListener('submit', async event => {
  event.preventDefault(); $('start').disabled = true;
  try { render(await api('/api/tasks',{topic:$('topic').value,...(mode==='mock'?{scenario:$('scenario').value}:{})})); }
  catch(e) { error(e); $('start').disabled=false; }
});
$('cancel').addEventListener('click',async()=>{try{render(await api(`/api/tasks/${current.id}/cancel`,{}));}catch(e){error(e);}});
$('approve').addEventListener('click',async()=>{try{render(await api(`/api/tasks/${current.id}/approve`,{accepted:true}));}catch(e){error(e);}});
$('import').addEventListener('click',async()=>{try{render(await api(`/api/tasks/${current.id}/import`,{result:JSON.parse($('import-result').value)}));}catch(e){error(e);}});
$('copy-prompt').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('prompt').value);$('status').textContent='프롬프트를 복사했습니다.';}catch{ $('prompt').focus();$('prompt').select();$('status').textContent='프롬프트를 선택했습니다. 복사 단축키를 사용합니다.';}});
$('export').addEventListener('click',()=>{
  if (!current) return;
  const record = {...current}; delete record.prompt;
  const url = URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'}));
  const a = document.createElement('a');a.href=url;a.download=`jarvis-${current.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
(async()=>{try{
  const health = await api('/api/health');mode = health.provider;
  $('mode').textContent = {mock:'모형 모드 · AI 호출 없음',manual:'수동 결과 모드 · AI 구독 화면에서 직접 실행',codex:'Codex SDK · 로컬 ChatGPT 인증 · 구독 한도 사용','claude-api':'Claude Agent SDK · API 키 · API 크레딧/별도 과금'}[mode];
  $('scenario-label').hidden = mode !== 'mock';
  const {tasks}=await api('/api/tasks');if(tasks.length)render(tasks.at(-1));
}catch(e){error(e);$('start').disabled=true;}})();
