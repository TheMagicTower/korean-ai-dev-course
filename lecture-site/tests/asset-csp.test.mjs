import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
const bundle=await build({entryPoints:[new URL('../worker.js',import.meta.url).pathname],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022'});
const worker=(await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)).default;
const manifest=JSON.parse(await readFile(new URL('../lab-csp.json',import.meta.url),'utf8'));
const env={ASSETS:{fetch:async()=>new Response('<html>fixture</html>',{headers:{'Content-Type':'text/html'}})}};
test('허용된 실습 HTML만 자신의 스크립트 해시로 실행한다',async()=>{
 for(const [filePath,hashes] of Object.entries(manifest)){
  for(const path of [filePath,filePath.replace(/\.html$/,'')]){
  const res=await worker.fetch(new Request('https://example.com'+path),env);
  const scripts=res.headers.get('content-security-policy').split(';').find(x=>x.trim().startsWith('script-src '));
  assert.equal(scripts.trim(),`script-src 'self'${hashes.map(h=>` '${h}'`).join('')}`);
  }
 }
});
test('일반 페이지와 유사 경로에는 인라인 스크립트 권한을 확장하지 않는다',async()=>{
 for(const path of ['/','/slides/','/labs/solution.html/other','/labs/unknown.html']){
  const res=await worker.fetch(new Request('https://example.com'+path),env);
  const scripts=res.headers.get('content-security-policy').split(';').find(x=>x.trim().startsWith('script-src '));
  assert.equal(scripts.trim(),"script-src 'self'");
 }
});
