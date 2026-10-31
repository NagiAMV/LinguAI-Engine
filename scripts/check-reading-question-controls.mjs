import fs from 'node:fs';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';
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
 await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});

 const readingUI=fs.readFileSync('src/components/content/reading-questions.mjs','utf8').replace(/export /g,'');
 const css=fs.readFileSync('src/app/globals.css','utf8')+'\n'+fs.readFileSync('src/components/content/practice-exam.css','utf8');

 const annotations=fs.readFileSync('src/components/content/exam-annotations.mjs','utf8').replace(/export /g,'');
 const paper=JSON.parse(fs.readFileSync('public/practice/single-reading-1.json'));
 const result=await ev(`(()=>{document.head.innerHTML='<style>'+${JSON.stringify(css)}+'</style>';document.body.innerHTML='<div class="cd-content cd-questions"></div>';const root=document.body.firstElementChild;root.innerHTML=${JSON.stringify(paper.parts[0].questions)};eval(${JSON.stringify(readingUI)}+';window.enhance=enhanceReadingQuestions;window.sync=syncReadingAnswers;');eval(${JSON.stringify(annotations)}+';window.annotationText=root=>textNodes(root).map(n=>n.textContent).join(\"\");');const originalText=window.annotationText(root);let events=[];root.addEventListener('input',e=>events.push([e.target.name,e.target.value]));window.enhance(root);window.sync(root);const select=root.querySelector('select[hidden]'),buttons=select.nextElementSibling.querySelectorAll('button');buttons[0].click();window.sync(root);const first=select.value,pressed=buttons[0].getAttribute('aria-pressed');buttons[0].click();window.sync(root);const cleared=select.value;select.value=buttons[1].dataset.answerValue;window.sync(root);const restored=buttons[1].getAttribute('aria-pressed');select.disabled=true;window.sync(root);const disabled=[...buttons].every(b=>b.disabled);const before=root.querySelectorAll('.reading-answer-buttons').length;window.enhance(root);return {textOffsetsPreserved:originalText===window.annotationText(root),first,pressed,cleared,restored,disabled,events,idempotent:before===root.querySelectorAll('.reading-answer-buttons').length};})()`);
 assert.equal(result.first,'TRUE');assert.equal(result.pressed,'true');assert.equal(result.cleared,'');assert.equal(result.restored,'true');assert.ok(result.disabled&&result.idempotent&&result.textOffsetsPreserved);assert.equal(result.events.length,2);
 const matching=JSON.parse(fs.readFileSync('public/practice/single-reading-2.json'));
 const labels=await ev(`(()=>{const root=document.querySelector('.cd-questions');root.innerHTML=${JSON.stringify(matching.parts[0].questions)};window.enhance(root);return [...root.querySelector('select').options].map(o=>[o.value,o.textContent]);})()`);
 assert.ok(labels.some(([value,text])=>value==='A'&&text.includes('James Flynn')));
 const full=JSON.parse(fs.readFileSync('public/practice/practice-reading-2.json'));
 const headings=await ev(`(()=>{const root=document.querySelector('.cd-questions');root.innerHTML=${JSON.stringify(full.parts[1].questions)};window.enhance(root);return {labels:[...root.querySelector('select').options].map(o=>o.textContent),cards:root.querySelectorAll('.reading-question-card').length};})()`);
 assert.ok(headings.labels.some(label=>label.includes('Drucker')));assert.ok(headings.cards>=6);
 console.log(JSON.stringify({answerButtons:result,matchingLabels:labels,fullHeadings:headings}));
}finally{ws?.close();chrome.kill();}
