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

test('all sixteen Listening papers have four nonempty transcripts',()=>{
 for(let n=1;n<=16;n++){
  const paper=JSON.parse(fs.readFileSync(`public/practice/practice-listening-${n}.json`,'utf8'));
  assert.equal(paper.parts.length,4);
  for(const part of paper.parts){assert.ok(part.passage.length>1500,`Listening ${n} part ${part.id}`);assert.doesNotMatch(part.passage,/No transcript was included/);assert.notEqual(part.transcriptStatus,'not-supplied');}
 }
});
