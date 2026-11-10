export const wordCount=text=>String(text||'').trim().split(/\s+/u).filter(Boolean).length;
export const paragraphCount=text=>String(text||'').trim().split(/\n\s*\n/).filter(Boolean).length;
export const examMinutes=tasks=>tasks.reduce((n,t)=>n+(t.task===1?20:40),0);
export function newWritingSession(tasks,legacy={}){
 return {version:3,mode:null,phase:'ready',startedAt:null,deadline:null,submittedAt:null,active:tasks[0].id,attempt:1,documents:Object.fromEntries(tasks.map(t=>[t.id,{text:legacy[t.id]?.text||'',notes:legacy[t.id]?.notes||'',feedback:null}])),history:[]};
}
export function restoreWritingSession(saved,tasks,now=Date.now()){
 if(!saved||saved.version!==3||!tasks.every(t=>typeof saved.documents?.[t.id]?.text==='string'))return newWritingSession(tasks);
 const session={...saved,documents:Object.fromEntries(tasks.map(t=>[t.id,{...saved.documents[t.id],notes:saved.documents[t.id].notes||''}])),history:Array.isArray(saved.history)?saved.history.slice(-12):[],active:tasks.some(t=>t.id===saved.active)?saved.active:tasks[0].id};
 if(session.phase==='running'&&session.mode==='exam'&&(!Number.isFinite(session.deadline)||now>=session.deadline))return {...session,phase:'submitted',submittedAt:Number.isFinite(session.deadline)?session.deadline:now};
 return session;
}
export function startWritingSession(session,tasks,mode,now=Date.now()){
 if(session.phase!=='ready')return session;
 return {...session,mode:mode==='exam'?'exam':'training',phase:'running',startedAt:now,deadline:mode==='exam'?now+examMinutes(tasks)*60000:null};
}
export function editWritingDocument(session,tasks,id,patch,now=Date.now()){
 const current=restoreWritingSession(session,tasks,now);
 if(current.phase!=='running'||!current.documents[id])return current;
 return {...current,documents:{...current.documents,[id]:{...current.documents[id],...patch,feedback:patch.text!==undefined?null:current.documents[id].feedback}},updatedAt:now};
}
export function submitWritingSession(session,now=Date.now()){
 return session.phase==='running'?{...session,phase:'submitted',submittedAt:now}:session;
}
export function rewriteWritingSession(session,tasks,keepText,now=Date.now()){
 const entry={id:`${now}-${session.attempt}`,mode:session.mode,submittedAt:session.submittedAt||now,documents:session.documents,attempt:session.attempt};
 const next=newWritingSession(tasks,keepText?session.documents:{});
 return {...next,attempt:(session.attempt||1)+1,history:[...session.history,entry].slice(-12)};
}
export function combinedWritingBand(tasks,documents){
 if(!tasks.every(t=>Number.isFinite(documents[t.id]?.feedback?.bandScore)))return null;
 const weight=tasks.reduce((n,t)=>n+(t.task===2?2:1),0);
 return Math.round(tasks.reduce((n,t)=>n+documents[t.id].feedback.bandScore*(t.task===2?2:1),0)/weight*2)/2;
}
