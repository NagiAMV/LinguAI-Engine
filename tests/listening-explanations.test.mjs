import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const explanations=JSON.parse(fs.readFileSync('src/data/listening-explanations.json'));
const read=name=>JSON.parse(fs.readFileSync(name));
const normalize=s=>s.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&#x27;|&#39;/g,"'").replace(/\s+/g,' ').trim();
test('Listening explanations have three languages and exact transcript evidence',()=>{
 for(const [id,entries] of Object.entries(explanations)){
  const paper=read('public/practice/'+id+'.json');
  for(const [number,e] of Object.entries(entries)){
   const passage=normalize(paper.parts.find(p=>p.id===e.part).passage);
   for(const lang of ['en','ru','uz'])assert.ok(e[lang]?.length>40,`${id} ${number} ${lang}`);
   assert.ok(e.quotes.length);
   for(const quote of e.quotes)assert.ok(passage.includes(quote),`${id} ${number}: ${quote}`);
  }
 }
});
test('Published first full test and section 23 cover every key slot including grouped questions',()=>{
 for(const [id,keyFile] of [['practice-listening-1','practice-listening-keys'],['single-listening-23','single-section-listening-keys']]){
  const key=read('src/data/'+keyFile+'.json')[id];const covered=new Set();
  for(const number of Object.keys(explanations[id])){
   const [start,end]=number.split('–').map(Number);for(let n=start;n<=(end||start);n++)covered.add(String(n));
  }
  assert.deepEqual([...covered].sort(),Object.keys(key.answers).sort());
 }
});
