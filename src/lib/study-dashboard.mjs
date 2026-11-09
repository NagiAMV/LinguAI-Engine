import {attemptRoute,mergeAttempts} from './account-model.mjs';
export const STUDY_SKILLS=['listening','reading','writing','speaking'];
export function localDay(value=new Date()) {
 const d=new Date(value);if(!Number.isFinite(d.getTime()))return '';
 return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function activityKey(owner){return `linguai-study-activity-v1:${owner||'guest'}`;}
export function readActivities(storage,owner){try{storage ||= globalThis.localStorage;return JSON.parse(storage.getItem(activityKey(owner))||'[]').filter(validActivity);}catch{return [];}}
function validActivity(a){return a&&typeof a.id==='string'&&a.id.length<200&&STUDY_SKILLS.includes(a.resource)&&['draft','review','speaking-drill'].includes(a.kind)&&typeof a.title==='string'&&a.title.length<=240&&Number.isFinite(Date.parse(a.finished_at))&&Number.isInteger(a.duration_seconds)&&a.duration_seconds>=0&&a.duration_seconds<=86400&&(a.band==null||(Number.isFinite(a.band)&&a.band>=0&&a.band<=9));}
export function recordActivity(owner,activity,storage){
 if(!validActivity(activity))return false;
 try{storage ||= globalThis.localStorage;if(!storage)return false;const list=readActivities(storage,owner).filter(a=>a.id!==activity.id);list.push(activity);list.sort((a,b)=>Date.parse(b.finished_at)-Date.parse(a.finished_at));storage.setItem(activityKey(owner),JSON.stringify(list.slice(0,2000)));globalThis.window?.dispatchEvent(new Event('linguai-study-activity'));return true;}catch{return false;}
}
export function buildStudyDashboard(attempts=[],activities=[],now=new Date()){
 const end=new Date(now);const today=localDay(end);const monday=new Date(end);monday.setHours(0,0,0,0);monday.setDate(monday.getDate()-((monday.getDay()+6)%7));
 const events=[...mergeAttempts(attempts).map(a=>({...a,kind:'test',href:attemptRoute(a)})),...activities.filter(validActivity).map(a=>({...a,href:`/?view=${a.resource}`}))].filter(a=>Date.parse(a.finished_at)<=end.getTime()).sort((a,b)=>Date.parse(b.finished_at)-Date.parse(a.finished_at));
 const week=Array.from({length:7},(_,i)=>{const date=new Date(monday);date.setDate(date.getDate()+i);const key=localDay(date);const rows=events.filter(a=>localDay(a.finished_at)===key);return {key,date:date.toISOString(),count:rows.length,seconds:rows.reduce((n,a)=>n+a.duration_seconds,0),future:key>today};});
 const active=new Set(events.map(a=>localDay(a.finished_at)));let streak=0;const cursor=new Date(end);cursor.setHours(12,0,0,0);if(!active.has(today))cursor.setDate(cursor.getDate()-1);while(active.has(localDay(cursor))){streak++;cursor.setDate(cursor.getDate()-1);}
 const scores=STUDY_SKILLS.map(skill=>{const rows=events.filter(a=>a.resource===skill&&(a.kind==='test'?a.total===40&&a.checked===40:a.kind==='review')&&a.band!=null);const last=rows[0];return {skill,band:last?.band??null,date:last?.finished_at??null,source:last?.kind==='review'?'AI practice estimate':'40-question test estimate',count:rows.length};});
 const numeric=scores.map(s=>s.band==null||String(s.band).startsWith('<')?NaN:Number(s.band));const overall=numeric.every(Number.isFinite)?Math.round(numeric.reduce((a,b)=>a+b,0)/4*2)/2:null;
 return {today,events,week,streak,scores,overall,weekSeconds:week.reduce((n,d)=>n+d.seconds,0),weekCount:week.reduce((n,d)=>n+d.count,0)};
}
export function durationLabel(seconds){const min=Math.floor(seconds/60);return min>=60?`${Math.floor(min/60)}h ${min%60}m`:`${min} min`;}
