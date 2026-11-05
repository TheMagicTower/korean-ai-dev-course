// Render a page DOM serialized in the instructor's browser (assets/raw/NAME.html) and screenshot a selector.
// Usage: NODE_PATH=$(npm root -g) node tools/render-saved.js NAME [SELECTOR=article] [WIDTH=560]
const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs'); const {execFileSync}=require('child_process');
const [name,sel='article',w='560']=process.argv.slice(2); const root=path.resolve(__dirname,'..');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:+w,height:1000},deviceScaleFactor:2});
 await p.setContent(fs.readFileSync(path.join(root,'assets/raw',name+'.html'),'utf8'),{waitUntil:'networkidle',timeout:30000}).catch(()=>{});
 await p.waitForTimeout(1000); const png=path.join(root,'assets/captures',name+'.png');
 await (await p.$(sel)).screenshot({path:png}); await b.close();
 execFileSync('python3',['-c',`from PIL import Image;import os;im=Image.open('${png}').convert('RGB');im.save('${png.slice(0,-4)}.jpg',quality=88);os.remove('${png}');print('saved',im.size)`],{stdio:'inherit'});})();
