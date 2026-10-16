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
 const keys=JSON.parse(fs.readFileSync('src/data/single-passage-reading-keys.json','utf8'));
 const catalog=JSON.parse(fs.readFileSync('src/data/single-passage-reading-catalog.json','utf8'));
 for(const {number,questionCount} of catalog){
 await send('Page.navigate',{url:base+'/practice/reading/single/'+number});await until(`!!document.querySelector('.exam-start')`);await ev('localStorage.clear()');await send('Page.reload');await until(`!!document.querySelector('.exam-start')`);assert.equal(await ev(`document.querySelector('[role="timer"]').textContent`),'20:00');
 await ev(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Start Test').click()`);await until(`document.querySelectorAll('.exam-question-group > div button').length===${questionCount}`);
 await ev(`(()=>{const key=${JSON.stringify(keys['single-reading-'+number])};for(const field of document.querySelectorAll('.cd-questions input[name],.cd-questions select[name]')){const n=field.getAttribute('aria-label').match(/Question ([0-9]+)/)[1];const group=key.parts[1].groups.find(g=>g.questions.includes(+n));const answer=group?group.acceptedSets[0].toReversed()[group.questions.indexOf(+n)]:key.answers[n][0];if(field.type==='radio'){if(field.value===answer)field.click();}else{field.value=answer;field.dispatchEvent(new Event('input',{bubbles:true}));}}})()`);
 assert.ok(await ev(`document.querySelector('.exam-saved').getAttribute('aria-label').startsWith('${questionCount} of ${questionCount}')`));
 const desktop=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/single-reading-'+number+'-desktop.png',Buffer.from(desktop.data,'base64'));
 await ev(`document.querySelector('.exam-submit').click()`);await delay(80);await ev(`Array.from(document.querySelectorAll('dialog button')).find(b=>b.textContent==='Submit and review').click()`);await until(`!!document.querySelector('[data-testid="correct-score"]')`);assert.equal(await ev(`parseInt(document.querySelector('[data-testid="correct-score"]').textContent)`),questionCount);assert.equal(await ev(`document.querySelector('[data-testid="estimated-band"]').textContent`),'—');
 await ev(`document.querySelector('.results-review-open').click()`);await until(`!!document.querySelector('.review-tutor-paragraph')`);
 for(const lang of ['en','uz']){await ev(`var select=document.querySelector('[aria-label="Explanation language"]');select.value='${lang}';select.dispatchEvent(new Event('change',{bubbles:true}));`);await delay(80);assert.ok(await ev(`document.querySelector('.review-tutor-paragraph').textContent.length>20`));}
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(80);assert.ok(await ev(`document.documentElement.scrollWidth<=innerWidth`));const mobile=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/single-reading-'+number+'-mobile.png',Buffer.from(mobile.data,'base64'));await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 }
 await send('Page.navigate',{url:base+'/?view=reading&format=single'});await until(`document.querySelectorAll('a[href^="/practice/reading/single/"]').length===${catalog.length}`);
 fs.writeFileSync('docs/single-reading-browser-check.json',JSON.stringify({passages:catalog.length,questions:catalog.reduce((n,i)=>n+i.questionCount,0),correct:catalog.reduce((n,i)=>n+i.questionCount,0),durationMinutes:20,band:null,languages:['en','uz'],mobile:true,catalog:true},null,2));console.log('All single passages: source answers, 20-minute timers, EN/UZ explanations, no band extrapolation, mobile and catalogue passed.');await send('Browser.close');
 }catch(error){console.error(error);process.exitCode=1;}finally{ws?.close();chrome.kill();setTimeout(()=>process.exit(process.exitCode||0),100);}
