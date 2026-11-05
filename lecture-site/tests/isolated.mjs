import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { randomBytes } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const password = randomBytes(32).toString('base64url');
let testUrl = '';

// D1.exec splits input by line. Keep each CREATE TRIGGER ... END block intact
// while applying the repository's SQL statements through the prepared API.
function migrationStatements(source) {
  const statements = [];
  let statement = '';
  for (const line of source.split(/\r?\n/)) {
    if (!statement && (!line.trim() || line.trimStart().startsWith('--'))) continue;
    statement += `${statement ? '\n' : ''}${line}`;
    const trigger = /^\s*CREATE\s+(?:TEMP(?:ORARY)?\s+)?TRIGGER\b/i.test(statement);
    if (/;\s*$/.test(line) && (!trigger || /^\s*END;\s*$/i.test(line))) {
      statements.push(statement.trim());
      statement = '';
    }
  }
  if (statement.trim()) throw new Error('마이그레이션에 완료되지 않은 SQL 문장이 있습니다.');
  return statements;
}

// Match Wrangler's module bundling, including the generated lab CSP manifest.
const bundle = await build({ entryPoints: [join(projectRoot, 'worker.js')], bundle: true,
  write: false, format: 'esm', platform: 'browser', target: 'es2022' });
const runtime = new Miniflare({ ...convertV4MiniflareOptions({
  name: 'lecture-api-isolated-test',
  modules: true,
  script: bundle.outputFiles[0].text,
  compatibilityDate: '2026-10-22',
  host: '127.0.0.1',
  port: 0,
  cf: false,
  logRequests: false,
  d1Persist: false,
  d1Databases: { DB: 'lecture-api-isolated-test-db' },
  bindings: { ADMIN_PASSWORD: password }
}), telemetry: { enabled: false } });

try {
  const database = await runtime.getD1Database('DB');
  const migrationDirectory = join(projectRoot, 'migrations');
  const files = (await readdir(migrationDirectory)).filter(name => /^\d+.*\.sql$/.test(name)).sort();
  if (!files.length) throw new Error('적용할 D1 마이그레이션을 찾을 수 없습니다.');
  for (const file of files) {
    const source = await readFile(join(migrationDirectory, file), 'utf8');
    for (const statement of migrationStatements(source)) await database.prepare(statement).run();
  }

  testUrl = String(await runtime.ready);
  const childEnvironment = {
    TEST_BASE_URL: testUrl,
    TEST_ADMIN_PASSWORD: password
  };
  if (process.env.PATH) childEnvironment.PATH = process.env.PATH;
  if (process.env.SystemRoot) childEnvironment.SystemRoot = process.env.SystemRoot;
  const child = spawn(process.execPath, ['--test', join(projectRoot, 'tests/api.test.mjs')], {
    cwd: projectRoot,
    env: childEnvironment,
    stdio: 'inherit',
    timeout: 120_000
  });
  const exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve(signal ? 1 : code ?? 1));
  });
  process.exitCode = exitCode;
} catch (error) {
  let message = error instanceof Error ? error.message : '알 수 없는 오류';
  message = message.replaceAll(password, '[redacted]');
  if (testUrl) message = message.replaceAll(testUrl, '[local test server]');
  console.error(`격리 API 검증 실패: ${message.slice(0, 1500)}`);
  process.exitCode = 1;
} finally {
  await runtime.dispose();
}
