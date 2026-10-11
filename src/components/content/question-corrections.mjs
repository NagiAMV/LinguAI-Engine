// Apply verified presentation corrections without rewriting imported files or field names.
export function withQuestionCorrections(test, corrections) {
 const record=corrections[test.id];
 if(!record)return test;
 return {...test,parts:test.parts.map(part=>{
  let html=part.questions;
  for(const fix of record.parts[String(part.id)]||[]){
   if(html.includes(fix.before)&&html.indexOf(fix.before)===html.lastIndexOf(fix.before))html=html.replace(fix.before,fix.after);
  }
  return html===part.questions?part:{...part,questions:html};
 })};
}
