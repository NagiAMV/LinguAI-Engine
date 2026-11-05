import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanErrorTags,toggleErrorTag} from '../src/components/content/error-tags.mjs';
import {transition,restoreSession} from '../src/components/content/exam-session.mjs';
test('tags can be combined and removed independently for each question',()=>{
 let tags=toggleErrorTag({},'2:19','Misheard');tags=toggleErrorTag(tags,'2:19','Distractor');tags=toggleErrorTag(tags,'2:20','Spelling');
 assert.deepEqual(tags['2:19'],['Misheard','Distractor']);
 const updated=toggleErrorTag(tags,'2:19','Misheard');assert.deepEqual(updated['2:19'],['Distractor']);assert.deepEqual(updated['2:20'],['Spelling']);assert.deepEqual(tags['2:19'],['Misheard','Distractor']);
 assert.deepEqual(cleanErrorTags({'2:19':['Spelling','Spelling','bad'],'bad':['Misheard']}),{'2:19':['Spelling']});
});
test('tagging a submitted attempt never changes its answers, score inputs or times',()=>{
 const original={version:2,phase:'submitted',answers:{pair:['A','C']},finishedAt:2000,startedAt:1000,errorTags:{}};
 const updated=transition(original,{type:'tag-error',key:'2:20',tag:'Distractor'},3000);
 assert.deepEqual(updated.answers,original.answers);assert.equal(updated.finishedAt,2000);assert.equal(updated.startedAt,1000);
 assert.deepEqual(restoreSession(JSON.parse(JSON.stringify(updated)),4000).errorTags,{'2:20':['Distractor']});
 assert.deepEqual(transition(updated,{type:'edit',patch:{answers:{pair:['A','E']}}},3000).answers,original.answers);
 assert.deepEqual(transition({...original,phase:'running',deadline:9999},{type:'tag-error',key:'2:20',tag:'Spelling'},3000).errorTags,{});
});
