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
 await send('Page.enable');await send('Emulation.setFocusEmulationEnabled',{enabled:true});await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});

 const {layoutMapQuestions,arrangeImportedMaps}=await import('../src/components/content/map-layout.mjs');
 const listeningCode=fs.readFileSync('src/components/content/listening-questions.mjs','utf8').replace(/export /g,'');
 const annotationCode=fs.readFileSync('src/components/content/exam-annotations.mjs','utf8').replace(/export /g,'');
 const allKeys={...JSON.parse(fs.readFileSync('src/data/practice-listening-keys.json')),...JSON.parse(fs.readFileSync('src/data/single-section-listening-keys.json'))};
 const css=fs.readFileSync('src/app/globals.css','utf8')+'\n'+fs.readFileSync('src/components/content/practice-exam.css','utf8');

 const paper=JSON.parse(fs.readFileSync('public/practice/single-listening-24.json'));
 const groups=allKeys[paper.id].parts[2].groups;
 const result=await ev(`(()=>{document.head.innerHTML='<style>'+${JSON.stringify(css)}+'</style>';document.body.innerHTML='<div class="cd-content"></div>';const root=document.body.firstElementChild;root.innerHTML=${JSON.stringify(paper.parts[0].questions)};eval(${JSON.stringify(listeningCode)}+';window.enhance=enhanceListeningQuestions;window.sync=syncListeningQuestions;');window.enhance(root,${JSON.stringify(groups)});const fields=[...root.querySelectorAll('input[type=checkbox]')].filter(f=>f.name==='single_listening_24_11');fields.slice(0,3).forEach(f=>f.checked=true);window.sync(root);const count=root.querySelector('[data-listening-group="11-12"]');const excess=count.textContent,warning=count.classList.contains('over-limit');fields[2].checked=false;window.sync(root);const corrected=count.textContent;return {excess,warning,corrected,other:root.querySelector('[data-listening-group="13-14"]').textContent,hiddenDuplicates:root.querySelectorAll('.listening-duplicate-number').length};})()`);
 assert.ok(result.warning);assert.ok(result.excess.includes('3 of 2'));assert.equal(result.corrected,'Selected 2 of 2');assert.equal(result.other,'Selected 0 of 2');assert.ok(result.hiddenDuplicates>=6);
 const section=JSON.parse(fs.readFileSync('public/practice/single-listening-23.json'));
 const words=await ev(`(()=>{const root=document.body.firstElementChild;root.innerHTML=${JSON.stringify(section.parts[0].questions)};window.enhance(root,[]);const select=root.querySelector('select[name="single_listening_23_15"]'),field=root.querySelector('input[name="single_listening_23_18"]');field.value='will ring a bell';window.sync(root);return {labels:[...select.options].map(o=>o.textContent),hints:root.querySelectorAll('.listening-word-limit').length,unchanged:field.value};})()`);
 assert.ok(words.labels.includes('C — Gary'));assert.equal(words.hints,0);assert.equal(words.unchanged,'will ring a bell');
 const notes=JSON.parse(fs.readFileSync('public/practice/practice-listening-2.json')).parts[3];
 const notesResult=await ev(`(()=>{const root=document.body.firstElementChild;root.innerHTML=${JSON.stringify(notes.questions)};eval(${JSON.stringify(annotationCode)}+';window.noteText=root=>textNodes(root).map(n=>n.textContent).join("");');const originalText=window.noteText(root),fields=[...root.querySelectorAll('input')].map(f=>f.name);window.enhance(root,[]);const firstCount=root.querySelectorAll('.listening-note-section').length;window.enhance(root,[]);return {sameText:originalText===window.noteText(root),sameFields:JSON.stringify(fields)===JSON.stringify([...root.querySelectorAll('input')].map(f=>f.name)),sections:firstCount,idempotent:firstCount===root.querySelectorAll('.listening-note-section').length,hiddenDashes:root.querySelectorAll('.listening-note-marker').length,hints:root.querySelectorAll('.listening-word-limit').length};})()`);
 assert.ok(notesResult.sameText&&notesResult.sameFields&&notesResult.idempotent,JSON.stringify(notesResult));assert.ok(notesResult.sections>=5);assert.ok(notesResult.hiddenDashes>=5);assert.equal(notesResult.hints,0);
 console.log(JSON.stringify({multiChoice:result,matching:words,notes:notesResult}));
}finally{ws?.close();chrome.kill();}
