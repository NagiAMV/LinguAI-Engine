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
 const files=fs.readdirSync('public/practice').filter(f=>/^(practice|single)-(reading|listening)-\d+\.json$/.test(f));
 const problems=[];let resultCases=0,reviewCases=0;
 await ev(`document.head.innerHTML='<meta name="viewport" content="width=device-width,initial-scale=1"><style>'+${JSON.stringify(css)}+'</style>';eval(${JSON.stringify(indexCode)}+';window.getQuestions=questionIndex;');eval(${JSON.stringify(annotationCode)}+';window.annotationText=root=>textNodes(root).map(n=>n.textContent).join("");');window.normalizeAnswer=${reviewRows.normalizeAnswer.toString()};window.arrangeImportedMaps=${arrangeImportedMaps.toString()};window.prepareReviewTables=${prepareReviewTables.toString()};window.applyReview=new Function('root','answers','rows','active','language','explanations','part','onEvidence','arrangeImportedMaps','prepareReviewTables',${JSON.stringify(effect)});`);

 const paper=JSON.parse(fs.readFileSync('public/practice/single-listening-11.json'));
 const key=keys[paper.id],questions=await ev('window.getQuestions('+JSON.stringify(paper)+')');
 const rows=reviewRows.buildReviewRows(paper,questions,{},[],key);
 const checks=[];
 for(const theme of ['light','dark'])for(const width of [1440,780,390]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<700});
  const markup='<main class="practice-exam exam-finished imported-listening" data-theme="'+theme+'"><section class="exam-passage-review"><div class="review-reading-panes"><article data-review-passage><div class="cd-content review-content">Transcript</div></article><article><div class="cd-content review-content">'+paper.parts[0].questions+'</div></article></div></section></main>';
  function inspect(markup, rows) {
   document.body.innerHTML=markup;
   const q=document.querySelectorAll('.review-content')[1];
   const gap=()=>q.querySelector('input[name="single_listening_11_2"]').closest('.native-gap');
   const before=gap().getBoundingClientRect().width,text=window.annotationText(q);
   window.applyReview({current:q},{},rows,'single_listening_11_1','ru',{},1,()=>{},window.arrangeImportedMaps,window.prepareReviewTables);
   const field=q.querySelector('input[name="single_listening_11_2"]'),line=field.closest('p'),feedback=q.querySelector('[data-review-feedback="single_listening_11_2"]');
   q.querySelector('details[data-explanation]').open=true;
   return {before,after:gap().getBoundingClientRect().width,feedbackAfterSentence:feedback.parentElement===line&&line.lastElementChild===feedback,inlineFeedback:gap().querySelectorAll('[data-review-feedback]').length,textPreserved:text===window.annotationText(q),overflow:document.documentElement.scrollWidth-innerWidth};
  }
  const result=await ev(`(${inspect.toString()})(${JSON.stringify(markup)},${JSON.stringify(rows)})`);
  assert.equal(result.inlineFeedback,0);assert.ok(result.feedbackAfterSentence&&result.textPreserved,JSON.stringify(result));assert.ok(Math.abs(result.before-result.after)<3,JSON.stringify(result));assert.ok(result.overflow<5);checks.push({theme,width,...result});
  if(width===1440&&theme==='dark'){const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.cache/inline-review-fixed.png',Buffer.from(shot.data,'base64'));}
 }
 console.log(JSON.stringify(checks));
}finally{ws?.close();chrome.kill();}
