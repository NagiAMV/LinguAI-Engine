import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createHash} from 'node:crypto';
function speakerAt(html,time){const stack=[];for(const m of html.matchAll(/<span\b[^>]*>|<\/span>/g)){const tag=m[0];if(tag==='</span>'){stack.pop();continue;}const speaker=tag.match(/data-speaker="([^"]+)"/)?.[1]||stack.at(-1);stack.push(speaker);if(Number(tag.match(/data-cue-start="([^"]+)"/)?.[1])===time)return speaker;}}
test('Test 11 Part 1 does not switch voices inside the student introduction or narrator instructions',()=>{
 const html=JSON.parse(fs.readFileSync('public/practice/practice-listening-11.json')).parts[0].passage;
 for(const [time,speaker]of [[97.84,'Speaker 3'],[100.08,'Speaker 3'],[101.36,'Speaker 3'],[109.68,'Speaker 2'],[125.69,'Speaker 2'],[126.73,'Speaker 3'],[213.92,'Speaker 1'],[247.59,'Speaker 2'],[346.65,'Speaker 1']])assert.equal(speakerAt(html,time),speaker,`word at ${time}`);
 const audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-11-part-1.json')),hash=x=>createHash('sha256').update(x).digest('hex');
 const part=JSON.parse(fs.readFileSync('public/practice/practice-listening-11.json')).parts[0];assert.equal(hash(fs.readFileSync('public'+part.audioUrls[0])),audit.audioSha256);
 assert.equal(audit.humanAuditoryReview,false);assert.equal(audit.textUnchanged,true);assert.equal(audit.annotationsUnchanged,true);
 assert.equal(audit.voiceComparison.checks.length,37);assert.ok(audit.voiceComparison.checks.every(r=>r.speaker===r.chosen));assert.ok(audit.voiceComparison.leaveOneOutControls.every(r=>r.label===r.chosen));
 assert.equal(audit.annotations.length,13);assert.equal((html.match(/class="t-note"/g)||[]).length,10);assert.equal((html.match(/<em>/g)||[]).length,3);
 const clocks=[...html.matchAll(/<span data-cue-start="([^"]+)" data-cue-end="([^"]+)">([^<]*)<\/span>/g)].map(m=>[m[1],m[2],m[3]]);
 assert.equal(clocks.length,725);assert.equal(hash(JSON.stringify(clocks)),audit.wordClocksSha256);
});
