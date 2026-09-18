"use client";

import { useEffect, useMemo, useState } from "react";

const BOOKS = Array.from({ length: 19 }, (_, index) => index + 1);
const SECTIONS = ["Part 1", "Part 2", "Part 3", "Part 4"];
const ANSWER_COUNT = 40;

function makeAnswerState() {
  return Array.from({ length: ANSWER_COUNT }, () => "");
}

export default function ListeningWorkspace() {
  const [book, setBook] = useState(19);
  const [test, setTest] = useState(1);
  const [answers, setAnswers] = useState(makeAnswerState);
  const [savedAt, setSavedAt] = useState(null);
  const testId = `cambridge_${book}_test_${test}`;
  const storageKey = `linguai-listening-${testId}`;
  const answeredCount = useMemo(
    () => answers.filter((answer) => answer.trim()).length,
    [answers],
  );

  useEffect(() => {
    const savedAnswers = window.localStorage.getItem(storageKey);
    if (!savedAnswers) {
      setAnswers(makeAnswerState());
      setSavedAt(null);
      return;
    }

    try {
      const parsedAnswers = JSON.parse(savedAnswers);
      if (!Array.isArray(parsedAnswers) || parsedAnswers.length !== ANSWER_COUNT) {
        throw new Error("Invalid answer cache shape");
      }
      setAnswers(parsedAnswers.map((answer) => String(answer ?? "")));
      setSavedAt(new Date());
    } catch {
      window.localStorage.removeItem(storageKey);
      setAnswers(makeAnswerState());
      setSavedAt(null);
    }
  }, [storageKey]);

  function updateAnswer(index, value) {
    setAnswers((currentAnswers) => {
      const nextAnswers = [...currentAnswers];
      nextAnswers[index] = value;
      window.localStorage.setItem(storageKey, JSON.stringify(nextAnswers));
      setSavedAt(new Date());
      return nextAnswers;
    });
  }

  function clearAnswers() {
    window.localStorage.removeItem(storageKey);
    setAnswers(makeAnswerState());
    setSavedAt(null);
  }

  return (
    <main className="listening-shell">
      <header className="listening-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            L
          </div>
          <div>
            <p className="brand-name">LinguAI Bridge</p>
            <p className="brand-product">Computer-delivered IELTS</p>
          </div>
        </div>
        <div className="session-status">
          <span /> Practice session
        </div>
      </header>
      <section className="listening-intro">
        <div>
          <p className="section-kicker">Listening test</p>
          <h1>Stay focused. Capture every detail.</h1>
          <p className="intro-copy">
            Your answers save automatically on this device while you listen.
          </p>
        </div>
        <div className="progress-summary">
          <span className="progress-number">
            {String(answeredCount).padStart(2, "0")}
          </span>
          <span>of 40 answered</span>
        </div>
      </section>
      <section className="test-controls" aria-label="Test selection">
        <div className="control-group">
          <label htmlFor="book-select">Book</label>
          <select
            id="book-select"
            value={book}
            onChange={(event) => setBook(Number(event.target.value))}
          >
            {BOOKS.map((bookNumber) => (
              <option key={bookNumber} value={bookNumber}>
                Cambridge {bookNumber}
              </option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label htmlFor="test-select">Test</label>
          <select
            id="test-select"
            value={test}
            onChange={(event) => setTest(Number(event.target.value))}
          >
            {[1, 2, 3, 4].map((testNumber) => (
              <option key={testNumber} value={testNumber}>
                Test {testNumber}
              </option>
            ))}
          </select>
        </div>
        <div className="test-id">{testId}</div>
      </section>
      <section className="audio-panel" aria-labelledby="audio-heading">
        <div className="audio-heading-row">
          <div>
            <p className="section-kicker">Audio player</p>
            <h2 id="audio-heading">Listening recording</h2>
          </div>
          <span className="audio-source">Proxy stream</span>
        </div>
        <audio
          className="w-full listening-audio"
          controls
          preload="metadata"
          src={`/api/listening/proxy-stream?testId=${testId}`}
        >
          Your browser does not support the audio element.
        </audio>
        <div className="audio-note">
          <span className="sound-dot" /> Use headphones if available. The
          recording can be paused and scrubbed.
        </div>
      </section>
      <section className="answers-panel" aria-labelledby="answers-heading">
        <div className="answers-heading-row">
          <div>
            <p className="section-kicker">Answer sheet</p>
            <h2 id="answers-heading">Type your answers</h2>
          </div>
          <div className="save-state" aria-live="polite">
            <span className="save-check">✓</span>{" "}
            {savedAt
              ? `Saved ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "Ready to save"}
          </div>
        </div>
        <div
          className="section-tabs"
          role="tablist"
          aria-label="Listening sections"
        >
          {SECTIONS.map((section, index) => (
            <button
              type="button"
              className={`section-tab ${index === 0 ? "active" : ""}`}
              key={section}
            >
              {section}
              <span>
                {index * 10 + 1}–{index * 10 + 10}
              </span>
            </button>
          ))}
        </div>
        <div className="answer-grid">
          {answers.map((answer, index) => (
            <label className="answer-row" key={index}>
              <span className="answer-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <input
                aria-label={`Answer ${index + 1}`}
                value={answer}
                onChange={(event) => updateAnswer(index, event.target.value)}
                autoComplete="off"
                spellCheck="false"
              />
            </label>
          ))}
        </div>
        <div className="answers-footer">
          <p>
            Tab moves to the next answer. Keep spelling and word limits in mind.
          </p>
          <button type="button" className="clear-button" onClick={clearAnswers}>
            Clear answers
          </button>
        </div>
      </section>
    </main>
  );
}
