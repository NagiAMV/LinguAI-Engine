import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const read=()=>JSON.parse(fs.readFileSync('public/practice/practice-listening-8.json')).parts[1];
test('Test 8 Part 2 confirms Marie and narrator across all published paragraphs',()=>{
 const part=read(),audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-8-part-2.json'));
 const paragraphs=[...part.passage.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].map(m=>m[0]);assert.equal(paragraphs.length,21);
 paragraphs.forEach((p,i)=>assert.deepEqual([...new Set([...p.matchAll(/data-speaker="([^"]+)"/g)].map(m=>m[1]))],[[0,8].includes(i)?'Narrator':'Marie']));
 assert.equal(hash(fs.readFileSync('public'+part.audioUrls[0])),audit.audioSha256);
 assert.equal(audit.humanAuditoryReview,false);assert.equal(audit.textUnchanged,true);
 assert.equal(audit.voiceComparison.checks.length,21);assert.equal(audit.tailVoiceComparison.length,15);
 for(const r of [...audit.voiceComparison.checks,...audit.tailVoiceComparison])assert.equal(r.chosen,r.speaker);
 assert.equal(audit.voiceComparison.leaveOneOutControls.length,6);assert.ok(audit.voiceComparison.leaveOneOutControls.every(r=>r.label===r.chosen));
});
test('Test 8 Part 2 fills missing scholarship, coastline and percentage clocks without overlaps',()=>{
 const part=read(),audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-8-part-2.json'));
 const cues=[...part.passage.matchAll(/<span data-cue-start="([\d.]+)" data-cue-end="([\d.]+)">([^<]*)<\/span>/g)].map(m=>[m[1],m[2],m[3]]);
 assert.equal(cues.length,704);assert.equal(hash(JSON.stringify(cues)),audit.wordClocksSha256);
 assert.equal(cues.reduce((n,c)=>n+c[2].trim().split(/\s+/).length,0),705);
 assert.ok(cues.every(([s,e],i)=>+s>=part.transcriptStartSeconds&&+e>+s&&+e<=part.transcriptEndSeconds&&(!i||+s>=+cues[i-1][0])));
 for(const [s,e,w] of [['589.28','589.66','scholarship'],['601.34','601.64','coastline'],['610.70','611.08','ten'],['611.08','611.40','per cent']])assert.ok(cues.some(c=>c[0]===s&&c[1]===e&&c[2]===w),w);
 assert.ok(cues.some(c=>c[2]==='a'&&c[0]==='589.08'&&c[1]==='589.28'));
 assert.equal(audit.addedClocks.length,4);assert.equal(audit.correctedWordClocks.length,1);assert.equal(audit.removedClocksForPhraseMerges.length,0);
});
