import {mkdir,readFile,writeFile,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,dirname} from 'node:path';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
await mkdir(join(root,'public/content'),{recursive:true});
await cp(join(root,'content'),join(root,'public/content'),{recursive:true});
const pages=[['','home','AI와 함께, 세상에 내놓는 첫 제품','pages'],['course','course','강의와 실습','pages'],['prework','prework','0교시 · 세상을 이롭게 할 아이디어','pages'],['data','data','공공데이터로 발견하는 가능성','pages'],['demo','demo','우리 동네 도서관 찾기','demo'],['slides','slides','AI 소프트웨어 엔지니어링 · 슬라이드','slides'],['assignments','assignments','과제 제출과 피드백','submissions'],['instructor','instructor','강사 평가실','submissions'],['privacy','privacy','제출 정보와 개인정보 안내','pages']];
for(const [path,page,title,module] of pages){
 const dir=join(root,'public',path);await mkdir(dir,{recursive:true});
 const html=`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#183f35"><meta name="description" content="강남대학교 AI 소프트웨어 엔지니어링 20시간 과정. 아이디어부터 공공데이터, 사용자 경험, AI 개발, 테스트와 공개 MVP까지."><title>${title} | 강남대 AI 엔지니어링</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800;900&family=Noto+Serif+KR:wght@500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/site.css"><script type="module" src="/${module}.js"></script></head><body data-page="${page}"><a class="skip" href="#main">본문으로 건너뛰기</a><header id="site-header"></header><main id="main" tabindex="-1"><div class="container loading" role="status"><p class="eyebrow">KANGNAM UNIVERSITY · AI ENGINEERING</p><h1>${title}</h1><p>강의 자료를 불러오고 있습니다.</p></div></main><footer id="site-footer"></footer><noscript><p class="container">슬라이드와 제출 기능은 JavaScript가 필요합니다. <a href="/content/workshop.json">강의·과제 원본 자료</a>와 <a href="https://www.data.go.kr/">공공데이터포털</a>을 열 수 있습니다.</p></noscript><div id="toast" role="status" aria-live="polite"></div></body></html>`;
 await writeFile(join(dir,'index.html'),html);
}
await writeFile(join(root,'public','404.html'),'<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/site.css"><main class="container section"><p class="eyebrow">404</p><h1>페이지를 찾을 수 없습니다.</h1><a class="button" href="/">강의 홈으로</a></main></html>');
console.log(`Built ${pages.length} pages and content.`);
