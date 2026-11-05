(()=>{
 const deck=document.getElementById('deck'), slides=[...deck.querySelectorAll('.slide')];
 const pos=document.getElementById('pos'), prog=document.getElementById('prog'), notes=document.getElementById('notes'), jump=document.getElementById('jump');
 let i=0;
 // period jump menu
 const periods=[];slides.forEach((s,k)=>{const p=s.dataset.period;if(p&&!periods.find(x=>x.p===p))periods.push({p,k});});
 periods.forEach(({p,k})=>{const o=document.createElement('option');o.value=k;o.textContent=p+'교시';jump.appendChild(o);});
 if(!periods.length)jump.hidden=true;
 const fit=()=>{const s=Math.min(innerWidth/1600,(innerHeight-40)/900);deck.style.transform=`translate(-50%,-50%) scale(${s})`;};
 const show=n=>{i=Math.max(0,Math.min(slides.length-1,n));slides.forEach((s,k)=>s.classList.toggle('on',k===i));
   const p=slides[i].dataset.period;pos.textContent=`${p?p+'교시 · ':''}${i+1} / ${slides.length}`;
   prog.style.width=`${(i+1)/slides.length*100}%`;
   const a=slides[i].querySelector('aside');notes.textContent=a?a.textContent.trim():'';
   const cur=[...periods].reverse().find(x=>x.k<=i);if(cur)jump.value=String(cur.k);
   if(location.hash!=='#s'+(i+1))history.replaceState(null,'','#s'+(i+1));};
 const fromHash=()=>{const m=location.hash.match(/^#s(\d+)$/);show(m?+m[1]-1:0);};
 const toggleFs=()=>{try{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen().catch(()=>{});}catch(_){}};
 addEventListener('keydown',e=>{
  if(e.target.closest&&e.target.closest('select'))return;
  if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();show(i+1);}
  else if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();show(i-1);}
  else if(e.key==='Home')show(0); else if(e.key==='End')show(slides.length-1);
  else if(e.key==='n'||e.key==='N')notes.hidden=!notes.hidden;
  else if(e.key==='f'||e.key==='F')toggleFs();});
 document.getElementById('nb').onclick=()=>notes.hidden=!notes.hidden;
 document.getElementById('fb').onclick=toggleFs;
 jump.onchange=()=>show(+jump.value);
 deck.addEventListener('click',e=>{if(e.target.closest('a,button,select'))return;show(e.clientX>innerWidth/2?i+1:i-1);});
 addEventListener('resize',fit);addEventListener('hashchange',fromHash);fit();fromHash();
})();
