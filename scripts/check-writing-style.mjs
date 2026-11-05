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



 await send('Page.navigate',{url:base+'/?view=writing'});await until('!!document.querySelector(".writing-catalog button")');
 function inspect(){
  function rgb(s){return s.match(/[\d.]+/g).slice(0,3).map(Number)}
  function luminance(c){return c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0)}
  const banner=document.querySelector('.writing-banner'),title=banner.querySelector('h1'),kicker=banner.querySelector('.section-kicker'),search=document.querySelector('.writing-search input');
  const background=luminance(rgb(getComputedStyle(banner).backgroundColor));
  const contrast=e=>{const text=luminance(rgb(getComputedStyle(e).color));return (Math.max(text,background)+.05)/(Math.min(text,background)+.05)};
  const cards=[...document.querySelectorAll('.writing-catalog button')],row=cards.filter(c=>Math.abs(c.getBoundingClientRect().top-cards[0].getBoundingClientRect().top)<2);
  const actions=row.map(c=>c.querySelector('span').getBoundingClientRect().bottom);
  return {titleContrast:contrast(title),kickerContrast:contrast(kicker),searchWidth:search.getBoundingClientRect().width,searchDisplay:getComputedStyle(search).display,labelWidth:search.parentElement.clientWidth,controlsWidth:search.parentElement.parentElement.clientWidth,overflow:document.documentElement.scrollWidth-innerWidth,cards:cards.length,actionAlignment:Math.max(...actions)-Math.min(...actions)};
 }
 for(const width of [1440,780,390]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<700});await delay(150);
  const debugShot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.cache/writing-check-current.png',Buffer.from(debugShot.data,'base64'));
  const metrics=await ev(`(${inspect.toString()})()`);assert.ok(metrics.titleContrast>7&&metrics.kickerContrast>4.5,JSON.stringify(metrics));assert.ok(metrics.overflow<5);assert.ok(metrics.actionAlignment<3);assert.ok(metrics.searchWidth>240,JSON.stringify({width,...metrics}));report.push({width,...metrics});
  if(width!==780){const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.cache/writing-style-'+width+'.png',Buffer.from(shot.data,'base64'));}
 }
 await ev(`(()=>{const e=document.querySelector('.writing-search input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'education');e.dispatchEvent(new Event('input',{bubbles:true}))})()`);await delay(100);
 assert.ok(await ev('Array.from(document.querySelectorAll(".writing-catalog button")).every(b=>b.textContent.toLowerCase().includes("education"))'));
 await ev(`(()=>{const e=document.querySelector('.writing-search input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'');e.dispatchEvent(new Event('input',{bubbles:true}));const s=document.querySelector('.writing-controls select');s.value='1';s.dispatchEvent(new Event('change',{bubbles:true}))})()`);await delay(150);
 assert.ok(await ev('Array.from(document.querySelectorAll(".writing-catalog button small")).every(e=>e.textContent.startsWith("Task 1"))'));
 await ev('document.querySelector(".writing-catalog button").click()');await until('!!document.querySelector(".writing-essay")');
 assert.ok(await ev('!document.querySelector(".writing-essay").disabled'));
 await send('Page.navigate',{url:base+'/?view=listening'});await until('document.querySelectorAll(".cd-test-card").length===18');
 const cards=await ev('Array.from(document.querySelectorAll(".cd-test-card")).map(c=>({title:c.querySelector("strong").textContent,topics:c.children[2].textContent.trim()}))');
 assert.ok(cards.every(c=>c.title&&c.topics));
 console.log(JSON.stringify({layouts:report,searchAndFilter:true,editorOpens:true,listeningCardsWithTopics:cards.length}));
}finally{ws?.close();chrome.kill();}
