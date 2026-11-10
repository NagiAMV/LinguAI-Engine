'use client';
import {useState} from 'react';
export default function WritingFeedback({feedback,text,onFind}){
 const [correction,setCorrection]=useState(null);
 const match=correction===null?null:feedback.corrections[correction];
 const start=match?text.indexOf(match.original):-1;
 return <section className="writing-review" aria-label="Writing feedback"><div className="writing-review-heading"><div><p className="section-kicker">YOUR NEXT DRAFT STARTS HERE</p><h2>Practice band <strong>{feedback.bandScore}</strong></h2></div><span>AI estimate · not an official score</span></div><p>{feedback.summary}</p>
 <div className="writing-criteria">{Object.entries(feedback.criteria).map(([name,value])=><article key={name}><div><h3>{name}</h3>{Number.isFinite(feedback.criterionBands?.[name])&&<b>{feedback.criterionBands[name]}</b>}</div><p>{value}</p></article>)}</div>
 <div className="writing-feedback-columns"><section><h3>Keep doing this</h3><ul>{feedback.strengths.map((s,i)=><li key={i}>{s}</li>)}</ul></section><section><h3>Work on next</h3><ul>{feedback.improvements.map((s,i)=><li key={i}>{s}</li>)}</ul></section></div>
 <h3>Inside your response</h3><p>Select a correction to see the exact passage in your response.</p><div className="writing-corrections">{feedback.corrections.map((c,i)=><article key={i}><button type="button" aria-pressed={correction===i} onClick={()=>{setCorrection(i);onFind(c.original);}}>Locate correction {i+1} ↗</button><span className="writing-correction-kind">{c.kind==='style'?'Optional refinement':c.kind?c.kind[0].toUpperCase()+c.kind.slice(1):'Suggested improvement'}</span>{c.kind==='style'?<blockquote>{c.original}</blockquote>:<del>{c.original}</del>}<p className="writing-corrected">{c.corrected}</p><p>{c.explanation}</p></article>)}</div>
 {match&&<div className="writing-response-preview" aria-live="polite"><h3>Your original response</h3><p>{start<0?text:<>{text.slice(0,start)}<mark>{match.original}</mark>{text.slice(start+match.original.length)}</>}</p></div>}
 {feedback.revisedResponse&&<details className="writing-revision"><summary>Explore a revised version</summary><p>This example preserves your ideas. Compare the choices, then write your own revision.</p><div>{feedback.revisedResponse}</div></details>}
 <h3>Your next three steps</h3><ol>{feedback.nextSteps.slice(0,3).map((s,i)=><li key={i}>{s}</li>)}</ol></section>;
}
