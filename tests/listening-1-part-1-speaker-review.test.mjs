import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

const hash=x=>createHash('sha256').update(x).digest('hex');
const plain=html=>html.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,'\u00a0');

test('Test 1 Part 1 keeps the applicant, farm owner and narrator distinct without changing words or clocks',()=>{
 const paper=JSON.parse(fs.readFileSync('public/practice/practice-listening-1.json'));
 const audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-1-part-1.json'));
 const part=paper.parts[0];
 assert.equal(hash(fs.readFileSync('public'+part.audioUrls[0])),audit.audioSha256);
 assert.equal(audit.humanAuditoryReview,false);
 assert.equal(audit.wordClocksUnchanged,true);
 assert.equal(audit.turns.length,74);
 assert.equal(hash(plain(part.passage)),audit.plainTextSha256);
 const clocks=[...part.passage.matchAll(/<span data-cue-start="([^"]+)" data-cue-end="([^"]+)">([\s\S]*?)<\/span>/g)].map(m=>[m[1],m[2],plain(m[3])]);
 assert.equal(clocks.length,audit.wordClockCount);
 assert.equal(hash(JSON.stringify(clocks)),audit.wordClocksSha256);
 const paragraphs=[...part.passage.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].map(m=>m[0]).filter(p=>!p.includes('transcript-source-note'));
 assert.equal(paragraphs.length,74);
 for(const [i,p] of paragraphs.entries()){
  const labels=[...p.matchAll(/data-speaker="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(labels,[audit.turns[i].assignedSpeaker||audit.turns[i].closestVoice],audit.turns[i].text);
 }
 for(const i of [16,26,28,32,34,36,38,54,55,63,65,68,69,70]){
  assert.match(paragraphs[i],/data-speaker="Speaker 3"/);
 }
 for(const i of [12,13,15,22,23,25,27,29,31,33,35,37,53,56,57,58,61,62,64,66,67,71]){
  assert.match(paragraphs[i],/data-speaker="Speaker 2"/);
 }
 for(const i of [0,10,17,18,19,20,39,40,72,73])assert.match(paragraphs[i],/data-speaker="Speaker 1"/);
 for(const i of [27,32]){
  const evidence=audit.turns[i].additionalVoiceEvidence;
  const chosen=Object.entries(evidence.meanSimilarity).sort((a,b)=>b[1]-a[1])[0][0];
  assert.equal(chosen,i===27?'woman':'man');
 }
});
