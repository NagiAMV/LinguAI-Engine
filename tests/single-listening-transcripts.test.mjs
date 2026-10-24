import fs from 'node:fs';import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
test('all 80 section recordings have transparent timed local ASR drafts',()=>{
 const catalog=JSON.parse(fs.readFileSync('src/data/single-section-listening-catalog.json'));const audit=JSON.parse(fs.readFileSync('docs/single-listening-transcripts.json'));
 assert.equal(Object.keys(audit).length,80);
 for(const item of catalog){
  const paper=JSON.parse(fs.readFileSync('public/practice/'+item.id+'.json')),part=paper.parts[0],source=paper.transcriptProvenance;
  assert.equal(part.transcriptStatus,'asr-draft',item.id);assert.equal(source.answerKeyUsedForGeneration,false);assert.equal(source.status,'draft-not-fully-audited');assert.ok(source.timedSegments>=5);
  assert.ok(part.passage.includes('Audio transcript · draft'));assert.ok(part.passage.includes('not an official transcript'));assert.ok(part.passage.length>1000);assert.ok(!/<script|onload=|data:/.test(part.passage));
  assert.equal(part.transcriptStartSeconds,0);assert.ok(Math.abs(part.transcriptEndSeconds-part.audioDurationSeconds)<.2);
  assert.equal(source.audioSha256,createHash('sha256').update(fs.readFileSync('public'+part.audioUrls[0])).digest('hex'),item.id);
  assert.equal(audit[item.id].timedSegments,source.timedSegments);assert.ok(audit[item.id].wordCount>=200);
 }
});
