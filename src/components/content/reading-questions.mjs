const BANKS = '.headlist,.list-headings-box,.match-key-box,.reading-word-bank,.dragbank,.headings-box';
function bankEntries(bank) {
 const lines = [...bank.querySelectorAll('li,p,.drag-chip')].map(e=>{const prefix=e.querySelector('b,strong,.rn');return prefix ? prefix.textContent.trim()+' '+e.textContent.trim().slice(prefix.textContent.trim().length).trim() : e.textContent.trim();});
 if (!lines.length) lines.push(...bank.innerText.split(/\n/));
 const entries = new Map();
 for (const line of lines) {
  const match=line.trim().match(/^([A-Z]|[ivxlcdm]+)[.)\s:–—-]+(.+)$/i);
  if(match)entries.set(match[1].toUpperCase(),match[2].trim());
 }
 return entries;
}
export function enhanceReadingQuestions(root) {
 if(!root)return;
 root.classList.add('reading-questions');
 for(const table of root.querySelectorAll('table')) {
  if(table.parentElement.classList.contains('reading-table-scroll'))continue;
  const wrapper=document.createElement('div');wrapper.className='reading-table-scroll';wrapper.tabIndex=0;wrapper.setAttribute('role','region');wrapper.setAttribute('aria-label','Question table — scroll horizontally to see all columns');table.before(wrapper);wrapper.append(table);
 }
 const banks=[...root.querySelectorAll(BANKS+',ul,ol')].map(node=>({node,entries:bankEntries(node)})).filter(b=>b.entries.size>=2);
 for(const select of root.querySelectorAll('select[name]')) {
  if(select.dataset.readingEnhanced)continue;
  select.dataset.readingEnhanced='true';
  const options=[...select.options].filter(o=>o.value);
  const values=options.map(o=>o.value.toUpperCase());
  const tf=values.length===3 && (['TRUE','FALSE','NOT GIVEN'].every(v=>values.includes(v))||['YES','NO','NOT GIVEN'].every(v=>values.includes(v)));
  if(tf) {
   select.hidden=true;
   const group=document.createElement('span');group.className='reading-answer-buttons';group.dataset.readingUi='';group.setAttribute('role','group');group.setAttribute('aria-label',select.getAttribute('aria-label')+' answer');
   for(const option of options) {
    const button=document.createElement('button');button.type='button';button.textContent=option.textContent;button.name=select.name;button.dataset.answerValue=option.value;button.setAttribute('aria-pressed','false');
    button.onclick=()=>{if(select.disabled)return;select.value=select.value===option.value?'':option.value;select.dispatchEvent(new Event('input',{bubbles:true}));};
    group.append(button);
   }
   select.after(group);
   continue;
  }
  const bank=banks.filter(b=>b.node.compareDocumentPosition(select)&Node.DOCUMENT_POSITION_FOLLOWING).reverse().find(b=>values.every(v=>b.entries.has(v)));
  if(!bank)continue;
  for(const option of options)option.textContent=option.value+' — '+bank.entries.get(option.value.toUpperCase());
  select.classList.add('reading-match-select');
  select.dataset.readingInlineBank=String(Boolean(bank.node.closest('.reading-word-bank')));
  const details=document.createElement('details');details.className='reading-nearby-options';details.dataset.readingUi='';const summary=document.createElement('summary');summary.textContent='Show options';details.append(summary);
  const list=document.createElement('ul');for(const option of options){const li=document.createElement('li');li.textContent=option.textContent;list.append(li);}details.append(list);select.after(details);
 }
 for(const field of root.querySelectorAll('select[name],input[name]')) {
  let card=field.closest('.q-item,.tfng-item,.match-block,.match-item,.tf-question,.dq-block,.question-row,.q-card');
  if(!card && field.tagName==='SELECT' && (field.hidden || (field.classList.contains('reading-match-select') && field.dataset.readingInlineBank!=='true')))card=field.closest('p');
  if(!card || card.closest('table') || card.querySelector('table'))continue;
  const names=new Set([...card.querySelectorAll('input[name],select[name]')].map(e=>e.name));
  if(names.size!==1)continue;
  card.classList.add('reading-question-card');
  const number=card.querySelector('[class$="question-number"]');if(number)number.classList.add('reading-card-number');
 }
}
export function syncReadingAnswers(root) {
 for(const select of root.querySelectorAll('select[hidden][name]')) {
  const group=select.nextElementSibling;if(!group?.classList.contains('reading-answer-buttons'))continue;
  for(const button of group.querySelectorAll('button')){button.disabled=select.disabled;button.setAttribute('aria-pressed',String(select.value===button.dataset.answerValue));}
 }
}
