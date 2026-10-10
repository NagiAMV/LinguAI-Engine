import fs from 'node:fs';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';
const debugPort=9400+Math.floor(Math.random()*1000);
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--unsafely-treat-insecure-origin-as-secure=http://unused.invalid','--remote-debugging-port='+debugPort,'--user-data-dir='+process.cwd()+'/.cache/exam-tools-mouse-profile-'+debugPort,'--no-first-run','about:blank'],{windowsHide:true,stdio:'ignore'});let ws;const delay=ms=>new Promise(r=>setTimeout(r,ms));const report=[];
try{
 let tabs;for(let i=0;i<40;i++){try{tabs=await(await fetch('http://127.0.0.1:'+debugPort+'/json/list')).json();break;}catch{await delay(250);}}
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(m.error.message)):p?.resolve(m.result);}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 async function ev(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
 await send('Page.enable');await send('Page.addScriptToEvaluateOnNewDocument',{source:'Object.defineProperty(Crypto.prototype, "randomUUID", {value:undefined, configurable:true})'});await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://localhost:3011/cambridge/1/reading/1'});await delay(2500);await ev('localStorage.clear()');await send('Page.reload');await delay(2500);
 await ev(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Start Test').click()`);await delay(500);
 assert.equal(await ev(`document.querySelectorAll('.exam-part-tab').length`),3);
 assert.equal(await ev(`document.querySelectorAll('.exam-question-group > div > button').length`),40);
 await ev(`document.querySelector('.exam-flag').click()`);await delay(100);await ev(`document.querySelector('.exam-flag').click()`);await delay(100);assert.equal(await ev(`document.querySelectorAll('.exam-question-nav button.flagged').length`),0);await ev(`document.querySelector('.exam-flag').click()`);assert.equal(await ev(`document.querySelector('.exam-question-nav button.flagged').textContent`),'1⚑');
 await ev(`document.querySelector('.exam-settings').open=true;const s=document.querySelector('[aria-label="Exam theme"]');s.value='dark';s.dispatchEvent(new Event('change',{bubbles:true}));`);await delay(100);
 assert.equal(await ev(`document.querySelector('main').dataset.theme`),'dark');
 await ev(`(()=>{const i=document.querySelector('[data-annotation-area="questions"] input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'preserve');i.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 async function selectText(area='passage') {
 const points=await ev(`(()=>{const root=document.querySelector('[data-annotation-area="${area}"]');const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(w.nextNode()){const n=w.currentNode;if(n.textContent.trim().length<40)continue;const a=document.createRange();const start=n.textContent.length-n.textContent.trimStart().length;a.setStart(n,start);a.setEnd(n,start+1);const b=document.createRange();b.setStart(n,start+25);b.setEnd(n,start+26);const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();if(x.top<65||x.bottom>innerHeight-120)continue;return {x:x.left+1,y:x.top+x.height/2,end:y.right,endY:y.top+y.height/2};}throw Error('No visible text');})()`);
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:points.x,y:points.y});
 await send('Input.dispatchMouseEvent',{type:'mousePressed',x:points.x,y:points.y,button:'left',clickCount:1});
 for(let step=1;step<=10;step++){await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:points.x+(points.end-points.x)*step/10,y:points.y+(points.endY-points.y)*step/10,buttons:1,button:'left'});await delay(20);}
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:points.end,y:points.endY,button:'left',clickCount:1});
 await delay(150);assert.ok(await ev(`!!document.querySelector('.selection-tools')`));
 }
 async function clickHighlight() {
 const point=await ev(`(()=>{const r=Array.from(document.querySelectorAll('.selection-tools button')).find(b=>b.textContent.includes('Highlight')).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
 await send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});
 }
 await selectText();await clickHighlight();await delay(150);
 assert.equal(await ev(`CSS.highlights.get('exam-passage-yellow').size`),1);
 await selectText();await ev(`Array.from(document.querySelectorAll('.selection-tools button')).find(b=>b.textContent.includes('Add note')).click()`);await delay(150);
 await ev(`document.querySelector('.exam-note textarea').focus()`);await send('Input.insertText',{text:'Remember this example.'});await delay(100);
 assert.equal(await ev(`document.querySelector('.exam-note textarea').value`),'Remember this example.');
 await ev(`document.querySelector('[aria-label="Close notes"]').click();document.querySelector('.exam-settings').open=false`);
 await ev(`document.querySelectorAll('.exam-part-tab')[1].click()`);await delay(150);assert.ok((await ev(`document.querySelector('.exam-identity p').textContent`)).includes('Part 2'));
 await ev(`document.querySelectorAll('.exam-part-tab')[0].click()`);await delay(150);assert.equal(await ev(`CSS.highlights.get('exam-passage-yellow').size`),1);
 await send('Page.reload');await delay(2500);assert.equal(await ev(`document.querySelector('main').dataset.theme`),'dark');assert.equal(await ev(`CSS.highlights.get('exam-passage-yellow').size`),1);assert.equal(await ev(`document.querySelectorAll('.exam-question-nav button.flagged').length`),1);assert.equal(await ev(`document.querySelector('[data-annotation-area="questions"] input').value`),'preserve');
 await ev(`document.querySelector('.exam-notes-toggle').click()`);assert.equal(await ev(`document.querySelector('.exam-note textarea').value`),'Remember this example.');await ev(`document.querySelector('[aria-label="Close notes"]').click()`);
 assert.equal(await ev(`getComputedStyle(document.querySelector('[data-annotation-area="questions"] input')).backgroundColor`),'rgb(32, 46, 41)');

 await ev("document.querySelector('.exam-settings').open=true;document.querySelector('[aria-label=\"blue highlight\"]').click();document.querySelector('.exam-settings').open=false");
 await ev("(()=>{const r=document.querySelector('[data-annotation-area=\"passage\"]');const w=document.createTreeWalker(r,NodeFilter.SHOW_TEXT);const ns=[];while(w.nextNode())if(w.currentNode.textContent.trim())ns.push(w.currentNode);const range=document.createRange();range.setStart(ns[2],0);range.setEnd(ns[3],Math.min(10,ns[3].length));const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);r.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));})()");await delay(150);
 await ev("Array.from(document.querySelectorAll('.selection-tools button')).find(b=>b.textContent.includes('Highlight')).click()");await delay(150);assert.equal(await ev("CSS.highlights.get('exam-passage-blue').size"),1);
 const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/exam-tools-desktop.png',Buffer.from(shot.data,'base64'));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(200);
 const layout=await ev(`(()=>{const f=document.querySelector('.exam-bottom').getBoundingClientRect();return {width:innerWidth,scroll:document.documentElement.scrollWidth,bottom:f.bottom,top:f.top,height:innerHeight};})()`);assert.ok(layout.scroll<=layout.width);assert.ok(layout.bottom<=layout.height+1);
 const mobile=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/exam-tools-mobile.png',Buffer.from(mobile.data,'base64'));
 await ev(`document.querySelector('.exam-submit').click()`);await delay(150);await ev(`Array.from(document.querySelectorAll('dialog button')).find(b=>b.textContent==='Submit and review').click()`);await delay(150);await ev(`document.querySelector('.results-review-open').click()`);await delay(200);assert.equal(await ev(`CSS.highlights.get('exam-passage-yellow').size`),1);
 report.push({reading:true,allParts:true,flags:true,darkTheme:true,highlights:true,notes:true,refresh:true,reviewHighlights:true,mobile:layout});
 await send('Page.navigate',{url:'http://localhost:3011/cambridge/19/listening/1'});await delay(2500);await ev(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Start Test').click()`);await delay(300);assert.equal(await ev(`document.querySelectorAll('.exam-part-tab').length`),4);assert.equal(await ev(`document.querySelectorAll('.exam-question-group > div > button').length`),40);await selectText('questions');await clickHighlight();await delay(100);assert.equal(await ev(`CSS.highlights.get('exam-questions-blue').size`),1);report.push({listening:true,allFourParts:true,questionHighlights:true});
 fs.writeFileSync('docs/exam-tools-browser-check.json',JSON.stringify({checks:report},null,2)+'\n');await send('Browser.close');console.log('Passed reading/listening, notes, highlights, flags, themes, refresh, review and mobile checks.');
}catch(e){console.error(e);fs.writeFileSync('docs/exam-tools-browser-check.json',JSON.stringify({checks:report,error:e.message},null,2)+'\n');process.exitCode=1;}finally{ws?.close();chrome.kill();setTimeout(()=>process.exit(process.exitCode||0),100);}



