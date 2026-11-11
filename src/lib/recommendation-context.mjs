import {validFocusStats} from './practice-ideas.mjs';
export const COACH_SKILLS=['listening','reading','writing','speaking'];
export const WRITING_CRITERIA=['Task Achievement','Task Response','Coherence and Cohesion','Lexical Resource','Grammatical Range and Accuracy'];
export function validCoachAction(action,catalogs){if(!action||!COACH_SKILLS.includes(action.skill)||typeof action.title!=='string'||action.title.length>240)return false;const {skill,href}=action;if(['listening','reading'].includes(skill))return catalogs[skill].some(t=>href===`/practice/${skill}/single/${t.number}`);if(skill==='writing')return catalogs.writing.some(t=>href===`/?view=writing&task=${encodeURIComponent(t.id)}`);return catalogs.speaking.some(t=>[1,2,3].some(p=>href===`/?view=speaking&set=${t.n}&part=${p}&practice=1`));}
export function readPracticeContext(storage,owner){
 const writing=[],speaking=[];
 try{for(let i=0;i<storage.length;i++){const key=storage.key(i);if(!key)continue;
  if(key.startsWith(`writing-v3:${owner}:`)){try{const session=JSON.parse(storage.getItem(key));for(const [id,doc] of Object.entries(session.documents||{})){const previous=Array.isArray(session.history)?[...session.history].reverse().find(h=>h.documents?.[id]?.feedback):null,assessment=doc.feedback||previous?.documents[id].feedback;writing.push({id,hasDraft:typeof doc.text==='string'&&!!doc.text.trim(),reviewed:!!doc.feedback,submitted:session.phase==='submitted',bands:Object.fromEntries(Object.entries(assessment?.criterionBands||{}).filter(([k,v])=>WRITING_CRITERIA.includes(k)&&Number.isFinite(v)&&v>=0&&v<=9)),updatedAt:doc.reviewedAt||session.updatedAt||session.submittedAt||0});}}catch{}}
  else if(key.startsWith(`writing-v2:${owner}:`)){try{const doc=JSON.parse(storage.getItem(key));writing.push({id:key.slice(`writing-v2:${owner}:`.length),legacy:true,hasDraft:typeof doc.text==='string'&&!!doc.text.trim(),reviewed:false,submitted:false,bands:{},updatedAt:doc.updatedAt||0});}catch{}}
  else if(key.startsWith(`speaking-studio-v1:${owner}:`)){try{const session=JSON.parse(storage.getItem(key));const [set,part]=key.slice(`speaking-studio-v1:${owner}:`.length).split(':').map(Number);speaking.push({set,part,hasDraft:!!session.transcript?.trim()||!!session.clips?.length,reviewed:!!session.feedback,submitted:session.phase==='submitted',updatedAt:session.submittedAt||session.startedAt||0});}catch{}}
 }}catch{}
 const latest=new Map();for(const doc of writing.sort((a,b)=>(a.legacy?1:0)-(b.legacy?1:0)||new Date(b.updatedAt)-new Date(a.updatedAt)))if(!latest.has(doc.id))latest.set(doc.id,doc);
 return {writing:[...latest.values()],speaking:speaking.sort((a,b)=>b.updatedAt-a.updatedAt)};
}
export function coachContext(attempts,dashboard,practice,catalogs,{language='en',target=7,minutes=30,day='',errors={}}={}){
 const latest=new Map();for(const a of [...attempts].sort((a,b)=>Date.parse(b.finished_at)-Date.parse(a.finished_at)))if(!latest.has(a.test_id))latest.set(a.test_id,a);
 const focus=[];for(const skill of ['listening','reading'])for(let part=1;part<=(skill==='reading'?3:4);part++){
  const rows=[...latest.values()].filter(a=>a.resource===skill&&validFocusStats(a.focus_stats,skill)).flatMap(a=>a.focus_stats.filter(s=>s.part===part)).slice(0,5);
  const checked=rows.reduce((n,s)=>n+s.checked,0);if(checked)focus.push({skill,part,accuracy:Math.round(rows.reduce((n,s)=>n+s.correct,0)/checked*100),unanswered:rows.reduce((n,s)=>n+s.blank,0),count:rows.length});
 }
 const skills=COACH_SKILLS.map(skill=>{const rows=[...latest.values()].filter(a=>a.resource===skill&&a.checked).slice(0,5),total=rows.reduce((n,a)=>n+a.checked,0),score=dashboard.scores.find(s=>s.skill===skill);const docs=practice[skill]||[];
  return {skill,band:score?.band==null?null:String(score.band).startsWith('<')?'< 2.5':Number(score.band),accuracy:total?Math.round(rows.reduce((n,a)=>n+a.correct,0)/total*100):null,count:Math.min(2000,['reading','listening'].includes(skill)?[...latest.values()].filter(a=>a.resource===skill).length:Math.max(docs.filter(d=>d.hasDraft||d.submitted).length,dashboard.events.filter(e=>e.resource===skill&&['review','speaking-drill','writing-session'].includes(e.kind)).length))};
 });
 const grouped=new Map();for(const [criterion,band] of practice.writing.filter(d=>Object.keys(d.bands).length).slice(0,5).flatMap(d=>Object.entries(d.bands))){const list=grouped.get(criterion)||[];list.push(band);grouped.set(criterion,list);}
 const weakCriteria=[...grouped].map(([criterion,bands])=>({criterion,band:Math.round(bands.reduce((n,b)=>n+b,0)/bands.length*2)/2})).sort((a,b)=>a.band-b.band).slice(0,3);
 const pending={writing:practice.writing.filter(d=>d.hasDraft&&!d.reviewed).length,speaking:practice.speaking.filter(d=>d.hasDraft&&!d.reviewed).length};
 const actions={};for(const skill of ['listening','reading']){const worst=focus.filter(f=>f.skill===skill).sort((a,b)=>a.accuracy-b.accuracy)[0],field=skill==='reading'?'passageNumber':'sectionNumber',pool=catalogs[skill].filter(t=>!worst||t[field]===worst.part),next=pool.find(t=>!latest.has(t.id))||pool[0]||catalogs[skill][0];if(next)actions[skill]={skill,title:next.title||`${skill==='reading'?'Reading Passage':'Listening Section'} ${next[field]}`,href:`/practice/${skill}/single/${next.number}`,part:next[field]};}
 const draft=practice.writing.find(d=>d.hasDraft&&!d.reviewed&&catalogs.writing.some(t=>t.id===d.id)),preferReport=weakCriteria[0]?.criterion==='Task Achievement',nextWriting=draft?catalogs.writing.find(t=>t.id===draft.id):catalogs.writing.find(t=>t.task===(preferReport?1:2)&&!practice.writing.some(d=>d.id===t.id&&d.reviewed))||catalogs.writing[0];
 actions.writing={skill:'writing',title:`Task ${nextWriting.task} · ${nextWriting.title}`,href:`/?view=writing&task=${encodeURIComponent(nextWriting.id)}`,part:nextWriting.task};
 const pendingSpeech=practice.speaking.find(d=>d.hasDraft&&!d.reviewed&&catalogs.speaking.some(s=>s.n===d.set)),nextSpeaking=catalogs.speaking.find(s=>s.n===pendingSpeech?.set)||catalogs.speaking.find(s=>!practice.speaking.some(d=>d.set===s.n&&d.reviewed))||catalogs.speaking[0],speechPart=[1,2,3].includes(pendingSpeech?.part)?pendingSpeech.part:2;
 actions.speaking={skill:'speaking',title:`Speaking Part ${speechPart} · ${nextSpeaking.t2}`,href:`/?view=speaking&set=${nextSpeaking.n}&part=${speechPart}&practice=1`,part:speechPart};
 const summary={language,target:Number(target),minutes,day,weekCount:Math.min(5000,dashboard.weekCount),weekSeconds:Math.min(6048000,dashboard.weekSeconds),skills,errors,focus,weakCriteria,pending,nextParts:COACH_SKILLS.map(skill=>({skill,part:actions[skill].part}))};
 return {summary,actions};
}
