(function(root){
'use strict';
const plans=[{bits:'00',name:'EW priority',ns:20,ew:40},{bits:'01',name:'Balanced',ns:30,ew:30},{bits:'10',name:'NS priority',ns:40,ew:20},{bits:'11',name:'Strong NS',ns:50,ew:10}];
const HORIZON=600,CYCLE=68;
function phase(t,p){let s=t%CYCLE;return s<p.ns?'NS':s<p.ns+4?'CLEAR':s<p.ns+4+p.ew?'EW':'CLEAR';}
function simulate(p,ns,ew){
 const q=[[],[]],acc=[0,0],credit=[0,0],rates=[ns/60,ew/60],arrived=[0,0],served=[0,0],delay=[0,0],peak=[0,0],history=[];
 for(let t=0;t<HORIZON;t++){
  const ph=phase(t,p),entry={t,phase:ph,arrivals:[[],[]],departures:[[],[]]};
  for(let d=0;d<2;d++){
   acc[d]+=rates[d];while(acc[d]>=1-1e-10){acc[d]-=1;let id=arrived[d]++;q[d].push({id,at:t});entry.arrivals[d].push(id);}
   peak[d]=Math.max(peak[d],q[d].length);
   if(ph===(d===0?'NS':'EW')){credit[d]+=.5;while(credit[d]>=1&&q[d].length){credit[d]-=1;entry.departures[d].push(q[d].shift().id);served[d]++;}if(!q[d].length)credit[d]=0;}else credit[d]=0;
   delay[d]+=q[d].length;
  }
  entry.queues=q.map(a=>a.map(v=>v.id));history.push(entry);
 }
 return {history,arrived,served,delay,peak,residual:q.map(a=>a.length),meanDelay:(delay[0]+delay[1])/Math.max(1,arrived[0]+arrived[1])};
}
function costs(results,w){return results.map(r=>w[0]*r.meanDelay/60+w[1]*Math.max(...r.peak)/30+w[2]*(r.residual[0]+r.residual[1])/30);}
function coefficients(c){return [c.reduce((a,b)=>a+b)/4,(c[0]+c[1]-c[2]-c[3])/4,(c[0]-c[1]+c[2]-c[3])/4,(c[0]-c[1]-c[2]+c[3])/4];}
function statevector(c,angles){
 const min=Math.min(...c),span=Math.max(...c)-min;const h=c.map(v=>span>1e-12?(v-min)/span:0);
 let re=[.5,.5,.5,.5],im=[0,0,0,0];
 for(let l=0;l<angles.length/2;l++){
  const g=angles[2*l],b=angles[2*l+1];
  for(let j=0;j<4;j++){let co=Math.cos(g*h[j]),si=Math.sin(g*h[j]),r=re[j];re[j]=r*co+im[j]*si;im[j]=im[j]*co-r*si;}
  for(const mask of [2,1])for(let j=0;j<4;j++)if(!(j&mask)){let k=j|mask,co=Math.cos(b),si=Math.sin(b),r=re[j],i=im[j],s=re[k],v=im[k];re[j]=co*r+si*v;im[j]=co*i-si*s;re[k]=co*s+si*i;im[k]=co*v-si*r;}
 }
 const probabilities=re.map((r,i)=>r*r+im[i]*im[i]);return {re,im,probabilities,expected:probabilities.reduce((a,p,i)=>a+p*c[i],0)};
}
// Standard unconstrained Nelder–Mead, with reflection, expansion, contraction and shrink.
function* optimize(c,depth=2,restarts=6,iterations=100){
 let best={expected:Infinity},evaluations=0;const n=2*depth;
 function evaluate(x){const s=statevector(c,x);evaluations++;if(s.expected<best.expected)best={...s,angles:x.slice()};return {x:x.slice(),y:s.expected};}
 for(let run=0;run<restarts;run++){
  const start=Array.from({length:n},(_,j)=>.3+((run+1)*(j+2)*1.61803398875%1)*3);
  let simplex=[evaluate(start),...start.map((_,i)=>evaluate(start.map((v,j)=>v+(i===j?.35:0))))];
  for(let step=0;step<iterations;step++){
   simplex.sort((a,b)=>a.y-b.y);const worst=simplex[n],centroid=Array.from({length:n},(_,j)=>simplex.slice(0,n).reduce((s,v)=>s+v.x[j],0)/n);
   const point=f=>evaluate(centroid.map((v,j)=>v+f*(v-worst.x[j]))),r=point(1);
   if(r.y<simplex[0].y){const e=point(2);simplex[n]=e.y<r.y?e:r;}
   else if(r.y<simplex[n-1].y)simplex[n]=r;
   else {const outside=r.y<worst.y,ct=point(outside?.5:-.5);if(ct.y<(outside?r.y:worst.y))simplex[n]=ct;else for(let i=1;i<=n;i++)simplex[i]=evaluate(simplex[0].x.map((v,j)=>v+.5*(simplex[i].x[j]-v)));}
   yield {...best,evaluations,run:run+1,step:step+1,progress:(run*iterations+step+1)/(restarts*iterations)};
  }
 }
}
const api={plans,HORIZON,CYCLE,phase,simulate,costs,coefficients,statevector,optimize};if(typeof module!=='undefined')module.exports=api;root.Traffic=api;
})(typeof globalThis!=='undefined'?globalThis:this);
