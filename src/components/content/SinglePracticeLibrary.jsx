"use client";
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import reading from '@/data/single-passage-reading-catalog.json';
import listening from '@/data/single-section-listening-catalog.json';
export function SinglePracticeGrid({resource}){
 const params=useSearchParams(),isReading=resource==='reading',catalog=isReading?reading:listening,count=isReading?3:4;
 const requested=Number(params.get('part')),selected=requested>=1&&requested<=count?requested:0,partName=isReading?'Passage':'Section';
 const rows=catalog.filter(item=>!selected||(isReading?item.passageNumber:item.sectionNumber)===selected);
 const groups=Array.from({length:count},(_,index)=>index+1).filter(number=>!selected||number===selected).map(number=>({number,items:rows.filter(item=>(isReading?item.passageNumber:item.sectionNumber)===number)})).filter(group=>group.items.length);
 const url=part=>`/?view=${resource}&format=single${part?'&part='+part:''}`;
 return <section aria-label={isReading?'Single-passage reading collection':'Single-section listening collection'} className="listening-practice-collection">
  <div className="reading-library-toolbar"><span className="section-kicker">{isReading?'Single-passage reading':'Single-section listening'}</span><span className="catalog-status">{rows.length} {isReading?'passages':'sections'}</span></div>
  <nav className="single-practice-filters" aria-label={`${partName} filters`}><Link href={url(0)} aria-current={!selected?'page':undefined}>All</Link>{Array.from({length:count},(_,i)=>i+1).map(n=><Link href={url(n)} key={n} aria-current={selected===n?'page':undefined}>{partName} {n}<span>{catalog.filter(item=>(isReading?item.passageNumber:item.sectionNumber)===n).length}</span></Link>)}</nav>
  <div className="single-practice-groups">{groups.map(group=><section className="single-practice-group" aria-labelledby={`single-${resource}-group-${group.number}`} key={group.number}><header className="single-practice-group-heading"><h2 id={`single-${resource}-group-${group.number}`}>{partName} {group.number}</h2><span>{group.items.length} {isReading?'passages':'exercises'}</span></header><div className="cd-test-grid">{group.items.map(item=><Link key={item.id} className="cd-test-card" href={`/practice/${resource}/single/${item.number}`}><span className="section-kicker">{partName.toUpperCase()} {group.number}</span><strong>{item.title}</strong>{item.topic&&<span>{item.topic}</span>}<small>{item.questionCount} questions · {item.durationMinutes} minutes{isReading?'':' · Section recording'}</small><b>Open {isReading?'passage':'section'} ↗</b></Link>)}</div></section>)}</div>{!rows.length&&<p>No {isReading?'passages':'sections'} in this group yet.</p>}
 </section>;
}
export default function SinglePracticeLibrary({resource}){
 const reading=resource==='reading';
 return <div className="view-content reading-view"><section className="library-hero reading-hero"><div><p className="section-kicker blue">{reading?'Reading · Single passages':'Listening · Single sections'}</p><h1>{reading?'One passage at a time.':'One section at a time.'}</h1><p className="view-subtitle">{reading?'Choose Passage 1, 2 or 3 and practise one text with its questions.':'Choose Section 1, 2, 3 or 4. Each exercise has its own recording and answer sheet.'}</p></div><div className="library-orbit blue"><span>{reading?'R':'L'}</span></div></section><nav className="single-practice-filters" aria-label="Practice format"><Link href={`/?view=${resource}`}>Full tests</Link><Link href={`/?view=${resource}&format=single`} aria-current="page">Single {reading?'passages':'sections'}</Link></nav><SinglePracticeGrid resource={resource}/></div>;
}
