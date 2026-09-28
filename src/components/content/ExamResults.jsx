"use client";

import { useMemo, useState } from "react";

export default function ExamResults({ test, questions, answers, flags, session, answered }) {
  const [partFilter, setPartFilter] = useState('all');
  const [filter, setFilter] = useState('all');
  const rows = useMemo(() => test.parts.flatMap((part, partIndex) => part.fieldNames.map((name) => {
    const group = questions.filter((question) => question.partIndex === partIndex && question.name === name);
    const response = Array.isArray(answers[name]) ? answers[name].join(', ') : answers[name] || '';
    return { name, part: part.id, numbers: group.map((question) => question.number).join('–'), response, flagged: group.some((question) => flags.includes(question.id)) };
  })), [test, questions, answers, flags]);
  const visible = rows.filter((row) => (partFilter === 'all' || String(row.part) === partFilter) && (filter === 'all' || (filter === 'unanswered' ? !row.response.trim() : row.response.trim())));
  const duration = session.startedAt && session.finishedAt ? Math.min(3600, Math.max(0, Math.floor((session.finishedAt - session.startedAt) / 1000))) : null;
  return <section className="exam-results" aria-labelledby="results-heading">
    <div className="results-sheet">
      <header className="results-heading"><span className="results-seal" aria-hidden="true">✓</span><p className="section-kicker">Attempt submitted</p><h2 id="results-heading">Your answers, at a glance.</h2><p>{test.title} · {test.resource === 'reading' ? 'Reading' : 'Listening'}</p></header>
      <div className="results-stats"><div><strong>{answered}<small> / {questions.length}</small></strong><span>Answered</span></div><div><strong>{questions.length - answered}</strong><span>Unanswered</span></div><div><strong>{duration === null ? '—' : `${String(Math.floor(duration / 60)).padStart(2, '0')}:${String(duration % 60).padStart(2, '0')}`}</strong><span>Time used</span></div></div>
      <p className="results-key-note">Your answers are saved. The answer key has not been connected yet, so correctness and scores are not shown.</p>
      <div className="results-filters"><nav aria-label="Results parts"><button aria-pressed={partFilter === 'all'} onClick={() => setPartFilter('all')}>All parts</button>{test.parts.map((part) => <button key={part.id} aria-pressed={partFilter === String(part.id)} onClick={() => setPartFilter(String(part.id))}>Part {part.id}</button>)}</nav><label>Show <select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All answers</option><option value="answered">Answered</option><option value="unanswered">Unanswered</option></select></label></div>
      <div className="results-table-scroll"><table className="results-table"><thead><tr><th scope="col">Question</th><th scope="col">Your answer</th><th scope="col">Correct answer</th><th scope="col">Status</th></tr></thead><tbody>{visible.map((row) => <tr key={row.name} className={!row.response ? 'result-unanswered' : ''}><th scope="row"><span className="result-number">{row.numbers}</span>{row.flagged && <span title="Flagged" aria-label="Flagged"> ⚑</span>}<small>Part {row.part}</small></th><td>{row.response || <span className="result-empty">No answer</span>}</td><td><span className="result-empty">Not available</span></td><td><span className={`result-status ${row.response ? 'pending' : 'blank'}`}>{row.response ? '○ Not checked' : '— Unanswered'}</span></td></tr>)}</tbody></table>{visible.length === 0 && <p className="results-empty">No answers match this filter.</p>}</div>
      {test.resource === 'listening' && <div className="results-transcripts">{test.parts.map((part) => <details key={part.id}><summary>Transcript · Part {part.id}</summary><div className="cd-content" dangerouslySetInnerHTML={{ __html: part.passage }} /></details>)}</div>}
    </div>
  </section>;
}
