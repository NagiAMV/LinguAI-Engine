import fs from 'node:fs';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';
const port=9791,base=process.env.PRACTICE_BASE_URL||'http://localhost:3011',delay=ms=>new Promise(r=>setTimeout(r,ms));
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--autoplay-policy=no-user-gesture-required','--remote-debugging-port='+port,'--user-data-dir='+process.cwd()+'/.cache/section-browser-'+Date.now(),'--no-first-run','about:blank'],{windowsHide:true,stdio:'ignore'});let ws;
try{
 let tabs;for(let i=0;i<50;i++){try{tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();break;}catch{await delay(200);}}
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let id=0;const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 async function ev(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
 async function until(expression){for(let i=0;i<100;i++){if(await ev(expression))return;await delay(100);}throw Error('Timeout '+expression);}
 await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 for(const resource of ['reading','listening'])for(let part=1;part<=(resource==='reading'?3:4);part++){
  const api=await(await fetch(`${base}/api/content/catalog?type=${resource}&format=single&part=${part}`)).json();assert.ok(api.items.length);if(resource==='listening')assert.equal(api.items.length,20);
  await send('Page.navigate',{url:`${base}/?view=${resource}&format=single&part=${part}`});await until(`document.querySelectorAll('.cd-test-card').length===${api.items.length}`);
  assert.ok(await ev(`document.querySelector('.single-practice-filters [aria-current="page"]').textContent.startsWith('${resource==='reading'?'Passage':'Section'} ${part}')`));
 }
 const catalog=JSON.parse(fs.readFileSync('src/data/single-section-listening-catalog.json')),keys=JSON.parse(fs.readFileSync('src/data/single-section-listening-keys.json'));
 for(const item of catalog.filter(item=>!process.env.SECTION_CHECK_IDS||process.env.SECTION_CHECK_IDS.split(',').map(Number).includes(item.number))){
  await send('Page.navigate',{url:`${base}/practice/listening/single/${item.number}`});await until(`!!document.querySelector('.exam-start')`);await ev('localStorage.clear()');await send('Page.reload');await until(`!!document.querySelector('.exam-start')`);
  if(item.number===24){
   await ev(`(()=>{const name='linguai-cd-single-listening-24';const s=JSON.parse(localStorage.getItem(name)||'{}');s.answers={'single_listening_24_11':'B','single_listening_24_12':'E'};localStorage.setItem(name,JSON.stringify(s));})()`);
   await send('Page.reload');await until(`!!document.querySelector('.exam-start')`);
   assert.ok(await ev(`JSON.stringify(JSON.parse(localStorage.getItem('linguai-cd-single-listening-24')).answers.single_listening_24_11)===JSON.stringify(['B','E'])`),'old worksheet answers migrated');
  }
  await ev(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Start Test'||b.textContent==='Start with saved answers').click()`);await until(`document.querySelectorAll('.exam-question-group > div button').length===10`);
  await until(`document.querySelector('audio')?.readyState>=1`);assert.ok(await ev(`Number.isFinite(document.querySelector('audio').duration)&&document.querySelector('audio').duration>180`));
  await ev(`var a=document.querySelector('audio');a.currentTime=2;a.play()`);await delay(80);assert.ok(await ev('!a.paused&&!a.error'));await ev('a.currentTime=a.duration-3');await delay(80);assert.ok(await ev('!a.error'));await ev('a.pause()');
  await until(`Array.from(document.querySelectorAll('.native-section-tasks img')).every(i=>i.complete&&i.naturalWidth>0)`);
  await ev(`(()=>{const key=${JSON.stringify(keys[item.id])};for(const field of document.querySelectorAll('.native-section-tasks input,.native-section-tasks select')){const n=+field.getAttribute('aria-label').match(/[0-9]+/)[0];if(field.type==='checkbox'){const group=Object.values(key.parts).flatMap(p=>p.groups).find(g=>g.questions.includes(n));if(group.acceptedSets[0].includes(field.value)!==field.checked)field.click();}else if(field.type==='radio'){if(key.answers[n].includes(field.value))field.click();}else{field.value=key.answers[n][0];field.dispatchEvent(new Event('input',{bubbles:true}));}}})()`);
  assert.ok(await ev(`document.querySelector('.exam-saved').getAttribute('aria-label').startsWith('10 of 10')`));
  if([1,4,24,27,41,61].includes(item.number)){
   const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`.cache/single-section-${item.number}-desktop.png`,Buffer.from(shot.data,'base64'));
   await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(80);assert.ok(await ev('document.documentElement.scrollWidth<=innerWidth'));
   const mobile=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`.cache/single-section-${item.number}-mobile.png`,Buffer.from(mobile.data,'base64'));
   await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  }
  await ev(`document.querySelector('.exam-submit').click()`);await ev(`Array.from(document.querySelectorAll('dialog button')).find(b=>b.textContent==='Submit and review').click()`);await until(`!!document.querySelector('[data-testid="correct-score"]')`);
  assert.equal(await ev(`parseInt(document.querySelector('[data-testid="correct-score"]').textContent)`),10,item.id);assert.equal(await ev(`document.querySelector('[data-testid="estimated-band"]').textContent`),'—');
  if(process.env.REQUIRE_TRANSCRIPT==='1'){
   await ev(`document.querySelector('.results-review-open').click()`);await until(`!!document.querySelector('.exam-passage-review')`);
   assert.ok(await ev(`document.querySelector('[data-review-passage]').textContent.includes('Audio transcript · draft')&&document.querySelector('[data-review-passage]').textContent.length>1000`),item.id+' transcript');
   await until(`document.querySelector('[data-review-passage] audio')?.readyState>=1`);
   if([1,61].includes(item.number)){
    const desktop=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`.cache/transcript-review-${item.number}-desktop.png`,Buffer.from(desktop.data,'base64'));
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(80);assert.ok(await ev('document.documentElement.scrollWidth<=innerWidth'));
    const mobile=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`.cache/transcript-review-${item.number}-mobile.png`,Buffer.from(mobile.data,'base64'));
    await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
   }
  }
  console.log('Passed',item.id,'audio, images, 10/10, no band',process.env.REQUIRE_TRANSCRIPT==='1'?'and transcript review':'');
 }
}finally{ws?.close();chrome.kill();}

