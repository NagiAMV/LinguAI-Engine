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
 const words=await ev(`(()=>{const root=document.body.firstElementChild;root.innerHTML=${JSON.stringify(section.parts[0].questions)};window.enhance(root,[]);const select=root.querySelector('select[name="single_listening_23_15"]');const field=root.querySelector('input[name="single_listening_23_18"]');field.value='will ring a bell';window.sync(root);const hint=field.nextElementSibling;const invalid=hint.classList.contains('over-limit');const unchanged=field.value;field.value='ring a bell';window.sync(root);return {labels:[...select.options].map(o=>o.textContent),invalid,unchanged,valid:!hint.classList.contains('over-limit')};})()`);
 assert.ok(words.labels.includes('C — Gary'));assert.ok(words.invalid&&words.valid);assert.equal(words.unchanged,'will ring a bell');
 const diagram=JSON.parse(fs.readFileSync('public/practice/single-listening-43.json'));
 const overlay=await ev(`(()=>{const root=document.body.firstElementChild;root.innerHTML=${JSON.stringify(diagram.parts[0].questions)};window.enhance(root,[]);const hint=root.querySelector('.listening-overlay-limit');if(!hint)return {found:false};const field=hint._field;field.style.cssText="position:fixed;top:0;left:0;width:180px;height:35px";field.focus();window.sync(root);const activeBefore=document.activeElement===field;const shown=!hint.hidden;field.blur();return {found:true,activeBefore,parentHidden:!!field.closest("[hidden]"),active:document.activeElement?.tagName,disabled:field.disabled,shown,hiddenAfterBlur:hint.hidden,outsideImage:!hint.closest('.worksheet-input')};})()`);
 assert.ok(overlay.found&&overlay.shown&&overlay.hiddenAfterBlur&&overlay.outsideImage,JSON.stringify(overlay));
 console.log(JSON.stringify({multiChoice:result,matchingAndWords:words,diagram:overlay}));
}finally{ws?.close();chrome.kill();}
