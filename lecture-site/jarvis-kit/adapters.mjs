import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppError, buildPrompt, exampleResult, RESULT_SCHEMA } from './contract.mjs';

export const KIT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const CODEX_AUTH_DIR = path.join(KIT_DIR, '.jarvis-auth', 'codex');
export const CODEX_CONFIG = `forced_login_method = "chatgpt"
cli_auth_credentials_store = "file"
project_doc_max_bytes = 0
sandbox_mode = "read-only"
approval_policy = "never"
web_search = "disabled"
[features]
shell_tool = false
unified_exec = false
apps = false
hooks = false
multi_agent = false
memories = false
plugins = false
`;

export function minimalEnvironment(source = process.env) {
  return Object.fromEntries(['PATH', 'HOME', 'USERPROFILE', 'SystemRoot', 'TEMP', 'TMP', 'TMPDIR', 'LANG', 'SSL_CERT_FILE'].filter(key => typeof source[key] === 'string').map(key => [key, source[key]]));
}

export function codexOptions(workspace, signal, env = process.env) {
  return {
    client: {
      env: { ...minimalEnvironment(env), CODEX_HOME: CODEX_AUTH_DIR },
      config: { project_doc_max_bytes: 0, forced_login_method: 'chatgpt', features: { shell_tool: false, unified_exec: false, apps: false, hooks: false, multi_agent: false, memories: false, plugins: false } }
    },
    thread: { workingDirectory: workspace, skipGitRepoCheck: true, sandboxMode: 'read-only', approvalPolicy: 'never', networkAccessEnabled: false, webSearchMode: 'disabled', ...(env.JARVIS_CODEX_MODEL ? { model: env.JARVIS_CODEX_MODEL } : {}) },
    turn: { outputSchema: RESULT_SCHEMA, signal }
  };
}

export function claudeOptions(workspace, controller, env = process.env) {
  if (!env.ANTHROPIC_API_KEY) throw new AppError(503, 'missing_api_key', 'Claude Agent SDK는 별도 API 키가 필요합니다. 구독만 있으면 수동 결과 모드를 사용합니다.');
  return {
    cwd: workspace, abortController: controller,
    env: { ...minimalEnvironment(env), ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY, CLAUDE_AGENT_SDK_CLIENT_APP: 'kangnam-my-jarvis/1.0.0' },
    tools: [], allowedTools: [], disallowedTools: ['Bash', 'Read', 'Write', 'Edit', 'WebFetch', 'WebSearch', 'Agent'],
    mcpServers: {}, settingSources: [], skills: [], plugins: [],
    permissionMode: 'dontAsk', canUseTool: async () => ({ behavior: 'deny', message: '이 실습은 도구 실행을 허용하지 않습니다.' }),
    persistSession: false, maxTurns: 2, maxBudgetUsd: 0.25,
    systemPrompt: '공공데이터 아이디어를 한국어 JSON으로 정리합니다. 도구 호출 없이 제공된 주제만 분석합니다.',
    outputFormat: { type: 'json_schema', schema: RESULT_SCHEMA },
    ...(env.JARVIS_CLAUDE_MODEL ? { model: env.JARVIS_CLAUDE_MODEL } : {})
  };
}

export async function runAdapter({ provider, topic, signal, scenario = 'success' }) {
  if (provider === 'mock') {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 500);
      signal.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
    });
    if (scenario === 'failure') throw new AppError(503, 'demo_failure', '연결 실패를 재현했습니다. 설정을 확인한 뒤 새 작업으로 재시도합니다.');
    return exampleResult(topic);
  }
  const workspace = await mkdtemp(path.join(tmpdir(), 'kangnam-jarvis-'));
  try {
    if (provider === 'codex') {
      let config;
      try { config = await readFile(path.join(CODEX_AUTH_DIR, 'config.toml'), 'utf8'); }
      catch { throw new AppError(503, 'codex_setup_required', '먼저 npm run setup:codex와 안내된 로컬 로그인을 완료합니다.'); }
      if (config !== CODEX_CONFIG) throw new AppError(503, 'codex_config_changed', '실습용 Codex 설정이 변경되었습니다. npm run setup:codex로 점검합니다.');
      const { Codex } = await import('@openai/codex-sdk');
      const options = codexOptions(workspace, signal);
      const thread = new Codex(options.client).startThread(options.thread);
      const result = await thread.run(buildPrompt(topic), options.turn);
      return JSON.parse(result.finalResponse);
    }
    if (provider === 'claude-api') {
      const controller = new AbortController();
      const abort = () => controller.abort(signal.reason);
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) abort();
      try {
        const options = claudeOptions(workspace, controller);
        const { query } = await import('@anthropic-ai/claude-agent-sdk');
        for await (const event of query({ prompt: buildPrompt(topic), options })) {
          if (event.type === 'result') {
            if (event.subtype !== 'success') throw new AppError(502, 'provider_failed', 'Claude 실행이 완료되지 않았습니다. 인증·한도·모델 설정을 확인합니다.');
            return event.structured_output ?? JSON.parse(event.result);
          }
        }
        throw new AppError(502, 'empty_result', '모델이 결과를 반환하지 않았습니다.');
      } finally { signal.removeEventListener('abort', abort); }
    }
    throw new AppError(400, 'unknown_provider', '지원하는 실행 모드를 선택합니다.');
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') throw new AppError(503, 'sdk_not_installed', 'README에 안내된 선택 SDK를 먼저 설치합니다.');
    throw error;
  } finally { await rm(workspace, { recursive: true, force: true }); }
}
