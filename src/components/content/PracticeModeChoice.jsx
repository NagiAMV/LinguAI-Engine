function ModeIcon({ exam = false }) {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{exam ? <><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9 2h6M12 2v3M18.5 6.5 20 5"/></> : <><path d="M12 5.5C9 3.5 5.5 3.5 3 4.5v14c3-1 6-1 9 1 3-2 6-2 9-1v-14c-2.5-1-6-1-9 1Z"/><path d="M12 5.5v14M6 8h3M6 11h3M15 8h3M15 11h3"/></>}</svg>;
}

export default function PracticeModeChoice({ test, questionCount, hasAnswers, onTraining, onExam, onNew }) {
  return <section className="exam-start practice-mode-start" aria-labelledby="practice-mode-title">
    <div className="practice-mode-heading"><p className="section-kicker">YOUR NEXT STEP</p><h2 id="practice-mode-title">{test.title}</h2><p className="practice-mode-intro">A little practice or the full challenge?<br/>Choose how you want to learn today.</p><div className="practice-mode-meta"><span>{test.parts.length} {test.parts.length === 1 ? 'part' : 'parts'}</span><span>{questionCount} questions</span><span>{test.durationMinutes || 60} min exam</span></div></div>
    <div className="listening-mode-picker practice-mode-grid">
      <button type="button" className="practice-mode-card practice-mode-training" onClick={onTraining}>
        <span className="practice-mode-card-top"><span className="practice-mode-icon"><ModeIcon/></span><span className="practice-mode-badge">AT YOUR OWN PACE</span></span>
        <span className="practice-mode-name">Training Mode</span><span className="practice-mode-description">Take your time. Understand every answer.</span>
        <span className="practice-mode-features"><span><i aria-hidden="true">✓</i> No timer, no pressure</span><span><i aria-hidden="true">✓</i> Explanations when you need them</span><span><i aria-hidden="true">✓</i> Tap any word for a translation</span></span>
        <span className="practice-mode-action">{hasAnswers ? 'Continue training' : 'Start training'}<span aria-hidden="true">↗</span></span>
      </button>
      <button type="button" className="practice-mode-card practice-mode-exam" onClick={onExam}>
        <span className="practice-mode-card-top"><span className="practice-mode-icon"><ModeIcon exam/></span><span className="practice-mode-badge">TEST YOURSELF</span></span>
        <span className="practice-mode-name">Exam Mode</span><span className="practice-mode-description">Find your focus. See where you stand.</span>
        <span className="practice-mode-features"><span><i aria-hidden="true">✓</i> {test.durationMinutes || 60}-minute timed session</span><span><i aria-hidden="true">✓</i> Independent practice</span><span><i aria-hidden="true">✓</i> Full review after submission</span></span>
        <span className="practice-mode-action">{hasAnswers ? 'Continue exam' : 'Start exam'}<span aria-hidden="true">↗</span></span>
      </button>
    </div>
    <div className="practice-mode-footnote"><span aria-hidden="true">{hasAnswers ? '↺' : '◇'}</span><p>{hasAnswers ? 'Your saved answers are ready. Continue above or start a new attempt.' : 'Your answers save automatically on this device.'}</p>{hasAnswers && <button type="button" onClick={onNew}>New attempt ↗</button>}</div>
  </section>;
}
