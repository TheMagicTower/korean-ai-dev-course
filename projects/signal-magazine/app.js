'use strict';
const $=id=>document.getElementById(id),M=Magazine,KEY='signal-magazine-v1';let state,seed,blocked=false;
const node=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
const note=text=>$('notice').textContent=text;
function render(){
 const d=state.draft,src=state.sources[0];$('title').value=d.title;$('summary').value=d.summary;$('reason').value='';$('state').textContent=({draft:'검토 전',approved:'승인됨',held:'보류',published:'발행됨'})[d.status]+' · v'+d.version;$('origin').textContent=state.textOrigin;
 $('source').replaceChildren(node('h3',src.title),node('blockquote',src.excerpt));const a=node('a','NASA 원문 읽기 ↗');a.href=src.url;a.target='_blank';a.rel='noopener noreferrer';$('source').append(a,node('p','발표: '+src.publishedAt),node('p','수집: '+src.collectedAt));$('source').querySelectorAll('p').forEach(x=>x.className='fine');
 $('provenance').replaceChildren(node('p','주제 분류: '+state.run.model+' / '+state.classification.choice),node('p','실행: '+state.run.capturedAt),node('p','입력 '+state.run.usage.input_tokens+' · 출력 '+state.run.usage.output_tokens+' tokens'));$('claims').replaceChildren(node('strong','주장과 근거'));d.claims.forEach(c=>$('claims').append(node('p',c.text+' → '+c.evidenceId)));
 const last=state.editions.at(-1);$('edition').replaceChildren();if(last){$('edition').append(node('p','ISSUE 01 · REVISION '+last.article.version+' · '+last.at),node('h3',last.article.title),node('p',last.article.summary));const link=node('a','근거: NASA 공식 발표 ↗');link.href=src.url;link.target='_blank';link.rel='noopener noreferrer';$('edition').append(link,node('p','기록된 실제 AI 초안 · 편집자 검토 · 브라우저 내부 발행'));}else{const e=node('p','기사의 근거를 확인하고 승인한 뒤 로컬 발행을 눌러 보세요.');e.className='empty';$('edition').append(e);}
 $('history').replaceChildren();const ul=document.createElement('ul');state.editions.forEach(e=>ul.append(node('li','발행 v'+e.article.version+' · '+e.at)));state.corrections.forEach(c=>ul.append(node('li','정정안 v'+c.from+' → v'+c.to+' · '+c.reason+' · '+c.at)));$('history').append(ul);if(!ul.children.length)$('history').append(node('p','아직 발행·정정 기록이 없습니다.'));
}
function commit(next,message){if(blocked)throw Error('저장 데이터를 읽을 수 없습니다. 초기화 전에는 변경하지 않습니다.');localStorage.setItem(KEY,JSON.stringify(next));state=next;render();note(message);}
function act(fn){try{fn();}catch(e){note(e.message);}}
function requireSaved(){if($('title').value!==state.draft.title||$('summary').value!==state.draft.summary)throw Error('화면의 변경 내용을 먼저 저장하세요.');}
$('save').onclick=()=>act(()=>commit(M.edit(state,$('title').value,$('summary').value,$('reason').value),'저장했습니다. 변경한 버전은 다시 검토해 주세요.'));
$('hold').onclick=()=>act(()=>{requireSaved();commit(M.review(state,'hold'),'검토를 보류했습니다.');});
$('approve').onclick=()=>act(()=>{requireSaved();commit(M.review(state,'approve'),'현재 버전을 승인했습니다. 본문과 근거의 의미 일치 여부는 편집자의 책임입니다.');});
$('publish').onclick=()=>act(()=>{requireSaved();const n=M.publish(state);commit(n,n.editions.length===state.editions.length?'이미 발행된 버전입니다. 중복 생성하지 않았습니다.':'독자 미리보기에 발행했습니다. 외부 사이트에는 게시하지 않습니다.');});
$('reset').onclick=()=>act(()=>{if(!confirm('이 브라우저의 Signal Magazine 편집·발행 기록을 초기화하시겠습니까?'))return;localStorage.removeItem(KEY);blocked=false;state=structuredClone(seed);render();note('기록된 원본 초안으로 돌아왔습니다.');});
fetch('data.json').then(r=>{if(!r.ok)throw Error('기록된 자료를 불러오지 못했습니다.');return r.json();}).then(data=>{if(!M.valid(data))throw Error('자료 형식이 올바르지 않습니다.');seed=data;state=structuredClone(seed);try{const stored=localStorage.getItem(KEY);if(stored){const parsed=JSON.parse(stored);if(!M.valid(parsed))throw Error();state=parsed;}note('공식 자료와 실제 AI 실행 기록을 불러왔습니다. 초안을 검토해 주세요.');}catch{blocked=true;note('저장 데이터를 읽을 수 없어 원본 미리보기를 표시합니다. 기존 데이터는 보존하며 초기화 전 편집을 막습니다.');}render();}).catch(e=>{note(e.message);document.querySelectorAll('button').forEach(b=>b.disabled=true);});
