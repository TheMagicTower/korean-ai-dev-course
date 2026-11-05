// Render an X post card from X's public syndication data (same data the official embed uses).
// Usage: NODE_PATH=$(npm root -g) node tools/tweet.js NAME TWEET_ID   -> assets/captures/NAME.jpg
const { chromium } = require('playwright'); const path=require('path'); const {execFileSync}=require('child_process');
const [name,id]=process.argv.slice(2); const root=path.resolve(__dirname,'..');
(async()=>{
 const d=JSON.parse(execFileSync('curl',['-s',`https://cdn.syndication.twimg.com/tweet-result?id=${id}&token=4`]).toString());
 const full=(d.note_tweet&&d.note_tweet.note_tweet_results&&d.note_tweet.note_tweet_results.result.text)||d.text;
 const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
 const dt=new Date(d.created_at); const date=dt.toLocaleString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'UTC'})+' UTC · '+dt.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
 const k=n=>n>=1000?(n/1000).toFixed(1)+'K':n;
 const av=d.user.profile_image_url_https.replace('_normal','_x96');
 const html=`<!doctype html><html><head><meta charset=utf-8><style>
 @font-face{font-family:Chirp;src:url(https://abs.twimg.com/responsive-web/client-web/Chirp-Regular.80fda27a.woff2)}
 @font-face{font-family:Chirp;font-weight:700;src:url(https://abs.twimg.com/responsive-web/client-web/Chirp-Bold.ebb56aba.woff2)}
 body{margin:0;background:#fff;font-family:Chirp,-apple-system,sans-serif;color:#0f1419}
 article{width:550px;border:1px solid #cfd9de;border-radius:12px;padding:12px 16px 4px;box-sizing:border-box;margin:8px}
 .h{display:flex;gap:10px;align-items:center}.h img{width:48px;height:48px;border-radius:50%}
 .n{font-weight:700;font-size:15px;display:flex;gap:3px;align-items:center}.u{color:#536471;font-size:15px}
 .x{margin-left:auto;width:23px}.t{font-size:17px;line-height:24px;margin:12px 0;white-space:pre-wrap}
 .m{color:#536471;font-size:15px;padding-bottom:12px;border-bottom:1px solid #cfd9de}.f{color:#536471;font-size:14px;font-weight:700;padding:10px 0;display:flex;gap:22px}
 </style></head><body><article><div class=h><img src="${av}"><div><div class=n>${esc(d.user.name)}<svg viewBox="0 0 22 22" width=18 fill="#1d9bf0"><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"/></svg></div><div class=u>@${d.user.screen_name}</div></div><svg class=x viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></div>
 <div class=t>${esc(full)}</div><div class=m>${date}</div><div class=f><span>♥ ${k(d.favorite_count)}</span><span>x.com/${d.user.screen_name}/status/${id}</span></div></article></body></html>`;
 const b=await chromium.launch(); const p=await b.newPage({viewport:{width:600,height:400},deviceScaleFactor:2});
 await p.setContent(html,{waitUntil:'networkidle'}); await p.waitForTimeout(800);
 const png=path.join(root,'assets/captures',name+'.png'); await (await p.$('article')).screenshot({path:png}); await b.close();
 execFileSync('python3',['-c',`from PIL import Image;import os;im=Image.open('${png}').convert('RGB');im.save('${png[0]==='/'?png.slice(0,-4):png}.jpg',quality=88);os.remove('${png}');print('saved',im.size)`],{stdio:'inherit'});
})();
