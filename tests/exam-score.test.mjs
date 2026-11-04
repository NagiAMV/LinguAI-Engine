import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreExam,scoreParts,estimatedBand} from '../src/components/content/exam-score.mjs';
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

test('part scores preserve partial credit, missing keys and original part indices',()=>{
 const paper={resource:'listening',parts:[{id:1},{id:2}]};
 const qs=[{id:'1',number:'1',name:'q1',partIndex:0},...[11,12].map(n=>({id:String(n),number:String(n),name:'choices',multiple:true,partIndex:1})),{id:'13',number:'13',name:'q13',partIndex:1}];
 const k={answers:{1:['yes'],11:['A'],12:['E']},parts:{2:{groups:[{questions:[11,12],acceptedSets:[['A','E']]}]}}};
 const answers={q1:'yes',choices:['A','C']};
 const parts=scoreParts(paper,qs,answers,k);
 assert.deepEqual(parts.map(({part,correct,total,pending})=>({part,correct,total,pending})),[{part:1,correct:1,total:1,pending:0},{part:2,correct:1,total:3,pending:1}]);
 assert.equal(parts.reduce((sum,p)=>sum+p.correct,0),scoreExam(paper,qs,answers,k).correct);
});
