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
 const catalog=JSON.parse(fs.readFileSync('src/data/practice-listening-catalog.json','utf8'));
 for(const {number} of catalog) {
  const key=JSON.parse(fs.readFileSync('src/data/practice-listening-keys.json','utf8'))[`practice-listening-${number}`];
  await send('Page.navigate',{url:`${base}/practice/listening/${number}`});await until(`!!document.querySelector('.exam-start')`);await ev('localStorage.clear()');await send('Page.reload');await until(`!!document.querySelector('.exam-start')`);
  if(number===3)assert.ok(await ev(`document.querySelector('.exam-start').textContent.includes('40 minutes')&&document.querySelector('[role="timer"]').textContent==='40:00'`));
  await ev(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Start Test').click()`);await until(`!!document.querySelector('audio')`);
  assert.equal(await ev(`document.querySelectorAll('.exam-question-group > div button').length`),40);
  await until(`document.querySelector('audio').readyState>=1`);
  const duration=await ev(`document.querySelector('audio').duration`);assert.ok(duration>1200&&duration<3600,'full recording duration');
  await ev(`window.checkedAudio=document.querySelector('audio');checkedAudio.currentTime=30;checkedAudio.play()`);await delay(500);
  await ev(`document.querySelectorAll('.exam-part-tab')[1].click()`);await delay(150);
  assert.ok(await ev(`document.querySelector('audio')===checkedAudio&&!checkedAudio.paused&&checkedAudio.currentTime>=30`),'continuous playback across parts');
  await ev(`checkedAudio.pause();checkedAudio.currentTime=checkedAudio.duration-5;checkedAudio.play()`);await delay(400);assert.ok(await ev('!checkedAudio.error&&checkedAudio.currentTime>checkedAudio.duration-6'),'end of audio decodes');await ev('checkedAudio.pause()');
  for(let part=0;part<4;part++) {
   await ev(`document.querySelectorAll('.exam-part-tab')[${part}].click()`);await delay(100);
   const result=await ev(`(()=>{const key=${JSON.stringify(key)};let count=0;for(const field of document.querySelectorAll('.cd-questions input[name],.cd-questions select[name]')){const n=+field.getAttribute('aria-label').match(/Question ([0-9]+)/)[1];if(field.type==='checkbox'){const group=key.parts[${part+1}].groups.find(g=>g.questions.includes(n));if(group.acceptedSets[0].includes(field.value))field.click();}else if(field.type==='radio'){if(key.answers[n].includes(field.value))field.click();}else{field.value=key.answers[n][0];field.dispatchEvent(new Event('input',{bubbles:true}));}count++;}return count;})()`);assert.ok(result>=10||part===1,'controls populated');
   if(number===1&&part===1){await until(`document.querySelector('.floorplan-wrap img').naturalWidth>0`);const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/imported-listening-desktop.png',Buffer.from(shot.data,'base64'));}
  }
  assert.ok(await ev(`document.querySelector('.exam-saved').getAttribute('aria-label').startsWith('40 of 40')`));
  if(number===4){
   await ev(`document.querySelectorAll('.exam-part-tab')[0].click()`);await delay(80);
   const desktop=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/imported-listening-4-desktop.png',Buffer.from(desktop.data,'base64'));
   await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(80);assert.ok(await ev(`document.documentElement.scrollWidth<=innerWidth`));
   const mobile=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/imported-listening-4-mobile.png',Buffer.from(mobile.data,'base64'));
   await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  }
  await send('Page.reload');await until(`!!document.querySelector('.exam-saved')`);assert.ok(await ev(`document.querySelector('.exam-saved').getAttribute('aria-label').startsWith('40 of 40')`),'saved answers restored');
  await ev(`document.querySelector('.exam-submit').click()`);await delay(80);await ev(`Array.from(document.querySelectorAll('dialog button')).find(b=>b.textContent==='Submit and review').click()`);await until(`!!document.querySelector('[data-testid="correct-score"]')`);
  assert.equal(await ev(`parseInt(document.querySelector('[data-testid="correct-score"]').textContent)`),40);
  assert.equal(await ev(`document.querySelector('[data-testid="estimated-band"]').textContent`),'9.0');
  await ev(`document.querySelector('.results-review-open').click()`);await until(`!!document.querySelector('.exam-passage-review')`);
  if(number===1||number===4){
   const paper=JSON.parse(fs.readFileSync(`public/practice/practice-listening-${number}.json`,'utf8'));
   for(const section of paper.parts){
    await ev(`var partSelect=document.querySelector('.review-toolbar label select');partSelect.value='${section.id}';partSelect.dispatchEvent(new Event('change',{bubbles:true}));`);
    await until(`document.querySelector('[data-review-passage]')?.textContent.includes('Audio transcript · draft')`);
    assert.ok(await ev(`document.querySelector('[data-review-passage] .review-content').textContent.length>1500`));
    await until(`document.querySelector('[data-review-passage] audio')?.readyState>=1`);
    await until(`Math.abs(document.querySelector('[data-review-passage] audio').currentTime-${section.transcriptStartSeconds})<2`);
   }
  }
  if(number>=5){
   for(const section of [1,2,3,4]){
    await ev(`var partSelect=document.querySelector('.review-toolbar label select');partSelect.value='${section}';partSelect.dispatchEvent(new Event('change',{bubbles:true}));`);await delay(80);
    assert.ok(await ev(`document.querySelector('[data-review-passage] .review-content').textContent.length>1500`),'supplied transcript present');
   }
   const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`docs/imported-listening-${number}-review.png`,Buffer.from(shot.data,'base64'));
  }
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(100);assert.ok(await ev(`document.documentElement.scrollWidth<=innerWidth`),'mobile page width');
  if(number===2){await ev(`document.querySelector('.exam-settings').open=true;var theme=document.querySelector('[aria-label="Exam theme"]');theme.value='dark';theme.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('.exam-settings').open=false;`);const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/imported-listening-mobile.png',Buffer.from(shot.data,'base64'));}
  report.push({test:number,duration,questions:40,score:40,continuousAudio:true,endAudioDecoded:true,persistence:true,mobile:true});
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 }
 await send('Page.navigate',{url:`${base}/?view=listening`});await until(`document.querySelectorAll('.listening-practice-collection a').length===${catalog.length}`);
 assert.deepEqual(await ev(`Array.from(document.querySelectorAll('.listening-practice-collection a')).map(a=>a.getAttribute('href'))`),catalog.map(item=>'/practice/listening/'+item.number));
 fs.writeFileSync('docs/imported-listening-browser-check.json',JSON.stringify({tests:report,catalogFirst:true},null,2)+'\n');console.log(JSON.stringify(report));await send('Browser.close');
} catch(error){console.error(error);process.exitCode=1;}finally{ws?.close();chrome.kill();setTimeout(()=>process.exit(process.exitCode||0),100);}
