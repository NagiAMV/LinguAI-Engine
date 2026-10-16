import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
test('independent collections contain six Listening tests, one full Reading and ten single passages',()=>{
 for(const [name,count,resource] of [['practice-listening-catalog',6,'listening'],['practice-reading-catalog',1,'reading'],['single-passage-reading-catalog',10,'reading']]){
  const items=JSON.parse(fs.readFileSync(`src/data/${name}.json`,'utf8'));assert.equal(items.length,count);assert.equal(new Set(items.map(i=>i.id)).size,count);
  const keys=JSON.parse(fs.readFileSync(`src/data/${resource==='listening'?'practice-listening-keys':name==='single-passage-reading-catalog'?'single-passage-reading-keys':'practice-reading-keys'}.json`,'utf8'));
  for(const item of items){const paper=JSON.parse(fs.readFileSync(`public/practice/${item.id}.json`,'utf8'));assert.equal(paper.resource,resource);assert.equal(paper.id,item.id);const sharedSlots=resource==='listening'?Object.values(keys[item.id].parts).flatMap(p=>p.groups).reduce((n,g)=>n+g.questions.length-1,0):0;assert.equal(paper.parts.flatMap(p=>p.fieldNames).length,item.questionCount-sharedSlots);}
 }
});
test('all preserved imported papers are unchanged by catalog cleanup',()=>{
 const path='.cache/preserved-practice-hashes.json';if(!fs.existsSync(path))return;
 const expected=JSON.parse(fs.readFileSync(path,'utf8'));for(const [name,hash] of Object.entries(expected))assert.equal(createHash('sha256').update(fs.readFileSync('public/practice/'+name)).digest('hex'),hash,name);
});
