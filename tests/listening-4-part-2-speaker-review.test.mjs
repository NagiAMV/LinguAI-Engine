import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const read=()=>JSON.parse(fs.readFileSync('public/practice/practice-listening-4.json')).parts[1];
test('Test 4 Part 2 separates the director from narrator instructions inside mixed paragraphs',()=>{
 const part=read(),audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-4-part-2.json'));
 const paragraphs=[...part.passage.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].map(m=>m[0]).filter(p=>!p.includes('transcript-source-note'));
 assert.equal(paragraphs.length,69);
 for(const [i,p] of paragraphs.entries()){
  const b=i+1,roles=[...p.matchAll(/data-speaker="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(roles,b===43?['Narrator','Club director']:b===68?['Club director','Narrator']:[b<=5||b===42||b===69?'Narrator':'Club director'],`paragraph ${b}`);
 }
 assert.ok(audit.renderedGroups.some(g=>g.speaker==='Club director'&&g.text.startsWith('A quick word')));
 assert.ok(audit.renderedGroups.some(g=>g.speaker==='Narrator'&&g.text.trim()==='That is'));
 assert.equal(hash(fs.readFileSync('public'+part.audioUrls[0])),audit.audioSha256);
 assert.equal(audit.humanAuditoryReview,false);assert.equal(audit.textUnchanged,true);
 assert.equal(audit.voiceComparison.checks.length,71);assert.equal(audit.tailVoiceComparison.length,4);
 for(const r of [...audit.voiceComparison.checks,...audit.tailVoiceComparison])assert.equal(r.chosen,r.speaker);
 assert.ok(audit.voiceComparison.leaveOneOutControls.every(r=>r.label===r.chosen));
});
test('Test 4 Part 2 fills all previously missing tokens with positive word or phrase clocks',()=>{
 const part=read(),audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-4-part-2.json'));
 const cues=[...part.passage.matchAll(/<span data-cue-start="([\d.]+)" data-cue-end="([\d.]+)">([^<]*)<\/span>/g)].map(m=>[m[1],m[2],m[3]]);
 assert.equal(cues.length,858);assert.equal(hash(JSON.stringify(cues)),audit.wordClocksSha256);
 assert.equal(cues.reduce((sum,c)=>sum+c[2].trim().split(/\s+/).length,0),861);
 assert.ok(cues.every(([s,e],i)=>+s>=part.transcriptStartSeconds&&+e>+s&&+e<=part.transcriptEndSeconds&&(!i||+s>=+cues[i-1][0])));
 for(const word of ['Now','S-K-I-P.','42.15','4.25','Before','16th century,','self-defense','melted-down','cannonballs'])assert.ok(cues.some(c=>c[2]===word),word);
 assert.equal(cues.filter(c=>c[2]==='at questions').length,2);
 assert.ok(cues.some(c=>c[2]==='a'&&c[0]==='601.76'&&c[1]==='601.86'));
 assert.ok(cues.some(c=>c[2]==='stream,'&&c[0]==='601.86'));
 assert.equal(audit.addedClocks.length,16);assert.equal(audit.removedClocksForPhraseMerges.length,3);assert.equal(audit.correctedWordClocks.length,1);
});
