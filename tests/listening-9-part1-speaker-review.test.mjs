import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
test('Test 9 Part 1 Manager and Bob labels match voices, including short acknowledgements',()=>{
 const paper=JSON.parse(fs.readFileSync('public/practice/practice-listening-9.json')),part=paper.parts[0],audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-9-part-1.json'));
 assert.equal(hash(fs.readFileSync('public'+part.audioUrls[0])),audit.audioSha256);assert.equal(audit.humanAuditoryReview,false);
 assert.equal(hash(part.passage),audit.passageSha256);assert.equal(audit.spokenTextUnchanged,true);assert.equal(audit.wordClocksUnchanged,true);
 const paragraphs=[...part.passage.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].map(m=>m[0]);assert.equal(paragraphs.length,34);
 const comparison=audit.voiceComparison;assert.equal(comparison.checks.length,33);assert.equal(comparison.leaveOneOutControls.length,8);assert.ok(comparison.leaveOneOutControls.every(r=>r.chosen===r.label));
 for(const r of comparison.checks){if(r.index===29)continue;assert.equal(r.sourceLabel,r.chosen);assert.ok(paragraphs[r.index+(r.index>29?1:0)].includes(`data-speaker="${r.chosen}"`));const scores=r.eligibleSpeakers.map(k=>r.scores[k]).sort((a,b)=>b-a);assert.ok(scores[0]-scores[1]>.1,r.text);}
 for(const i of [2,4,6,9,11,13,15,19,21,23,25,27,31])assert.equal(comparison.checks[i].chosen,'Bob');
 assert.match(paragraphs[29],/data-speaker="Bob"/);assert.match(paragraphs[29],/>OK\.<\/span>/);assert.doesNotMatch(paragraphs[29],/Then/);
 assert.match(paragraphs[30],/data-speaker="Manager"/);assert.match(paragraphs[30],/data-cue-start="423.88"/);
 assert.equal(audit.boundaryChecks.find(r=>r.phrase==='OK').chosen,'Bob');assert.equal(audit.boundaryChecks.find(r=>r.phrase.startsWith('Then there')).chosen,'Manager');
 const spoken=part.passage.replace(/<[^>]*>/g,'').replace(/(?:Narrator|Manager|Bob):\s*/g,'').replace(/\s+/g,' ').trim();assert.equal(hash(spoken),audit.spokenTextSha256);
 for(const i of [0,17])assert.equal(comparison.checks[i].chosen,'Narrator');
 const clocks=[...part.passage.matchAll(/<span data-cue-start="([^"]+)" data-cue-end="([^"]+)">([^<]*)<\/span>/g)].map(m=>[m[1],m[2],m[3]]);assert.equal(clocks.length,audit.wordClockCount);assert.equal(hash(JSON.stringify(clocks)),audit.wordClocksSha256);
});
