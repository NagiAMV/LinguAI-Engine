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
 const images=html=>html.replace(/src="(\/practice\/assets\/[^"]+)"/g,(tag,url)=>{const path='public'+url;if(!fs.existsSync(path))return tag;const type=url.endsWith('.png')?'png':url.endsWith('.webp')?'webp':'jpeg';return `src="data:image/${type};base64,${fs.readFileSync(path).toString('base64')}"`;});
 for(const [index,file] of files.entries()){
  const paper=JSON.parse(fs.readFileSync('public/practice/'+file)),key=keys[paper.id],questions=await ev(`window.getQuestions(${JSON.stringify(paper)})`);
  const correct={};for(const q of questions)if(!(q.name in correct))correct[q.name]=key?.answers?.[q.number]?.[0]||'';
  for(const part of paper.parts)for(const group of key?.parts?.[part.id]?.groups||[]){const members=questions.filter(q=>q.partIndex===paper.parts.indexOf(part)&&group.questions.includes(Number(q.number))),names=[...new Set(members.map(q=>q.name))],set=group.acceptedSets?.[0]||group.questions.map(n=>key.answers[n]?.[0]);if(names.length===1&&members[0]?.multiple)correct[names[0]]=set;else names.forEach((name,i)=>correct[name]=set[i]||'');}
  const mixed=Object.fromEntries(Object.entries(correct).map(([name,value],i)=>[name,i%3===0?'':i%3===1?value:'A very long incorrect answer '+('word '.repeat(18)).trim()]));
  for(const width of [1440,390]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<700});
   for(const [state,answers] of [['blank',{}],['correct',correct],['mixed',mixed]]){
    const markup=renderToStaticMarkup(React.createElement(module.exports.default,{test:paper,answerKey:key,explanations:explanations[paper.id]||{},questions,answers,flags:[],session:{finishedAt:100000,startedAt:1},answered:Object.values(answers).filter(v=>Array.isArray(v)?v.length:v).length}));
    const metrics=await ev(`(()=>{document.body.innerHTML='<main class="practice-exam exam-finished" data-theme="dark">'+${JSON.stringify(markup)}+'</main>';document.querySelectorAll('.results-transcripts details').forEach(d=>d.open=true);const sheet=document.querySelector('.results-sheet'),filters=document.querySelector('.results-filters');return {sheet:sheet.scrollWidth-sheet.clientWidth,filters:filters.scrollWidth-filters.clientWidth,page:document.documentElement.scrollWidth-innerWidth,rows:document.querySelectorAll('.results-table tbody tr').length};})()`);resultCases++;
    if(metrics.sheet>4||metrics.filters>4||metrics.page>4)problems.push({view:'results',id:paper.id,width,state,...metrics});
   }
   const rows=reviewRows.buildReviewRows(paper,questions,mixed,[],key);
   for(const part of paper.parts){
    const partRows=rows.filter(r=>r.part===part.id),partExplanations=explanations[paper.id]||{};
    const markup=`<main class="practice-exam exam-finished ${paper.resource==='listening'?'imported-listening':''}" data-theme="dark"><section class="exam-passage-review"><div class="review-reading-panes"><article data-review-passage><div class="cd-content review-content">${images(layoutMapQuestions(part.passage))}</div></article><article><div class="cd-content review-content">${images(layoutMapQuestions(part.questions))}</div></article></div></section></main>`;
    const metrics=await ev(`(()=>{document.body.innerHTML=${JSON.stringify(markup)};const nodes=document.querySelectorAll('.review-content'),q=nodes[1];const original=window.annotationText(q);window.applyReview({current:q},${JSON.stringify(mixed)},${JSON.stringify(partRows)},${JSON.stringify(partRows[0]?.name)},${JSON.stringify(width===390?'uz':'ru')},${JSON.stringify(partExplanations)},${part.id},()=>{},window.arrangeImportedMaps,window.prepareReviewTables);q.querySelectorAll('details[data-explanation]').forEach(d=>d.open=true);const cards=[...q.querySelectorAll('[data-review-feedback]')].filter(c=>getComputedStyle(c).display!=='none');return {pane:q.parentElement.scrollWidth-q.parentElement.clientWidth,page:document.documentElement.scrollWidth-innerWidth,disabled:[...q.querySelectorAll('input,select')].every(f=>f.disabled),cards:cards.length,expected:${partRows.length},offsets:original===window.annotationText(q),clippedCards:cards.filter(c=>{const wrapper=c.closest('.review-table-scroll,.native-diagram-scroll')||q.parentElement,r=c.getBoundingClientRect(),p=wrapper.getBoundingClientRect();return wrapper.matches('.review-table-scroll,.native-diagram-scroll') ? r.left<p.left-wrapper.scrollLeft-5 || r.right>p.left-wrapper.scrollLeft+wrapper.scrollWidth+5 : r.left<p.left-5 || r.right>p.right+5;}).length};})()`);reviewCases++;
    if(metrics.pane>4||metrics.page>4||!metrics.disabled||!metrics.offsets||metrics.cards<partRows.length||metrics.clippedCards>0)problems.push({view:'review',id:paper.id,part:part.id,width,...metrics});
   }
  }
  if(index%30===0)console.log('Checked',index+1,'of',files.length);
 }
 fs.writeFileSync('.cache/post-test-audit.json',JSON.stringify({papers:files.length,resultCases,reviewCases,problems},null,2));console.log(JSON.stringify({papers:files.length,resultCases,reviewCases,problems:problems.length,examples:problems.slice(0,12)},null,2));
}finally{ws?.close();chrome.kill();}

