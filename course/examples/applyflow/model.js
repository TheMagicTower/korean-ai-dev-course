(function(root){
'use strict';
const KEY='kdev-applyflow-v1';
const statuses=['관심','지원','면접','합격','종료'];
function validate(items){
 if(!Array.isArray(items)||items.length>200)throw Error('저장 형식이 올바르지 않습니다.');
 const ids=new Set();
 for(const x of items){
  if(!x||typeof x.id!=='string'||ids.has(x.id)||typeof x.company!=='string'||!x.company.trim()||x.company.length>60||typeof x.role!=='string'||!x.role.trim()||x.role.length>100||!statuses.includes(x.status))throw Error('저장된 공고를 읽을 수 없습니다. 원본을 보존했습니다.');
  ids.add(x.id);
 }
 return items;
}
function load(storage){const raw=storage.getItem(KEY);return raw===null?[]:validate(JSON.parse(raw));}
function save(storage,items){validate(items);storage.setItem(KEY,JSON.stringify(items));return items;}
function add(items,company,role,id){company=company.trim();role=role.trim();const next=[{id,company,role,status:'관심'},...items];return validate(next);}
function transition(items,id,status){if(!statuses.includes(status))throw Error('알 수 없는 지원 상태입니다.');if(!items.some(x=>x.id===id))throw Error('공고를 찾을 수 없습니다.');return validate(items.map(x=>x.id===id?{...x,status}:x));}
const api={KEY,statuses,validate,load,save,add,transition};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ApplyFlow=api;
})(typeof window==='undefined'?globalThis:window);
