import { runAdapter } from './adapters.mjs';
const controller = new AbortController();
process.on('SIGTERM', () => controller.abort(new Error('실행을 중단했습니다.')));
process.once('message', async (task) => {
  try {
    const result = await runAdapter({ ...task, signal: controller.signal });
    process.send?.({ ok: true, result }, () => process.exit(0));
  } catch (error) {
    // SDK stderr와 인증 정보를 IPC로 전달하지 않습니다.
    const known = Number.isInteger(error.status);
    process.send?.({ ok: false, code: known ? error.code : 'provider_failed', message: known ? error.message : '모델 실행에 실패했습니다. 설치·로그인·사용량을 로컬에서 확인합니다.' }, () => process.exit(1));
  }
});
