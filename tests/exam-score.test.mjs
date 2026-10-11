import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreExam,estimatedBand} from '../src/components/content/exam-score.mjs';
const exam={resource:'reading',parts:[{id:1}]};
const questions=[1,2,3,4].map(n=>({id:String(n),number:String(n),name:'q'+n,partIndex:0}));
const key={answers:{1:['paint','paints'],2:['B'],3:['D'],4:['YES']},parts:{1:{groups:[{questions:[2,3],acceptedSets:[['B','D']]}]}}};
test('score counts real correct answers, not answered fields',()=>{
 assert.deepEqual(scoreExam(exam,questions,{q1:' PAINTS ',q2:'D',q3:'B',q4:'NO'},key),{correct:3,total:4,checked:4,pending:0,band:null});
 assert.equal(scoreExam(exam,questions,{},key).correct,0);
});
test('unordered groups earn partial credit and cannot reuse a correct answer',()=>{
 assert.equal(scoreExam(exam,questions,{q2:'B',q3:'C'},key).correct,1);
 assert.equal(scoreExam(exam,questions,{q2:'B',q3:'B'},key).correct,1);
 const checkboxes=questions.slice(1,3).map(q=>({...q,name:'choices',multiple:true}));
 assert.equal(scoreExam(exam,checkboxes,{choices:['B','D','C']},key).correct,0);
 assert.equal(scoreExam(exam,checkboxes,{choices:['D','B']},key).correct,2);
});
test('missing keys stay ungraded and nonstandard totals have no invented band',()=>{
 const result=scoreExam(exam,questions,{q1:'paint'},null);
 assert.equal(result.pending,4);assert.equal(result.band,null);
 assert.equal(estimatedBand(40,41,41,'reading'),null);
 assert.equal(estimatedBand(35,40,39,'listening'),null);
});
test('module tables use published thresholds and half bands',()=>{
 assert.equal(estimatedBand(30,40,40,'reading'),'7.0');
 assert.equal(estimatedBand(35,40,40,'listening'),'8.0');
 assert.equal(estimatedBand(40,40,40,'reading'),'9.0');
 assert.equal(estimatedBand(19,40,40,'reading'),'5.5');
 assert.equal(estimatedBand(15,40,40,'listening'),'4.5');
 assert.equal(estimatedBand(0,40,40,'reading'),'< 2.5');
});
