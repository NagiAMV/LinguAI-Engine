"use client";

import { useState } from "react";

import ListeningWorkspace from "@/components/listening/ListeningWorkspace";

const navigation = [
  { id: "overview", label: "Overview", icon: "⌂" },
  { id: "listening", label: "Listening", icon: "◉" },
  { id: "reading", label: "Reading", icon: "▤" },
  { id: "writing", label: "Writing", icon: "✎" },
  { id: "speaking", label: "Speaking", icon: "◌" },
];

const recentTests = [
  {
    skill: "Listening",
    title: "Cambridge 19 · Test 1",
    progress: "18 / 40",
    tone: "mint",
  },
  {
    skill: "Reading",
    title: "Cambridge 17 · Test 3",
    progress: "Finished",
    tone: "blue",
  },
  {
    skill: "Writing",
    title: "Some people believe...",
    progress: "Draft",
    tone: "orange",
  },
];

const catalog = {
  reading: {
    eyebrow: "Reading library",
    title: "Choose a passage and begin.",
    description:
      "Cambridge passages are organized by book and test so you can return to the exact place you left off.",
    accent: "blue",
    label: "Start reading",
    filters: ["All books", "Cambridge 19", "Cambridge 18", "Cambridge 17"],
  },
  writing: {
    eyebrow: "Writing studio",
    title: "Build an answer worth scoring.",
    description:
      "Pick a real IELTS task, write in one focused session, then get structured feedback on task response, coherence, vocabulary and grammar.",
    accent: "orange",
    label: "Open writing studio",
    filters: ["All tasks", "Task 1", "Task 2", "Recent"],
  },
  speaking: {
    eyebrow: "Speaking room",
    title: "Practice out loud, without pressure.",
    description:
      "Warm up with Part 1, develop an idea in Part 2, and explore follow-up questions in Part 3 with AI feedback after your recording.",
    accent: "purple",
    label: "Start speaking",
    filters: ["Part 1", "Part 2", "Part 3", "Recent"],
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
        <button type="button" aria-label="Open profile menu">
          •••
        </button>
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
            {item.label}
            {item.id === "overview" && <span className="nav-badge">4</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="streak-card">
          <span className="streak-flame">✦</span>
          <div>
            <strong>12 day streak</strong>
            <span>Keep the rhythm going</span>
          </div>
        </div>
        <button
          className="sidebar-settings"
          type="button"
          onClick={() => onNavigate("profile")}
        >
          <span>⚙</span> Settings
        </button>
      </div>
    </aside>
  );
}

function Topbar({ activeView }) {
  const title =
    navigation.find((item) => item.id === activeView)?.label || "Profile";
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
          ♧<span className="notification-dot" />
        </button>
        <div className="topbar-avatar">AM</div>
      </div>
    </header>
  );
}

function Overview({ onNavigate }) {
  return (
    <div className="view-content overview-view">
      <section className="welcome-row">
        <div>
          <p className="section-kicker">Thursday, 17 September</p>
          <h1>Good morning, Alex.</h1>
          <p className="view-subtitle">
            A little practice today makes exam day feel familiar.
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
          <div className="band-card-head">
            <div>
              <p className="section-kicker">Your progress</p>
              <h2>Current estimate</h2>
            </div>
            <span className="trend-up">↗ 0.5</span>
          </div>
          <div className="band-score">
            7.5 <span>/ 9.0</span>
          </div>
          <div className="score-bars">
            <span style={{ width: "84%" }} />
            <span style={{ width: "72%" }} />
            <span style={{ width: "76%" }} />
            <span style={{ width: "66%" }} />
          </div>
          <div className="score-legend">
            <span>
              Listening <b>8.0</b>
            </span>
            <span>
              Reading <b>7.5</b>
            </span>
            <span>
              Writing <b>7.0</b>
            </span>
            <span>
              Speaking <b>7.5</b>
            </span>
          </div>
        </div>
        <div className="weekly-card">
          <p className="section-kicker">This week</p>
          <h2>Keep your momentum.</h2>
          <div className="week-chart">
            <span style={{ height: "34%" }} />
            <span style={{ height: "58%" }} />
            <span style={{ height: "48%" }} />
            <span style={{ height: "78%" }} />
            <span style={{ height: "66%" }} />
            <span style={{ height: "88%" }} />
            <span style={{ height: "41%" }} />
          </div>
          <div className="chart-days">
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
            <span>S</span>
          </div>
          <p className="chart-caption">
            <b>4h 20m</b> practiced this week
          </p>
        </div>
      </section>
      <section className="recent-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Your library</p>
            <h2>Pick up where you left off</h2>
          </div>
          <button
            type="button"
            className="text-action"
            onClick={() => onNavigate("reading")}
          >
            View all <span>→</span>
          </button>
        </div>
        <div className="recent-list">
          {recentTests.map((test) => (
            <button
              type="button"
              className="recent-item"
              key={test.title}
              onClick={() => onNavigate(test.skill.toLowerCase())}
            >
              <span className={`recent-icon ${test.tone}`}>
                {test.skill.slice(0, 1)}
              </span>
              <span className="recent-copy">
                <b>{test.title}</b>
                <small>{test.skill}</small>
              </span>
              <span className="recent-progress">{test.progress}</span>
              <span className="recent-arrow">→</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function SkillLibrary({ skill, onNavigate }) {
  const content = catalog[skill];
  const [submission, setSubmission] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [evaluationError, setEvaluationError] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);

  async function evaluateSubmission(event) {
    event.preventDefault();
    setIsEvaluating(true);
    setEvaluationError("");
    setFeedback(null);
    try {
      const response = await fetch("/api/ai/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: skill, submission, task: content.title }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Evaluation failed");
      setFeedback(result.feedback);
    } catch (error) {
      setEvaluationError(error.message);
    } finally {
      setIsEvaluating(false);
    }
  }

  return (
    <div className="view-content library-view">
      <section className="library-hero">
        <div>
          <p className={`section-kicker ${content.accent}`}>
            {content.eyebrow}
          </p>
          <h1>{content.title}</h1>
          <p className="view-subtitle">{content.description}</p>
        </div>
        <div className={`library-orbit ${content.accent}`}>
          <span>
            {skill === "writing" ? "Aa" : skill === "speaking" ? "声" : "19"}
          </span>
        </div>
      </section>
      <div className="library-toolbar">
        <div className="filter-pills">
          {content.filters.map((filter, index) => (
            <button
              type="button"
              className={index === 0 ? "selected" : ""}
              key={filter}
            >
              {filter}
            </button>
          ))}
        </div>
        <label className="search-field">
          <span>⌕</span>
          <input placeholder="Search library" />
        </label>
      </div>
      <section className="library-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Available now</p>
            <h2>
              {skill === "writing"
                ? "Recent IELTS tasks"
                : skill === "speaking"
                  ? "Question sets"
                  : "Cambridge collection"}
            </h2>
          </div>
          <span className="library-count">24 items</span>
        </div>
        <div className="catalog-grid">
          {[1, 2, 3, 4].map((item) => (
            <button
              type="button"
              className={`catalog-card ${content.accent}`}
              key={item}
              onClick={() => skill === "listening" && onNavigate("listening")}
            >
              <div className="catalog-card-top">
                <span className="catalog-type">
                  {skill === "writing"
                    ? `Task ${item === 4 ? 2 : 1}`
                    : skill === "speaking"
                      ? `Part ${item > 3 ? 3 : item}`
                      : `Cambridge ${19 - (item - 1)}`}
                </span>
                <span className="catalog-more">•••</span>
              </div>
              <h3>
                {skill === "writing"
                  ? [
                      "Some people believe that...",
                      "Describe the chart below",
                      "Technology and education",
                      "The role of public transport",
                    ][item - 1]
                  : skill === "speaking"
                    ? [
                        "Daily routines & habits",
                        "A memorable journey",
                        "Work and society",
                        "Technology in life",
                      ][item - 1]
                    : `Test ${item}`}
              </h3>
              <p>
                {skill === "writing"
                  ? "Estimated 40 minutes"
                  : skill === "speaking"
                    ? `${item + 4} questions · AI feedback`
                    : "3 passages · 40 questions"}
              </p>
              <span className="catalog-cta">
                Open {skill} <b>→</b>
              </span>
            </button>
          ))}
        </div>
      </section>
      {skill !== "reading" && (
        <section className="ai-practice-panel">
          <div>
            <p className={`section-kicker ${content.accent}`}>AI coach</p>
            <h2>{skill === "writing" ? "Write a response, get an examiner-style review." : "Paste your transcript and review your performance."}</h2>
            <p>Feedback covers the four IELTS criteria and gives you concrete next steps.</p>
          </div>
          <form onSubmit={evaluateSubmission}>
            <textarea value={submission} onChange={(event) => setSubmission(event.target.value)} placeholder={skill === "writing" ? "Write your IELTS response here..." : "Paste your speaking transcript here..."} minLength={10} required />
            <button type="submit" className="primary-action" disabled={isEvaluating}>{isEvaluating ? "Reviewing..." : "Get AI feedback"} <span>→</span></button>
          </form>
          {evaluationError && <p className="ai-error">{evaluationError}</p>}
          {feedback && <div className="feedback-result"><div className="feedback-score">{feedback.bandScore || "-"}<small>estimated band</small></div><div><h3>{feedback.summary}</h3><div className="feedback-columns"><div><b>Strengths</b>{feedback.strengths?.map((item) => <span key={item}>+ {item}</span>)}</div><div><b>Next steps</b>{feedback.nextSteps?.map((item) => <span key={item}>→ {item}</span>)}</div></div></div></div>}
        </section>
      )}
    </div>
  );
}

function ProfileView() {
  return (
    <div className="view-content profile-view">
      <p className="section-kicker">Your profile</p>
      <h1>Make the plan yours.</h1>
      <p className="view-subtitle">
        Your target, your pace, your progress in one place.
      </p>
      <div className="profile-layout">
        <div className="profile-main-card">
          <div className="large-avatar">AM</div>
          <h2>Alex Morgan</h2>
          <p>Preparing for IELTS Academic</p>
          <div className="profile-fields">
            <div>
              <span>Target band</span>
              <b>8.0</b>
            </div>
            <div>
              <span>Exam date</span>
              <b>24 Nov 2026</b>
            </div>
            <div>
              <span>Daily goal</span>
              <b>45 minutes</b>
            </div>
          </div>
        </div>
        <div className="profile-note">
          <span className="section-kicker">AI coach</span>
          <h2>Your feedback history will live here.</h2>
          <p>
            After each Writing or Speaking session, LinguAI will track recurring
            grammar patterns, vocabulary growth and fluency markers.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LinguAIBridgeApp() {
  const [activeView, setActiveView] = useState("overview");
  function navigate(view) {
    setActiveView(view);
  }
  return (
    <div className="app-frame">
      <Sidebar activeView={activeView} onNavigate={navigate} />
      <div className="app-main">
        <Topbar activeView={activeView} />
        {activeView === "overview" && <Overview onNavigate={navigate} />}
        {activeView === "listening" && <ListeningWorkspace />}
        {["reading", "writing", "speaking"].includes(activeView) && (
          <SkillLibrary skill={activeView} onNavigate={navigate} />
        )}
        {activeView === "profile" && <ProfileView />}
      </div>
    </div>
  );
}
