const assert=require('node:assert/strict'),m=require('./model.js');
const memory={raw:null,getItem(){return this.raw},setItem(k,v){this.raw=v}};
let jobs=m.add([],' 라이트랩 ',' 개발자 ','one');
assert.equal(jobs[0].company,'라이트랩');
m.save(memory,jobs);assert.deepEqual(m.load(memory),jobs);
for(const s of m.statuses){jobs=m.transition(jobs,'one',s);assert.equal(jobs[0].status,s);}
assert.throws(()=>m.add(jobs,' ','role','two'));
assert.throws(()=>m.transition(jobs,'missing','지원'));
assert.throws(()=>m.transition(jobs,'one','잘못된 상태'));
assert.throws(()=>m.validate([...jobs,...jobs]));
memory.raw='{broken';assert.throws(()=>m.load(memory));assert.equal(memory.raw,'{broken');
assert.throws(()=>m.save({setItem(){throw Error('quota')}},jobs));
assert.equal(jobs[0].status,'종료');
console.log('PASS: trim, persistence, states, blank input, unknown id/status, duplicate, corrupt storage preservation, save failure');
