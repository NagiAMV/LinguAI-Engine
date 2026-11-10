import test from 'node:test';
import assert from 'node:assert/strict';
import {transcriptClock} from '../src/components/content/transcript-timestamps.mjs';
import {transcriptTime} from '../src/components/content/transcript-follow.mjs';
test('generated clocks round down for display without changing their source timeline',()=>{
 for(const seconds of [0,8.88,61.42,1291.86,3600,7325.4])assert.equal(transcriptTime(transcriptClock(seconds)),Math.floor(seconds));
 assert.equal(transcriptClock(1291.86),'[21:31]');assert.equal(transcriptClock(7325.4),'[02:02:05]');
});
