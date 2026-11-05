import test from 'node:test';
import assert from 'node:assert/strict';

const base = (process.env.TEST_BASE_URL || 'http://localhost:8787').replace(/\/$/, '');
const origin = new URL(base).origin;
const adminPassword = process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

function client() {
  const cookies = new Map();
  return {
    cookies,
    async request(path, { method = 'GET', body, headers = {}, raw } = {}) {
      const requestHeaders = { ...(method === 'GET' ? {} : { Origin: origin }), ...headers };
      if (cookies.size) requestHeaders.Cookie = [...cookies].map(([k, v]) => `${k}=${v}`).join('; ');
      if (body !== undefined) requestHeaders['Content-Type'] ||= 'application/json';
      const response = await fetch(`${base}${path}`, {
        method, headers: requestHeaders,
        body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
        redirect: 'manual'
      });
      for (const value of response.headers.getSetCookie()) {
        const [pair] = value.split(';');
        const separator = pair.indexOf('=');
        const key = pair.slice(0, separator);
        const cookie = pair.slice(separator + 1);
        if (cookie) cookies.set(key, cookie); else cookies.delete(key);
      }
      let data;
      try { data = await response.json(); } catch { data = null; }
      return { status: response.status, data, headers: response.headers };
    }
  };
}

test('과제 제출·평가·권한·버전 관리의 실제 HTTP 계약', async t => {
  assert.ok(adminPassword, 'TEST_ADMIN_PASSWORD 또는 ADMIN_PASSWORD 환경 변수가 필요합니다.');
  const publicUser = client();
  const alpha = client();
  const beta = client();
  const instructor = client();
  const studentIds = [];
  let alphaCode;
  let submissionId;
  let currentVersion;
  const initial = {
    assignment: 0, title: '공원에서 함께 배우는 지역 게임',
    body: '공원 데이터를 활용해 처음 방문한 주민도 주변 자연을 관찰하며 배울 수 있는 게임을 만들겠습니다.',
    dataUrl: 'https://www.data.go.kr/data/15012890/standard.do', expectedVersion: 0
  };

  try {
    await t.test('익명 방문자는 자료와 서비스 상태만 확인하며 개인 자료에는 접근하지 못합니다', async () => {
      const health = await publicUser.request('/api/health');
      assert.equal(health.status, 200);
      assert.equal(health.data.database, 'ready');
      assert.match(health.headers.get('cache-control'), /no-store/);
      assert.match(health.headers.get('content-security-policy'), /script-src 'self'/);
      for (const path of ['/api/student/me', '/api/admin/me', '/api/admin/submissions', '/api/admin/export']) {
        assert.equal((await publicUser.request(path)).status, 401, path);
      }
      assert.equal((await publicUser.request('/api/student/register', { method: 'POST', headers: { Origin: 'https://untrusted.example' }, body: { name: 'CSRF' } })).status, 403);
      assert.equal((await publicUser.request('/api/student/register', { method: 'POST', headers: { Origin: '' }, body: { name: 'CSRF' } })).status, 403);
    });

    await t.test('학생 확인 코드를 발급하고 안전한 세션 쿠키를 설정합니다', async () => {
      for (const [person, label] of [[alpha, 'A'], [beta, 'B']]) {
        const result = await person.request('/api/student/register', { method: 'POST', body: { name: `자동검증 ${label} ${Date.now()}` } });
        assert.equal(result.status, 201);
        studentIds.push(result.data.student.id);
        assert.match(result.data.recoveryCode, /^(?:[a-f0-9]{4}-){7}[a-f0-9]{4}$/);
        assert.match(result.headers.get('set-cookie'), /HttpOnly/);
        assert.match(result.headers.get('set-cookie'), /SameSite=Strict/);
        if (origin.startsWith('https:')) assert.match(result.headers.get('set-cookie'), /Secure/);
        if (label === 'A') alphaCode = result.data.recoveryCode;
        assert.equal((await person.request('/api/student/me')).data.student.id, result.data.student.id);
      }
    });

    await t.test('첫 제출을 저장하고 다른 학생의 조회를 차단합니다', async () => {
      const result = await alpha.request('/api/submissions', { method: 'POST', body: initial });
      assert.equal(result.status, 201);
      const submission = result.data.submission;
      submissionId = submission.id;
      currentVersion = submission.version;
      assert.equal(currentVersion, 1);
      assert.equal(submission.status, 'submitted');
      assert.equal(submission.review, null);
      const own = await alpha.request(`/api/submissions/${submissionId}`);
      assert.equal(own.data.versions.length, 1);
      assert.equal((await beta.request(`/api/submissions/${submissionId}`)).status, 404);
      assert.equal((await beta.request('/api/student/me')).data.submissions.length, 0);
      assert.equal((await publicUser.request(`/api/submissions/${submissionId}`)).status, 401);
    });

    await t.test('제출 값과 본문 크기를 검증합니다', async () => {
      const invalid = [
        { ...initial, assignment: 6 }, { ...initial, assignment: '0' },
        { ...initial, body: '짧음' }, { ...initial, projectUrl: 'javascript:alert(1)' },
        { ...initial, projectUrl: 'https://user:pass@example.com' },
        { ...initial, dataUrl: 'http://example.com' }
      ];
      for (const body of invalid) assert.equal((await alpha.request('/api/submissions', { method: 'POST', body })).status, 400);
      assert.equal((await alpha.request('/api/submissions', { method: 'POST', body: { ...initial, body: 'a'.repeat(40000) } })).status, 413);
      assert.equal((await alpha.request('/api/submissions', { method: 'POST', raw: '{}', headers: { 'Content-Type': 'text/plain' } })).status, 415);
      assert.equal((await alpha.request('/api/submissions', { method: 'POST', raw: '{broken', headers: { 'Content-Type': 'application/json' } })).status, 400);
    });

    await t.test('동시 수정에서는 하나만 반영하고 과거 버전을 보관합니다', async () => {
      const results = await Promise.all([
        alpha.request('/api/submissions', { method: 'POST', body: { ...initial, title: '동시 수정 A', expectedVersion: currentVersion } }),
        alpha.request('/api/submissions', { method: 'POST', body: { ...initial, title: '동시 수정 B', expectedVersion: currentVersion } })
      ]);
      assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
      const detail = (await alpha.request(`/api/submissions/${submissionId}`)).data;
      currentVersion = detail.submission.version;
      assert.equal(currentVersion, 2);
      assert.equal(detail.versions.length, 2);
      assert.equal(detail.versions[1].title, initial.title);
      assert.equal((await alpha.request('/api/submissions', { method: 'POST', body: initial })).status, 409);
    });

    await t.test('강사가 평가하고 학생이 자신의 피드백을 확인합니다', async () => {
      assert.equal((await instructor.request('/api/admin/login', { method: 'POST', body: { password: 'incorrect' } })).status, 401);
      assert.equal((await instructor.request('/api/admin/login', { method: 'POST', body: { password: adminPassword } })).status, 200);
      const scores = { problem: 18, ux: 21, engineering: 17, verification: 17, reflection: 12 };
      const review = { version: currentVersion, scores, feedback: '도움받는 사용자를 구체화했습니다. 공원 정보의 갱신 시점도 확인해 주세요.', status: 'revision_requested' };
      assert.equal((await beta.request(`/api/admin/submissions/${submissionId}/review`, { method: 'POST', body: review })).status, 401);
      assert.equal((await instructor.request(`/api/admin/submissions/${submissionId}/review`, { method: 'POST', body: { ...review, scores: { ...scores, ux: 26 } } })).status, 400);
      const graded = await instructor.request(`/api/admin/submissions/${submissionId}/review`, { method: 'POST', body: review });
      assert.equal(graded.status, 201);
      assert.equal(graded.data.review.total, 85);
      const mine = (await alpha.request('/api/student/me')).data.submissions[0];
      assert.equal(mine.review.feedback, review.feedback);
      assert.equal(mine.review.total, 85);
      assert.equal(mine.status, 'revision_requested');
      assert.equal((await beta.request(`/api/submissions/${submissionId}`)).status, 404);
    });

    await t.test('재제출하면 다시 평가 대기 상태가 되고 이전 피드백은 보존됩니다', async () => {
      const result = await alpha.request('/api/submissions', { method: 'POST', body: { ...initial, title: '<img src=x onerror=alert(1)> 기록', body: `${initial.body}\n<script>alert('xss')</script>`, expectedVersion: currentVersion } });
      assert.equal(result.status, 200);
      currentVersion = result.data.submission.version;
      assert.equal(result.data.submission.status, 'submitted');
      assert.equal(result.data.submission.review, null);
      assert.match(result.data.submission.body, /<script>/);
      const detail = (await alpha.request(`/api/submissions/${submissionId}`)).data;
      assert.equal(detail.versions.length, 3);
      assert.equal(detail.reviews.length, 1);
      const oldReview = await instructor.request(`/api/admin/submissions/${submissionId}/review`, { method: 'POST', body: { version: 2, feedback: '이전 버전 평가', status: 'reviewed' } });
      assert.equal(oldReview.status, 409);
      const newReview = await instructor.request(`/api/admin/submissions/${submissionId}/review`, { method: 'POST', body: { version: currentVersion, feedback: '아이디어 단계이므로 점수 없이 피드백을 남깁니다.', status: 'reviewed' } });
      assert.equal(newReview.status, 201);
      assert.equal(newReview.data.review.total, null);
      assert.equal(newReview.data.review.scores, null);
    });

    await t.test('로그아웃 후 확인 코드로 돌아오며 데이터와 평가는 유지됩니다', async () => {
      const stolenSession = client();
      for (const [key, value] of alpha.cookies) stolenSession.cookies.set(key, value);
      assert.equal((await alpha.request('/api/student/logout', { method: 'POST' })).status, 200);
      assert.equal((await stolenSession.request('/api/student/me')).status, 401);
      assert.equal((await alpha.request('/api/student/me')).status, 401);
      const returned = client();
      assert.equal((await returned.request('/api/student/login', { method: 'POST', body: { code: alphaCode.toUpperCase().replaceAll('-', ' ') } })).status, 200);
      const state = await returned.request('/api/student/me');
      assert.equal(state.data.submissions[0].version, currentVersion);
      assert.equal(state.data.submissions[0].status, 'reviewed');
      assert.equal((await returned.request('/api/admin/me')).status, 401);
    });

    await t.test('관리자 내보내기에는 인증 코드와 세션 비밀이 포함되지 않습니다', async () => {
      const listing = await instructor.request('/api/admin/submissions');
      assert.equal(listing.status, 200);
      assert.ok(listing.data.submissions.some(s => s.id === submissionId && s.studentName));
      const exported = await instructor.request('/api/admin/export');
      assert.equal(exported.status, 200);
      assert.match(exported.headers.get('content-disposition'), /attachment/);
      const contents = JSON.stringify(exported.data);
      assert.doesNotMatch(contents, /code_hash|token_hash|recoveryCode/);
      assert.ok(!contents.includes(alphaCode));
    });

    await t.test('반복된 잘못된 확인 코드 입력을 제한합니다', async () => {
      const invalidCode = crypto.randomUUID().replaceAll('-', '');
      for (let i = 0; i < 10; i++) {
        assert.equal((await publicUser.request('/api/student/login', { method: 'POST', body: { code: invalidCode } })).status, 401);
      }
      const blocked = await publicUser.request('/api/student/login', { method: 'POST', body: { code: invalidCode } });
      assert.equal(blocked.status, 429);
      assert.ok(Number(blocked.headers.get('retry-after')) > 0);
    });
  } finally {
    // Only delete the accounts created by this test; existing classroom data is untouched.
    if (!(await instructor.request('/api/admin/me')).data?.admin) {
      await instructor.request('/api/admin/login', { method: 'POST', body: { password: adminPassword } });
    }
    for (const id of studentIds) {
      assert.equal((await instructor.request(`/api/admin/students/${id}`, { method: 'DELETE' })).status, 200, `테스트 학생 삭제: ${id}`);
    }
    if (submissionId) assert.equal((await instructor.request(`/api/admin/submissions/${submissionId}`)).status, 404);
    await instructor.request('/api/admin/logout', { method: 'POST' });
  }
});
