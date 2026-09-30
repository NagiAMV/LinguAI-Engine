import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewAnswer, buildReviewRows } from '../src/components/content/answer-review.mjs';
import { readFileSync } from 'node:fs';
const key = { answers: { 1: ['FALSE'], 2: ['paint', 'paints'], 3: ['B'], 4: ['D'] } };
test('compares explicit alternatives without case or whitespace sensitivity', () => {
  assert.equal(reviewAnswer(' false ', [1], key).status, 'correct');
  assert.equal(reviewAnswer('PAINTS', [2], key).status, 'correct');
  assert.equal(reviewAnswer('painting', [2], key).status, 'incorrect');
});
test('does not grade missing keys or mark blanks as correct', () => {
  assert.equal(reviewAnswer('anything', [5], key).status, 'pending');
  assert.equal(reviewAnswer('', [5], key).status, 'pending');
  assert.equal(reviewAnswer('', [1], key).status, 'blank');
  assert.equal(reviewAnswer('', [], key).status, 'pending');
});
test('multiple choice is order independent and requires the exact set', () => {
  assert.equal(reviewAnswer(['D', 'B'], [3,4], key, true).status, 'correct');
  assert.equal(reviewAnswer(['B'], [3,4], key, true).status, 'incorrect');
  assert.equal(reviewAnswer(['B','D','E'], [3,4], key, true).status, 'incorrect');
  assert.equal(reviewAnswer(['B','B'], [3,4], key, true).status, 'incorrect');
  assert.equal(reviewAnswer(['B','D'], [3,5], key, true).status, 'pending');
});
test('imported key remains attached to the verified test and question range', () => {
  const keys = JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json', import.meta.url)));
  assert.equal(keys['reading-19-1'].parts[1].questionNumbers.length, 13);
  assert.equal(reviewAnswer('paint', [8], keys['reading-19-1']).status, 'correct');
  assert.equal(reviewAnswer('spin', [9], keys['reading-19-1']).status, 'incorrect');
  assert.equal(reviewAnswer('anything', [14], keys['reading-19-2']).status, 'pending');
});

test('normalizes repeated whitespace but never drops articles', () => {
  const fixture = { answers: { 1: ['the old hall'], 2: ['an apple', 'apple'] } };
  assert.equal(reviewAnswer(' THE   OLD\tHALL ', [1], fixture).status, 'correct');
  assert.equal(reviewAnswer('old hall', [1], fixture).status, 'incorrect');
  assert.equal(reviewAnswer('apple', [2], fixture).status, 'correct');
  assert.equal(reviewAnswer('a apple', [2], fixture).status, 'incorrect');
});

test('explicit alternative sets cannot be combined into an unverified set', () => {
  // Synthetic fixtures only, never saved as Cambridge answers.
  const fixture = { parts: { 1: { groups: [{ questions: [21,22], acceptedSets: [['B','D'], ['A','C']] }] } } };
  assert.equal(reviewAnswer(['D','B'], [21,22], fixture, true).status, 'correct');
  assert.equal(reviewAnswer(['C','A'], [21,22], fixture, true).status, 'correct');
  assert.equal(reviewAnswer(['B','C'], [21,22], fixture, true).status, 'incorrect');
  assert.equal(reviewAnswer([], [21,22], fixture, true).status, 'blank');
  assert.equal(reviewAnswer(['B','B'], [21,22], fixture, true).status, 'incorrect');
});

test('new verified Cambridge 19 keys handle real alternatives and unordered pairs', () => {
  const keys = JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json', import.meta.url)));
  const first = keys['reading-19-1'];
  const second = keys['reading-19-2'];
  assert.equal(Object.keys(first.answers).length, 40);
  assert.equal(reviewAnswer(['D','B'], [20,21], first, true).status, 'correct');
  assert.equal(reviewAnswer(['B','B'], [20,21], first, true).status, 'incorrect');
  assert.equal(reviewAnswer(['E','C'], [22,23], first, true).status, 'correct');
  assert.equal(reviewAnswer(['B'], [20,21], first, true).status, 'incorrect');
  assert.equal(reviewAnswer(' labor ', [4], second).status, 'correct');
  assert.equal(reviewAnswer('LABOUR', [4], second).status, 'correct');
  assert.equal(reviewAnswer('the labour', [4], second).status, 'incorrect');
  assert.equal(reviewAnswer('', [4], second).status, 'blank');
  assert.equal(reviewAnswer('anything', [14], second).status, 'pending');
});

test('Cambridge 1 Reading Test 1 Part 1 uses saved source keys', () => {
  const keys = JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json', import.meta.url)));
  const first = keys['reading-1-1'];
  assert.equal(first.parts[1].questionNumbers.length, 15);
  assert.equal(reviewAnswer(' PRESERVE ', [1], first).status, 'correct');
  assert.equal(reviewAnswer('make', [1], first).status, 'incorrect');
  assert.equal(reviewAnswer('f', [9], first).status, 'correct');
  assert.equal(reviewAnswer('', [8], first).status, 'blank');
  assert.equal(reviewAnswer('anything', [16], undefined).status, 'pending');
});

test('user-transcribed Cambridge 1 Test 1 accepts exact alternatives and all triple permutations', () => {
  const k=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-1-1'];
  assert.equal(Object.keys(k.answers).length,40);
  for(const value of k.answers[32]) assert.equal(reviewAnswer(value,[32],k).status,'correct');
  for(const value of k.answers[35]) assert.equal(reviewAnswer(value,[35],k).status,'correct');
  for(const value of [['A','D','E'],['A','E','D'],['D','A','E'],['D','E','A'],['E','A','D'],['E','D','A']]) assert.equal(reviewAnswer(value,[26,27,28],k,true).status,'correct');
  assert.equal(reviewAnswer(['A','D'],[26,27,28],k,true).status,'incorrect');
  assert.equal(reviewAnswer(['A','D','B'],[26,27,28],k,true).status,'incorrect');
  assert.equal(reviewAnswer('the timber and stone',[29],k).status,'incorrect');
  assert.equal(reviewAnswer('',[29],k).status,'blank');
  assert.ok(k.sources.some(s=>s.part===3&&s.type==='user-transcription'));
});

test('Cambridge 1 Test 2 covers 41 questions and explicit optional words', () => {
  const k=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-1-2'];
  assert.equal(Object.keys(k.answers).length,41);
  for(const text of ['cells','HEXAGONAL CELLS','comb']) assert.equal(reviewAnswer(text,[20],k).status,'correct');
  for(const text of ['frames','frames of comb']) assert.equal(reviewAnswer(text,[21],k).status,'correct');
  assert.equal(reviewAnswer('the frames',[21],k).status,'incorrect');
  assert.equal(reviewAnswer(' BROOD   CHAMBER ',[23],k).status,'correct');
  assert.equal(reviewAnswer('III',[28],k).status,'correct');
  assert.equal(reviewAnswer('15-20%',[8],k).status,'correct');
  assert.equal(reviewAnswer('40%',[8],k).status,'incorrect');
  assert.equal(reviewAnswer('h',[41],k).status,'correct');
  assert.equal(reviewAnswer('',[41],k).status,'blank');
});

test('connected user files cover Cambridge 1 and Cambridge 2 tests 1–3', () => {
  const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
  for(const [id,total] of [['reading-1-3',38],['reading-1-4',39],['reading-2-1',40],['reading-2-2',40],['reading-2-3',40]]) assert.equal(Object.keys(keys[id].answers).length,total);
  assert.equal(reviewAnswer(['G','B','F','D'],[35,36,37,38],keys['reading-1-3'],true).status,'correct');
  assert.equal(reviewAnswer('ROSTERS',[9],keys['reading-2-3']).status,'correct');
  assert.equal(reviewAnswer('may become extinct',[36],keys['reading-1-4']).status,'correct');
});
test('unordered answers across separate text fields form one review row', () => {
  const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
  const data=JSON.parse(readFileSync(new URL('../public/cambridge/reading-2-1.json',import.meta.url)));
  const questions=data.parts.flatMap((p,partIndex)=>p.fieldNames.map(name=>({name,number:p.fieldLabels[name].replace('Question ',''),id:name,partIndex,multiple:false})));
  const q10=questions.find(q=>q.number==='10'),q11=questions.find(q=>q.number==='11');
  const answers={[q10.name]:'SEA WALLS',[q11.name]:'Lantau Island'};
  let rows=buildReviewRows(data,questions,answers,[],keys[data.id]);
  assert.equal(rows.filter(r=>r.numbers==='10–11').length,1);
  assert.equal(rows.find(r=>r.numbers==='10–11').status,'correct');
  assert.equal(rows.length,39);
  rows=buildReviewRows(data,questions,{[q10.name]:'Lantau Island',[q11.name]:'Lantau Island'},[],keys[data.id]);
  assert.equal(rows.find(r=>r.numbers==='10–11').status,'incorrect');
});
test('confirmed four-category group rejects repeated categories and accepts permutations', () => {
  const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
  const k=keys['reading-2-2'];
  assert.equal(reviewAnswer(['technical glossaries','industrial training schemes','translation services','part-time language courses'],[21,22,23,24],k,true).status,'correct');
  assert.equal(reviewAnswer(['training','industrial training','translation services','glossaries'],[21,22,23,24],k,true).status,'incorrect');
  assert.equal(reviewAnswer(['training','translation services','glossaries'],[21,22,23,24],k,true).status,'incorrect');
});

test('Cambridge 2 Test 4 preserves supplied variants and full coverage', () => {
  const k=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-2-4'];
  assert.equal(Object.keys(k.answers).length,40);
  for(const answer of ['Apollo programme','APOLLO SPACE PROGRAMME']) assert.equal(reviewAnswer(answer,[27],k).status,'correct');
  for(const answer of ['next century','early next century']) assert.equal(reviewAnswer(answer,[28],k).status,'correct');
  assert.equal(reviewAnswer('the next century',[28],k).status,'incorrect');
  assert.equal(reviewAnswer('7,000',[29],k).status,'correct');
  assert.equal(reviewAnswer(' CYSTIC   FIBROSIS ',[32],k).status,'correct');
  assert.equal(reviewAnswer('',[40],k).status,'blank');
  const status=JSON.parse(readFileSync(new URL('../src/data/cambridge-key-status.json',import.meta.url)));
  for(const book of [1,2])for(let t=1;t<=4;t++)assert.equal(status['reading-'+book+'-'+t].status,'complete');
});

test('Cambridge 3 Test 1 preserves all keys and accepts either order for 34–35', () => {
  const k=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-3-1'];
  assert.equal(Object.keys(k.answers).length,40);
  assert.equal(reviewAnswer('IV',[1],k).status,'correct');
  assert.equal(reviewAnswer(' not   given ',[19],k).status,'correct');
  for(const pair of [['B','F'],['F','B']]) assert.equal(reviewAnswer(pair,[34,35],k,true).status,'correct');
  for(const pair of [['B'],['B','B'],['B','D']]) assert.equal(reviewAnswer(pair,[34,35],k,true).status,'incorrect');
  assert.equal(reviewAnswer('',[40],k).status,'blank');
  assert.equal(reviewAnswer('A',[40],k).status,'incorrect');
});

test('Cambridge 3 Test 2 preserves explicit spelling and number alternatives', () => {
  const k=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-3-2'];
  assert.equal(Object.keys(k.answers).length,40);
  for(const answer of ['2-5','TWO TO FIVE']) assert.equal(reviewAnswer(answer,[11],k).status,'correct');
  assert.equal(k.answers[13].length,8);
  for(const word of ['tunneling','tunnelling','tunneler','tunneller'])for(const suffix of ['', ' species']) assert.equal(reviewAnswer('SOUTH AFRICAN '+word+suffix,[13],k).status,'correct');
  assert.equal(reviewAnswer('tunnelling',[13],k).status,'incorrect');
  assert.equal(reviewAnswer('role set',[36],k).status,'incorrect');
  assert.equal(reviewAnswer(' ROLE   SIGN ',[36],k).status,'correct');
  assert.equal(reviewAnswer('',[40],k).status,'blank');
});

test('Cambridge 3 Test 3 preserves case-insensitive keys and unordered triple', () => {
  const k=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-3-3'];
  assert.equal(Object.keys(k.answers).length,40);
  assert.equal(reviewAnswer('ts',[7],k).status,'correct');
  assert.equal(reviewAnswer('VI',[15],k).status,'correct');
  assert.equal(reviewAnswer('NOT   GIVEN',[29],k).status,'correct');
  for(const set of [['B','D','E'],['B','E','D'],['D','B','E'],['D','E','B'],['E','B','D'],['E','D','B']]) assert.equal(reviewAnswer(set,[35,36,37],k,true).status,'correct');
  for(const set of [['B','D'],['B','B','E'],['B','D','F']]) assert.equal(reviewAnswer(set,[35,36,37],k,true).status,'incorrect');
  assert.equal(reviewAnswer('',[40],k).status,'blank');
});

test('Cambridge 3 Test 4 maps confirmed numbering shift and preserves variants', () => {
  const k=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-3-4'];
  assert.equal(Object.keys(k.answers).length,41);
  assert.equal(reviewAnswer(['E','D'],[16,17],k,true).status,'correct');
  assert.equal(reviewAnswer(['D'],[16,17],k,true).status,'incorrect');
  for(const value of ['advertising','selling advertising','advertising space','selling advertising space']) assert.equal(reviewAnswer(value,[18],k).status,'correct');
  for(const value of ['colour scheme','three colours','purple, white, green','purple, white, and green']) assert.equal(reviewAnswer(value,[19],k).status,'correct');
  assert.equal(reviewAnswer("THE WOMAN'S EXHIBITION",[20],k).status,'correct');
  assert.equal(reviewAnswer('NO',[21],k).status,'correct');
  assert.equal(reviewAnswer('A',[29],k).status,'correct');
  for(const value of ['supervision','leadership','management']) assert.equal(reviewAnswer(value,[32],k).status,'correct');
  assert.equal(reviewAnswer('group methods of leadership',[35],k).status,'correct');
  assert.equal(reviewAnswer('decreased',[37],k).status,'correct');
  assert.equal(reviewAnswer('F',[41],k).status,'correct');
  assert.equal(reviewAnswer('G',[41],k).status,'incorrect');
  const statuses=JSON.parse(readFileSync(new URL('../src/data/cambridge-key-status.json',import.meta.url)));
  for(let book=1;book<=3;book++)for(let test=1;test<=4;test++)assert.equal(statuses['reading-'+book+'-'+test].status,'complete');
});

test('Cambridge 4 Test 1 requires both words within a single answer', () => {
  const k=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-4-1'];
  assert.equal(Object.keys(k.answers).length,40);
  for(const [number,a,b] of [[17,'forward','downward'],[21,'bowhead','humpback']]) {
    for(const words of [[a,b],[b,a]])for(const separator of [' ', ', ', ' and '])assert.equal(reviewAnswer(words.join(separator).toUpperCase(),[number],k).status,'correct');
    for(const value of [a,b,a+' '+a,a+' '+b+' extra'])assert.equal(reviewAnswer(value,[number],k).status,'incorrect');
    assert.equal(reviewAnswer('',[number],k).status,'blank');
  }
  for(const value of ['freshwater dolphin','freshwater dolphins','the freshwater dolphin','the freshwater dolphins'])assert.equal(reviewAnswer(value,[18],k).status,'correct');
  for(const value of ['clear water','clear waters','clear open water','clear open waters'])assert.equal(reviewAnswer(value,[25],k).status,'correct');
  assert.equal(reviewAnswer('airborne flying fish',[24],k).status,'correct');
  assert.equal(reviewAnswer('flying fish',[24],k).status,'incorrect');
});

test('Cambridge 4 Test 2 preserves explicit alternatives and the unordered triple', () => {
  const k=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-4-2'];
  assert.equal(Object.keys(k.answers).length,40);
  for(const value of ['economic globalisation','economic globalization','socio-economic pressures'])assert.equal(reviewAnswer(value,[2],k).status,'correct');
  assert.equal(reviewAnswer('economic globalism',[2],k).status,'incorrect');
  for(const value of ['emotional','emotional problems'])assert.equal(reviewAnswer(value,[24],k).status,'correct');
  for(const value of ['headache','headaches'])assert.equal(reviewAnswer(value,[25],k).status,'correct');
  for(const set of [['A','C','F'],['A','F','C'],['C','A','F'],['C','F','A'],['F','A','C'],['F','C','A']])assert.equal(reviewAnswer(set,[33,34,35],k,true).status,'correct');
  for(const set of [['A','C'],['A','A','F'],['A','C','G']])assert.equal(reviewAnswer(set,[33,34,35],k,true).status,'incorrect');
  const statuses=JSON.parse(readFileSync(new URL('../src/data/cambridge-key-status.json',import.meta.url)));
  assert.equal(statuses['reading-4-2'].status,'complete');
});
