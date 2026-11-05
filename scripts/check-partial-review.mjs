import fs from 'node:fs';import vm from 'node:vm';import {createRequire} from 'node:module';
import * as scoring from '../src/components/content/exam-score.mjs';
import * as reviewRows from '../src/components/content/answer-review.mjs';
import * as ideas from '../src/lib/practice-ideas.mjs';
import {layoutMapQuestions,arrangeImportedMaps} from '../src/components/content/map-layout.mjs';
import {prepareReviewTables} from '../src/components/content/review-tables.mjs';
const require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const filename='src/components/content/ExamResults.jsx',compiled=require('next/dist/compiled/babel/core').transformSync(fs.readFileSync(filename,'utf8'),{filename,presets:[require.resolve('next/babel')]}).code,module={exports:{}};
vm.runInNewContext(compiled,{module,exports:module.exports,require:id=>{
 if(id.includes('AccountProvider'))return {useAccount:()=>({recordAttempt(){},user:null,syncMessage:''})};
 if(id==='./ErrorTags')return require('../tests/helpers/error-tags-component.cjs');if(id==='./ExamPassageReview')return ()=>null;if(id==='./exam-score.mjs')return scoring;if(id==='./answer-review.mjs')return reviewRows;if(id==='@/lib/practice-ideas.mjs')return ideas;
 if(id.startsWith('@/data/'))return require('../src/data/'+id.slice(7));if(id.startsWith('@babel/runtime/'))return require('next/dist/compiled/'+id);return require(id);
}});import {spawn} from 'node:child_process';import assert from 'node:assert/strict';
const port=9400+Math.floor(Math.random()*1000),base=process.env.PRACTICE_BASE_URL||'http://localhost:3011';
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--autoplay-policy=no-user-gesture-required','--remote-debugging-port='+port,'--user-data-dir='+process.cwd()+'/.cache/import-listening-browser-'+port,'--no-first-run','about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let ws;const report=[];
try {
 let tabs;for(let i=0;i<40;i++){try{tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();break;}catch{await delay(250);}}
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let id=0;const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 async function ev(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
 async function until(expression){for(let i=0;i<80;i++){if(await ev(expression))return;await delay(150);}throw Error('Timeout: '+expression);}
 await send('Page.enable');await send('Emulation.setFocusEmulationEnabled',{enabled:true});await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});

 const {layoutMapQuestions,arrangeImportedMaps}=await import('../src/components/content/map-layout.mjs');
 const css=fs.readFileSync('src/app/globals.css','utf8')+'\n'+fs.readFileSync('src/components/content/practice-exam.css','utf8');
 const player=fs.readFileSync('src/components/content/ExamPlayer.jsx','utf8');const indexCode=player.slice(player.indexOf('function questionIndex('),player.indexOf('function hasAnswer('));
 const review=fs.readFileSync('src/components/content/ExamPassageReview.jsx','utf8');const effect=review.slice(review.indexOf('    const element = root.current;'),review.indexOf('\n  }, [html, answers, rows, active'));
 const annotationCode=fs.readFileSync('src/components/content/exam-annotations.mjs','utf8').replace(/export /g,'');
 const keys=Object.assign({},...['practice-listening-keys','single-section-listening-keys','practice-reading-keys','single-passage-reading-keys'].map(name=>JSON.parse(fs.readFileSync('src/data/'+name+'.json'))));
 const explanations=Object.assign({},...['listening-explanations','practice-reading-explanations','single-passage-reading-explanations'].map(name=>JSON.parse(fs.readFileSync('src/data/'+name+'.json'))));
 await ev(`document.head.innerHTML='<meta name="viewport" content="width=device-width,initial-scale=1"><style>'+${JSON.stringify(css)}+'</style>';eval(${JSON.stringify(indexCode)}+';window.getQuestions=questionIndex;');eval(${JSON.stringify(annotationCode)}+';window.annotationText=root=>textNodes(root).map(n=>n.textContent).join("");');window.normalizeAnswer=${reviewRows.normalizeAnswer.toString()};window.arrangeImportedMaps=${arrangeImportedMaps.toString()};window.prepareReviewTables=${prepareReviewTables.toString()};window.applyReview=new Function('root','answers','rows','active','language','explanations','part','onEvidence','arrangeImportedMaps','prepareReviewTables',${JSON.stringify(effect)});`);
 const paper=JSON.parse(fs.readFileSync('public/practice/practice-listening-2.json')),key=keys[paper.id];
 const questions=await ev(`window.getQuestions(${JSON.stringify(paper)})`),name=questions.find(q=>q.number==='19').name,answers={[name]:['A','C']};
 const rows=reviewRows.buildReviewRows(paper,questions,answers,[],key),group=rows.find(r=>r.name===name);
 assert.equal(group.status,'partial');assert.equal(group.credit,1);assert.equal(scoring.scoreExam(paper,questions,answers,key).correct,1);
 for(const language of ['en','ru','uz']){
  const markup='<main class="practice-exam imported-listening" data-theme="dark"><section class="exam-passage-review"><div class="cd-content review-content">'+paper.parts[1].questions+'</div></section></main>';
  const result=await ev(`(()=>{document.body.innerHTML=${JSON.stringify(markup)};const root=document.querySelector('.review-content');window.applyReview({current:root},${JSON.stringify(answers)},${JSON.stringify(rows)},${JSON.stringify(name)},${JSON.stringify(language)},{},2,()=>{},window.arrangeImportedMaps,window.prepareReviewTables);const fields=[...root.querySelectorAll('input[type=checkbox]')].filter(f=>f.name===${JSON.stringify(name)}),feedback=[...root.querySelectorAll('[data-review-feedback]')].find(e=>e.dataset.reviewFeedback===${JSON.stringify(name)});return {fields:fields.map(f=>[f.value,f.checked,f.dataset.reviewStatus]),responses:[...feedback.querySelectorAll('.review-choice-response')].map(e=>({text:e.textContent,status:e.className,color:getComputedStyle(e).color})),credit:feedback.querySelector('.review-group-credit').textContent,undefinedText:feedback.textContent.includes('undefined')};})()`);
  assert.equal(result.fields.find(([v])=>v==='A')[2],'correct');assert.equal(result.fields.find(([v])=>v==='C')[2],'incorrect');assert.ok(result.credit.includes('1 / 2'));assert.notEqual(result.responses[0].color,result.responses[1].color);assert.equal(result.undefinedText,false);report.push({language,...result});
 }
 const summary=renderToStaticMarkup(React.createElement(module.exports.default,{test:paper,answerKey:key,explanations:{},questions,answers,flags:[],session:{finishedAt:1000,startedAt:1},answered:2}));
 assert.ok(summary.includes('Review question 19 in context'));assert.ok(summary.includes('Review question 20 in context'));
 assert.ok(summary.includes('<tr class="result-correct"><th scope="row"><button class="result-number result-question-link" aria-label="Review question 19 in context"'));
 assert.ok(summary.includes('<tr class="result-incorrect"><th scope="row"><button class="result-number result-question-link" aria-label="Review question 20 in context"'));
 assert.equal((summary.match(/<tr class="result-/g)||[]).length,40);
 console.log(JSON.stringify(report));

}finally{ws?.close();chrome.kill();}
