import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const read=()=>JSON.parse(fs.readFileSync('public/practice/practice-listening-9.json')).parts[1];
test('Test 9 Part 2 confirms organiser and narrator through the final short reply',()=>{
 const part=read(),audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-9-part-2.json'));
 const paragraphs=[...part.passage.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].map(m=>m[0]);assert.equal(paragraphs.length,14);
 paragraphs.forEach((p,i)=>assert.deepEqual([...new Set([...p.matchAll(/data-speaker="([^"]+)"/g)].map(m=>m[1]))],[[0,8].includes(i)?'Narrator':'Organiser']));
 assert.equal(hash(fs.readFileSync('public'+part.audioUrls[0])),audit.audioSha256);
 assert.equal(audit.humanAuditoryReview,false);assert.equal(audit.textUnchanged,true);
 assert.equal(audit.voiceComparison.checks.length,14);assert.equal(audit.tailVoiceComparison.length,10);
 for(const r of [...audit.voiceComparison.checks,...audit.tailVoiceComparison])assert.equal(r.chosen,r.speaker);
 assert.equal(audit.voiceComparison.checks.at(-1).chosen,'Organiser');
 assert.equal(audit.voiceComparison.leaveOneOutControls.length,6);assert.ok(audit.voiceComparison.leaveOneOutControls.every(r=>r.label===r.chosen));
});
test('Test 9 Part 2 includes Section 2 and recovers separated hire in clocks',()=>{
 const part=read(),audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-9-part-2.json'));
 const cues=[...part.passage.matchAll(/<span data-cue-start="([\d.]+)" data-cue-end="([\d.]+)">([^<]*)<\/span>/g)].map(m=>[m[1],m[2],m[3]]);
 assert.equal(cues.length,595);assert.equal(hash(JSON.stringify(cues)),audit.wordClocksSha256);
 assert.ok(cues.every(([s,e],i)=>+s>=part.transcriptStartSeconds&&+e>+s&&+e<=part.transcriptEndSeconds&&(!i||+s>=+cues[i-1][0])));
 assert.equal(part.transcriptStartSeconds,498.7);assert.deepEqual(cues.slice(0,2),[['498.70','498.84','Section'],['498.84','499.36','2.']]);
 for(const [s,e,w] of [['564.12','564.38','tents.'],['567.66','567.96','arrange'],['598.18','598.50','hire'],['598.50','598.74','in'],['598.74','599.46','Westbury,'],['706.90','707.74','1,000'],['721.54','722.12','Cluny.'],['753.31','754.01','open-air']])assert.ok(cues.some(c=>c[0]===s&&c[1]===e&&c[2]===w),w);
 assert.equal(audit.addedClocks.length,9);assert.equal(audit.correctedWordClocks.length,1);assert.equal(audit.removedClocksForPhraseMerges.length,0);
});
