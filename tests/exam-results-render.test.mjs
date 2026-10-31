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
vm.runInNewContext(compiled,{module,exports:module.exports,require:id=>{
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
