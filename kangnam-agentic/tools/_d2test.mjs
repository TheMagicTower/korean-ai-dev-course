import { createRequire } from 'node:module'; const require=createRequire('/tmp/claude-0/-home-claude/1e61c45b-9ca0-544b-985f-74ce7a96fb3a/scratchpad/ka/tools/x.js');
const fs=require('fs'); const {D2}=await import('@terrastruct/d2');
const d=new D2(); const src=fs.readFileSync(process.argv[2],'utf8');
try{const r=await d.compile(src,{layout:'elk'});const s=await d.render(r.diagram,{noXMLTag:true});const m=s.match(/viewBox="([-\d. ]+)"/);console.log(m[1]);fs.writeFileSync('/tmp/d2t/out.svg',s);}catch(e){console.log('ERR',e.message.slice(0,300))}
process.exit(0)
