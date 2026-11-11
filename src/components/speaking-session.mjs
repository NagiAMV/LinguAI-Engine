export function speakingPlan(set,part=0){
 const plan=[];if(!part||part===1)set.p1.forEach(([question,answer],i)=>plan.push({id:`p1-${i}`,part:1,question,answer,seconds:240/set.p1.length}));
 if(!part||part===2){plan.push({id:'prepare',part:2,question:set.p2.task,bullets:set.p2.bullets,prepare:true,seconds:60});plan.push({id:'p2',part:2,question:set.p2.task,bullets:set.p2.bullets,answer:set.p2.ans,seconds:120});}
 if(!part||part===3)set.p3.forEach(([question,answer],i)=>plan.push({id:`p3-${i}`,part:3,question,answer,seconds:240/set.p3.length}));return plan;
}
export function freshSpeaking(plan,attempt=1,history=[]){return {version:1,id:`speech-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,phase:'ready',mode:null,index:0,deadline:null,startedAt:null,transcript:'',notes:'',clips:[],feedback:null,attempt,history};}
export function startSpeaking(session,plan,mode,now=Date.now()){return session.phase==='ready'?{...session,mode,phase:'running',startedAt:now,deadline:mode==='exam'?now+plan[0].seconds*1000:null}:session;}
export function tickSpeaking(session,plan,now=Date.now()){
 if(session.phase!=='running'||session.mode!=='exam')return session;
 if(!Number.isFinite(session.deadline))return {...session,phase:'submitted',submittedAt:now};
 let next={...session};while(now>=next.deadline){if(next.index===plan.length-1)return {...next,phase:'submitted',submittedAt:next.deadline};next={...next,index:next.index+1,deadline:next.deadline+plan[next.index+1].seconds*1000};}return next;
}
export function nextSpeaking(session,plan,now=Date.now()){
 const current=tickSpeaking(session,plan,now);if(current.phase!=='running')return current;
 return current.index===plan.length-1?{...current,phase:'submitted',submittedAt:now}:{...current,index:current.index+1,deadline:current.mode==='exam'?now+plan[current.index+1].seconds*1000:null};
}
export function speakingMetrics(text,duration){const words=text.trim().split(/\s+/).filter(Boolean).length;return {words,wordsPerMinute:Number.isFinite(duration)&&duration>0?Math.round(words/duration*60):null};}
