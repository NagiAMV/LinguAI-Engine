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
   for(const quote of item.quotes||[item.quote]){assert.ok(passage?.includes(quote),`${id} Q${number}: exact evidence ${quote}`);assert.equal(passage.split(quote).length,2,`${id} Q${number}: unambiguous evidence`);}
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
import {withQuestionCorrections} from '../src/components/content/question-corrections.mjs';
test('Cambridge 1 all four Reading tests cover every question with tutor evidence',()=>{
 const keys=JSON.parse(fs.readFileSync('src/data/cambridge-answer-keys.json','utf8'));
 let total=0;
 for(let number=1;number<=4;number++){
  const id=`reading-1-${number}`,entries=data.tests[id];
  const covered=Object.keys(entries).flatMap(numbers=>numbers.split('–').map(Number)).sort((a,b)=>a-b);
  const expected=Object.keys(keys[id].answers).map(Number).sort((a,b)=>a-b);
  assert.deepEqual(covered,expected,id);total+=covered.length;
  for(const entry of Object.values(entries))assert.ok(entry.en.includes('Tutor tip:')||entry.en.includes('\n\n'),id);
 }
 assert.equal(total,158);
});
test('verified book wording corrections retain fields and original keys',()=>{
 const corrections=JSON.parse(fs.readFileSync('src/data/cambridge-question-corrections.json','utf8'));
 for(const id of ['reading-1-3','reading-1-4']){
  const raw=JSON.parse(fs.readFileSync(`public/cambridge/${id}.json`,'utf8'));
  const result=withQuestionCorrections(raw,corrections);
  assert.deepEqual(result.parts.map(p=>p.fieldNames),raw.parts.map(p=>p.fieldNames));
  assert.deepEqual(result.parts.map(p=>p.passage),raw.parts.map(p=>p.passage));
  for(const [part,fixes] of Object.entries(corrections[id].parts))for(const fix of fixes)assert.ok(!result.parts.find(p=>p.id===Number(part)).questions.includes(fix.before));
  assert.deepEqual(withQuestionCorrections(result,corrections),result);
 }
});

test('Cambridge 2 all four Reading tests cover all 160 questions',()=>{
 const keys=JSON.parse(fs.readFileSync('src/data/cambridge-answer-keys.json','utf8'));
 let total=0;
 for(let number=1;number<=4;number++){
  const id=`reading-2-${number}`,entries=data.tests[id];
  const covered=Object.keys(entries).flatMap(numbers=>numbers.split('–').map(Number)).sort((a,b)=>a-b);
  assert.deepEqual(covered,Object.keys(keys[id].answers).map(Number).sort((a,b)=>a-b),id);
  total+=covered.length;
  for(const entry of Object.values(entries))assert.ok(entry.en.length>160&&entry.ru.length>160,id);
 }
 assert.equal(total,160);
});


test('Cambridge 3 all four Reading tests cover all 161 current questions',()=>{
 const keys=JSON.parse(fs.readFileSync('src/data/cambridge-answer-keys.json','utf8'));
 let total=0;
 for(let number=1;number<=4;number++){
  const id=`reading-3-${number}`,entries=data.tests[id];
  const covered=Object.keys(entries).flatMap(numbers=>numbers.split('–').map(Number)).sort((a,b)=>a-b);
  assert.deepEqual(covered,Object.keys(keys[id].answers).map(Number).sort((a,b)=>a-b),id);
  total+=covered.length;
  for(const entry of Object.values(entries))assert.ok(entry.en.length>160&&entry.ru.length>160,id);
 }
 assert.equal(total,161);
 assert.equal(data.tests['reading-3-3']['35–36–37'].quotes.length,3);
 assert.deepEqual(keys['reading-3-2'].answers['40'],['C']);
});


test('Cambridge 4 all four Reading tests cover all 160 questions with specific bilingual evidence',()=>{
 const keys=JSON.parse(fs.readFileSync('src/data/cambridge-answer-keys.json','utf8'));
 let total=0;
 for(let number=1;number<=4;number++){
  const id=`reading-4-${number}`,entries=data.tests[id];
  const covered=Object.keys(entries).flatMap(numbers=>numbers.split('–').map(Number)).sort((a,b)=>a-b);
  assert.deepEqual(covered,Object.keys(keys[id].answers).map(Number).sort((a,b)=>a-b),id);
  total+=covered.length;
  for(const entry of Object.values(entries))assert.ok(entry.en.length>160&&entry.ru.length>160,id);
 }
 assert.equal(total,160);
 assert.equal(data.tests['reading-4-2']['33–34–35'].quotes.length,3);
 assert.equal(data.tests['reading-4-3']['5'].quotes.length,2);
 assert.equal(data.tests['reading-4-4']['20–21'].quotes.length,2);
});

import {reviewAnswer} from '../src/components/content/answer-review.mjs';
test('Cambridge 4 Test 2 Q4 accepts the singular required by the original summary',()=>{
 const keys=JSON.parse(fs.readFileSync('src/data/cambridge-answer-keys.json','utf8'));
 const key=keys['reading-4-2'];
 assert.equal(reviewAnswer('traditional skill',[4],key).status,'correct');
 assert.equal(reviewAnswer('traditional skills',[4],key).status,'incorrect');
 const history=JSON.parse(fs.readFileSync('docs/cambridge-4-reading-2-q4-correction.json','utf8'));
 assert.deepEqual(history.previousAcceptedAnswers,['traditional skills']);
});
