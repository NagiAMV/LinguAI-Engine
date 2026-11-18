// This module sends only random browser/event IDs and coarse practice categories.
const ID_KEY='linguai-anonymous-browser-v1',QUEUE_KEY='linguai-anonymous-pending-v1',COMPLETIONS_KEY='linguai-anonymous-completions-v1';
let flushing=false,memoryId;
export function analyticsAllowed(){return typeof window!=='undefined'&&navigator.doNotTrack!=='1'&&window.doNotTrack!=='1'&&navigator.globalPrivacyControl!==true&&!location.pathname.startsWith('/analytics');}
function uuid(){const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function identity(){let id=read(ID_KEY,null);if(typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id)){id=memoryId||uuid();memoryId=id;localStorage.setItem(ID_KEY,JSON.stringify(id));}return id;}
export async function flushAnalytics(){
 if(flushing||!analyticsAllowed())return;flushing=true;
 try{const pending=read(QUEUE_KEY,[]);for(const event of pending){let response;try{response=await fetch('/api/analytics/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(event),keepalive:true,credentials:'omit',signal:AbortSignal.timeout(6000)});}catch{break;}
  if(response.ok||response.status===400){const current=read(QUEUE_KEY,[]);localStorage.setItem(QUEUE_KEY,JSON.stringify(current.filter(e=>e.event_id!==event.event_id)));}else break;
 }}catch{/* Analytics never blocks practice. */}finally{flushing=false;}
}
function enqueue(event){try{if(!analyticsAllowed())return;const pending=read(QUEUE_KEY,[]);if(!pending.some(e=>e.event_id===event.event_id))localStorage.setItem(QUEUE_KEY,JSON.stringify([...pending,event].slice(-100)));void flushAnalytics();}catch{/* Storage restrictions leave the site usable. */}}
export function trackVisit(){try{if(!analyticsAllowed())return;void flushAnalytics();const last=read('linguai-anonymous-last-visit-v1',0);if(Date.now()-last<30*60000)return;enqueue({kind:'visit',visitor_id:identity(),event_id:uuid()});localStorage.setItem('linguai-anonymous-last-visit-v1',JSON.stringify(Date.now()));}catch{}}
export function trackCompletion(source,{resource,mode='training',scope='single',completedAt=Date.now()}){
 try{if(!analyticsAllowed())return;const visitor_id=identity(),map=read(COMPLETIONS_KEY,{});if(map[source])return;const event_id=uuid();
  enqueue({kind:'complete',visitor_id,event_id,resource,mode,scope,completed_at:completedAt});
  map[source]=event_id;localStorage.setItem(COMPLETIONS_KEY,JSON.stringify(Object.fromEntries(Object.entries(map).slice(-500))));
 }catch{}
}
