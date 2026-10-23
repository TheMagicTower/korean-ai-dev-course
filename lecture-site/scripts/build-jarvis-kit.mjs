import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const files=['.gitignore','README.md','package.json','adapters.mjs','contract.mjs','provider-worker.mjs','runner.mjs','server.mjs','setup-codex.mjs','example-record.json','codex-live-record.json','test/harness.test.mjs','ui/app.js','ui/index.html','ui/style.css'];
await mkdir('public/downloads',{recursive:true});
// An explicit list prevents auth stores, dependencies, or local logs from entering a public archive.
const script=`import sys,zipfile,pathlib\nfiles=sys.argv[2:]\nwith zipfile.ZipFile(sys.argv[1],'w',zipfile.ZIP_DEFLATED) as z:\n for f in files:\n  item=zipfile.ZipInfo('jarvis-kit/'+f,(2026,10,23,0,0,0)); item.compress_type=zipfile.ZIP_DEFLATED; item.external_attr=0o644<<16\n  z.writestr(item,pathlib.Path('jarvis-kit',f).read_bytes())\n`;
execFileSync('python3',['-c',script,'public/downloads/jarvis-kit.zip',...files]);
await cp('jarvis-kit/README.md','public/downloads/jarvis-README.md');
await cp('jarvis-kit/example-record.json','public/downloads/jarvis-example-record.json');
console.log(`Jarvis kit: ${files.length} allowlisted files, no auth or environment files.`);

await cp('jarvis-kit/codex-live-record.json','public/downloads/jarvis-codex-live-record.json');
