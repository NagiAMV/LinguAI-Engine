"use client";

import { useMemo, useState } from "react";
import { buildReviewRows } from './answer-review.mjs';

const statusLabels = { correct: '✓ Correct', incorrect: '× Incorrect', blank: '— Unanswered', pending: '○ Not checked' };

export default function ExamResults({ test, answerKey, questions, answers, flags, session, answered }) {
  const [partFilter, setPartFilter] = useState('all');
  const [filter, setFilter] = useState('all');
  const rows = useMemo(() => buildReviewRows(test, questions, answers, flags, answerKey), [test, questions, answers, flags, answerKey]);
  const visible = rows.filter(row => (partFilter === 'all' || String(row.part) === partFilter) && (filter === 'all' || (filter === 'unanswered' ? !row.response.trim() : filter === 'answered' ? Boolean(row.response.trim()) : row.status === filter)));
  const availableCount = questions.filter(question => answerKey?.answers?.[question.number]?.length).length;
  const duration = session.startedAt && session.finishedAt ? Math.min(3600, Math.max(0, Math.floor((session.finishedAt - session.startedAt) / 1000))) : null;
  return <section className="exam-results" aria-labelledby="results-heading">
    <div className="results-sheet">
      <header className="results-heading"><span className="results-seal" aria-hidden="true">✓</span><p className="section-kicker">Attempt submitted</p><h2 id="results-heading">Your answers, at a glance.</h2><p>{test.title} · {test.resource === 'reading' ? 'Reading' : 'Listening'}</p></header>
      <div className="results-stats"><div><strong>{answered}<small> / {questions.length}</small></strong><span>Answered</span></div><div><strong>{questions.length - answered}</strong><span>Unanswered</span></div><div><strong>{duration === null ? '—' : `${String(Math.floor(duration / 60)).padStart(2, '0')}:${String(duration % 60).padStart(2, '0')}`}</strong><span>Time used</span></div></div>
      <p className="results-key-note">{availableCount === questions.length ? 'Compare your saved answers with the answer key below.' : availableCount ? `Answer keys available for ${availableCount} of ${questions.length} questions. Remaining answers are saved but not checked.` : 'Your answers are saved. The answer key for this test is not available yet, so answers are not marked correct or incorrect.'} No IELTS band score is calculated.</p>
      <div className="results-filters"><nav aria-label="Results parts"><button aria-pressed={partFilter === 'all'} onClick={() => setPartFilter('all')}>All parts</button>{test.parts.map(part => <button key={part.id} aria-pressed={partFilter === String(part.id)} onClick={() => setPartFilter(String(part.id))}>Part {part.id}</button>)}</nav><label>Show <select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All answers</option><option value="answered">Answered</option><option value="unanswered">Unanswered</option><option value="correct">Correct</option><option value="incorrect">Incorrect</option><option value="pending">Not checked</option></select></label></div>
      <div className="results-table-scroll" tabIndex={0} aria-label="Answer comparison"><table className="results-table"><thead><tr><th scope="col">Question</th><th scope="col">Your answer</th><th scope="col">Correct answer</th><th scope="col">Status</th></tr></thead><tbody>{visible.map(row => <tr key={row.name} className={`result-${row.status}`}><th scope="row"><span className="result-number">{row.numbers}</span>{row.flagged && <span title="Flagged" aria-label="Flagged"> ⚑</span>}<small>Part {row.part}</small></th><td className="result-response">{row.response || <span className="result-empty">No answer</span>}</td><td>{row.display ? <span className="result-key">{row.display}</span> : <span className="result-empty">Not available</span>}</td><td><span className={`result-status ${row.status}`}>{statusLabels[row.status]}</span></td></tr>)}</tbody></table>{visible.length === 0 && <p className="results-empty">No answers match this filter.</p>}</div>
      {answerKey?.sources?.length > 0 && <details className="results-sources"><summary>Answer key sources</summary>{answerKey.sources.map(source => source.url ? <a key={`${source.part}-${source.url}`} href={source.url} target="_blank" rel="noreferrer">Part {source.part} · Engnovate ↗</a> : <p key={`${source.part}-${source.reference}`}>Part {source.part} · {source.label}</p>)}</details>}
      {test.resource === 'listening' && <div className="results-transcripts">{test.parts.map(part => <details key={part.id}><summary>Transcript · Part {part.id}</summary><div className="cd-content" dangerouslySetInnerHTML={{ __html: part.passage }} /></details>)}</div>}
    </div>
  </section>;
}
