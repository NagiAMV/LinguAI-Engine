import fs from 'node:fs';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';
const debugPort=9400+Math.floor(Math.random()*1000);
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--unsafely-treat-insecure-origin-as-secure=http://unused.invalid','--remote-debugging-port='+debugPort,'--user-data-dir='+process.cwd()+'/.cache/exam-tools-mouse-profile-'+debugPort,'--no-first-run','about:blank'],{windowsHide:true,stdio:'ignore'});let ws;const delay=ms=>new Promise(r=>setTimeout(r,ms));const report=[];
try{
 let tabs;for(let i=0;i<40;i++){try{tabs=await(await fetch('http://127.0.0.1:'+debugPort+'/json/list')).json();break;}catch{await delay(250);}}
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(m.error.message)):p?.resolve(m.result);}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 async function ev(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
 await send('Page.enable');await send('Page.addScriptToEvaluateOnNewDocument',{source:'Object.defineProperty(Crypto.prototype, "randomUUID", {value:undefined, configurable:true})'});await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});

 for(const testNumber of [1,2,3,4]) {
 const tutorial=JSON.parse(fs.readFileSync('src/data/cambridge-review-explanations.json','utf8')).tests['reading-13-'+testNumber];
 await send('Page.navigate',{url:'http://localhost:3011/cambridge/13/reading/'+testNumber});await delay(1200);await ev('localStorage.clear()');await send('Page.reload');for(let retry=0;retry<40;retry++){if(await ev(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Start Test')`))break;await delay(250);}
 await ev(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Start Test').click()`);await delay(150);
 await ev(`document.querySelector('.exam-submit').click()`);await delay(100);await ev(`Array.from(document.querySelectorAll('dialog button')).find(b=>b.textContent==='Submit and review').click()`);await delay(100);
 await ev(`document.querySelector('.results-review-open').click()`);await delay(150);
 for(const part of [1,2,3]) {
  await ev(`var partSelect=document.querySelector('.review-toolbar label select');partSelect.value='${part}';partSelect.dispatchEvent(new Event('change',{bubbles:true}));`);await delay(120);
  const count=await ev(`document.querySelectorAll('.review-question-links button').length`);
  for(let index=0;index<count;index++) {
   const number=await ev(`document.querySelectorAll('.review-question-links button')[${index}].firstChild.textContent.trim()`);
   await ev(`document.querySelectorAll('.review-question-links button')[${index}].click()`);await delay(60);
   const expected=tutorial[number];assert.ok(expected,number);
   assert.ok(await ev(`(()=>{const feedback=[...document.querySelectorAll('[data-review-feedback]')].find(node=>node.querySelector('.review-tutor-paragraph')?.textContent===${JSON.stringify(expected.en.split('\n\n')[0])}||node.querySelector('.review-tutor-paragraph')?.textContent===${JSON.stringify(expected.ru.split('\n\n')[0])});const controls=feedback?.parentElement.querySelectorAll('input,select');return !controls?.length || !!(controls[controls.length-1].compareDocumentPosition(feedback)&Node.DOCUMENT_POSITION_FOLLOWING);})()`),number+' explanation after controls');
   assert.ok(await ev(`(()=>{const ranges=[...(CSS.highlights.get('review-evidence')||[])];const controls=[...document.querySelectorAll('[data-review-feedback],input,select,textarea,button')];return ranges.every(range=>controls.every(node=>!range.intersectsNode(node)));})()`),number+' evidence excludes feedback and controls');
   const ranges=await ev(`Array.from(CSS.highlights.get('review-evidence')||[]).map(range=>range.toString())`);
   const quotes=expected.quotes||[expected.quote];assert.equal(ranges.length,quotes.length,number);
   quotes.forEach((quote,i)=>assert.ok(ranges[i].includes(quote),number+' evidence'));
   for(const lang of ['ru','en']) {
    await ev(`var languageSelect=document.querySelector('[aria-label="Explanation language"]');languageSelect.value='${lang}';languageSelect.dispatchEvent(new Event('change',{bubbles:true}));`);await delay(40);
    const contents=await ev(`Array.from(document.querySelectorAll('.review-tutor-paragraph')).map(node=>node.textContent)`);
    assert.ok(contents.includes(expected[lang].split('\n\n')[0]),number+' '+lang);
   }
   assert.equal(await ev(`document.querySelector('.exam-passage-review').textContent.includes('Подробное объяснение по тексту ещё не добавлено')`),false);
   report.push({test:testNumber,part,question:number,bilingual:true,evidence:quotes.length});
  }
 }
 }
 await ev(`document.querySelector('.review-toolbar label select').value='1';document.querySelector('.review-toolbar label select').dispatchEvent(new Event('change',{bubbles:true}));`);await delay(100);
 await ev(`document.querySelector('.review-question-links button').click();document.querySelector('.exam-settings').open=true;var theme=document.querySelector('[aria-label="Exam theme"]');theme.value='dark';theme.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('.exam-settings').open=false;`);await delay(100);
 const desktop=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/cambridge-13-reading-tutor-desktop.png',Buffer.from(desktop.data,'base64'));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(100);
 assert.ok(await ev(`document.documentElement.scrollWidth<=innerWidth`));
 await ev(`document.querySelector('.review-explanation[open]').scrollIntoView({block:'start'})`);await delay(100);
 const mobile=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/cambridge-13-reading-tutor-mobile.png',Buffer.from(mobile.data,'base64'));
 await ev(`document.querySelector('.review-collapse-all').click()`);assert.equal(await ev(`document.querySelectorAll('.review-explanation[open]').length`),0);
 fs.writeFileSync('docs/cambridge-13-reading-tutor-browser-check.json',JSON.stringify({questionsCovered:160,reviewGroups:report.length,checks:report},null,2)+'\n');
 console.log('All 160 questions: bilingual explanations, all citations, group evidence and mobile layout passed.');await send('Browser.close');
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();chrome.kill();setTimeout(()=>process.exit(process.exitCode||0),100);}
