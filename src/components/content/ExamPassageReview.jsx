"use client";
import { evidenceRange } from "./review-evidence.mjs";
import TextHighlights from "./TextHighlights";
import AudioRecording from "./AudioRecording";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAccount } from '@/components/account/AccountProvider';

const labels = { correct: '✓ Correct', incorrect: '× Incorrect', blank: '— Unanswered', pending: '○ Not checked' };
function AnnotatedContent({ html, answers, rows, active, highlights, part, area, language, explanations, onEvidence }) {
  const root = useRef(null);
  const markup = useMemo(() => ({ __html: html }), [html]);
  useEffect(() => {
    const element = root.current;
    const opened = new Set([...element.querySelectorAll('details[open][data-explanation]')].map(node => node.dataset.explanation));
    element.querySelectorAll('[data-review-feedback]').forEach(node => node.remove());
    element.querySelectorAll('[data-review-row]').forEach(node=>{node.classList.remove('review-active');delete node.dataset.reviewRow;});
    const annotated = new Set();
    for (const field of element.querySelectorAll('input[name], select[name]')) {
      const value = answers[field.name];
      field.disabled = true;
      if (field.type === 'checkbox') field.checked = Array.isArray(value) && value.includes(field.value);
      else if (field.type === 'radio') field.checked = value === field.value;
      else field.value = typeof value === 'string' ? value : '';
      const row = rows.find(item => item.names.includes(field.name));
      if (!row) continue;
      field.dataset.reviewStatus = row.status;
      const host = field.closest('.ielts-reading-question-item,.ielts-listening-question-item') || field.parentElement;
      host.dataset.reviewRow = row.name;
      host.classList.toggle('review-active', row.name === active);
      if (annotated.has(row.name)) continue;
      annotated.add(row.name);
      const feedback = document.createElement('span');
      feedback.dataset.reviewFeedback = row.name;
      feedback.className = `review-inline-feedback ${row.status}`;
      const ru = language === 'ru', uz = language === 'uz';
      function line(className, text) { const node=document.createElement('span');node.className=className;node.textContent=text;feedback.append(node); }
      line('review-answer-user '+row.status, `${ru?'Твой ответ':uz?'Javobingiz':'Your answer'}: ${row.response || (ru?'Нет ответа':uz?'Javob yo‘q':'No answer')}`);
      line('review-answer-key', `${ru?'Правильный ответ':uz?'To‘g‘ri javob':'Correct answer'}: ${row.display || (ru?'Не проверено':uz?'Tekshirilmagan':'Not checked')}`);
      const detail=document.createElement('details');detail.dataset.explanation=row.name;detail.open=opened.has(row.name);detail.className='review-explanation';
      const summary=document.createElement('summary');summary.textContent=ru?'Объяснение':uz?'Izoh':'Explanation';detail.append(summary);
      const reason=document.createElement('p');
      const reasons=ru?{correct:'Ответ совпадает с одним из допустимых вариантов ключа.',incorrect:'Ответ не совпадает с допустимыми вариантами ключа.',blank:'Ответ не введён.',pending:'Проверенного ключа нет, поэтому оценка не выставлена.'}:uz?{correct:'Javobingiz kalitdagi qabul qilinadigan javobga mos.',incorrect:'Javobingiz kalitdagi qabul qilinadigan javoblarga mos emas.',blank:'Javob kiritilmagan.',pending:'Tasdiqlangan javob kaliti yo‘q, shu sababli bu javob baholanmaydi.'}:{correct:'Your answer matches an accepted answer in the key.',incorrect:'Your answer does not match the accepted answers in the key.',blank:'No answer was entered.',pending:'No verified answer key is available, so this answer is not graded.'};
      reason.textContent=reasons[row.status]+(row.status!=='pending'?(ru?' Регистр букв и лишние пробелы не учитываются.':uz?' Katta-kichik harflar va ortiqcha bo‘shliqlar hisobga olinmaydi.':' Letter case and extra whitespace are ignored.'):'');detail.append(reason);
      if(row.names.length>1 || row.numbers.includes('–')) {const group=document.createElement('p');group.textContent=ru?'Для этой группы нужен полный набор ответов. Порядок не важен.':uz?'Bu guruh uchun javoblarning to‘liq to‘plami kerak. Tartibi muhim emas.':'This group requires the complete answer set. Order does not matter.';detail.append(group);}
      const explanation=explanations[row.numbers];
      if(explanation?.part===part){
        const quotes=explanation.quotes?.length?explanation.quotes:explanation.quote?[explanation.quote]:[];
        summary.addEventListener('click',()=>{if(!detail.open)onEvidence(quotes,false);});
        if(explanation.location?.[language]){const location=document.createElement('p');location.className='review-evidence-location';location.textContent=(ru?'Где искать: ':uz?'Qayerdan izlash kerak: ':'Where to look: ')+explanation.location[language];detail.append(location);}
        if(explanation.translationProvenance?.[language]){const note=document.createElement('small');note.className='review-translation-note';note.textContent=ru?'Автоперевод с английского':uz?'Ingliz tilidan avtomatik tarjima':'Automatically translated from English';detail.append(note);}
        for(const paragraph of (explanation[language] || explanation.en || '').split(/\n\s*\n/)){const text=document.createElement('p');text.className='review-tutor-paragraph';text.textContent=paragraph;detail.append(text);}
        for(const citation of quotes){const quote=document.createElement('blockquote');quote.textContent=citation;detail.append(quote);}
        if(quotes.length){const show=document.createElement('button');show.type='button';show.className='review-show-evidence';show.textContent=ru?'Показать в тексте ↗':uz?'Matnda ko‘rsatish ↗':'Show in text ↗';show.onclick=()=>onEvidence(quotes);detail.append(show);}
      }
      feedback.append(detail);
      (host.tagName === 'TR' ? host.querySelector('td') || host : host).append(feedback);
    }
  }, [html, answers, rows, active, language, explanations, part, onEvidence]);
  return <><TextHighlights root={root} highlights={highlights} part={part} area={area} revision={active} /><div ref={root} className="cd-content review-content" dangerouslySetInnerHTML={markup} /></>;
}

export default function ExamPassageReview({ test, answers, rows, initialRow, onBack, highlights = [], explanations = {} }) {
  const languages = test.reviewLanguages || ['ru','en'];
  const { user, profile } = useAccount();
  const [language, setLanguage] = useState(languages.includes(profile.language) ? profile.language : languages[0]);
  useEffect(()=>{const saved=user ? profile.language : localStorage.getItem('linguai-review-language');if(languages.includes(saved))setLanguage(saved);},[user?.id, profile.language]);
  const [evidenceError, setEvidenceError] = useState('');
  const [partId, setPartId] = useState(initialRow?.part || test.parts[0].id);
  const [active, setActive] = useState(initialRow?.name || null);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [jump, setJump] = useState(initialRow?.name || null);
  const root = useRef(null);
  const part = test.parts.find(p => p.id === partId);
  const partRows = useMemo(() => rows.filter(row => row.part === partId), [rows, partId]);
  const visible = partRows.filter(row => !errorsOnly || ['incorrect','blank'].includes(row.status));
  function showEvidence(quote, scroll = true) {
    const passage=root.current.querySelector('[data-review-passage] .review-content');
    const citations=(Array.isArray(quote)?quote:[quote]).filter(Boolean);
    globalThis.CSS?.highlights?.delete('review-evidence');
    if(!citations.length){setEvidenceError('');return;}
    const ranges=citations.map(citation=>evidenceRange(passage,citation));
    if(ranges.some(range=>!range)){setEvidenceError(language==='ru'?'Цитата не найдена в этой версии текста.':'The quote was not found in this version of the text.');return;}
    if(globalThis.CSS?.highlights&&globalThis.Highlight)CSS.highlights.set('review-evidence',new Highlight(...ranges));
    else {const selection=window.getSelection();selection.removeAllRanges();selection.addRange(ranges[0]);}
    if(scroll)ranges[0].startContainer.parentElement.scrollIntoView({block:'center',behavior:'smooth'});
    setEvidenceError('');
  }
  useEffect(()=>{globalThis.CSS?.highlights?.delete('review-evidence');setEvidenceError('');return()=>globalThis.CSS?.highlights?.delete('review-evidence');},[partId]);
  function go(row) { setPartId(row.part); setActive(row.name); setJump(row.name); }
  useEffect(() => {
    if (!jump) return;
    const target = [...root.current.querySelectorAll('[data-review-row]')].find(node => node.dataset.reviewRow === jump);
    if (target) { target.tabIndex = -1; target.scrollIntoView({ block: 'center', inline: 'nearest' }); target.focus({ preventScroll: true }); }
    const row=rows.find(item=>item.name===jump&&item.part===partId);
    const explanation=row&&explanations[row.numbers];
    globalThis.CSS?.highlights?.delete('review-evidence');
    if(row){
      const detail=[...root.current.querySelectorAll('[data-explanation]')].find(node=>node.dataset.explanation===row.name);
      if(detail)detail.open=true;
    }
    if(explanation?.part===partId)showEvidence(explanation.quotes||explanation.quote,window.matchMedia('(min-width: 701px)').matches);
    setJump(null);
  }, [jump, partId]);
  return <section ref={root} className="exam-passage-review" aria-label="Review passages and questions">
    <div className="review-toolbar"><button className="button cd-secondary" onClick={onBack}>← Results</button><label>Part <select value={partId} onChange={event => { const id = Number(event.target.value); setPartId(id); setActive(null); }}>{test.parts.map(p => <option key={p.id} value={p.id}>Part {p.id}</option>)}</select></label><label className="review-errors-toggle"><input type="checkbox" checked={errorsOnly} onChange={event => setErrorsOnly(event.target.checked)} /> Errors & unanswered</label><label>Language <select aria-label="Explanation language" value={language} onChange={event=>{setLanguage(event.target.value);localStorage.setItem('linguai-review-language',event.target.value);}}>{languages.map(code=><option key={code} value={code}>{code === 'ru' ? 'Русский' : code === 'uz' ? 'O‘zbekcha' : 'English'}</option>)}</select></label><button className="review-collapse-all" onClick={()=>root.current.querySelectorAll('details[data-explanation]').forEach(node=>node.open=false)}>{language==='ru'?'Свернуть все':language==='uz'?'Hammasini yopish':'Collapse all'}</button><span>Read-only review</span></div>
    {evidenceError&&<p role="status">{evidenceError}</p>}
    <nav className="review-question-links" aria-label="Review question navigation">{visible.map(row => <button key={row.name} className={row.status} aria-current={active === row.name ? 'true' : undefined} onClick={() => go(row)} aria-label={`Question ${row.numbers}: ${labels[row.status]}`}>{row.numbers} <span>{labels[row.status]}</span></button>)}{!visible.length && <p>No errors or unanswered questions with available keys in this part.</p>}</nav>
    <div className="review-reading-panes" key={part.id}>
      <article data-review-passage aria-label={test.resource === 'reading' ? `Part ${partId} passage` : `Part ${partId} transcript`}><h3>{test.resource === 'reading' ? 'Passage' : 'Transcript'} · Part {partId}</h3>{test.resource === 'listening' && part.audioUrls?.length > 0 && <AudioRecording key={partId} part={part} fullTest={test.audioScope === 'test'} position={part.transcriptStartSeconds || 0} sourceUrl={test.sourceUrl} />}<AnnotatedContent html={part.passage} highlights={highlights} part={partId} area="passage" answers={answers} rows={partRows} active={active} language={language} explanations={explanations} onEvidence={showEvidence} /></article>
      <article aria-label={`Part ${partId} reviewed questions`}><h3>Questions & answers</h3><AnnotatedContent html={part.questions} highlights={highlights} part={partId} area="questions" answers={answers} rows={partRows} active={active} language={language} explanations={explanations} onEvidence={showEvidence} /></article>
    </div>
  </section>;
}
