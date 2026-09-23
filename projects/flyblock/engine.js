(function(root){'use strict';
const W=6,H=10,LIMIT=80;
const blank=()=>Array.from({length:W},()=>[]);
function rng(seed){let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function pair(seed,round){const r=rng((seed^Math.imul(round+1,2654435761))>>>0);return [1+Math.floor(r()*3),1+Math.floor(r()*3)];}
function legal(board){const out=[];for(let col=0;col<W;col++)for(let rotation=0;rotation<4;rotation++){
 const other=col+(rotation===1?1:rotation===3?-1:0);
 if(other<0||other>=W)continue;
 if(other===col?board[col].length+2<=H:board[col].length<H&&board[other].length<H)out.push({col,rotation});
}return out;}
function resolve(input){const b=input.map(c=>c.slice());let cleared=0,chains=0;
 while(true){const seen=new Set(),kill=new Set();
  for(let x=0;x<W;x++)for(let y=0;y<b[x].length;y++){
   const key=x+','+y,color=b[x][y];if(color===4||seen.has(key))continue;
   const group=[],q=[[x,y]];seen.add(key);
   while(q.length){const [a,z]=q.pop();group.push([a,z]);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=a+dx,ny=z+dy,k=nx+','+ny;if(nx>=0&&nx<W&&ny>=0&&b[nx][ny]===color&&!seen.has(k)){seen.add(k);q.push([nx,ny]);}}}
   if(group.length>=4)for(const [a,z]of group)kill.add(a+','+z);
  }
  if(!kill.size)break;chains++;cleared+=kill.size;
  const garbage=new Set();for(const key of kill){const [x,y]=key.split(',').map(Number);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<W&&b[nx][ny]===4)garbage.add(nx+','+ny);}}
  for(const key of garbage)kill.add(key);
  for(let x=0;x<W;x++)b[x]=b[x].filter((_,y)=>!kill.has(x+','+y));
 }return {board:b,cleared,chains,attack:Math.floor(cleared/4)};}
function drop(board,colors,move){if(!legal(board).some(m=>m.col===move.col&&m.rotation===move.rotation))throw Error('불가능한 수입니다.');
 const b=board.map(c=>c.slice()),{col,rotation}=move;
 if(rotation===0)b[col].push(colors[0],colors[1]);else if(rotation===2)b[col].push(colors[1],colors[0]);else{b[col].push(colors[0]);b[col+(rotation===1?1:-1)].push(colors[1]);}
 return resolve(b);
}
function garbage(board,n){const b=board.map(c=>c.slice());let overflow=false;for(let i=0;i<n;i++){let col=0;for(let x=1;x<W;x++)if(b[x].length<b[col].length)col=x;if(b[col].length>=H){overflow=true;break;}b[col].push(4);}return{board:b,overflow};}
function initial(seed=2026){return{seed:seed>>>0,round:0,boards:[blank(),blank()],cleared:[0,0],result:null,history:[]};}
function step(state,moves){if(state.result)throw Error('경기가 끝났습니다.');const colors=pair(state.seed,state.round),out=moves.map((m,i)=>drop(state.boards[i],colors,m));
 const g=[garbage(out[0].board,out[1].attack),garbage(out[1].board,out[0].attack)];
 const dead=g.map(x=>x.overflow||legal(x.board).length===0),round=state.round+1,cleared=out.map((o,i)=>state.cleared[i]+o.cleared);let result=null;
 if(dead.some(Boolean))result=dead.every(Boolean)?'무승부':dead[0]?'회로 승리':'사람 승리';
 else if(round>=LIMIT)result=cleared[0]===cleared[1]?'무승부':cleared[0]>cleared[1]?'사람 승리':'회로 승리';
 return{seed:state.seed,round,boards:g.map(x=>x.board),cleared,result,history:[...state.history,{moves:moves.map(m=>({...m})),colors,cleared:out.map(x=>x.cleared),chains:out.map(x=>x.chains),attack:out.map(x=>x.attack)}]};}
function replay(seed,history){return history.reduce((s,h)=>step(s,h.moves),initial(seed));}
const api={W,H,LIMIT,blank,rng,pair,legal,resolve,drop,garbage,initial,step,replay};if(typeof module!=='undefined')module.exports=api;else root.FlyEngine=api;
})(globalThis);
