import { fork, execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { minimalEnvironment, runAdapter } from './adapters.mjs';
import { AppError } from './contract.mjs';

export function runInWorker(task) {
  if (task.provider === 'mock') return runAdapter(task);
  return new Promise((resolve, reject) => {
    const env = { ...minimalEnvironment(), ...(task.provider === 'claude-api' && process.env.ANTHROPIC_API_KEY ? { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY } : {}), ...(process.env.JARVIS_CODEX_MODEL ? { JARVIS_CODEX_MODEL: process.env.JARVIS_CODEX_MODEL } : {}), ...(process.env.JARVIS_CLAUDE_MODEL ? { JARVIS_CLAUDE_MODEL: process.env.JARVIS_CLAUDE_MODEL } : {}) };
    const child = fork(fileURLToPath(new URL('./provider-worker.mjs', import.meta.url)), [], { env, stdio: ['ignore', 'ignore', 'ignore', 'ipc'], detached: process.platform !== 'win32' });
    let settled = false;
    const kill = (signal = 'SIGTERM') => {
      if (process.platform === 'win32') {
        execFile('taskkill', ['/pid', String(child.pid), '/t', '/f'], () => {});
      } else {
        try { process.kill(-child.pid, signal); } catch { /* 이미 종료된 프로세스입니다. */ }
      }
    };
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      task.signal.removeEventListener('abort', abort);
      if (error) reject(error); else resolve(result);
    };
    const abort = () => {
      kill();
      setTimeout(() => kill('SIGKILL'), 700).unref();
      finish(task.signal.reason ?? new AppError(499, 'cancelled', '실행을 취소했습니다.'));
    };
    task.signal.addEventListener('abort', abort, { once: true });
    child.on('message', (message) => {
      if (message?.ok) finish(null, message.result);
      else finish(new AppError(502, message?.code ?? 'provider_failed', message?.message ?? '모델 실행에 실패했습니다.'));
    });
    child.on('error', () => finish(new AppError(502, 'provider_start_failed', '실행 프로세스를 시작하지 못했습니다.')));
    child.on('exit', () => finish(new AppError(502, 'provider_exited', '결과를 받기 전에 실행이 끝났습니다.')));
    if (task.signal.aborted) abort();
    else child.send({ provider: task.provider, topic: task.topic });
  });
}
