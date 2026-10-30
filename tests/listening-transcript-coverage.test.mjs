import fs from 'node:fs';import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
test('all Listening parts have real transcript content rather than a placeholder',()=>{
 let count=0;
 for(const kind of ['practice-listening','single-section-listening'])for(const item of JSON.parse(fs.readFileSync(`src/data/${kind}-catalog.json`))){
  const paper=JSON.parse(fs.readFileSync(`public/practice/${item.id}.json`));
  for(const part of paper.parts){assert.ok(part.passage.replace(/<[^>]+>/g,' ').length>700,item.id);assert.doesNotMatch(part.passage,/No transcript was included|transcript.*not.*available/i,item.id);assert.ok(part.audioUrls.length,item.id);count++;}
 }
 assert.equal(count,152);
});
test('Test 18 transcripts come from each matching recording with traceable timings',()=>{
 const p=JSON.parse(fs.readFileSync('public/practice/practice-listening-18.json'));assert.equal(p.audioStatus,'available');assert.equal(p.audioScope,'part');assert.equal(p.transcriptProvenance.answerKeyUsedForGeneration,false);
 for(const part of p.parts){const provenance=p.transcriptProvenance.parts.find(x=>x.part===part.id);assert.equal(provenance.audioSha256,createHash('sha256').update(fs.readFileSync('public'+part.audioUrls[0])).digest('hex'));assert.equal(part.transcriptStatus,'asr-draft');assert.match(part.passage,/Not an official transcript/);assert.match(part.passage,/\[\d\d:\d\d\]/);assert.ok(part.audioDurationSeconds>300);assert.ok(provenance.wordCount>500);}
 assert.match(p.parts[1].questions,/18\. reception/);assert.match(p.parts[1].questions,/20\. store/);
});
