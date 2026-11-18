import fs from 'node:fs/promises';import path from 'node:path';import {randomBytes,createHmac,timingSafeEqual} from 'node:crypto';
const RESOURCES=['listening','reading','writing','speaking'],UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,DAY=86400000;
export function analyticsDay(time){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tashkent',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(time));}
export function validateAnalyticsEvent(event){
 if(!event||!['visit','complete'].includes(event.kind)||!UUID.test(event.visitor_id)||!UUID.test(event.event_id))return null;
 const out={kind:event.kind,visitor_id:event.visitor_id,event_id:event.event_id};
 if(event.kind==='complete'){if(!RESOURCES.includes(event.resource)||!['exam','training'].includes(event.mode)||!['full','single'].includes(event.scope)||!Number.isFinite(event.completed_at))return null;Object.assign(out,{resource:event.resource,mode:event.mode,scope:event.scope,completed_at:event.completed_at});}return out;
}
export function createAnalyticsStore(directory,{now=Date.now}={}){
 let queue=Promise.resolve(),state,config;
 const run=fn=>{const operation=queue.then(fn);queue=operation.catch(()=>{});return operation;};
 async function load(){
  if(state)return;await fs.mkdir(directory,{recursive:true});
  try{config=JSON.parse(await fs.readFile(path.join(directory,'config.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;config={secret:randomBytes(32).toString('hex'),adminKey:randomBytes(24).toString('hex'),startedAt:now()};await fs.writeFile(path.join(directory,'config.json'),JSON.stringify(config),{flag:'wx',mode:0o600});await fs.writeFile(path.join(directory,'access.txt'),`LinguAI analytics\nOpen /analytics on your site.\nAccess key: ${config.adminKey}\n`,{mode:0o600});}
  try{state=JSON.parse(await fs.readFile(path.join(directory,'counts.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;state={version:1,visitors:{},days:{},seen:{}};}
 }
 const digest=value=>createHmac('sha256',config.secret).update(value).digest('hex');
 async function save(){const file=path.join(directory,'counts.json'),temp=file+'.tmp';await fs.writeFile(temp,JSON.stringify(state),{mode:0o600});await fs.rename(temp,file);}
 function trim(time){const oldest=analyticsDay(time-89*DAY);for(const day of Object.keys(state.days))if(day<oldest)delete state.days[day];for(const [id,t]of Object.entries(state.seen))if(t<time-90*DAY)delete state.seen[id];for(const [id,v]of Object.entries(state.visitors))if(v.last<time-180*DAY)delete state.visitors[id];}
 function visit(id,time,allowSession=true){
  const day=analyticsDay(time),bucket=state.days[day]||=( {visitors:[],returning:[],visits:0,completed:[]} );let visitor=state.visitors[id];
  if(!visitor){visitor=state.visitors[id]={first:time,last:time,session:time};bucket.visits++;}
  else if(allowSession&&time-visitor.session>=30*60000){visitor.session=time;bucket.visits++;if(!bucket.returning.includes(id))bucket.returning.push(id);}
  visitor.last=time;if(!bucket.visitors.includes(id))bucket.visitors.push(id);
  return bucket;
 }
 return {
  initialize:()=>run(async()=>{await load();return {startedAt:config.startedAt};}),
  authorized:key=>run(async()=>{await load();const a=Buffer.from(String(key||'')),b=Buffer.from(config.adminKey);return a.length===b.length&&timingSafeEqual(a,b);}),
  record:event=>run(async()=>{
   const clean=validateAnalyticsEvent(event);if(!clean)return {accepted:false};await load();const time=now();
   if(clean.kind==='complete'&&(clean.completed_at<config.startedAt||clean.completed_at<time-DAY||clean.completed_at>time+60000))return {accepted:true,ignored:true};
   const id=digest(clean.visitor_id),eventId=digest(clean.event_id);if(state.seen[eventId])return {accepted:true,duplicate:true};const previous=structuredClone(state);trim(time);
   const bucket=visit(id,time,clean.kind==='visit');state.seen[eventId]=time;
   if(clean.kind==='complete')bucket.completed.push({resource:clean.resource,mode:clean.mode,scope:clean.scope});
   try{await save();}catch(e){state=previous;throw e;}return {accepted:true};
  }),
  report:days=>run(async()=>{
   await load();const time=now(),length=[7,30,90].includes(days)?days:30,dates=Array.from({length},(_,i)=>analyticsDay(time-(length-1-i)*DAY)),unique=new Set(),returning=new Set(),resources=Object.fromEntries(RESOURCES.map(r=>[r,0])),modes={exam:0,training:0},scopes={full:0,single:0};let visits=0,completed=0;
   const daily=dates.map(day=>{const b=state.days[day]||{visitors:[],returning:[],visits:0,completed:[]};b.visitors.forEach(id=>unique.add(id));b.returning.forEach(id=>returning.add(id));visits+=b.visits;completed+=b.completed.length;for(const c of b.completed){resources[c.resource]++;modes[c.mode]++;scopes[c.scope]++;}return {day,visitors:b.visitors.length,returning:b.returning.length,visits:b.visits,completed:b.completed.length};});
   return {startedAt:new Date(config.startedAt).toISOString(),timezone:'Asia/Tashkent',days:length,visitors:unique.size,returning:returning.size,visits,completed,resources,modes,scopes,daily};
  })
 };
}
const key=Symbol.for('linguai.anonymousAnalytics');
export const analyticsStore=globalThis[key]||=(createAnalyticsStore(process.env.LINGUAI_ANALYTICS_DIR||path.join(process.cwd(),'.private','analytics')));
