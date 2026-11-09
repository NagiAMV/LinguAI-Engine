import test from 'node:test';
import assert from 'node:assert/strict';
import {withoutSelectedHighlights} from '../src/components/content/exam-annotations.mjs';

test('erase a selected highlight without changing other parts, panes or touching boundaries',()=>{
 const highlights=[{id:'a',part:1,area:'passage',start:10,end:20},{id:'b',part:1,area:'passage',start:20,end:30},{id:'c',part:1,area:'questions',start:10,end:20},{id:'d',part:2,area:'passage',start:10,end:20}];
 assert.deepEqual(withoutSelectedHighlights(highlights,{part:1,area:'passage',start:12,end:18}).map(h=>h.id),['b','c','d']);
 assert.deepEqual(withoutSelectedHighlights(highlights,{part:1,area:'passage',start:0,end:10}),highlights);
 assert.deepEqual(withoutSelectedHighlights(highlights,{part:1,area:'passage',start:12,end:25}).map(h=>h.id),['c','d']);
 assert.equal(highlights.length,4);
});
