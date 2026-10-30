import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {scoreExam} from '../src/components/content/exam-score.mjs';
const keys=JSON.parse(fs.readFileSync('src/data/practice-listening-keys.json','utf8'));
const catalog=JSON.parse(fs.readFileSync('src/data/practice-listening-catalog.json','utf8'));
for(const item of catalog) {
 const exam=JSON.parse(fs.readFileSync(`public/practice/${item.id}.json`,'utf8'));
 const key=keys[item.id];
 const questions=exam.parts.flatMap((part,partIndex)=>part.fieldNames.flatMap(name=>{
  const n=Number(part.fieldLabels[name].replace('Question ',''));
  const group=key.parts[part.id].groups.find(g=>g.questions[0]===n);
  return (group?.questions||[n]).map((number,slot)=>({id:`${partIndex}:${number}`,number:String(number),name,slot,partIndex,multiple:!!group}));
 }));
 test(`${item.id}: forty usable questions, safe markup, local assets and complete key`,()=>{
  assert.deepEqual(questions.map(q=>+q.number).sort((a,b)=>a-b),Array.from({length:40},(_,i)=>i+1));
  assert.equal(exam.parts.length,4);
  for(const p of exam.parts){
   if (exam.audioStatus === 'missing') { assert.equal(p.audioUrls.length,0); assert.equal(item.audioStatus,'missing'); }
   else assert.ok(p.audioUrls.length > 0, 'available recording must have a source');
   assert.doesNotMatch(p.questions,/<(?:script|iframe|object|embed|style)\b|\son\w+\s*=|javascript:|type="hidden"/i);
   for(const url of p.audioUrls){const path='public'+url;assert.ok(fs.statSync(path).size>1e6);const head=fs.readFileSync(path).subarray(0,3);assert.ok(head.toString()==='ID3'||head[0]===255,'real audio header');}
   for(const name of p.fieldNames)assert.ok(p.questions.includes(`name="${name}"`));
  }
  assert.equal(Object.keys(key.answers).length,40);
 });
 test(`${item.id}: all answers earn 40/40; unordered choices earn partial credit and reject excess`,()=>{
  const answers=Object.fromEntries(questions.map(q=>[q.name,q.multiple?key.parts[exam.parts[q.partIndex].id].groups.find(g=>g.questions.includes(+q.number)).acceptedSets[0].toReversed():key.answers[q.number][0]]));
  assert.deepEqual(scoreExam(exam,questions,answers,key),{correct:40,total:40,checked:40,pending:0,band:'9.0'});
  const q=questions.find(q=>q.multiple);
  if(!q){assert.equal(scoreExam(exam,questions,{...answers,[questions[0].name]:'wrong'},key).correct,39);return;}
  const options=answers[q.name];
  assert.equal(scoreExam(exam,questions,{...answers,[q.name]:[options[0]]},key).correct,40-options.length+1);
  assert.equal(scoreExam(exam,questions,{...answers,[q.name]:[...options,'Z']},key).correct,40-options.length);
 });
}
