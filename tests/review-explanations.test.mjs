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
   assert.ok(passage?.includes(item.quote),`${id} Q${number}: exact evidence`);
  }
 }
});

import {evidenceExcerpt} from '../src/components/content/review-evidence.mjs';
test('evidence expands only a unique verified quote to its complete sentence',()=>{
 assert.equal(evidenceExcerpt('First sentence. The answer is in this sentence. Last sentence.','answer is').text,'The answer is in this sentence.');
 assert.equal(evidenceExcerpt('No proof here.','unknown'),null);
 assert.equal(evidenceExcerpt('Repeat. Repeat.','Repeat'),null);
});
