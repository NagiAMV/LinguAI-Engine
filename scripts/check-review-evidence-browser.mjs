import fs from 'node:fs';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';
const debugPort=9400+Math.floor(Math.random()*1000);
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--unsafely-treat-insecure-origin-as-secure=http://unused.invalid','--remote-debugging-port='+debugPort,'--user-data-dir='+process.cwd()+'/.cache/exam-tools-mouse-profile-'+debugPort,'--no-first-run','about:blank'],{windowsHide:true,stdio:'ignore'});let ws;const delay=ms=>new Promise(r=>setTimeout(r,ms));const report=[];
try{
 let tabs;for(let i=0;i<40;i++){try{tabs=await(await fetch('http://127.0.0.1:'+debugPort+'/json/list')).json();break;}catch{await delay(250);}}
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(m.error.message)):p?.resolve(m.result);}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 async function ev(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
 await send('Page.enable');await send('Page.addScriptToEvaluateOnNewDocument',{source:'Object.defineProperty(Crypto.prototype, "randomUUID", {value:undefined, configurable:true})'});await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});

 for(const [module,number,needle] of [['reading',1,'stored fire'],['listening',6,'Mary Prescott']]) {
  await send('Page.navigate',{url:`http://localhost:3011/cambridge/1/${module}/1`});await delay(1200);await ev('localStorage.clear()');await send('Page.reload');await delay(900);
  await ev(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Start Test').click()`);await delay(150);
  await ev(`(()=>{const input=document.querySelector('input[aria-label="Question ${number}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'wrong answer');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await ev(`document.querySelector('.exam-submit').click()`);await delay(100);await ev(`Array.from(document.querySelectorAll('dialog button')).find(b=>b.textContent==='Submit and review').click()`);await delay(100);
  await ev(`document.querySelector('[aria-label="Review question ${number} in context"]').click()`);await delay(300);
  assert.ok(await ev(`document.querySelector('.review-explanation[open]')?.textContent.includes('wrong answer')===false`));
  assert.ok(await ev(`document.querySelectorAll('.review-explanation[open]').length===1`));
  assert.ok(await ev(`Array.from(CSS.highlights.get('review-evidence')||[])[0]?.toString().includes('${needle}')`));
  await ev(`var select=document.querySelector('[aria-label="Explanation language"]');select.value='en';select.dispatchEvent(new Event('change',{bubbles:true}));`);await delay(100);
  assert.ok(await ev(`document.querySelector('.review-explanation[open]').textContent.includes('${module==='reading'?'Keeping logs alight':'surname Prescott'}')`));
  await ev(`document.querySelector('.review-collapse-all').click()`);assert.equal(await ev(`document.querySelectorAll('.review-explanation[open]').length`),0);
  await ev(`var select=document.querySelector('.review-toolbar label select');select.value='2';select.dispatchEvent(new Event('change',{bubbles:true}));`);await delay(100);
  assert.equal(await ev(`CSS.highlights.has('review-evidence')`),false);
  report.push({module,question:number,autoEvidence:true,autoExplanation:true,bilingual:true,collapseAll:true,staleEvidenceCleared:true});
 }
 fs.writeFileSync('docs/review-evidence-browser-check.json',JSON.stringify(report,null,2)+'\n');
 console.log('Reading and Listening automatic evidence checks passed.');await send('Browser.close');
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();chrome.kill();setTimeout(()=>process.exit(process.exitCode||0),100);}

