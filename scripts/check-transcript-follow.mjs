import fs from 'node:fs';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';
const port=9400+Math.floor(Math.random()*1000),base=process.env.PRACTICE_BASE_URL||'http://localhost:3011';
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--autoplay-policy=no-user-gesture-required','--remote-debugging-port='+port,'--user-data-dir='+process.cwd()+'/.cache/navigation-browser-'+Date.now()+'-'+port,'--no-first-run','about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let ws;const report=[];
try {
 let tabs;for(let i=0;i<40;i++){try{tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();break;}catch{await delay(250);}}
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let id=0;const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 async function ev(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
 async function until(expression){for(let i=0;i<200;i++){if(await ev(expression))return;await delay(150);}throw Error('Timeout: '+expression);}
 await send('Page.enable');await send('Emulation.setFocusEmulationEnabled',{enabled:true});await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});



 async function submit(url){
  await send('Page.navigate',{url:base+url});await until('!!document.querySelector(".exam-start button")');
  await ev('document.querySelector(".exam-start button").click()');await until('!!document.querySelector(".exam-submit")');
  await ev('document.querySelector(".exam-submit").click()');await delay(100);
  await ev('Array.from(document.querySelectorAll("dialog button")).find(b=>b.textContent==="Submit and review").click()');await until('!!document.querySelector(".results-review-open")');
  await ev('document.querySelector(".results-review-open").click()');await until('!!document.querySelector(".transcript-follow-controls")');
 }
 await submit('/practice/listening/single/17');
 await until('!document.querySelector(".transcript-follow-controls input").disabled');
 const defaultOff=await ev('Array.from(document.querySelectorAll(".transcript-follow-controls input")).every(e=>!e.checked)');assert.ok(defaultOff);
 await ev('document.querySelector(".transcript-follow-controls input").click()');
 await until('document.querySelector("audio").readyState>0');
 await ev('document.querySelector("audio").currentTime=330');
 await until('document.querySelector(".transcript-current")?.textContent.includes("[05:17]")');
 let active=await ev('document.querySelector(".transcript-current")?.innerText');assert.ok(active?.includes('[05:17]'),active);
 await ev('document.querySelectorAll(".transcript-follow-controls input")[1].click()');await delay(150);
 const roles=await ev('Array.from(document.querySelectorAll(".transcript-speaker-legend span")).map(e=>e.textContent)');
 assert.deepEqual([...roles].sort(),['Narrator','Peter','Samira']);
 const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.cache/transcript-follow-section17.png',Buffer.from(shot.data,'base64'));
 await ev('document.querySelectorAll(".transcript-follow-controls input")[1].click()');
 await ev('document.querySelector("audio").currentTime=170');
 await until('document.querySelector(".transcript-current")?.textContent.includes("[02:42]")');
 active=await ev('document.querySelector(".transcript-current")?.innerText');assert.ok(active?.includes('[02:42]'),active);
 await ev('document.querySelector(".transcript-follow-controls input").click()');await delay(100);assert.equal(await ev('document.querySelectorAll(".transcript-current").length'),0);
 await ev(`document.querySelector('[aria-label="Question 2: — Unanswered"]')?.click()`);await delay(150);
 const explanation=await ev('document.body.innerText.includes("Hillsdunne Road")&&document.body.innerText.includes("H-I-LL-S-D-U-NN-E")');assert.ok(explanation);
 await submit('/practice/listening/2');
 await until('!document.querySelectorAll(".transcript-follow-controls input")[1].disabled');
 assert.equal(await ev('document.querySelector(".transcript-follow-controls input").disabled'),true);
 await ev('document.querySelectorAll(".transcript-follow-controls input")[1].click()');await delay(100);
 const colours=await ev('Array.from(document.querySelectorAll(".transcript-speaker-legend span")).map(e=>[e.textContent,getComputedStyle(e).color])');assert.ok(colours.length>=2);assert.equal(new Set(colours.map(e=>e[1])).size,colours.length);
 await ev('document.querySelectorAll(".transcript-follow-controls input")[1].click()');await delay(100);assert.equal(await ev('document.querySelectorAll(".transcript-speaker").length'),0);
 console.log(JSON.stringify({defaultOff,seekForwardAndBackward:true,turnOffRestoresText:true,explanation17:explanation,missingTimingsDisabled:true,speakerColours:colours}));
}finally{ws?.close();chrome.kill();}
