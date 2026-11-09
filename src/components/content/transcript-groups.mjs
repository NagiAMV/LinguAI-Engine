const words=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
export function transcriptQuestionRange(text) {
 let value=text.toLowerCase().replace(/\s+/g,' ');
 value=value.replace(/\b(twenty|thirty|forty)\b/g,word=>({twenty:20,thirty:30,forty:40}[word]));
 value=value.replace(new RegExp('\\b('+words.join('|')+')\\b','g'),word=>words.indexOf(word));
 value=value.replace(/\b(20|30)[ -]+([1-9])\b/g,(_,a,b)=>Number(a)+Number(b));
 const match=value.match(/questions?\s+(\d{1,2})\s*(?:to|and|–|-)\s*(\d{1,2})/);
 return match&&Number(match[1])<=Number(match[2])?[Number(match[1]),Number(match[2])]:null;
}
export function prepareTranscriptGroups(root, part) {
 const paragraphs=[...root.querySelectorAll('p')].filter(p=>!p.closest('.transcript-source-note,[data-review-feedback]'));
 const numbers=Object.values(part.fieldLabels||{}).flatMap(value=>(value.match(/\d+/g)||[]).map(Number));
 const min=Math.min(...numbers),max=Math.max(...numbers),seen=new Set(),inserted=[];
 paragraphs.forEach((paragraph,index)=>{
  const text=paragraph.textContent;
  // Only join a split announcement. Looking ahead from every paragraph would
  // put the divider before the last answer of the preceding question group.
  const range=transcriptQuestionRange(text) || (/\b(?:questions?|look at)\b/i.test(text)
   ? transcriptQuestionRange(text+' '+(paragraphs[index+1]?.textContent||'')) : null);
  if(!range||range[0]<min||range[1]>max)return;
  const key=range.join('–');if(seen.has(key))return;seen.add(key);
  const divider=document.createElement('div');divider.className='transcript-group-divider';divider.dataset.readingUi='';
  divider.textContent='Questions '+key;paragraph.before(divider);inserted.push(divider);
 });
 return()=>inserted.forEach(node=>node.remove());
}
