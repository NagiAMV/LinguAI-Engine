import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex'),plain=s=>s.replace(/<[^>]*>/g,'');
for(const n of [6,7])test(`Test ${n} Part 1 named speakers match recording-specific voice references`,()=>{
 const paper=JSON.parse(fs.readFileSync(`public/practice/practice-listening-${n}.json`)),part=paper.parts[0],audit=JSON.parse(fs.readFileSync(`docs/listening-speaker-review/practice-listening-${n}-part-1.json`));
 assert.equal(audit.audioSha256,hash(fs.readFileSync('public'+part.audioUrls[0])));
 assert.equal(audit.humanAuditoryReview,false);assert.equal(audit.textUnchanged,true);assert.equal(audit.speakerLabelsUnchanged,true);
 assert.equal(hash(plain(part.passage)),audit.plainTextSha256);
 const paragraphs=[...part.passage.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].map(m=>m[0]);assert.equal(paragraphs.length,n===6?31:11);
 const comparison=audit.voiceComparison;assert.equal(comparison.leaveOneOutControls.length,6);assert.ok(comparison.leaveOneOutControls.every(r=>r.label===r.chosen));
 for(const row of comparison.checks){assert.equal(row.sourceLabel,row.chosen,row.text);const scores=Object.values(row.scores).sort((a,b)=>b-a);assert.ok(scores[0]-scores[1]>.1,row.text);assert.ok(paragraphs[row.index].includes(`data-speaker="${row.chosen}"`));}
 const clocks=[...part.passage.matchAll(/<span data-cue-start="([^"]+)" data-cue-end="([^"]+)">([^<]*)<\/span>/g)].map(m=>[m[1],m[2],m[3]]);
 assert.equal(clocks.length,audit.wordClockCount);assert.equal(hash(JSON.stringify(clocks)),audit.wordClocksSha256);
 if(n===6){
  assert.equal(audit.clockEdits.length,2);assert.ok(audit.clockEdits.every(r=>r.after[0]>65&&r.after[1]<67));
  assert.equal(audit.addedUtteranceCues.length,6);
  for(const i of [7,9,11,15,19,29])assert.match(paragraphs[i],/data-cue-start=/);
  assert.doesNotMatch(paragraphs[3],/75\.44|76\.32/);
  assert.ok(paragraphs.every(p=>/<strong>(OPERATOR|JACK):<\/strong>/.test(p)));
  assert.ok(audit.addedUtteranceCues.every(r=>r.granularity==='utterance'&&r.end>r.start));
 }else{assert.equal(audit.clockEdits.length,0);assert.equal(audit.addedUtteranceCues.length,0);}
});
