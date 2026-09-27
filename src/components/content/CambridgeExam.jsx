"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import "./cambridge-exam.css";

// Build navigation from the existing sanitized markup, including grouped checkbox questions.
function questionIndex(test) {
  return test.parts.flatMap((part, partIndex) => {
    const doc = new DOMParser().parseFromString(part.passage + part.questions, "text/html");
    const entries = new Map();
    for (const name of part.fieldNames) {
      const field = [...doc.querySelectorAll("input[name],select[name]")].find((el) => el.name === name);
      const group = field?.closest('[class$="question-item"]');
      const numbers = [...(group?.querySelectorAll('[class$="question-number"]') || [])].map((el) => el.textContent.trim());
      if (!numbers.length) numbers.push((part.fieldLabels?.[name] || name).replace(/^Question\s*/, ""));
      numbers.forEach((number, slot) => {
        const id = `${partIndex}:${number}`;
        if (!entries.has(id)) entries.set(id, { id, number, name, slot, partIndex, multiple: field?.type === "checkbox" });
      });
    }
    return [...entries.values()].sort((a, b) => Number(a.number) - Number(b.number));
  });
}
function hasAnswer(question, answers) {
  const value = answers[question.name];
  return question.multiple ? Array.isArray(value) && value.length > question.slot : typeof value === "string" && Boolean(value.trim());
}
function timeLabel(ms) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
function SessionTimer({ startedAt, finishedAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (finishedAt) return;
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [finishedAt]);
  return <div className="exam-timer"><span>{finishedAt ? "Session time" : "Time elapsed"}</span><strong role="timer" aria-label="Session time elapsed">{timeLabel((finishedAt || now) - startedAt)}</strong></div>;
}

// Reuse the existing sanitized HTML controls and input handling without changing the dataset.
function AnswerFields({ html, answers, onAnswer, onFocusQuestion }) {
  const root = useRef(null);
  const markup = useMemo(() => ({ __html: html }), [html]);
  useEffect(() => {
    for (const input of root.current.querySelectorAll("input[name], select[name]")) {
      const value = answers[input.name];
      if (input.type === "checkbox") input.checked = Array.isArray(value) && value.includes(input.value);
      else if (input.type === "radio") input.checked = value === input.value;
      else if (input.value !== (typeof value === "string" ? value : "")) input.value = typeof value === "string" ? value : "";
    }
  }, [html, answers]);
  function change(event) {
    const input = event.target;
    if (!input.name) return;
    if (input.type === "checkbox") {
      const values = [...root.current.querySelectorAll('input[type="checkbox"]')]
        .filter((field) => field.name === input.name && field.checked).map((field) => field.value);
      onAnswer(input.name, values);
    } else onAnswer(input.name, input.value);
  }
  return <div ref={root} className="cd-content cd-questions" onInput={change} onFocus={(event) => onFocusQuestion(event.target.name)} dangerouslySetInnerHTML={markup} />;
}

function Recording({ part, position, onPosition, sourceUrl }) {
  const [status, setStatus] = useState("Loading recording…");
  return <>
    <p className="section-kicker">Recording · Part {part.id}</p><h2>Listen and answer</h2>
    <audio controls preload="metadata" aria-label={`Part ${part.id} recording`}
      onLoadedMetadata={(event) => { if (position > 0) event.currentTarget.currentTime = Math.min(position, event.currentTarget.duration || position); setStatus("Ready to play"); }}
      onPlay={() => setStatus("Playing")} onPause={() => setStatus("Paused")} onEnded={() => setStatus("Recording ended")}
      onWaiting={() => setStatus("Buffering…")} onPlaying={() => setStatus("Playing")}
      onError={() => setStatus("Could not load recording")}
      onTimeUpdate={(event) => onPosition(Math.floor(event.currentTarget.currentTime))}>
      {part.audioUrls.map((url) => <source key={url} src={url} type="audio/mpeg" />)}
    </audio>
    <p className="exam-audio-state" role="status">{status}</p>
    {status === "Could not load recording" && <a href={sourceUrl} target="_blank" rel="noreferrer">Open source recording ↗</a>}
    <p className="meta">Playback position is saved. Switching parts pauses this recording.</p>
    <details><summary>Show transcript</summary><div className="cd-content" dangerouslySetInnerHTML={{ __html: part.passage }} /></details>
  </>;
}

export default function CambridgeExam({ test }) {
  const storageKey = `linguai-cd-${test.id}`;
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [saveError, setSaveError] = useState("");
  const current = useRef(null);
  const workspace = useRef(null);
  const dialog = useRef(null);
  const [jump, setJump] = useState(null);
  const label = test.resource === "reading" ? "Reading" : "Listening";
  useEffect(() => {
    const index = questionIndex(test);
    setQuestions(index);
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(storageKey) || "{}") || {}; }
    catch { setSaveError("Browser storage is unavailable. Keep this page open to retain your answers."); }
    const partIndex = Number.isInteger(saved.partIndex) && saved.partIndex >= 0 && saved.partIndex < test.parts.length ? saved.partIndex : 0;
    const startedAt = Number.isFinite(saved.startedAt) && saved.startedAt > 0 ? saved.startedAt : Date.now();
    const restored = {
      answers: saved.answers && typeof saved.answers === "object" && !Array.isArray(saved.answers) ? saved.answers : {},
      partIndex, startedAt,
      finishedAt: Number.isFinite(saved.finishedAt) && saved.finishedAt >= startedAt ? saved.finishedAt : null,
      flags: Array.isArray(saved.flags) ? saved.flags : [],
      activeQuestion: index.some((q) => q.id === saved.activeQuestion && q.partIndex === partIndex) ? saved.activeQuestion : index.find((q) => q.partIndex === partIndex)?.id,
      audioTimes: saved.audioTimes && typeof saved.audioTimes === "object" ? saved.audioTimes : {},
    };
    current.current = restored;
    setSession(restored);
    try { localStorage.setItem(storageKey, JSON.stringify(restored)); } catch { setSaveError("Session could not be saved in this browser."); }
  }, [storageKey, test]);
  // Save synchronously with each interaction, so a refresh cannot race a delayed effect.
  function update(patch) {
    const next = { ...current.current, ...patch };
    current.current = next;
    setSession(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); }
    catch { setSaveError("Session could not be saved in this browser. Keep this page open."); }
  }
  useEffect(() => {
    if (!jump || !workspace.current) return;
    const target = [...workspace.current.querySelectorAll("input[name],select[name]")].find((el) => el.name === jump.name);
    const marker = document.getElementById(`ielts-${test.resource}-question-number-${jump.number}`);
    (marker || target)?.scrollIntoView({ block: "center", behavior: "instant" });
    target?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    target?.focus({ preventScroll: true });
    setJump(null);
  }, [jump, session?.partIndex, test.resource]);
  useEffect(() => {
    document.querySelector('.exam-question-nav [aria-current]')?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
  }, [session?.activeQuestion]);
  if (!session) return <main className="exam-loading" role="status">Preparing your exam workspace…</main>;
  const { answers, partIndex, activeQuestion, flags, finishedAt } = session;
  const part = test.parts[partIndex];
  const answered = questions.filter((q) => hasAnswer(q, answers)).length;
  const active = questions.find((q) => q.id === activeQuestion);
  function goTo(question) {
    if (!question) return;
    update({ partIndex: question.partIndex, activeQuestion: question.id });
    setJump(question);
  }
  function focusQuestion(name) {
    if (!name || active?.name === name) return;
    const question = questions.find((q) => q.partIndex === partIndex && q.name === name);
    if (question) update({ activeQuestion: question.id });
  }
  const fieldProps = { answers, onAnswer: (name, value) => update({ answers: { ...current.current.answers, [name]: value } }), onFocusQuestion: focusQuestion };
  return <main className={`cambridge-exam ${finishedAt ? "exam-finished" : ""}`}>
    <header className="exam-header">
      <div className="exam-identity"><p>{label} · Academic <span> / {finishedAt ? "Review" : `Part ${part.id} of ${test.parts.length}`}</span></p><h1>{test.title}</h1></div>
      <SessionTimer startedAt={session.startedAt} finishedAt={finishedAt} />
      {finishedAt ? <Link className="button cd-secondary" href="/">Back to dashboard</Link> : <button className="button" onClick={() => dialog.current.showModal()}>Finish Test</button>}
    </header>
    <div className="exam-status" role="status">{saveError || `${answered} of ${questions.length} answered · Saved on this device`}</div>
    {finishedAt ? <section className="exam-review"><p className="section-kicker">Session complete</p><h2>Your saved answers</h2><p>Review your responses below. No score has been calculated.</p>
      <button className="button cd-secondary" onClick={() => update({ startedAt: Date.now() - (session.finishedAt - session.startedAt), finishedAt: null })}>Resume test</button>
      <div className="cd-review-grid">{test.parts.map((item, index) => <section key={item.id}><h3>Part {item.id}</h3><ol>{item.fieldNames.map((name) => { const group = questions.filter((q) => q.partIndex === index && q.name === name); return <li key={name}><strong>Question {group.map((q) => q.number).join(" / ")}{group.some((q) => flags.includes(q.id)) ? " ⚑" : ""}: </strong>{Array.isArray(answers[name]) ? answers[name].join(", ") || "Not answered" : answers[name] || "Not answered"}</li>; })}</ol></section>)}</div>
    </section> : <>
      <nav className="exam-parts" aria-label="Test parts">{test.parts.map((item, index) => <button key={item.id} aria-current={index === partIndex ? "step" : undefined} onClick={() => goTo(questions.find((q) => q.partIndex === index))}>Part {item.id}</button>)}<span>{label === "Reading" ? "Read the passage and answer the questions" : "Listen to the recording and answer the questions"}</span></nav>
      <div ref={workspace} className={`cd-columns exam-workspace ${test.resource}`}>
        <article className="cd-pane" aria-label={test.resource === "reading" ? `Part ${part.id} passage` : `Part ${part.id} audio and transcript`} key={`content-${part.id}`}>
          {test.resource === "listening" ? <Recording part={part} sourceUrl={test.sourceUrl} position={session.audioTimes[part.id] || 0} onPosition={(value) => { if (current.current.audioTimes[part.id] !== value) update({ audioTimes: { ...current.current.audioTimes, [part.id]: value } }); }} /> : <><p className="section-kicker">Reading passage · Part {part.id}</p><AnswerFields html={part.passage} {...fieldProps} /></>}
        </article>
        <article className="cd-pane" aria-label={`Part ${part.id} questions`} key={`questions-${part.id}`}><AnswerFields html={part.questions} {...fieldProps} /></article>
      </div>
      <footer className="exam-bottom">
        <div className="exam-bottom-top"><span className="exam-legend"><span>○ Unanswered</span><span>● Answered</span><span>▣ Current</span><span>⚑ Flagged</span></span><button className="exam-flag" disabled={!active} aria-pressed={flags.includes(activeQuestion)} onClick={() => update({ flags: flags.includes(activeQuestion) ? flags.filter((id) => id !== activeQuestion) : [...flags, activeQuestion] })}>{flags.includes(activeQuestion) ? "Unflag" : "Flag"} question {active?.number}</button></div>
        <nav className="exam-question-nav" aria-label="Question navigation">{test.parts.map((item, index) => <div className="exam-question-group" key={item.id}><span>Part {item.id}</span><div>{questions.filter((q) => q.partIndex === index).map((q) => <button key={q.id} className={`${hasAnswer(q, answers) ? "answered" : ""} ${flags.includes(q.id) ? "flagged" : ""}`} aria-label={`Question ${q.number}, ${hasAnswer(q, answers) ? "answered" : "unanswered"}${flags.includes(q.id) ? ", flagged" : ""}`} aria-current={q.id === activeQuestion ? "true" : undefined} onClick={() => goTo(q)}>{q.number}{flags.includes(q.id) && <sup>⚑</sup>}</button>)}</div></div>)}</nav>
      </footer>
    </>}
    <dialog ref={dialog} className="exam-dialog" aria-labelledby="finish-title" aria-describedby="finish-description" onClick={(event) => { if (event.target === dialog.current) dialog.current.close(); }}>
      <h2 id="finish-title">Finish this test?</h2><p id="finish-description">{questions.length - answered ? `${questions.length - answered} questions are unanswered.` : "You have answered every question."} Your answers will be saved and opened for review. No score will be calculated.</p>
      <div><button className="button cd-secondary" autoFocus onClick={() => dialog.current.close()}>Keep working</button><button className="button" onClick={() => { update({ finishedAt: Date.now() }); dialog.current.close(); }}>Finish and review</button></div>
    </dialog>
  </main>;
}
