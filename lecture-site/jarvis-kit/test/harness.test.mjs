import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createJarvisServer } from '../server.mjs';
import { exampleResult, validateResult } from '../contract.mjs';
import { codexOptions, claudeOptions, minimalEnvironment } from '../adapters.mjs';

async function fixture(t, options = {}) {
  const server = createJarvisServer({ adapter: async ({topic}) => exampleResult(topic), ...options });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  t.after(() => {server.stop();server.closeAllConnections();});
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (route, body, headers = {}) => fetch(base+route,body === undefined ? {headers} : {method:'POST',headers:{origin:base,'content-type':'application/json',...headers},body:JSON.stringify(body)});
  const create = async () => (await request('/api/tasks',{topic:'이동 약자의 공공시설 접근성'})).json();
  const wait = async (id,state) => {
    for(let i=0;i<100;i++){const data=await(await request(`/api/tasks/${id}`)).json();if(data.state===state)return data;await new Promise(r=>setTimeout(r,5));}
    assert.fail(`state ${state}를 받지 못했습니다.`);
  };
  return {server,base,request,create,wait};
}

test('작업은 검토에서 멈추고 사람 확인 뒤 완료되며 오피스 이벤트를 내보냅니다',async t=>{
  const f=await fixture(t);const task=await f.create();const reviewed=await f.wait(task.id,'review');
  assert.deepEqual(reviewed.events.map(e=>e.taskState),['queued','planning','working','review']);
  assert.equal(reviewed.events.at(-1).status,'waiting_approval');
  assert.equal((await f.request('/api/tasks',{topic:'새 작업'})).status,409);
  assert.equal((await f.request(`/api/tasks/${task.id}/approve`,{accepted:false})).status,422);
  const done=await(await f.request(`/api/tasks/${task.id}/approve`,{accepted:true})).json();
  assert.equal(done.state,'done');assert.equal(done.events.at(-1).stage,'done');
  const exported=await(await f.request(`/api/tasks/${task.id}/export`)).json();
  assert.equal(exported.source,'simulation');assert.equal(exported.provider,'mock');assert.ok(exported.title);
  for(const e of exported.events){assert.ok(['plan','execute','review','done'].includes(e.stage));assert.ok(e.at);assert.ok(e.message);}
  assert.equal((await f.request('/api/tasks',{topic:'다음 작업'})).status,202);
});

test('수동 응답은 검증된 JSON만 반입하고 검토를 거칩니다',async t=>{
  const f=await fixture(t,{provider:'manual'});const task=await f.create();
  assert.equal(task.state,'working');assert.match(task.prompt,/JSON/);
  assert.equal((await f.request(`/api/tasks/${task.id}/import`,{result:{title:'부족'}})).status,422);
  const imported=await(await f.request(`/api/tasks/${task.id}/import`,{result:exampleResult('동네')})).json();
  assert.equal(imported.state,'review');assert.equal(imported.source,'manual-import');
  assert.equal((await f.request(`/api/tasks/${task.id}/import`,{result:exampleResult('동네')})).status,409);
});

test('인증 정보가 들어 있는 어댑터 예외를 응답에 노출하지 않습니다',async t=>{
  const f=await fixture(t,{adapter:async()=>{throw Error('secret-token-DO-NOT-LEAK');}});const task=await f.create();
  const failed=await f.wait(task.id,'failed');assert.equal(failed.error.code,'provider_failed');
  assert.ok(!JSON.stringify(failed).includes('secret-token'));assert.equal((await f.request('/api/tasks',{topic:'재시도'})).status,202);
});

test('잘못된 모델 응답을 완료 처리하지 않습니다',async t=>{
  const f=await fixture(t,{adapter:async()=>({title:'부족'})});const task=await f.create();
  const failed=await f.wait(task.id,'failed');assert.equal(failed.error.code,'invalid_result');assert.equal(failed.result,null);
});

test('시간 제한은 AbortSignal로 어댑터를 멈추고 실패 이벤트를 남깁니다',async t=>{
  let aborted=false;
  const f=await fixture(t,{timeoutMs:20,adapter:({signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(signal.reason);},{once:true}))});
  const task=await f.create();const failed=await f.wait(task.id,'failed');
  assert.equal(failed.error.code,'timeout');assert.equal(aborted,true);
});

test('취소 후 늦은 결과가 검토 상태를 되살리지 않습니다',async t=>{
  let resolve;
  const f=await fixture(t,{adapter:()=>new Promise(r=>{resolve=r;})});const task=await f.create();await f.wait(task.id,'working');
  const cancelled=await(await f.request(`/api/tasks/${task.id}/cancel`,{})).json();assert.equal(cancelled.state,'failed');
  resolve(exampleResult('늦은 응답'));await new Promise(r=>setTimeout(r,10));
  assert.equal((await(await f.request(`/api/tasks/${task.id}`)).json()).state,'failed');
});

test('다른 Origin·누락 Origin·DNS rebinding Host·대형 입력을 거부합니다',async t=>{
  const f=await fixture(t);
  assert.equal((await f.request('/api/tasks',{topic:'안전 검사'},{origin:'https://example.org'})).status,403);
  assert.equal((await fetch(f.base+'/api/tasks',{method:'POST',headers:{'content-type':'application/json'},body:'{"topic":"검사"}'})).status,403);
  assert.equal((await f.request('/api/health',undefined,{'sec-fetch-site':'cross-site'})).status,403);
  assert.equal((await f.request('/api/tasks',{topic:'a'.repeat(20000)})).status,413);
  const status=await new Promise(resolve=>{const req=http.get(f.base+'/api/health',{headers:{host:'evil.example'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',()=>resolve(0));});assert.equal(status,403);
  const health=await f.request('/api/health');assert.equal(health.headers.get('access-control-allow-origin'),null);
});

test('명령·스크립트·추가 필드를 결과 실행으로 해석하지 않습니다',()=>{
  const result=exampleResult('검사');result.title='<script>alert(1)</script>';
  assert.equal(validateResult(result).title,result.title);
  assert.throws(()=>validateResult({...result,command:'rm -rf /'}));
  assert.throws(()=>validateResult({...result,acceptance:['x'.repeat(301)]}));
});

test('Codex 옵션은 격리 인증·읽기 전용·실행 도구 차단·중단 신호를 유지합니다',()=>{
  const controller=new AbortController();const settings=codexOptions('/sample',controller.signal,{PATH:'/bin',OPENAI_API_KEY:'dont-copy',CLAUDE_CODE_OAUTH_TOKEN:'dont-copy'});
  assert.equal(settings.thread.sandboxMode,'read-only');assert.equal(settings.thread.approvalPolicy,'never');
  assert.equal(settings.thread.networkAccessEnabled,false);assert.equal(settings.thread.webSearchMode,'disabled');
  assert.equal(settings.client.config.features.shell_tool,false);assert.equal(settings.client.config.features.apps,false);assert.equal(settings.client.config.features.hooks,false);
  assert.equal(settings.client.config.forced_login_method,'chatgpt');assert.equal(settings.client.env.OPENAI_API_KEY,undefined);
  assert.equal(settings.turn.signal,controller.signal);assert.ok(settings.client.env.CODEX_HOME.endsWith('/.jarvis-auth/codex'));
});

test('Claude SDK는 구독 OAuth 대신 API 키를 요구하고 모든 도구·설정을 차단합니다',async()=>{
  const c=new AbortController();assert.throws(()=>claudeOptions('/sample',c,{CLAUDE_CODE_OAUTH_TOKEN:'not-api-key'}),/API 키/);
  const o=claudeOptions('/sample',c,{ANTHROPIC_API_KEY:'test-not-real',CLAUDE_CODE_OAUTH_TOKEN:'dont-copy'});
  assert.deepEqual(o.tools,[]);assert.deepEqual(o.settingSources,[]);assert.deepEqual(o.mcpServers,{});
  assert.equal(o.env.CLAUDE_CODE_OAUTH_TOKEN,undefined);assert.equal(o.permissionMode,'dontAsk');assert.equal(o.maxBudgetUsd,0.25);
  assert.equal((await o.canUseTool('Bash',{})).behavior,'deny');assert.deepEqual(minimalEnvironment({API_KEY:'x'}),{});
});

test('null·배열·문자열 요청은 내부 오류 대신 잘못된 JSON 요청으로 거부합니다',async t=>{
  const f=await fixture(t);
  for(const body of [null,[], 'text']) assert.equal((await f.request('/api/tasks',body)).status,400);
});

test('실제 모형 어댑터의 성공과 실패를 서버에서 구분합니다',async t=>{
  const {runAdapter}=await import('../adapters.mjs');
  const f=await fixture(t,{adapter:runAdapter});
  const failed=await(await f.request('/api/tasks',{topic:'실패 시연',scenario:'failure'})).json();
  const result=await f.wait(failed.id,'failed');assert.equal(result.error.code,'demo_failure');
  const exported=await(await f.request(`/api/tasks/${failed.id}/export`)).json();
  assert.equal(exported.state,'failed');assert.equal(exported.result,null);
  assert.equal(exported.events.at(-1).status,'failed');assert.equal(exported.error.code,'demo_failure');
  assert.equal(exported.source,'simulation');
});

test('SDK worker는 유효하지 않은 공급자를 외부 호출 없이 종료합니다',async()=>{
  const {runInWorker}=await import('../runner.mjs');
  const controller=new AbortController();
  await assert.rejects(runInWorker({provider:'invalid',topic:'호출 없음',signal:controller.signal}),error=>error.code==='unknown_provider');
});
