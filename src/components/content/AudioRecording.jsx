"use client";
import { useEffect, useRef, useState } from 'react';

function clock(time) { const seconds=Math.max(0,Math.floor(time||0));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`; }
export default function AudioRecording({ part, position=0, onPosition, sourceUrl, locked=false, fullTest=false, precise=false, seekRequest=null, examMode=false }) {
 const audio=useRef(null), resume=useRef(position), allowed=useRef(position);
 const [sourceIndex,setSourceIndex]=useState(0), [status,setStatus]=useState('Loading recording…');
 const [started,setStarted]=useState(false), [elapsed,setElapsed]=useState(position), [duration,setDuration]=useState(0);
 const urls=part.audioUrls||[];
 useEffect(()=>{
  const player=audio.current;if(!player||locked||examMode||!seekRequest||!Number.isFinite(seekRequest.time))return;
  resume.current=Math.max(0,seekRequest.time);
  const seek=()=>{player.currentTime=Math.min(resume.current,Number.isFinite(player.duration)?Math.max(0,player.duration-.05):Infinity);onPosition?.(player.currentTime);player.play().catch(()=>setStatus('Position selected — press Play to listen.'));};
  if(player.readyState>=1)seek();else player.addEventListener('loadedmetadata',seek,{once:true});
  return()=>player.removeEventListener('loadedmetadata',seek);
 },[seekRequest,sourceIndex,locked,onPosition,examMode]);
 useEffect(()=>{
  const player=audio.current;if(!precise||!player||!onPosition)return;
  let timer;const stop=()=>clearInterval(timer),start=()=>{stop();timer=setInterval(()=>onPosition(player.currentTime),80);};
  player.addEventListener('playing',start);player.addEventListener('pause',stop);player.addEventListener('ended',stop);
  return()=>{stop();player.removeEventListener('playing',start);player.removeEventListener('pause',stop);player.removeEventListener('ended',stop);};
 },[precise,onPosition,sourceIndex]);
 useEffect(()=>{if(locked)audio.current?.pause();},[locked]);
 if(!urls.length)return <p className="exam-audio-state" role="status">No recording was supplied for this test yet.</p>;
 function play(){audio.current?.play().catch(()=>setStatus('Press Start recording to enable audio.'));}
 function failed(event){resume.current=event.currentTarget.currentTime||resume.current;if(sourceIndex+1<urls.length){setStatus('Trying backup recording…');setSourceIndex(sourceIndex+1);}else setStatus('Could not load recording');}
 return <>
  <span className="recording-label">{fullTest?'Full test recording · Parts 1–4':`Part ${part.id} recording`}</span>
  <div className={`recording-controls${examMode?' recording-exam':''}`}>
   <audio ref={audio} className={examMode?'exam-audio-source':undefined} src={urls[sourceIndex]} controls={!locked&&!examMode} controlsList="nodownload" disableRemotePlayback autoPlay={examMode&&!locked} preload="metadata" aria-label={fullTest?'Full test recording':`Part ${part.id} recording`}
    onLoadedMetadata={event=>{const p=event.currentTarget;setDuration(Number.isFinite(p.duration)?p.duration:0);if(resume.current>0)p.currentTime=Math.min(resume.current,p.duration||resume.current);allowed.current=p.currentTime;onPosition?.(p.currentTime);setStatus('Ready to play');}}
    onPlay={event=>{if(locked)event.currentTarget.pause();else{setStarted(true);setStatus('Playing');}}}
    onPause={event=>{if(examMode&&started&&!locked&&!event.currentTarget.ended){play();return;}setStatus('Paused');}}
    onEnded={()=>setStatus('Recording ended')} onWaiting={()=>setStatus('Buffering…')} onPlaying={()=>setStatus('Playing')} onError={failed}
    onRateChange={event=>{if(examMode&&event.currentTarget.playbackRate!==1)event.currentTarget.playbackRate=1;}}
    onSeeking={event=>{const p=event.currentTarget;if(examMode&&started&&Math.abs(p.currentTime-allowed.current)>1){p.currentTime=allowed.current;return;}onPosition?.(p.currentTime);}}
    onSeeked={event=>onPosition?.(event.currentTarget.currentTime)}
    onTimeUpdate={event=>{const p=event.currentTarget;if(examMode&&p.seeking)return;resume.current=p.currentTime;allowed.current=p.currentTime;setElapsed(p.currentTime);onPosition?.(precise?p.currentTime:Math.floor(p.currentTime));}}/>
   {examMode?<div className="recording-exam-progress">{!started&&<button type="button" className="button" disabled={locked} onClick={play}>Start recording</button>}<span>{clock(elapsed)} / {clock(duration)}</span><progress value={elapsed} max={duration||1} aria-label="Recording progress"/><small>Exam Mode · playback locked</small></div>:null}
  </div>
  <p className="exam-audio-state" role="status">{status}</p>
  {status==='Could not load recording'&&<><button type="button" disabled={locked} onClick={()=>{setStatus('Loading recording…');if(sourceIndex)setSourceIndex(0);else audio.current?.load();}}>Retry recording</button>{sourceUrl&&<a href={sourceUrl} target="_blank" rel="noreferrer">Open source recording ↗</a>}</>}
 </>;
}
