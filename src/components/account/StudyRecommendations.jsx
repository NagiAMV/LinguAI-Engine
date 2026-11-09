'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {practiceIdeas} from '@/lib/practice-ideas.mjs';
import {progressSummary} from '@/lib/account-model.mjs';
import {cleanErrorTags,ERROR_TAGS} from '../content/error-tags.mjs';
import reading from '@/data/single-passage-reading-catalog.json';
import listening from '@/data/single-section-listening-catalog.json';

export default function StudyRecommendations({attempts,dashboard,owner,language,target}){
 const [available,setAvailable]=useState(false),[busy,setBusy]=useState(false),[saved,setSaved]=useState(null),[error,setError]=useState(''),[errors,setErrors]=useState({});const generation=useRef(0);
 const ideas=practiceIdeas(attempts,{reading,listening}),stats=progressSummary(attempts);
 const summary={language,target:Number(target),weekCount:dashboard.weekCount,weekSeconds:Math.min(dashboard.weekSeconds,6048000),skills:dashboard.scores.map(s=>({skill:s.skill,band:s.band==null?null:String(s.band).startsWith('<')?'< 2.5':Number(s.band),accuracy:stats[s.skill]?.accuracy??null,count:Math.min(2000,stats[s.skill]?.count??s.count)})),errors};
 const fingerprint=JSON.stringify(summary),cacheKey=`linguai-study-plan-v1:${owner}`;
 useEffect(()=>{const controller=new AbortController();fetch('/api/ai/recommendations',{signal:controller.signal,cache:'no-store'}).then(r=>r.json()).then(r=>setAvailable(r.available===true)).catch(()=>{});return()=>controller.abort();},[]);
 useEffect(()=>{generation.current++;setBusy(false);setError('');setSaved(null);const counts=Object.fromEntries(ERROR_TAGS.map(tag=>[tag,0]));for(const id of new Set(attempts.map(a=>a.test_id))){try{const key=owner==='guest'?`linguai-cd-${id}`:`linguai-cd-account:${owner}:${id}`;const session=JSON.parse(localStorage.getItem(key)||'{}');for(const tags of Object.values(cleanErrorTags(session.errorTags)))for(const tag of tags)counts[tag]++;}catch{}}setErrors(counts);try{const cached=JSON.parse(localStorage.getItem(cacheKey)||'null');if(cached?.plan&&Array.isArray(cached.plan.steps))setSaved(cached);}catch{}},[owner,attempts,cacheKey]);
 useEffect(()=>()=>{generation.current++;},[]);
 async function generate(){const id=++generation.current;setBusy(true);setError('');try{const response=await fetch('/api/ai/recommendations',{method:'POST',headers:{'Content-Type':'application/json'},body:fingerprint,signal:AbortSignal.timeout(80000)}),result=await response.json();if(!response.ok)throw Error(result.error||'Could not generate a plan.');if(generation.current!==id)return;const value={...result,fingerprint};setSaved(value);try{localStorage.setItem(cacheKey,JSON.stringify(value));}catch{}}catch(e){if(generation.current===id)setError(e.message);}finally{if(generation.current===id)setBusy(false);}}
 const current=saved?.fingerprint===fingerprint;
 return <section className="study-card study-recommendations" aria-labelledby="study-recommendations-title"><div className="study-card-heading"><div><p className="section-kicker">Know what to practise next</p><h2 id="study-recommendations-title">Your next steps</h2></div><span className={`study-coach-status ${available?'connected':''}`}>{available?'AI coach connected':'Based on your results'}</span></div>
  <div className="study-coach-box"><div><h3>Your personal AI coach</h3><p>{available?'Get a focused plan using your scores, weekly activity and saved error tags. Only these summaries are sent when you request it.':'Your result-based recommendations work now. Personal AI plans will become available when the server API is connected.'}</p></div><button className="primary-action" disabled={!available||busy} onClick={generate}>{busy?'Building your plan…':saved?'Refresh AI plan ↗':'Create my AI plan ↗'}</button></div>
  {error&&<p className="study-coach-error" role="alert">{error}</p>}
  {saved&&<div className="study-ai-plan"><p className="study-plan-summary">{saved.plan.summary}</p><small>{current?'Based on your current summary':'Your results changed — refresh this plan.'} · Generated {new Date(saved.generatedAt).toLocaleString()}</small><div className="study-recommendation-grid">{saved.plan.steps.map((step,i)=><article key={i}><span className="study-step-number">0{i+1}</span><h3>{step.title}</h3><p>{step.reason}</p><p>{step.action}</p><Link href={`/?view=${['reading','listening','writing','speaking'].includes(step.skill)?step.skill:'overview'}`}>{step.minutes} min · Open {step.skill} →</Link></article>)}</div></div>}
  <div className="study-recommendation-grid">{ideas.map((idea,i)=><article key={`${idea.resource}:${idea.part}:${idea.kind}`}><span className="study-step-number">0{i+1}</span><h3>{idea.title}</h3><p>{idea.detail}</p><p>{idea.hint}</p><Link href={idea.href}>{idea.action} →</Link>{idea.reviewHref&&<Link className="study-review-link" href={idea.reviewHref}>Review latest attempt ↗</Link>}</article>)}</div>
 </section>;
}
