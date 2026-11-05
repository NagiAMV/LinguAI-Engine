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



 await send('Page.navigate',{url:base+'/practice/listening/2'});
 await until('!!document.querySelector(".exam-start button")');
 await ev('document.querySelector(".exam-start button").click()');
 await until('!!document.querySelector(".exam-question-nav")');
 await ev('Array.from(document.querySelectorAll(".exam-question-nav button")).find(b=>b.getAttribute("aria-label")?.startsWith("Question 19,")).click()');await delay(200);
 await ev('Array.from(document.querySelectorAll("input[type=checkbox]")).filter(f=>f.getAttribute("aria-label")?.startsWith("Question 19:")&&["A","C"].includes(f.value)).forEach(f=>f.click())');
 await ev('document.querySelector(".exam-submit").click()');await delay(100);
 await ev('Array.from(document.querySelectorAll("dialog button")).find(b=>b.textContent==="Submit and review").click()');
 await until('!!document.querySelector(".results-table")');
 await ev(`(()=>{const row=document.querySelector('[aria-label="Review question 20 in context"]').closest("tr");row.querySelector("details").open=true;Array.from(row.querySelectorAll(".error-tag-options button")).find(b=>b.textContent==="Distractor").click()})()`);
 await delay(100);
 let saved=await ev('JSON.parse(localStorage.getItem("linguai-cd-practice-listening-2"))');
 assert.deepEqual(saved.errorTags,{'2:20':['Distractor']});
 assert.equal(saved.phase,'submitted');
 await send('Page.reload');await until('!!document.querySelector(".results-table")');
 await ev(`document.querySelector('[aria-label="Review question 20 in context"]').click()`);
 await until('!!document.querySelector(".review-error-tags")');
 const active=await ev('document.querySelector(".review-error-tags").innerText');assert.ok(active.includes('20'));assert.ok(active.includes('Distractor'));
 await ev('Array.from(document.querySelectorAll(".review-error-tags button")).find(b=>b.textContent==="Spelling").click()');
 await delay(100);
 saved=await ev('JSON.parse(localStorage.getItem("linguai-cd-practice-listening-2"))');
 assert.deepEqual(saved.errorTags['2:20'],['Distractor','Spelling']);
 for(const width of [1440,390]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<700});
  const result=await ev('(()=>{const e=document.querySelector(".review-error-tags");return {pageOverflow:document.documentElement.scrollWidth-innerWidth,panelOverflow:e.scrollWidth-e.clientWidth,pressed:Array.from(e.querySelectorAll("button[aria-pressed=true]")).map(b=>b.textContent)}})()');
  assert.ok(result.pageOverflow<5&&result.panelOverflow<5,JSON.stringify(result));report.push({width,...result});
 }
 await ev('document.querySelector(".review-toolbar button").click()');
 await ev('Array.from(document.querySelectorAll(".exam-header button")).find(b=>b.textContent==="New attempt").click()');await delay(100);
 await ev('Array.from(document.querySelectorAll("dialog button")).find(b=>b.textContent==="Archive and create").click()');
 await until('!!document.querySelector(".exam-start")');
 const archive=await ev('({current:JSON.parse(localStorage.getItem("linguai-cd-practice-listening-2")),history:JSON.parse(localStorage.getItem("linguai-cd-practice-listening-2-history"))})');
 assert.deepEqual(archive.current.errorTags,{});assert.deepEqual(archive.history.at(-1).errorTags['2:20'],['Distractor','Spelling']);
 console.log(JSON.stringify({savedAfterReload:true,separateQuestion20:true,newAttemptClearsTags:true,archivePreservesTags:true,layouts:report}));
}finally{ws?.close();chrome.kill();}
