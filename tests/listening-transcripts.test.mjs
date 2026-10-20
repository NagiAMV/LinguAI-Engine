import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
for(const number of [1,4,12,16])test(`Listening ${number}: four timed audio transcripts with honest draft provenance`,()=>{
 const exam=JSON.parse(fs.readFileSync(`public/practice/practice-listening-${number}.json`,'utf8'));
 const provenance=exam.transcriptProvenance;assert.equal(provenance.type,'local-audio-transcription');assert.equal(provenance.status,'draft-not-fully-audited');
 assert.equal(provenance.audioSha256,createHash('sha256').update(fs.readFileSync(`public/practice/assets/listening-${number}.mp3`)).digest('hex'));
 assert.equal(provenance.sectionStarts.length,4);assert.equal(provenance.sectionStarts[0],0);
 for(const part of exam.parts){assert.equal(part.transcriptStatus,'asr-draft');assert.ok(part.passage.length>2000);assert.match(part.passage,/Not an official transcript/);assert.match(part.passage,/\[\d\d:\d\d\]/);assert.doesNotMatch(part.passage,/<script|\son\w+=|No transcript was included/i);assert.ok(part.transcriptEndSeconds>part.transcriptStartSeconds);}
 const audit=JSON.parse(fs.readFileSync(`docs/listening-${number}-transcription.json`,'utf8'));assert.equal(audit.segmentsPerPart.reduce((a,b)=>a+b,0),provenance.timedSegments);
});
