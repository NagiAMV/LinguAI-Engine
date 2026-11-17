import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {currentTranscriptIndex} from '../src/components/content/transcript-follow.mjs';
function speakerAt(html,time){const stack=[];for(const m of html.matchAll(/<span\b[^>]*>|<\/span>/g)){const tag=m[0];if(tag==='</span>'){stack.pop();continue;}const speaker=tag.match(/data-speaker="([^"]+)"/)?.[1]||stack.at(-1);stack.push(speaker);if(Number(tag.match(/data-cue-start="([^"]+)"/)?.[1])===time)return speaker;}}
test('Test 15 Part 1 separates Sally, the customer and narrator inside mixed paragraphs',()=>{
 const html=JSON.parse(fs.readFileSync('public/practice/practice-listening-15.json')).parts[0].passage;
 for(const [time,speaker]of [[37.36,'Speaker 2'],[42.54,'Speaker 3'],[69.55,'Speaker 1'],[98.41,'Speaker 3'],[123.65,'Speaker 2'],[131.22,'Speaker 3'],[211.96,'Speaker 1'],[234.38,'Speaker 2'],[239.08,'Speaker 3'],[320.28,'Speaker 2'],[364.1,'Speaker 3'],[407.05,'Speaker 2'],[410.58,'Speaker 2']])assert.equal(speakerAt(html,time),speaker,`word at ${time}`);
});
test('Test 15 Part 1 final announcement does not jump to fourteen-minute audio',()=>{
 const part=JSON.parse(fs.readFileSync('public/practice/practice-listening-15.json')).parts[0],paragraph=[...part.passage.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].at(-1)[0];
 const times=[...paragraph.matchAll(/data-cue-start="([\d.]+)" data-cue-end="([\d.]+)"/g)];assert.ok(times.length);assert.ok(times.every(t=>+t[1]>456&&+t[2]<465));assert.ok(part.transcriptEndSeconds>463&&part.transcriptEndSeconds<465);
 const cues=[...part.passage.matchAll(/<span data-cue-start="([\d.]+)" data-cue-end="([\d.]+)">([^<]*)<\/span>/g)].map(m=>({start:+m[1],end:+m[2],word:m[3]}));
 for(const [time,word]of [[129.3,'O-S-K-A-R?'],[228,'listen'],[230.6,'to'],[233.9,'So,'],[457.5,'That'],[459.3,'1.'],[463.4,'answers.']])assert.equal(cues[currentTranscriptIndex(cues,time,part.transcriptEndSeconds)]?.word,word,`follow audio at ${time}`);
 const audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-15-part-1.json')),hash=x=>createHash('sha256').update(x).digest('hex');
 assert.equal(hash(fs.readFileSync('public'+part.audioUrls[0])),audit.audioSha256);assert.equal(audit.textUnchanged,true);assert.equal(audit.humanAuditoryReview,false);
 assert.equal(audit.voiceComparison.checks.length,69);assert.ok(audit.voiceComparison.checks.every(r=>r.speaker===r.chosen));assert.ok(audit.voiceComparison.leaveOneOutControls.every(r=>r.label===r.chosen));
 assert.equal(audit.correctedWordClocks.length,16);assert.equal(audit.addedClocks.length,11);assert.equal(cues.length,954);
 assert.equal(hash(JSON.stringify(cues.map(c=>[c.start.toFixed(2),c.end.toFixed(2),c.word]))),audit.wordClocksSha256);
 const paper=JSON.parse(fs.readFileSync('public/practice/practice-listening-15.json'));
 assert.equal(hash(JSON.stringify(paper.parts.slice(1))),audit.otherPartsSha256);
});
