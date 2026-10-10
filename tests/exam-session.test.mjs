import { test } from 'node:test';
import assert from 'node:assert/strict';
import { restoreSession, transition, remaining, countdown, DURATION } from '../src/components/content/exam-session.mjs';
test('legacy answers survive migration without an unexpected expiry', () => {
 const s=restoreSession({answers:{q:'paint'},startedAt:1,partIndex:2},10000000);
 assert.equal(s.phase,'ready'); assert.equal(s.answers.q,'paint'); assert.equal(s.partIndex,2);
});
test('countdown starts only on Start and persists its absolute deadline', () => {
 const ready=restoreSession({}); assert.equal(countdown(remaining(ready)),'60:00');
 const s=transition(ready,{type:'start'},1000);
 assert.equal(s.deadline,1000+DURATION);
 assert.equal(countdown(remaining(restoreSession(JSON.parse(JSON.stringify(s)),61000),61000)),'59:00');
 assert.equal(transition(s,{type:'start'},61000).deadline,s.deadline);
});
test('deadline guards edits even before the display tick, and refresh stays locked', () => {
 const s=transition(restoreSession({answers:{q:'original'}}),{type:'start'},1000);
 const locked=transition(s,{type:'edit',patch:{answers:{q:'late'}}},s.deadline);
 assert.equal(locked.phase,'expired'); assert.equal(locked.answers.q,'original');
 assert.equal(restoreSession(locked,s.deadline+5000).phase,'expired');
 assert.equal(remaining(locked),0);
});
test('submitted attempts cannot resume or edit', () => {
 const s=transition(transition(restoreSession({}),{type:'start'},1000),{type:'submit'},2000);
 assert.equal(s.phase,'submitted');
 assert.deepEqual(transition(s,{type:'edit',patch:{answers:{q:'late'}}},3000),s);
 assert.equal(remaining(s,99999999),DURATION-1000);
});
test('expired attempts allow submission only', () => {
 const s=transition(restoreSession({}),{type:'start'},1000);
 const submitted=transition(s,{type:'submit'},s.deadline+10);
 assert.equal(submitted.phase,'submitted'); assert.equal(remaining(submitted),0);
});

test('display cannot exceed 60 minutes between Start and the next tick', () => {
 const s=transition(restoreSession({}),{type:'start'},1000);
 assert.equal(countdown(remaining(s,750)),'60:00');
});

test('annotations and notes survive refresh and archival data without altering answers or timer', () => {
 const started=transition(restoreSession({answers:{q1:'saved'}}),{type:'start'},1000);
 const highlighted=transition(started,{type:'edit',patch:{highlights:[{id:'h1',part:1,area:'passage',start:0,end:5,text:'hello',color:'yellow'}],notes:[{id:'n1',part:1,quote:'hello',body:'Remember this'}],flags:['0:1']}},2000);
 const refreshed=restoreSession(highlighted,3000);
 assert.deepEqual(refreshed.highlights,highlighted.highlights);assert.deepEqual(refreshed.notes,highlighted.notes);assert.deepEqual(refreshed.answers,{q1:'saved'});assert.equal(refreshed.deadline,started.deadline);
 const expired=restoreSession(refreshed,started.deadline);
 assert.equal(transition(expired,{type:'edit',patch:{notes:[]}},started.deadline).notes.length,1);
});
