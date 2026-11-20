import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const read=()=>JSON.parse(fs.readFileSync('public/practice/practice-listening-7.json')).parts[1];
test('Test 7 Part 2 separates narrator introduction and headteacher without conflicting inherited labels',()=>{
 const part=read(),audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-7-part-2.json'));
 const paragraphs=[...part.passage.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].map(m=>m[0]);assert.equal(paragraphs.length,11);
 paragraphs.forEach((p,i)=>{assert.doesNotMatch(p,/^<p data-speaker=/);assert.deepEqual([...new Set([...p.matchAll(/data-speaker="([^"]+)"/g)].map(m=>m[1]))],[i===0?'Narrator':'Headteacher']);});
 assert.equal(hash(fs.readFileSync('public'+part.audioUrls[0])),audit.audioSha256);
 assert.equal(audit.humanAuditoryReview,false);assert.equal(audit.textUnchanged,true);assert.equal(audit.wordingVerified,false);
 assert.equal(audit.voiceComparison.checks.length,11);assert.equal(audit.tailVoiceComparison.length,9);
 for(const r of [...audit.voiceComparison.checks,...audit.tailVoiceComparison])assert.equal(r.chosen,r.speaker);
 assert.equal(audit.voiceComparison.leaveOneOutControls.length,6);assert.ok(audit.voiceComparison.leaveOneOutControls.every(r=>r.label===r.chosen));
});
test('Test 7 Part 2 adds confirmed title and compound clocks while leaving paraphrased words untimed',()=>{
 const part=read(),audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-7-part-2.json'));
 const cues=[...part.passage.matchAll(/<span data-cue-start="([\d.]+)" data-cue-end="([\d.]+)">([^<]*)<\/span>/g)].map(m=>[m[1],m[2],m[3]]);
 assert.equal(cues.length,408);assert.equal(hash(JSON.stringify(cues)),audit.wordClocksSha256);
 assert.ok(cues.every(([s,e],i)=>+s>=part.transcriptStartSeconds&&+e>+s&&+e<=part.transcriptEndSeconds&&(!i||+s>=+cues[i-1][0])));
 for(const [s,e,w] of [['479.78','480.36','facilities'],['483.10','483.68','public.'],['665.78','666.66','state-of-the-art'],['793.76','794.22','right-hand']])assert.ok(cues.some(c=>c[0]===s&&c[1]===e&&c[2]===w),w);
 assert.deepEqual(audit.alignmentLimitations,[{index:151,text:'the'},{index:152,text:'museum'},{index:197,text:'to'}]);
 assert.ok(audit.alignmentLimitations.every(r=>!audit.addedClocks.some(c=>c.index===r.index)));
 assert.equal(audit.addedClocks.length,4);assert.equal(audit.correctedWordClocks.length,0);assert.equal(audit.removedClocksForPhraseMerges.length,0);
});
