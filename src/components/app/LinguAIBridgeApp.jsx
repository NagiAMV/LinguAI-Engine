"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

const SPEAKING_PART_ONE = [
  "Do you work or are you a student?",
  "What do you enjoy most about your studies or work?",
  "How do you usually spend your weekends?",
];

const SPEAKING_CUE_CARD =
  "Describe a skill you learned that was difficult at first. You should say what the skill was, why you wanted to learn it, how you learned it, and explain how you felt when you made progress.";

const SPEAKING_PART_THREE = [
  "Why do some people find it easier to learn practical skills than academic subjects?",
  "How has technology changed the way people learn new skills?",
  "Do you think schools should teach more life skills in the future? Why?",
];

const SPEAKING_HISTORY_KEY = "linguai-speaking-attempts-v1";

function SpeakingStudio() {
  const [phase, setPhase] = useState("welcome");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [prepNotes, setPrepNotes] = useState("");
  const [response, setResponse] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechAvailable(Boolean(SpeechRecognition));

    try {
      const savedHistory = JSON.parse(
        window.localStorage.getItem(SPEAKING_HISTORY_KEY) || "[]",
      );
      if (Array.isArray(savedHistory)) setHistory(savedHistory);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    if (!timerRunning || remainingSeconds === null) return undefined;

    if (remainingSeconds === 0) {
      setTimerRunning(false);
      if (phase === "part2-prep") {
        setPhase("part2-answer");
        setRemainingSeconds(120);
        setTimerRunning(true);
      }
      return undefined;
    }

    const timeout = window.setTimeout(
      () => setRemainingSeconds((seconds) => seconds - 1),
      1000,
    );
    return () => window.clearTimeout(timeout);
  }, [phase, remainingSeconds, timerRunning]);

  useEffect(
    () => () => {
      recognitionRef.current?.stop();
    },
    [],
  );

  function stopDictation() {
    try {
      recognitionRef.current?.stop();
    } catch {
      setIsListening(false);
    }
  }

  function toggleDictation() {
    if (isListening) {
      stopDictation();
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice input is not available in this browser. You can type your answer instead.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalText += `${transcript} `;
        else interimText += transcript;
      }
      if (finalText.trim()) {
        setResponse((current) =>
          `${current}${current.trim() ? " " : ""}${finalText.trim()}`,
        );
      }
      setInterimTranscript(interimText.trim());
    };
    recognition.onerror = () => {
      setError("Voice input stopped. Check microphone permission or type your answer.");
      setIsListening(false);
      setInterimTranscript("");
    };
    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };
    recognitionRef.current = recognition;
    setError("");
    setIsListening(true);
      try {
        recognition.start();
      } catch {
        setIsListening(false);
        setError("Could not start voice input. Check microphone permission or type your answer.");
      }
  }

  async function evaluateInterview(finalAnswers) {
    stopDictation();
    setPhase("review");
    setError("");
    setIsEvaluating(true);

    const submission = finalAnswers
      .map(
        (answer) =>
          `${answer.part}\nQuestion: ${answer.question}\nCandidate: ${answer.answer}`,
      )
      .join("\n\n");

    try {
      const result = await fetch("/api/ai/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "speaking",
          task: "IELTS Speaking mock interview covering Parts 1, 2, and 3. Give a practice estimate from the transcript, do not score pronunciation, and make the first next step a short personalized drill.",
          submission,
        }),
      });
      const payload = await result.json().catch(() => ({}));
      if (!result.ok) throw new Error(payload.error || "Speaking review failed.");

      setFeedback(payload.feedback);
      const attempt = {
        id: `${Date.now()}`,
        date: new Date().toISOString(),
        bandScore: Number(payload.feedback?.bandScore || 0),
        nextStep: payload.feedback?.nextSteps?.[0] || "Repeat the interview and focus on one improvement.",
      };
      const nextHistory = [attempt, ...history].slice(0, 5);
      setHistory(nextHistory);
      try {
        window.localStorage.setItem(
          SPEAKING_HISTORY_KEY,
          JSON.stringify(nextHistory),
        );
      } catch {
        setError("Your result is ready, but this browser could not save attempt history.");
      }
    } catch (reviewError) {
      setError(reviewError.message || "Speaking review failed.");
    } finally {
      setIsEvaluating(false);
    }
  }

  function saveCurrentAnswer(part, question, nextStep) {
    if (response.trim().length < 10) {
      setError("Say or type a little more before continuing.");
      return;
    }

    const nextAnswers = [
      ...answers,
      { part, question, answer: response.trim() },
    ];
    setAnswers(nextAnswers);
    setResponse("");
    setError("");
    setInterimTranscript("");

    if (nextStep === "part2") {
      setPhase("part2-intro");
      setQuestionIndex(0);
    } else if (nextStep === "part3") {
      setPhase("part3");
      setQuestionIndex(0);
    } else if (typeof nextStep === "number") {
      setQuestionIndex(nextStep);
    } else {
      evaluateInterview(nextAnswers);
    }
  }

  function startInterview() {
    setPhase("part1");
    setQuestionIndex(0);
    setAnswers([]);
    setPrepNotes("");
    setResponse("");
    setFeedback(null);
    setError("");
  }

  function retryEvaluation() {
    evaluateInterview(answers);
  }

  const currentPart =
    phase === "part1"
      ? 1
      : phase.startsWith("part2")
        ? 2
        : phase === "part3"
          ? 3
          : 0;
  const currentQuestion =
    phase === "part1"
      ? SPEAKING_PART_ONE[questionIndex]
      : phase === "part3"
        ? SPEAKING_PART_THREE[questionIndex]
        : SPEAKING_CUE_CARD;
  const timerLabel =
    remainingSeconds === null
      ? ""
      : `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  return (
    <div className="view-content speaking-view">
      <section className="speaking-hero">
        <div className="speaking-hero-copy">
          <p className="section-kicker">IELTS speaking · mock interview</p>
          <h1>Find your voice.<br /><em>Then sharpen it.</em></h1>
          <p className="view-subtitle">
            Three parts, real pacing, and a focused debrief built around your own answers.
          </p>
          {phase === "welcome" && (
            <button type="button" className="speaking-start-button" onClick={startInterview}>
              Start full mock interview <span aria-hidden="true">→</span>
            </button>
          )}
          <span className="speaking-privacy-note">
            About 11 minutes · Answers are sent to the AI evaluator; only band estimates and next drills are saved on this device.
          </span>
        </div>
        <div className="speaking-hero-mark" aria-hidden="true">
          <span>THE IELTS<br />SPEAKING ROOM</span>
          <strong>01<span>/</span>03</strong>
          <i />
        </div>
      </section>

      <div className="speaking-workspace">
        <main className="speaking-main">
          {phase === "welcome" && (
            <section className="speaking-welcome-panel">
              <div className="speaking-part-list">
                <div><b>01</b><span><strong>Part 1</strong><small>Quick questions · 3 prompts</small></span><em>4 min</em></div>
                <div><b>02</b><span><strong>Part 2</strong><small>One-minute prep · long turn</small></span><em>3 min</em></div>
                <div><b>03</b><span><strong>Part 3</strong><small>Deeper discussion · 3 prompts</small></span><em>4 min</em></div>
              </div>
              <div className="speaking-welcome-foot">
                <AppIcon name="speaking" size={22} />
                <p>Use voice dictation or type naturally. Your transcript is sent to the configured AI evaluator for feedback; pronunciation needs audio analysis and is not scored here.</p>
              </div>
            </section>
          )}

          {phase !== "welcome" && phase !== "review" && (
            <section className="speaking-session-panel">
              <div className="speaking-progress-row">
                <div className="speaking-progress-steps" aria-label={`Part ${currentPart} of 3`}>
                  {[1, 2, 3].map((part) => (
                    <span className={part <= currentPart ? "complete" : ""} key={part}>{`0${part}`}</span>
                  ))}
                </div>
                <span>PART {currentPart} <i>/</i> 03</span>
              </div>

              {phase === "part2-intro" && (
                <div className="speaking-prep-intro">
                  <p className="section-kicker">Your long turn</p>
                  <h2>Take a breath. Build your story.</h2>
                  <p>You have one minute to prepare, then up to two minutes to speak. Jot down a few keywords while the timer runs.</p>
                  <blockquote>{SPEAKING_CUE_CARD}</blockquote>
                  <button type="button" className="speaking-start-button" onClick={() => {
                    setPhase("part2-prep");
                    setRemainingSeconds(60);
                    setTimerRunning(true);
                  }}>
                    Start 1-minute prep <span aria-hidden="true">→</span>
                  </button>
                </div>
              )}

              {(phase === "part2-prep" || phase === "part2-answer") && (
                <div className="speaking-timer-row">
                  <div><span>{phase === "part2-prep" ? "PREPARATION" : "YOUR LONG TURN"}</span><strong>{timerLabel}</strong></div>
                  <p>{phase === "part2-prep" ? "Make a quick plan: situation, challenge, turning point, result." : "Keep developing your example. The timer is a guide, not a score."}</p>
                </div>
              )}

              {phase === "part2-prep" && (
                <div className="speaking-prep-workbench">
                  <div className="speaking-prep-cue">
                    <span>CUE CARD</span>
                    <p>{SPEAKING_CUE_CARD}</p>
                  </div>
                  <label className="speaking-answer-field">
                    <span>Quick notes <b>For your eyes only</b></span>
                    <textarea
                      className="speaking-prep-textarea"
                      value={prepNotes}
                      onChange={(event) => setPrepNotes(event.target.value)}
                      placeholder="Keywords only: situation, challenge, turning point, result..."
                      rows={4}
                    />
                  </label>
                </div>
              )}

              {(phase === "part1" || phase === "part2-answer" || phase === "part3") && (
                <>
                  <div className="speaking-question-block">
                    <span>{phase === "part2-answer" ? "CUE CARD" : `QUESTION 0${questionIndex + 1}`}</span>
                    <h2>{currentQuestion}</h2>
                    {phase === "part2-answer" && <p>Speak for up to two minutes. Give a clear example and explain why it mattered.</p>}
                  </div>

                  <label className="speaking-answer-field">
                    <span>Your answer <b>{response.trim() ? response.trim().split(/\s+/).length : 0} words</b></span>
                    <textarea
                      value={response}
                      onChange={(event) => setResponse(event.target.value)}
                      placeholder="Answer aloud with dictation, or type what you would say..."
                      rows={7}
                    />
                  </label>
                  {interimTranscript && <p className="speaking-interim">Listening: {interimTranscript}</p>}

                  <div className="speaking-composer-actions">
                    <button type="button" className={`speaking-dictate-button ${isListening ? "listening" : ""}`} onClick={toggleDictation}>
                      <AppIcon name="speaking" size={18} />
                      {isListening ? "Stop dictation" : "Dictate answer"}
                    </button>
                    <button type="button" className="speaking-next-button" disabled={isListening} onClick={() => {
                      if (phase === "part1") {
                        saveCurrentAnswer("Part 1", currentQuestion, questionIndex + 1 < SPEAKING_PART_ONE.length ? questionIndex + 1 : "part2");
                      } else if (phase === "part2-answer") {
                        setTimerRunning(false);
                        saveCurrentAnswer("Part 2", SPEAKING_CUE_CARD, "part3");
                      } else {
                        saveCurrentAnswer("Part 3", currentQuestion, questionIndex + 1 < SPEAKING_PART_THREE.length ? questionIndex + 1 : "finish");
                      }
                    }}>
                      {phase === "part3" && questionIndex === SPEAKING_PART_THREE.length - 1 ? "Finish interview" : "Save & continue"}
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                  <p className="speaking-dictation-note">
                    {speechAvailable ? "Voice input uses your browser’s speech recognition; audio handling depends on your browser." : "Voice recognition is unavailable here. Type your answer to continue."}
                    {phase === "part2-answer" && " Pronunciation is not scored from the transcript."}
                  </p>
                </>
              )}
            </section>
          )}

          {phase === "review" && (
            <section className="speaking-review-panel">
              {isEvaluating ? (
                <div className="speaking-review-loading"><span className="speaking-pulse" /><p>Reading your answers across all three parts...</p></div>
              ) : feedback ? (
                <>
                  <div className="speaking-review-heading"><p className="section-kicker">Your practice debrief</p><span>Transcript-based estimate · not an official IELTS score</span></div>
                  <FeedbackPanel feedback={feedback} />
                  <div className="speaking-practice-drill">
                    <span>NEXT REP</span>
                    <p>{feedback.nextSteps?.[0] || "Repeat one answer and add a specific example plus a reflection."}</p>
                  </div>
                  <button type="button" className="speaking-start-button" onClick={startInterview}>Run it back <span aria-hidden="true">↻</span></button>
                </>
              ) : (
                <div className="speaking-review-error">
                  <p className="section-kicker">The interview is saved in this session</p>
                  <h2>Couldn’t reach the evaluator.</h2>
                  <p>{error || "Try the review again when the AI service is available."}</p>
                  <button type="button" className="speaking-start-button" onClick={retryEvaluation} disabled={isEvaluating}>Retry feedback <span aria-hidden="true">→</span></button>
                  <button type="button" className="clear-button" onClick={startInterview}>Start a new interview</button>
                </div>
              )}
            </section>
          )}

          {error && phase !== "review" && <p className="speaking-error" role="alert">{error}</p>}
        </main>

        <aside className="speaking-aside">
          <section className="speaking-aside-section">
            <p className="section-kicker">Session map</p>
            {["Warm-up", "Long turn", "Discussion"].map((label, index) => (
              <div className={`speaking-map-item ${currentPart > index + 1 ? "done" : currentPart === index + 1 ? "active" : ""}`} key={label}>
                <span>{currentPart > index + 1 ? "✓" : `0${index + 1}`}</span>
                <div><b>{label}</b><small>{["3 short answers", "60s prep · 120s speak", "3 follow-up questions"][index]}</small></div>
              </div>
            ))}
          </section>
          <section className="speaking-aside-section speaking-history-section">
            <p className="section-kicker">Recent attempts</p>
            {history.length === 0 ? (
              <p className="speaking-history-empty">Your score trend will appear after your first interview. Only band estimates and next drills are stored on this device.</p>
            ) : history.map((attempt, index) => (
              <div className="speaking-history-item" key={attempt.id}>
                <span>{index === 0 ? "LATEST" : new Date(attempt.date).toLocaleDateString()}</span>
                <strong>{attempt.bandScore.toFixed(1)}</strong>
                {index === 0 && history[1] && <small>{attempt.bandScore > history[1].bandScore ? "↑" : attempt.bandScore < history[1].bandScore ? "↓" : "="} vs previous</small>}
              </div>
            ))}
          </section>
          {history[0]?.nextStep && (
            <section className="speaking-aside-drill">
              <span>LAST FOCUS</span>
              <p>{history[0].nextStep}</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function LinguAIBridgeApp() {
  const router = useRouter();
  const params = useSearchParams();
  const requestedView = params.get("view");
  const activeView = navigation.some((item) => item.id === requestedView) ? requestedView : "overview";
  const setActiveView = (view) => router.push(view === "overview" ? "/" : `/?view=${view}`);

  return (
    <div className="app-frame">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <div className="app-main">
        <Topbar activeView={activeView} />
        {activeView === "overview" && <Overview onNavigate={setActiveView} />}
        {activeView === "listening" && <ListeningWorkspace />}
        {activeView === "reading" && <ReadingWorkspace />}
        {activeView === "writing" && <SkillStudio key="writing" skill="writing" />}
        {activeView === "speaking" && <SpeakingStudio key="speaking" />}
      </div>
    </div>
  );
}
