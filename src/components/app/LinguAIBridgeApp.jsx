"use client";

import { useMemo, useState } from "react";

import ListeningWorkspace from "@/components/listening/ListeningWorkspace";

const navigation = [
  { id: "overview", label: "Overview", icon: "⌂" },
  { id: "listening", label: "Listening", icon: "◉" },
  { id: "reading", label: "Reading", icon: "▤" },
  { id: "writing", label: "Writing", icon: "✎" },
  { id: "speaking", label: "Speaking", icon: "◎" },
];

const scoreBreakdown = [
  { label: "Listening", score: "8.0", tone: "teal" },
  { label: "Reading", score: "7.5", tone: "blue" },
  { label: "Writing", score: "7.0", tone: "amber" },
  { label: "Speaking", score: "7.5", tone: "rose" },
];

const dailyFocus = [
  { label: "Listening Part 3", detail: "Inference traps", progress: 76 },
  { label: "Reading Passage 2", detail: "Matching headings", progress: 62 },
  { label: "Writing Task 2", detail: "Examples and cohesion", progress: 44 },
];

const READING_BOOKS = Array.from({ length: 19 }, (_, index) => {
  const number = index + 1;
  return {
    id: number,
    title: `Cambridge ${number}`,
    level:
      number <= 8 ? "Foundation" : number <= 14 ? "Intermediate" : "Advanced",
  };
});

const READING_PASSAGE = `Many cities are trying to reduce traffic congestion by encouraging people to use public transport, cycle more often, and work remotely whenever possible. However, the success of such measures depends not only on government policy, but also on the habits and incentives that shape daily life. When commuters feel that their journeys are reliable, affordable, and comfortable, they are far more likely to choose alternatives to driving. Meanwhile, companies that support flexible schedules can reduce pressure on transport networks and make a positive difference to urban sustainability.`;

const READING_QUESTIONS = [
  "What is one way cities are trying to reduce traffic congestion?",
  "What does the success of these measures depend on?",
  "What makes commuters more likely to avoid driving?",
  "How can flexible schedules help transport networks?",
  "What is the main topic of the passage?",
  "Give one advantage of reliable public transport.",
  "Which groups influence daily travel habits?",
  "What can companies do to support sustainability?",
  "Find a word meaning 'trustworthy' in the passage.",
  "Write one idea you would add to the passage.",
];

const STUDIO_CONFIG = {
  writing: {
    kicker: "Writing studio",
    title: "Turn a rough essay into a sharper band-score attempt.",
    subtitle:
      "Draft, submit, and get examiner-style feedback across the IELTS criteria.",
    taskLabel: "Task prompt",
    responseLabel: "Essay response",
    responsePlaceholder:
      "Write your Task 1 or Task 2 answer here. Keep it real; the evaluator will be strict.",
    cta: "Review writing",
    defaultTask:
      "Some people believe that technology has made communication easier, while others think it has made relationships weaker. Discuss both views and give your opinion.",
    drills: ["Task response", "Cohesion", "Lexical range"],
    metricLabel: "Words",
  },
  speaking: {
    kicker: "Speaking room",
    title: "Stress-test a spoken answer before the real interview.",
    subtitle:
      "Paste a transcript and get targeted feedback for fluency, grammar, vocabulary, and idea development.",
    taskLabel: "Question or cue card",
    responseLabel: "Speaking transcript",
    responsePlaceholder:
      "Paste or type what you said. Natural spoken language is fine.",
    cta: "Review speaking",
    defaultTask:
      "Describe a time when you learned something difficult. You should say what it was, how you learned it, why it was difficult, and how you felt afterwards.",
    drills: ["Fluency", "Pronunciation", "Idea depth"],
    metricLabel: "Words",
  },
};

function Sidebar({ activeView, onNavigate }) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-mark">L</div>
        <div>
          <strong>LinguAI</strong>
          <span>Bridge</span>
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">AM</div>
        <div>
          <strong>Alex Morgan</strong>
          <span>Target band 8.0</span>
        </div>
      </div>

      <p className="nav-label">Workspace</p>
      <nav className="app-nav" aria-label="Main navigation">
        {navigation.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`app-nav-item ${activeView === item.id ? "active" : ""}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="streak-card">
          <span className="streak-flame">12</span>
          <div>
            <strong>Day streak</strong>
            <span>4h 20m this week</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ activeView }) {
  const title =
    navigation.find((item) => item.id === activeView)?.label || "Workspace";

  return (
    <header className="app-topbar">
      <div>
        <span className="mobile-context">Workspace / </span>
        <strong>{title}</strong>
      </div>
      <div className="topbar-actions">
        <button
          type="button"
          className="icon-button"
          aria-label="Notifications"
        >
          <span className="notification-dot" />!
        </button>
        <div className="topbar-avatar">AM</div>
      </div>
    </header>
  );
}

function Overview({ onNavigate }) {
  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date()),
    [],
  );

  return (
    <div className="view-content overview-view">
      <section className="welcome-row">
        <div>
          <p className="section-kicker">Command center / {formattedDate}</p>
          <h1>Train like the exam is already watching.</h1>
          <p className="view-subtitle">
            One focused cockpit for Cambridge listening, reading drills, and
            AI-reviewed writing and speaking practice.
          </p>
        </div>
        <button
          type="button"
          className="primary-action"
          onClick={() => onNavigate("listening")}
        >
          Continue practice <span>→</span>
        </button>
      </section>

      <section className="overview-grid">
        <div className="band-card">
          <div className="card-heading-row">
            <div>
              <p className="section-kicker">Band estimate</p>
              <h2>Current readiness</h2>
            </div>
            <span className="trend-up">+0.5 this month</span>
          </div>
          <div className="band-score">
            7.5 <span>/ 9.0</span>
          </div>
          <div className="score-bars" aria-hidden="true">
            {scoreBreakdown.map((item) => (
              <span className={item.tone} key={item.label} />
            ))}
          </div>
          <div className="score-legend">
            {scoreBreakdown.map((item) => (
              <span key={item.label}>
                {item.label} <b>{item.score}</b>
              </span>
            ))}
          </div>
        </div>

        <div className="weekly-card">
          <p className="section-kicker">This week</p>
          <h2>Momentum map</h2>
          <div className="week-chart" aria-label="Weekly practice activity">
            <span style={{ height: "34%" }} />
            <span style={{ height: "58%" }} />
            <span style={{ height: "48%" }} />
            <span style={{ height: "78%" }} />
            <span style={{ height: "66%" }} />
            <span style={{ height: "88%" }} />
            <span style={{ height: "41%" }} />
          </div>
          <div className="chart-days" aria-hidden="true">
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
            <span>S</span>
          </div>
          <p className="chart-caption">
            <b>4h 20m</b> practiced across 12 sessions
          </p>
        </div>
      </section>

      <section className="focus-grid">
        <div className="focus-panel">
          <div className="card-heading-row">
            <div>
              <p className="section-kicker">Next pressure points</p>
              <h2>Today&apos;s stack</h2>
            </div>
            <button
              type="button"
              className="text-action"
              onClick={() => onNavigate("reading")}
            >
              Open reading <span>→</span>
            </button>
          </div>
          <div className="focus-list">
            {dailyFocus.map((item) => (
              <div className="focus-item" key={item.label}>
                <div>
                  <b>{item.label}</b>
                  <span>{item.detail}</span>
                </div>
                <div className="mini-progress" aria-hidden="true">
                  <span style={{ width: `${item.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="skill-panel">
          <p className="section-kicker">Fast lanes</p>
          <div className="skill-buttons">
            {navigation.slice(1).map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => onNavigate(item.id)}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ReadingWorkspace() {
  const [selectedBook, setSelectedBook] = useState(19);
  const [selectedTest, setSelectedTest] = useState(1);
  const [mode, setMode] = useState("training");
  const [practiceVisible, setPracticeVisible] = useState(false);
  const [answers, setAnswers] = useState(() => Array(10).fill(""));

  const activeBook =
    READING_BOOKS.find((book) => book.id === selectedBook) || READING_BOOKS[18];
  const answeredCount = answers.filter((answer) => answer.trim()).length;

  function selectBook(bookId) {
    setSelectedBook(bookId);
    setSelectedTest(1);
    setAnswers(Array(10).fill(""));
    setPracticeVisible(true);
  }

  function changeTest(direction) {
    setSelectedTest((current) => Math.min(4, Math.max(1, current + direction)));
  }

  function updateAnswer(index, value) {
    setAnswers((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  }

  return (
    <div className="view-content reading-view">
      <section className="library-hero reading-hero">
        <div>
          <p className="section-kicker blue">Reading trainer</p>
          <h1>Cambridge passages with a clean answer workflow.</h1>
          <p className="view-subtitle">
            Choose a collection, open a test, and work through the passage with
            a focused answer sheet.
          </p>
        </div>
        <div className="library-orbit blue">
          <span>R</span>
        </div>
      </section>

      <div className="reading-library-toolbar">
        <div
          className="mode-switch"
          role="tablist"
          aria-label="Reading mode selector"
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
            onClick={() => selectBook(Math.max(1, selectedBook - 1))}
            aria-label="Previous book"
          >
            ←
          </button>
          <span>{activeBook.title}</span>
          <button
            type="button"
            onClick={() => selectBook(Math.min(19, selectedBook + 1))}
            aria-label="Next book"
          >
            →
          </button>
        </div>
      </div>

      <div className="reading-library-grid">
        {READING_BOOKS.map((book) => (
          <button
            type="button"
            key={book.id}
            className={`book-card ${book.id === selectedBook ? "selected" : ""}`}
            onClick={() => selectBook(book.id)}
          >
            <span className="book-card-index">Book {book.id}</span>
            <strong>{book.title}</strong>
            <small>{book.level}</small>
            <em>4 tests</em>
          </button>
        ))}
      </div>

      {practiceVisible && (
        <div className="reading-layout">
          <article className="reading-card">
            <div className="reading-header">
              <div>
                <p className="section-kicker">Practice passage</p>
                <h2>
                  {activeBook.title} · Test {selectedTest}
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
            <div className="reading-text">{READING_PASSAGE}</div>
          </article>

          <aside className="dictionary-card listening-panel">
            <p className="section-kicker">Answer sheet</p>
            <h3>Questions 1-10</h3>
            <div className="save-state">
              <span className="save-check">✓</span> {answeredCount} of 10
              answered
            </div>
            <div className="answer-grid listening-grid">
              {READING_QUESTIONS.map((question, index) => (
                <label className="answer-row" key={question}>
                  <span className="answer-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <input
                    aria-label={`Question ${index + 1}: ${question}`}
                    value={answers[index]}
                    onChange={(event) =>
                      updateAnswer(index, event.target.value)
                    }
                    autoComplete="off"
                  />
                </label>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function FeedbackPanel({ feedback }) {
  if (!feedback) {
    return (
      <div className="feedback-empty">
        <span>AI</span>
        <strong>Feedback lands here</strong>
        <p>Submit a response to unlock a strict IELTS-style breakdown.</p>
      </div>
    );
  }

  const criteria = Object.entries(feedback.criteria || {});

  return (
    <div className="feedback-result">
      <div className="feedback-score">
        {Number(feedback.bandScore || 0).toFixed(1)}
        <small>Band score</small>
      </div>
      <div className="feedback-main">
        <h3>{feedback.summary || "Evaluation complete."}</h3>
        <div className="feedback-columns">
          <div>
            <b>Strengths</b>
            {(feedback.strengths || []).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div>
            <b>Improve next</b>
            {(feedback.improvements || []).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        {criteria.length > 0 && (
          <div className="criteria-grid">
            {criteria.map(([label, value]) => (
              <div key={label}>
                <b>{label}</b>
                <span>{value}</span>
              </div>
            ))}
          </div>
        )}
        {(feedback.nextSteps || []).length > 0 && (
          <div className="next-steps">
            <b>Next steps</b>
            {(feedback.nextSteps || []).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SkillStudio({ skill }) {
  const config = STUDIO_CONFIG[skill];
  const [task, setTask] = useState(config.defaultTask);
  const [submission, setSubmission] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const wordCount = submission
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  async function evaluateSubmission(event) {
    event.preventDefault();
    setError("");

    if (submission.trim().length < 10) {
      setError("Add a longer response before requesting feedback.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: skill,
          task,
          submission,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "AI review failed.");
      }

      setFeedback(payload.feedback);
    } catch (reviewError) {
      setError(reviewError.message || "AI review failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="view-content studio-view">
      <section className={`library-hero studio-hero ${skill}`}>
        <div>
          <p className="section-kicker blue">{config.kicker}</p>
          <h1>{config.title}</h1>
          <p className="view-subtitle">{config.subtitle}</p>
        </div>
        <div
          className={`library-orbit ${skill === "writing" ? "orange" : "purple"}`}
        >
          <span>{skill === "writing" ? "W" : "S"}</span>
        </div>
      </section>

      <section className="studio-layout">
        <form className="studio-panel" onSubmit={evaluateSubmission}>
          <div className="studio-stats">
            <span>
              {config.metricLabel} <b>{wordCount}</b>
            </span>
            {config.drills.map((drill) => (
              <span key={drill}>{drill}</span>
            ))}
          </div>

          <label className="field-block">
            <span>{config.taskLabel}</span>
            <textarea
              value={task}
              onChange={(event) => setTask(event.target.value)}
              rows={4}
            />
          </label>

          <label className="field-block">
            <span>{config.responseLabel}</span>
            <textarea
              className="response-textarea"
              value={submission}
              onChange={(event) => setSubmission(event.target.value)}
              placeholder={config.responsePlaceholder}
              rows={12}
            />
          </label>

          {error && <p className="ai-error">{error}</p>}

          <div className="studio-actions">
            <button
              type="button"
              className="clear-button"
              onClick={() => {
                setSubmission("");
                setFeedback(null);
                setError("");
              }}
            >
              Clear
            </button>
            <button
              type="submit"
              className="primary-action"
              disabled={isLoading}
            >
              {isLoading ? "Reviewing..." : config.cta}
              <span>→</span>
            </button>
          </div>
        </form>

        <aside className="feedback-panel">
          <FeedbackPanel feedback={feedback} />
        </aside>
      </section>
    </div>
  );
}

export default function LinguAIBridgeApp() {
  const [activeView, setActiveView] = useState("overview");

  return (
    <div className="app-frame">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <div className="app-main">
        <Topbar activeView={activeView} />
        {activeView === "overview" && <Overview onNavigate={setActiveView} />}
        {activeView === "listening" && <ListeningWorkspace />}
        {activeView === "reading" && <ReadingWorkspace />}
        {["writing", "speaking"].includes(activeView) && (
          <SkillStudio skill={activeView} />
        )}
      </div>
    </div>
  );
}
