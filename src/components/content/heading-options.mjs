// Restore an omitted reference list from the test's existing heading choices.
// Raw imported files and answer-field identifiers remain unchanged.
export function withHeadingLists(test) {
 if(test.resource!=='reading')return test;
 return {...test,parts:test.parts.map(part=>{
  const marker=/(<p[^>]*>\s*<strong>\s*List of Headings\s*<\/strong>\s*<\/p>)\s*(?=<\/div>)/i;
  if(!marker.test(part.questions))return part;
  const selects=[...part.passage.matchAll(/<div class="heading-drop-zone[^"]*"[^>]*>[\s\S]*?<select[^>]*>([\s\S]*?)<\/select>/g)];
  const banks=selects.map(match=>[...match[1].matchAll(/<option value="([^"]+)"[^>]*>([\s\S]*?)<\/option>/g)].map(option=>option[2]));
  if(!banks.length||!banks[0].length||!banks.every(bank=>JSON.stringify(bank)===JSON.stringify(banks[0])))return part;
  const list='<ul class="exam-heading-options" aria-label="List of Headings">'+banks[0].map(label=>'<li>'+label+'</li>').join('')+'</ul>';
  return {...part,questions:part.questions.replace(marker,(_,heading)=>heading+list+' ')};
 })};
}
