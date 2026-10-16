import Link from 'next/link';
import catalog from '@/data/single-passage-reading-catalog.json';

export default function SinglePassageLibrary(){
 return <div className="view-content reading-view">
  <section className="library-hero reading-hero"><div><p className="section-kicker blue">Reading · Single passages</p><h1>One passage at a time.</h1><p className="view-subtitle">Focused reading practice with one text and its questions.</p></div><div className="library-orbit blue"><span>R</span></div></section>
  <div className="reading-library-toolbar"><Link className="text-action" href="/?view=reading">← Full reading tests</Link><span className="catalog-status">{catalog.length} passages</span></div>
  {catalog.length ? <div className="cd-test-grid">{catalog.map(item=><Link key={item.id} className="cd-test-card" href={`/practice/reading/single/${item.number}`}><span className="section-kicker">SINGLE PASSAGE</span><strong>{item.title}</strong><span>{item.questionCount} questions · {item.durationMinutes} minutes</span><b>Open passage ↗</b></Link>)}</div> : <section className="panel" aria-label="No single passages yet"><p className="section-kicker">Single-passage practice</p><h2>Your first passage goes here.</h2><p>No passages added yet. Individual reading texts and their questions will appear in this collection.</p></section>}
 </div>;
}
