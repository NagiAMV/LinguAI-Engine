import fs from 'node:fs';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';
const debugPort=9400+Math.floor(Math.random()*1000);
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--unsafely-treat-insecure-origin-as-secure=http://unused.invalid','--remote-debugging-port='+debugPort,'--user-data-dir='+process.cwd()+'/.cache/exam-tools-mouse-profile-'+debugPort,'--no-first-run','about:blank'],{windowsHide:true,stdio:'ignore'});let ws;const delay=ms=>new Promise(r=>setTimeout(r,ms));const report=[];
try{
 let tabs;for(let i=0;i<40;i++){try{tabs=await(await fetch('http://127.0.0.1:'+debugPort+'/json/list')).json();break;}catch{await delay(250);}}
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(m.error.message)):p?.resolve(m.result);}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 async function ev(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
 await send('Page.enable');await send('Page.addScriptToEvaluateOnNewDocument',{source:'Object.defineProperty(Crypto.prototype, "randomUUID", {value:undefined, configurable:true})'});await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});

 await send('Page.navigate',{url:'http://localhost:3011/cambridge/16/reading/1'});await delay(1200);await ev('localStorage.clear()');await send('Page.reload');await delay(900);
 await ev(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Start Test').click()`);await delay(150);
 await ev(`document.querySelectorAll('.exam-part-tab')[1].click()`);await delay(150);
 assert.equal(await ev(`document.querySelectorAll('.exam-heading-options li').length`),9);
 assert.equal(await ev(`document.querySelectorAll('select[aria-label="Question 14"] option').length`),10);
 await ev(`var field=document.querySelector('select[aria-label="Question 14"]');field.value='iv';field.dispatchEvent(new Event('input',{bubbles:true}));`);
 await send('Page.reload');await delay(900);assert.equal(await ev(`document.querySelector('select[aria-label="Question 14"]').value`),'iv');
 assert.equal(await ev(`document.querySelectorAll('.exam-heading-options li').length`),9);
 const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/heading-options-desktop.png',Buffer.from(shot.data,'base64'));
 await ev(`document.querySelector('.exam-submit').click()`);await delay(100);await ev(`Array.from(document.querySelectorAll('dialog button')).find(b=>b.textContent==='Submit and review').click()`);await delay(100);
 await ev(`document.querySelector('[aria-label="Review question 14 in context"]').click()`);await delay(200);
 assert.equal(await ev(`document.querySelectorAll('.exam-heading-options li').length`),9);
 console.log('Nine headings visible in exam and review; answer survives refresh.');await send('Browser.close');
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();chrome.kill();setTimeout(()=>process.exit(process.exitCode||0),100);}
