import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';import {currentTranscriptIndex} from '../src/components/content/transcript-follow.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex'),file='public/practice/practice-listening-17.json';
test('Test 17 Part 1 separates the customer question from Steven’s payment reply',()=>{
 const paper=JSON.parse(fs.readFileSync(file)),part=paper.parts[0],paragraphs=[...part.passage.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].map(m=>m[0]);
 assert.equal(paragraphs.length,36);assert.match(paragraphs[26],/^<p data-speaker="Woman"><strong>Woman:<\/strong>/);assert.match(paragraphs[26],/anything/);assert.doesNotMatch(paragraphs[26],/payment/);assert.match(paragraphs[27],/^<p data-speaker="Steven"><strong>Steven:<\/strong>/);assert.match(paragraphs[27],/payment/);
 const audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-17-part-1.json'));assert.equal(audit.textUnchanged,true);assert.equal(audit.humanAuditoryReview,false);assert.equal(hash(fs.readFileSync('public'+part.audioUrls[0])),audit.audioSha256);assert.equal(hash(JSON.stringify(paper.parts.slice(1))),audit.otherPartsSha256);
 assert.ok(audit.voiceComparison.checks.every(r=>r.index===26?r.chosen==='Woman':r.chosen===r.sourceLabel));assert.ok(audit.voiceComparison.leaveOneOutControls.every(r=>r.label===r.chosen));assert.ok(audit.paymentVoiceComparison.every((r,i)=>r.chosen===(i%2?'Steven':'Woman')));assert.ok(audit.tailVoiceComparison.every(r=>r.chosen===r.sourceLabel));
});
test('Test 17 Part 1 follows recovered spelling and composite phrases without losing original clocks',()=>{
 const part=JSON.parse(fs.readFileSync(file)).parts[0],cues=[...part.passage.matchAll(/<span data-cue-start="([\d.]+)" data-cue-end="([\d.]+)">([^<]*)<\/span>/g)].map(m=>({start:+m[1],end:+m[2],word:m[3]}));
 for(const [time,word]of [[123.1,'That'],[130,'please—okay,'],[174.5,'Parkers,'],[185,'P-A-R-K-H-U-R-S-T.'],[305,'Yes, extra'],[341.6,'Rush'],[381.8,'cheque'],[429.2,"ma'am,"]])assert.equal(cues[currentTranscriptIndex(cues,time,part.transcriptEndSeconds)]?.word,word,`follow at ${time}`);
 assert.equal(cues.length,689);assert.ok(cues.every(c=>c.end>c.start&&c.end<=part.transcriptEndSeconds));const audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-17-part-1.json'));assert.equal(hash(JSON.stringify(cues.map(c=>[c.start.toFixed(2),c.end.toFixed(2),c.word]))),audit.wordClocksSha256);
});
