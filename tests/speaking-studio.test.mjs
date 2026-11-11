import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {speakingPlan,freshSpeaking,startSpeaking,tickSpeaking,nextSpeaking,speakingMetrics} from '../src/components/speaking-session.mjs';
const bank=JSON.parse(fs.readFileSync('src/data/speaking-question-bank.json','utf8'));
test('all 68 sets have complete full and focused plans; full timer is 11 minutes including Part 2 prep',()=>{
 for(const set of bank.sessions){const plan=speakingPlan(set);assert.ok(plan.some(p=>p.part===1)&&plan.some(p=>p.part===3));assert.equal(plan.filter(p=>p.prepare).length,1);assert.ok(Math.abs(plan.reduce((n,p)=>n+p.seconds,0)-660)<.001);for(const part of [1,2,3])assert.ok(speakingPlan(set,part).every(p=>p.part===part));}
});
test('exam catches up after backgrounding and does not reset time on reload',()=>{
 const plan=speakingPlan(bank.sessions[0]),started=startSpeaking(freshSpeaking(plan),plan,'exam',1000),saved=JSON.parse(JSON.stringify(started));
 const later=tickSpeaking(saved,plan,601000);assert.equal(later.phase,'running');assert.ok(later.index>0);assert.equal(tickSpeaking(saved,plan,662000).phase,'submitted');
 assert.equal(tickSpeaking({...saved,deadline:null},plan,2000).phase,'submitted');
});
test('training waits for learner navigation; Part 2 prep and speaking are separate',()=>{
 const plan=speakingPlan(bank.sessions[0],2),training=startSpeaking(freshSpeaking(plan),plan,'training',1000);assert.equal(tickSpeaking(training,plan,999999).index,0);const speech=nextSpeaking(training,plan,5000);assert.equal(speech.index,1);assert.equal(speech.deadline,null);assert.equal(nextSpeaking(speech,plan,9000).phase,'submitted');assert.equal(plan[0].seconds,60);assert.equal(plan[1].seconds,120);
});
test('words per minute is descriptive and unavailable without measured audio duration',()=>{assert.deepEqual(speakingMetrics('one two three',null),{words:3,wordsPerMinute:null});assert.equal(speakingMetrics('one two three',6).wordsPerMinute,30);});
