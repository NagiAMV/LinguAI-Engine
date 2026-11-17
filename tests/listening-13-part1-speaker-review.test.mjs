import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {currentTranscriptIndex} from '../src/components/content/transcript-follow.mjs';
test('Test 13 Part 1 short name, clarification and farewell have playable timestamps',()=>{
 const part=JSON.parse(fs.readFileSync('public/practice/practice-listening-13.json')).parts[0];
 const paragraphs=[...part.passage.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].map(m=>m[0]);
 for(const i of [2,13,60])assert.match(paragraphs[i],/data-cue-start="[\d.]+" data-cue-end="[\d.]+"/,`missing time for paragraph ${i}`);
 assert.ok(part.transcriptEndSeconds>373,'Part must include the final manager farewell');
 const audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-13-part-1.json')),hash=x=>createHash('sha256').update(x).digest('hex');
 assert.equal(hash(fs.readFileSync('public'+part.audioUrls[0])),audit.audioSha256);assert.equal(audit.humanAuditoryReview,false);assert.equal(audit.textUnchanged,true);assert.equal(audit.originalWordClocksUnchanged,true);
 assert.equal(audit.voiceComparison.checks.length,64);assert.ok(audit.voiceComparison.checks.filter(r=>r.index!==undefined).every(r=>r.chosen===r.sourceLabel));assert.ok(audit.voiceComparison.leaveOneOutControls.every(r=>r.label===r.chosen));
 assert.equal(audit.additionalShortReplyVerification.contextChecks[0].chosen,'M');assert.equal(audit.additionalShortReplyVerification.contextChecks[1].chosen,'P');
 assert.equal(audit.addedUtteranceCues.length,3);assert.ok(paragraphs.every(p=>p.includes('data-cue-start')));
 const clocks=[...part.passage.matchAll(/<span data-cue-start="([^"]+)" data-cue-end="([^"]+)">([^<]*)<\/span>/g)].map(m=>[m[1],m[2],m[3]]);
 assert.equal(clocks.length,audit.wordClockCount);assert.equal(hash(JSON.stringify(clocks)),audit.wordClocksSha256);
 const entries=clocks.map(c=>({start:+c[0],end:+c[1],text:c[2]}));assert.equal(entries[currentTranscriptIndex(entries,373.7,part.transcriptEndSeconds)]?.text,'Goodbye.');
 assert.match(paragraphs[60],/data-speaker="M"/);
});
