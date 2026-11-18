// Keep DOM text order intact so existing saved selections retain their offsets.
export function alignQuestionRows(root){
 if(!root)return;
 for(const row of root.querySelectorAll('.native-text-row')){
  if(row.classList.contains('exam-aligned-row'))continue;
  const gap=[...row.children].find(n=>n.matches('.native-gap')),number=gap?.querySelector('.ielts-listening-question-number,.ielts-reading-question-number'),field=gap?.querySelector('input,select');
  if(!gap||!number||!field||row.querySelectorAll('input,select').length!==1||number.parentElement!==gap||field.parentElement!==gap)continue;
  const prefix=[];let after=false,valid=true;
  for(const node of row.childNodes){if(node===gap){after=true;continue;}if(after&&node.textContent.trim())valid=false;else if(!after)prefix.push(node);}
  if(!valid||!prefix.length)continue;
  const first=prefix[0];if(first.nodeType===Node.TEXT_NODE){const match=first.textContent.match(/^\s*(\d+)[.)]?\s+/);if(match&&match[1]===number.textContent.trim()){const range=document.createRange();range.setStart(first,0);range.setEnd(first,match[0].length);const duplicate=document.createElement('span');duplicate.className='listening-duplicate-number';range.surroundContents(duplicate);}}
  const prompt=document.createElement('span');prompt.className='exam-row-prompt';
  while(row.firstChild&&row.firstChild!==gap)prompt.append(row.firstChild);
  row.prepend(prompt);row.classList.add('exam-aligned-row');
 }
}
