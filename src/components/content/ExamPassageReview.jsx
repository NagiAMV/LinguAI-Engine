"use client";
import { normalizeAnswer } from "./answer-review.mjs";
import { evidenceRange } from "./review-evidence.mjs";
import { layoutMapQuestions, arrangeImportedMaps } from "./map-layout.mjs";
import { prepareReviewTables } from "./review-tables.mjs";
import TextHighlights from "./TextHighlights";
import AudioRecording from "./AudioRecording";
import ErrorTags from './ErrorTags';
import TranscriptFollow from './TranscriptFollow';
import { prepareTranscriptTimestamps } from './transcript-timestamps.mjs';
import { prepareTranscriptGroups } from './transcript-groups.mjs';
import {splitResultRows} from './answer-review.mjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAccount } from '@/components/account/AccountProvider';

const labels = { correct: '✓ Correct', incorrect: '× Incorrect', partial: '◐ Partially correct', blank: '— Unanswered', pending: '○ Not checked' };
function AnnotatedContent({ html, answers, rows, active, highlights, part, area, language, explanations, onEvidence }) {
  const root = useRef(null);
  const markup = useMemo(() => ({ __html: layoutMapQuestions(html) }), [html]);
  useEffect(() => {
    const element = root.current;
    arrangeImportedMaps(element);
    prepareReviewTables(element);
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
      let fieldStatus=row.status;
      if(field.type==='checkbox'||field.type==='radio')fieldStatus=field.checked?(row.choices?.find(choice=>normalizeAnswer(choice.response)===normalizeAnswer(field.value))?.status||row.status):null;
      else if(row.choices)fieldStatus=row.choices[row.names.indexOf(field.name)]?.status||row.status;
      if(fieldStatus)field.dataset.reviewStatus=fieldStatus;else delete field.dataset.reviewStatus;
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
      const userLine=document.createElement('span');userLine.className='review-answer-user';userLine.append((ru?'Твой ответ':uz?'Javobingiz':'Your answer')+': ');
      if(row.choices){row.choices.forEach((choice,index)=>{if(index)userLine.append(', ');const item=document.createElement('span');item.className='review-choice-response '+choice.status;item.textContent=(choice.response||(ru?'Нет ответа':uz?'Javob yo‘q':'No answer'))+(choice.status==='correct'?' ✓':choice.status==='incorrect'?' ×':'');userLine.append(item);});}
      else {userLine.classList.add(row.status);userLine.append(row.response||(ru?'Нет ответа':uz?'Javob yo‘q':'No answer'));}feedback.append(userLine);
      if(row.total)line('review-group-credit',(ru?'Баллы':uz?'Ball':'Marks')+': '+row.credit+' / '+row.total);

      line('review-answer-key', `${ru?'Правильный ответ':uz?'To‘g‘ri javob':'Correct answer'}: ${row.display || (ru?'Не проверено':uz?'Tekshirilmagan':'Not checked')}`);
      const detail=document.createElement('details');detail.dataset.explanation=row.name;detail.open=opened.has(row.name);detail.className='review-explanation';
      const summary=document.createElement('summary');summary.textContent=ru?'Объяснение':uz?'Izoh':'Explanation';detail.append(summary);
      const reason=document.createElement('p');
      const reasons=ru?{correct:'Ответ совпадает с одним из допустимых вариантов ключа.',partial:'Часть ответов верна; каждый засчитан отдельно.',incorrect:'Ответ не совпадает с допустимыми вариантами ключа.',blank:'Ответ не введён.',pending:'Проверенного ключа нет, поэтому оценка не выставлена.'}:uz?{correct:'Javobingiz kalitdagi qabul qilinadigan javobga mos.',partial:'Javoblarning bir qismi to‘g‘ri; ular alohida hisoblangan.',incorrect:'Javobingiz kalitdagi qabul qilinadigan javoblarga mos emas.',blank:'Javob kiritilmagan.',pending:'Tasdiqlangan javob kaliti yo‘q, shu sababli bu javob baholanmaydi.'}:{correct:'Your answer matches an accepted answer in the key.',partial:'Some answers are correct; each is credited separately.',incorrect:'Your answer does not match the accepted answers in the key.',blank:'No answer was entered.',pending:'No verified answer key is available, so this answer is not graded.'};
      reason.textContent=reasons[row.status];detail.append(reason);
      if(row.names.length>1 || row.numbers.includes('–')) {const group=document.createElement('p');group.textContent=ru?'Каждый правильный ответ даёт один балл. Порядок не важен.':uz?'Har bir to‘g‘ri javob uchun bir ball beriladi. Tartibi muhim emas.':'Each correct answer earns one mark. Order does not matter.';detail.append(group);}
      const explanation=explanations[row.numbers] || explanations[row.questionNumbers?.[0]];
      if(explanation?.part===part){
        const quotes=explanation.quotes?.length?explanation.quotes:explanation.quote?[explanation.quote]:[];
        summary.addEventListener('click',()=>{if(!detail.open)onEvidence(quotes,false);});
        if(explanation.location?.[language]){const location=document.createElement('p');location.className='review-evidence-location';location.textContent=(ru?'Где искать: ':uz?'Qayerdan izlash kerak: ':'Where to look: ')+explanation.location[language];detail.append(location);}
        if(explanation.translationProvenance?.[language]){const note=document.createElement('small');note.className='review-translation-note';note.textContent=ru?'Автоперевод с английского':uz?'Ingliz tilidan avtomatik tarjima':'Automatically translated from English';detail.append(note);}
        for(const paragraph of (explanation[language] || explanation.en || '').split(/\n\s*\n/)){const text=document.createElement('p');text.className='review-tutor-paragraph';text.textContent=paragraph;detail.append(text);}
        for(const citation of quotes){const quote=document.createElement('blockquote');quote.textContent=citation;detail.append(quote);}
        if(quotes.length){const show=document.createElement('button');show.type='button';show.className='review-show-evidence';show.textContent=ru?'Показать в тексте ↗':uz?'Matnda ko‘rsatish ↗':'Show in text ↗';show.onclick=()=>onEvidence(quotes);detail.append(show);}
      }
      if(row.overSelected){const warning=document.createElement('p');warning.textContent=ru?'Выбрано больше ответов, чем требуется: за группу начислено 0 баллов.':uz?'Talab qilinganidan ko‘p javob tanlangan: guruh uchun 0 ball.':'More answers selected than requested: this group earns 0 marks.';detail.append(warning);}
      feedback.append(detail);
      const diagram = host.closest('.worksheet-input')?.closest('.native-diagram-scroll');
      if (diagram) {
        let list = diagram.nextElementSibling;
        if (!list?.classList.contains('review-diagram-feedback')) { list=document.createElement('div');list.className='review-diagram-feedback';diagram.after(list); }
        const title=document.createElement('strong');title.className='review-diagram-question';title.textContent=(ru?'Вопрос ':uz?'Savol ':'Question ')+row.numbers;feedback.prepend(title);
        feedback.classList.toggle('review-active',row.name===active);list.append(feedback);
      } else {
        // Feedback must not expand an inline answer gap and push the sentence apart.
        const inlineLine = host.matches('span') && !host.querySelector('input[type=radio],input[type=checkbox]')
          ? host.closest('p,li,td,.native-text-row,.listening-note-line,.q-row,.note-line,.note-flow') : null;
        if (inlineLine) {
          inlineLine.classList.add('review-answer-line');
          if (new Set([...inlineLine.querySelectorAll('input[name],select[name]')].map(field=>field.name)).size > 1) {
            const title=document.createElement('strong');title.className='review-line-question';title.textContent=(ru?'Вопрос ':uz?'Savol ':'Question ')+row.numbers;feedback.prepend(title);
          }
          inlineLine.append(feedback);
        } else (host.tagName === 'TR' ? host.querySelector('td') || host : host).append(feedback);
      }
    }
  }, [html, answers, rows, active, language, explanations, part, onEvidence]);
  return <><TextHighlights root={root} highlights={highlights} part={part} area={area} revision={active} /><div ref={root} className="cd-content review-content" dangerouslySetInnerHTML={markup} /></>;
}

export default function ExamPassageReview({ test, answers, rows, initialRow, onBack, highlights = [], explanations = {}, errorTags = {}, onToggleErrorTag }) {
  const singleListening = test.resource === 'listening' && test.parts.length === 1;
  const languages = test.reviewLanguages || ['ru','en'];
  const { user, profile } = useAccount();
  const [language, setLanguage] = useState(languages.includes(profile.language) ? profile.language : languages[0]);
  useEffect(()=>{const saved=user ? profile.language : localStorage.getItem('linguai-review-language');if(languages.includes(saved))setLanguage(saved);},[user?.id, profile.language]);
  const [evidenceError, setEvidenceError] = useState('');
  const [partId, setPartId] = useState(initialRow?.part || test.parts[0].id);
  const [active, setActive] = useState(initialRow?.name || null);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [jump, setJump] = useState(initialRow?.name || null);
  const [audioTime,setAudioTime] = useState(null);
  const [seekRequest, setSeekRequest] = useState(null);
  useEffect(()=>{setAudioTime(null);setSeekRequest(null);},[partId]);
  const root = useRef(null);
  const part = test.parts.find(p => p.id === partId);
  useEffect(() => {
    if (test.resource !== 'listening' || !part.audioUrls?.length) return;
    const element = root.current?.querySelector('[data-review-passage] .review-content');
    if (!element) return;
    const groups=prepareTranscriptGroups(element,part);
    const timestamps=prepareTranscriptTimestamps(element, time => setSeekRequest({ time, partId: part.id }), language);
    return()=>{timestamps();groups();};
  }, [test.resource, part.id, part.passage, language]);
  const partRows = useMemo(() => rows.filter(row => row.part === partId), [rows, partId]);
  const visible = partRows.filter(row => !errorsOnly || ['incorrect','partial','blank'].includes(row.status));
  const activeErrors = splitResultRows(partRows.filter(row => row.name === active)).filter(row => ['incorrect','blank'].includes(row.status));
  function showEvidence(quote, scroll = true) {
    const passage=root.current.querySelector('[data-review-passage] .review-content');
    const citations=(Array.isArray(quote)?quote:[quote]).filter(Boolean);
    globalThis.CSS?.highlights?.delete('review-evidence');
    if(!citations.length){setEvidenceError('');return;}
    const ranges=citations.map(citation=>evidenceRange(passage,citation));
    const matched=ranges.filter(Boolean);
    if(!matched.length){setEvidenceError(language==='ru'?'Цитата не найдена в этой версии текста.':'The quote was not found in this version of the text.');return;}
    if(globalThis.CSS?.highlights&&globalThis.Highlight)CSS.highlights.set('review-evidence',new Highlight(...matched));
    else {const selection=window.getSelection();selection.removeAllRanges();selection.addRange(matched[0]);}
    if(scroll)matched[0].startContainer.parentElement.scrollIntoView({block:'center',behavior:'smooth'});
    setEvidenceError('');
  }
  useEffect(()=>{globalThis.CSS?.highlights?.delete('review-evidence');setEvidenceError('');return()=>globalThis.CSS?.highlights?.delete('review-evidence');},[partId]);
  function go(row) { setPartId(row.part); setActive(row.name); setJump(row.name); }
  useEffect(() => {
    if (!jump) return;
    let target = [...root.current.querySelectorAll('[data-review-row]')].find(node => node.dataset.reviewRow === jump);
    if(target?.matches('.worksheet-input'))target=[...root.current.querySelectorAll('.review-diagram-feedback [data-review-feedback]')].find(node=>node.dataset.reviewFeedback===jump)||target;
    if (target) { target.tabIndex = -1; target.scrollIntoView({ block: 'center', inline: 'nearest' }); target.focus({ preventScroll: true }); }
    const row=rows.find(item=>item.name===jump&&item.part===partId);
    const explanation=row&&(explanations[row.numbers] || explanations[row.questionNumbers?.[0]]);
    globalThis.CSS?.highlights?.delete('review-evidence');
    if(row){
      const detail=[...root.current.querySelectorAll('[data-explanation]')].find(node=>node.dataset.explanation===row.name);
      if(detail)detail.open=true;
    }
    if(explanation?.part===partId)showEvidence(explanation.quotes||explanation.quote,window.matchMedia('(min-width: 701px)').matches);
    setJump(null);
  }, [jump, partId]);
  return <section ref={root} className="exam-passage-review" aria-label="Review passages and questions">
    <div className="review-toolbar">
      <div className="review-toolbar-back"><button type="button" className="button cd-secondary" onClick={onBack}>← Results</button></div>
      <div className="review-toolbar-part">{test.parts.length>1 ? <label><span>{test.resource==='reading'?'Passage':'Part'}</span><select aria-label="Review part" value={partId} onChange={event=>{setPartId(Number(event.target.value));setActive(null);}}>{test.parts.map(p=><option key={p.id} value={p.id}>{test.resource==='reading'?'Passage':'Part'} {p.id}</option>)}</select></label> : <span className="review-toolbar-context">{test.resource==='reading'?'Reading review':'Listening review'}</span>}</div>
      <div className="review-toolbar-actions">
        <label className="review-errors-toggle"><input type="checkbox" checked={errorsOnly} onChange={event=>setErrorsOnly(event.target.checked)}/><span>Errors & unanswered</span></label>
        <label className="review-language-select"><span>Explanation language</span><select aria-label="Explanation language" value={language} onChange={event=>{setLanguage(event.target.value);localStorage.setItem('linguai-review-language',event.target.value);}}>{languages.map(code=><option key={code} value={code}>{code==='ru'?'Русский':code==='uz'?'O‘zbekcha':'English'}</option>)}</select></label>
        {!singleListening && <button type="button" className="review-collapse-all" onClick={()=>root.current.querySelectorAll('details[data-explanation]').forEach(node=>node.open=false)}>{language==='ru'?'Свернуть все':language==='uz'?'Hammasini yopish':'Collapse all'}</button>}
      </div>
    </div>
    {evidenceError&&<p role="status">{evidenceError}</p>}
    <nav className="review-question-links" aria-label="Review question navigation">{visible.map(row => <button key={row.name} className={row.status} aria-current={active === row.name ? 'true' : undefined} onClick={() => go(row)} aria-label={`Question ${row.numbers}: ${labels[row.status]}`}>{row.numbers} <span>{labels[row.status]}</span></button>)}{!visible.length && <p>No errors or unanswered questions with available keys in this part.</p>}</nav>
    {activeErrors.length > 0 && <details className="review-error-tags review-error-tags-panel"><summary>{language==='ru'?'Причина ошибки':language==='uz'?'Xato sababi':'Error tags'}</summary>{activeErrors.map(row=><ErrorTags key={row.numbers} expanded number={row.numbers} part={row.part} tags={errorTags} onToggle={onToggleErrorTag} language={language} />)}<small>{language==='ru'?'Метки сохраняются с этой попыткой на устройстве.':language==='uz'?'Belgilar ushbu urinish bilan qurilmada saqlanadi.':'Tags are saved with this attempt on this device.'}</small></details>}
    <div className="review-reading-panes" key={part.id}>
      <article data-review-passage className={test.resource === 'listening' ? 'listening-transcript' : undefined} aria-label={test.resource === 'reading' ? `Part ${partId} passage` : `Part ${partId} transcript`}><h3>{test.resource === 'reading' ? 'Passage' : 'Transcript'} · Part {partId}</h3>{test.resource === 'listening' && part.audioUrls?.length > 0 && <AudioRecording seekRequest={seekRequest?.partId === part.id ? seekRequest : null} precise={part.passage.includes('data-cue-start')} part={part} fullTest={test.audioScope === 'test'} position={part.transcriptStartSeconds || 0} onPosition={setAudioTime} sourceUrl={test.sourceUrl} />}{test.resource === 'listening' && <TranscriptFollow root={root} part={part} time={audioTime} language={language} />}<AnnotatedContent html={part.passage} highlights={highlights} part={partId} area="passage" answers={answers} rows={partRows} active={active} language={language} explanations={explanations} onEvidence={showEvidence} /></article>
      <article aria-label={`Part ${partId} reviewed questions`}><h3>Questions & answers</h3><AnnotatedContent html={part.questions} highlights={highlights} part={partId} area="questions" answers={answers} rows={partRows} active={active} language={language} explanations={explanations} onEvidence={showEvidence} /></article>
    </div>
  </section>;
}

