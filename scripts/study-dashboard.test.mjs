import test from 'node:test';
import assert from 'node:assert/strict';
import {buildStudyDashboard,localDay,recordActivity,readActivities} from '../src/lib/study-dashboard.mjs';
import coach from '../src/lib/study-coach.js';
import review from '../src/lib/ai-review-service.js';
const now=new Date(2026,10,9,14,0);
const attempt=(id,skill,day,correct=32,band='7.0')=>({id,test_id:`practice-${skill}-1`,resource:skill,title:`${skill} Test 1`,total:40,checked:40,correct,band,finished_at:new Date(2026,10,day,10).toISOString(),duration_seconds:600});
test('week, local-day history and streak are based on actual activity, not sample data',()=>{
 const a=attempt('a','listening',9),b=attempt('b','reading',8);const d=buildStudyDashboard([a,a,b],[],now);
 assert.equal(d.weekCount,1);assert.equal(d.weekSeconds,600);assert.equal(d.streak,2);assert.equal(d.week[0].key,'2026-11-09');assert.equal(d.events.length,2);assert.equal(d.overall,null);
 const empty=buildStudyDashboard([],[],now);assert.equal(empty.streak,0);assert.equal(empty.weekCount,0);assert.ok(empty.scores.every(s=>s.band===null));
 assert.equal(localDay(new Date(2026,10,9,0,1)),'2026-11-09');
});
test('readiness excludes singles, keeps latest retake, and requires four assessments',()=>{
 const a=attempt('a','listening',9),b=attempt('b','reading',9,30,'6.5');
 const single={...attempt('s','listening',9,10,null),test_id:'single-listening-1',total:10,checked:10};
 const logs=['writing','speaking'].map(resource=>({id:resource,kind:'review',resource,title:resource,finished_at:new Date(2026,10,9,12).toISOString(),duration_seconds:0,band:7}));
 const d=buildStudyDashboard([single,a,b],logs,now);assert.equal(d.scores[0].band,'7.0');assert.equal(d.overall,7);
 assert.equal(buildStudyDashboard([{...a,band:'< 2.5'},b],logs,now).overall,null);
});
test('draft updates merge by day and task; activity is isolated by owner',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
 const activity={id:'draft:1:2026-11-09',resource:'writing',kind:'draft',title:'My draft',finished_at:now.toISOString(),duration_seconds:0};
 assert.ok(recordActivity('alice',activity,storage));recordActivity('alice',{...activity,word_count:70},storage);
 assert.equal(readActivities(storage,'alice').length,1);assert.equal(readActivities(storage,'alice')[0].word_count,70);assert.deepEqual(readActivities(storage,'bob'),[]);assert.deepEqual(readActivities(storage,null),[]);
 const blocked={getItem(){throw Error('Storage blocked');},setItem(){throw Error('Storage blocked');}};
 assert.deepEqual(readActivities(blocked,'alice'),[]);assert.equal(recordActivity('alice',activity,blocked),false);
});
test('AI coach validates summaries, strips extra data, and validates provider output',async()=>{
 const body={language:'ru',target:7,weekCount:1,weekSeconds:600,skills:['reading','listening','writing','speaking'].map(skill=>({skill,band:null,accuracy:null,count:0,secret:'not forwarded'})),errors:{Spelling:2},rawAnswers:'not forwarded'};
 const clean=coach.validateInput(body);assert.equal(clean.rawAnswers,undefined);assert.equal(clean.skills[0].secret,undefined);assert.throws(()=>coach.validateInput({...body,skills:[body.skills[0]]}));
 const plan={summary:'Start with a baseline.',steps:['reading','listening','writing'].map(skill=>({skill,title:'Baseline',reason:'No results yet.',action:'Try a short practice.',minutes:15}))};
 let request;const result=await coach.recommend(clean,{provider:'openai',model:'test-model',key:'not-real',endpoint:'https://example.invalid',tokens:1000,timeout:1000},async(url,options)=>{request=JSON.parse(options.body);return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(plan)}}]})};});
 assert.equal(result.steps.length,3);assert.match(request.messages[1].content,/"Spelling":2/);assert.doesNotMatch(request.messages[1].content,/not forwarded/);assert.throws(()=>coach.validatePlan({...plan,steps:[{...plan.steps[0],skill:'admin'}]}));
 assert.equal(coach.config({AI_PROVIDER:'openai',OPENAI_MODEL:'test',OPENAI_API_KEY:'test',AI_REVIEW_ENABLED:'true'}).available,false);
});
test('existing AI evaluation still validates the IELTS rubric after transport reuse',async()=>{
 const feedback={bandScore:7,summary:'Good work',strengths:[],improvements:[],nextSteps:[],corrections:[],criteria:{'Task Response':'Clear','Coherence and Cohesion':'Clear','Lexical Resource':'Good','Grammatical Range and Accuracy':'Good'}};
 const cfg={provider:'openai',model:'test-model',key:'not-real',endpoint:'https://example.invalid',tokens:1000,timeout:1000};
 assert.equal((await review.evaluate({mode:'writing',task:'Task 2',submission:'This is a practice response.'},cfg,async()=>({ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(feedback)}}]})}))).bandScore,7);
});
