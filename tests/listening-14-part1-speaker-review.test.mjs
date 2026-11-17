import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {currentTranscriptIndex} from '../src/components/content/transcript-follow.mjs';
test('Test 14 Part 1 closing employer reply stays on the actual first-part audio timeline',()=>{
 const part=JSON.parse(fs.readFileSync('public/practice/practice-listening-14.json')).parts[0],paragraphs=[...part.passage.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].map(m=>m[0]);
 const times=[...paragraphs[35].matchAll(/data-cue-start="([\d.]+)" data-cue-end="([\d.]+)"/g)];assert.ok(times.length);assert.ok(times.every(m=>+m[1]>321&&+m[2]<330),'Closing must not seek to unrelated 431–585 second audio');
 assert.ok(part.transcriptEndSeconds>325&&part.transcriptEndSeconds<330);
 const cues=[...part.passage.matchAll(/<span data-cue-start="([\d.]+)" data-cue-end="([\d.]+)">([^<]*)<\/span>/g)].map(m=>({start:+m[1],end:+m[2],word:m[3]}));
 for(const [time,word]of [[181.25,'Well,'],[314.6,'Yeah,'],[315.28,"don't"],[323.4,'for']])assert.equal(cues[currentTranscriptIndex(cues,time,part.transcriptEndSeconds)]?.word,word,`follow audio at ${time}`);
 assert.ok(paragraphs.every(p=>/^<p[^>]*><strong>(EMPLOYER|APPLICANT):<\/strong>/.test(p)));
});
test('Test 14 Part 1 employer questions have playable timestamps',()=>{
 const part=JSON.parse(fs.readFileSync('public/practice/practice-listening-14.json')).parts[0],paragraphs=[...part.passage.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].map(m=>m[0]);
 for(const i of [4,6,8,10,16,18,33])assert.match(paragraphs[i],/data-cue-start=/,`missing time at paragraph ${i}`);
 const audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-14-part-1.json')),hash=x=>createHash('sha256').update(x).digest('hex');
 assert.equal(hash(fs.readFileSync('public'+part.audioUrls[0])),audit.audioSha256);assert.equal(audit.humanAuditoryReview,false);assert.equal(audit.textUnchanged,true);assert.equal(audit.speakerLabelsUnchanged,true);
 assert.equal(audit.voiceComparison.checks.length,36);assert.ok(audit.voiceComparison.checks.every(r=>r.chosen===r.sourceLabel));assert.ok(audit.voiceComparison.leaveOneOutControls.every(r=>r.label===r.chosen));
 assert.equal(audit.addedUtteranceCues.length,7);assert.equal(audit.correctedWordClocks.length,3);assert.equal(audit.removedIncorrectClosingClocks.length,4);assert.equal(audit.closingRecoveredWords,18);
 const clocks=[...part.passage.matchAll(/<span data-cue-start="([\d.]+)" data-cue-end="([\d.]+)">([^<]*)<\/span>/g)].map(m=>[m[1],m[2],m[3]]);assert.equal(hash(JSON.stringify(clocks)),audit.wordClocksSha256);
});
