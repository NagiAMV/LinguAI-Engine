"use client";

import { useRouter } from "next/navigation";
import { restoreSession, transition, remaining, countdown } from "./exam-session.mjs";
import { useEffect, useMemo, useRef, useState } from "react";
import "./practice-exam.css";
import ExamResults from "./ExamResults";
import PracticeModeChoice from "./PracticeModeChoice";
import { buildReviewRows } from "./answer-review.mjs";
import Recording from "./AudioRecording";
import { layoutMapQuestions, arrangeImportedMaps } from "./map-layout.mjs";
import { enhanceReadingQuestions, syncReadingAnswers } from "./reading-questions.mjs";
import { enhanceListeningQuestions, syncListeningQuestions } from "./listening-questions.mjs";
import TextHighlights from "./TextHighlights";
import TrainingWordTranslation from "./TrainingWordTranslation";
import HighlightTools from "./HighlightTools";
import ExamNotes from "./ExamNotes";
import { prepareQuestionNavigation, syncActiveQuestion, focusAnswerField, adjacentQuestion } from './question-navigation.mjs';
import { useAccount } from '@/components/account/AccountProvider';
import { HIGHLIGHT_COLORS, validHighlight, selectionSnapshot, annotationId, uncoveredHighlights, withoutSelectedHighlights, highlightAtPoint } from "./exam-annotations.mjs";

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
function AnswerFields({ html, answers, onAnswer, onFocusQuestion, onStepQuestion, activeNumber, activeName, partQuestions, locked, highlights, part, area, reading, listeningGroups }) {
  const root = useRef(null);
  const markup = useMemo(() => ({ __html: layoutMapQuestions(html) }), [html]);
  useEffect(() => {
    arrangeImportedMaps(root.current);
    if(reading && area === "questions")enhanceReadingQuestions(root.current);
    if(!reading && area === "questions")enhanceListeningQuestions(root.current,listeningGroups);
    prepareQuestionNavigation(root.current,partQuestions,listeningGroups);
    syncActiveQuestion(root.current,activeNumber,activeName);
    for (const input of root.current.querySelectorAll("input[name], select[name]")) {
      input.disabled = locked;
      const value = answers[input.name];
      if (input.type === "checkbox") input.checked = Array.isArray(value) && value.includes(input.value);
      else if (input.type === "radio") input.checked = value === input.value;
      else if (input.value !== (typeof value === "string" ? value : "")) input.value = typeof value === "string" ? value : "";
    }
    if(reading && area === "questions")syncReadingAnswers(root.current);
    if(!reading && area === "questions")syncListeningQuestions(root.current);
  }, [html, answers, locked, reading, area, listeningGroups]);
  useEffect(() => { syncActiveQuestion(root.current,activeNumber,activeName); }, [html,activeNumber,activeName]);
  function keyDown(event) {
    const field = event.target;
    if (!locked && field.dataset.answerValue && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) {
      const buttons = [...field.parentElement.querySelectorAll('button:not(:disabled)')];
      const direction = ['ArrowLeft','ArrowUp'].includes(event.key) ? -1 : 1;
      buttons[(buttons.indexOf(field)+direction+buttons.length)%buttons.length]?.focus();
      event.preventDefault();
      return;
    }
    if (locked || event.key !== 'Tab' || event.ctrlKey || event.altKey || event.metaKey || !field.name) return;
    // Native radio/checkbox keyboard navigation remains available for choosing options.
    if (field.type === 'radio' || field.type === 'checkbox') return;
    if (onStepQuestion(field.name,event.shiftKey ? -1 : 1)) event.preventDefault();
  }
  function change(event) {
    const input = event.target;
    if (locked || !input.name) return;
    if (input.type === "checkbox") {
      const values = [...root.current.querySelectorAll('input[type="checkbox"]')]
        .filter((field) => field.name === input.name && field.checked).map((field) => field.value);
      onAnswer(input.name, values);
    } else onAnswer(input.name, input.value);
  }
  return <><TextHighlights root={root} highlights={highlights} part={part} area={area} revision={html} /><div ref={root} data-annotation-area={area} className="cd-content cd-questions" onInput={change} onKeyDown={keyDown} onFocus={(event) => onFocusQuestion(event.target.name)} dangerouslySetInnerHTML={markup} /></>;
}

export default function ExamPlayer(props) {
  const { ready, user } = useAccount();
  if (!ready) return <main translate="no" className="exam-loading notranslate" role="status">Loading your workspace…</main>;
  return <AccountExamPlayer key={`${user?.id || 'guest'}:${props.test.id}`} {...props} owner={user?.id} />;
}
function AccountExamPlayer({ test, answerKey, explanations, owner }) {
  const router = useRouter();
  const backUrl = test.backUrl || `/?view=${test.resource}`;
  const [now, setNow] = useState(Date.now());
  const [modal, setModal] = useState(null);
  const [history, setHistory] = useState([]);
  const [fontSize, setFontSize] = useState(16);
  const [theme, setTheme] = useState("light");
  const [highlightMode, setHighlightMode] = useState(false);
  const [eraseMode, setEraseMode] = useState(false);
  const [nightLight, setNightLight] = useState(false);
  useEffect(() => { const stop = event => { if(event.key === "Escape") { setHighlightMode(false); setEraseMode(false); setSelection(null); } }; window.addEventListener("keydown",stop); return () => window.removeEventListener("keydown",stop); }, []);
  const [highlightColor, setHighlightColor] = useState("yellow");
  const [selection, setSelection] = useState(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState("passage");
  const [split, setSplit] = useState(50);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenMessage, setFullscreenMessage] = useState("");
  const shell = useRef(null);
  const storageKey = owner ? `linguai-cd-account:${owner}:${test.id}` : `linguai-cd-${test.id}`;
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [saveError, setSaveError] = useState("");
  const current = useRef(null);
  const workspace = useRef(null);
  const dialog = useRef(null);
  useEffect(() => {
    const footer=shell.current?.querySelector('.exam-bottom');
    if(!footer)return;
    const measure=()=>shell.current?.style.setProperty('--exam-footer-height',footer.getBoundingClientRect().height+'px');
    measure();const observer=new ResizeObserver(measure);observer.observe(footer);
    return()=>observer.disconnect();
  }, [session?.phase]);
  const [jump, setJump] = useState(null);
  const [trainingReveal, setTrainingReveal] = useState(null);
  const [translationEnabled, setTranslationEnabled] = useState(true);
  useEffect(() => { try { const prefs=JSON.parse(localStorage.getItem('linguai-exam-display')||'{}'); if(['light','dark'].includes(prefs.theme))setTheme(prefs.theme);if(HIGHLIGHT_COLORS.includes(prefs.color))setHighlightColor(prefs.color);setNightLight(prefs.nightLight===true); } catch {} }, []);
  function displayPreference(nextTheme,nextColor,nextNightLight=nightLight) { setTheme(nextTheme);setHighlightColor(nextColor);setNightLight(nextNightLight);try { localStorage.setItem('linguai-exam-display',JSON.stringify({theme:nextTheme,color:nextColor,nightLight:nextNightLight})); } catch {} }
  const label = test.resource === "reading" ? "Reading" : "Listening";
  useEffect(() => {
    const index = questionIndex(test);
    setQuestions(index);
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(storageKey) || "{}") || {}; }
    catch { setSaveError("Browser storage is unavailable. Keep this page open to retain your answers."); }
    // Older worksheet attempts stored one string per answer slot; native choose-N
    // controls store the selected letters together without losing those answers.
    if (saved.answers && typeof saved.answers === 'object') {
      for (const group of test.nativeAnswerGroups || []) {
        if (!Array.isArray(saved.answers[group.target])) {
          saved.answers[group.target] = group.sources.map(name => saved.answers[name]).filter(value => typeof value === 'string' && value.trim());
        }
      }
    }
    const partIndex = Number.isInteger(saved.partIndex) && saved.partIndex >= 0 && saved.partIndex < test.parts.length ? saved.partIndex : 0;
    const startedAt = Number.isFinite(saved.startedAt) && saved.startedAt > 0 ? saved.startedAt : Date.now();
    const restored = restoreSession({
      ...saved,
      durationMs: (test.durationMinutes || 60) * 60 * 1000,
      answers: saved.answers && typeof saved.answers === "object" && !Array.isArray(saved.answers) ? saved.answers : {},
      partIndex, startedAt,
      finishedAt: Number.isFinite(saved.finishedAt) && saved.finishedAt >= startedAt ? saved.finishedAt : null,
      flags: Array.isArray(saved.flags) ? saved.flags : [],
      highlights: Array.isArray(saved.highlights) ? saved.highlights.filter(validHighlight) : [],
      notes: Array.isArray(saved.notes) ? saved.notes.filter(n=>n&&typeof n.id==="string"&&typeof n.body==="string"&&typeof n.quote==="string"&&Number.isInteger(n.part)) : [],
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
    persist(restoreSession({ activeQuestion: questions[0]?.id, durationMs: (test.durationMinutes || 60) * 60 * 1000 }));
    setModal(null);
  }
  useEffect(() => {
    if (!jump || !workspace.current) return;
    focusAnswerField(workspace.current,jump);
    setJump(null);
  }, [jump, session?.partIndex, test.resource, mobilePane]);
  useEffect(() => {
    shell.current?.querySelector('.exam-question-nav button[aria-current="true"]:not(.exam-part-tab)')?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
  }, [session?.activeQuestion]);
  if (!session) return <main translate="no" className="exam-loading notranslate" role="status">Preparing your exam workspace…</main>;
  const { answers, partIndex, activeQuestion, flags, highlights = [], notes = [] } = session;
  const finishedAt = session.phase === "submitted";
  const isListening = test.resource === 'listening';
  const locked = session.phase !== "running" || (session.mode !== 'training' && now >= session.deadline);
  const part = test.parts[partIndex];
  function captureSelection(event) {
    if(locked || event.target.closest("button,input,select,textarea,.selection-tools,.exam-notes"))return;
    if(highlightMode&&eraseMode){
      const element=event.target.closest('[data-annotation-area]');
      if(!element||!workspace.current?.contains(element))return;
      const saved=current.current.highlights||[];
      const hit=highlightAtPoint(element,saved,part.id,element.dataset.annotationArea,event.clientX,event.clientY);
      if(hit)update({highlights:saved.filter(item=>item.id!==hit.id)});
      window.getSelection()?.removeAllRanges();setSelection(null);return;
    }
    const selected=window.getSelection();if(!selected?.rangeCount || selected.isCollapsed){setSelection(null);return;}
    const range=selected.getRangeAt(0);const element=(range.startContainer.nodeType===1?range.startContainer:range.startContainer.parentElement)?.closest("[data-annotation-area]");
    if(!element||!workspace.current?.contains(element)){setSelection(null);return;}
    const snapshot=selectionSnapshot(element,range,part.id,element.dataset.annotationArea);if(!snapshot)return;
    if(highlightMode){ saveHighlight(snapshot); window.getSelection()?.removeAllRanges(); setSelection(null); return; }
    const rect=range.getBoundingClientRect();setSelection({...snapshot,x:Math.max(12,Math.min(rect.left,window.innerWidth-250)),y:Math.max(60,Math.min(rect.bottom+8,window.innerHeight-160))});
  }
  function saveHighlight(snapshot) {
    const saved = current.current.highlights || [];
    const additions = uncoveredHighlights(snapshot,saved).map(item=>({id:annotationId(),part:item.part,area:item.area,start:item.start,end:item.end,text:item.text,color:highlightColor}));
    if(additions.length)update({highlights:[...saved,...additions]});
  }
  function removeSelectedHighlights() {
    if(!selection||locked)return;
    update({highlights:withoutSelectedHighlights(current.current.highlights||[],selection)});
    window.getSelection()?.removeAllRanges();setSelection(null);
  }
  function annotate(kind) {
    if(!selection||locked)return;
    const id=annotationId();
    if(kind==="highlight")saveHighlight(selection);
    else {update({notes:[...notes,{id,part:selection.part,quote:selection.text,body:""}]});setNotesOpen(true);}
    window.getSelection()?.removeAllRanges();setSelection(null);
  }
  const answered = questions.filter((q) => hasAnswer(q, answers)).length;
  const active = questions.find((q) => q.id === activeQuestion);
  const trainingRows = session.mode === 'training' ? buildReviewRows(test, questions, answers, [], answerKey) : [];
  const trainingRow = trainingRows.find(row => row.questionNumbers.some(n => Number(n) === Number(active?.number)) && row.part === part?.id);
  const trainingDetail = trainingRow && (explanations[trainingRow.numbers] || explanations[active?.number]);
  function showTrainingEvidence(quote) {
    const transcript = shell.current?.querySelector(test.resource === 'listening' ? '.listening-training-transcript' : '[data-annotation-area="passage"]');
    if (!transcript || !quote) return;
    if (transcript.tagName === 'DETAILS') transcript.open = true;
    const walker = document.createTreeWalker(transcript, NodeFilter.SHOW_TEXT);
    const positions = []; let text = '';
    const normal = char => char.toLowerCase().replace(/[’‘]/g, "'");
    while (walker.nextNode()) {
      const node = walker.currentNode;
      for (let i = 0; i < node.textContent.length; i++) {
        const char = /\s/.test(node.textContent[i]) ? ' ' : normal(node.textContent[i]);
        if (char === ' ' && text.endsWith(' ')) continue;
        text += char; positions.push({node, offset:i});
      }
    }
    const target = normal(quote).replace(/\s+/g, ' ').trim(), offset = text.indexOf(target);
    if (offset < 0) return;
    const first = positions[offset], last = positions[offset + target.length - 1];
    const range = document.createRange(); range.setStart(first.node, first.offset); range.setEnd(last.node, last.offset + 1);
    first.node.parentElement?.scrollIntoView({block:'center', behavior:'smooth'});
    window.getSelection()?.removeAllRanges(); window.getSelection()?.addRange(range);
  }

  function goTo(question) {
    if (locked || !question) return;
    setSelection(null);
    if(test.resource === 'reading')setMobilePane(test.parts[question.partIndex].passage.includes(`name="${question.name}"`)?'passage':'questions');
    update({ partIndex: question.partIndex, activeQuestion: question.id });
    setJump(question);
  }
  function focusQuestion(name) {
    if (locked || !name || active?.name === name) return;
    const question = questions.find((q) => q.partIndex === partIndex && q.name === name);
    if (question) update({ activeQuestion: question.id });
  }
  function stepQuestion(name,direction) {
    const next = adjacentQuestion(questions,name,partIndex,direction);
    if (!next) return false;
    goTo(next);
    return true;
  }
  const fieldProps = { activeNumber:active?.number, activeName:active?.name, partQuestions:questions.filter(q=>q.partIndex===partIndex), onStepQuestion:stepQuestion, listeningGroups:answerKey?.parts?.[part.id]?.groups || [], reading:test.resource === "reading", answers, locked, highlights, part:part.id, onAnswer: (name, value) => update({ answers: { ...current.current.answers, [name]: value } }), onFocusQuestion: focusQuestion };
  return <main ref={shell} translate="no" data-theme={theme} data-night-light={nightLight?'on':'off'} onPointerUp={captureSelection} onKeyUp={captureSelection} style={{ "--exam-font-size": `${fontSize}px`, "--exam-split": `${split}%` }} className={`practice-exam notranslate ${highlightMode && !locked ? "highlight-mode" : ""} ${test.id.startsWith("single-listening-") ? "single-listening-exam" : ""} ${test.id.startsWith("single-reading-") ? "single-passage-exam" : ""} ${test.resource === 'listening' ? 'imported-listening' : ''} ${finishedAt ? "exam-finished" : ""}`}>
    <header className="exam-header">
      <button className="exam-utility exam-back" title="Back to collection" aria-label="Back to collection" onClick={() => session.phase === "running" ? setModal("exit") : router.push(backUrl)}>←</button>
      <div className="exam-identity"><h1>{test.title}</h1><p>{label} · {finishedAt ? "Results" : `Part ${part.id}`}</p></div><span className="exam-saved" title={`${answered} of ${questions.length} answered · Saved on this device`} aria-label={`${answered} of ${questions.length} answered · Saved on this device`}>●</span>
      <details className="exam-settings"><summary aria-label="Display settings" title="Display settings">Aa</summary><div className="exam-settings-popover"><label>Text size<select aria-label="Text size" value={fontSize} onChange={event=>setFontSize(Number(event.target.value))}><option value={16}>Normal</option><option value={18}>Large</option><option value={20}>Extra large</option></select></label><label>Theme<select aria-label="Exam theme" value={theme} onChange={event=>displayPreference(event.target.value,highlightColor)}><option value="light">Light</option><option value="dark">Dark</option></select></label><fieldset><legend>Highlight colour</legend><div className="highlight-palette">{HIGHLIGHT_COLORS.map(color=><button key={color} className={"highlight-dot "+color} aria-label={color+" highlight"} aria-pressed={highlightColor===color} onClick={()=>displayPreference(theme,color)} />)}</div></fieldset></div></details>{!finishedAt && <HighlightTools enabled={highlightMode} locked={locked} color={highlightColor} fontSize={fontSize} eraseMode={eraseMode} onEraseMode={setEraseMode} onToggle={()=>{setHighlightMode(value=>!value);setEraseMode(false);setSelection(null);window.getSelection()?.removeAllRanges();}} onColor={color=>{displayPreference(theme,color);setEraseMode(false);}} onFontSize={setFontSize}/>}<button className="exam-utility exam-notes-toggle" aria-label="Open notes" aria-pressed={notesOpen} onClick={()=>setNotesOpen(!notesOpen)}>Notes{notes.length>0?` ${notes.length}`:""}</button><button className="exam-utility exam-fullscreen" title={fullscreen ? "Exit fullscreen" : "Enter fullscreen"} aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"} onClick={toggleFullscreen}>⛶</button>
      {((session.mode === 'training' && session.phase === 'running') || finishedAt) && <button type="button" className="exam-utility exam-translate-toggle" aria-pressed={translationEnabled && !highlightMode} title="Tap a word in the questions to translate it" onClick={() => { setTranslationEnabled(!translationEnabled || highlightMode); setHighlightMode(false); window.getSelection()?.removeAllRanges(); }}>Translate{translationEnabled && !highlightMode ? ' on' : ' off'}</button>}
      <button type="button" className="exam-utility exam-night-light-toggle" aria-pressed={nightLight} title="Optional softer display colours" onClick={()=>displayPreference(theme,highlightColor,!nightLight)}>☼ Night Light{nightLight?' on':''}</button>
      <button type="button" className="exam-utility exam-theme-toggle" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} onClick={() => displayPreference(theme === 'light' ? 'dark' : 'light', highlightColor)}>{theme === 'light' ? '☾ Dark' : '☀ Light'}</button>
      {session.phase !== 'ready' && session.mode !== 'training' && <div className={`exam-timer ${remaining(session, now) <= 300000 ? "exam-time-low" : ""}`}><strong role="timer" aria-label="Time remaining">{countdown(remaining(session, now))}</strong></div>}
      {finishedAt ? <button className="button cd-secondary" onClick={() => setModal("new")}>New attempt</button> : null}
    </header>
    {(fullscreenMessage || saveError) && <div className="exam-status" role="status">{saveError || fullscreenMessage}{!saveError && <button aria-label="Dismiss message" onClick={() => setFullscreenMessage("")}>×</button>}</div>}
    {session.phase === "ready" ? <PracticeModeChoice test={test} questionCount={questions.length} hasAnswers={Object.keys(answers).length > 0} onTraining={() => dispatch({ type: "start", mode: "training" })} onExam={() => { dispatch({ type: "start", mode: "exam" }); if (!document.fullscreenElement) toggleFullscreen(); }} onNew={() => setModal("new")} /> : finishedAt ? <ExamResults explanations={explanations} test={test} answerKey={answerKey} questions={questions} answers={answers} flags={flags} session={session} answered={answered} onToggleErrorTag={(key,tag)=>dispatch({type:"tag-error",key,tag})} /> : <>
      {test.resource === 'reading' && <nav className="reading-mobile-tabs" aria-label="Reading view">{[['passage','Text'],['questions','Questions']].map(([value,title])=><button key={value} aria-pressed={mobilePane===value} onClick={()=>setMobilePane(value)}>{title}</button>)}</nav>}
      <div data-mobile-pane={mobilePane} ref={workspace} className={`cd-columns exam-workspace ${test.resource}`}>
        <article className={`cd-pane ${test.resource === "listening" ? "exam-recording-bar" : ""}`} aria-label={test.resource === "reading" ? `Part ${part.id} passage` : test.audioScope === 'test' ? 'Full test recording' : `Part ${part.id} recording`} key={test.audioScope === 'test' ? 'full-recording' : `content-${part.id}`}>
          {test.resource === "listening" ? <Recording examMode={session.mode === 'exam'} locked={locked} part={test.audioScope === 'test' ? test.parts[0] : part} fullTest={test.audioScope === 'test'} sourceUrl={test.sourceUrl} position={session.audioTimes[test.audioScope === 'test' ? 'full' : part.id] || 0} onPosition={(value) => { const audioId = test.audioScope === 'test' ? 'full' : part.id; if (current.current.audioTimes[audioId] !== value) update({ audioTimes: { ...current.current.audioTimes, [audioId]: value } }); }} /> : <><AnswerFields html={part.passage} area="passage" {...fieldProps} /></>}
        </article>
        <div className={`exam-divider ${test.resource === "listening" ? "exam-divider-hidden" : ""}`} role="separator" aria-label="Resize passage and questions" aria-orientation="vertical" aria-valuemin={30} aria-valuemax={70} aria-valuenow={split} tabIndex={locked ? -1 : 0} onKeyDown={(event) => { if (["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); setSplit((value) => Math.max(30, Math.min(70, value + (event.key === "ArrowLeft" ? -2 : 2)))); } }} onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) { const bounds = workspace.current.getBoundingClientRect(); setSplit(Math.max(30, Math.min(70, (event.clientX - bounds.left) / bounds.width * 100))); } }} onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)} />
        <article className="cd-pane" aria-label={`Part ${part.id} questions`} key={`questions-${part.id}`}><AnswerFields html={part.questions} area="questions" {...fieldProps} /></article>
      </div>

        {test.parts.length > 1 && <nav className="exam-part-arrows exam-part-arrows-floating" aria-label="Switch part"><button type="button" aria-label="Previous part" title="Previous part" disabled={locked || partIndex === 0} onClick={() => goTo(questions.find(q => q.partIndex === partIndex - 1))}><span aria-hidden="true">←</span></button><span aria-live="polite">Part {part.id}<small> / {test.parts.length}</small></span><button type="button" aria-label="Next part" title="Next part" disabled={locked || partIndex === test.parts.length - 1} onClick={() => goTo(questions.find(q => q.partIndex === partIndex + 1))}><span aria-hidden="true">→</span></button></nav>}
      <footer className="exam-bottom">
        <nav className="exam-question-nav" aria-label="Question navigation" style={{"--part-count":test.parts.length}}>{test.parts.map((item,index)=><section className={"exam-question-group "+(index===partIndex?"current-part":"")} key={item.id} style={{"--part-slot":index+1}}><button className="exam-part-tab" aria-expanded={index===partIndex} disabled={locked} aria-current={index===partIndex?"true":undefined} onClick={()=>goTo(questions.find(q=>q.partIndex===index))}>Part {item.id}</button>{index===partIndex && <div>{questions.filter(q=>q.partIndex===index).map(q=><button key={q.id} disabled={locked} className={[(hasAnswer(q,answers)?"answered":""),(flags.includes(q.id)?"flagged":"")].join(" ")} aria-label={"Question "+q.number+", "+(hasAnswer(q,answers)?"answered":"unanswered")+(flags.includes(q.id)?", flagged":"")} aria-current={q.id===activeQuestion?"true":undefined} onClick={()=>goTo(q)}>{q.number}{flags.includes(q.id)&&<sup>⚑</sup>}</button>)}</div>}</section>)}</nav>

        <button className="exam-flag" title={"Flag question " + active?.number} aria-label={"Flag question " + active?.number} disabled={locked || !active} aria-pressed={flags.includes(activeQuestion)} onClick={() => { const saved = current.current; update({ flags: saved.flags.includes(saved.activeQuestion) ? saved.flags.filter(id=>id!==saved.activeQuestion) : [...saved.flags,saved.activeQuestion] }); }}>⚑</button>
        <button className="button exam-submit" onClick={() => setModal(session.phase === "expired" ? "expired" : "finish")}>Submit</button>
      </footer>
      {session.mode === 'training' && trainingRow?.response?.trim() && <aside className="listening-training-review" aria-live="polite"><button className="button cd-secondary" onClick={() => setTrainingReveal(trainingReveal === trainingRow.name ? null : trainingRow.name)}>{trainingReveal === trainingRow.name ? 'Hide explanation' : 'Show explanation'}</button>{trainingReveal === trainingRow.name && <div><p><strong>{trainingRow.status === 'correct' ? 'Correct' : 'Compare your answer'}</strong> · {trainingRow.display || 'Answer key unavailable'}</p>{trainingDetail ? <><p>{trainingDetail.en}</p>{(trainingDetail.quotes || (trainingDetail.quote ? [trainingDetail.quote] : [])).map((quote,index)=><blockquote key={index}>{quote}{!isListening && <button type="button" onClick={() => showTrainingEvidence(quote)}>{test.resource === 'listening' ? 'Show in transcript ↗' : 'Show in passage ↗'}</button>}</blockquote>)}</> : <p>There is no reviewed explanation for this question yet. The answer key is shown above.</p>}</div>}</aside>}
    </>}
    <TrainingWordTranslation root={shell} enabled={translationEnabled && !highlightMode && ((session.mode === 'training' && session.phase === 'running') || Boolean(finishedAt))} />
    {selection&&!locked&&<div className="selection-tools" style={{left:selection.x,top:selection.y}} role="toolbar" aria-label="Selected text actions" onPointerDown={event=>event.preventDefault()}><button onClick={()=>annotate("highlight")}><span className={"highlight-dot "+highlightColor}/> Highlight</button>{highlights.some(item=>item.part===selection.part&&item.area===selection.area&&item.start<selection.end&&item.end>selection.start)&&<button type="button" onClick={removeSelectedHighlights}>⌫ Remove highlight</button>}<button onClick={()=>annotate("note")}>＋ Add note</button><button aria-label="Dismiss selection tools" onClick={()=>setSelection(null)}>×</button></div>}
    {notesOpen&&<ExamNotes notes={notes} highlights={highlights} locked={locked} onClose={()=>setNotesOpen(false)} onChange={(id,body)=>update({notes:notes.map(n=>n.id===id?{...n,body}:n)})} onRemove={id=>update({notes:notes.filter(n=>n.id!==id)})} onRemoveHighlight={id=>update({highlights:highlights.filter(h=>h.id!==id)})} />}
    {history.length > 0 && (session.phase === "ready" || finishedAt) && <details className="exam-history"><summary>Previous attempts ({history.length})</summary>{history.map((attempt, index) => <details key={index}><summary>Attempt {index + 1} · {new Date(attempt.archivedAt).toLocaleString()}</summary>{test.parts.map((item) => <section key={item.id}><h3>Part {item.id}</h3>{item.fieldNames.map((name) => <p key={name}><strong>{item.fieldLabels?.[name]}: </strong>{Array.isArray(attempt.answers?.[name]) ? attempt.answers[name].join(", ") : attempt.answers?.[name] || "Not answered"}</p>)}</section>)}</details>)}</details>}
    <dialog ref={dialog} className="exam-dialog" aria-labelledby="finish-title" onCancel={(event) => { if (modal === "expired") event.preventDefault(); else setModal(null); }}>
      <h2 id="finish-title">{modal === "expired" ? "Time is up" : modal === "exit" ? "Leave this test?" : modal === "new" ? "Start a new attempt?" : "Submit your answers?"}</h2>
      <p>{modal === "exit" ? "Your answers are saved. The timer will keep running while you are away." : modal === "new" ? `This attempt will be archived with its answers. A new ${test.durationMinutes || 60}-minute attempt will begin when you press Start.` : modal === "expired" ? "Your answers are saved. Editing and audio playback are locked. Submit to review your answers." : (questions.length - answered) + " questions are unanswered. Submission is final; this attempt will become read-only. Review will show your answers alongside available answer keys."}</p>
      <div>{modal !== "expired" && <button className="button cd-secondary" autoFocus onClick={() => setModal(null)}>Cancel</button>}<button className="button" onClick={() => { if (modal === "exit") router.push(backUrl); else if (modal === "new") newAttempt(); else { dispatch({ type: "submit" }); setModal(null); } }}>{modal === "exit" ? "Save and leave" : modal === "new" ? "Archive and create" : "Submit and review"}</button></div>
    </dialog>
  </main>;
}
