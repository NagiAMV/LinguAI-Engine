export function prepareQuestionNavigation(root, questions, groups = []) {
 if (!root) return;
 for (const heading of root.querySelectorAll('h2,h3,h4,p,.q-title,.q-heading')) {
  if (!heading.querySelector('input,select') && /^Questions?\s+\d+(?:\s*[–—-]\s*\d+)?\s*$/i.test(heading.textContent.trim())) heading.classList.add('exam-question-heading');
 }
 const sets = groups.map(group => group.questions.map(String));
 for (const name of new Set(questions.map(q => q.name))) {
  const numbers = questions.filter(q => q.name === name).map(q => String(q.number));
  if (numbers.length > 1 && !sets.some(set => numbers.every(n => set.includes(n)))) sets.push(numbers);
 }
 for (const numbers of sets) {
  const members = questions.filter(q => numbers.includes(String(q.number)));
  const field = [...root.querySelectorAll('input[name],select[name]')].find(f => members.some(q => q.name === f.name));
  const key = numbers.join('-');
  if (!field || [...root.querySelectorAll('[data-question-group]')].some(h => h.dataset.questionGroup === key)) continue;
  const heading = document.createElement('div');
  heading.className = 'exam-answer-group-heading';
  heading.setAttribute('role','heading');
  heading.setAttribute('aria-level','3');
  heading.dataset.questionGroup = key;
  heading.dataset.readingUi = ''; // UI must not shift saved highlight offsets.
  heading.textContent = `Questions ${numbers.join('–')} · ${field.type === 'checkbox' ? 'Choose' : 'Answers:'} ${numbers.length}`;
  const host = field.closest('.q-card,.checkbox-group,fieldset,.native-choose-group');
  if (host) host.prepend(heading);
  else (field.closest('label') || field).before(heading);
 }
}

export function syncActiveQuestion(root, number, name) {
 if (!root) return;
 for (const marker of root.querySelectorAll('[class*="-question-number"],[id*="-question-number-"]')) {
  marker.classList.toggle('exam-current-number', marker.textContent.trim() === String(number) || marker.id.endsWith(`-question-number-${number}`));
 }
 for (const field of root.querySelectorAll('input[name],select[name],button[name]')) {
  if (field.name === name) field.dataset.currentAnswer = 'true';
  else delete field.dataset.currentAnswer;
 }
 for (const heading of root.querySelectorAll('[data-question-group]')) heading.classList.toggle('exam-current-group', heading.dataset.questionGroup.split('-').includes(String(number)));
}

export function focusAnswerField(root, question) {
 const fields = [...root.querySelectorAll('input[name],select[name]')].filter(f => f.name === question.name && !f.disabled);
 let target = fields.find(f => f.checked) || fields[0];
 if (target?.hidden) target = target.nextElementSibling?.querySelector('button[aria-pressed="true"]') || target.nextElementSibling?.querySelector('button');
 if (!target) return false;
 target.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
 target.focus({preventScroll:true});
 return true;
}

export function adjacentQuestion(questions, name, partIndex, direction) {
 const groups = questions.filter((q,index) => questions.findIndex(other => other.name === q.name && other.partIndex === q.partIndex) === index);
 const index = groups.findIndex(q => q.name === name && q.partIndex === partIndex);
 return index < 0 ? null : groups[index + direction] || null;
}
