import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('practice catalogs and keys contain no broken UTF-8 sequences',()=>{
 const files=[...fs.readdirSync('src/data').filter(n=>n.endsWith('.json')).map(n=>'src/data/'+n),...fs.readdirSync('public/practice').filter(n=>n.endsWith('.json')).map(n=>'public/practice/'+n)];
 for(const file of files){const s=fs.readFileSync(file,'utf8');assert.doesNotMatch(s,/\uFFFD|\u00c3[\u0080-\u00bf\u0192]|\u00c2[\u0080-\u00bf]|\u00e2\u20ac/,file);}
 const c=JSON.parse(fs.readFileSync('src/data/practice-listening-catalog.json','utf8'));assert.equal(c[0].topics,'Manor Farm · Sports centre · House prices · Drama activities');
});
test('Speaking bank retains 68 complete sets with questions and model answers in all parts',()=>{
 const bank=JSON.parse(fs.readFileSync('src/data/speaking-question-bank.json','utf8'));assert.equal(bank.sessions.length,68);assert.equal(new Set(bank.sessions.map(s=>s.n)).size,68);
 for(const s of bank.sessions){assert.ok(s.t2.length>4);assert.ok(s.p2.task&&s.p2.ans&&s.p2.bullets.length);for(const p of [s.p1,s.p3]){assert.ok(p.length);assert.ok(p.every(q=>q.length===2&&q[0]&&q[1]));}}
});

test('Listening 12 explicitly reports a missing script; 13–15 keep supplied scripts',()=>{
 for(let n=12;n<=15;n++){
  const paper=JSON.parse(fs.readFileSync(`public/practice/practice-listening-${n}.json`,'utf8'));
  for(const part of paper.parts){if(n===12){assert.equal(part.transcriptStatus,'not-supplied');assert.match(part.passage,/No transcript was included/);}else assert.ok(part.passage.length>1500);}
 }
});
