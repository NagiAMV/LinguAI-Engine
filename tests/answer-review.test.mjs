import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewAnswer } from '../src/components/content/answer-review.mjs';
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
  assert.equal(reviewAnswer('anything', [16], keys['reading-1-3']).status, 'pending');
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
