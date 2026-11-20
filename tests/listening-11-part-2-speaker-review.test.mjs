import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const read=()=>JSON.parse(fs.readFileSync('public/practice/practice-listening-11.json')).parts[1];
test('Test 11 Part 2 checks both long manager monologues throughout and preserves all explanatory notes',()=>{
 const part=read(),audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-11-part-2.json'));
 const paragraphs=[...part.passage.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].map(m=>m[0]);assert.equal(paragraphs.length,4);
 paragraphs.forEach((p,i)=>assert.deepEqual([...new Set([...p.matchAll(/data-speaker="([^"]+)"/g)].map(m=>m[1]))],[[0,2].includes(i)?'Narrator':'Bookshop manager']));
 assert.equal(hash(fs.readFileSync('public'+part.audioUrls[0])),audit.audioSha256);
 assert.equal(audit.humanAuditoryReview,false);assert.equal(audit.textUnchanged,true);assert.equal(audit.annotationsUnchanged,true);assert.equal(audit.annotations.length,12);
 assert.equal((part.passage.match(/class="t-note"/g)||[]).length,10);
 assert.equal(audit.voiceComparison.checks.length,34);
 assert.ok(audit.voiceComparison.checks.every(r=>r.chosen===r.speaker));
 assert.equal(audit.voiceComparison.leaveOneOutControls.length,6);assert.ok(audit.voiceComparison.leaveOneOutControls.every(r=>r.label===r.chosen));
 for(const paragraph of [1,3])assert.ok(audit.voiceComparison.checks.filter(r=>r.paragraph===paragraph).length>=12);
});
test('Test 11 Part 2 recovers spoken words without timing Uzbek notes or question numbers',()=>{
 const part=read(),audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-11-part-2.json'));
 const cues=[...part.passage.matchAll(/<span data-cue-start="([\d.]+)" data-cue-end="([\d.]+)">([^<]*)<\/span>/g)].map(m=>[m[1],m[2],m[3]]);
 assert.equal(cues.length,766);assert.equal(hash(JSON.stringify(cues)),audit.wordClocksSha256);
 assert.equal(cues.reduce((n,c)=>n+c[2].trim().split(/\s+/).length,0),769);
 assert.ok(cues.every(([s,e],i)=>+s>=part.transcriptStartSeconds&&+e>+s&&+e<=part.transcriptEndSeconds&&(!i||+s>=+cues[i-1][0])));
 assert.ok(cues.every(([s,e])=>audit.voiceComparison.checks.some(r=>r.start<=+s&&r.end>=+e)),'every cue is covered by an acoustic comparison window');
 assert.equal(cues.filter(c=>c[2]==='at questions').length,2);
 for(const word of ['Customers are','assistants,','well-known','best-known'])assert.ok(cues.some(c=>c[2]===word),word);
 assert.ok(cues.some(c=>c[2]==='Customers are'&&c[0]==='546.82'&&c[1]==='547.96'));
 const stack=[];
 for(const m of part.passage.matchAll(/<[^>]+>/g)){
  const tag=m[0],name=tag.match(/^<\/?([\w-]+)/)?.[1];if(tag.startsWith('</')){while(stack.length&&stack.pop().name!==name){}continue;}
  if(tag.includes('data-cue-start='))assert.ok(!stack.some(n=>n.note),'editorial note has an audio cue');
  if(!['br','hr','img','input'].includes(name))stack.push({name,note:tag.includes('class="t-note"')||name==='em'});
 }
 assert.equal(audit.addedClocks.length,6);assert.equal(audit.removedClocksForPhraseMerges.length,3);assert.equal(audit.correctedWordClocks.length,0);
});
