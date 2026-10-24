'use strict';
const assert=require('node:assert/strict'),T=require('./core.js');
const near=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
for(const p of T.plans){assert.equal(p.ns+p.ew+8,68);assert.ok(p.ns>=10&&p.ew>=10);let phases=Array.from({length:68},(_,t)=>T.phase(t,p));assert.equal(phases.filter(x=>x==='CLEAR').length,8);assert.equal(phases.filter(x=>x==='NS').length,p.ns);for(const rates of [[0,0],[18,12],[28,28],[3,25]]){let r=T.simulate(p,...rates);assert.deepEqual(r,T.simulate(p,...rates));for(let d=0;d<2;d++){assert.equal(r.arrived[d],rates[d]*10);assert.equal(r.served[d]+r.residual[d],r.arrived[d]);let queue=0,delay=0;for(const s of r.history){queue+=s.arrivals[d].length-s.departures[d].length;assert.equal(queue,s.queues[d].length);assert.ok(s.departures[d].length<=1);if(s.phase!==(d===0?'NS':'EW'))assert.equal(s.departures[d].length,0);delay+=queue;}assert.equal(delay,r.delay[d]);}}}
// Independent hand calculation: 1 arrival/s, 0.5 service/s, first 4 s of NS green.
const r=T.simulate(T.plans[0],60,0);assert.deepEqual(r.history.slice(0,4).map(s=>s.queues[0].length),[1,1,2,2]);
for(const c of [[0,1,2,3],[7,7,7,7],[4,1,3,2]]){const a=T.coefficients(c);for(let i=0;i<4;i++){const z0=i<2?1:-1,z1=i%2?-1:1;near(a[0]+a[1]*z0+a[2]*z1+a[3]*z0*z1,c[i]);}for(const angles of [[0,0],[.9,.7,1.3,-.4]]){const s=T.statevector(c,angles);near(s.probabilities.reduce((x,y)=>x+y),1);assert.ok(s.expected>=Math.min(...c)-1e-9);assert.ok(s.expected<=Math.max(...c)+1e-9);} }
// Analytic product-state check: Htilde=(I-Z1)/2, gamma=pi, beta=pi/4 -> uniform probabilities.
for(const p of T.statevector([0,1,0,1],[Math.PI,Math.PI/4]).probabilities)near(p,.25);
// gamma=pi/2, beta=-pi/4 selects the zero-cost right qubit exactly.
const analytic=T.statevector([0,1,0,1],[Math.PI/2,-Math.PI/4]);near(analytic.probabilities[0]+analytic.probabilities[2],1);
for(const rates of [[18,12],[4,24],[24,4],[0,0],[28,28]]){const c=T.costs(T.plans.map(p=>T.simulate(p,...rates)),[1,.6,1]);let best;for(const s of T.optimize(c,2))best=s;near(best.probabilities.reduce((a,b)=>a+b),1);assert.ok(best.expected>=Math.min(...c)-1e-9);assert.ok(best.expected<=c.reduce((a,b)=>a+b)/4+1e-7);console.log(rates,'exact',Math.min(...c).toFixed(4),'QAOA',best.expected.toFixed(4),'gap',(best.expected-Math.min(...c)).toFixed(6));}
console.log('PASS: queue conservation, service, phase feasibility, reproducibility, analytic quantum evolution, Hamiltonian equivalence, optimizer bounds.');
