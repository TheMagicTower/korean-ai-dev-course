(function(root){'use strict';
const E=typeof module!=='undefined'?require('./engine.js'):root.FlyEngine;
const N=typeof module!=='undefined'?require('./controller.js'):root.FlyController;
const VERSION='flyblock-realtime-v1',TICK_MS=50,GRAVITY=10,AI_STEP=3,MAX_TICKS=2400;
const OFFSETS=[[0,1],[1,0],[0,-1],[-1,0]],ACTIONS=['left','right','rotate','soft','hard'];
function cells(piece){const [dx,dy]=OFFSETS[piece.rotation];return[[piece.x,piece.y,piece.colors[0]],[piece.x+dx,piece.y+dy,piece.colors[1]]];}
function fits(board,piece){return cells(piece).every(([x,y])=>x>=0&&x<E.W&&y>=0&&y<E.H&&y>=board[x].length);}
function transformed(board,piece,action){let next={...piece};if(action==='left')next.x--;else if(action==='right')next.x++;else if(action==='soft')next.y--;else if(action==='rotate'){
 next.rotation=(next.rotation+1)%4;
 for(const dx of [0,-1,1]){const kicked={...next,x:next.x+dx};if(fits(board,kicked))return kicked;}return null;
 }else throw Error('알 수 없는 이동입니다.');return fits(board,next)?next:null;}
function landing(board,piece){let p={...piece},next;while((next=transformed(board,p,'soft')))p=next;return p;}
function reachable(board,piece){const queue=[{piece,path:[]}],seen=new Set(),out=new Map();for(let q=0;q<queue.length;q++){
 const item=queue[q],p=item.piece,key=`${p.x}:${p.y}:${p.rotation}`;if(seen.has(key))continue;seen.add(key);
 if(!transformed(board,p,'soft')){const move={col:p.x,rotation:p.rotation},k=`${move.col}:${move.rotation}`;if(!out.has(k))out.set(k,{move,path:[...item.path,'soft']});}
 for(const action of ['left','right','rotate','soft']){const next=transformed(board,p,action);if(next&&!seen.has(`${next.x}:${next.y}:${next.rotation}`))queue.push({piece:next,path:[...item.path,action]});}
 }return [...out.values()];}
function initial(seed=2026){return{version:VERSION,model:N.VERSION,seed:seed>>>0,tick:0,phase:'ready',boards:[E.blank(),E.blank()],active:[null,null],turns:[0,0],gravity:[0,0],pending:[0,0],cleared:[0,0],dead:[false,false],result:null,actions:[],locks:[],target:null,decision:null,lastComputeMs:null};}
function neuralTarget(s){const options=reachable(s.boards[1],s.active[1]);if(!options.length)throw Error('회로에 도달 가능한 수가 없습니다.');const d=N.choose(s.boards[1],s.active[1].colors,(s.seed+s.turns[1]*101)>>>0,options.map(x=>x.move));s.lastComputeMs=d.elapsed_ms;const {elapsed_ms,...decision}=d;s.decision=decision;s.target=d.move;}
function spawn(s,i){const piece={x:2,y:8,rotation:0,colors:E.pair(s.seed,s.turns[i])};s.gravity[i]=0;
 if(!fits(s.boards[i],piece)){s.dead[i]=true;s.active[i]=null;return;}s.active[i]=piece;if(i===1)neuralTarget(s);}
function finish(s){if(s.dead.some(Boolean)){s.result=s.dead.every(Boolean)?'무승부':s.dead[0]?'회로 승리':'사람 승리';s.phase='ended';}else if(s.tick>=MAX_TICKS){s.result=s.cleared[0]===s.cleared[1]?'무승부':s.cleared[0]>s.cleared[1]?'사람 승리':'회로 승리';s.phase='ended';}}
function start(seed){const s=initial(seed);s.phase='running';spawn(s,0);spawn(s,1);finish(s);return s;}
function pause(s){if(s.phase==='running')s.phase='paused';return s;}
function resume(s){if(s.phase==='paused')s.phase='running';return s;}
function error(s,message){s.phase='error';s.error=message;return s;}
function advance(s,input=[]){if(s.phase!=='running')return s;if(input.some(a=>!ACTIONS.includes(a)))throw Error('알 수 없는 입력입니다.');s.tick++;const locked=[false,false],attacks=[0,0];
 const apply=(i,action)=>{if(locked[i]||!s.active[i])return;
  if(action==='hard'){s.active[i]=landing(s.boards[i],s.active[i]);locked[i]=true;return;}
  const next=transformed(s.boards[i],s.active[i],action);if(next)s.active[i]=next;else if(action==='soft')locked[i]=true;
 };
 for(const action of input){s.actions.push({tick:s.tick,action});apply(0,action);}
 if(s.tick%AI_STEP===0&&!s.dead[1]){let options=reachable(s.boards[1],s.active[1]),path=options.find(x=>x.move.col===s.target.col&&x.move.rotation===s.target.rotation);if(!path){neuralTarget(s);path=options.find(x=>x.move.col===s.target.col&&x.move.rotation===s.target.rotation);}if(!path)throw Error('실제 신경 목표의 경로를 찾지 못했습니다.');apply(1,path.path[0]);}
 for(let i=0;i<2;i++){if(!locked[i]&&++s.gravity[i]>=GRAVITY){s.gravity[i]=0;apply(i,'soft');}
  if(locked[i]){const p=s.active[i],o=E.drop(s.boards[i],p.colors,{col:p.x,rotation:p.rotation});s.boards[i]=o.board;s.cleared[i]+=o.cleared;attacks[i]=o.attack;s.turns[i]++;s.active[i]=null;s.locks.push({tick:s.tick,player:i,col:p.x,rotation:p.rotation,cleared:o.cleared,chains:o.chains,attack:o.attack});}}
 // Queue both attacks before either locked board receives pending garbage.
 s.pending[0]+=attacks[1];s.pending[1]+=attacks[0];
 for(let i=0;i<2;i++)if(locked[i]){const g=E.garbage(s.boards[i],s.pending[i]);s.boards[i]=g.board;s.pending[i]=0;if(g.overflow)s.dead[i]=true;}
 // Decide both deaths on this tick before declaring a winner.
 for(let i=0;i<2;i++)if(locked[i]&&!s.dead[i])spawn(s,i);finish(s);return s;
}
function snapshot(s){const {lastComputeMs,...stable}=s;return JSON.parse(JSON.stringify(stable));}
function recording(s){return{format:'flyblock-realtime-replay',version:VERSION,model:N.VERSION,dataset:N.circuit.revision,seed:s.seed,endTick:s.tick,actions:s.actions.map(x=>({...x}))};}
function validateReplay(log){if(log.format!=='flyblock-realtime-replay'||log.version!==VERSION||log.model!==N.VERSION||log.dataset!==N.circuit.revision)throw Error('리플레이 버전이 다릅니다.');if(!Number.isInteger(log.seed)||log.seed<0||log.seed>4294967295||!Number.isInteger(log.endTick)||log.endTick<0||log.endTick>MAX_TICKS||!Array.isArray(log.actions))throw Error('잘못된 리플레이입니다.');let previous=0;for(const a of log.actions){if(!Number.isInteger(a.tick)||a.tick<1||a.tick>log.endTick||a.tick<previous||!ACTIONS.includes(a.action))throw Error('잘못된 리플레이 입력입니다.');previous=a.tick;}return log;}
function replay(log){validateReplay(log);const s=start(log.seed);let index=0;while(s.tick<log.endTick){const actions=[];while(log.actions[index]?.tick===s.tick+1)actions.push(log.actions[index++].action);const before=s.tick;advance(s,actions);if(before===s.tick)throw Error('경기 종료 이후 입력이 있습니다.');}return s;}
const api={VERSION,TICK_MS,GRAVITY,AI_STEP,MAX_TICKS,ACTIONS,cells,fits,transformed,landing,reachable,initial,start,pause,resume,error,advance,snapshot,recording,validateReplay,replay};if(typeof module!=='undefined')module.exports=api;else root.FlyRealtime=api;
})(globalThis);
