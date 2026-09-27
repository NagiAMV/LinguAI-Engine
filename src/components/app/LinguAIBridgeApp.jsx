"use client";

import { useMemo, useState } from "react";

import CambridgeLibrary from "@/components/content/CambridgeLibrary";
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

function AppIcon({ name, size = 20 }) {
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    listening: <><path d="M4 14v-3a8 8 0 0 1 16 0v3" /><rect x="3" y="12" width="4" height="8" rx="2" /><rect x="17" y="12" width="4" height="8" rx="2" /></>,
    reading: <path d="M12 5v16M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2Z" />,
    writing: <><path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14Z" /><path d="M13 21h8" /></>,
    speaking: <><rect x="8" y="2" width="8" height="13" rx="4" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.overview}</svg>;
}

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
            aria-current={activeView === item.id ? "page" : undefined}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon"><AppIcon name={item.id} /></span>
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
      <div className="overview-intro">
        <div><p className="section-kicker">Your learning space</p><h2>Let&apos;s make progress, Alex<span>.</span></h2></div>
        <span className="overview-date">{formattedDate}</span>
      </div>
      <section className="welcome-row">
        <div>
          <p className="section-kicker hero-kicker"><span /> A little focus. A big difference.</p>
          <h1>Your next chapter<br />starts with <em>practice.</em></h1>
          <p className="view-subtitle">Build your confidence, one session at a time. Your IELTS goals are closer than you think.</p>
          <button type="button" className="primary-action" onClick={() => onNavigate("listening")}>Continue practice <span>→</span></button>
          <span className="hero-footnote">Cambridge practice · Feedback powered by AI</span>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="hero-spark spark-one">✦</div><div className="hero-spark spark-two">✦</div>
          <div className="goal-ticket"><span>THE NEXT CHAPTER</span><div className="goal-number">8.0<span>+</span></div><div className="goal-ticket-bottom"><span>YOUR TARGET BAND</span><span>↗</span></div></div>
          <div className="practice-ticket"><span className="practice-ticket-icon"><AppIcon name="listening" size={24} /></span><div><strong>Small steps. Real progress.</strong><span>You&apos;ve got this.</span></div></div>
        </div>
      </section>

      <section className="overview-grid">
        <div className="band-card">
          <div className="card-heading-row">
            <div>
              <p className="section-kicker">Band estimate</p>
              <h2>Your progress, at a glance</h2>
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
          <h2>Finding your rhythm</h2>
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
              <p className="section-kicker">One step at a time</p>
              <h2>Today&apos;s focus</h2>
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
          <p className="section-kicker">Make time for your skills</p><h2>Choose your practice</h2>
          <div className="skill-buttons">
            {navigation.slice(1).map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => onNavigate(item.id)}
              >
                <span><AppIcon name={item.id} /></span>
                {item.label}<span className="skill-arrow">↗</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ReadingWorkspace() {
  return <CambridgeLibrary resource="reading" />;
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
