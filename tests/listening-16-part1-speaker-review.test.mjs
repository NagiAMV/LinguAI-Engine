import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {currentTranscriptIndex} from '../src/components/content/transcript-follow.mjs';
const file='public/practice/practice-listening-16.json',hash=x=>createHash('sha256').update(x).digest('hex');
function speakerAt(html,time){const stack=[];for(const m of html.matchAll(/<span\b[^>]*>|<\/span>/g)){const tag=m[0];if(tag==='</span>'){stack.pop();continue;}const speaker=tag.match(/data-speaker="([^"]+)"/)?.[1]||stack.at(-1);stack.push(speaker);if(Number(tag.match(/data-cue-start="([^"]+)"/)?.[1])===time)return speaker;}}
test('Test 16 Part 1 separates Daniel, Anna and the narrator through the closing announcement',()=>{
 const part=JSON.parse(fs.readFileSync(file)).parts[0];
 for(const [time,speaker]of [[.94,'Speaker 1'],[53.88,'Speaker 1'],[61.57,'Speaker 2'],[66.67,'Speaker 3'],[73.29,'Speaker 2'],[108.69,'Speaker 3'],[170.83,'Speaker 2'],[215.91,'Speaker 3'],[224.21,'Speaker 2'],[251.44,'Speaker 1'],[259.38,'Speaker 2'],[262.72,'Speaker 3'],[314.74,'Speaker 2'],[329.84,'Speaker 1']])assert.equal(speakerAt(part.passage,time),speaker,`speaker at ${time}`);
 const audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-16-part-1.json'));
 assert.equal(audit.textUnchanged,true);assert.equal(audit.humanAuditoryReview,false);assert.equal(hash(fs.readFileSync('public'+part.audioUrls[0])),audit.audioSha256);
 assert.ok(audit.voiceComparison.checks.every(r=>r.speaker===r.chosen));assert.ok(audit.voiceComparison.leaveOneOutControls.every(r=>r.label===r.chosen));
 assert.equal(hash(JSON.stringify(JSON.parse(fs.readFileSync(file)).parts.slice(1))),audit.otherPartsSha256);
});
test('Test 16 Part 1 follows spelling, postcode, phone and final unfinished reply',()=>{
 const part=JSON.parse(fs.readFileSync(file)).parts[0],cues=[...part.passage.matchAll(/<span data-cue-start="([\d.]+)" data-cue-end="([\d.]+)">([^<]*)<\/span>/g)].map(m=>({start:+m[1],end:+m[2],word:m[3]}));
 for(const [time,word]of [[100,'F-O-R-D-Y-C-E.'],[111,'BT14-9BJ.'],[125,'078400-51963.'],[275.2,'size-wise,'],[284.2,'two-bedroom'],[289.7,'three-bedroom'],[319.9,'I'],[320.25,'will…']])assert.equal(cues[currentTranscriptIndex(cues,time,part.transcriptEndSeconds)]?.word,word,`follow at ${time}`);
 assert.ok(cues.every(c=>c.end>c.start&&c.end<=part.transcriptEndSeconds));
 const audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-16-part-1.json'));
 assert.equal(hash(JSON.stringify(cues.map(c=>[c.start.toFixed(2),c.end.toFixed(2),c.word]))),audit.wordClocksSha256);
});
