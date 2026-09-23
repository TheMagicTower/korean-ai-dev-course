(function(root){'use strict';
function editable(target){return !!target&&(!!target.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(target.tagName)||!!target.closest?.('[contenteditable="true"]'));}
function key(event,scope,phase,replay=false){if(!scope||editable(event.target)||['BUTTON','A','SUMMARY'].includes(event.target?.tagName)||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||!['running','paused'].includes(phase))return{handled:false};const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'rotate',ArrowDown:'soft',' ':'hard',p:'pause',P:'pause'};const action=map[event.key];if(!action)return{handled:false};if(replay&&action!=='pause')return{handled:true};if(phase==='paused'&&action!=='pause')return{handled:true};if(event.repeat&&['hard','rotate','pause'].includes(action))return{handled:true};return{handled:true,action};}
// One RAF owner. Restart increments a generation to invalidate already-delivered old callbacks.
function clock({request,cancel,step,render,onLag,dt=50}){let id=null,generation=0,last=null,accumulator=0,active=false;
 function stop(){active=false;generation++;if(id!==null)cancel(id);id=null;last=null;accumulator=0;}
 function start(){stop();active=true;const owner=generation;
  const frame=now=>{if(!active||owner!==generation)return;id=null;if(last===null)last=now;const delta=now-last;last=now;if(delta>250){stop();onLag();return;}accumulator+=delta;
   while(accumulator>=dt){accumulator-=dt;if(step()===false){stop();render();return;}}
   render();if(active&&owner===generation)id=request(frame);
  };id=request(frame);
 }return{start,stop,isActive:()=>active};}
const api={editable,key,clock};if(typeof module!=='undefined')module.exports=api;else root.FlyInput=api;
})(globalThis);
