const NUMBERS={ONE:1,TWO:2,THREE:3,FOUR:4,FIVE:5};
export function wordLimitFromText(text) {
 const matches=[...text.toUpperCase().matchAll(/(?:NO MORE THAN\s+)?(ONE|TWO|THREE|FOUR|FIVE|[1-5])\s+WORDS?(?:\s+(AND\s*\/\s*OR|OR|AND)\s+(?:A|ONE)\s+NUMBER)?/g)];
 const last=matches.at(-1);if(!last)return null;
 if(/(?:CHOOSE|MATCH|LABEL THE|WRITE[^.\n]{0,60}LETTERS?)/.test(text.slice(last.index+last[0].length).toUpperCase()))return null;
 return {words:NUMBERS[last[1]]||Number(last[1]),number:last[2]?'allowed':'none',exclusive:last[2]==='OR'};
}
export function exceedsWordLimit(value,rule) {
 const tokens=value.trim().split(/\s+/).filter(Boolean);
 if(!rule)return false;
 if(rule.number==='none')return tokens.length>rule.words;
 const digits=tokens.filter(t=>/^[£$€]?\d[\d.,:/-]*(?:st|nd|rd|th|am|pm)?$/i.test(t)).length;
 return digits>1 || tokens.length-digits>rule.words || (rule.exclusive && digits>0 && tokens.length>1);
}
function ui(tag,className){const node=document.createElement(tag);node.className=className;node.dataset.listeningUi='';return node;}
function entriesFromBank(node) {
 const lines=[...node.querySelectorAll('li,p,.mb-row,.eh-opt,.opt-row')].map(e=>e.innerText.trim().replace(/\s+/g,' '));
 if(!lines.length)lines.push(...node.innerText.split(/\n/));
 const entries=new Map();for(const line of lines){const m=line.match(/^([A-Z])[.)\s:–—-]+(.+)$/);if(m)entries.set(m[1],m[2].trim());}return entries;
}
export function enhanceListeningQuestions(root,groups=[]) {
 root.classList.add('listening-questions');
 const bankSelector='.matching-box,.opt-box,.optbank-block,.headlist,.match-key-box,.options-box,ul,ol';
 const banks=[...root.querySelectorAll(bankSelector)].filter(n=>!n.closest('[data-listening-ui]')).map(node=>({node,entries:entriesFromBank(node)}));
 // Native papers also have plain A/B/C lines immediately before matching rows.
 let run=[];
 for(const p of root.querySelectorAll('p.native-text-row,p')){
  if(p.closest('[data-listening-ui]')||p.querySelector('input,select')){if(run.length>=2)banks.push({node:run.at(-1),entries:new Map(run.map(n=>{const m=n.textContent.trim().match(/^([A-Z])[.)\s:–—-]+(.+)$/);return [m[1],m[2]];}))});run=[];continue;}
  if(/^[A-Z][.)\s:–—-]+\S/.test(p.textContent.trim()))run.push(p);else {if(run.length>=2)banks.push({node:run.at(-1),entries:new Map(run.map(n=>{const m=n.textContent.trim().match(/^([A-Z])[.)\s:–—-]+(.+)$/);return [m[1],m[2]];}))});run=[];}
 }
 banks.sort((a,b)=>a.node===b.node?0:a.node.compareDocumentPosition(b.node)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1);
 for(const select of root.querySelectorAll('select[name]')){
  if(select.closest('.listening-map-answers') || select.dataset.listeningEnhanced)continue;select.dataset.listeningEnhanced='true';
  const options=[...select.options].filter(o=>o.value);if(!options.length)continue;
  const bank=banks.filter(b=>b.node.compareDocumentPosition(select)&Node.DOCUMENT_POSITION_FOLLOWING).reverse().find(b=>options.every(o=>b.entries.has(o.value)));
  if(!bank)continue;
  for(const option of options)option.textContent=option.value+' — '+bank.entries.get(option.value);
  select.classList.add('listening-match-select');
  const details=ui('details','listening-nearby-options'),summary=document.createElement('summary');summary.textContent='Show options';details.append(summary);
  const list=document.createElement('ul');for(const option of options){const li=document.createElement('li');li.textContent=option.textContent;list.append(li);}details.append(list);select.after(details);
 }
 for(const label of root.querySelectorAll('label'))if(label.querySelectorAll('input[type=radio],input[type=checkbox]').length===1)label.classList.add('listening-choice');
 for(const row of root.querySelectorAll('.native-text-row,.q-row,.match-row,.matching-item,.drag-item-row')){
  const number=row.querySelector('[class$="question-number"]');if(!number||row.querySelectorAll('input,select').length!==1)continue;
  if(!row.dataset.numberTidied){
   row.dataset.numberTidied='true';
   const text=row.firstChild;if(text?.nodeType===Node.TEXT_NODE){const m=text.textContent.match(/^\s*(\d+)[.)]?\s*/);if(m&&m[1]===number.textContent.trim()){const span=document.createElement('span');span.className='listening-duplicate-number';const range=document.createRange();range.setStart(text,0);range.setEnd(text,m[0].length);range.surroundContents(span);}}
  }
  row.classList.add('listening-answer-row');number.classList.add('listening-row-number');
 }
 const checkboxes=[...root.querySelectorAll('input[type=checkbox][name]')];
 for(const group of groups){
  const fields=checkboxes.filter(f=>group.questions.includes(Number(f.getAttribute('aria-label')?.match(/Question (\d+)/)?.[1])));
  if(!fields.length)continue;const key=group.questions.join('-');
  if([...root.querySelectorAll('[data-listening-group]')].some(n=>n.dataset.listeningGroup===key))continue;
  const counter=ui('p','listening-choice-count');counter.dataset.listeningGroup=key;counter.setAttribute('role','status');counter.setAttribute('aria-live','polite');counter._fields=fields;counter._limit=group.questions.length;
  const label=fields[0].closest('label')||fields[0];label.before(counter);
 }
 for(const field of root.querySelectorAll('input[type=text][name]')){
  if(field.dataset.listeningLimitChecked)continue;field.dataset.listeningLimitChecked='true';
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement.closest('select,button,[data-listening-ui],[data-reading-ui]')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});let prefix='';while(walker.nextNode()){const n=walker.currentNode;if(n.compareDocumentPosition(field)&Node.DOCUMENT_POSITION_FOLLOWING)prefix+=n.textContent+' ';}
  const rule=wordLimitFromText(prefix);if(!rule)continue;
  const hint=ui('small','listening-word-limit');hint._field=field;hint._rule=rule;hint.id='limit-'+field.name;hint.setAttribute('aria-live','polite');field.setAttribute('aria-describedby',[field.getAttribute('aria-describedby'),hint.id].filter(Boolean).join(' '));const overlay=field.closest('.worksheet-input');
  if(overlay){hint.classList.add('listening-overlay-limit');(overlay.closest('.native-diagram-scroll')||root).append(hint);field.addEventListener('focus',()=>syncListeningQuestions(root));field.addEventListener('blur',()=>syncListeningQuestions(root));}else field.after(hint);
 }
 syncListeningQuestions(root);
}
export function syncListeningQuestions(root){
 for(const counter of root.querySelectorAll('[data-listening-group]')){
  const selected=counter._fields.filter(f=>f.checked).length,limit=counter._limit;counter.textContent=`Selected ${selected} of ${limit}`+(selected>limit?' — remove an extra choice':'');counter.classList.toggle('over-limit',selected>limit);
 }
 for(const hint of root.querySelectorAll('.listening-word-limit')){
  const rule=hint._rule,field=hint._field,over=exceedsWordLimit(field.value,rule);hint.textContent=`Up to ${rule.words} word${rule.words===1?'':'s'}`+(rule.number==='allowed'?(rule.exclusive?' OR 1 number':' + up to 1 number'):'')+(over?' — check word limit':'');hint.classList.toggle('over-limit',over);if(hint.classList.contains('listening-overlay-limit')){hint.hidden=document.activeElement!==field;field.title=hint.textContent;}
 }
}
