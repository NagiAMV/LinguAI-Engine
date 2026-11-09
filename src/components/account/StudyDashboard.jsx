'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useAccount} from './AccountProvider';
import {buildStudyDashboard,readActivities,durationLabel,localDay} from '@/lib/study-dashboard.mjs';
import StudyRecommendations from './StudyRecommendations';
import './study-dashboard.css';

export default function StudyDashboard(){
 const {attempts,user,ready,profile}=useAccount();const owner=user?.id||'guest';
 const [activities,setActivities]=useState([]),[now,setNow]=useState(null),[selected,setSelected]=useState('');
 useEffect(()=>{const refresh=()=>{setActivities(readActivities(undefined,owner));setNow(new Date());};refresh();window.addEventListener('focus',refresh);window.addEventListener('storage',refresh);window.addEventListener('linguai-study-activity',refresh);const timer=setInterval(refresh,60000);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('storage',refresh);window.removeEventListener('linguai-study-activity',refresh);};},[owner]);
 if(!ready||!now)return <div className="study-loading" role="status">Loading your study dashboard…</div>;
 const data=buildStudyDashboard(attempts,activities,now),day=selected||data.today,rows=data.events.filter(a=>localDay(a.finished_at)===day),peak=Math.max(60,...data.week.map(d=>d.seconds));
 return <div className="study-dashboard">
  <div className="study-top-grid">
   <section className="study-card study-readiness" aria-labelledby="readiness-title"><div className="study-card-heading"><div><p className="section-kicker">Your latest assessments</p><h2 id="readiness-title">Current readiness</h2></div><span className="study-target">Target {Number(profile.targetBand||7).toFixed(1)}</span></div>
    <div className="study-overall"><strong>{data.overall==null?'—':data.overall.toFixed(1)}</strong><span>{data.overall==null?'Build your baseline':'Practice band estimate'}<small>{data.overall==null?'Complete an assessment in each skill.':'Based on your latest four skill estimates.'}</small></span></div>
    <div className="study-skill-scores">{data.scores.map(s=><Link key={s.skill} href={`/?view=${s.skill}`} className={`study-score ${s.skill}`}><span>{s.skill}</span><strong>{s.band??'—'}</strong><div className="study-score-track"><i style={{width:`${s.band==null?0:String(s.band).startsWith('<')?25:Number(s.band)/9*100}%`}}/></div><small>{s.date?new Intl.DateTimeFormat('en',{day:'numeric',month:'short'}).format(new Date(s.date)):'Not assessed'}</small></Link>)}</div>
    <p className="study-footnote">Listening & Reading use complete 40-question tests. Writing & Speaking show saved AI practice estimates.</p>
   </section>
   <section className="study-card study-momentum" aria-labelledby="momentum-title"><div className="study-card-heading"><div><p className="section-kicker">This week · Monday–Sunday</p><h2 id="momentum-title">Momentum map</h2></div><span className="study-streak">{data.streak} day{data.streak===1?'':'s'}<small>streak</small></span></div>
    <div className="study-week-chart" aria-label="Weekly recorded practice activity">{data.week.map(d=><button type="button" key={d.key} disabled={d.future} aria-pressed={day===d.key} aria-label={`${d.key}: ${durationLabel(d.seconds)}, ${d.count} activities`} onClick={()=>setSelected(d.key)}><span className="study-day-bar"><i style={{height:d.seconds?`${Math.max(5,d.seconds/peak*100)}%`:d.count?'5%':'0%'}}/>{!d.count&&<em/>}</span><b>{new Intl.DateTimeFormat('en',{weekday:'narrow'}).format(new Date(d.date))}</b><small>{new Date(d.date).getDate()}</small></button>)}</div>
    <div className="study-week-total"><strong>{durationLabel(data.weekSeconds)}</strong><span>recorded · {data.weekCount} activit{data.weekCount===1?'y':'ies'}</span></div><p className="study-footnote">Select a day to see its history. Time includes completed tests and finished speaking timers; draft updates have no time estimate.</p>
   </section>
  </div>
  <section className="study-card study-day-history" aria-labelledby="day-history-title"><div className="study-card-heading"><div><p className="section-kicker">Your learning journal</p><h2 id="day-history-title">{day===data.today?'Today’s activity':'Activity by day'}</h2></div><label className="study-date-label">Choose date<input type="date" aria-label="Activity date" value={day} max={data.today} onChange={e=>{if(e.target.value)setSelected(e.target.value);}}/></label></div>
   {rows.length?<ol className="study-timeline">{rows.map(row=><li key={`${row.kind}:${row.id}`}><time dateTime={row.finished_at}>{new Intl.DateTimeFormat('en',{hour:'2-digit',minute:'2-digit'}).format(new Date(row.finished_at))}</time><span className={`study-event-dot ${row.resource}`} aria-hidden="true"/><div><Link href={row.href}>{row.title} ↗</Link><p>{row.resource} · {row.kind==='draft'?'Draft updated':row.kind==='review'?'AI review saved':row.kind==='speaking-drill'?'Speaking timer completed':'Test submitted'}{row.kind==='test'?` · ${row.correct}/${row.total}`:''}{row.band!=null?` · Band ${row.band}`:''}{row.word_count!=null?` · ${row.word_count} words`:''}{row.duration_seconds>0?` · ${durationLabel(row.duration_seconds)}`:''}</p></div></li>)}</ol>:<div className="study-empty"><span aria-hidden="true">↗</span><h3>{day===data.today?'A fresh page for today.':'No saved activity on this day.'}</h3><p>Submitted tests, new draft updates and completed speaking timers appear here.</p><Link href="/?view=listening">Start a practice →</Link></div>}
   <p className="study-footnote">Dates follow your device’s time zone. Writing and speaking activity is stored on this device; test history uses your existing account history.</p>
  </section>
  <StudyRecommendations attempts={attempts} dashboard={data} owner={owner} language={profile.language||'en'} target={profile.targetBand||7}/>
 </div>;
}
