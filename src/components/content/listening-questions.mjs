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
 for(const hint of root.querySelectorAll('.listening-word-limit')){
  if(hint._field){const field=hint._field;field.removeAttribute('title');const ids=(field.getAttribute('aria-describedby')||'').split(/\s+/).filter(id=>id&&id!==hint.id);if(ids.length)field.setAttribute('aria-describedby',ids.join(' '));else field.removeAttribute('aria-describedby');}hint.remove();
 }
 tidyListeningNotes(root);

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

 }
 // Keep an existing option bank beside its matching rows without copying text.
 for(const bank of root.querySelectorAll('.opt-box,.matching-box,.optbank-block')){
  if(bank.closest('.listening-matching-compact,.listening-map-task'))continue;
  const rows=bank.nextElementSibling;
  if(!rows?.matches('.drag-match-layout')||!rows.querySelector('select.listening-match-select'))continue;
  const nodes=[];for(let node=bank;node;node=node.nextSibling){nodes.push(node);if(node===rows)break;}const layout=document.createElement('div');layout.className='listening-matching-compact';bank.before(layout);layout.append(...nodes);
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

 syncListeningQuestions(root);
}
export function syncListeningQuestions(root){
 for(const counter of root.querySelectorAll('[data-listening-group]')){
  const selected=counter._fields.filter(f=>f.checked).length,limit=counter._limit;counter.textContent=`Selected ${selected} of ${limit}`+(selected>limit?' — remove an extra choice':'');counter.classList.toggle('over-limit',selected>limit);
 }
}

export function tidyListeningNotes(root){
 for(const flow of root.querySelectorAll('.note-flow')){
  if(flow.dataset.notesTidied||!flow.querySelector('input,select'))continue;flow.dataset.notesTidied='true';flow.classList.add('listening-notes');
  const original=[...flow.childNodes];let section=null,line=[];
  const ensureSection=()=>{if(!section){section=document.createElement('section');section.className='listening-note-section';flow.append(section);}return section;};
  const flush=()=>{
   if(!line.length)return;if(!section&&!line.some(n=>n.nodeType===Node.ELEMENT_NODE||n.textContent.trim())){flow.append(...line);line=[];return;}const host=ensureSection();
   if(line.some(n=>n.nodeType===Node.ELEMENT_NODE||n.textContent.trim())){
    const row=document.createElement('div');row.className='listening-note-line';host.append(row);row.append(...line);
    const first=row.firstChild;if(first?.nodeType===Node.TEXT_NODE){const marker=first.textContent.match(/^\s*[-•]\s+/);if(marker){const span=document.createElement('span');span.className='listening-note-marker';const range=document.createRange();range.setStart(first,0);range.setEnd(first,marker[0].length);range.surroundContents(span);}}
   }else host.append(...line);
   line=[];
  };
  for(const node of original){
   if(node.nodeType===Node.ELEMENT_NODE&&node.matches('.subhead,.notes-subhdr')){flush();section=document.createElement('section');section.className='listening-note-section';flow.append(section);section.append(node);}
   else if(node.nodeType===Node.ELEMENT_NODE&&node.tagName==='BR'){flush();ensureSection().append(node);}
   else line.push(node);
  }flush();
 }
}
