// 실제 app.js를 실행하는 최소 DOM 포트 검사입니다. 브라우저 레이아웃 검사를 대신하지 않습니다.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),M=require('./model.js');
class Element{
 constructor(){this.children=[];this.listeners={};this.value='';this.hidden=true;this.disabled=false;this.checked=false;this.textContent='';}
 append(...xs){this.children.push(...xs)} replaceChildren(...xs){this.children=xs}
 setAttribute(){} addEventListener(name,fn){this.listeners[name]=fn} focus(){this.focused=true}
 click(){this.listeners.click?.({})}
}
const nodes={},get=id=>nodes[id]??=new Element();get('filter').value='all';
const fixture=[{id:'a',company:'테스트 회사',role:'개발자',status:'관심'}];
const storage={raw:JSON.stringify(fixture),fail:false,getItem(){return this.raw},setItem(k,v){if(this.fail)throw Error('quota');this.raw=v}};
const windowEvents={};
vm.runInNewContext(fs.readFileSync(__dirname+'/app.js','utf8'),{document:{getElementById:get,createElement:()=>new Element()},ApplyFlow:M,localStorage:storage,window:{confirm:()=>false,addEventListener:(n,fn)=>windowEvents[n]=fn},crypto:{},console});
const deleteButton=()=>get('jobs').children[0].children[1].children[2];
const before=storage.raw;
deleteButton().click();assert.equal(get('delete-confirmation').hidden,false);
assert.match(get('delete-target').textContent,/테스트 회사.*개발자/);
get('delete-cancel').click();assert.equal(storage.raw,before);assert.equal(get('delete-confirmation').hidden,true);
deleteButton().click();storage.fail=true;get('delete-confirm').click();assert.equal(storage.raw,before);assert.equal(Number(get('total').textContent),1);
storage.fail=false;get('delete-confirm').click();assert.deepEqual(JSON.parse(storage.raw),[]);assert.equal(Number(get('total').textContent),0);
// 외부 탭에서 대상이 사라지면 이전 확인을 사용할 수 없습니다.
storage.raw=before;windowEvents.storage({key:M.KEY});deleteButton().click();storage.raw='[]';windowEvents.storage({key:M.KEY});get('delete-confirm').click();assert.deepEqual(JSON.parse(storage.raw),[]);
console.log('PASS deletion UI: visible target, cancel unchanged, failed save preserved, confirm persisted, stale target invalidated');
(async()=>{
 // 파일을 읽는 동안 이전 텍스트를 검증·동의해도 새 내용 도착 시 동의를 폐기해야 합니다.
 const oldBackup=JSON.stringify({version:1,jobs:fixture});
 const newBackup=JSON.stringify({version:1,jobs:[{...fixture[0],id:'new',company:'새 회사'}]});
 get('backup-text').value=oldBackup;
 let resolveRead;
 get('backup-file').files=[{size:100,text:()=>new Promise(resolve=>{resolveRead=resolve})}];
 const reading=get('backup-file').listeners.change();
 get('preview').click();get('replace-confirm').checked=true;get('replace-confirm').listeners.change();
 assert.equal(get('replace').disabled,false);
 resolveRead(newBackup);await reading;
 assert.equal(get('backup-text').value,newBackup);
 assert.equal(get('import-preview').hidden,true,'새 파일 내용 도착 시 이전 미리보기 무효화');
 assert.equal(get('replace-confirm').checked,false,'새 파일 내용 도착 시 이전 동의 무효화');
 assert.equal(get('replace').disabled,true);
 const saved=storage.raw;get('replace').click();assert.equal(storage.raw,saved);
 get('preview').click();get('replace-confirm').checked=true;get('replace-confirm').listeners.change();get('replace').click();
 assert.equal(JSON.parse(storage.raw)[0].id,'new');
 console.log('PASS delayed file: stale preview/consent invalidated; replacement requires new preview and consent');
})().catch(error=>{console.error(error);process.exitCode=1});
