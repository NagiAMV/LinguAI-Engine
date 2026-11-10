import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recordActivity,readActivities,buildStudyDashboard} from '../src/lib/study-dashboard.mjs';
import {wordCount,paragraphCount,newWritingSession,startWritingSession,restoreWritingSession,editWritingDocument,submitWritingSession,rewriteWritingSession,combinedWritingBand} from '../src/components/writing/writing-session.mjs';
const tasks=[{id:'report',task:1},{id:'essay',task:2}];
test('full exam shares one absolute 60-minute deadline across both tasks and reload',()=>{
 const session=startWritingSession(newWritingSession(tasks),tasks,'exam',1000);
 const edited=editWritingDocument(session,tasks,'essay',{text:'An independent answer.'},2000);
 const restored=restoreWritingSession(JSON.parse(JSON.stringify({...edited,active:'essay'})),tasks,61000);
 assert.equal(restored.deadline,3601000);assert.equal(restored.active,'essay');assert.equal(restored.documents.essay.text,'An independent answer.');
 const late=editWritingDocument(restored,tasks,'report',{text:'Too late'},3601000);
 assert.equal(late.phase,'submitted');assert.equal(late.documents.report.text,'');assert.equal(late.documents.essay.text,'An independent answer.');
});
test('individual exams use 20 or 40 minutes; training never expires',()=>{
 for(const task of tasks){const session=startWritingSession(newWritingSession([task]),[task],'exam',1000);assert.equal(session.deadline,1000+(task.task===1?20:40)*60000);}
 const session=startWritingSession(newWritingSession(tasks),tasks,'training',1000);assert.equal(restoreWritingSession(session,tasks,99999999).phase,'running');assert.equal(session.deadline,null);
});
test('submission locks edits; rewriting archives exact text, notes and feedback independently',()=>{
 let session=startWritingSession(newWritingSession(tasks,{essay:{text:'Legacy draft',notes:'Private'}}),tasks,'training',1000);
 session.documents.essay.feedback={bandScore:6};session=submitWritingSession(session,2000);
 assert.equal(editWritingDocument(session,tasks,'essay',{text:'Unexpected'},3000).documents.essay.text,'Legacy draft');
 const next=rewriteWritingSession(session,tasks,true,4000);assert.equal(next.phase,'ready');assert.equal(next.documents.essay.text,'Legacy draft');assert.equal(next.documents.essay.feedback,null);assert.equal(next.history[0].documents.essay.feedback.bandScore,6);
 const blank=rewriteWritingSession(session,tasks,false,5000);assert.equal(blank.documents.essay.text,'');assert.equal(blank.history[0].documents.essay.text,'Legacy draft');
});
test('weighted combined band waits for both reviews and gives Task 2 double weight',()=>{
 assert.equal(combinedWritingBand(tasks,{report:{feedback:{bandScore:5}},essay:{}}),null);
 assert.equal(combinedWritingBand(tasks,{report:{feedback:{bandScore:5}},essay:{feedback:{bandScore:8}}}),7);
 assert.equal(wordCount('  one\n two  three '),3);assert.equal(paragraphCount('One.\n\nTwo.\n\n'),2);
});
test('submitted Writing sessions contribute real practice time to the study journal',()=>{
 const values=new Map(),storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
 assert.equal(recordActivity('guest',{id:'writing-attempt',kind:'writing-session',resource:'writing',title:'Full Writing session',finished_at:'2026-11-10T09:00:00Z',duration_seconds:1200},storage),true);
 const activities=readActivities(storage,'guest');assert.equal(activities.length,1);
 assert.equal(buildStudyDashboard([],activities,new Date('2026-11-10T12:00:00Z')).weekSeconds,1200);
});
