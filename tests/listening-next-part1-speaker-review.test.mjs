import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const decode=s=>s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,'\u00a0').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
function readWords(html){
 const stack=[{skip:false,inParagraph:false,speaker:null,paragraph:-1}],words=[];let paragraph=-1;
 for(const m of html.matchAll(/<[^>]*>|[^<]+/g)){
  const value=m[0],parent=stack.at(-1);
  if(value.startsWith('</')){const name=value.match(/^<\/([\w-]+)/)?.[1];while(stack.length>1){if(stack.pop().name===name)break;}continue;}
  if(value.startsWith('<')){
   const name=value.match(/^<([\w-]+)/)?.[1];if(!name||['br','hr','img','input'].includes(name))continue;
   const metadata=value.includes('transcript-source-note');if(name==='p'&&!metadata)paragraph++;
   stack.push({name,skip:parent.skip||metadata||['small','time'].includes(name),inParagraph:name==='p'?true:parent.inParagraph,speaker:value.match(/data-speaker="([^"]+)"/)?.[1]||parent.speaker,paragraph});continue;
  }
  if(parent.skip||!parent.inParagraph)continue;
  for(const word of decode(value).match(/\S+/g)||[])words.push({text:word,speaker:parent.speaker,paragraph:parent.paragraph});
 }
 return words;
}
for(const n of [4,5])test(`Test ${n} Part 1 preserves words and clocks while assigning every word to its reviewed turn`,()=>{
 const paper=JSON.parse(fs.readFileSync(`public/practice/practice-listening-${n}.json`)),part=paper.parts[0];
 const audit=JSON.parse(fs.readFileSync(`docs/listening-speaker-review/practice-listening-${n}-part-1.json`));
 assert.equal(hash(fs.readFileSync('public'+part.audioUrls[0])),audit.audioSha256);
 assert.equal(audit.humanAuditoryReview,false);assert.equal(audit.textUnchanged,true);assert.equal(audit.wordClocksUnchanged,true);
 const words=readWords(part.passage);assert.equal(words.length,audit.tokenCount);assert.equal(hash(JSON.stringify(words.map(w=>w.text))),audit.tokensSha256);
 for(const [index,w]of words.entries()){
  const turn=n===4?audit.turns[w.paragraph]:audit.turns.findLast(t=>t.index<=index);
  assert.equal(w.speaker,n===4?(turn.assignedSpeaker||turn.closestVoice):turn.speaker,`${index} ${w.text}`);
 }
 const clocks=[...part.passage.matchAll(/<span data-cue-start="([^"]+)" data-cue-end="([^"]+)">([^<]*)<\/span>/g)].map(m=>[m[1],m[2],decode(m[3])]);
 assert.equal(clocks.length,audit.wordClockCount);assert.equal(hash(JSON.stringify(clocks)),audit.wordClocksSha256);
 if(n===4){
  assert.equal(audit.turns.length,80);
  for(const i of [16,19,24,30,34,38,50,55,63,66,68,70,72,74,76,78])assert.equal(audit.turns[i].closestVoice,'Speaker 3');
  for(const i of [17,18,22,25,29,31,35,39,42,51,56,62,67,69,71,73,75,77])assert.equal(audit.turns[i].closestVoice,'Speaker 2');
  assert.equal(audit.turns[0].assignedSpeaker,'Speaker 4');
 }else{
  assert.equal(audit.turns.length,48);
  for(const turn of audit.turns){
   if(turn.additionalVoiceEvidence){const evidence=turn.additionalVoiceEvidence;assert.equal(evidence.resolvedSpeaker||evidence.closestEligibleVoice,turn.speaker,turn.phrase);if(evidence.resolvedSpeaker){assert.equal(evidence.acousticAssignmentConfirmed,true);assert.equal(evidence.resolutionMethod,'independent-acoustic-verification');assert.equal(evidence.previousContextResolution.acousticAssignmentConfirmed,false);assert.ok(evidence.independentVoiceEvidence.every(r=>r.chosen==='Student'));}}
   else assert.equal(turn.closestVoice,turn.speaker,turn.phrase);
  }
  assert.ok(audit.renderedGroups.some(g=>g.speaker==='Speaker 3'&&g.text.includes('Oh, good morning.')));
  assert.ok(audit.renderedGroups.some(g=>g.speaker==='Speaker 2'&&g.text.includes('No. All our rooms are self-catering now.')));
  assert.ok(audit.renderedGroups.some(g=>g.speaker==='Speaker 1'&&g.text.includes('Before you hear the rest')));
  const independent=audit.independentAcousticReview;
  assert.equal(independent.primaryModelDisagreementRetained,true);
  assert.equal(independent.humanAuditoryReview,false);
  assert.equal(independent.shortPhraseControls.length,12);
  assert.ok(independent.shortPhraseControls.every(r=>r.chosen===r.label));
  const chosen=independent.models[independent.selectedModel];
  assert.equal(chosen.leaveOneOutControls.length,13);
  assert.ok(chosen.leaveOneOutControls.every(r=>r.chosen===r.label));
  assert.equal(chosen.targetChecks.length,5);
  for(const r of chosen.targetChecks){assert.equal(r.chosen,'Student');const scores=Object.values(r.scores).sort((a,b)=>b-a);assert.ok(scores[0]-scores[1]>.05);}
 }
});
