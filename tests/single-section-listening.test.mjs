import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {scoreExam} from '../src/components/content/exam-score.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
test('80 matched single recordings have ten answer slots and four balanced groups',()=>{
 const catalog=read('src/data/single-section-listening-catalog.json'),keys=read('src/data/single-section-listening-keys.json');assert.equal(catalog.length,80);
 for(let section=1;section<=4;section++)assert.equal(catalog.filter(x=>x.sectionNumber===section).length,20);
 for(const item of catalog){
  const paper=read(`public/practice/${item.id}.json`),part=paper.parts[0],key=keys[item.id],numbers=Array.from({length:10},(_,i)=>(item.sectionNumber-1)*10+i+1);
  assert.equal(paper.parts.length,1);assert.equal(part.id,item.sectionNumber);assert.equal(part.fieldNames.length,10-(paper.nativeAnswerGroups||[]).reduce((n,g)=>n+g.sources.length-1,0));assert.deepEqual(Object.keys(key.answers).map(Number),numbers);
  assert.ok(part.audioDurationSeconds>180&&part.audioDurationSeconds<800,item.id);
  for(const src of [...part.audioUrls,...Array.from(part.questions.matchAll(/src="([^"]+)"/g),m=>m[1])])assert.ok(fs.statSync('public'+src).size>10000,src);
  assert.ok(!/data:|<script|onload=/.test(part.questions));assert.ok(part.questions.includes('native-section-tasks'));assert.ok(!part.questions.includes('section-answer-sheet'));assert.ok(!/single-listening-\d+-page-\d+\.webp/.test(part.questions));
  const positions=paper.worksheetInputPositions;for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++){const a=positions[i],b=positions[j];assert.ok(!(a.page===b.page&&Math.abs(a.y-b.y)<14&&a.x<b.x+b.width&&b.x<a.x+a.width),item.id+' overlapping inputs');}
  const questions=numbers.map((number,i)=>{const group=paper.nativeAnswerGroups?.find(g=>g.sources.includes(`single_listening_${item.number}_${number}`));return {id:`0:${number}`,partIndex:0,number:String(number),name:group?.target||`single_listening_${item.number}_${number}`,multiple:!!group,slot:group?group.sources.indexOf(`single_listening_${item.number}_${number}`):0};}),answers=Object.fromEntries(questions.map(q=>[q.name,key.answers[q.number][0]]));
  // Reverse unordered groups: each distinct correct response still earns a mark.
  for(const group of key.parts[part.id].groups){const values=[...group.acceptedSets[0]].reverse();const native=paper.nativeAnswerGroups?.find(g=>g.sources.includes(`single_listening_${item.number}_${group.questions[0]}`));if(native)answers[native.target]=values;else group.questions.forEach((n,i)=>{answers[questions.find(q=>+q.number===n).name]=values[i];});}
  assert.deepEqual(scoreExam(paper,questions,answers,key),{correct:10,total:10,checked:10,pending:0,band:null},item.id);
 }
});
test('every single Reading passage is assigned one of three source positions',()=>{
 for(const item of read('src/data/single-passage-reading-catalog.json'))assert.ok([1,2,3].includes(item.passageNumber));
});
test('spelled surnames are accepted as names and the source numbering correction is preserved',()=>{
 const keys=read('src/data/single-section-listening-keys.json');assert.ok(keys['single-listening-1'].answers['7'].includes('Maughan'));assert.ok(keys['single-listening-1'].answers['1'].includes('cafe'));
 assert.deepEqual(keys['single-listening-67'].answers['38'],['entertainment']);assert.deepEqual(keys['single-listening-67'].answers['39'],['opera']);
});
