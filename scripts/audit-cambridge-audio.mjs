import fs from 'node:fs';
const tasks=[];
for(let book=1;book<=21;book++)for(let test=1;test<=4;test++){
 const d=JSON.parse(fs.readFileSync(`public/cambridge/listening-${book}-${test}.json`));
 for(const p of d.parts)for(const [source,url] of (p.audioUrls||[]).entries())tasks.push({book,test,part:p.id,source,url});
}
const report={checkedAt:new Date().toISOString(),results:[]};let cursor=0,blocked=false;
async function worker(){while(cursor<tasks.length&&!blocked){const item=tasks[cursor++];let result;try{
 const r=await fetch(item.url,{headers:{Range:'bytes=0-4095'},signal:AbortSignal.timeout(12000)});
 const reader=r.body?.getReader();let first=Buffer.alloc(0);while(reader&&first.length<4096){const x=await reader.read();if(x.done)break;first=Buffer.concat([first,Buffer.from(x.value)]);}await reader?.cancel();
 const type=r.headers.get('content-type')||'';const mp4=first.subarray(4,8).toString()==='ftyp';const mp3=first.subarray(0,3).toString()==='ID3'||first.some((v,i)=>v===255&&(first[i+1]&224)===224);
 result={...item,status:r.status,contentType:type,contentRange:r.headers.get('content-range'),mp3,mp4,ok:r.ok&&(mp3||mp4)};
 if([429,403].includes(r.status)){blocked=true;report.stoppedReason=`Source returned ${r.status}; further requests stopped.`;}
 }catch(e){result={...item,ok:false,error:e.message};}
 report.results.push(result);if(report.results.length%40===0){fs.writeFileSync('docs/cambridge-audio-audit.json',JSON.stringify(report,null,2)+'\n');console.log(`Checked ${report.results.length}/${tasks.length}`);}
}}
await Promise.all(Array.from({length:4},worker));
report.totalLinks=tasks.length;report.checkedLinks=report.results.length;report.passedLinks=report.results.filter(r=>r.ok).length;report.failedLinks=report.results.filter(r=>!r.ok).length;
const parts=new Map();for(const r of report.results){const id=`${r.book}-${r.test}-${r.part}`;parts.set(id,(parts.get(id)||false)||r.ok);}
report.partsWithWorkingSource=[...parts.values()].filter(Boolean).length;report.failures=report.results.filter(r=>!r.ok);
fs.writeFileSync('docs/cambridge-audio-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,results:undefined,failures:report.failures},null,2));
