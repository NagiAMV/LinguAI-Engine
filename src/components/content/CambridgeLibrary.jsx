"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import importedCatalog from "@/data/cambridge-import.json";

function AnswerFields({ html, answers, onAnswer }) {
  const root = useRef(null);
  const initial = useRef(answers);
  const markup = useMemo(() => ({ __html: html }), [html]);
  useEffect(() => {
    for (const input of root.current.querySelectorAll("input[name], select[name]")) {
      const value = initial.current[input.name];
      if (input.type === "checkbox") input.checked = Array.isArray(value) && value.includes(input.value);
      else if (input.type === "radio") input.checked = value === input.value;
      else input.value = typeof value === "string" ? value : "";
    }
  }, [html]);
  function change(event) {
    const input = event.target;
    if (!input.name) return;
    if (input.type === "checkbox") {
      const values = [...root.current.querySelectorAll('input[type="checkbox"]')]
        .filter((field) => field.name === input.name && field.checked).map((field) => field.value);
      onAnswer(input.name, values);
    } else onAnswer(input.name, input.value);
  }
  // HTML is sanitized by scripts/import-cambridge.py before being published.
  return <div ref={root} className="cd-content cd-questions" onInput={change} dangerouslySetInnerHTML={markup} />;
}

function TestSession({ test, onBack }) {
  const key = `linguai-cd-${test.id}`;
  const [partIndex, setPartIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [review, setReview] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const part = test.parts[partIndex];
  const allFields = useMemo(() => [...new Set(test.parts.flatMap((p) => p.fieldNames))], [test]);
  const answered = allFields.filter((name) => Array.isArray(answers[name]) ? answers[name].length : String(answers[name] || "").trim()).length;
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "{}");
      if (saved.answers && typeof saved.answers === "object" && !Array.isArray(saved.answers)) setAnswers(saved.answers);
      if (Number.isInteger(saved.partIndex) && saved.partIndex >= 0 && saved.partIndex < test.parts.length) setPartIndex(saved.partIndex);
    } catch { setSaveError("Browser storage is unavailable. Keep this page open to retain your answers."); }
    setLoaded(true);
  }, [key, test.parts.length]);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(key, JSON.stringify({ answers, partIndex })); }
    catch { setSaveError("Answers could not be saved in this browser."); }
  }, [answers, partIndex, key, loaded]);
  function selectPart(index) { setPartIndex(index); setAudioError(false); setReview(false); }
  return (
    <section className="cd-session">
      <header className="cd-toolbar">
        <button className="text-action" onClick={onBack}>← Tests</button>
        <div><p className="section-kicker">{test.resource} · Academic</p><h1>{test.title}</h1></div>
        <span className="cd-save-state" role="status">{saveError || (loaded ? `${answered} answers saved on this device` : "Loading answers…")}</span>
      </header>
      <nav className="cd-part-nav" aria-label="Test parts">
        {test.parts.map((item, index) => <button key={item.id} className={index === partIndex ? "active" : ""} aria-current={index === partIndex ? "step" : undefined} onClick={() => selectPart(index)}>Part {item.id}</button>)}
        <button className={review ? "active" : ""} onClick={() => setReview(!review)}>Review answers</button>
      </nav>
      {review ? <div className="cd-review panel"><h2>Your saved answers</h2><p>These are your responses. Automatic marking is not connected yet.</p><div className="cd-review-grid">{test.parts.map((item) => <section key={item.id}><h3>Part {item.id}</h3><ol>{item.fieldNames.map((name) => <li key={name}><strong>{item.fieldLabels?.[name] || "Answer"}: </strong>{Array.isArray(answers[name]) ? answers[name].join(", ") || "Not answered" : answers[name] || "Not answered"}</li>)}</ol></section>)}</div></div> :
      <div className={`cd-columns ${test.resource}`}>
        <article className="cd-pane">
          {test.resource === "listening" ? <>
            <p className="section-kicker">Recording · Part {part.id}</p><h2>Listen at your pace.</h2>
            {part.audioUrls.length ? <audio key={`${part.id}`} controls preload="metadata" onError={() => setAudioError(true)}>{part.audioUrls.map((url) => <source key={url} src={url} type="audio/mpeg" />)}</audio> : <p>Audio is not available for this part.</p>}
            {audioError && <p role="alert">The recording could not load. <a href={test.sourceUrl} target="_blank" rel="noreferrer">Open the source recording ↗</a></p>}
            <p className="meta">Listen, pause and replay as you work through the questions.</p>
            <details key={`transcript-${part.id}`}><summary>Show transcript</summary><div className="cd-content" dangerouslySetInnerHTML={{__html:part.passage}} /></details>
          </> : <><p className="section-kicker">Reading passage · Part {part.id}</p><div className="cd-passage">{loaded && <AnswerFields key={part.id} html={part.passage} answers={answers} onAnswer={(name,value) => setAnswers((current) => ({...current,[name]:value}))} />}</div></>}
        </article>
        <article className="cd-pane" aria-label={`Part ${part.id} questions`}>
          {loaded && <AnswerFields key={part.id} html={part.questions} answers={answers} onAnswer={(name,value) => setAnswers((current) => ({...current,[name]:value}))} />}
        </article>
      </div>}
      <footer className="cd-footer"><a href={test.sourceUrl} target="_blank" rel="noreferrer">Source: Engnovate ↗</a><div><button className="button cd-secondary" disabled={partIndex === 0} onClick={() => selectPart(partIndex-1)}>← Previous part</button><button className="button" disabled={partIndex === test.parts.length-1} onClick={() => selectPart(partIndex+1)}>Next part →</button></div></footer>
    </section>
  );
}

export default function CambridgeLibrary({ resource }) {
  const label = resource === "reading" ? "Reading" : "Listening";
  const items = useMemo(() => importedCatalog.items.filter((item) => item.resource === resource), [resource]);
  const books = useMemo(() => [...new Set(items.map((item) => item.bookId))].sort((a,b) => a-b), [items]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  async function openTest(item) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(item.testNumber); setError("");
    try {
      const response = await fetch(item.contentUrl, { signal:controller.signal });
      if (!response.ok) throw Error("This test could not be loaded. Please try again.");
      const payload = await response.json();
      if (!Array.isArray(payload.parts) || !payload.parts.length) throw Error("This test is incomplete.");
      setTest(payload); window.scrollTo({top:0,behavior:"instant"});
    } catch (err) { if (err.name !== "AbortError") setError(err.message); }
    finally { if (request.current === controller) setLoading(null); }
  }
  if (test) return <TestSession key={test.id} test={test} onBack={() => setTest(null)} />;
  return <div className="view-content reading-view">
    <section className="library-hero reading-hero"><div><p className="section-kicker blue">{label} collection</p><h1>{selectedBook ? `Cambridge ${selectedBook}. Your next four steps.` : `Your Cambridge ${resource} collection.`}</h1><p className="view-subtitle">{resource === "reading" ? "Original passages and questions, ready to practise right here." : "Original questions, recordings and transcripts. All in one place."}</p></div><div className="library-orbit blue"><span>{resource === "reading" ? "R" : "L"}</span></div></section>
    <div className="reading-library-toolbar"><span className="section-kicker">Academic · Computer-delivered practice</span><span className="catalog-status live"><span />{items.length} imported tests</span>{selectedBook && <button className="text-action" onClick={() => {request.current?.abort();setLoading(null);setSelectedBook(null);setError("");}}>← All collections</button>}</div>
    {error && <p className="error" role="alert">{error}</p>}
    {selectedBook ? <div className="cd-test-grid">{items.filter((item) => item.bookId === selectedBook).sort((a,b) => a.testNumber-b.testNumber).map((item) => <button className="cd-test-card" key={item.testNumber} onClick={() => openTest(item)} disabled={loading !== null}><span className="section-kicker">CAMBRIDGE {selectedBook} · {label}</span><strong>Test {item.testNumber}</strong><span>{item.partCount} parts · {resource === "listening" ? "Audio & transcript" : "Passages & questions"}</span><b>{loading === item.testNumber ? "Opening…" : "Open test ↗"}</b></button>)}</div> : <div className="reading-library-grid">{books.map((book) => <button className="book-card" key={book} onClick={() => {setSelectedBook(book);window.scrollTo({top:0,behavior:"instant"});}}><span className="book-card-index">Book {book}</span><strong>Cambridge {book}</strong><small>Academic {label}</small><em>{items.filter((item)=>item.bookId===book).length} tests</em><span className="book-resource-placeholder">Open collection ↗</span></button>)}</div>}
    {!books.length && <div className="panel"><h2>Materials are being prepared</h2><p>Imported tests will appear here when available.</p></div>}
  </div>;
}
