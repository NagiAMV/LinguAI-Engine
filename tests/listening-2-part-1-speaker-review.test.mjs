import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
test('Test 2 Part 1 supplied names match audio voices and tail clocks stay within the part',()=>{
 const paper=JSON.parse(fs.readFileSync('public/practice/practice-listening-2.json'));
 const part=paper.parts[0],audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-2-part-1.json'));
 assert.equal(hash(fs.readFileSync('public'+part.audioUrls[0])),audit.audioSha256);
 assert.equal(audit.humanAuditoryReview,false);
 assert.equal(hash(part.passage.replace(/<[^>]*>/g,'')),audit.plainTextSha256);
 assert.equal(audit.turns.length,36);
 const labels=[...part.passage.matchAll(/<p data-speaker="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(labels.length,36);
 for(const [i,r] of audit.turns.entries()){
  const closest=Object.entries(r.voiceSimilarity).sort((a,b)=>b[1]-a[1])[0][0];
  assert.equal(labels[i],r.sourceLabel);
  assert.equal(labels[i],closest,r.text);
 }
 const clocks=[...part.passage.matchAll(/<span data-cue-start="([^"]+)" data-cue-end="([^"]+)">([\s\S]*?)<\/span>/g)].map(m=>[m[1],m[2],m[3]]);
 assert.equal(clocks.length,audit.wordClockCount);
 assert.equal(hash(JSON.stringify(clocks)),audit.wordClocksSha256);
 for(const [s,e]of clocks){assert.ok(+e>+s);assert.ok(+s>=part.transcriptStartSeconds&&+e<=part.transcriptEndSeconds);}
 assert.equal(part.transcriptEndSeconds,392.5);
 assert.match(part.passage,/<span data-cue-start="381.40" data-cue-end="381.54">I<\/span>/);
 assert.match(part.passage,/<span data-cue-start="392.22" data-cue-end="392.50">answers<\/span> to part one\./);
 assert.equal(audit.clockCorrections.filter(c=>c.after===null).length,2);
});
