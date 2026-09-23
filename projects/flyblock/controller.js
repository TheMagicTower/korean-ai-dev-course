(function(root){'use strict';
const E=typeof module!=='undefined'?require('./engine.js'):root.FlyEngine;
const C=typeof module!=='undefined'?require('./data/circuit.js'):root.FlyCircuit;
const VERSION='flyblock-lif-euler-v1';
// Reduced LIF network: original signed counts; parameters in mV/ms from vendored model.py.
function simulate(rates,seed,edges=C.edges){const n=C.neurons.length,dt=.2,steps=1500,delay=9,refractory=11,r=E.rng(seed);
 const v=Array(n).fill(-52),g=Array(n).fill(0),until=Array(n).fill(0),spikes=Array(n).fill(0),trace=[],queue=Array.from({length:delay+1},()=>Array(n).fill(0)),outputs=C.channels.map(c=>c[1]);
 const inputSet=new Set(C.channels.map(c=>c[0])),outgoing=Array.from({length:n},()=>[]);edges.forEach(([a,b,w])=>outgoing[a].push([b,w*.275]));
 for(let t=0;t<steps;t++){
  const slot=queue[t%queue.length];for(let i=0;i<n;i++){g[i]+=slot[i];slot[i]=0;}
  C.channels.forEach(([pre],i)=>{if(r()<rates[i]*dt/1000)v[pre]+=.275*250;});
  for(let i=0;i<n;i++){
   if(t<until[i])continue;
   v[i]+=(-52-v[i]+g[i])/20*dt;g[i]+=-g[i]/5*dt;
   if(v[i]>-45){spikes[i]++;if(trace.length<300)trace.push([Math.round(t*dt*10)/10,i]);v[i]=-52;g[i]=0;until[i]=t+(inputSet.has(i)?0:refractory);
    for(const [j,w]of outgoing[i])queue[(t+delay)%queue.length][j]+=w;
   }
  }
 }
 return{spikes,outputs:outputs.map(i=>spikes[i]),trace,duration_ms:steps*dt};}
function choose(board,colors,seed,allowedMoves=null){const start=performance.now(),legal=E.legal(board),moves=allowedMoves===null?legal:legal.filter(m=>allowedMoves.some(x=>x.col===m.col&&x.rotation===m.rotation));if(!moves.length)throw Error('합법 수가 없습니다.');
 // Engineered encoder: available space + matching top color. This is not a fly sensory mapping.
 const rates=board.map(c=>40+(10-c.length)*10+(c[c.length-1]===colors[0]?35:0));
 const activity=simulate(rates,seed);if(!activity.outputs.some(x=>x>0))throw Error('부분 회로의 출력 발화가 없습니다.');
 // Decoder prioritizes output spikes for legal columns; rotation is selected by output count parity.
 const scored=moves.map(m=>({move:m,score:activity.outputs[m.col]*10+(m.rotation===activity.outputs[m.col]%4?1:0)}));scored.sort((a,b)=>b.score-a.score||a.move.col-b.move.col||a.move.rotation-b.move.rotation);
 return{move:scored[0].move,rates,...activity,elapsed_ms:performance.now()-start,controller_kind:'실제 v783 연결 유도 부분 회로 / 12뉴런',model_revision:VERSION};}
function baseline(board,colors,seed,kind='low'){const moves=E.legal(board);if(!moves.length)throw Error('합법 수가 없습니다.');if(kind==='random')return moves[Math.floor(E.rng(seed)()*moves.length)];return moves.map(m=>({m,height:Math.max(...E.drop(board,colors,m).board.map(c=>c.length))})).sort((a,b)=>a.height-b.height||a.m.col-b.m.col)[0].m;}
function evaluate(count=20){const result=[];for(const kind of ['random','low']){let win=0,draw=0,loss=0,failures=0,cleared=0,moves=0;const latency=[];for(let seed=1;seed<=count;seed++){let s=E.initial(seed);try{while(!s.result){const p=E.pair(seed,s.round),decision=choose(s.boards[1],p,seed+s.round*101);latency.push(decision.elapsed_ms);s=E.step(s,[baseline(s.boards[0],p,seed+s.round*101,kind),decision.move]);moves++;}if(s.result==='회로 승리')win++;else if(s.result==='무승부')draw++;else loss++;cleared+=s.cleared[1];}catch(e){failures++;}}
 latency.sort((a,b)=>a-b);result.push({baseline:kind,seeds:count,win,draw,loss,failures,cleared,moves,median_ms:latency[Math.floor(latency.length/2)]??null});}return result;}
const api={VERSION,simulate,choose,baseline,evaluate,circuit:C};if(typeof module!=='undefined')module.exports=api;else root.FlyController=api;
})(globalThis);
