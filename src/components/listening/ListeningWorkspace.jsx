"use client";

import { useEffect, useMemo, useState } from "react";

const CAMBRIDGE_BOOKS = Array.from({ length: 19 }, (_, index) => {
  const bookNumber = index + 1;
  return {
    id: bookNumber,
    title: `Cambridge ${bookNumber}`,
    label: `Book ${bookNumber}`,
    level:
      bookNumber <= 8
        ? "Foundation"
        : bookNumber <= 14
          ? "Intermediate"
          : "Advanced",
    tests: [
      { id: 1, title: "Test 1", mode: "Listening", difficulty: "Core" },
      { id: 2, title: "Test 2", mode: "Listening", difficulty: "Mixed" },
      { id: 3, title: "Test 3", mode: "Listening", difficulty: "Timed" },
      { id: 4, title: "Test 4", mode: "Listening", difficulty: "Challenge" },
    ],
  };
});

const SECTIONS = ["Part 1", "Part 2", "Part 3", "Part 4"];
const ANSWER_COUNT = 40;

function makeAnswerState() {
  return Array.from({ length: ANSWER_COUNT }, () => "");
}

export default function ListeningWorkspace() {
  const [selectedBook, setSelectedBook] = useState(19);
  const [selectedTest, setSelectedTest] = useState(1);
  const [mode, setMode] = useState("training");
  const [activeSection, setActiveSection] = useState(0);
  const [practiceVisible, setPracticeVisible] = useState(false);
  const [answers, setAnswers] = useState(makeAnswerState);
  const [savedAt, setSavedAt] = useState(null);

  const activeBook =
    CAMBRIDGE_BOOKS.find((book) => book.id === selectedBook) ||
    CAMBRIDGE_BOOKS[0];
  const activeTest =
    activeBook.tests.find((test) => test.id === selectedTest) ||
    activeBook.tests[0];
  const testId = `cambridge_${selectedBook}_test_${selectedTest}`;
  const storageKey = `linguai-listening-${testId}`;
  const answeredCount = useMemo(
    () => answers.filter((answer) => answer.trim()).length,
    [answers],
  );
  const sectionStart = activeSection * 10;
  const sectionAnswers = answers.slice(sectionStart, sectionStart + 10);

  useEffect(() => {
    const savedAnswers = window.localStorage.getItem(storageKey);
    if (!savedAnswers) {
      setAnswers(makeAnswerState());
      setSavedAt(null);
      return;
    }

    try {
      const parsedAnswers = JSON.parse(savedAnswers);
      if (
        !Array.isArray(parsedAnswers) ||
        parsedAnswers.length !== ANSWER_COUNT
      ) {
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

  function changeBook(direction) {
    setSelectedBook((current) => {
      const next = current + direction;
      if (next < 1) return 1;
      if (next > CAMBRIDGE_BOOKS.length) return CAMBRIDGE_BOOKS.length;
      return next;
    });
    setSelectedTest(1);
    setActiveSection(0);
  }

  function changeTest(direction) {
    setSelectedTest((current) => {
      const next = current + direction;
      if (next < 1) return 1;
      if (next > activeBook.tests.length) return activeBook.tests.length;
      return next;
    });
  }

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
    <div className="view-content reading-view">
      <section className="library-hero reading-hero">
        <div>
          <p className="section-kicker blue">Listening trainer</p>
          <h1>Stay focused. Capture every detail.</h1>
          <p className="view-subtitle">
            Practice in a Cambridge-style exam flow, save answers automatically,
            and keep the full test structure visible.
          </p>
        </div>
        <div className="library-orbit blue">
          <span>🎧</span>
        </div>
      </section>

      <div className="reading-library-toolbar">
        <div
          className="mode-switch"
          role="tablist"
          aria-label="Listening mode selector"
        >
          <button
            type="button"
            className={mode === "training" ? "active" : ""}
            onClick={() => setMode("training")}
          >
            Training mode
          </button>
          <button
            type="button"
            className={mode === "mock" ? "active" : ""}
            onClick={() => setMode("mock")}
          >
            Mock exam
          </button>
        </div>
        <div className="book-jump">
          <button
            type="button"
            onClick={() => changeBook(-1)}
            aria-label="Previous book"
          >
            ←
          </button>
          <span>{activeBook.title}</span>
          <button
            type="button"
            onClick={() => changeBook(1)}
            aria-label="Next book"
          >
            →
          </button>
        </div>
      </div>

      <div className="reading-library-grid">
        {CAMBRIDGE_BOOKS.map((book) => (
          <button
            type="button"
            key={book.id}
            className={`book-card ${book.id === selectedBook ? "selected" : ""}`}
            onClick={() => {
              setSelectedBook(book.id);
              setSelectedTest(1);
              setActiveSection(0);
              setPracticeVisible(true);
            }}
          >
            <span className="book-card-index">Book {book.id}</span>
            <strong>{book.title}</strong>
            <small>{book.level}</small>
            <em>{book.tests.length} tests</em>
          </button>
        ))}
      </div>

      {practiceVisible && (
        <div className="reading-layout">
          <article className="reading-card audio-card">
            <div className="reading-header">
              <div>
                <p className="section-kicker">Practice test</p>
                <h2>
                  {activeBook.title} · {activeTest.title}
                </h2>
              </div>
              <div className="reading-actions">
                <button type="button" onClick={() => setPracticeVisible(false)}>
                  ← Library
                </button>
                <button type="button" onClick={() => changeTest(-1)}>
                  ← Prev
                </button>
                <span className="reading-badge">
                  {mode === "training" ? "Training" : "Exam"}
                </span>
                <button type="button" onClick={() => changeTest(1)}>
                  Next →
                </button>
              </div>
            </div>

            <div className="audio-panel-inner" aria-labelledby="audio-heading">
              <div className="audio-heading-row">
                <div>
                  <p className="section-kicker">Audio player</p>
                  <h2 id="audio-heading">Listening recording</h2>
                </div>
                <span className="audio-source">Proxy stream</span>
              </div>
              <audio
                className="listening-audio"
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
            </div>

            <div
              className="section-tabs listening-tabs"
              role="tablist"
              aria-label="Listening sections"
            >
              {SECTIONS.map((section, index) => (
                <button
                  type="button"
                  key={section}
                  className={`section-tab ${index === activeSection ? "active" : ""}`}
                  onClick={() => setActiveSection(index)}
                >
                  {section}
                  <span>
                    {index * 10 + 1}–{index * 10 + 10}
                  </span>
                </button>
              ))}
            </div>
          </article>

          <aside className="dictionary-card listening-panel">
            <p className="section-kicker">Answer sheet</p>
            <h3>
              {String(sectionStart + 1).padStart(2, "0")}–
              {String(sectionStart + sectionAnswers.length).padStart(2, "0")}
            </h3>
            <div className="save-state" aria-live="polite">
              <span className="save-check">✓</span>{" "}
              {savedAt
                ? `Saved ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Ready to save"}
            </div>

            <div className="answer-grid listening-grid">
              {sectionAnswers.map((answer, sectionIndex) => {
                const realIndex = sectionStart + sectionIndex;
                return (
                  <label
                    className="answer-row"
                    key={`${sectionStart}-${realIndex}`}
                  >
                    <span className="answer-number">
                      {String(realIndex + 1).padStart(2, "0")}
                    </span>
                    <input
                      aria-label={`Answer ${realIndex + 1}`}
                      value={answer}
                      onChange={(event) =>
                        updateAnswer(realIndex, event.target.value)
                      }
                      autoComplete="off"
                      spellCheck="false"
                    />
                  </label>
                );
              })}
            </div>

            <div className="answers-footer listening-footer">
              <p>{String(answeredCount).padStart(2, "0")} of 40 answered</p>
              <button
                type="button"
                className="clear-button"
                onClick={clearAnswers}
              >
                Clear answers
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
