import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const read=()=>JSON.parse(fs.readFileSync('public/practice/practice-listening-6.json')).parts[1];
test('Test 6 Part 2 keeps the radio presenter distinct from surrounding exam narration',()=>{
 const part=read(),audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-6-part-2.json'));
 assert.deepEqual([...part.passage.matchAll(/data-speaker="([^"]+)"/g)].map(m=>m[1]),Array(9).fill('Radio presenter'));
 assert.equal(hash(fs.readFileSync('public'+part.audioUrls[0])),audit.audioSha256);
 assert.equal(audit.humanAuditoryReview,false);assert.equal(audit.textUnchanged,true);
 assert.equal(audit.voiceComparison.checks.length,9);assert.equal(audit.tailVoiceComparison.length,8);
 assert.equal(audit.voiceComparison.anchors.Narrator.length,3);assert.equal(audit.voiceComparison.anchors['Radio presenter'].length,3);
 for(const r of [...audit.voiceComparison.checks,...audit.tailVoiceComparison])assert.equal(r.chosen,r.speaker);
 assert.equal(audit.voiceComparison.leaveOneOutControls.length,6);assert.ok(audit.voiceComparison.leaveOneOutControls.every(r=>r.label===r.chosen));
 assert.deepEqual(part.transcriptSpeakerProvenance.partWindow,{start:458.47,end:707.77});assert.equal(part.transcriptSpeakerProvenance.partWindowEstimated,false);
});
test('Test 6 Part 2 times spoken words and preserves untimed answer-location annotations',()=>{
 const part=read(),audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-6-part-2.json'));
 const cues=[...part.passage.matchAll(/<span data-cue-start="([\d.]+)" data-cue-end="([\d.]+)">([^<]*)<\/span>/g)].map(m=>[m[1],m[2],m[3]]);
 assert.equal(cues.length,517);assert.equal(hash(JSON.stringify(cues)),audit.wordClocksSha256);
 assert.ok(cues.every(([s,e,w],i)=>+s>=part.transcriptStartSeconds&&+e>+s&&+e<=part.transcriptEndSeconds&&(!i||+s>=+cues[i-1][1])&&!/\(Q\d+\)/.test(w)));
 assert.equal((part.passage.match(/\(Q\d+\)/g)||[]).length,10);
 for(const [s,e,w] of [['465.92','466.40','volunteer'],['512.66','513.30','and/or'],['599.04','599.54','pounds.'],['671.44','671.86','Apparently,'],['684.38','684.54','be'],['684.54','684.68','in']])assert.ok(cues.some(c=>c[0]===s&&c[1]===e&&c[2]===w),w);
 assert.equal(audit.addedClocks.length,6);assert.equal(audit.correctedWordClocks.length,3);assert.equal(audit.removedClocksForPhraseMerges.length,0);
});
