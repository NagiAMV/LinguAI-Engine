import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {randomUUID} from 'node:crypto';
import {createAnalyticsStore,validateAnalyticsEvent,analyticsDay} from '../src/lib/analytics-store.mjs';
import vm from 'node:vm';import {webcrypto} from 'node:crypto';
async function fixture(t){const directory=await fs.mkdtemp(path.join(os.tmpdir(),'linguai-analytics-'));t.after(()=>{assert.ok(path.resolve(directory).startsWith(path.resolve(os.tmpdir())+path.sep));return fs.rm(directory,{recursive:true,force:true,maxRetries:5,retryDelay:100});});let time=Date.parse('2026-11-17T10:00:00Z');return {directory,now:()=>time,setTime:x=>time=x,store:createAnalyticsStore(directory,{now:()=>time})};}
test('analytics validates only permitted categories and discards identity and answers',()=>{
 const event={kind:'complete',visitor_id:randomUUID(),event_id:randomUUID(),resource:'listening',mode:'exam',scope:'full',completed_at:Date.now(),email:'private@example.com',answers:{1:'secret'},user_id:'account-id',ip:'1.2.3.4',url:'/?token=private'};
 const clean=validateAnalyticsEvent(event);assert.deepEqual(Object.keys(clean).sort(),['completed_at','event_id','kind','mode','resource','scope','visitor_id']);assert.equal(validateAnalyticsEvent({...event,resource:'other'}),null);assert.equal(validateAnalyticsEvent({...event,visitor_id:'private@example.com'}),null);assert.equal(validateAnalyticsEvent({...event,mode:'secret'}),null);
});
test('visits deduplicate refreshes, count returning browsers and survive restart',async t=>{
 const f=await fixture(t),id=randomUUID(),visit=()=>({kind:'visit',visitor_id:id,event_id:randomUUID()});await f.store.record(visit());await f.store.record(visit());let r=await f.store.report(7);assert.equal(r.visitors,1);assert.equal(r.visits,1);assert.equal(r.returning,0);
 f.setTime(f.now()+31*60000);await f.store.record(visit());await f.store.record(visit());r=await f.store.report(7);assert.equal(r.visits,2);assert.equal(r.returning,1);
 f.setTime(f.now()+86400000);await f.store.record(visit());r=await createAnalyticsStore(f.directory,{now:f.now}).report(7);assert.equal(r.visitors,1);assert.equal(r.returning,1);assert.equal(r.visits,3);assert.equal(r.daily.filter(d=>d.visitors).length,2);
 const raw=await fs.readFile(path.join(f.directory,'counts.json'),'utf8');assert.ok(!raw.includes(id));assert.ok(!raw.includes('email'));assert.ok(!raw.includes('user_id'));assert.equal(r.timezone,'Asia/Tashkent');assert.equal(analyticsDay(Date.parse('2026-11-17T20:00:00Z')),'2026-11-18');
});
test('submissions deduplicate refreshes and reject historical result backfill',async t=>{
 const f=await fixture(t);await f.store.initialize();const base={kind:'complete',visitor_id:randomUUID(),event_id:randomUUID(),resource:'reading',mode:'training',scope:'single',completed_at:f.now()};
 await Promise.all(Array.from({length:8},()=>f.store.record(base)));await f.store.record({...base,event_id:randomUUID(),completed_at:f.now()-1000});let r=await f.store.report(30);assert.equal(r.completed,1);assert.equal(r.resources.reading,1);assert.equal(r.scopes.single,1);assert.equal(r.modes.training,1);
 await f.store.record({...base,event_id:randomUUID(),resource:'writing',mode:'exam',scope:'full'});await f.store.record({...base,event_id:randomUUID(),resource:'speaking'});r=await f.store.report(30);assert.equal(r.completed,3);assert.equal(r.resources.writing,1);assert.equal(r.resources.speaking,1);assert.equal(r.scopes.full,1);
});
test('reports expose aggregates only and require a private access key',async t=>{
 const f=await fixture(t);await f.store.initialize();assert.equal(await f.store.authorized(''),false);assert.equal(await f.store.authorized('wrong'),false);const config=JSON.parse(await fs.readFile(path.join(f.directory,'config.json'),'utf8'));assert.equal(await f.store.authorized(config.adminKey),true);let r=await f.store.report(30);assert.ok(!JSON.stringify(r).includes(config.secret));assert.ok(!JSON.stringify(r).includes(config.adminKey));assert.deepEqual(Object.keys(r.resources),['listening','reading','writing','speaking']);assert.equal((await f.store.report(10000)).days,30);
});
test('finishing a long test does not count as a returning visit',async t=>{
 const f=await fixture(t),visitor_id=randomUUID();await f.store.record({kind:'visit',visitor_id,event_id:randomUUID()});f.setTime(f.now()+61*60000);await f.store.record({kind:'complete',visitor_id,event_id:randomUUID(),resource:'listening',mode:'exam',scope:'full',completed_at:f.now()});const r=await f.store.report(7);assert.equal(r.completed,1);assert.equal(r.visits,1);assert.equal(r.returning,0);
});
test('report and identity retention expire old daily data',async t=>{
 const f=await fixture(t);await f.store.record({kind:'visit',visitor_id:randomUUID(),event_id:randomUUID()});f.setTime(f.now()+181*86400000);await f.store.record({kind:'visit',visitor_id:randomUUID(),event_id:randomUUID()});const r=await f.store.report(90);assert.equal(r.visitors,1);const saved=JSON.parse(await fs.readFile(path.join(f.directory,'counts.json'),'utf8'));assert.equal(Object.keys(saved.visitors).length,1);assert.equal(Object.keys(saved.days).length,1);
});
async function browser({dnt='0',status=204}={}){const saved=new Map(),events=[],source=await fs.readFile('src/lib/anonymous-analytics.mjs','utf8');const context=vm.createContext({window:{},navigator:{doNotTrack:dnt},location:{pathname:'/'},crypto:webcrypto,Uint8Array,AbortSignal,Date,localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)},fetch:async(_url,options)=>{events.push(JSON.parse(options.body));return {ok:status<300,status};}});vm.runInContext(source.replace(/export /g,'')+';globalThis.analytics={trackVisit,trackCompletion,flushAnalytics};',context);return {api:context.analytics,saved,events};}
test('browser sends anonymous categories once, without account IDs or source keys',async()=>{
 const b=await browser();b.api.trackVisit();b.api.trackVisit();await new Promise(setImmediate);const completedAt=Date.now();b.api.trackCompletion('writing:private-account-id:private-task',{resource:'writing',mode:'exam',scope:'full',completedAt});b.api.trackCompletion('writing:private-account-id:private-task',{resource:'writing',mode:'exam',scope:'full',completedAt});await new Promise(setImmediate);
 assert.equal(b.events.length,2);assert.equal(b.events[0].kind,'visit');assert.equal(b.events[1].kind,'complete');assert.ok(!JSON.stringify(b.events).includes('private'));assert.equal(b.events[1].visitor_id,b.events[0].visitor_id);assert.ok(validateAnalyticsEvent(b.events[1]));
});
test('browser respects DNT and keeps failed deliveries available for retry',async()=>{
 const off=await browser({dnt:'1'});off.api.trackVisit();off.api.trackCompletion('x',{resource:'reading',completedAt:Date.now()});await new Promise(setImmediate);assert.equal(off.events.length,0);assert.equal(off.saved.size,0);
 const b=await browser({status:503});b.api.trackVisit();await new Promise(setImmediate);const before=b.events[0].event_id;await b.api.flushAnalytics();assert.equal(b.events[1].event_id,before);assert.equal(JSON.parse(b.saved.get('linguai-anonymous-pending-v1')).length,1);
});
