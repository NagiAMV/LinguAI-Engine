import test from 'node:test';
import assert from 'node:assert/strict';
import { annotationId } from '../src/components/content/exam-annotations.mjs';
test('annotation IDs work on HTTP where randomUUID is unavailable', () => {
 const descriptor = Object.getOwnPropertyDescriptor(Crypto.prototype, 'randomUUID');
 try {
  Object.defineProperty(Crypto.prototype, 'randomUUID', { value: undefined, configurable: true });
  const first = annotationId(), second = annotationId();
  assert.match(first, /^[a-f0-9]{32}$/);
  assert.notEqual(first, second);
 } finally { Object.defineProperty(Crypto.prototype, 'randomUUID', descriptor); }
});

import { uncoveredHighlights } from '../src/components/content/exam-annotations.mjs';
const selection = {part:1,area:'passage',start:0,end:10,text:'abcdefghij'};
const existing = (start,end,part=1,area='passage')=>({start,end,part,area,color:'yellow'});
test('highlight mode skips text that is already highlighted, even in another colour',()=>{
 assert.deepEqual(uncoveredHighlights(selection,[existing(0,10)]),[]);
 assert.deepEqual(uncoveredHighlights(selection,[existing(0,5),existing(5,10)]),[]);
});
test('partially overlapping highlights preserve existing text and add only new pieces',()=>{
 const pieces=uncoveredHighlights(selection,[existing(2,5),existing(7,9)]);
 assert.deepEqual(pieces.map(p=>[p.start,p.end,p.text]),[[0,2,'ab'],[5,7,'fg'],[9,10,'j']]);
});
test('highlight overlap is scoped to the same passage and section',()=>{
 assert.deepEqual(uncoveredHighlights(selection,[existing(0,10,2),existing(0,10,1,'questions')]),[selection]);
});
