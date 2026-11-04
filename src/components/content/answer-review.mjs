// Only explicit source alternatives are accepted.
export function normalizeAnswer(value) {
 return String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
}
function matchChoices(responses,slots) {
 const owner=new Map();
 function assign(index,visited){
  for(let slot=0;slot<slots.length;slot++){
   if(visited.has(slot)||!slots[slot].some(answer=>normalizeAnswer(answer)===normalizeAnswer(responses[index])))continue;
   visited.add(slot);
   if(!owner.has(slot)||assign(owner.get(slot),visited)){owner.set(slot,index);return true;}
  }return false;
 }
 responses.forEach((value,index)=>{if(normalizeAnswer(value))assign(index,new Set());});
 return new Set(owner.values());
}
export function reviewAnswer(value,numbers,key,multiple=false){
 const group=multiple&&Object.values(key?.parts||{}).flatMap(part=>part.groups||[]).find(group=>group.questions.length===numbers.length&&group.questions.every(n=>numbers.map(Number).includes(n)));
 let sets,display;
 if(group){
  if(!Array.isArray(group.acceptedSets)||!group.acceptedSets.length||group.acceptedSets.some(set=>!Array.isArray(set)||set.length!==numbers.length||!set.every(answer=>typeof answer==='string'&&answer.trim())))return {status:'pending',display:null};
  sets=group.acceptedSets.map(set=>set.map(answer=>[answer]));display=group.acceptedSets.map(set=>set.join(', ')).join(' OR ');
 }else{
  const entries=numbers.map(number=>key?.answers?.[number]);
  if(!entries.length||!entries.every(entry=>Array.isArray(entry)&&entry.length&&entry.every(v=>typeof v==='string'&&v.trim())))return {status:'pending',display:null};
  display=entries.map(entry=>entry.join(' / ')).join(', ');sets=[entries];
 }
 const responses=(Array.isArray(value)?value:[value]).map(v=>String(v??''));
 if(!multiple){const response=normalizeAnswer(responses[0]);return {status:!response?'blank':sets[0][0].some(v=>normalizeAnswer(v)===response)?'correct':'incorrect',display};}
 const selected=responses.filter(v=>normalizeAnswer(v));
 let matched=new Set();for(const slots of sets){const candidate=matchChoices(responses,slots);if(candidate.size>matched.size)matched=candidate;}
 const overSelected=selected.length>numbers.length,credit=overSelected?0:matched.size;
 const status=!selected.length?'blank':overSelected?'incorrect':credit===numbers.length?'correct':credit>0?'partial':'incorrect';
 return {status,display,credit,total:numbers.length,overSelected,choices:responses.map((response,index)=>({response,status:!normalizeAnswer(response)?'blank':matched.has(index)?'correct':'incorrect'}))};
}
// Build review rows from existing field names without changing persisted answers.
// A verified unordered group can span one checkbox field or several text fields.
export function buildReviewRows(test, questions, answers, flags, key) {
  return test.parts.flatMap((part, partIndex) => {
    const seen = new Set();
    const partQuestions = questions.filter(q => q.partIndex === partIndex);
    return part.fieldNames.flatMap(name => {
      if (seen.has(name)) return [];
      let members = partQuestions.filter(q => q.name === name);
      const verified = key?.parts?.[part.id]?.groups?.find(group => members.some(q => group.questions.includes(Number(q.number))));
      if (verified) members = partQuestions.filter(q => verified.questions.includes(Number(q.number)));
      const names = [...new Set(members.map(q => q.name))];
      names.forEach(n => seen.add(n));
      const multiple = Boolean(verified) || members[0]?.multiple;
      const value = multiple ? names.flatMap(n => Array.isArray(answers[n]) ? answers[n] : [answers[n] || '']) : answers[name];
      const response = Array.isArray(value) ? value.filter(v => String(v).trim()).join(', ') : value || '';
      return [{ name, names, part: part.id, questionNumbers: members.map(q => q.number), responseValues: Array.isArray(value) ? value : [value || ''], numbers: members.map(q => q.number).join('–'), response,
        flagged: members.some(q => flags.includes(q.id)),
        ...reviewAnswer(value, members.map(q => q.number), key, multiple) }];
    });
  });
}

// The context review keeps groups together; the results table shows one mark per row.
export function splitResultRows(rows) {
 return rows.flatMap(row => {
  if (!(row.questionNumbers?.length > 1)) return [row];
  return row.questionNumbers.map((number, index) => {
   const choice = row.choices?.[index];
   const values = row.responseValues || [];
   const response = index === row.questionNumbers.length - 1 ? values.slice(index).join(', ') : String(values[index] || '');
   const status = row.status === 'pending' ? 'pending' : row.overSelected ? (response.trim() ? 'incorrect' : 'blank') : choice?.status || (response.trim() ? 'incorrect' : 'blank');
   return {...row, name: `${row.name}:result:${number}`, numbers: String(number), response, status, choices: undefined, total: undefined, credit: undefined, groupStatus: row.status, groupRow: row};
  });
 });
}

