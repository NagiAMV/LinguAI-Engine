import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
test('independent collections contain sixteen Listening tests, eight full Reading and forty-seven single passages',()=>{
 for(const [name,count,resource] of [['practice-listening-catalog',16,'listening'],['practice-reading-catalog',8,'reading'],['single-passage-reading-catalog',47,'reading']]){
  const items=JSON.parse(fs.readFileSync(`src/data/${name}.json`,'utf8'));assert.equal(items.length,count);assert.equal(new Set(items.map(i=>i.id)).size,count);
  const keys=JSON.parse(fs.readFileSync(`src/data/${resource==='listening'?'practice-listening-keys':name==='single-passage-reading-catalog'?'single-passage-reading-keys':'practice-reading-keys'}.json`,'utf8'));
  for(const item of items){const paper=JSON.parse(fs.readFileSync(`public/practice/${item.id}.json`,'utf8'));assert.equal(paper.resource,resource);assert.equal(paper.id,item.id);const sharedSlots=resource==='listening'?Object.values(keys[item.id].parts).flatMap(p=>p.groups).reduce((n,g)=>n+g.questions.length-1,0):0;assert.equal(paper.parts.flatMap(p=>p.fieldNames).length,item.questionCount-sharedSlots);}
 }
});
test('all preserved imported papers are unchanged by catalog cleanup',()=>{
 const path='.cache/preserved-practice-hashes.json';if(!fs.existsSync(path))return;
 const expected=JSON.parse(fs.readFileSync(path,'utf8'));for(const [name,hash] of Object.entries(expected)){
  let bytes=fs.readFileSync('public/practice/'+name);
  const paper=JSON.parse(bytes);
  if(paper.resource==='reading'&&paper.reviewLanguages?.join(',')==='ru,en,uz'){
   // Only the newly authorized language metadata may differ from the cleanup snapshot.
   paper.reviewLanguages=['en','uz'];bytes=Buffer.from(JSON.stringify(paper,null,2)+'\n');
  }
  const variants=[bytes,Buffer.from(bytes.toString('utf8').replace(/\r?\n/g,'\r\n'))];
  assert.ok(variants.some(value=>createHash('sha256').update(value).digest('hex')===hash),name);
 }
});
