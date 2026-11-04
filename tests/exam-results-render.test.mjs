import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import * as score from '../src/components/content/exam-score.mjs';
import * as rows from '../src/components/content/answer-review.mjs';
import * as ideas from '../src/lib/practice-ideas.mjs';
const require=createRequire(import.meta.url);
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const filename='src/components/content/ExamResults.jsx';
const compiled=require('next/dist/compiled/babel/core').transformSync(fs.readFileSync(filename,'utf8'),{filename,presets:[require.resolve('next/babel')]}).code;
const module={exports:{}};
let renderStates=null,renderCall=0;
vm.runInNewContext(compiled,{module,exports:module.exports,require:id=>{
 if(id==='react')return {...React,useState:initial=>React.useState(renderStates?(renderStates[renderCall++]??initial):initial)};
 if(id.includes('AccountProvider'))return {useAccount:()=>({recordAttempt(){},user:null,syncMessage:''})};
 if(id==='./ExamPassageReview')return ()=>null;
 if(id==='./exam-score.mjs')return score;
 if(id==='./answer-review.mjs')return rows;
 if(id==='@/lib/practice-ideas.mjs')return ideas;
 if(id.startsWith('@/data/'))return require('../src/data/'+id.slice('@/data/'.length));
 if(id.startsWith('@babel/runtime/'))return require('next/dist/compiled/'+id);
 return require(id);
}});
for(const id of ['single-listening-22','practice-listening-1','single-reading-1'])test(`${id}: results render without runtime errors`,()=>{
 const paper=JSON.parse(fs.readFileSync('public/practice/'+id+'.json'));
 const markup=renderToStaticMarkup(React.createElement(module.exports.default,{test:paper,answerKey:{answers:{}},explanations:{},questions:[],answers:{},flags:[],session:{finishedAt:1000,startedAt:1},answered:0}));
 assert.ok(markup.includes('Your answers, at a glance.'));
 if(id.startsWith('single-listening')){assert.ok(!markup.includes('Estimated IELTS Band'));assert.ok(markup.includes('>Answers<'));}
 else assert.ok(markup.includes('Estimated IELTS Band'));
});

test('results filters keep correct, wrong, blank and pending rows separate',()=>{
 const paper={id:'filter-review-test',title:'Filter test',resource:'listening',parts:[{id:1,fieldNames:['q1','q2','q3'],passage:'',questions:''},{id:2,fieldNames:['q4','q5'],passage:'',questions:''}]};
 const questions=paper.parts.flatMap((part,partIndex)=>part.fieldNames.map(name=>({id:name,name,number:name.slice(1),partIndex,multiple:false})));
 const answers={q1:'A',q2:'wrong',q3:'',q4:'right',q5:''};
 const key={answers:{1:['A'],2:['B'],3:['C'],4:['right']},parts:{1:{groups:[]},2:{groups:[]}}};
 try {
  for(const [part,filter,expected] of [['all','all',5],['all','correct',2],['all','incorrect',1],['all','unanswered',2],['all','answered',3],['all','pending',1],['2','all',2],['2','correct',1]]){
   renderCall=0;renderStates=[null,part,filter];
   const markup=renderToStaticMarkup(React.createElement(module.exports.default,{test:paper,answerKey:key,explanations:{},questions,answers,flags:[],session:{finishedAt:1000,startedAt:1},answered:3}));
   assert.equal((markup.match(/<tr class="result-/g)||[]).length,expected,part+' '+filter);
  }
 }finally{renderStates=null;}
});
