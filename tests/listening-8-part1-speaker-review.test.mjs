import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
test('Test 8 Part 1 greeting belongs to Greg and Ellie replies without changing audio clocks',()=>{
 const paper=JSON.parse(fs.readFileSync('public/practice/practice-listening-8.json')),part=paper.parts[0],audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-8-part-1.json'));
 assert.equal(hash(fs.readFileSync('public'+part.audioUrls[0])),audit.audioSha256);
 assert.equal(audit.humanAuditoryReview,false);assert.equal(audit.spokenTextUnchanged,true);assert.equal(audit.wordClocksUnchanged,true);
 const paragraphs=[...part.passage.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].map(m=>m[0]);assert.equal(paragraphs.length,47);
 assert.match(paragraphs[1],/^<p data-speaker="Greg"><strong>Greg:<\/strong>/);
 assert.match(paragraphs[2],/^<p data-speaker="Ellie"><strong>Ellie:<\/strong>/);
 assert.match(paragraphs[3],/^<p data-speaker="Ellie"><strong>Ellie:<\/strong>/);
 assert.deepEqual(audit.labelCorrections.map(r=>[r.paragraph,r.before,r.after]),[[1,'Ellie','Greg'],[2,'Greg','Ellie']]);
 assert.equal(audit.voiceComparison.leaveOneOutControls.length,8);assert.ok(audit.voiceComparison.leaveOneOutControls.every(r=>r.label===r.chosen));
 assert.equal(audit.voiceComparison.checks.length,47);
 for(const r of audit.voiceComparison.checks){assert.ok(paragraphs[r.index].includes(`data-speaker="${r.chosen}"`));const scores=Object.values(r.scores).sort((a,b)=>b-a);assert.ok(scores[0]-scores[1]>.1,r.text);}
 const spoken=part.passage.replace(/<[^>]*>/g,'').replace(/(?:Narrator|Ellie|Greg):\s*/g,'');assert.equal(hash(spoken),audit.spokenTextSha256);
 const clocks=[...part.passage.matchAll(/<span data-cue-start="([^"]+)" data-cue-end="([^"]+)">([^<]*)<\/span>/g)].map(m=>[m[1],m[2],m[3]]);
 assert.equal(clocks.length,597);assert.equal(clocks.length,audit.wordClockCount);assert.equal(hash(JSON.stringify(clocks)),audit.wordClocksSha256);
});
