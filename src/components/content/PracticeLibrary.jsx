"use client";
import {useEffect} from 'react';
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import listening from '@/data/practice-listening-catalog.json';
import reading from '@/data/practice-reading-catalog.json';
import SinglePracticeLibrary, {SinglePracticeGrid} from './SinglePracticeLibrary';
export default function PracticeLibrary({resource}){
 const params=useSearchParams(),label=resource==='reading'?'Reading':'Listening',practice=resource==='reading'?reading:listening;
 useEffect(()=>{try{for(const key of Object.keys(localStorage))if(/^linguai-cd-(?:reading|listening)-\d+-\d+(?:-history)?$/.test(key))localStorage.removeItem(key);}catch{}},[]);
 if(params.get('format')==='single')return <SinglePracticeLibrary resource={resource}/>;
 return <div className="view-content reading-view">
  <section className="library-hero reading-hero"><div><p className="section-kicker blue">{label} collection</p><h1>Your {resource} collection.</h1><p className="view-subtitle">{resource==='reading'?'Passages, questions and answer review, ready to practise right here.':'Questions, recordings and answer review. All in one place.'}</p></div><div className="library-orbit blue"><span>{resource==='reading'?'R':'L'}</span></div></section>
  <nav className="single-practice-filters" aria-label="Practice format"><Link href={`/?view=${resource}`} aria-current="page">Full tests</Link><Link href={`/?view=${resource}&format=single`}>Single {resource==='reading'?'passages':'sections'}</Link></nav>
  <section aria-label={`${label} practice tests`} className="listening-practice-collection"><div className="reading-library-toolbar"><span className="section-kicker">{resource==='reading'?'Full reading tests':'Listening practice'}</span><span className="catalog-status live"><span/>{practice.length} tests</span></div><div className="cd-test-grid">{practice.map(item=><Link className="cd-test-card" href={`/practice/${resource}/${item.number}`} key={item.id}><span className="section-kicker">{label.toUpperCase()} PRACTICE</span><strong>{item.title}</strong><span>{item.topics}</span><small>{item.partCount} parts · {item.questionCount} questions{resource==='listening'?' · Full recording':''}</small><span className="cd-key-status complete">Answer checking available</span><b>Open test ↗</b></Link>)}</div>{!practice.length&&<div className="panel"><h2>No tests added yet</h2><p>Your practice tests will appear here.</p></div>}</section>
  <SinglePracticeGrid resource={resource} embedded/>
 </div>;
}
