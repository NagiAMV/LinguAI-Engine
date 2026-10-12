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


for(const book of [5,6,7,8,9,10,11,12,13,14,15,16])test(`Cambridge ${book} covers all 160 Reading questions with bilingual reasoning and evidence`,()=>{
 const keys=JSON.parse(fs.readFileSync('src/data/cambridge-answer-keys.json','utf8'));
 let total=0;
 for(let number=1;number<=4;number++){
  const id=`reading-${book}-${number}`,entries=data.tests[id];
  const covered=Object.keys(entries).flatMap(numbers=>numbers.split('–').map(Number)).sort((a,b)=>a-b);
  assert.deepEqual(covered,Object.keys(keys[id].answers).map(Number).sort((a,b)=>a-b),id);
  total+=covered.length;
  for(const entry of Object.values(entries)){assert.ok(entry.en.length>120&&entry.ru.length>120,id);assert.ok(entry.en.includes('\n\n')&&entry.ru.includes('\n\n'),id);}
 }
 assert.equal(total,160);
});

test('Cambridge 5 and 6 source corrections keep audit history and grade restored answers',()=>{
 const keys=JSON.parse(fs.readFileSync('src/data/cambridge-answer-keys.json','utf8'));
 for(const [id,n,value] of [['reading-5-1',38,'E'],['reading-5-3',2,'B'],['reading-5-4',22,'E'],['reading-6-3',2,'I']])assert.equal(reviewAnswer(value,[n],keys[id]).status,'correct');
 const key=keys['reading-6-1'];
 assert.equal(reviewAnswer('i',[27],key).status,'correct');assert.equal(reviewAnswer('D',[27],key).status,'incorrect');
 assert.equal(reviewAnswer(['fish','sea mammals'],[34,35],key,true).status,'correct');
 assert.equal(reviewAnswer(['fish','fish'],[34,35],key,true).status,'incorrect');
 assert.deepEqual(Object.keys(data.tests['reading-6-1']).filter(n=>n.includes('–')),['34–35']);
 const history=JSON.parse(fs.readFileSync('docs/cambridge-6-reading-1-key-corrections.json','utf8'));assert.equal(history.changes.length,14);
});


test('Cambridge 7 Test 3 restores its original migration map without altering answer fields',()=>{
 const corrections=JSON.parse(fs.readFileSync('src/data/cambridge-question-corrections.json','utf8'));
 const raw=JSON.parse(fs.readFileSync('public/cambridge/reading-7-3.json','utf8'));
 const fixed=withQuestionCorrections(raw,corrections);
 assert.deepEqual(fixed.parts.map(p=>p.fieldNames),raw.parts.map(p=>p.fieldNames));
 assert.deepEqual(fixed.parts.map(p=>p.passage),raw.parts.map(p=>p.passage));
 assert.ok(fixed.parts[1].questions.includes('/cambridge/assets/reading-7-3-migration-map.png'));
 assert.ok(!fixed.parts[1].questions.includes('cambridge-ielts-08-academic-listening-test-4-q20-21.png'));
 assert.ok(fs.statSync('public/cambridge/assets/reading-7-3-migration-map.png').size>1000);
 assert.deepEqual(withQuestionCorrections(fixed,corrections),fixed);
});


test('Cambridge 9 Test 3 original notes require both names without prefilled answers',()=>{
 const corrections=JSON.parse(fs.readFileSync('src/data/cambridge-question-corrections.json','utf8'));
 const raw=JSON.parse(fs.readFileSync('public/cambridge/reading-9-3.json','utf8'));
 const fixed=withQuestionCorrections(raw,corrections);
 assert.deepEqual(fixed.parts.map(p=>p.fieldNames),raw.parts.map(p=>p.fieldNames));
 assert.deepEqual(fixed.parts.map(p=>p.passage),raw.parts.map(p=>p.passage));
 assert.ok(!fixed.parts[2].questions.includes('and Saturn, then left'));
 assert.ok(!fixed.parts[2].questions.includes('both the sensors and'));
 assert.deepEqual(withQuestionCorrections(fixed,corrections),fixed);
 const keys=JSON.parse(fs.readFileSync('src/data/cambridge-answer-keys.json','utf8'));
 assert.equal(reviewAnswer('Jupiter Saturn',[33],keys['reading-9-3']).status,'correct');
 assert.equal(reviewAnswer('Jupiter',[33],keys['reading-9-3']).status,'incorrect');
 assert.equal(reviewAnswer('sensors circuits',[35],keys['reading-9-3']).status,'correct');
 assert.equal(reviewAnswer('circuits',[35],keys['reading-9-3']).status,'incorrect');
});
test('Cambridge 8 Test 1 Q5 matches the original Egyptians option and retains previous key history',()=>{
 const keys=JSON.parse(fs.readFileSync('src/data/cambridge-answer-keys.json','utf8'));
 const history=JSON.parse(fs.readFileSync('docs/cambridge-8-reading-1-q5-correction.json','utf8'));
 assert.deepEqual(history.previousAcceptedAnswers,['D']);
 assert.equal(reviewAnswer('B',[5],keys['reading-8-1']).status,'correct');
 assert.equal(reviewAnswer('D',[5],keys['reading-8-1']).status,'incorrect');
});


test('Cambridge 10 restored key and wording agree with full answers without changing fields',()=>{
 const keys=JSON.parse(fs.readFileSync('src/data/cambridge-answer-keys.json','utf8'));
 const corrections=JSON.parse(fs.readFileSync('src/data/cambridge-question-corrections.json','utf8'));
 const history=JSON.parse(fs.readFileSync('docs/cambridge-10-reading-corrections.json','utf8'));
 assert.deepEqual(history.changes[0].previousAcceptedAnswers,['F']);
 assert.equal(reviewAnswer('E',[32],keys['reading-10-1']).status,'correct');
 assert.equal(reviewAnswer('F',[32],keys['reading-10-1']).status,'incorrect');
 for(const number of [1,2]){
  const raw=JSON.parse(fs.readFileSync(`public/cambridge/reading-10-${number}.json`,'utf8'));
  const fixed=withQuestionCorrections(raw,corrections);
  assert.deepEqual(fixed.parts.map(p=>p.fieldNames),raw.parts.map(p=>p.fieldNames));
  assert.deepEqual(fixed.parts.map(p=>p.passage),raw.parts.map(p=>p.passage));
  assert.deepEqual(withQuestionCorrections(fixed,corrections),fixed);
  if(number===1){assert.ok(fixed.parts[0].questions.includes('Restored in the 1960s'));assert.ok(!fixed.parts[0].questions.includes('Restored in the 1990s'));}
  else {assert.ok(!fixed.parts[1].questions.includes('availability of books and'));assert.equal(reviewAnswer('books activities',[23],keys['reading-10-2']).status,'correct');assert.equal(reviewAnswer('activities',[23],keys['reading-10-2']).status,'incorrect');}
 }
});

test('Cambridge 11 Test 4 corrections match the original printed answer key',()=>{
 const keys=JSON.parse(fs.readFileSync('src/data/cambridge-answer-keys.json','utf8'));
 const history=JSON.parse(fs.readFileSync('docs/cambridge-11-reading-4-corrections.json','utf8'));
 assert.equal(history.printedPage,131);
 for(const [number,answer] of [[7,'B'],[12,'E']]){
  assert.deepEqual(keys['reading-11-4'].answers[number],[answer]);
  assert.deepEqual(history.corrections.find(c=>c.question===number).previousAcceptedAnswers,['F']);
  assert.equal(reviewAnswer(answer,[number],keys['reading-11-4']).status,'correct');
  assert.equal(reviewAnswer('F',[number],keys['reading-11-4']).status,'incorrect');
 }
});

test('Cambridge 13 Test 4 restores the summary date without changing fields or passage',()=>{
 const corrections=JSON.parse(fs.readFileSync('src/data/cambridge-question-corrections.json','utf8'));
 const raw=JSON.parse(fs.readFileSync('public/cambridge/reading-13-4.json','utf8'));
 const result=withQuestionCorrections(raw,corrections);
 assert.ok(raw.parts[2].questions.includes('In the 1970s he suggested'));
 assert.ok(result.parts[2].questions.includes('In the 1790s he suggested'));
 assert.ok(!result.parts[2].questions.includes('In the 1970s he suggested'));
 assert.deepEqual(result.parts.map(p=>p.fieldNames),raw.parts.map(p=>p.fieldNames));
 assert.deepEqual(result.parts.map(p=>p.passage),raw.parts.map(p=>p.passage));
 assert.deepEqual(withQuestionCorrections(result,corrections),result);
});

test('Cambridge 14-16 verified corrections accept the printed key and reject old mismatches',()=>{
 const keys=JSON.parse(fs.readFileSync('src/data/cambridge-answer-keys.json','utf8'));
 for(const [id,n,correct,old] of [['reading-14-1',14,'E','C'],['reading-14-3',20,'E','F'],['reading-14-3',29,'F','E'],['reading-15-1',33,'E','F'],['reading-15-1',36,'E','F'],['reading-15-2',36,'E','F'],['reading-16-2',14,'D','B']]){
  assert.equal(reviewAnswer(correct,[n],keys[id]).status,'correct',id+' '+n);
  assert.equal(reviewAnswer(old,[n],keys[id]).status,'incorrect',id+' '+n);
 }
 for(const pair of [['D','E'],['E','D']])assert.equal(reviewAnswer(pair,[21,22],keys['reading-14-1'],true).status,'correct');
 assert.equal(reviewAnswer(['D','F'],[21,22],keys['reading-14-1'],true).status,'incorrect');
});

test('Cambridge 15 corrected question presentation matches grading and preserves original fields',()=>{
 const keys=JSON.parse(fs.readFileSync('src/data/cambridge-answer-keys.json','utf8'));
 const corrections=JSON.parse(fs.readFileSync('src/data/cambridge-question-corrections.json','utf8'));
 for(const id of ['reading-15-2','reading-15-3','reading-15-4']){
  const raw=JSON.parse(fs.readFileSync(`public/cambridge/${id}.json`,'utf8'));
  const fixed=withQuestionCorrections(raw,corrections);
  assert.deepEqual(fixed.parts.map(p=>p.fieldNames),raw.parts.map(p=>p.fieldNames));
  assert.deepEqual(fixed.parts.map(p=>p.passage),raw.parts.map(p=>p.passage));
  assert.deepEqual(withQuestionCorrections(fixed,corrections),fixed);
  if(id==='reading-15-2'){
   for(const [n,correct] of [[37,'NOT GIVEN'],[38,'YES'],[39,'NO'],[40,'NO']]){
    assert.ok(fixed.parts[2].questions.includes(`aria-label="Question ${n}: ${correct}"`));
    assert.equal(reviewAnswer(correct,[n],keys[id]).status,'correct');
   }
   assert.ok(!fixed.parts[2].questions.includes('value="TRUE"'));
   assert.ok(!fixed.parts[2].questions.includes('value="FALSE"'));
  }else if(id==='reading-15-3')assert.ok(fixed.parts[1].questions.includes('seven paragraphs, <strong>A-G</strong>'));
  else{
   assert.ok(!fixed.parts[0].questions.includes('Leaves and <span'));
   assert.equal(reviewAnswer('leaves bark',[7],keys[id]).status,'correct');
   assert.equal(reviewAnswer('leaves and bark',[7],keys[id]).status,'correct');
   assert.equal(reviewAnswer('bark',[7],keys[id]).status,'incorrect');
  }
 }
});
