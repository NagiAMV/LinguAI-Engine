import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const read=()=>JSON.parse(fs.readFileSync('public/practice/practice-listening-3.json')).parts[1];
test('Test 3 Part 2 keeps the charity monologue with one verified voice',()=>{
 const part=read(),audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-3-part-2.json'));
 const groups=[...part.passage.matchAll(/data-speaker="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(groups,['Narrator',...Array(12).fill('Charity representative')]);
 assert.equal(audit.humanAuditoryReview,false);assert.equal(audit.wordingVerified,false);assert.equal(audit.textUnchanged,true);
 assert.equal(hash(fs.readFileSync('public'+part.audioUrls[0])),audit.audioSha256);
 assert.equal(audit.voiceComparison.checks.length,13);assert.equal(audit.tailVoiceComparison.length,12);
 for(const r of [...audit.voiceComparison.checks,...audit.tailVoiceComparison])assert.equal(r.chosen,r.speaker);
 assert.ok(audit.voiceComparison.leaveOneOutControls.every(r=>r.label===r.chosen));
 assert.equal(part.transcriptSpeakerProvenance.partWindowEstimated,false);
});
test('Test 3 Part 2 fixes introductory clocks and recovers confirmed source terms',()=>{
 const part=read(),audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-3-part-2.json'));
 const cues=[...part.passage.matchAll(/<span data-cue-start="([\d.]+)" data-cue-end="([\d.]+)">([^<]*)<\/span>/g)].map(m=>[m[1],m[2],m[3]]);
 assert.equal(part.transcriptStartSeconds,384.7);assert.equal(part.transcriptEndSeconds,764.6);
 assert.equal(cues.length,593);assert.equal(hash(JSON.stringify(cues)),audit.wordClocksSha256);
 assert.ok(cues.every(([s,e],i)=>+s>=384.7&&+e>+s&&+e<=764.6&&(!i||+s>=+cues[i-1][0])));
 assert.deepEqual(cues[0],['384.70','385.10','You']);assert.deepEqual(cues.at(-1),['764.18','764.60','small.']);
 for(const word of ['listeners.','Eyesaver','1,500','full-time','cost-efficient','Finally,','Eyecare'])assert.ok(cues.some(c=>c[2]===word),word);
 assert.equal(audit.addedClocks.length,49);assert.equal(audit.correctedWordClocks.length,4);
 assert.ok(audit.alignmentLimitations.some(r=>r.text==='30'));
 assert.ok(audit.alignmentLimitations.every(r=>!audit.addedClocks.some(c=>c.index===r.index)));
});
