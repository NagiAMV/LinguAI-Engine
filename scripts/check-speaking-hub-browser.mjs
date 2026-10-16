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

 await send('Page.navigate',{url:base+'/?view=listening'});await until(`document.querySelectorAll('.cd-test-card').length===11`);assert.ok(await ev(`!/[\u00c3\u00c2]/.test(document.querySelector('.cd-test-grid').textContent)`));assert.ok(await ev(`document.querySelector('.cd-test-card').textContent.includes('Manor Farm · Sports centre')`));
 fs.writeFileSync('docs/listening-catalog-encoding-fixed.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await send('Page.navigate',{url:base+'/?view=speaking'});await until(`document.querySelectorAll('.sh-card').length===68`);await delay(400);
 await ev(`document.querySelector('.sh-bookmark').click()`);await delay(100);assert.ok(await ev(`document.querySelector('.sh-bookmark').getAttribute('aria-pressed')==='true'`));
 await send('Page.reload');await until(`document.querySelectorAll('.sh-card').length===68`);assert.ok(await ev(`document.querySelector('.sh-bookmark').getAttribute('aria-pressed')==='true'`));
 await ev(`document.querySelector('.sh-saved').click()`);await delay(100);assert.equal(await ev(`document.querySelectorAll('.sh-card').length`),1);await ev(`document.querySelector('.sh-saved').click()`);await delay(100);
 await ev(`var inp=document.querySelector('.sh-search input');var setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(inp,'headphones');inp.dispatchEvent(new Event('input',{bubbles:true}))`);await delay(150);assert.ok(await ev(`document.querySelectorAll('.sh-card').length>0&&document.querySelectorAll('.sh-card').length<68`));
 await ev(`setter.call(inp,'');inp.dispatchEvent(new Event('input',{bubbles:true}))`);await delay(100);await ev(`document.querySelectorAll('.sh-topic-open')[1].click()`);await delay(100);assert.ok(await ev(`document.querySelector('.sh-desk-top small').textContent.includes('Set 2')`));
 for(const part of [1,3,2]){await ev(`document.querySelectorAll('.sh-parts button')[${part-1}].click()`);await delay(100);assert.ok(await ev(`document.querySelectorAll('.sh-parts button')[${part-1}].getAttribute('aria-pressed')==='true'`));if(part!==2){assert.ok(await ev(`document.querySelectorAll('.sh-prompts article').length>0`));await ev(`document.querySelector('.sh-answer').open=true`);assert.ok(await ev(`document.querySelector('.sh-answer p').textContent.length>40`));}}
 await ev(`document.querySelector('.sh-timer button').click()`);await delay(1200);assert.equal(await ev(`document.querySelector('[role="timer"]').textContent`),'00:59');await ev(`document.querySelector('.sh-timer button').click()`);await ev(`document.querySelectorAll('.sh-timer button')[1].click()`);assert.equal(await ev(`document.querySelector('[role="timer"]').textContent`),'02:00');
 fs.writeFileSync('docs/speaking-hub-desktop.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(150);assert.ok(await ev(`document.documentElement.scrollWidth<=innerWidth`));fs.writeFileSync('docs/speaking-hub-mobile.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await ev(`document.querySelectorAll('.sh-mode button')[1].click()`);await until(`!!document.querySelector('.speaking-start-button')`);await ev(`document.querySelector('.speaking-start-button').click()`);await until(`!!document.querySelector('.speaking-session-panel')`);
 console.log('Encoding clean; Speaking: 68 sets, filtering, persistent bookmarks, Parts 1/2/3, answers, timer, mobile and mock interview passed.');await send('Browser.close');
 }catch(error){console.error(error);process.exitCode=1;}finally{ws?.close();chrome.kill();setTimeout(()=>process.exit(process.exitCode||0),100);}
