"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import keyStatuses from "@/data/cambridge-key-status.json";
import importedCatalog from "@/data/cambridge-import.json";

function KeyStatus({ id }) {
  const coverage = keyStatuses[id];
  const status = coverage?.status || 'missing';
  const text = status === 'complete' ? 'Answer checking available' : status === 'partial' ? 'Partial answer checking' : 'Answer checking not yet available';
  return <span className={`cd-key-status ${status}`}>{text}{status === 'partial' && <small>{coverage.available} / {coverage.total} questions</small>}</span>;
}

export default function CambridgeLibrary({ resource }) {
  const label = resource === "reading" ? "Reading" : "Listening";
  const items = useMemo(() => importedCatalog.items.filter((item) => item.resource === resource), [resource]);
  const books = useMemo(() => [...new Set(items.map((item) => item.bookId))].sort((a,b) => a-b), [items]);
  const router = useRouter();
  const params = useSearchParams();
  const requestedBook = Number(params.get("book"));
  const selectedBook = books.includes(requestedBook) ? requestedBook : null;
  const setSelectedBook = (book) => router.push(`/?view=${resource}${book ? `&book=${book}` : ""}`);
  return <div className="view-content reading-view">
    <section className="library-hero reading-hero"><div><p className="section-kicker blue">{label} collection</p><h1>{selectedBook ? `Cambridge ${selectedBook}. Your next four steps.` : `Your Cambridge ${resource} collection.`}</h1><p className="view-subtitle">{resource === "reading" ? "Original passages and questions, ready to practise right here." : "Original questions, recordings and transcripts. All in one place."}</p></div><div className="library-orbit blue"><span>{resource === "reading" ? "R" : "L"}</span></div></section>
    <div className="reading-library-toolbar"><span className="section-kicker">Academic · Computer-delivered practice</span><span className="catalog-status live"><span />{items.length} imported tests</span>{selectedBook && <button className="text-action" onClick={() => {setSelectedBook(null);}}>← All collections</button>}</div>
    {selectedBook ? <div className="cd-test-grid">{items.filter((item) => item.bookId === selectedBook).sort((a,b) => a.testNumber-b.testNumber).map((item) => <Link className="cd-test-card" key={item.testNumber} href={`/cambridge/${item.bookId}/${resource}/${item.testNumber}`}><span className="section-kicker">CAMBRIDGE {selectedBook} · {label}</span><strong>Test {item.testNumber}</strong><span>{item.partCount} parts · {resource === "listening" ? "Audio & questions" : "Passages & questions"}</span><KeyStatus id={`${resource}-${item.bookId}-${item.testNumber}`} /><b>Open test ↗</b></Link>)}</div> : <div className="reading-library-grid">{books.map((book) => <button className="book-card" key={book} onClick={() => {setSelectedBook(book);window.scrollTo({top:0,behavior:"instant"});}}><span className="book-card-index">Book {book}</span><strong>Cambridge {book}</strong><small>Academic {label}</small><em>{items.filter((item)=>item.bookId===book).length} tests</em><span className="book-resource-placeholder">Open collection ↗</span></button>)}</div>}
    {!books.length && <div className="panel"><h2>Materials are being prepared</h2><p>Imported tests will appear here when available.</p></div>}
  </div>;
}
