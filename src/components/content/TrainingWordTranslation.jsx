"use client";
import { useEffect, useRef, useState } from 'react';
import VocabularyWordDetails from './VocabularyWordDetails';

const translations = new Map();
export default function TrainingWordTranslation({ root, enabled }) {
  const [lookup, setLookup] = useState(null);
  const sequence = useRef(0);
  useEffect(() => {
    if (!enabled) { sequence.current++; setLookup(null); return; }
    const container = root.current;
    async function click(event) {
      if (event.target.closest('.training-word-translation')) return;
      sequence.current++;
      setLookup(null);
      if (!event.target.closest('.cd-content, .listening-training-review') || event.target.closest('input, select, button, textarea, a, audio, summary') || container.classList.contains('highlight-mode') || window.getSelection()?.toString().trim()) return;
      const position = document.caretPositionFromPoint?.(event.clientX, event.clientY);
      const range = !position && document.caretRangeFromPoint?.(event.clientX, event.clientY);
      const node = position?.offsetNode || range?.startContainer;
      const offset = position?.offset ?? range?.startOffset;
      if (node?.nodeType !== Node.TEXT_NODE || !container.contains(node)) return;
      let found;
      for (const match of node.textContent.matchAll(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)) {
        if (offset >= match.index && offset <= match.index + match[0].length) { found = match; break; }
      }
      if (!found) return;
      const bounds = document.createRange();
      bounds.setStart(node, found.index); bounds.setEnd(node, found.index + found[0].length);
      const rect = bounds.getBoundingClientRect();
      if (event.clientX < rect.left - 2 || event.clientX > rect.right + 2 || event.clientY < rect.top - 2 || event.clientY > rect.bottom + 2) return;
      // Translating label text must not also select its associated answer.
      event.preventDefault();
      const word = found[0].toLowerCase(), current = sequence.current;
      const box = { word, x: Math.max(8, Math.min(rect.left, window.innerWidth - 288)), y: rect.bottom + 160 < innerHeight ? rect.bottom + 8 : Math.max(8, rect.top - 150) };
      if (translations.has(word)) { setLookup({ ...box, ...translations.get(word) }); return; }
      setLookup({ ...box, loading: true });
      try {
        const response = await fetch(`/api/dictionary/translate?word=${encodeURIComponent(word)}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (result.saved !== false) translations.set(word, { ...result, source: 'local' });
        if (current === sequence.current) setLookup({ ...box, ...result });
      } catch {
        if (current === sequence.current) setLookup({ ...box, error: true });
      }
    }
    const dismiss = event => { if (event?.type === 'scroll' && event.target?.closest?.('.training-word-translation')) return; sequence.current++; setLookup(null); };
    const key = event => { if (event.key === 'Escape') dismiss(); };
    document.addEventListener('click', click);
    document.addEventListener('keydown', key);
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    return () => { dismiss(); document.removeEventListener('click', click); document.removeEventListener('keydown', key); window.removeEventListener('scroll', dismiss, true); window.removeEventListener('resize', dismiss); };
  }, [enabled, root]);
  async function expand() {
    if (lookup.expanded) { sequence.current++; setLookup({ ...lookup, expanded: false }); return; }
    const current = sequence.current, word = lookup.word;
    const box = { ...lookup, expanded: true, y: Math.min(lookup.y, 80), x: Math.max(8, Math.min(lookup.x, innerWidth - 428)) };
    if (lookup.entry?.definition || lookup.detailsLoaded) { setLookup(box); return; }
    setLookup({ ...box, detailsLoading: true });
    try {
      const response = await fetch(`/api/dictionary/translate?word=${encodeURIComponent(word)}&details=1`);
      const result = await response.json();
      if (!response.ok) throw new Error('Details unavailable');
      if (result.saved !== false) translations.set(word, { ...result, source: 'local' });
      if (current === sequence.current) setLookup({ ...box, ...result, detailsLoading: false });
    } catch { if (current === sequence.current) setLookup({ ...box, detailsLoading: false, detailsError: true }); }
  }
  if (!enabled || !lookup) return null;
  return <aside className={`training-word-translation${lookup.expanded ? ' is-expanded' : ''}`} style={{ left: lookup.x, top: lookup.y }} aria-label="Word translation" aria-live="polite"><button type="button" aria-label="Close translation" onClick={() => { sequence.current++; setLookup(null); }}>×</button><strong>{lookup.word}</strong><p>{lookup.loading ? 'Перевожу…' : lookup.error ? 'Перевод недоступен. Нажмите на слово ещё раз.' : lookup.translation}</p>{lookup.translation && <><small>{lookup.source === 'local' ? 'Локальный словарь' : 'Онлайн-перевод · MyMemory'} · EN → RU</small>{lookup.saved === false && <small className="vocabulary-save-warning">Не удалось сохранить на сервере. Перевод доступен в этой карточке.</small>}<div className="vocabulary-expand"><button type="button" aria-expanded={Boolean(lookup.expanded)} onClick={expand}>{lookup.expanded ? 'Свернуть ↑' : 'Подробнее о слове ↓'}</button></div></>}{lookup.expanded && (lookup.detailsLoading ? <p>Загружаю сведения…</p> : lookup.detailsError ? <p>Не удалось загрузить сведения. Сверните и попробуйте снова.</p> : <VocabularyWordDetails entry={lookup.entry}/>)}</aside>;
}
