export const $=(s,el=document)=>el.querySelector(s);
export const $$=(s,el=document)=>[...el.querySelectorAll(s)];
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const safeUrl=v=>{try{const raw=String(v||'').trim();const u=new URL(/^www\./i.test(raw)?'https://'+raw:raw,location.origin);return ['https:','http:'].includes(u.protocol)?u.href:'#'}catch{return '#'}};
export const link=(url,label)=>`<a href="${esc(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
export const list=items=>`<ul class="clean-list">${(items||[]).map(x=>`<li>${esc(typeof x==='string'?x:JSON.stringify(x))}</li>`).join('')}</ul>`;
export async function json(path){const r=await fetch(path);if(!r.ok)throw new Error('자료를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');return r.json()}
export async function api(path,body,method){const r=await fetch('/api'+path,{method:method||(body===undefined?'GET':'POST'),headers:body===undefined?{}:{'Content-Type':'application/json'},credentials:'same-origin',body:body===undefined?undefined:JSON.stringify(body)});const data=await r.json();if(!r.ok){const e=new Error(data.error||'요청을 처리하지 못했습니다.');e.status=r.status;throw e}return data}
export const date=v=>v?new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Seoul'}).format(new Date(v)):'—';
export function toast(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),4500)}
export function download(name,text,type='text/plain;charset=utf-8'){const u=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
export function storageGet(key,fallback=null){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
export function storageSet(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
export function shell(){
 const page=document.body.dataset.page;
 const nav=[['/course/','강의·실습','course'],['/slides/','슬라이드','slides'],['/data/','공공데이터','data'],['/assignments/','과제·피드백','assignments']];
 $('#site-header').innerHTML=`<div class="header-inner"><a class="brand" href="/" aria-label="강의 홈"><span class="brand-mark">M</span><span>MAKE FOR GOOD<small>강남대학교 · AI 소프트웨어 엔지니어링</small></span></a><button class="menu-toggle" aria-expanded="false" aria-controls="main-nav">메뉴</button><nav id="main-nav" aria-label="주 메뉴">${nav.map(([url,title,id])=>`<a href="${url}" ${id===page?'aria-current="page"':''}>${title}</a>`).join('')}</nav></div>`;
 $('.menu-toggle').addEventListener('click',e=>{const open=e.currentTarget.getAttribute('aria-expanded')!=='true';e.currentTarget.setAttribute('aria-expanded',String(open));$('#main-nav').classList.toggle('open',open)});
 $('#site-footer').innerHTML=`<div class="container footer-inner"><div><b>MAKE FOR GOOD</b><p>생각을 제품으로. 제품을 누군가의 일상으로.</p><small>강남대학교 강의 자료 · 2026.10.22 기준</small></div><nav aria-label="하단 메뉴"><a href="/prework/">0교시 과제</a><a href="/privacy/">제출 정보 안내</a><a href="/instructor/">강사 평가실</a><a href="https://github.com/TheMagicTower/korean-ai-dev-course" target="_blank" rel="noopener">강의 저장소 ↗</a></nav></div>`;
}
export function failure(error){$('#main').innerHTML=`<section class="container section"><p class="eyebrow">다시 연결해 주세요</p><h1>자료를 불러오지 못했습니다.</h1><p>${esc(error.message)}</p><a class="button" href="${esc(location.pathname)}">다시 시도</a></section>`}
export function pageHead(kicker,title,description){return `<section class="page-head container"><p class="eyebrow">${esc(kicker)}</p><h1>${title}</h1><p class="lead">${esc(description)}</p></section>`}
