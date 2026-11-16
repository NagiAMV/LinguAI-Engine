import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

test('reviewed food-waste dialogue has whole utterances assigned to acoustically matched speakers',()=>{
 const paper=JSON.parse(fs.readFileSync('public/practice/single-listening-44.json'));
 const audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/single-listening-44.json'));
 const part=paper.parts[0];
 assert.equal(audit.audioSha256,createHash('sha256').update(fs.readFileSync('public'+part.audioUrls[0])).digest('hex'));
 assert.equal((part.passage.match(/data-cue-start=/g)||[]).length,1041);
 assert.equal(audit.fullRecordingVerified,false);
 assert.equal(audit.fullTranscriptSpeakerReview,true);
 assert.equal(audit.humanAuditoryReview,false);
 assert.equal(audit.turns.length,68);
 assert.equal(audit.textUnchanged,true);
 assert.deepEqual(audit.clockCorrections,[{before:['26.98','27.84','hi'],after:['57.31','57.51','hi']}]);
 // Check every rendered word, including phrase boundaries merged into one speaker turn.
 const stack=[];
 let checked=0;
 for(const token of part.passage.matchAll(/<span\b[^>]*>|<\/span>/g)){
  const tag=token[0];
  if(tag==='</span>'){stack.pop();continue;}
  const speaker=tag.match(/data-speaker="([^"]+)"/)?.[1]||stack.at(-1);
  stack.push(speaker);
  const start=tag.match(/data-cue-start="([^"]+)"/)?.[1];
  if(start===undefined)continue;
  const expected=audit.turns.findLast(turn=>turn.start<=Number(start)+.001);
  assert.equal(speaker,expected.closestVoice,`word at ${start}`);
  checked++;
 }
 assert.equal(checked,1041);
 for(const turn of audit.turns){
  const allowed=['recording 53','Now listen and answer'].includes(turn.phrase)
   ? ['Speaker 1','Speaker 2','Speaker 3'] : ['Speaker 2','Speaker 3'];
  const closest=allowed.reduce((a,b)=>turn.voiceSimilarity[a]>turn.voiceSimilarity[b]?a:b);
  assert.equal(turn.closestVoice,closest,turn.phrase);
 }
 assert.equal(audit.turns[1].closestVoice,'Speaker 3');
 assert.equal(audit.turns[1].start,57.31);
 const groups=audit.renderedGroups;
 assert.ok(groups.some(g=>g.speaker==='Speaker 2'&&g.text.includes('they need to be more comprehensive.')));
 assert.ok(groups.some(g=>g.speaker==='Speaker 3'&&g.text.includes('Who do you mean by people?')));
 assert.ok(groups.some(g=>g.speaker==='Speaker 3'&&g.text.includes('one of the key causes of carbon dioxide.')));
 assert.ok(groups.some(g=>g.speaker==='Speaker 2'&&g.text.includes('something about waste.')));
 assert.ok(groups.some(g=>g.speaker==='Speaker 3'&&g.text.includes('Fair enough')));
 assert.ok(groups.some(g=>g.speaker==='Speaker 2'&&g.text.includes('Having said that')));
});
