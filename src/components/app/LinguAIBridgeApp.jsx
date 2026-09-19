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

const READING_BOOKS = Array.from({ length: 19 }, (_, index) => {
	const number = index + 1;
	return {
		id: number,
		title: `Cambridge ${number}`,
		level: number <= 8 ? "Foundation" : number <= 14 ? "Intermediate" : "Advanced",
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
	"Find a word meaning ‘trustworthy’ in the passage.",
	"Write one idea you would add to the passage.",
];

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
						{item.label}
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
			</div>
		</aside>
	);
}

function Topbar({ activeView }) {
	const title = navigation.find((item) => item.id === activeView)?.label || "Workspace";
	return (
		<header className="app-topbar">
			<div>
				<span className="mobile-context">Workspace / </span>
				<strong>{title}</strong>
			</div>
			<div className="topbar-actions">
				<button type="button" className="icon-button" aria-label="Notifications">♧</button>
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
					<p className="view-subtitle">A little practice today makes exam day feel familiar.</p>
				</div>
				<button type="button" className="primary-action" onClick={() => onNavigate("listening")}>
					Continue practice <span>→</span>
				</button>
			</section>
			<section className="overview-grid">
				<div className="band-card">
					<p className="section-kicker">Your progress</p>
					<h2>Current estimate</h2>
					<div className="band-score">7.5 <span>/ 9.0</span></div>
					<div className="score-legend">
						<span>Listening <b>8.0</b></span>
						<span>Reading <b>7.5</b></span>
						<span>Writing <b>7.0</b></span>
						<span>Speaking <b>7.5</b></span>
					</div>
				</div>
				<div className="weekly-card">
					<p className="section-kicker">This week</p>
					<h2>Keep your momentum.</h2>
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
						<span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
					</div>
					<p className="chart-caption"><b>4h 20m</b> practiced this week</p>
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

	const activeBook = READING_BOOKS.find((book) => book.id === selectedBook) || READING_BOOKS[18];
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
					<h1>Cambridge practice, built for real improvement.</h1>
					<p className="view-subtitle">Choose a collection, open a test, and work through the passage with a focused answer sheet.</p>
				</div>
				<div className="library-orbit blue"><span>R</span></div>
			</section>

			<div className="reading-library-toolbar">
				<div className="mode-switch" role="tablist" aria-label="Reading mode selector">
					<button type="button" className={mode === "training" ? "active" : ""} onClick={() => setMode("training")}>Training mode</button>
					<button type="button" className={mode === "mock" ? "active" : ""} onClick={() => setMode("mock")}>Mock exam</button>
				</div>
				<div className="book-jump">
					<button type="button" onClick={() => selectBook(Math.max(1, selectedBook - 1))} aria-label="Previous book">←</button>
					<span>{activeBook.title}</span>
					<button type="button" onClick={() => selectBook(Math.min(19, selectedBook + 1))} aria-label="Next book">→</button>
				</div>
			</div>

			<div className="reading-library-grid">
				{READING_BOOKS.map((book) => (
					<button type="button" key={book.id} className={`book-card ${book.id === selectedBook ? "selected" : ""}`} onClick={() => selectBook(book.id)}>
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
								<h2>{activeBook.title} · Test {selectedTest}</h2>
							</div>
							<div className="reading-actions">
								<button type="button" onClick={() => setPracticeVisible(false)}>← Library</button>
								<button type="button" onClick={() => changeTest(-1)}>← Prev</button>
								<span className="reading-badge">{mode === "training" ? "Training" : "Exam"}</span>
								<button type="button" onClick={() => changeTest(1)}>Next →</button>
							</div>
						</div>
						<div className="reading-text">{READING_PASSAGE}</div>
					</article>

					<aside className="dictionary-card listening-panel">
						<p className="section-kicker">Answer sheet</p>
						<h3>Questions 1–10</h3>
						<div className="save-state"><span className="save-check">✓</span> {answeredCount} of 10 answered</div>
						<div className="answer-grid listening-grid">
							{READING_QUESTIONS.map((question, index) => (
								<label className="answer-row" key={question}>
									<span className="answer-number">{String(index + 1).padStart(2, "0")}</span>
									<input aria-label={`Question ${index + 1}: ${question}`} value={answers[index]} onChange={(event) => updateAnswer(index, event.target.value)} autoComplete="off" />
								</label>
							))}
						</div>
					</aside>
				</div>
			)}
		</div>
	);
}

function PlaceholderView({ skill }) {
	const copy = {
		reading: ["Reading trainer", "Choose a Cambridge passage and begin."],
		writing: ["Writing studio", "Build an answer worth scoring."],
		speaking: ["Speaking room", "Practice out loud, without pressure."],
	}[skill];

	if (skill === "reading") return <ReadingWorkspace />;

	return (
		<div className="view-content library-view">
			<section className="library-hero">
				<div>
					<p className="section-kicker blue">{copy[0]}</p>
					<h1>{copy[1]}</h1>
					<p className="view-subtitle">Your selected practice workspace will open from the collection cards.</p>
				</div>
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
				{["reading", "writing", "speaking"].includes(activeView) && <PlaceholderView skill={activeView} />}
			</div>
		</div>
	);
}
