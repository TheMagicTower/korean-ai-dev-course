import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { crc32 } from 'node:zlib';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const out = join(root, 'public/labs');
const snapshotSource = await readFile(join(root, 'public/data/libraries.json'), 'utf8');
const snapshot = JSON.parse(snapshotSource);
assert.equal(snapshot.rows.length, 27, '실습 기준 데이터 27개를 확인합니다.');
const guide = await readFile(join(out, 'GUIDE.md'), 'utf8');

// These functions become readable inline source in the downloadable HTML.
// Keep all data and runtime code inside each HTML so file:// needs no fetch.
function labRuntime() {
  'use strict';
  function normalizeRows(rows) {
    if (!Array.isArray(rows)) throw new Error('데이터 목록이 배열이 아닙니다.');
    return rows.map((row, index) => {
      if (!row || typeof row.name !== 'string' || typeof row.address !== 'string') throw new Error('이름과 주소가 없는 기록이 있습니다.');
      return { ...row, id: `library-${index + 1}`, district: row.address.match(/(기흥구|수지구|처인구)/)?.[1] || '미분류' };
    });
  }
  function searchLibraries(rows, query = '', district = 'all', savedOnly = false, saved = new Set()) {
    const term = query.trim().toLocaleLowerCase('ko-KR');
    return rows.filter(row => (district === 'all' || row.district === district)
      && (!term || `${row.name} ${row.address}`.toLocaleLowerCase('ko-KR').includes(term))
      && (!savedOnly || saved.has(row.id)));
  }

  /* FEATURES_PLACEHOLDER */

  globalThis.LibraryLab = { normalizeRows, searchLibraries, restoreSaved, commitSaved };
  if (typeof document === 'undefined') return;
  const snapshot = JSON.parse(document.querySelector('#library-data').textContent);
  const rows = normalizeRows(snapshot.rows);
  const key = 'make-for-good-library-lab-v1';
  const state = { query: '', district: 'all', savedOnly: false, saved: new Set(), dataError: false, storageError: false };
  const $ = selector => document.querySelector(selector);
  const results = $('#results');
  let storage;
  try { storage = globalThis.localStorage; } catch { storage = null; }
  const restored = restoreSaved(storage, key, new Set(rows.map(row => row.id)));
  state.saved = restored.saved;

  function element(tag, content, className = '') {
    const node = document.createElement(tag);
    node.textContent = content;
    if (className) node.className = className;
    return node;
  }
  function announce(message, failed = false) {
    const notice = $('#notice');
    notice.textContent = message;
    notice.dataset.kind = failed ? 'error' : 'info';
  }
  function resetFilters() {
    state.query = ''; state.district = 'all'; state.savedOnly = false;
    $('#query').value = ''; $('#district').value = 'all'; $('#saved-only').checked = false;
    render(); $('#query').focus();
    announce('검색 조건을 초기화했습니다. 저장한 후보는 유지합니다.');
  }
  function saveCandidate(id) {
    const next = commitSaved(state.saved, id, storage, key, state.storageError);
    if (!next.ok) { announce(next.message, true); return; }
    state.saved = next.saved;
    announce(state.saved.has(id) ? '이 브라우저에 후보를 저장했습니다. 서버 제출과는 별개입니다.' : '저장한 후보에서 해제했습니다.');
    render();
  }
  function render() {
    $('#saved-count').textContent = String(state.saved.size);
    results.replaceChildren();
    if (FEATURES.failure && state.dataError) {
      $('#result-count').textContent = '데이터 읽기 실패 · 실습용 모킹';
      const box = element('section', '', 'empty error');
      box.setAttribute('role', 'alert');
      box.append(element('h2', '목록을 읽지 못했습니다.'), element('p', '학생이 실행한 읽기 실패 모킹입니다. 검색 조건과 저장한 후보는 유지합니다.'));
      const retry = element('button', '다시 시도하기');
      retry.type = 'button';
      retry.onclick = () => { state.dataError = false; $('#simulate-error').setAttribute('aria-pressed', 'false'); render(); announce('실패 모킹을 해제하고 기존 조건으로 돌아왔습니다.'); };
      box.append(retry); results.append(box); return;
    }
    const filtered = searchLibraries(rows, state.query, state.district, state.savedOnly, state.saved);
    $('#result-count').textContent = `${filtered.length}개 결과 / 전체 ${rows.length}개 기록`;
    if (!filtered.length) {
      const box = element('section', '', 'empty');
      box.append(element('h2', '조건에 맞는 도서관이 없습니다.'), element('p', '검색이 정상적으로 끝났지만 일치하는 기록이 0개입니다. 데이터 읽기 실패와는 다릅니다.'));
      emptyRecovery(box, element, resetFilters); results.append(box); return;
    }
    for (const row of filtered) {
      const card = element('article', '', 'library');
      card.append(element('span', `${row.district} · ${row.type}`, 'eyebrow'), element('h2', row.name), element('p', row.address, 'address'));
      card.append(element('p', `기준일의 총 좌석 규모 ${row.totalSeats}석`, 'small'));
      card.append(element('p', `기록 기준일 ${row.referenceDate}`, 'small'));
      const button = element('button', FEATURES.save ? (state.saved.has(row.id) ? '저장됨 · 해제하기' : '후보로 저장') : '후보 저장 · TODO-2', 'save');
      button.type = 'button'; button.disabled = !FEATURES.save;
      button.setAttribute('aria-pressed', String(state.saved.has(row.id)));
      button.setAttribute('aria-label', `${row.name} ${FEATURES.save ? '후보 저장 전환' : '후보 저장 미구현'}`);
      button.onclick = () => saveCandidate(row.id);
      card.append(button); results.append(card);
    }
  }
  $('#search-form').onsubmit = event => { event.preventDefault(); state.query = $('#query').value; render(); };
  $('#query').oninput = event => { state.query = event.target.value; render(); };
  $('#district').onchange = event => { state.district = event.target.value; render(); };
  $('#saved-only').disabled = !FEATURES.save;
  $('#saved-only').onchange = event => { state.savedOnly = event.target.checked; render(); };
  $('#reset').disabled = !FEATURES.empty;
  $('#reset').onclick = resetFilters;
  $('#simulate-error').disabled = !FEATURES.failure;
  $('#simulate-error').onclick = () => { state.dataError = !state.dataError; $('#simulate-error').setAttribute('aria-pressed', String(state.dataError)); render(); };
  $('#simulate-save-error').disabled = !FEATURES.save;
  $('#simulate-save-error').onchange = event => { state.storageError = event.target.checked; announce(state.storageError ? '저장 실패 모킹을 켰습니다. 저장 버튼을 눌러 실패 상태를 확인합니다.' : '저장 실패 모킹을 해제했습니다. 다시 저장할 수 있습니다.'); };
  $('#run-checks').onclick = () => {
    const checks = [
      ['공백 검색', searchLibraries(rows, '   ').length, 27],
      ['포곡 검색', searchLibraries(rows, '포곡').length, 1],
      ['기흥구', searchLibraries(rows, '', '기흥구').length, 9],
      ['수지구', searchLibraries(rows, '', '수지구').length, 8],
      ['처인구', searchLibraries(rows, '', '처인구').length, 10],
      ['포곡 + 기흥구', searchLibraries(rows, '포곡', '기흥구').length, 0]
    ];
    $('#check-output').textContent = checks.map(([name, actual, expected]) => `${actual === expected ? '통과' : '실패'} · ${name}: 기대 ${expected}개 / 실제 ${actual}개`).join('\n') + '\n확인 범위: 순수 필터 함수입니다. 화면 조작·저장·사용자 관찰은 별도 단계에서 확인합니다.';
  };
  render();
  if (FEATURES.save && restored.problem) announce(restored.problem, true);
}

// Session 2 uses these exact global names and DOM IDs. This source is emitted
// without an IIFE so the lecture's console examples can call the functions.
function session2Runtime() {
  'use strict';
  let libraryRows = [];
  let currentSource = 'embedded';
  let loadSequence = 0;

  function normalizeLibraries(input) {
    if (!Array.isArray(input)) throw new Error('rows 배열이 필요합니다.');
    return input.map(row => {
      if (!row || typeof row.name !== 'string' || typeof row.address !== 'string') throw new Error('이름과 주소 형식을 확인하세요.');
      return { ...row, district: row.address.match(/(기흥구|수지구|처인구)/)?.[1] ?? '기타' };
    });
  }

  // STEP-1: s2-14/16/17. 이 함수는 전달받은 목록을 화면에 표시합니다.
  // 콘솔: renderLibraries((await loadLibraries()).slice(0, 1))
  // 콘솔: renderLibraries([])
  function renderLibraries(items) {
    const host = document.querySelector('#library-results');
    host.replaceChildren();
    for (const row of items) {
      const card = document.createElement('article'); card.className = 'library';
      const title = document.createElement('h3'); title.textContent = row.name;
      const address = document.createElement('p'); address.textContent = row.address;
      const date = document.createElement('small'); date.textContent = `기준일 ${row.referenceDate}`;
      card.append(title, address, date); host.append(card);
    }
    document.querySelector('#result-count').textContent = `${items.length}개 도서관`;
    if (!items.length) {
      const empty = document.createElement('section'); empty.className = 'empty';
      const message = document.createElement('p'); message.textContent = '검색은 정상적으로 끝났지만 결과가 없습니다. 조건을 초기화할 수 있습니다.';
      const reset = document.createElement('button'); reset.type = 'button'; reset.textContent = '검색 조건 초기화'; reset.onclick = resetLibraryFilters;
      empty.append(message, reset); host.append(empty);
    }
  }

  // STEP-2: s2-22/25. 기본은 내장 JSON이며 HTTP 주소를 명시하면 fetch합니다.
  // HTTP에서: const rows = await loadLibraries('./data/libraries.json')
  // 읽기/JSON/필수 필드 오류는 reject하며 빈 결과 []로 바꾸지 않습니다.
  async function loadLibraries(source = null) {
    let data;
    if (source === null) {
      data = globalThis.LAB_SNAPSHOT ?? JSON.parse(document.querySelector('#library-data').textContent);
    } else {
      if (typeof location !== 'undefined' && location.protocol === 'file:') throw new Error('별도 JSON fetch는 로컬 HTTP 서버에서 실행하세요. 내장 JSON은 파일 실행에서도 사용할 수 있습니다.');
      const response = await fetch(source);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${source}`);
      data = await response.json();
    }
    return normalizeLibraries(data.rows);
  }

  // s2-26/27/29와 같은 객체형 Query 계약입니다. 원본 배열을 바꾸지 않습니다.
  function searchLibraries(input, { q = '', district = '' } = {}) {
    const term = q.trim().toLowerCase();
    return input.filter(row => {
      const text = `${row.name} ${row.address}`.toLowerCase();
      return (!term || text.includes(term)) && (!district || row.district === district);
    });
  }

  function setSearchDisabled(disabled) {
    for (const selector of ['#library-query', '#library-district', '#reset', '#search-form button[type=submit]']) {
      document.querySelector(selector).disabled = disabled;
    }
  }
  function showLoadError(error) {
    setSearchDisabled(true);
    const host = document.querySelector('#library-results'); host.replaceChildren();
    document.querySelector('#result-count').textContent = '자료 읽기 실패';
    const box = document.createElement('section'); box.className = 'empty error'; box.setAttribute('role', 'alert');
    const message = document.createElement('p'); message.textContent = error.message;
    const retry = document.createElement('button'); retry.type = 'button'; retry.textContent = '정상 내장 데이터로 복귀';
    retry.onclick = () => { document.querySelector('#data-source').value = 'embedded'; currentSource = 'embedded'; loadAndRender(); };
    box.append(message, retry); host.append(box);
  }

  // STEP-3: s2-34/35. 입력 → 검색 규칙 → 화면으로 연결합니다.
  function update() {
    renderLibraries(searchLibraries(libraryRows, {
      q: document.querySelector('#library-query').value,
      district: document.querySelector('#library-district').value
    }));
  }
  function resetLibraryFilters() {
    document.querySelector('#library-query').value = '';
    document.querySelector('#library-district').value = '';
    update(); document.querySelector('#library-query').focus();
  }
  async function loadAndRender() {
    const sequence = ++loadSequence;
    setSearchDisabled(true);
    document.querySelector('#result-count').textContent = '자료를 읽는 중입니다.';
    document.querySelector('#library-results').replaceChildren();
    try {
      const loaded = await loadLibraries(currentSource === 'embedded' ? null : currentSource);
      if (sequence !== loadSequence) return;
      libraryRows = loaded; setSearchDisabled(false); update();
    } catch (error) {
      if (sequence !== loadSequence) return;
      showLoadError(error);
    }
  }
  if (typeof document !== 'undefined') {
    document.querySelector('#library-query').addEventListener('input', update);
    document.querySelector('#library-district').addEventListener('change', update);
    document.querySelector('#search-form').onsubmit = event => { event.preventDefault(); update(); };
    document.querySelector('#reset').onclick = resetLibraryFilters;
    document.querySelector('#load-data').onclick = () => {
      currentSource = document.querySelector('#data-source').value === 'embedded' ? 'embedded' : document.querySelector('#data-path').value.trim();
      loadAndRender();
    };
    document.querySelector('#show-one').onclick = async () => {
      const example = (await loadLibraries()).find(row => row.name === '포곡도서관');
      renderLibraries([example]);
    };
    document.querySelector('#show-empty').onclick = () => renderLibraries([]);
    document.querySelector('#show-error').onclick = () => showLoadError(new Error('학생이 실행한 읽기 실패 모킹입니다.'));
    document.querySelector('#show-connected').onclick = () => { currentSource = 'embedded'; document.querySelector('#data-source').value = 'embedded'; resetLibraryFilters(); loadAndRender(); };
    loadAndRender();
  }
}

const starterFeatures = `// TODO-1: emptyRecovery에 초기화 버튼을 추가하고 empty를 true로 바꾸십시오.
  // TODO-2: restoreSaved/commitSaved를 구현한 뒤 save를 true로 바꾸십시오.
  // TODO-3: 정상·빈 결과·실패를 구분한 뒤 failure를 true로 바꾸어 시연하십시오.
  const FEATURES = { empty: false, save: false, failure: false };
  function emptyRecovery(container, element, resetFilters) {
    container.append(element('p', 'TODO-1: 여기에 검색 조건 초기화 버튼을 추가합니다. 지금은 입력과 지역을 직접 바꿀 수 있습니다.', 'todo'));
  }
  function restoreSaved(storage, key, allowedIds) {
    // TODO-2A: localStorage 값을 읽고 JSON 파싱 실패·알 수 없는 ID를 처리하십시오.
    return { saved: new Set(), problem: '' };
  }
  function commitSaved(previous, id, storage, key, forceError) {
    // TODO-2B: 중복 없는 후보 목록을 만들고, 저장 성공 후에만 화면 상태를 갱신하십시오.
    // forceError가 true이면 오류를 반환해야 합니다. 원래 Set을 직접 수정하지 마십시오.
    return { ok: false, saved: previous, message: 'TODO-2: 후보 저장 구현 단계입니다.' };
  }`;

const solutionFeatures = `const FEATURES = { empty: true, save: true, failure: true };
  function emptyRecovery(container, element, resetFilters) {
    const button = element('button', '검색 조건 초기화');
    button.type = 'button'; button.onclick = resetFilters; container.append(button);
  }
  function restoreSaved(storage, key, allowedIds) {
    try {
      if (!storage) throw new Error('storage unavailable');
      const raw = storage.getItem(key);
      const parsed = raw === null ? [] : JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.some(id => typeof id !== 'string')) throw new Error('invalid saved data');
      return { saved: new Set(parsed.filter(id => allowedIds.has(id))), problem: '' };
    } catch {
      return { saved: new Set(), problem: '저장한 후보를 읽지 못했습니다. 새 후보 저장을 시도하거나 후보 이름을 따로 기록하세요. 브라우저의 파일 저장 정책을 확인할 수 있습니다.' };
    }
  }
  function commitSaved(previous, id, storage, key, forceError = false) {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    try {
      if (forceError) throw new Error('simulated storage failure');
      if (!storage) throw new Error('storage unavailable');
      storage.setItem(key, JSON.stringify([...next]));
      return { ok: true, saved: next, message: '' };
    } catch {
      return { ok: false, saved: previous, message: forceError ? '실습용 저장 실패 모킹입니다. 기존 후보 목록을 유지합니다. 모킹을 끈 뒤 다시 시도하세요.' : '브라우저 저장 실패 상태입니다. 기존 후보 목록을 유지합니다. 저장 허용 설정을 확인하거나 후보 이름을 따로 기록하세요.' };
    }
  }`;

const css = `:root{--paper:#f4f3ed;--surface:#fffef9;--ink:#203d35;--muted:#56665e;--line:#ccd5cb;--accent:#175d43;--soft:#e5eee3;--error:#9b3229}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif;font-size:16px;line-height:1.65}main{max-width:1140px;margin:auto;padding:40px 24px 64px}a{color:var(--accent);text-underline-offset:4px}h1,h2,p{margin:0}h1{font-size:clamp(30px,5vw,50px);line-height:1.2;margin:16px 0}h2{font-size:21px;line-height:1.4}button,input,select{font:inherit}button{border:1px solid var(--accent);background:var(--accent);color:white;padding:10px 16px;border-radius:4px;cursor:pointer}button.secondary{background:transparent;color:var(--accent)}button:disabled{cursor:not-allowed;background:#e4e7df;border-color:#c8cec4;color:#59655e}button[aria-pressed=true]{background:#dfebdd;color:var(--accent)}:focus-visible{outline:3px solid #b25f18;outline-offset:4px}input:not([type=checkbox]),select{width:100%;padding:10px 12px;background:var(--surface);border:1px solid #7e9185;border-radius:4px;color:var(--ink)}header{padding-bottom:28px;border-bottom:1px solid var(--line)}.eyebrow{font-size:12px;letter-spacing:1px;font-weight:700;color:var(--muted)}.intro{max-width:800px}.source{margin-top:20px;font-size:14px}.source a{margin-right:16px}.notice{min-height:28px;margin:16px 0;color:var(--accent);font-size:14px}.notice[data-kind=error]{color:var(--error)}details{margin:24px 0;border:1px solid var(--line);background:var(--surface);padding:16px 20px}summary{font-weight:700;cursor:pointer}.tasks{padding-left:22px}.tasks li{margin:10px 0}.filters{display:grid;grid-template-columns:2fr 1fr auto;gap:16px;align-items:end;margin:28px 0 16px}.field{display:flex;flex-direction:column;gap:6px;font-weight:600}.actions{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin:16px 0}.result-heading{display:flex;justify-content:space-between;gap:16px;align-items:center;margin:32px 0 16px}.results{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.library{padding:24px;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;gap:12px;min-width:0}.library h2{font-size:20px}.address{flex:1}.small{font-size:13px;color:var(--muted)}.save{margin-top:4px}.empty{grid-column:1/-1;padding:36px;border:1px dashed #85998a;background:var(--surface)}.empty p{margin:16px 0;max-width:720px}.error{border-color:var(--error)}.todo{color:#805011}.mock{padding:16px 20px;background:#ece9de;border-left:3px solid #8b7245}.mock p{font-size:14px;margin-bottom:12px}.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;margin:20px 0;font-size:14px}th,td{text-align:left;vertical-align:top;border-bottom:1px solid var(--line);padding:10px 12px}pre{white-space:pre-wrap;background:var(--soft);padding:16px;font-size:14px}footer{margin-top:40px;padding-top:24px;border-top:1px solid var(--line);font-size:13px;color:var(--muted)}@media(max-width:760px){.filters{grid-template-columns:1fr}.results{grid-template-columns:1fr}.result-heading{align-items:flex-start;flex-direction:column}main{padding:24px 16px 40px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}`;

function createHtml(edition, runtime) {
  const solution = edition === 'solution';
  const label = solution ? '완성 예제' : '실습 시작 파일';
  const tasks = solution
    ? '<li>검색어 <b>포곡</b>은 1개, <b>기흥구</b> 필터는 9개, 두 조건을 함께 쓰면 0개입니다.</li><li>0개 결과에서 조건을 초기화하면 27개 기록으로 돌아옵니다. 저장한 후보는 유지합니다.</li><li>후보 저장 → 저장한 후보만 보기 → 새로고침으로 저장 상태를 확인합니다.</li><li>읽기 실패와 저장 실패 모킹을 각각 켜서 안내와 복귀를 확인합니다.</li>'
    : '<li><b>TODO-1 · 빈 결과 복귀:</b> 0개 결과에 초기화 버튼을 추가하고 입력과 결과가 함께 돌아오는지 확인합니다.</li><li><b>TODO-2 · 후보 저장:</b> 저장·해제·다시 열기를 구현합니다. 저장 성공·실패 상태를 구분해 표시합니다.</li><li><b>TODO-3 · 실패와 복귀:</b> 읽기 실패 모킹을 켜고 기존 검색 조건을 유지한 채 복귀하는지 확인합니다.</li><li>HTML 아래쪽의 <code>FEATURES</code>와 각 TODO 주석을 찾습니다. 검색과 지역 필터는 이미 동작합니다.</li>';
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>도서관 찾기 · ${label}</title><style>${css}</style></head>
<body><main><header><p class="eyebrow">MAKE FOR GOOD / LIBRARY LAB / ${solution ? 'SOLUTION' : 'STARTER'}</p><h1>다음에 갈 도서관을<br>찾고, 후보로 남깁니다.</h1><p class="intro">${label}입니다. 실제 공개데이터 27개를 이 HTML에 넣었습니다. 다운로드 후 파일을 열면 인터넷이나 API 키 없이 검색을 시작할 수 있습니다.</p><div class="source"><a href="https://www.data.go.kr/data/15013109/standard.do" target="_blank" rel="noopener noreferrer">공공데이터포털 원본</a><a href="https://lib.yongin.go.kr/" target="_blank" rel="noopener noreferrer">방문 전 공식 운영 정보 확인</a><p>기록 기준일 <b>2024-11-20</b> · 수집일 <b>2026-10-22</b> · 제공기관 경기도 용인시</p><p>교육용 스냅샷 · 총 좌석 수는 기준일의 좌석 규모입니다. 실시간 잔여 좌석은 추가 확인 항목입니다. 현재 개관 여부는 공식 운영 안내에서 확인합니다.</p></div></header>
<details open><summary>${solution ? '완성 조건을 직접 확인합니다' : '이번 실습에서 구현할 부분'}</summary><ol class="tasks">${tasks}</ol><p class="small">시작 파일은 미완성 부분을 표시한 학습 자료입니다. 완성 예제의 코드와 비교하기 전에 자신의 기대 결과를 먼저 적습니다.</p></details>
<form id="search-form" class="filters"><label class="field"><span>도서관 이름 또는 주소</span><input id="query" type="search" placeholder="예: 포곡, 수지구" autocomplete="off"></label><label class="field"><span>지역</span><select id="district"><option value="all">용인시 전체</option><option value="기흥구">기흥구</option><option value="수지구">수지구</option><option value="처인구">처인구</option></select></label><button type="submit">검색</button></form>
<div class="actions"><button type="button" id="reset" class="secondary">검색 조건 초기화${solution ? '' : ' · TODO-1'}</button><label><input type="checkbox" id="saved-only"> 저장한 후보만 보기 (<span id="saved-count">0</span>)</label></div>
<div class="mock"><p><b>실습용 실패 모킹</b> · 학생이 조건을 선택해 오류 안내와 복구 동작을 확인합니다.</p><div class="actions"><button type="button" class="secondary" id="simulate-error" aria-pressed="false">읽기 실패 켜기 / 해제${solution ? '' : ' · TODO-3'}</button><label><input type="checkbox" id="simulate-save-error"> 저장 실패 모킹</label></div></div>
<p id="notice" class="notice" role="status" aria-live="polite"></p><div class="result-heading"><h2>도서관 후보</h2><p id="result-count" role="status" aria-live="polite"></p></div><section id="results" class="results" aria-label="검색 결과"></section>
<details><summary>성공 조건과 실행 기록 예시</summary><div class="table-wrap"><table><thead><tr><th>시작 상태와 행동</th><th>기대 결과</th><th>남길 근거</th></tr></thead><tbody><tr><td>전체 / 공백 검색</td><td>27개</td><td>검색 입력과 결과 수 화면</td></tr><tr><td>기흥구 / 수지구 / 처인구</td><td>9개 / 8개 / 10개</td><td>각 지역 필터와 결과 수</td></tr><tr><td>포곡 + 기흥구</td><td>0개 안내와 조건 초기화</td><td>초기화 전후 화면</td></tr><tr><td>후보 저장 후 다시 열기</td><td>저장됨 표시와 저장한 후보 수 유지</td><td>브라우저·file/HTTP 환경 기록</td></tr><tr><td>읽기 실패 모킹 → 다시 시도</td><td>오류 안내 후 이전 검색 조건으로 복귀</td><td>모킹임을 명시한 실행표</td></tr><tr><td>저장 실패 모킹 → 후보 저장</td><td>실패 안내와 기존 후보 상태 유지</td><td>오류 전후 후보 수</td></tr></tbody></table></div><button type="button" id="run-checks" class="secondary">필터 규칙 검사</button><pre id="check-output" aria-live="polite">버튼을 누르면 현재 코드의 순수 필터 함수를 검사합니다. 빈 결과 복귀·저장·실패 화면은 직접 조작해 확인합니다.</pre></details>
<footer><p>출처: 전국도서관표준데이터에서 경기도 용인시 27개 기록 추출. 이용허락범위 제한 없음은 해당 제공기관 상세정보에서 확인했습니다. 가상 사용자·실패 조건은 교육용 모킹이며 실제 사용자의 반응과 구분해 기록합니다.</p><p>파일 저장이 제한된 브라우저에서는 후보를 별도로 기록하거나 GUIDE.md의 로컬 서버 방법을 사용합니다. 후보는 현재 브라우저에 저장하고, 과제는 강의 홈페이지의 해당 회차에서 별도로 제출합니다.</p></footer></main>
<script id="library-data" type="application/json">${JSON.stringify(snapshot).replaceAll('<', '\\u003c')}</script>
<script>${runtime}</script></body></html>\n`;
}

function createModuleHtml(runtime) {
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>2회차 · 로드·검색·표시 연결 예제</title><style>${css}</style></head><body><main>
<header><p class="eyebrow">MAKE FOR GOOD / SESSION 02 / CONNECTED EXAMPLE</p><h1>로드·검색·표시를<br>같은 코드로 연결합니다.</h1><p class="intro">2회차 s2-17·25·34에서 사용하는 실행 파일입니다. 세 함수와 DOM 이름이 슬라이드와 같습니다. 기본 내장 JSON은 파일을 열어도 동작하고, HTTP JSON은 로컬 서버에서 명시적으로 선택합니다.</p><div class="source"><a href="https://www.data.go.kr/data/15013109/standard.do" target="_blank" rel="noopener noreferrer">공공데이터포털 원본</a><p>용인시 27개 · 기록 기준일 2024-11-20 · 수집일 2026-10-22</p><p>총 좌석 수는 기준일의 좌석 규모입니다. 실시간 잔여 좌석은 추가 확인 항목입니다. 현재 개관 여부는 공식 운영 안내에서 확인합니다. <a href="https://lib.yongin.go.kr/" target="_blank" rel="noopener noreferrer">방문 전 공식 정보 확인</a></p></div></header>
<details open><summary>단계별 중간 점검</summary><ol class="tasks"><li><b>STEP-1 표시 · s2-17:</b> 아래 “실제 기록 1개”와 “빈 배열”을 누릅니다. <code>renderLibraries(items)</code>의 결과를 확인하고 안내 문구를 수정합니다.</li><li><b>STEP-2 로드 · s2-25:</b> 내장 JSON으로 27개를 확인합니다. 로컬 서버에서는 HTTP JSON을 선택하고 <code>./data/libraries.json</code>을 불러옵니다. 경로를 <code>./data/missing.json</code>으로 바꾸면 실제 404입니다.</li><li><b>STEP-3 연결 · s2-34:</b> 전체 연결로 돌아온 뒤 포곡 1개, 기흥구 9개, 포곡+기흥구 0개와 초기화 27개를 확인합니다. 함수 정의는 이 HTML의 STEP 주석에서 찾습니다.</li></ol><p class="small">이 파일은 세 함수를 연결한 최소 완성 예제입니다. 3회차의 후보 저장 TODO는 별도 starter.html을 사용합니다.</p><div class="actions"><button type="button" id="show-one" class="secondary">실제 기록 1개</button><button type="button" id="show-empty" class="secondary">빈 배열 표시</button><button type="button" id="show-error" class="secondary">읽기 실패 모킹</button><button type="button" id="show-connected">전체 연결로 돌아오기</button></div></details>
<div class="filters"><label class="field"><span>데이터 읽기 방식</span><select id="data-source"><option value="embedded">내장 JSON · 파일 실행 가능</option><option value="http">HTTP JSON · 로컬 서버 필요</option></select></label><label class="field"><span>HTTP JSON 경로</span><input id="data-path" value="./data/libraries.json"></label><button type="button" id="load-data">자료 불러오기</button></div>
<form id="search-form" class="filters"><label class="field" for="library-query"><span>이름·주소 검색</span><input id="library-query" type="search" autocomplete="off"></label><label class="field" for="library-district"><span>지역</span><select id="library-district"><option value="">전체</option><option>기흥구</option><option>수지구</option><option>처인구</option></select></label><button type="submit">검색</button></form><button id="reset" type="button" class="secondary">검색 조건 초기화</button>
<div class="result-heading"><h2>연결 결과</h2><p id="result-count" role="status" aria-live="polite"></p></div><section id="library-results" class="results" aria-label="도서관 검색 결과"></section>
<details><summary>슬라이드와 같은 콘솔 실행 계약</summary><pre>const rows = await loadLibraries();
renderLibraries(rows.slice(0, 1));
renderLibraries([]);
renderLibraries(searchLibraries(rows, { q: ' 포곡 ' }));
console.assert(searchLibraries(rows, { district: '기흥구' }).length === 9);
console.assert(searchLibraries(rows, { q: '포곡', district: '기흥구' }).length === 0);
// 전체 입력 연결로 돌아가려면 위의 “전체 연결로 돌아오기”를 누릅니다.</pre><p class="small">같은 콘솔에서 const rows를 다시 선언할 수 없으면 다른 변수명을 쓰거나 페이지를 새로고침합니다. 라이브러리와 설치가 필요 없는 일반 JavaScript입니다.</p></details>
<footer><p>직접 만든 모킹과 실제 HTTP 오류를 구분해 기록합니다. 코드 조각은 이 파일의 콘솔에서 실행합니다. 데이터와 코드가 모두 내장되어 있으며 외부 파일 읽기는 HTTP 방식을 선택할 때만 수행합니다.</p></footer></main>
<script id="library-data" type="application/json">${JSON.stringify(snapshot).replaceAll('<', '\\u003c')}</script><script>${runtime}</script></body></html>\n`;
}

function makeZip(entries) {
  // ZIP STORE format: byte-for-byte file copies, no external package or tool.
  const localParts = [], directoryParts = [];
  let offset = 0;
  for (const [filename, input] of entries) {
    const name = Buffer.from(filename), data = Buffer.isBuffer(input) ? input : Buffer.from(input);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(33, 12); local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(name.length, 26);
    localParts.push(local, name, data);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(33, 14); central.writeUInt32LE(crc, 16); central.writeUInt32LE(data.length, 20); central.writeUInt32LE(data.length, 24); central.writeUInt16LE(name.length, 28); central.writeUInt32LE(offset, 42);
    directoryParts.push(central, name); offset += local.length + name.length + data.length;
  }
  const directory = Buffer.concat(directoryParts), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, directory, end]);
}

await mkdir(out, { recursive: true });
await mkdir(join(out, 'data'), { recursive: true });
await writeFile(join(out, 'data/libraries.json'), snapshotSource);
const hashes = {};
const moduleFunction = session2Runtime.toString();
const moduleRuntime = moduleFunction.slice(moduleFunction.indexOf('{') + 1, moduleFunction.lastIndexOf('}'));
const moduleHtml = createModuleHtml(moduleRuntime);
await writeFile(join(out, 'module-example.html'), moduleHtml);
hashes['/labs/module-example.html'] = [`sha256-${createHash('sha256').update(moduleRuntime).digest('base64')}`];
const moduleContext = vm.createContext({ LAB_SNAPSHOT: snapshot });
vm.runInContext(moduleRuntime, moduleContext, { timeout: 1000 });
const moduleRows = await moduleContext.loadLibraries();
assert.equal(moduleRows.length, 27);
moduleContext.testRows = moduleRows;
vm.runInContext('const rows = testRows; const names = q => searchLibraries(rows, q).map(row => row.name);', moduleContext);
assert.equal(vm.runInContext('names({q:" 포곡 "})[0]', moduleContext), '포곡도서관');
assert.equal(moduleContext.searchLibraries(moduleRows, { q: ' 포곡 ' })[0].name, '포곡도서관');
for (const [district, expected] of [['기흥구', 9], ['수지구', 8], ['처인구', 10]]) assert.equal(moduleContext.searchLibraries(moduleRows, { district }).length, expected);
assert.equal(moduleContext.searchLibraries(moduleRows, { q: '포곡', district: '기흥구' }).length, 0);
assert.equal(moduleRows.length, 27);
moduleContext.fetch = async () => ({ ok: true, json: async () => snapshot });
assert.equal((await moduleContext.loadLibraries('./data/libraries.json')).length, 27);
moduleContext.fetch = async () => ({ ok: false, status: 404 });
await assert.rejects(moduleContext.loadLibraries('./data/missing.json'), /HTTP 404/);
moduleContext.fetch = async () => ({ ok: true, json: async () => ({ rows: 'invalid' }) });
await assert.rejects(moduleContext.loadLibraries('./data/libraries.json'), /rows/);
function stubNode() { return { textContent: '', children: [], replaceChildren() { this.children = []; }, append(...nodes) { this.children.push(...nodes); }, setAttribute() {}, focus() {}, value: '' }; }
const moduleHost = stubNode(), moduleCount = stubNode();
const moduleNodes = new Map([['#library-results',moduleHost],['#result-count',moduleCount]]);
moduleContext.document = { querySelector: selector => { if (!moduleNodes.has(selector)) moduleNodes.set(selector,stubNode()); return moduleNodes.get(selector); }, createElement: stubNode };
moduleContext.renderLibraries(moduleRows.slice(0, 1));
assert.equal(moduleHost.children.length, 1); assert.equal(moduleCount.textContent, '1개 도서관');
moduleContext.renderLibraries([]);
assert.equal(moduleCount.textContent, '0개 도서관'); assert.equal(moduleHost.children[0].children[1].textContent, '검색 조건 초기화');
moduleContext.showLoadError(new Error('test-only error'));
assert.equal(moduleCount.textContent, '자료 읽기 실패');
for (const selector of ['#library-query','#library-district','#reset','#search-form button[type=submit]']) assert.equal(moduleNodes.get(selector).disabled, true);
await moduleContext.loadAndRender();
assert.equal(moduleCount.textContent, '27개 도서관');
for (const selector of ['#library-query','#library-district','#reset','#search-form button[type=submit]']) assert.equal(moduleNodes.get(selector).disabled, false);
console.log(`module-example.html: lecture API/console/embedded+HTTP loader/object query/404/DOM contract checks passed; CSP ${hashes['/labs/module-example.html'][0]}`);
for (const edition of ['starter', 'solution']) {
  const runtime = `(${labRuntime.toString().replace('/* FEATURES_PLACEHOLDER */', edition === 'starter' ? starterFeatures : solutionFeatures)})();`;
  const html = createHtml(edition, runtime);
  const filename = `${edition}.html`;
  await writeFile(join(out, filename), html);
  await writeFile(join(out, `${edition}.zip`), makeZip([[filename, html], ['module-example.html', moduleHtml], ['GUIDE.md', guide], ['data/libraries.json', snapshotSource]]));
  hashes[`/labs/${filename}`] = [`sha256-${createHash('sha256').update(runtime).digest('base64')}`];

  const context = vm.createContext({});
  vm.runInContext(runtime, context, { timeout: 1000 });
  const { normalizeRows, searchLibraries, restoreSaved, commitSaved } = context.LibraryLab;
  const rows = normalizeRows(snapshot.rows);
  assert.equal(new Set(rows.map(x => x.id)).size, 27);
  assert.equal(searchLibraries(rows, '   ').length, 27);
  assert.equal(searchLibraries(rows, ' 포곡 ').length, 1);
  for (const [district, expected] of [['기흥구', 9], ['수지구', 8], ['처인구', 10]]) assert.equal(searchLibraries(rows, '', district).length, expected);
  assert.equal(searchLibraries(rows, '포곡', '기흥구').length, 0);
  assert.throws(() => normalizeRows([{ name: '잘못된 기록' }]));
  if (edition === 'solution') {
    const memory = new Map();
    const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
    const allowed = new Set(rows.map(row => row.id));
    const saved = commitSaved(new Set(), rows[0].id, storage, 'test');
    assert.equal(saved.ok, true); assert.equal(saved.saved.size, 1);
    assert.equal(restoreSaved(storage, 'test', allowed).saved.size, 1);
    assert.equal(searchLibraries(rows, '', 'all', true, saved.saved).length, 1);
    const failed = commitSaved(saved.saved, rows[1].id, storage, 'test', true);
    assert.equal(failed.ok, false); assert.equal(failed.saved, saved.saved); assert.equal(restoreSaved(storage, 'test', allowed).saved.size, 1);
    const blocked = commitSaved(saved.saved, rows[1].id, { setItem() { throw new Error('blocked'); } }, 'test');
    assert.equal(blocked.ok, false); assert.equal(blocked.saved.size, 1);
    const removed = commitSaved(saved.saved, rows[0].id, storage, 'test');
    assert.equal(removed.saved.size, 0);
    storage.setItem('test', 'invalid JSON');
    assert.equal(restoreSaved(storage, 'test', allowed).saved.size, 0);
    assert.ok(restoreSaved(storage, 'test', allowed).problem);
  }
  console.log(`${filename}: snapshot/search/district/filter ${edition === 'solution' ? '/save/reload/failure' : ''} checks passed; CSP ${hashes[`/labs/${filename}`][0]}`);
}
await writeFile(join(root, 'lab-csp.json'), `${JSON.stringify(hashes, null, 2)}\n`);
console.log('실습 HTML 3개, ZIP 2개와 lab-csp.json을 생성했습니다.');
