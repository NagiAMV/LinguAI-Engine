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


 async function openExam(url){
  await send('Page.navigate',{url:base+url});
  await until('document.readyState==="complete" && !!document.querySelector(".exam-start button")');
  await ev('document.querySelector(".exam-start button").click()');
  await until('!!document.querySelector(".exam-question-nav")');
 }
 async function jump(number){
  await ev('Array.from(document.querySelectorAll(".exam-question-nav button")).find(b=>b.getAttribute("aria-label")?.startsWith("Question '+number+',")).click()');
  await delay(200);
  const result=await ev('(()=>{const e=document.activeElement;return {label:e.getAttribute("aria-label"),name:e.name,tag:e.tagName,active:document.querySelector(".exam-question-nav button[aria-current=true]:not(.exam-part-tab)")?.textContent,number:document.querySelector(".exam-current-number")?.textContent,visible:e.getBoundingClientRect().top>=0&&e.getBoundingClientRect().bottom<innerHeight}})()');
  assert.equal(result.active,String(number));assert.ok(result.visible,JSON.stringify(result));
  return result;
 }
 async function tab(shift=false){await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:shift?8:0});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:shift?8:0});await delay(200);return ev('document.querySelector(".exam-question-nav button[aria-current=true]:not(.exam-part-tab)")?.textContent');}
 // These isolated browser sessions never touch a real account's attempt.
 await openExam('/practice/listening/1');
 report.push(await jump(34));assert.ok(report[0].label?.includes('34'));assert.equal(report[0].number,'34');
 assert.equal(await tab(),'35');assert.equal(await tab(true),'34');
 await jump(10);assert.equal(await tab(),'11');
 const group=await ev('Array.from(document.querySelectorAll("[data-question-group]")).map(e=>e.textContent)');
 report.push({groups:group});
 await openExam('/practice/reading/single/1');
 report.push(await jump(9));assert.equal(await tab(),'10');assert.equal(await tab(true),'9');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 report.push(await jump(3));
 const overflow=await ev('document.documentElement.scrollWidth-innerWidth');assert.ok(overflow<5);

 const navCode=fs.readFileSync('src/components/content/question-navigation.mjs','utf8').replace(/export /g,'');
 const annotations=fs.readFileSync('src/components/content/exam-annotations.mjs','utf8').replace(/export /g,'');
 const player=fs.readFileSync('src/components/content/ExamPlayer.jsx','utf8');
 const indexCode=player.slice(player.indexOf('function questionIndex('),player.indexOf('function hasAnswer('));
 await ev(`eval(${JSON.stringify(navCode+';window.prepareNav=prepareQuestionNavigation;')});eval(${JSON.stringify(annotations+';window.annoText=root=>textNodes(root).map(n=>n.textContent).join("");')});eval(${JSON.stringify(indexCode+';window.indexPaper=questionIndex;')});`);
 let partsChecked=0;
 for(const id of ['practice-listening-1','practice-listening-2','single-listening-24','practice-reading-2','single-reading-1']){
  const paper=JSON.parse(fs.readFileSync('public/practice/'+id+'.json'));
  for(const [partIndex,part] of paper.parts.entries()){
   const result=await ev('(()=>{const root=document.createElement("div");root.innerHTML='+JSON.stringify(part.passage+part.questions)+';const qs=window.indexPaper('+JSON.stringify(paper)+').filter(q=>q.partIndex==='+partIndex+');const before=window.annoText(root);window.prepareNav(root,qs,[]);const headers=root.querySelectorAll("[data-question-group]").length;window.prepareNav(root,qs,[]);return {sameText:before===window.annoText(root),idempotent:headers===root.querySelectorAll("[data-question-group]").length}})()');
   assert.ok(result.sameText&&result.idempotent,id+' part '+part.id);partsChecked++;
  }
 }
 report.push({annotationSafeParts:partsChecked});
 fs.writeFileSync('.cache/question-navigation-check.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
}finally{ws?.close();chrome.kill();}
