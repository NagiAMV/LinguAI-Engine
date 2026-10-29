import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFocusStats, practiceIdeas } from '../src/lib/practice-ideas.mjs';
const catalogs = { reading: [{id:'single-reading-1',number:1,passageNumber:1}], listening: [{id:'single-listening-1',number:1,sectionNumber:1},{id:'single-listening-61',number:61,sectionNumber:4}] };
const attempt = (overrides={}) => ({id:'a',test_id:'practice-listening-1',resource:'listening',title:'Test 1',correct:3,total:10,checked:10,finished_at:'2026-10-29T07:00:00Z',focus_stats:[{part:4,correct:3,checked:10,blank:2}],...overrides});
test('new learners receive actionable baseline tasks without invented weaknesses',()=>{
 const ideas=practiceIdeas([],catalogs);
 assert.ok(ideas.every(i=>i.kind==='start' && i.href.startsWith('/practice/')));
 assert.ok(ideas.some(i=>i.resource==='reading') && ideas.some(i=>i.resource==='listening'));
});
test('a weak section links to that section, not a generic hardcoded task',()=>{
 const idea=practiceIdeas([attempt()],catalogs).find(i=>i.kind==='focus');
 assert.equal(idea.part,4); assert.match(idea.href,/view=listening&format=single&part=4/);
 assert.match(idea.detail,/3\/10/); assert.match(idea.detail,/2 unanswered/);
 assert.equal(idea.reviewHref,'/practice/listening/1');
});
test('an improved retake replaces the previous result for that paper',()=>{
 const old=attempt();const improved=attempt({id:'b',finished_at:'2026-10-29T08:00:00Z',correct:10,focus_stats:[{part:4,correct:10,checked:10,blank:0}]});
 assert.ok(!practiceIdeas([old,improved],catalogs).some(i=>i.kind==='focus'));
});
test('old summary-only results do not invent a section or question type',()=>{
 const idea=practiceIdeas([attempt({focus_stats:undefined})],catalogs).find(i=>i.kind==='review');
 assert.equal(idea.part,undefined);assert.equal(idea.href,'/practice/listening/1');
 assert.match(idea.detail,/overall/i);
});
test('ungraded answers do not become a learning weakness',()=>{
 assert.ok(!practiceIdeas([attempt({checked:0,correct:0,focus_stats:[{part:4,correct:0,checked:0,blank:10}]})],catalogs).some(i=>['focus','review'].includes(i.kind)));
});
test('part diagnostics preserve partial credit and the original single-section number',()=>{
 const paper={id:'single-listening-61',resource:'listening',parts:[{id:1,fieldNames:['choices','word']}]};
 const questions=[{id:'0:31',number:'31',name:'choices',partIndex:0,multiple:true,slot:0},{id:'0:32',number:'32',name:'choices',partIndex:0,multiple:true,slot:1},{id:'0:33',number:'33',name:'word',partIndex:0,multiple:false,slot:0}];
 const key={answers:{31:['B'],32:['C'],33:['river']},parts:{1:{groups:[{questions:[31,32],acceptedSets:[['B','C']]}]}}};
 assert.deepEqual(buildFocusStats(paper,questions,{choices:['B'],word:''},key,4),[{part:4,correct:1,checked:3,blank:2}]);
});
