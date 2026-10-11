import { normalizeAnswer, reviewAnswer } from './answer-review.mjs';

// Indicative IDP tables, not an official result for a particular test version.
// https://ielts.idp.com/pakistan/results/scores/reading
// https://ielts.idp.com/vietnam/results/scores/listening/
const tables = {
 reading: [[39,9],[37,8.5],[35,8],[33,7.5],[30,7],[27,6.5],[23,6],[19,5.5],[15,5],[13,4.5],[10,4],[8,3.5],[6,3],[4,2.5]],
 listening: [[39,9],[37,8.5],[35,8],[32,7.5],[30,7],[26,6.5],[23,6],[18,5.5],[16,5],[13,4.5],[10,4],[8,3.5],[6,3],[4,2.5]],
};
export function estimatedBand(correct, total, checked, module) {
 if(total!==40 || checked!==total || !tables[module]) return null;
 return tables[module].find(([minimum])=>correct>=minimum)?.[1].toFixed(1) || '< 2.5';
}
// Maximum one-to-one matching gives partial credit without counting a choice twice.
function matches(responses, slots) {
 const owner=new Map();
 function assign(index, visited) {
  for(let slot=0;slot<slots.length;slot++) {
   if(visited.has(slot)||!slots[slot].some(answer=>normalizeAnswer(answer)===responses[index]))continue;
   visited.add(slot);
   if(!owner.has(slot)||assign(owner.get(slot),visited)){owner.set(slot,index);return true;}
  }
  return false;
 }
 return responses.reduce((score,_,index)=>score+Number(assign(index,new Set())),0);
}
export function scoreExam(test, questions, answers, key) {
 let correct=0, checked=0;
 const seen=new Set();
 for(const question of questions) {
  if(seen.has(question.id))continue;
  const part=test.parts[question.partIndex];
  const group=key?.parts?.[part.id]?.groups?.find(g=>g.questions.includes(Number(question.number)));
  const members=questions.filter(q=>q.partIndex===question.partIndex && (group?group.questions.includes(Number(q.number)):q.name===question.name));
  members.forEach(q=>seen.add(q.id));
  const numbers=members.map(q=>q.number);
  const multiple=Boolean(group)||question.multiple;
  const names=[...new Set(members.map(q=>q.name))];
  const value=multiple?names.flatMap(name=>Array.isArray(answers[name])?answers[name]:[answers[name]||'']):answers[question.name];
  const result=reviewAnswer(value,numbers,key,multiple);
  if(result.status==='pending')continue;
  checked+=members.length;
  if(!multiple){correct+=Number(result.status==='correct');continue;}
  const responses=value.map(normalizeAnswer).filter(Boolean);
  // More selections than requested must not earn marks by selecting every option.
  if(responses.length>members.length)continue;
  const sets=group?.acceptedSets?.map(set=>set.map(answer=>[answer])) || [numbers.map(number=>key.answers[number])];
  correct+=Math.max(0,...sets.map(slots=>matches(responses,slots)));
 }
 const total=questions.length;
 return {correct,total,checked,pending:total-checked,band:estimatedBand(correct,total,checked,test.resource)};
}
