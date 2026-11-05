import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {annotateSpeakers} from './lib/annotate-speakers.mjs';
const port=9600+Math.floor(Math.random()*800),cache='.cache/speaker-diarization';
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--remote-debugging-port='+port,'--user-data-dir='+process.cwd()+'/.cache/speaker-browser-'+Date.now(),'--no-first-run','about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try{
 let tabs;for(let i=0;i<80;i++){try{tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();break;}catch{await delay(250);}}
 assert.ok(tabs,'Chrome did not start');
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let id=0;const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 async function ev(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
 await ev('globalThis.annotateSpeakers='+annotateSpeakers.toString());
 const report=[],missing=[];
 const files=fs.readdirSync('public/practice').filter(f=>/^(practice|single)-listening-\d+\.json$/.test(f));
 const originals=cache+'/original-transcripts.json';
 if(!fs.existsSync(originals))fs.writeFileSync(originals,JSON.stringify(Object.fromEntries(files.map(file=>[file,JSON.parse(fs.readFileSync('public/practice/'+file,'utf8')).parts.map(p=>({id:p.id,passage:p.passage}))]))));
 for(const file of files){
  const filename=path.join('public/practice',file),test=JSON.parse(fs.readFileSync(filename,'utf8'));let changed=false;
  const wordCounts=test.parts.map(p=>(p.passage.replace(/<[^>]*>/g,' ').match(/\S+/g)||[]).length);
  const total=wordCounts.reduce((a,b)=>a+b,0);let offset=0;
  for(const [index,part] of test.parts.entries()){
   const audioUrl=part.audioUrls?.[0];const stem=audioUrl&&path.basename(audioUrl,path.extname(audioUrl));
   const audioFile=stem&&path.join(cache,stem+'.json');
   const audio=audioFile&&fs.existsSync(audioFile)?JSON.parse(fs.readFileSync(audioFile,'utf8')):null;
   const explicitlyLabelled=/data-speaker=|<(strong|b)>[^<]*:\s*<\//.test(part.passage);
   const hasPlainLabel=/(?:>|^)(?:\s*)(?:Assistant|Customer|Professor Anderson|Rangi|OPERATOR|JACK|EMPLOYER|APPLICANT|GEOFFREY|CARLOS|TUTOR|JANE|MARK):|(?:Jim|Dave|Tutor|Hillary)(?: {3,}|\n)/.test(part.passage);
   const duration=audio?.segments?.at(-1)?.end??audio?.duration??part.audioDurationSeconds;
   const window={start:part.transcriptStartSeconds??duration*offset/total,end:part.transcriptEndSeconds??duration*(offset+wordCounts[index])/total};offset+=wordCounts[index];
   if(!audio&&!explicitlyLabelled&&!hasPlainLabel){missing.push({file,part:part.id});continue;}
   let words=[];const wordCache=stem&&'.cache/'+stem+'-transcription.json';
   if(wordCache&&fs.existsSync(wordCache))words=JSON.parse(fs.readFileSync(wordCache,'utf8')).segments;
   const result=await ev(`annotateSpeakers(${JSON.stringify(part.passage)},${JSON.stringify(audio)},${JSON.stringify(window)},${JSON.stringify(words)})`);
   assert.ok(result.unchanged,file+' '+part.id+' annotation offsets changed');
   if(result.status!=='existing'){
    part.passage=result.html;part.transcriptSpeakerStatus=result.status;
    part.transcriptSpeakerProvenance=result.status==='audio-automatic'?{
     method:'local-audio-diarization',segmentation:audio.params.segmentation,embedding:audio.params.embedding,
     audioSha256:audio.audioSha256,reviewed:false,
     alignment:result.approximateWordCount?'approximate-by-speech-duration':'asr-word-timestamps',
     exactWordCount:result.exactWordCount,approximateWordCount:result.approximateWordCount,
     partWindow:window,partWindowEstimated:part.transcriptStartSeconds===undefined,
     note:'Automatic voice clusters, not verified identities. Approximate text boundaries may assign words to the wrong voice.'
    }:{method:'existing-transcript-labels',reviewed:false};changed=true;
   }
   report.push({file,part:part.id,status:result.status,speakers:result.speakers,approximateWords:result.approximateWordCount||0});
  }
  if(changed)fs.writeFileSync(filename,JSON.stringify(test,null,2)+'\n');
 }
 fs.writeFileSync(cache+'/attachment-report.json',JSON.stringify({parts:report.length,report,missing},null,2));
 console.log(JSON.stringify({parts:report.length,missing}));
 if(missing.length)process.exitCode=1;
}finally{ws?.close();chrome.kill();}
