import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createHash} from 'node:crypto';
function speakerAt(html,time){const stack=[];for(const m of html.matchAll(/<span\b[^>]*>|<\/span>/g)){const tag=m[0];if(tag==='</span>'){stack.pop();continue;}const speaker=tag.match(/data-speaker="([^"]+)"/)?.[1]||stack.at(-1);stack.push(speaker);if(Number(tag.match(/data-cue-start="([^"]+)"/)?.[1])===time)return speaker;}}
test('Test 12 Part 1 separates the accommodation student from the officer and narrator',()=>{
 const html=JSON.parse(fs.readFileSync('public/practice/practice-listening-12.json')).parts[0].passage;
 for(const [time,speaker]of [[82.74,'Speaker 1'],[99.08,'Speaker 3'],[117.64,'Speaker 1'],[184.13,'Speaker 3'],[187.67,'Speaker 2'],[196.84,'Speaker 3'],[227.09,'Speaker 3'],[232.83,'Speaker 2'],[339.49,'Speaker 3'],[411.21,'Speaker 2'],[455.56,'Speaker 3']])assert.equal(speakerAt(html,time),speaker,`word at ${time}`);
 const paragraphs=[...html.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].map(m=>m[0]).filter(p=>!p.includes('transcript-source-note'));
 const voices=p=>[...p.matchAll(/data-speaker="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(voices(paragraphs[30]),['Speaker 2','Speaker 3','Speaker 2']);assert.deepEqual(voices(paragraphs[31]),['Speaker 2','Speaker 3']);
 for(const i of [40,64])assert.deepEqual(voices(paragraphs[i]),['Speaker 3']);
 assert.deepEqual([...new Set(voices(html))].sort(),['Speaker 1','Speaker 2','Speaker 3']);
 const audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-12-part-1.json')),hash=x=>createHash('sha256').update(x).digest('hex');
 const part=JSON.parse(fs.readFileSync('public/practice/practice-listening-12.json')).parts[0];assert.equal(hash(fs.readFileSync('public'+part.audioUrls[0])),audit.audioSha256);
 assert.equal(audit.humanAuditoryReview,false);assert.equal(audit.textUnchanged,true);assert.equal(audit.wordClocksUnchanged,true);
 assert.equal(audit.voiceComparison.checks.length,76);assert.ok(audit.voiceComparison.checks.every(r=>r.speaker===r.chosen));assert.equal(audit.voiceComparison.leaveOneOutControls.length,9);assert.ok(audit.voiceComparison.leaveOneOutControls.every(r=>r.label===r.chosen));
 const clocks=[...html.matchAll(/<span data-cue-start="([^"]+)" data-cue-end="([^"]+)">([^<]*)<\/span>/g)].map(m=>[m[1],m[2],m[3]]);
 assert.equal(clocks.length,833);assert.equal(hash(JSON.stringify(clocks)),audit.wordClocksSha256);
});
