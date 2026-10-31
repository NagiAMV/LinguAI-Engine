import test from 'node:test';import assert from 'node:assert/strict';
import {wordLimitFromText,exceedsWordLimit} from '../src/components/content/listening-questions.mjs';
test('word limits follow the latest instruction and distinguish numbers',()=>{
 assert.equal(wordLimitFromText('Write ONE WORD ONLY. Write NO MORE THAN THREE WORDS.' ).words,3);
 assert.equal(exceedsWordLimit('ring a bell',wordLimitFromText('NO MORE THAN THREE WORDS')),false);
 assert.equal(exceedsWordLimit('will ring a bell',wordLimitFromText('NO MORE THAN THREE WORDS')),true);
 assert.equal(exceedsWordLimit('well-known',wordLimitFromText('ONE WORD ONLY')),false);
 assert.equal(exceedsWordLimit('room 22',wordLimitFromText('ONE WORD AND/OR A NUMBER')),false);
 assert.equal(exceedsWordLimit('room 22',wordLimitFromText('ONE WORD OR A NUMBER')),true);
 assert.equal(exceedsWordLimit('room 22 23',wordLimitFromText('ONE WORD AND/OR A NUMBER')),true);
 assert.equal(wordLimitFromText('Write TWO WORDS. Choose TWO letters, A–E.'),null);
 assert.equal(wordLimitFromText('Write NO MORE THAN WORDS AND/OR A NUMBER'),null);
});
