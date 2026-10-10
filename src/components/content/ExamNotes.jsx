"use client";
export default function ExamNotes({ notes, highlights, locked, onChange, onRemove, onRemoveHighlight, onClose }) {
 return <aside className="exam-notes" aria-label="Exam notes">
  <header><div><strong>Notes</strong><span>Saved with this attempt</span></div><button aria-label="Close notes" onClick={onClose}>×</button></header>
  <div className="exam-notes-list">
   {!notes.length && <p className="notes-empty">Select passage or question text and choose “Add note”. Your quotes and notes will stay here.</p>}
   {notes.map(note=><section className="exam-note" key={note.id}><div className="note-meta">Part {note.part}<button disabled={locked} aria-label="Delete note" onClick={()=>onRemove(note.id)}>Delete</button></div>{note.quote&&<blockquote>{note.quote}</blockquote>}<textarea aria-label="Note text" placeholder="Write your thoughts…" value={note.body} disabled={locked} onChange={e=>onChange(note.id,e.target.value)} /></section>)}
   {highlights.length>0&&<details className="notes-highlights"><summary>Highlights ({highlights.length})</summary>{highlights.map(h=><div key={h.id}><span className={'highlight-dot '+h.color}/><span>Part {h.part} · {h.text}</span><button disabled={locked} aria-label="Remove highlight" onClick={()=>onRemoveHighlight(h.id)}>×</button></div>)}</details>}
  </div>
 </aside>;
}
