import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CODEX_AUTH_DIR, CODEX_CONFIG } from './adapters.mjs';
await mkdir(CODEX_AUTH_DIR, { recursive: true, mode: 0o700 });
const configPath = path.join(CODEX_AUTH_DIR, 'config.toml');
try {
  const previous = await readFile(configPath, 'utf8');
  if (previous !== CODEX_CONFIG) throw new Error('기존 실습 설정이 다릅니다. 직접 백업·확인한 뒤 config.toml을 제거하고 다시 실행합니다. 자동으로 덮어쓰지 않습니다.');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  await writeFile(configPath, CODEX_CONFIG, { flag: 'wx', mode: 0o600 });
}
console.log(`실습 전용 설정이 준비되었습니다. 기존 Codex 설정과 인증을 복사하지 않습니다.
macOS / Linux / WSL (키트 폴더에서):
  CODEX_HOME="$PWD/.jarvis-auth/codex" codex login
  CODEX_HOME="$PWD/.jarvis-auth/codex" codex login status
PowerShell (키트 폴더에서):
  $env:CODEX_HOME = Join-Path (Get-Location) '.jarvis-auth/codex'
  codex login
  codex login status
  Remove-Item Env:CODEX_HOME
이 로그인은 이 컴퓨터의 개인 실습에만 사용합니다. 완료 후 npm run start:codex를 실행합니다.`);
