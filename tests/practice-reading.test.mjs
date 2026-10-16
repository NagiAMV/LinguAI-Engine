import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {scoreExam} from '../src/components/content/exam-score.mjs';
const exam=JSON.parse(fs.readFileSync('public/practice/practice-reading-1.json','utf8')),key=JSON.parse(fs.readFileSync('src/data/practice-reading-keys.json','utf8'))[exam.id];
const questions=exam.parts.flatMap((part,partIndex)=>part.fieldNames.map(name=>({name,id:part.fieldLabels[name],number:part.fieldLabels[name].replace('Question ',''),partIndex})));
test('new Reading paper has 40 usable fields, complete keys and safe passage markup',()=>{
 assert.deepEqual(questions.map(q=>+q.number),Array.from({length:40},(_,i)=>i+1));
 for(const part of exam.parts){assert.doesNotMatch(part.passage+part.questions,/<script|\son\w+=|javascript:/i);for(const name of part.fieldNames)assert.ok(part.questions.includes(`name="${name}"`));}
 const answers=Object.fromEntries(questions.map(q=>[q.name,key.answers[q.number][0]]));assert.equal(scoreExam(exam,questions,answers,key).correct,40);assert.equal(scoreExam(exam,questions,answers,key).band,'9.0');
});
