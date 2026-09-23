(function(root){
'use strict';
const KEY='kdev-project-applyflow-v1';
const statuses=['관심','지원','면접','합격','종료'];
function validate(items){
 if(!Array.isArray(items)||items.length>200)throw Error('저장 형식이 올바르지 않습니다.');
 const ids=new Set();
 for(const x of items){
  if(!x||typeof x.id!=='string'||!x.id.trim()||x.id.length>100||ids.has(x.id)||typeof x.company!=='string'||!x.company.trim()||x.company.length>60||typeof x.role!=='string'||!x.role.trim()||x.role.length>100||!statuses.includes(x.status))throw Error('저장된 공고를 읽을 수 없습니다. 원본을 보존했습니다.');
  ids.add(x.id);
 }
 return items;
}
function load(storage){const raw=storage.getItem(KEY);return raw===null?[]:validate(JSON.parse(raw));}
function save(storage,items){validate(items);storage.setItem(KEY,JSON.stringify(items));return items;}
function add(items,company,role,id){company=company.trim();role=role.trim();const next=[{id,company,role,status:'관심'},...items];return validate(next);}
function transition(items,id,status){if(!statuses.includes(status))throw Error('알 수 없는 지원 상태입니다.');if(!items.some(x=>x.id===id))throw Error('공고를 찾을 수 없습니다.');return validate(items.map(x=>x.id===id?{...x,status}:x));}
function selectJobs(items,status,query){const q=query.trim().toLocaleLowerCase();return items.filter(x=>(status==='all'||x.status===status)&&(!q||x.company.toLocaleLowerCase().includes(q)||x.role.toLocaleLowerCase().includes(q)));}
function parseBackup(text){
 if(typeof text!=='string'||text.length>1024*1024)throw Error('백업은 1 MB 이하의 JSON이어야 합니다.');
 const data=JSON.parse(text);
 if(!data||data.version!==1||!Array.isArray(data.jobs))throw Error('지원하지 않는 백업 형식입니다. version 1과 jobs 목록이 필요합니다.');
 return validate(data.jobs).map(({id,company,role,status})=>({id,company,role,status}));
}
function remove(items,id){if(!items.some(x=>x.id===id))throw Error('공고를 찾을 수 없습니다.');return validate(items.filter(x=>x.id!==id));}
const api={parseBackup,remove,KEY,statuses,validate,load,save,add,transition,selectJobs};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ApplyFlow=api;
})(typeof window==='undefined'?globalThis:window);
