import fs from 'node:fs';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
const files=fs.readdirSync('public/practice').filter(f=>/^(single|practice)-(reading|listening)-\d+\.json$/.test(f)),fixtures=[];
for(const file of files)for(const part of JSON.parse(fs.readFileSync('public/practice/'+file)).parts)for(const m of part.questions.matchAll(/<fieldset\b[^>]*>[\s\S]*?<\/fieldset>/g))fixtures.push({file,part:part.id,html:m[0]});
assert.ok(fixtures.length>100);const css=fs.readFileSync('src/app/globals.css','utf8')+'\n'+fs.readFileSync('src/components/content/practice-exam.css','utf8');
const port=10565,chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--remote-debugging-port='+port,'--user-data-dir='+process.cwd()+'/.cache/question-number-insets-'+Date.now(),'--no-first-run','about:blank'],{windowsHide:true,stdio:'ignore'});let ws,send;
try{
 let tabs;for(let i=0;i<80;i++){try{tabs=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();if(tabs.some(t=>t.type==='page'))break;}catch{}await new Promise(r=>setTimeout(r,200));}assert.ok(tabs);
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let id=0;const pending=new Map();ws.onmessage=e=>{let m=JSON.parse(e.data);if(m.id){let p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}};
 send=(method,params={})=>new Promise((resolve,reject)=>{let i=++id;pending.set(i,{resolve,reject});ws.send(JSON.stringify({id:i,method,params}));});
 async function ev(expression){let r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
 const report=[];
 for(const width of [320,640,1100])for(const theme of ['light','dark'])for(const review of [false,true]){
  await send('Emulation.setDeviceMetricsOverride',{width:width+48,height:900,deviceScaleFactor:1,mobile:false});
  const result=await ev(`(${function(fixtures,css,width,theme,review){
   document.head.innerHTML='<style>'+css+'</style>';document.body.innerHTML='<main class="practice-exam '+(review?'exam-finished':'')+'" data-theme="'+theme+'"><div class="cd-content native-section-tasks" style="width:'+width+'px;margin:24px"></div></main>';
   const root=document.querySelector('.cd-content');root.innerHTML=fixtures.map(f=>f.html).join('');let count=0,errors=[];
   root.querySelectorAll('fieldset').forEach((field,i)=>{
    if(review){field.classList.add('review-active');const feedback=document.createElement('span');feedback.className='review-inline-feedback correct';feedback.textContent='Your answer: C · Correct answer: C';field.append(feedback);}
    else field.querySelector('legend strong')?.classList.add('exam-current-number');
    const box=field.getBoundingClientRect(),legend=field.querySelector('legend'),lb=legend.getBoundingClientRect();
    for(const number of legend.querySelectorAll('strong')){count++;const n=number.getBoundingClientRect();if(n.top<box.top+8||n.left<box.left+8||n.right>box.right-8||n.bottom>box.bottom-8)errors.push({fixture:fixtures[i].file,number:number.textContent,kind:'number outside padded card',box:{x:box.x,y:box.y,width:box.width,height:box.height},n:{x:n.x,y:n.y,width:n.width,height:n.height}});}
    const option=field.querySelector('.native-option');if(option&&option.getBoundingClientRect().top<lb.bottom+5)errors.push({fixture:fixtures[i].file,kind:'number overlaps options'});
   });return {count,errors};
  }.toString()})(${JSON.stringify(fixtures)},${JSON.stringify(css)},${width},${JSON.stringify(theme)},${review})`);
  assert.deepEqual(result.errors,[],JSON.stringify({width,theme,review,errors:result.errors.slice(0,3)}));report.push({width,theme,review,numbers:result.count});
 }
 await send('Page.enable');const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.cache/question-number-insets.png',Buffer.from(shot.data,'base64'));
 console.log(JSON.stringify({fieldsets:fixtures.length,scenarios:report.length,report}));
}finally{if(send)await Promise.race([send('Browser.close').catch(()=>{}),new Promise(r=>setTimeout(r,1000))]);ws?.close();chrome.kill();}
