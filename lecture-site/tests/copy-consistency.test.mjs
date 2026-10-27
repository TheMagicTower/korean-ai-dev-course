import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read = async path => JSON.parse(await readFile(path, 'utf8'));
const data = await read('content/slides.json');
const projection = (await read('content/presentation.json')).slides;
test('발표 제목과 목차·자습 제목이 일치합니다', () => {
  for (const slide of data.sessions.flatMap(session => session.slides)) {
    const displayed = {...slide, ...projection[slide.id]};
    assert.equal(displayed.title, slide.title, slide.id);
  }
});
test('빌드가 편집 원고의 제목과 설명을 보존합니다', async () => {
  for (const session of data.sessions) {
    const source = await read(`content/revision/session-${session.id}.json`);
    assert.equal(session.slides.length, source.slides.length);
    for (const [i, slide] of session.slides.entries()) {
      assert.deepEqual(slide, source.slides[i], slide.id);
    }
  }
});
