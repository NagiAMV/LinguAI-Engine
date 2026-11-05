import test from 'node:test';
import assert from 'node:assert/strict';
import {transcriptTime,currentTranscriptIndex} from '../src/components/content/transcript-follow.mjs';
test('transcript timestamps preserve section and full-recording clocks',()=>{
 assert.equal(transcriptTime('[05:17]'),317);assert.equal(transcriptTime('[20:35]'),1235);assert.equal(transcriptTime('1:02:03'),3723);assert.equal(transcriptTime('speaker'),null);assert.equal(transcriptTime('[00:99]'),null);
});
test('following handles seeking backwards, pauses, pre-roll and the end of a part',()=>{
 const entries=[{start:7},{start:35},{start:155}];
 assert.equal(currentTranscriptIndex(entries,0),-1);assert.equal(currentTranscriptIndex(entries,35),1);assert.equal(currentTranscriptIndex(entries,200),2);assert.equal(currentTranscriptIndex(entries,12),0);assert.equal(currentTranscriptIndex(entries,200,190),-1);assert.equal(currentTranscriptIndex(entries,null),-1);
});
