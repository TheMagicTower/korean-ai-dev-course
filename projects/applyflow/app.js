(()=>{
const $=id=>document.getElementById(id),M=ApplyFlow;let items=[],blocked=false,pending=null,fileRead=0,deleteId=null;
function message(s){$('message').textContent=s;}
try{items=M.load(localStorage);}catch{blocked=true;message('저장된 자료를 읽지 못했습니다. 원본을 덮어쓰지 않도록 편집을 중단했습니다. 브라우저 저장 권한과 원본 자료를 확인하세요.');}
function persist(next){if(blocked){message('원본 자료 확인 전에는 편집할 수 없습니다.');return false;}try{M.save(localStorage,next);items=next;clearPreview();clearDelete();render();message('이 브라우저에 저장했습니다. 새로고침해 유지되는지 확인해 보세요.');return true;}catch{message('저장하지 못했습니다. 이전 상태를 유지했습니다. 저장 권한이나 용량을 확인하세요.');render();return false;}}
function render(){
 $('total').textContent=items.length;$('active').textContent=items.filter(x=>['지원','면접'].includes(x.status)).length;$('success').textContent=items.filter(x=>x.status==='합격').length;
 $('jobs').replaceChildren();const visible=M.selectJobs(items,$('filter').value,$('query').value);
 $('empty').hidden=visible.length>0;$('empty').textContent=blocked?'자료를 읽지 못해 목록을 표시할 수 없습니다. 아래 오류 안내를 확인하세요.':items.length?'검색어와 상태에 맞는 공고가 없습니다. 검색어를 지우거나 다른 상태를 선택하세요.':'아직 저장한 공고가 없습니다. 첫 공고를 추가하거나 샘플로 시작하세요.';
 for(const x of visible){const row=document.createElement('article');row.className='job';const info=document.createElement('div'),title=document.createElement('h3'),role=document.createElement('p');title.textContent=x.company;role.textContent=x.role;info.append(title,role);const control=document.createElement('div'),label=document.createElement('label'),select=document.createElement('select');select.id='status-'+x.id;label.htmlFor=select.id;label.textContent='지원 상태';select.setAttribute('aria-label',x.company+' 지원 상태');for(const s of M.statuses){const o=document.createElement('option');o.value=s;o.textContent=s;select.append(o);}select.value=x.status;select.disabled=blocked;select.addEventListener('change',()=>persist(M.transition(items,x.id,select.value)));const del=document.createElement('button');del.type='button';del.className='danger';del.textContent='삭제';del.setAttribute('aria-label',x.company+' 공고 삭제');del.disabled=blocked;del.addEventListener('click',()=>{deleteId=x.id;$('delete-target').textContent=x.company+' · '+x.role;$('delete-confirmation').hidden=false;$('delete-cancel').focus();});control.append(label,select,del);row.append(info,control);$('jobs').append(row);}
 $('add').disabled=blocked;$('sample').disabled=blocked||items.length>0;$('export').disabled=blocked||items.length===0;$('preview').disabled=blocked;$('backup-file').disabled=blocked;$('backup-text').disabled=blocked;$('replace').disabled=blocked||!pending||!$('replace-confirm').checked;
}
$('job-form').addEventListener('submit',e=>{e.preventDefault();if(blocked)return;try{const next=M.add(items,$('company').value,$('role').value,crypto.randomUUID());if(persist(next))$('job-form').reset();}catch{message('회사·직무를 올바르게 입력해 주세요. 최대 200개까지 저장할 수 있습니다.');}});
$('sample').addEventListener('click',()=>{if(blocked||items.length)return;persist([{id:'sample-a',company:'라이트랩 (가상)',role:'프론트엔드 개발자',status:'관심'},{id:'sample-b',company:'모닝스튜디오 (가상)',role:'프로덕트 디자이너',status:'지원'},{id:'sample-c',company:'그린웨이브 (가상)',role:'서비스 기획자',status:'면접'}]);});
function clearDelete(){deleteId=null;$('delete-confirmation').hidden=true;}
$('delete-cancel').addEventListener('click',()=>{clearDelete();message('삭제를 취소했습니다. 공고는 그대로 유지합니다.');$('query').focus();});
$('delete-confirm').addEventListener('click',()=>{
 if(blocked||deleteId===null)return;
 const target=items.find(x=>x.id===deleteId);
 if(!target){clearDelete();message('대상 공고가 더 이상 존재하지 않아 삭제하지 않았습니다.');return;}
 if(persist(M.remove(items,target.id))){clearDelete();message('공고를 삭제하고 저장했습니다.');$('query').focus();}
});
$('filter').addEventListener('change',render);
$('query').addEventListener('input',render);
$('clear-query').addEventListener('click',()=>{$('query').value='';render();$('query').focus();});
$('export').addEventListener('click',()=>{if(blocked||!items.length)return;const blob=new Blob([JSON.stringify({version:1,jobs:items},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='applyflow-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('JSON 백업 다운로드를 요청했습니다. 파일을 보관하세요. 가져오기에서 내용을 확인한 뒤 복원할 수 있습니다.');});
function clearPreview(){pending=null;$('import-preview').hidden=true;$('replace-confirm').checked=false;$('replace').disabled=true;}
$('backup-text').addEventListener('input',()=>{fileRead++;clearPreview();});
$('backup-file').addEventListener('change',async()=>{clearPreview();const token=++fileRead,file=$('backup-file').files[0];if(!file)return;if(file.size>1024*1024){message('파일이 1 MB를 초과했습니다. 기존 목록은 유지했습니다.');return;}try{const text=await file.text();if(token!==fileRead)return;clearPreview();$('backup-text').value=text;message('파일을 읽었습니다. 백업 검증·미리보기를 눌러 주세요.');}catch{message('파일을 읽지 못했습니다. 기존 목록은 유지했습니다.');}});
$('preview').addEventListener('click',()=>{clearPreview();if(blocked)return;try{pending=M.parseBackup($('backup-text').value);$('preview-title').textContent=pending.length+'개 공고로 현재 '+items.length+'개를 교체합니다.';$('preview-list').replaceChildren();for(const x of pending){const li=document.createElement('li');li.textContent=x.company+' · '+x.role+' · '+x.status;$('preview-list').append(li);}$('import-preview').hidden=false;message('검증했습니다. 목록을 확인하고 교체 동의에 체크하세요. 아직 저장하지 않았습니다.');}catch(e){message('백업을 가져올 수 없습니다. '+e.message+' 기존 목록은 유지했습니다.');}});
$('replace-confirm').addEventListener('change',()=>{$('replace').disabled=blocked||!pending||!$('replace-confirm').checked;});
$('replace').addEventListener('click',()=>{if(blocked||!pending||!$('replace-confirm').checked)return;if(persist(pending)){clearPreview();$('backup-text').value='';$('backup-file').value='';message('백업으로 목록을 교체하고 이 브라우저에 저장했습니다.');}});
window.addEventListener('storage' ,e=>{if(e.key!==M.KEY&&e.key!==null)return;clearPreview();clearDelete();try{items=M.load(localStorage);render();message('다른 탭에서 저장한 변경을 불러왔습니다.');}catch{blocked=true;render();message('다른 탭의 저장 자료를 읽지 못했습니다. 원본을 보존하고 편집을 중단했습니다.');}});
render();
})();
