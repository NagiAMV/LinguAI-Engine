import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const canonical=s=>s.replace(/(?:Narrator|Assistant|Customer):\s*/g,'').replace(/\s+/g,' ').trim();
test('Test 3 Part 1 separates the customer questions and consultant interjections',()=>{
 const paper=JSON.parse(fs.readFileSync('public/practice/practice-listening-3.json')),part=paper.parts[0];
 const audit=JSON.parse(fs.readFileSync('docs/listening-speaker-review/practice-listening-3-part-1.json'));
 assert.equal(hash(fs.readFileSync('public'+part.audioUrls[0])),audit.audioSha256);
 assert.equal(audit.humanAuditoryReview,false);
 const groups=audit.renderedGroups;
 assert.ok(groups.some(g=>g.speaker==='Assistant'&&g.text==='Wise decision.'));
 assert.ok(groups.some(g=>g.speaker==='Customer'&&g.text.startsWith('By the way')));
 assert.ok(groups.some(g=>g.speaker==='Customer'&&g.text.startsWith('That’s what happened with my previous policy.')));
 assert.ok(groups.some(g=>g.speaker==='Assistant'&&g.text==='Oh dear.'));
 assert.ok(groups.some(g=>g.speaker==='Customer'&&g.text.startsWith('Then I spent months')));
 assert.ok(groups.some(g=>g.speaker==='Customer'&&g.text==='Top Cover.'));
 assert.equal(groups.filter(g=>g.text.includes('Top Cover?')).length,0);
 const spoken=canonical(part.passage.replace(/<br\s*\/?>/g,' ').replace(/<[^>]*>/g,''));
 assert.equal(hash(spoken),audit.spokenTextSha256);
 const clocks=[...part.passage.matchAll(/<span data-cue-start="([^"]+)" data-cue-end="([^"]+)">([^<]*)<\/span>/g)].map(m=>[m[1],m[2],m[3]]);
 assert.equal(clocks.length,audit.wordClockCount);assert.equal(hash(JSON.stringify(clocks)),audit.wordClocksSha256);
 assert.ok(clocks.some(c=>c[0]==='46.42'&&c[2]==='Good'));
 assert.ok(!clocks.some(c=>['16.45','92.52','93.10'].includes(c[0])));
 for(const [s,e]of clocks)assert.ok(+e>+s&&+s>=part.transcriptStartSeconds&&+e<=part.transcriptEndSeconds);
 for(const phrase of ['By the way','That is what happened','Oh dear','Top Cover']){
  const row=audit.turns.find(r=>r.phrase===phrase);const closest=Object.entries(row.voiceSimilarity).sort((a,b)=>b[1]-a[1])[0][0];
  assert.equal(closest,phrase==='Oh dear'?'Assistant':'Customer');
 }
});
