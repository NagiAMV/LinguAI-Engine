import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {withHeadingLists} from '../src/components/content/heading-options.mjs';
test('Cambridge 16 Test 1 restores all nine heading labels without altering fields or passage',()=>{
 const original=JSON.parse(fs.readFileSync('public/cambridge/reading-16-1.json','utf8'));
 const restored=withHeadingLists(original);const p=restored.parts[1];
 assert.equal((p.questions.match(/<li>/g)||[]).length,9);
 assert.ok(p.questions.includes('iv. A single certainty among other less definite facts'));
 assert.ok(p.questions.includes('ix. The answers to some unexpected questions'));
 assert.equal(p.passage,original.parts[1].passage);assert.deepEqual(p.fieldNames,original.parts[1].fieldNames);
 assert.deepEqual(withHeadingLists(restored),restored);
 assert.ok(!original.parts[1].questions.includes('exam-heading-options'));
});
