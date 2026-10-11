import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('src/data/cambridge-review-explanations.json','utf8'));
test('every explanation has both languages and an exact quote in its own passage',()=>{
 for(const [id, entries] of Object.entries(data.tests)){
  const exam=JSON.parse(fs.readFileSync(`public/cambridge/${id}.json`,'utf8'));
  for(const [number,item] of Object.entries(entries)){
   assert.ok(item.ru.length>20 && item.en.length>20,`${id} Q${number}: bilingual explanation`);
   const passage=exam.parts.find(part=>part.id===item.part)?.passage;
   for(const quote of item.quotes||[item.quote])assert.ok(passage?.includes(quote),`${id} Q${number}: exact evidence ${quote}`);
  }
 }
});

import {evidenceExcerpt} from '../src/components/content/review-evidence.mjs';
test('evidence expands only a unique verified quote to its complete sentence',()=>{
 assert.equal(evidenceExcerpt('First sentence. The answer is in this sentence. Last sentence.','answer is').text,'The answer is in this sentence.');
 assert.equal(evidenceExcerpt('No proof here.','unknown'),null);
 assert.equal(evidenceExcerpt('Repeat. Repeat.','Repeat'),null);
});

test('Cambridge 16 Reading Test 1 has bilingual tutor explanations for all 40 questions',()=>{
 const entries=data.tests['reading-16-1'];const covered=[];
 for(const [numbers,entry] of Object.entries(entries)){
  covered.push(...numbers.split('–').map(Number));
  assert.ok(entry.en.length>200&&entry.ru.length>200,numbers);
  assert.ok(entry.location.en&&entry.location.ru,numbers);
 }
 assert.deepEqual(covered.sort((a,b)=>a-b),Array.from({length:40},(_,i)=>i+1));
 assert.equal(entries['25–26'].quotes.length,2);
 const keys=JSON.parse(fs.readFileSync('src/data/cambridge-answer-keys.json','utf8'));
 assert.deepEqual(keys['reading-16-1'].answers['32'],['E']);
 const history=JSON.parse(fs.readFileSync('docs/cambridge-16-reading-1-q32-correction.json','utf8'));
 assert.deepEqual(history.previousAcceptedAnswers,['F']);
});
