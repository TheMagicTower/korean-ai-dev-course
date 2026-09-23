const assert=require('node:assert/strict'),M=require('./model.js'),seed=require('./data.json');
assert(M.valid(seed));assert.equal(M.issues(seed).length,0);
let s=structuredClone(seed);s.draft.claims[0].evidenceId='missing';assert.throws(()=>M.review(s,'approve'),/근거/);assert.throws(()=>M.publish(seed),/승인/);
s=M.review(seed,'approve');assert.equal(s.draft.reviewVersion,1);s=M.publish(s);assert.equal(s.editions.length,1);assert.equal(M.publish(s).editions.length,1);
assert.throws(()=>M.edit(s,'새 제목','요약'),/정정 이유/);let t=M.edit(s,'수정 제목',s.draft.summary,'제목 표현을 더 명확하게 변경');assert.equal(t.draft.status,'draft');assert.equal(t.draft.reviewVersion,null);assert.throws(()=>M.publish(t),/승인/);assert.equal(t.corrections[0].from,1);assert.equal(t.editions[0].article.title,s.draft.title);t=M.publish(M.review(t,'approve'));assert.equal(t.editions.length,2);assert.equal(M.publish(t).editions.length,2);assert.equal(t.corrections.length,1);
assert.equal(M.review(seed,'hold').draft.status,'held');assert.equal(seed.draft.status,'draft');assert.equal(M.valid({}),false);
console.log('PASS missing evidence; unapproved blocked; idempotent publication; revision invalidates approval; correction history; old edition immutable; hold; seed immutable; storage shape');
