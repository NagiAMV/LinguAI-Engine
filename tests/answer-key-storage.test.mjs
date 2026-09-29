import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mergeVerifiedPart, saveVerifiedPart } from '../scripts/save-cambridge-answer-key.mjs';
const store = JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json', import.meta.url)));
const current = store['reading-19-1'];
const existing = { book:19, test:1, module:'reading', section:1, sourceUrl:current.sources[0].url, answers:Object.fromEntries(current.parts[1].questionNumbers.map(n=>[n,current.answers[n]])) };
test('existing verified part is idempotent and its answers are never replaced', () => {
  assert.deepEqual(mergeVerifiedPart(store, existing), store);
  assert.throws(()=>mergeVerifiedPart(store,{...existing,answers:{8:['wrong']}}), /Refusing to overwrite/);
  assert.throws(()=>mergeVerifiedPart(store,{...existing,section:2,answers:{8:['paint']}}), /another part/);
  assert.deepEqual(store['reading-19-1'].answers,current.answers);
});
test('saves each part immediately and preserves alternatives and unordered sets', () => {
  const dir=mkdtempSync(join(tmpdir(),'cambridge-key-test-'));
  const file=join(dir,'keys.json');
  const fixture={book:1,test:1,module:'reading',section:1,sourceUrl:'https://engnovate.com/fixture',answers:{1:['the hall','hall'],2:['B'],3:['D']},groups:[{questions:[2,3],acceptedSets:[['B','D']]}]};
  try {
    saveVerifiedPart(file,fixture);
    const saved=JSON.parse(readFileSync(file));
    assert.deepEqual(saved['reading-1-1'].answers,fixture.answers);
    assert.deepEqual(saved['reading-1-1'].parts[1].groups,fixture.groups);
    assert.throws(()=>saveVerifiedPart(file,{...fixture,answers:{1:['invented']},groups:[]}), /Refusing to overwrite/);
    assert.deepEqual(JSON.parse(readFileSync(file)),saved);
  } finally { unlinkSync(file); rmdirSync(dir); }
});
