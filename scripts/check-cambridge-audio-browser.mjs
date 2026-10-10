import fs from 'node:fs';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--remote-debugging-port=9322','--user-data-dir='+process.cwd()+'/.cache/audio-browser-profile','--autoplay-policy=no-user-gesture-required','--no-first-run','about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;const report=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
try{
 let tabs;for(let i=0;i<40;i++){try{tabs=await (await fetch('http://127.0.0.1:9322/json/list')).json();break;}catch{await delay(250);}}
 if(!tabs)throw Error('Headless Chrome did not start');
 const tab=tabs.find(t=>t.type==='page');ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(m.error.message)):p?.resolve(m.result);}};
 function send(method,params={}){return new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});}
 async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;}
 await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
 for(const [b,t,part] of [[1,1,1],[14,1,2],[19,1,1],[21,4,4],[2,4,2]]){
 await send('Network.setBlockedURLs',{urls:b===2?['*://ielts-listening-audio.engnovatemedia.com/*']:[]});
 await send('Page.navigate',{url:`http://127.0.0.1:3010/cambridge/${b}/listening/${t}`});await delay(1200);
 
 await evaluate(`Array.from(document.querySelectorAll('button')).find(x=>/Start Test/i.test(x.textContent))?.click()`);await delay(400);
 if(part!==1)await evaluate(`(()=>{const s=document.querySelector('select[aria-label="Test part"]');s.value='${part-1}';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);await delay(500);
 let state;for(let i=0;i<60;i++){state=await evaluate(`(()=>{const a=document.querySelector('audio');return a?{src:a.currentSrc,ready:a.readyState,duration:a.duration,error:a.error?.code,controls:a.controls}:null})()`);if(state?.ready>=1||state?.error)break;await delay(500);}
 if(state && !state.src.endsWith('-'+part+'.mp3') && b!==19)throw Error('Wrong part loaded '+JSON.stringify(state));
 if(!state?.ready)throw Error('Metadata failed '+JSON.stringify({b,t,part,state}));
 await evaluate(`document.querySelector('audio').play()`);await delay(1200);
 const played=await evaluate(`(()=>{const a=document.querySelector('audio');return {time:a.currentTime,paused:a.paused,error:a.error?.code}})()`);assert.ok(played.time>0&&!played.paused,JSON.stringify(played));
 await evaluate(`document.querySelector('audio').currentTime=30`);await delay(800);
 const seek=await evaluate(`document.querySelector('audio').currentTime`);assert.ok(seek>=30);
 await evaluate(`document.querySelector('audio').pause()`);
 if(b===2)assert.ok(state.src.startsWith('https://engnovate.com/'),'Backup source was not used');
 report.push({book:b,test:t,part,metadata:state,played,seek});console.log('Playback passed',b,t,part,state.duration);
 }

 await send('Page.reload');await delay(1000);
 let restored;for(let i=0;i<60;i++){restored=await evaluate("(()=>{const a=document.querySelector('audio');return a?{ready:a.readyState,time:a.currentTime,src:a.currentSrc}:null})()");if(restored?.ready>=1&&restored.time>=29)break;await delay(500);}
 assert.ok(restored?.time>=29,'Refresh lost audio position '+JSON.stringify(restored));
 await evaluate("Array.from(document.querySelectorAll('button')).find(x=>x.textContent.trim()==='Submit')?.click()");await delay(200);
 await evaluate("Array.from(document.querySelectorAll('dialog button')).find(x=>x.textContent.trim()==='Submit and review')?.click()");await delay(400);
 await evaluate("document.querySelector('.results-review-open')?.click()");await delay(500);
 let review;for(let i=0;i<60;i++){review=await evaluate("(()=>{const a=document.querySelector('audio');return a?{ready:a.readyState,controls:a.controls,src:a.currentSrc}:null})()");if(review?.ready>=1)break;await delay(500);}
 assert.ok(review?.ready>=1&&review.controls,'Review audio unavailable');
 await evaluate("document.querySelector('audio').play()");await delay(1000);
 assert.ok(await evaluate("document.querySelector('audio').currentTime>0"));
 report.push({refresh:restored,review});
 fs.writeFileSync('docs/cambridge-audio-browser-check.json',JSON.stringify({checkedAt:new Date().toISOString(),checks:report},null,2)+'\n');
 await send('Browser.close');console.log('Browser playback checks passed.');
}catch(e){fs.writeFileSync('docs/cambridge-audio-browser-check.json',JSON.stringify({checks:report,error:e.message},null,2)+'\n');console.error(e);process.exitCode=1;}finally{ws?.close();chrome.kill();}
