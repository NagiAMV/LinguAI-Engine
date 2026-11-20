import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const read=()=>JSON.parse(fs.readFileSync('public/practice/practice-listening-2.json')).parts[1];
test('Test 2 Part 2 preserves narrator and Janice labels with calibrated acoustic checks',()=>{
 const part=read(),audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-2-part-2.json'));
 const paragraphs=[...part.passage.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].map(m=>m[0]);
 assert.equal(paragraphs.length,18);
 paragraphs.forEach((p,i)=>assert.match(p,new RegExp(`^<p data-speaker="${[0,12].includes(i)?'Narrator':'Janice'}"`)));
 assert.equal(audit.humanAuditoryReview,false);assert.equal(audit.textUnchanged,true);
 assert.equal(hash(fs.readFileSync('public'+part.audioUrls[0])),audit.audioSha256);
 assert.equal(audit.voiceComparison.checks.length,18);assert.equal(audit.tailVoiceComparison.length,15);
 for(const r of [...audit.voiceComparison.checks,...audit.tailVoiceComparison])assert.equal(r.chosen,r.speaker);
 assert.ok(audit.voiceComparison.leaveOneOutControls.every(r=>r.label===r.chosen));
});
test('Test 2 Part 2 removes cross-part clocks and repairs missing and final cues',()=>{
 const part=read(),audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-2-part-2.json'));
 const cues=[...part.passage.matchAll(/<span data-cue-start="([\d.]+)" data-cue-end="([\d.]+)">([^<]*)<\/span>/g)].map(m=>[m[1],m[2],m[3]]);
 assert.equal(part.transcriptStartSeconds,392.8);assert.equal(part.transcriptEndSeconds,768.16);
 assert.equal(cues.length,726);assert.equal(hash(JSON.stringify(cues)),audit.wordClocksSha256);
 assert.ok(cues.every(([s,e])=>+s>=392.8&&+e>+s&&+e<=768.16));
 for(const word of ['10,000','organization,','to nip out to','center','organize','organizing','at questions'])assert.ok(cues.some(c=>c[2]===word),word);
 assert.deepEqual(cues.at(-1),['767.76','768.16','interested.']);
 assert.equal(audit.addedClocks.length,8);assert.equal(audit.removedClocksForPhraseMerges.length,7);assert.equal(audit.correctedWordClocks.length,1);
 assert.match(audit.sourceScope,/four words remain untimed/);
});
