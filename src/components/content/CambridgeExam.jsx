"use client";

import { useRouter } from "next/navigation";
import { restoreSession, transition, remaining, countdown } from "./exam-session.mjs";
import { useEffect, useMemo, useRef, useState } from "react";
import "./cambridge-exam.css";
import ExamResults from "./ExamResults";

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
// Reuse the existing sanitized HTML controls and input handling without changing the dataset.
function AnswerFields({ html, answers, onAnswer, onFocusQuestion, locked }) {
  const root = useRef(null);
  const markup = useMemo(() => ({ __html: html }), [html]);
  useEffect(() => {
    for (const input of root.current.querySelectorAll("input[name], select[name]")) {
      input.disabled = locked;
      const value = answers[input.name];
      if (input.type === "checkbox") input.checked = Array.isArray(value) && value.includes(input.value);
      else if (input.type === "radio") input.checked = value === input.value;
      else if (input.value !== (typeof value === "string" ? value : "")) input.value = typeof value === "string" ? value : "";
    }
  }, [html, answers, locked]);
  function change(event) {
    const input = event.target;
    if (locked || !input.name) return;
    if (input.type === "checkbox") {
      const values = [...root.current.querySelectorAll('input[type="checkbox"]')]
        .filter((field) => field.name === input.name && field.checked).map((field) => field.value);
      onAnswer(input.name, values);
    } else onAnswer(input.name, input.value);
  }
  return <div ref={root} className="cd-content cd-questions" onInput={change} onFocus={(event) => onFocusQuestion(event.target.name)} dangerouslySetInnerHTML={markup} />;
}

function Recording({ part, position, onPosition, sourceUrl, locked }) {
  const audio = useRef(null);
  useEffect(() => { if (locked) audio.current?.pause(); }, [locked]);
  const [status, setStatus] = useState("Loading recording…");
  return <>
    <span className="recording-label">Part {part.id} recording</span>
    <audio ref={audio} controls={!locked} preload="metadata" aria-label={`Part ${part.id} recording`}
      onLoadedMetadata={(event) => { if (position > 0) event.currentTarget.currentTime = Math.min(position, event.currentTarget.duration || position); setStatus("Ready to play"); }}
      onPlay={(event) => { if (locked) event.currentTarget.pause(); else setStatus("Playing"); }} onPause={() => setStatus("Paused")} onEnded={() => setStatus("Recording ended")}
      onWaiting={() => setStatus("Buffering…")} onPlaying={() => setStatus("Playing")}
      onError={() => setStatus("Could not load recording")}
      onTimeUpdate={(event) => onPosition(Math.floor(event.currentTarget.currentTime))}>
      {part.audioUrls.map((url) => <source key={url} src={url} type="audio/mpeg" />)}
    </audio>
    <p className="exam-audio-state" role="status">{status}</p>
    {status === "Could not load recording" && <a href={sourceUrl} target="_blank" rel="noreferrer">Open source recording ↗</a>}


  </>;
}

export default function CambridgeExam({ test }) {
  const router = useRouter();
  const backUrl = `/?view=${test.resource}&book=${test.book}`;
  const [now, setNow] = useState(Date.now());
  const [modal, setModal] = useState(null);
  const [history, setHistory] = useState([]);
  const [fontSize, setFontSize] = useState(16);
  const [split, setSplit] = useState(50);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenMessage, setFullscreenMessage] = useState("");
  const shell = useRef(null);
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
    const restored = restoreSession({
      ...saved,
      answers: saved.answers && typeof saved.answers === "object" && !Array.isArray(saved.answers) ? saved.answers : {},
      partIndex, startedAt,
      finishedAt: Number.isFinite(saved.finishedAt) && saved.finishedAt >= startedAt ? saved.finishedAt : null,
      flags: Array.isArray(saved.flags) ? saved.flags : [],
      activeQuestion: index.some((q) => q.id === saved.activeQuestion && q.partIndex === partIndex) ? saved.activeQuestion : index.find((q) => q.partIndex === partIndex)?.id,
      audioTimes: saved.audioTimes && typeof saved.audioTimes === "object" ? saved.audioTimes : {},
    });
    try { setHistory(JSON.parse(localStorage.getItem(`${storageKey}-history`) || "[]")); } catch { /* Current attempt remains available. */ }
    current.current = restored;
    setSession(restored);
    try { localStorage.setItem(storageKey, JSON.stringify(restored)); } catch { setSaveError("Session could not be saved in this browser."); }
  }, [storageKey, test]);
  // Save synchronously with each interaction, so a refresh cannot race a delayed effect.
  function persist(next) {
    current.current = next;
    setSession(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); }
    catch { setSaveError("Session could not be saved in this browser. Keep this page open."); }
  }
  function dispatch(action) { persist(transition(current.current, action)); }
  function update(patch) { dispatch({ type: "edit", patch }); }
  useEffect(() => {
    function tick() {
      const timestamp = Date.now();
      setNow(timestamp);
      if (current.current?.phase === "running" && timestamp >= current.current.deadline) persist(restoreSession(current.current, timestamp));
    }
    const interval = setInterval(tick, 250);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(interval); window.removeEventListener("focus", tick); document.removeEventListener("visibilitychange", tick); };
  }, [storageKey]);
  useEffect(() => {
    if (session?.phase === "expired") setModal("expired");
  }, [session?.phase]);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const cancel = (event) => {
      if (current.current?.phase === "expired") event.preventDefault();
      else setModal(null);
    };
    const closed = () => {
      if (current.current?.phase === "expired" && !element.open) element.showModal();
    };
    element.addEventListener("cancel", cancel);
    element.addEventListener("close", closed);
    return () => { element.removeEventListener("cancel", cancel); element.removeEventListener("close", closed); };
  }, [Boolean(session)]);
  useEffect(() => {
    if (modal && !dialog.current?.open) dialog.current?.showModal();
    if (!modal) dialog.current?.close();
  }, [modal]);
  useEffect(() => {
    const changed = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (shell.current?.requestFullscreen) await shell.current.requestFullscreen();
      else setFullscreenMessage("Fullscreen is unavailable in this browser. The exam still fills this page.");
    } catch { setFullscreenMessage("This browser could not enter fullscreen. You can continue on this page."); }
  }
  function newAttempt() {
    const archive = [...history, { ...current.current, archivedAt: Date.now() }];
    try { localStorage.setItem(storageKey + "-history", JSON.stringify(archive)); }
    catch { setSaveError("Could not archive this attempt. Your current answers have been kept."); setModal(null); return; }
    setHistory(archive);
    persist(restoreSession({}));
    setModal(null);
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
  const { answers, partIndex, activeQuestion, flags } = session;
  const finishedAt = session.phase === "submitted";
  const locked = session.phase !== "running" || now >= session.deadline;
  const part = test.parts[partIndex];
  const answered = questions.filter((q) => hasAnswer(q, answers)).length;
  const active = questions.find((q) => q.id === activeQuestion);
  function goTo(question) {
    if (locked || !question) return;
    update({ partIndex: question.partIndex, activeQuestion: question.id });
    setJump(question);
  }
  function focusQuestion(name) {
    if (locked || !name || active?.name === name) return;
    const question = questions.find((q) => q.partIndex === partIndex && q.name === name);
    if (question) update({ activeQuestion: question.id });
  }
  const fieldProps = { answers, locked, onAnswer: (name, value) => update({ answers: { ...current.current.answers, [name]: value } }), onFocusQuestion: focusQuestion };
  return <main ref={shell} style={{ "--exam-font-size": `${fontSize}px`, "--exam-split": `${split}%` }} className={`cambridge-exam ${finishedAt ? "exam-finished" : ""}`}>
    <header className="exam-header">
      <button className="exam-utility exam-back" title="Back to collection" aria-label="Back to collection" onClick={() => session.phase === "running" ? setModal("exit") : router.push(backUrl)}>←</button>
      <div className="exam-identity"><h1>{test.title}</h1><p>{label} · {finishedAt ? "Results" : `Part ${part.id}`}</p></div><span className="exam-saved" title={`${answered} of ${questions.length} answered · Saved on this device`} aria-label={`${answered} of ${questions.length} answered · Saved on this device`}>●</span>
      <details className="exam-settings"><summary aria-label="Display settings" title="Display settings">Aa</summary><label>Text size<select aria-label="Text size" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))}><option value={16}>Normal</option><option value={18}>Large</option><option value={20}>Extra large</option></select></label></details><button className="exam-utility exam-fullscreen" title={fullscreen ? "Exit fullscreen" : "Enter fullscreen"} aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"} onClick={toggleFullscreen}>⛶</button>
      <div className={`exam-timer ${remaining(session, now) <= 300000 ? "exam-time-low" : ""}`}><strong role="timer" aria-label="Time remaining">{countdown(remaining(session, now))}</strong></div>
      {finishedAt ? <button className="button cd-secondary" onClick={() => setModal("new")}>New attempt</button> : null}
    </header>
    {(fullscreenMessage || saveError) && <div className="exam-status" role="status">{fullscreenMessage || saveError}<button aria-label="Dismiss message" onClick={() => setFullscreenMessage("")}>×</button></div>}
    {session.phase === "ready" ? <section className="exam-start"><p className="section-kicker">Ready when you are</p><h2>{test.title}</h2><p>{label} · {test.parts.length} parts · 60 minutes</p><p>The timer begins when you press Start. It continues if you leave or refresh. At 00:00, editing stops and you can submit your saved answers.</p>{Object.keys(answers).length > 0 && <p>Your previous answers are preserved. Continue with them, or archive them and start a new attempt.</p>}<div><button className="button" onClick={() => { dispatch({ type: "start" }); if (!document.fullscreenElement) toggleFullscreen(); }}>{Object.keys(answers).length ? "Start with saved answers" : "Start Test"}</button>{Object.keys(answers).length > 0 && <button className="button cd-secondary" onClick={() => setModal("new")}>New attempt</button>}</div></section> : finishedAt ? <ExamResults test={test} questions={questions} answers={answers} flags={flags} session={session} answered={answered} /> : <>
      <div ref={workspace} className={`cd-columns exam-workspace ${test.resource}`}>
        <article className={`cd-pane ${test.resource === "listening" ? "exam-recording-bar" : ""}`} aria-label={test.resource === "reading" ? `Part ${part.id} passage` : `Part ${part.id} audio and transcript`} key={`content-${part.id}`}>
          {test.resource === "listening" ? <Recording locked={locked} part={part} sourceUrl={test.sourceUrl} position={session.audioTimes[part.id] || 0} onPosition={(value) => { if (current.current.audioTimes[part.id] !== value) update({ audioTimes: { ...current.current.audioTimes, [part.id]: value } }); }} /> : <><AnswerFields html={part.passage} {...fieldProps} /></>}
        </article>
        <div className={`exam-divider ${test.resource === "listening" ? "exam-divider-hidden" : ""}`} role="separator" aria-label="Resize passage and questions" aria-orientation="vertical" aria-valuemin={30} aria-valuemax={70} aria-valuenow={split} tabIndex={locked ? -1 : 0} onKeyDown={(event) => { if (["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); setSplit((value) => Math.max(30, Math.min(70, value + (event.key === "ArrowLeft" ? -2 : 2)))); } }} onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) { const bounds = workspace.current.getBoundingClientRect(); setSplit(Math.max(30, Math.min(70, (event.clientX - bounds.left) / bounds.width * 100))); } }} onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)} />
        <article className="cd-pane" aria-label={`Part ${part.id} questions`} key={`questions-${part.id}`}><AnswerFields html={part.questions} {...fieldProps} /></article>
      </div>
      <footer className="exam-bottom">
        <label className="exam-part-picker"><span className="sr-only">Test part</span><select aria-label="Test part" value={partIndex} disabled={locked} onChange={(event) => goTo(questions.find((q) => q.partIndex === Number(event.target.value)))}>{test.parts.map((item,index) => <option key={item.id} value={index}>Part {item.id}</option>)}</select></label>
        <nav className="exam-question-nav" aria-label="Question navigation">{questions.filter((q) => q.partIndex === partIndex).map((q) => <button key={q.id} disabled={locked} className={[(hasAnswer(q, answers) ? "answered" : ""), (flags.includes(q.id) ? "flagged" : "")].join(" ")} aria-label={"Question " + q.number + ", " + (hasAnswer(q, answers) ? "answered" : "unanswered") + (flags.includes(q.id) ? ", flagged" : "")} aria-current={q.id === activeQuestion ? "true" : undefined} onClick={() => goTo(q)}>{q.number}{flags.includes(q.id) && <sup>⚑</sup>}</button>)}</nav>
        <button className="exam-flag" title={"Flag question " + active?.number} aria-label={"Flag question " + active?.number} disabled={locked || !active} aria-pressed={flags.includes(activeQuestion)} onClick={() => update({ flags: flags.includes(activeQuestion) ? flags.filter((id) => id !== activeQuestion) : [...flags, activeQuestion] })}>⚑</button>
        <button className="button exam-submit" onClick={() => setModal(session.phase === "expired" ? "expired" : "finish")}>Submit</button>
      </footer>
    </>}
    {history.length > 0 && (session.phase === "ready" || finishedAt) && <details className="exam-history"><summary>Previous attempts ({history.length})</summary>{history.map((attempt, index) => <details key={index}><summary>Attempt {index + 1} · {new Date(attempt.archivedAt).toLocaleString()}</summary>{test.parts.map((item) => <section key={item.id}><h3>Part {item.id}</h3>{item.fieldNames.map((name) => <p key={name}><strong>{item.fieldLabels?.[name]}: </strong>{Array.isArray(attempt.answers?.[name]) ? attempt.answers[name].join(", ") : attempt.answers?.[name] || "Not answered"}</p>)}</section>)}</details>)}</details>}
    <dialog ref={dialog} className="exam-dialog" aria-labelledby="finish-title" onCancel={(event) => { if (modal === "expired") event.preventDefault(); else setModal(null); }}>
      <h2 id="finish-title">{modal === "expired" ? "Time is up" : modal === "exit" ? "Leave this test?" : modal === "new" ? "Start a new attempt?" : "Submit your answers?"}</h2>
      <p>{modal === "exit" ? "Your answers are saved. The 60-minute timer will keep running while you are away." : modal === "new" ? "This attempt will be archived with its answers. A new attempt will start at 60:00 when you press Start." : modal === "expired" ? "Your answers are saved. Editing and audio playback are locked. Submit to review your answers." : (questions.length - answered) + " questions are unanswered. Submission is final; this attempt will become read-only. No score will be calculated."}</p>
      <div>{modal !== "expired" && <button className="button cd-secondary" autoFocus onClick={() => setModal(null)}>Cancel</button>}<button className="button" onClick={() => { if (modal === "exit") router.push(backUrl); else if (modal === "new") newAttempt(); else { dispatch({ type: "submit" }); setModal(null); } }}>{modal === "exit" ? "Save and leave" : modal === "new" ? "Archive and create" : "Submit and review"}</button></div>
    </dialog>
  </main>;
}
