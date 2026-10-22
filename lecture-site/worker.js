import labCsp from './lab-csp.json';
const MAX_BODY = 32 * 1024;
const SCORE_LIMITS = { problem: 20, ux: 25, engineering: 20, verification: 20, reflection: 15 };
const STUDENT_TTL = 14 * 24 * 60 * 60;
const ADMIN_TTL = 8 * 60 * 60;
const ID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const encoder = new TextEncoder();

class HttpError extends Error {
  constructor(status, message, headers = {}) { super(message); this.status = status; this.headers = headers; }
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store, private', ...headers }
  });
}

function secureResponse(response, pathname = "") {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Workers Assets redirects .html URLs to their extensionless canonical path.
  const scriptHashes = labCsp[pathname] || labCsp[`${pathname}.html`] || [];
  const scripts = scriptHashes.map(hash => ` '${hash}'`).join('');
  headers.set('Content-Security-Policy', `default-src 'self'; script-src 'self'${scripts}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function digest(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))), b => b.toString(16).padStart(2, '0')).join('');
}

function token(bytes = 24) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), b => b.toString(16).padStart(2, '0')).join('');
}

async function constantTimeEqual(a, b) {
  const [left, right] = await Promise.all([digest(a), digest(b)]);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}

function cookieName(request, role) {
  return `${new URL(request.url).protocol === 'https:' ? '__Host-' : ''}lecture_${role}`;
}

function cookieValue(request, role) {
  const name = cookieName(request, role);
  const cookie = (request.headers.get('Cookie') || '').split(';').map(x => x.trim()).find(x => x.startsWith(`${name}=`));
  return cookie ? cookie.slice(name.length + 1) : '';
}

function sessionCookie(request, role, value, age) {
  return `${cookieName(request, role)}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}

function enforceOrigin(request) {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.headers.get('Origin') !== new URL(request.url).origin) {
    throw new HttpError(403, '이 사이트에서 다시 시도해 주세요.');
  }
}

async function readJson(request) {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) throw new HttpError(415, 'JSON 형식으로 보내 주세요.');
  if (Number(request.headers.get('Content-Length')) > MAX_BODY) throw new HttpError(413, '제출 내용이 너무 큽니다.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, '입력 내용이 없습니다.');
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) { await reader.cancel(); throw new HttpError(413, '제출 내용이 너무 큽니다.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let data;
  try { data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new HttpError(400, '입력 형식을 확인해 주세요.'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new HttpError(400, '입력 형식을 확인해 주세요.');
  return data;
}

function text(value, field, max, min = 1) {
  if (typeof value !== 'string') throw new HttpError(400, `${field}을(를) 입력해 주세요.`);
  const result = value.trim();
  if (result.length < min || result.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(result)) {
    throw new HttpError(400, `${field}은(는) ${min}~${max}자로 입력해 주세요.`);
  }
  return result;
}

function optionalUrl(value, field) {
  if (value === undefined || value === null || value === '') return '';
  const raw = text(value, field, 2000);
  let parsed;
  try { parsed = new URL(raw); } catch { throw new HttpError(400, `${field}의 주소를 확인해 주세요.`); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new HttpError(400, `${field}에는 HTTPS 주소를 입력해 주세요.`);
  return parsed.href;
}

function recoveryHashInput(code) {
  if (typeof code !== 'string' || code.length > 100) return '';
  return code.replace(/[\s-]/g, '').toLowerCase();
}

async function rateLimit(request, env, scope, max, seconds, keySuffix = '') {
  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / seconds);
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const key = `${scope}:${await digest(`${ip}:${keySuffix}`)}:${bucket}`;
  const result = await env.DB.prepare(`INSERT INTO rate_limits (bucket_key, hits, expires_at) VALUES (?, 1, ?)
    ON CONFLICT(bucket_key) DO UPDATE SET hits = hits + 1 RETURNING hits`).bind(key, (bucket + 1) * seconds).first();
  if (result.hits > max) throw new HttpError(429, '시도가 많습니다. 잠시 후 다시 시도해 주세요.', { 'Retry-After': String((bucket + 1) * seconds - now) });
}

async function createSession(request, env, role, studentId = null) {
  const value = token();
  const now = Math.floor(Date.now() / 1000);
  const age = role === 'admin' ? ADMIN_TTL : STUDENT_TTL;
  const previous = cookieValue(request, role);
  const statements = [env.DB.prepare('INSERT INTO sessions(token_hash,role,student_id,created_at,expires_at) VALUES (?,?,?,?,?)').bind(await digest(value), role, studentId, now, now + age)];
  if (previous) statements.push(env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await digest(previous)));
  statements.push(env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now));
  statements.push(env.DB.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(now));
  await env.DB.batch(statements);
  return sessionCookie(request, role, value, age);
}

async function requireSession(request, env, role) {
  const value = cookieValue(request, role);
  if (!/^[a-f0-9]{48}$/.test(value)) throw new HttpError(401, '로그인이 필요합니다.');
  const session = await env.DB.prepare('SELECT * FROM sessions WHERE token_hash = ? AND role = ? AND expires_at > ?').bind(await digest(value), role, Math.floor(Date.now() / 1000)).first();
  if (!session) throw new HttpError(401, '로그인이 만료되었습니다. 다시 로그인해 주세요.');
  return session;
}

function reviewObject(row) {
  if (!row) return null;
  return { id: row.id, version: row.version, status: row.status, scores: row.scores_json ? JSON.parse(row.scores_json) : null, total: row.total, feedback: row.feedback, createdAt: row.created_at };
}

function submissionObject(row) {
  return {
    id: row.id, studentId: row.student_id, studentName: row.student_name,
    assignment: row.assignment, title: row.title, body: row.body,
    projectUrl: row.project_url, repositoryUrl: row.repository_url, dataUrl: row.data_url,
    version: row.version, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at,
    review: row.review_json ? reviewObject(JSON.parse(row.review_json)) : null
  };
}

const SELECT_SUBMISSIONS = `SELECT s.*, st.name AS student_name,
  (SELECT json_object('id',r.id,'version',r.version,'status',r.status,'scores_json',r.scores_json,'total',r.total,'feedback',r.feedback,'created_at',r.created_at)
   FROM reviews r WHERE r.submission_id = s.id AND r.version = s.version ORDER BY r.created_at DESC, r.rowid DESC LIMIT 1) AS review_json
  FROM submissions s JOIN students st ON st.id = s.student_id`;

async function submissionDetail(env, id, studentId = null) {
  const row = await env.DB.prepare(`${SELECT_SUBMISSIONS} WHERE s.id = ?${studentId ? ' AND s.student_id = ?' : ''}`).bind(...(studentId ? [id, studentId] : [id])).first();
  if (!row) throw new HttpError(404, '제출물을 찾을 수 없습니다.');
  const [versions, reviews] = await Promise.all([
    env.DB.prepare('SELECT * FROM submission_versions WHERE submission_id = ? ORDER BY version DESC').bind(id).all(),
    env.DB.prepare('SELECT * FROM reviews WHERE submission_id = ? ORDER BY created_at DESC, rowid DESC').bind(id).all()
  ]);
  return {
    submission: submissionObject(row),
    versions: versions.results.map(v => ({ version: v.version, title: v.title, body: v.body, projectUrl: v.project_url, repositoryUrl: v.repository_url, dataUrl: v.data_url, createdAt: v.created_at })),
    reviews: reviews.results.map(reviewObject)
  };
}

async function saveSubmission(request, env) {
  const session = await requireSession(request, env, 'student');
  await rateLimit(request, env, 'submit', 60, 600, session.student_id);
  const data = await readJson(request);
  if (!Number.isInteger(data.assignment) || data.assignment < 0 || data.assignment > 5) throw new HttpError(400, '과제를 선택해 주세요.');
  const title = text(data.title, '제목', 200);
  const body = text(data.body, '내용', 16000, 10);
  const projectUrl = optionalUrl(data.projectUrl, '프로젝트 주소');
  const repositoryUrl = optionalUrl(data.repositoryUrl, '저장소 주소');
  const dataUrl = optionalUrl(data.dataUrl, '데이터 출처');
  if (data.expectedVersion !== undefined && (!Number.isInteger(data.expectedVersion) || data.expectedVersion < 0)) throw new HttpError(400, '제출 버전이 올바르지 않습니다.');
  const existing = await env.DB.prepare('SELECT id,version FROM submissions WHERE student_id = ? AND assignment = ?').bind(session.student_id, data.assignment).first();
  const now = new Date().toISOString();
  let id = existing?.id;
  let result;
  if (existing) {
    if (data.expectedVersion !== existing.version) throw new HttpError(409, '다른 화면에서 제출물이 변경되었습니다. 최신 내용을 불러온 뒤 다시 제출해 주세요.');
    result = await env.DB.prepare(`UPDATE submissions SET title=?,body=?,project_url=?,repository_url=?,data_url=?,version=version+1,status='submitted',updated_at=? WHERE id=? AND student_id=? AND version=?`)
      .bind(title, body, projectUrl, repositoryUrl, dataUrl, now, id, session.student_id, data.expectedVersion).run();
  } else {
    if (data.expectedVersion !== undefined && data.expectedVersion !== 0) throw new HttpError(409, '제출 상태가 변경되었습니다. 새로고침 후 다시 제출해 주세요.');
    id = crypto.randomUUID();
    result = await env.DB.prepare(`INSERT OR IGNORE INTO submissions(id,student_id,assignment,title,body,project_url,repository_url,data_url,version,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,1,'submitted',?,?)`)
      .bind(id, session.student_id, data.assignment, title, body, projectUrl, repositoryUrl, dataUrl, now, now).run();
  }
  if (result.meta.changes === 0) throw new HttpError(409, '다른 화면에서 제출물이 변경되었습니다. 최신 내용을 확인해 주세요.');
  return json({ submission: (await submissionDetail(env, id, session.student_id)).submission }, existing ? 200 : 201);
}

async function saveReview(request, env, id) {
  await requireSession(request, env, 'admin');
  const data = await readJson(request);
  if (!Number.isInteger(data.version) || data.version < 1) throw new HttpError(400, '평가할 제출 버전을 확인해 주세요.');
  if (!['reviewed', 'revision_requested'].includes(data.status)) throw new HttpError(400, '평가 상태를 선택해 주세요.');
  const feedback = text(data.feedback, '피드백', 8000);
  let scores = null;
  let total = null;
  if (data.scores !== undefined && data.scores !== null) {
    if (typeof data.scores !== 'object' || Array.isArray(data.scores) || Object.keys(data.scores).length !== 5) throw new HttpError(400, '다섯 가지 평가 점수를 모두 입력해 주세요.');
    scores = {};
    total = 0;
    for (const [key, limit] of Object.entries(SCORE_LIMITS)) {
      const value = data.scores[key];
      if (!Number.isInteger(value) || value < 0 || value > limit) throw new HttpError(400, `${key} 점수는 0~${limit} 사이의 정수여야 합니다.`);
      scores[key] = value;
      total += value;
    }
  }
  const row = await env.DB.prepare('SELECT id,version FROM submissions WHERE id=?').bind(id).first();
  if (!row) throw new HttpError(404, '제출물을 찾을 수 없습니다.');
  if (row.version !== data.version) throw new HttpError(409, '학생이 새 버전을 제출했습니다. 최신 제출물을 확인한 뒤 평가해 주세요.');
  const reviewId = crypto.randomUUID();
  const now = new Date().toISOString();
  const results = await env.DB.batch([
    env.DB.prepare(`INSERT INTO reviews(id,submission_id,version,status,scores_json,total,feedback,created_at)
      SELECT ?,id,version,?,?,?,?,? FROM submissions WHERE id=? AND version=?`)
      .bind(reviewId, data.status, scores ? JSON.stringify(scores) : null, total, feedback, now, id, data.version),
    env.DB.prepare(`UPDATE submissions SET status=? WHERE id=? AND version=? AND EXISTS (SELECT 1 FROM reviews WHERE id=?)`)
      .bind(data.status, id, data.version, reviewId)
  ]);
  if (results[0].meta.changes === 0) throw new HttpError(409, '학생이 새 버전을 제출했습니다. 최신 내용을 확인해 주세요.');
  return json({ review: { id: reviewId, version: data.version, status: data.status, scores, total, feedback, createdAt: now } }, 201);
}

async function api(request, env) {
  enforceOrigin(request);
  const { pathname } = new URL(request.url);
  const method = request.method;
  if (pathname === '/api/health' && method === 'GET') {
    await env.DB.prepare('SELECT id FROM students LIMIT 1').first();
    return json({ ok: true, service: 'kangnam-ai-course', database: 'ready' });
  }

  if (pathname === '/api/student/register' && method === 'POST') {
    await rateLimit(request, env, 'register', Number(env.REGISTER_LIMIT_PER_HOUR) || 100, 3600);
    const data = await readJson(request);
    const name = text(data.name, '이름 또는 별명', 60);
    const rawCode = token(16);
    const recoveryCode = rawCode.match(/.{1,4}/g).join('-');
    const id = crypto.randomUUID();
    await env.DB.prepare('INSERT INTO students(id,name,code_hash,created_at) VALUES(?,?,?,?)').bind(id, name, await digest(rawCode), new Date().toISOString()).run();
    return json({ student: { id, name }, recoveryCode }, 201, { 'Set-Cookie': await createSession(request, env, 'student', id) });
  }
  if (pathname === '/api/student/login' && method === 'POST') {
    const data = await readJson(request);
    const code = recoveryHashInput(data.code);
    await rateLimit(request, env, 'student-login-total', 500, 600);
    await rateLimit(request, env, 'student-login', 10, 600, code);
    const student = /^[a-f0-9]{32}$/.test(code) ? await env.DB.prepare('SELECT id,name FROM students WHERE code_hash=?').bind(await digest(code)).first() : null;
    if (!student) throw new HttpError(401, '제출 확인 코드를 확인해 주세요.');
    return json({ student }, 200, { 'Set-Cookie': await createSession(request, env, 'student', student.id) });
  }
  if (pathname === '/api/admin/login' && method === 'POST') {
    await rateLimit(request, env, 'admin-login', 10, 600);
    if (!env.ADMIN_PASSWORD) throw new HttpError(503, '강사 로그인이 아직 설정되지 않았습니다.');
    const data = await readJson(request);
    if (typeof data.password !== 'string' || data.password.length > 1000 || !await constantTimeEqual(data.password, env.ADMIN_PASSWORD)) throw new HttpError(401, '로그인 정보를 확인해 주세요.');
    return json({ admin: true }, 200, { 'Set-Cookie': await createSession(request, env, 'admin') });
  }
  if ((pathname === '/api/student/logout' || pathname === '/api/admin/logout') && method === 'POST') {
    const role = pathname.includes('/admin/') ? 'admin' : 'student';
    const value = cookieValue(request, role);
    if (value) await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(value)).run();
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(request, role, '', 0) });
  }
  if (pathname === '/api/student/me' && method === 'GET') {
    const session = await requireSession(request, env, 'student');
    const [student, submissions] = await Promise.all([
      env.DB.prepare('SELECT id,name FROM students WHERE id=?').bind(session.student_id).first(),
      env.DB.prepare(`${SELECT_SUBMISSIONS} WHERE s.student_id=? ORDER BY s.assignment`).bind(session.student_id).all()
    ]);
    return json({ student, submissions: submissions.results.map(submissionObject) });
  }
  if (pathname === '/api/admin/me' && method === 'GET') {
    await requireSession(request, env, 'admin');
    return json({ admin: true });
  }
  if (pathname === '/api/submissions' && method === 'POST') return saveSubmission(request, env);
  const ownDetail = pathname.match(new RegExp(`^/api/submissions/(${ID})$`));
  if (ownDetail && method === 'GET') {
    const session = await requireSession(request, env, 'student');
    return json(await submissionDetail(env, ownDetail[1], session.student_id));
  }
  if (pathname === '/api/admin/submissions' && method === 'GET') {
    await requireSession(request, env, 'admin');
    const records = await env.DB.prepare(`${SELECT_SUBMISSIONS} ORDER BY s.updated_at DESC, s.id`).all();
    const submissions = records.results.map(submissionObject);
    const stats = { total: submissions.length, submitted: 0, reviewed: 0, revision_requested: 0, students: new Set(submissions.map(s => s.studentId)).size };
    for (const submission of submissions) stats[submission.status]++;
    return json({ submissions, stats });
  }
  const adminDetail = pathname.match(new RegExp(`^/api/admin/submissions/(${ID})$`));
  if (adminDetail && method === 'GET') {
    await requireSession(request, env, 'admin');
    return json(await submissionDetail(env, adminDetail[1]));
  }
  const reviewPath = pathname.match(new RegExp(`^/api/admin/submissions/(${ID})/review$`));
  if (reviewPath && method === 'POST') return saveReview(request, env, reviewPath[1]);
  if (pathname === '/api/admin/export' && method === 'GET') {
    await requireSession(request, env, 'admin');
    const [students, submissions, versions, reviews] = await Promise.all([
      env.DB.prepare('SELECT id,name,created_at AS createdAt FROM students ORDER BY created_at').all(),
      env.DB.prepare(`${SELECT_SUBMISSIONS} ORDER BY s.updated_at`).all(),
      env.DB.prepare('SELECT * FROM submission_versions ORDER BY submission_id,version').all(),
      env.DB.prepare('SELECT * FROM reviews ORDER BY created_at').all()
    ]);
    return json({ exportedAt: new Date().toISOString(), students: students.results, submissions: submissions.results.map(submissionObject), versions: versions.results, reviews: reviews.results.map(r => ({ submissionId: r.submission_id, ...reviewObject(r) })) }, 200,
      { 'Content-Disposition': `attachment; filename="course-submissions-${new Date().toISOString().slice(0, 10)}.json"` });
  }
  const deleteStudent = pathname.match(new RegExp(`^/api/admin/students/(${ID})$`));
  if (deleteStudent && method === 'DELETE') {
    await requireSession(request, env, 'admin');
    const result = await env.DB.prepare('DELETE FROM students WHERE id=?').bind(deleteStudent[1]).run();
    if (!result.meta.changes) throw new HttpError(404, '학생을 찾을 수 없습니다.');
    return json({ ok: true });
  }
  throw new HttpError(404, '요청한 기능을 찾을 수 없습니다.');
}

export default {
  async fetch(request, env) {
    try {
      const pathname = new URL(request.url).pathname;
      if (pathname === '/api' || pathname.startsWith('/api/')) return secureResponse(await api(request, env));
      return secureResponse(await env.ASSETS.fetch(request), pathname);
    } catch (error) {
      if (error instanceof HttpError) return secureResponse(json({ error: error.message }, error.status, error.headers));
      console.error('Request failed', error?.name || 'Error');
      return secureResponse(json({ error: '저장 또는 조회 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.' }, 500));
    }
  }
};
