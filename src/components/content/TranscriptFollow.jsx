"use client";
import {useEffect,useRef,useState} from 'react';
import {transcriptTime,currentTranscriptIndex} from './transcript-follow.mjs';

export default function TranscriptFollow({root, part, time, language}) {
 const [mode,setMode]=useState({follow:false,colours:false});
 const [meta,setMeta]=useState({entries:[],speakers:[],nodes:[]});
 const previous=useRef(null);
 const ru=language==='ru',uz=language==='uz';
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem('linguai-transcript-display')||'{}');setMode({follow:saved.follow===true,colours:saved.colours===true});}catch{}},[]);
 function choose(key,value){const next={...mode,[key]:value};previous.current=null;setMode(next);try{localStorage.setItem('linguai-transcript-display',JSON.stringify(next));}catch{}}
 useEffect(()=>{
  const passage=root.current?.querySelector('[data-review-passage] .review-content');
  if(!passage)return;
  const paragraphs=[...passage.querySelectorAll('p')].filter(p=>!p.closest('.transcript-source-note,[data-review-feedback]'));
  const nodes=[...new Set([...paragraphs,...passage.querySelectorAll('[data-speaker]')])];
  const speakers=[];
  const entries=[];
  paragraphs.forEach(node=>{
   const start=transcriptTime(node.querySelector('small,time')?.textContent);
   if(start!==null)entries.push({node,start});
  });
  nodes.forEach(node=>{
   const label=node.querySelector('strong,b')?.textContent.trim();
   const speaker=node.dataset.speaker || (label?.endsWith(':')?label.slice(0,-1).trim():null);
   if(speaker){if(!speakers.includes(speaker))speakers.push(speaker);node.dataset.speakerTone=String(speakers.indexOf(speaker)%8);}
  });
  const cues=[...passage.querySelectorAll('[data-cue-start]')].map(node=>({node,start:Number(node.dataset.cueStart),end:Number(node.dataset.cueEnd)}));
  previous.current=null;setMeta({entries:cues.length?cues:entries,speakers,nodes,cues:cues.length>0});
  return()=>nodes.forEach(node=>{node.classList.remove('transcript-current','transcript-speaker');delete node.dataset.speakerTone;});
 },[root,part.id,part.passage]);
 useEffect(()=>{
  meta.nodes.forEach(node=>node.classList.toggle('transcript-speaker',mode.colours&&node.dataset.speakerTone!==undefined));
  let index=mode.follow?currentTranscriptIndex(meta.entries,time,part.transcriptEndSeconds ?? Infinity):-1;
  if(meta.cues && index>=0 && time>=meta.entries[index].end)index=-1;
  if(meta.cues){
   const activeNode=meta.entries[index]?.node;
   activeNode?.classList.add('transcript-spoken');
   if(activeNode && previous.current!==index && activeNode.offsetTop!==meta.entries[previous.current]?.node.offsetTop)activeNode.scrollIntoView({block:'nearest'});
   previous.current=index;
   return ()=>activeNode?.classList.remove('transcript-spoken');
  }
  meta.nodes.forEach(node=>node.classList.toggle('transcript-current',index>=0&&meta.entries[index]?.node===node));
  if(index>=0&&previous.current!==index)meta.entries[index].node.scrollIntoView({block:'nearest',behavior:'smooth'});
  previous.current=index;
 },[meta,mode,time,part.transcriptEndSeconds]);
 return <div className="transcript-follow-controls" data-reading-ui="">
  <label><input type="checkbox" checked={mode.follow&&meta.entries.length>0} disabled={!meta.entries.length} onChange={event=>choose('follow',event.target.checked)} />{ru?'Следить за аудио':uz?'Audio bilan kuzatish':'Follow audio'}</label>
  <label><input type="checkbox" checked={mode.colours&&meta.speakers.length>0} disabled={!meta.speakers.length} onChange={event=>choose('colours',event.target.checked)} />{ru?'Цвета говорящих':uz?'So‘zlovchilar ranglari':'Speaker colours'}</label>
  {meta.cues?<small>{ru?'Подсвечиваются слова, совпавшие с записью.':uz?'Yozuvga mos so‘zlar ajratiladi.':'Highlights words matched to the recording.'}</small>:meta.entries.length>0?<small>{ru?'Подсветка по имеющимся таймкодам абзацев.':uz?'Mavjud abzas vaqt belgilariga ko‘ra ajratiladi.':'Highlights follow the available paragraph timestamps.'}</small>:<small>{ru?'Для этого транскрипта пока нет синхронных таймкодов.':uz?'Bu transkript uchun vaqt belgilari hali yo‘q.':'Synchronized timestamps are not available for this transcript yet.'}</small>}
  {!meta.speakers.length&&<small>{ru?'Голоса в этой расшифровке пока не разделены.':uz?'Bu transkriptda so‘zlovchilar hali ajratilmagan.':'Speakers have not been separated in this transcript yet.'}</small>}
  {part.transcriptSpeakerStatus==='dialogue-context'&&mode.colours&&<small>{ru?'Реплики разделены по контексту диалога; расшифровка остаётся черновой.':uz?'Replikalar suhbat mazmuniga ko‘ra ajratilgan; transkript hali qoralama.':'Turns are labelled from dialogue context; the transcript remains a draft.'}</small>}
  {part.transcriptSpeakerStatus==='audio-automatic'&&mode.colours&&<small className="transcript-speaker-draft">{ru?'Голоса разделены автоматически. Подписи условные; границы реплик приблизительные и могут содержать ошибки.':uz?'Ovozlar avtomatik ajratilgan. Belgilar shartli; replika chegaralari taxminiy va xatolar bo‘lishi mumkin.':'Voices were separated automatically. Labels are anonymous; turn boundaries are approximate and may contain errors.'}</small>}
  {mode.colours&&meta.speakers.length>0&&<div className="transcript-speaker-legend">{meta.speakers.map((speaker,index)=><span key={speaker} data-speaker-tone={index%8}>{speaker.replace(/^Speaker (\d+)$/,ru?'Говорящий $1':uz?'So‘zlovchi $1':'Speaker $1')}</span>)}</div>}
 </div>;
}

