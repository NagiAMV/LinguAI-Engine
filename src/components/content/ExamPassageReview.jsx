"use client";
import { useEffect, useMemo, useRef, useState } from 'react';

const labels = { correct: '✓ Correct', incorrect: '× Incorrect', blank: '— Unanswered', pending: '○ Not checked' };
function AnnotatedContent({ html, answers, rows, active }) {
  const root = useRef(null);
  const markup = useMemo(() => ({ __html: html }), [html]);
  useEffect(() => {
    const element = root.current;
    element.querySelectorAll('[data-review-feedback]').forEach(node => node.remove());
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
      const host = field.closest('[class$="question-item"]') || field.parentElement;
      host.dataset.reviewRow = row.name;
      host.classList.toggle('review-active', row.name === active);
      if (annotated.has(row.name)) continue;
      annotated.add(row.name);
      const feedback = document.createElement('span');
      feedback.dataset.reviewFeedback = row.name;
      feedback.className = `review-inline-feedback ${row.status}`;
      feedback.textContent = `${labels[row.status]} · Q${row.numbers} · Your answer: ${row.response || 'No answer'}${row.display ? ` · Correct answer: ${row.display}` : ' · Answer key unavailable'}`;
      (host.tagName === 'TR' ? host.querySelector('td') || host : host).append(feedback);
    }
  }, [html, answers, rows, active]);
  return <div ref={root} className="cd-content review-content" dangerouslySetInnerHTML={markup} />;
}

export default function ExamPassageReview({ test, answers, rows, initialRow, onBack }) {
  const [partId, setPartId] = useState(initialRow?.part || test.parts[0].id);
  const [active, setActive] = useState(initialRow?.name || null);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [jump, setJump] = useState(initialRow?.name || null);
  const root = useRef(null);
  const part = test.parts.find(p => p.id === partId);
  const partRows = useMemo(() => rows.filter(row => row.part === partId), [rows, partId]);
  const visible = partRows.filter(row => !errorsOnly || ['incorrect','blank'].includes(row.status));
  function go(row) { setPartId(row.part); setActive(row.name); setJump(row.name); }
  useEffect(() => {
    if (!jump) return;
    const target = [...root.current.querySelectorAll('[data-review-row]')].find(node => node.dataset.reviewRow === jump);
    if (target) { target.tabIndex = -1; target.scrollIntoView({ block: 'center', inline: 'nearest' }); target.focus({ preventScroll: true }); }
    setJump(null);
  }, [jump, partId]);
  return <section ref={root} className="exam-passage-review" aria-label="Review passages and questions">
    <div className="review-toolbar"><button className="button cd-secondary" onClick={onBack}>← Results</button><label>Part <select value={partId} onChange={event => { const id = Number(event.target.value); setPartId(id); setActive(null); }}>{test.parts.map(p => <option key={p.id} value={p.id}>Part {p.id}</option>)}</select></label><label className="review-errors-toggle"><input type="checkbox" checked={errorsOnly} onChange={event => setErrorsOnly(event.target.checked)} /> Errors & unanswered</label><span>Read-only review</span></div>
    <nav className="review-question-links" aria-label="Review question navigation">{visible.map(row => <button key={row.name} className={row.status} aria-current={active === row.name ? 'true' : undefined} onClick={() => go(row)} aria-label={`Question ${row.numbers}: ${labels[row.status]}`}>{row.numbers} <span>{labels[row.status]}</span></button>)}{!visible.length && <p>No errors or unanswered questions with available keys in this part.</p>}</nav>
    <div className="review-reading-panes" key={part.id}>
      <article aria-label={test.resource === 'reading' ? `Part ${partId} passage` : `Part ${partId} transcript`}><h3>{test.resource === 'reading' ? 'Passage' : 'Transcript'} · Part {partId}</h3>{test.resource === 'listening' && part.audioUrls?.length > 0 && <audio controls preload="metadata" aria-label={`Review recording part ${partId}`}>{part.audioUrls.map(url => <source key={url} src={url} type="audio/mpeg" />)}</audio>}<AnnotatedContent html={part.passage} answers={answers} rows={partRows} active={active} /></article>
      <article aria-label={`Part ${partId} reviewed questions`}><h3>Questions & answers</h3><AnnotatedContent html={part.questions} answers={answers} rows={partRows} active={active} /></article>
    </div>
  </section>;
}
