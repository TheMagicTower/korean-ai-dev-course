import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { AppError, buildPrompt, validateResult } from './contract.mjs';
import { runInWorker } from './runner.mjs';

const PROVIDERS = ['mock', 'manual', 'codex', 'claude-api'];
const MAX_BODY = 16_384;
const MAX_TASKS = 20;
const STATE_TO_STAGE = { queued: 'plan', planning: 'plan', working: 'execute', review: 'review', done: 'done', failed: 'execute' };

function readJSON(req) {
  return new Promise((resolve, reject) => {
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] ?? '')) return reject(new AppError(415, 'json_required', 'application/json 요청만 받습니다.'));
    const parts = []; let size = 0; let rejected = false;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY) { if (!rejected) reject(new AppError(413, 'body_too_large', '입력은 16KB 이하여야 합니다.')); rejected = true; parts.length = 0; }
      else if (!rejected) parts.push(chunk);
    });
    req.on('end', () => { if (!rejected) { try { const value = JSON.parse(Buffer.concat(parts).toString('utf8')); if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error('object required'); resolve(value); } catch { reject(new AppError(400, 'bad_json', 'JSON 형식을 확인합니다.')); } } });
    req.on('error', reject);
  });
}

export function createJarvisServer({ provider = 'mock', timeoutMs = 120_000, adapter = runInWorker } = {}) {
  if (!PROVIDERS.includes(provider)) throw new Error('실행 모드는 mock, manual, codex, claude-api 중 하나입니다.');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 10 || timeoutMs > 120_000) throw new Error('시간 제한은 10~120000ms입니다.');
  const tasks = new Map(); const controllers = new Map(); let activeId = null;
  const record = (task, state, message) => {
    task.state = state;
    task.events.push({ at: new Date().toISOString(), stage: STATE_TO_STAGE[state], status: state === 'review' ? 'waiting_approval' : state === 'done' ? 'completed' : state === 'failed' ? 'failed' : 'running', message, taskState: state, tool: provider === 'mock' ? '교육용 모형' : provider === 'manual' ? '사용자 반입' : provider === 'codex' ? 'Codex SDK' : 'Claude Agent SDK', permission: '분석만 허용 · 외부 실행 없음' });
  };
  const safeTask = task => ({ id: task.id, title: task.title, provider: task.provider, source: task.provider === 'mock' ? 'simulation' : task.provider === 'manual' ? 'manual-import' : 'local-sdk', state: task.state, createdAt: task.createdAt, events: task.events, result: task.result ?? null, ...(task.error ? { error: task.error } : {}), ...(provider === 'manual' ? { prompt: buildPrompt(task.title) } : {}) });
  const fail = (task, error) => {
    if (['done', 'failed'].includes(task.state)) return;
    const known = error instanceof AppError;
    task.error = { code: known ? error.code : 'provider_failed', message: known ? error.message : '실행에 실패했습니다. 설치·인증·한도를 확인하고 다시 시도합니다.' };
    record(task, 'failed', task.error.message);
    if (activeId === task.id) activeId = null;
  };
  const run = async task => {
    if (task.state !== 'queued') return;
    const controller = new AbortController(); controllers.set(task.id, controller);
    const timer = setTimeout(() => controller.abort(new AppError(504, 'timeout', '120초 이내에 끝나지 않아 중단했습니다. 범위를 줄여 다시 시도합니다.')), timeoutMs);
    record(task, 'planning', '수혜자·문제·필요 데이터·성공 기준을 정리할 계획입니다.');
    record(task, 'working', provider === 'mock' ? '교육용 고정 응답을 생성합니다. 실제 모델 호출은 없습니다.' : '로컬 어댑터가 모델에 텍스트 분석 한 번을 요청합니다.');
    try {
      const result = await Promise.race([
        adapter({ provider, topic: task.title, scenario: task.scenario, signal: controller.signal }),
        new Promise((_, reject) => controller.signal.addEventListener('abort', () => reject(controller.signal.reason), { once: true }))
      ]);
      if (task.state === 'failed') return;
      task.result = validateResult(result);
      record(task, 'review', '스키마 검증을 통과했습니다. 데이터 존재와 사용자 가치를 사람이 확인해야 완료합니다.');
    } catch (error) { fail(task, error); }
    finally { clearTimeout(timer); controllers.delete(task.id); }
  };
  const server = http.createServer(async (req, res) => {
    const origin = `http://127.0.0.1:${server.address().port}`;
    const send = (status, body, type = 'application/json; charset=utf-8') => {
      res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'" });
      res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
    };
    try {
      if (req.headers.host !== `127.0.0.1:${server.address().port}`) throw new AppError(403, 'host_denied', '127.0.0.1 로컬 주소만 허용합니다.');
      if (req.headers['sec-fetch-site'] === 'cross-site' || (req.headers.origin && req.headers.origin !== origin)) throw new AppError(403, 'origin_denied', '이 로컬 화면에서 실행합니다.');
      if (req.method === 'POST' && req.headers.origin !== origin) throw new AppError(403, 'origin_required', '같은 로컬 화면의 요청만 받습니다.');
      const url = new URL(req.url, origin);
      if (req.method === 'GET' && ['/','/app.js','/style.css'].includes(url.pathname)) {
        const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
        const types = { 'index.html': 'text/html; charset=utf-8', 'app.js': 'text/javascript; charset=utf-8', 'style.css': 'text/css; charset=utf-8' };
        return send(200, await readFile(new URL(`./ui/${file}`, import.meta.url)), types[file]);
      }
      if (req.method === 'GET' && url.pathname === '/api/health') return send(200, { ok: true, provider, runtime: 'local', liveModelVerified: false, maxConcurrent: 1, timeoutMs, activeId });
      if (req.method === 'GET' && url.pathname === '/api/tasks') return send(200, { tasks: [...tasks.values()].map(safeTask) });
      if (req.method === 'POST' && url.pathname === '/api/tasks') {
        const body = await readJSON(req);
        if (activeId) throw new AppError(409, 'busy', '진행 중인 작업을 확인·완료하거나 취소한 뒤 다음 작업을 시작합니다.');
        if (typeof body.topic !== 'string' || body.topic.trim().length < 2 || body.topic.length > 1_000) throw new AppError(422, 'invalid_topic', '주제는 2~1000자로 입력합니다.');
        if (body.scenario && (provider !== 'mock' || !['success','failure'].includes(body.scenario))) throw new AppError(422, 'invalid_scenario', '실패 재현은 모형 모드에서만 가능합니다.');
        if (tasks.size >= MAX_TASKS) tasks.delete(tasks.keys().next().value);
        const task = { id: randomUUID(), title: body.topic.trim(), provider, createdAt: new Date().toISOString(), state: 'queued', events: [], scenario: body.scenario ?? 'success' };
        tasks.set(task.id, task); activeId = task.id; record(task, 'queued', '작업을 접수했습니다. 한 번에 한 작업만 실행합니다.');
        if (provider === 'manual') { record(task, 'planning', '표시된 프롬프트를 본인의 AI 구독 화면에 입력합니다.'); record(task, 'working', '응답 JSON을 직접 가져오기를 기다립니다. 인증은 연결하지 않습니다.'); }
        else setImmediate(() => run(task));
        return send(202, safeTask(task));
      }
      const match = url.pathname.match(/^\/api\/tasks\/([0-9a-f-]{36})(?:\/(approve|cancel|import|export))?$/);
      if (match) {
        const task = tasks.get(match[1]);
        if (!task) throw new AppError(404, 'not_found', '작업을 찾지 못했습니다.');
        if (req.method === 'GET' && (!match[2] || match[2] === 'export')) return send(200, safeTask(task));
        if (req.method === 'POST') {
          const body = await readJSON(req);
          if (match[2] === 'approve') {
            if (task.state !== 'review') throw new AppError(409, 'not_reviewing', '검토 단계에서만 완료할 수 있습니다.');
            if (body.accepted !== true) throw new AppError(422, 'review_required', '데이터 후보와 성공 기준을 확인한 뒤 완료합니다.');
            record(task, 'done', '사람이 요구사항 초안을 확인했습니다. 외부 전송·배포·파일 변경은 수행하지 않았습니다.'); activeId = null;
          } else if (match[2] === 'cancel') {
            if (['done','failed'].includes(task.state)) throw new AppError(409, 'already_finished', '이미 끝난 작업입니다.');
            const error = new AppError(499, 'cancelled', '사용자가 작업을 취소했습니다.');
            controllers.get(task.id)?.abort(error); fail(task, error);
          } else if (match[2] === 'import') {
            if (provider !== 'manual' || task.state !== 'working') throw new AppError(409, 'not_importing', '수동 결과 모드의 실행 단계에서 가져옵니다.');
            task.result = validateResult(body.result); record(task, 'review', '사용자가 반입한 JSON이 형식 검증을 통과했습니다. 내용을 확인합니다.');
          } else throw new AppError(404, 'not_found', '지원하지 않는 경로입니다.');
          return send(200, safeTask(task));
        }
      }
      throw new AppError(404, 'not_found', '지원하지 않는 경로입니다.');
    } catch (error) { const known = error instanceof AppError; send(known ? error.status : 500, { error: { code: known ? error.code : 'internal_error', message: known ? error.message : '요청을 처리하지 못했습니다.' } }); }
  });
  server.requestTimeout = 10_000; server.headersTimeout = 10_000;
  server.on('close', () => { for (const controller of controllers.values()) controller.abort(new AppError(499, 'shutdown', '서버가 종료되어 중단했습니다.')); });
  server.stop = () => { for (const controller of controllers.values()) controller.abort(new AppError(499, 'shutdown', '서버가 종료되어 중단했습니다.')); server.close(); server.closeIdleConnections(); };
  return server;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const provider = process.argv.find(arg => arg.startsWith('--provider='))?.split('=')[1] ?? 'mock';
  const port = Number(process.env.JARVIS_PORT ?? 4318);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('JARVIS_PORT는 1024~65535입니다.');
  const server = createJarvisServer({ provider });
  server.listen(port, '127.0.0.1', () => console.log(`나만의 자비스 · ${provider}\nhttp://127.0.0.1:${port}\n공개 서버로 배포하지 않습니다. 종료: Ctrl+C`));
  process.on('SIGINT', () => server.stop()); process.on('SIGTERM', () => server.stop());
}
