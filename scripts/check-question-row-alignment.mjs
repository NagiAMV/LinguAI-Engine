import fs from 'node:fs';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {alignQuestionRows} from '../src/components/content/question-row-alignment.mjs';
const fixtures=[];for(const file of fs.readdirSync('public/practice').filter(f=>/^(practice|single)-(reading|listening)-\d+\.json$/.test(f)))for(const p of JSON.parse(fs.readFileSync('public/practice/'+file)).parts)for(const m of p.questions.matchAll(/<p class="native-text-row">[\s\S]*?<\/p>/g))fixtures.push({file,html:m[0]});
assert.ok(fixtures.length>100);const css=fs.readFileSync('src/app/globals.css','utf8')+'\n'+fs.readFileSync('src/components/content/practice-exam.css','utf8');
const port=10575,chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--remote-debugging-port='+port,'--user-data-dir='+process.cwd()+'/.cache/question-row-alignment-'+Date.now(),'--no-first-run','about:blank'],{windowsHide:true,stdio:'ignore'});let ws,send;
try{
 let tabs;for(let i=0;i<80;i++){try{tabs=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();if(tabs.some(t=>t.type==='page'))break;}catch{}await new Promise(r=>setTimeout(r,200));}assert.ok(tabs);
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let id=0;const pending=new Map();ws.onmessage=e=>{let m=JSON.parse(e.data);if(m.id){let p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}};
 send=(method,params={})=>new Promise((resolve,reject)=>{let i=++id;pending.set(i,{resolve,reject});ws.send(JSON.stringify({id:i,method,params}));});
 async function ev(expression){let r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
 const report=[];
 for(const width of [320,620,1100])for(const theme of ['light','dark'])for(const review of [false,true]){
  await send('Emulation.setDeviceMetricsOverride',{width:width+48,height:900,deviceScaleFactor:1,mobile:false});
  const result=await ev(`(${function(fixtures,css,width,theme,review,align){
   document.head.innerHTML='<style>'+css+'</style>';document.body.innerHTML='<main class="practice-exam imported-listening '+(review?'exam-finished':'')+'" data-theme="'+theme+'" style="--exam-font-size:18px"><div class="cd-content native-section-tasks" style="width:'+width+'px;margin:24px"></div></main>';
   const root=document.querySelector('.cd-content');root.innerHTML=fixtures.map(f=>f.html).join('');const before=root.textContent,fields=[...root.querySelectorAll('input,select')].map(f=>f.name);align(root);const once=root.innerHTML;align(root);const idempotent=once===root.innerHTML,errors=[];let count=0;
   for(const row of root.querySelectorAll('.exam-aligned-row')){
    const number=row.querySelector('strong'),prompt=row.querySelector('.exam-row-prompt');if(!review)number.classList.add('exam-current-number');else{const feedback=document.createElement('span');feedback.className='review-inline-feedback';feedback.dataset.reviewFeedback='fixture';feedback.textContent='Your answer: saved. Explanation and supporting quote.';row.querySelector('.native-gap').append(feedback);}
    const walker=document.createTreeWalker(prompt,NodeFilter.SHOW_TEXT);let first;while(walker.nextNode())if(walker.currentNode.textContent.trim()&&!walker.currentNode.parentElement.closest('.listening-duplicate-number')){first=walker.currentNode;break;}if(!first)continue;
    const nr=document.createRange();nr.selectNodeContents(number);const pr=document.createRange(),offset=first.textContent.search(/\S/);pr.setStart(first,offset);pr.setEnd(first,offset+1);const n=nr.getBoundingClientRect(),p=pr.getBoundingClientRect();count++;
    if(Math.abs(n.top-p.top)>1.5)errors.push({number:number.textContent,prompt:prompt.textContent,delta:n.top-p.top});
    const field=row.querySelector('input,select'),f=field.getBoundingClientRect(),r=root.getBoundingClientRect();if(f.right>r.right+1||f.left<r.left-1)errors.push({number:number.textContent,kind:'field overflow'});
   }
   const textRoot=root.cloneNode(true);textRoot.querySelectorAll('[data-review-feedback]').forEach(n=>n.remove());return {count,errors,idempotent,textPreserved:textRoot.textContent===before,fieldsPreserved:JSON.stringify(fields)===JSON.stringify([...root.querySelectorAll('input,select')].map(f=>f.name))};
  }.toString()})(${JSON.stringify(fixtures)},${JSON.stringify(css)},${width},${JSON.stringify(theme)},${review},${alignQuestionRows.toString()})`);
  assert.ok(result.idempotent&&result.textPreserved&&result.fieldsPreserved,JSON.stringify(result));assert.deepEqual(result.errors,[],JSON.stringify({width,theme,review,errors:result.errors.slice(0,5)}));report.push({width,theme,review,aligned:result.count});
 }
 console.log(JSON.stringify({sourceRows:fixtures.length,scenarios:report.length,report}));
}finally{if(send)await Promise.race([send('Browser.close').catch(()=>{}),new Promise(r=>setTimeout(r,1000))]);ws?.close();chrome.kill();}
