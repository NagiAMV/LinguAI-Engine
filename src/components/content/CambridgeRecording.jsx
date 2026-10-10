"use client";
import { useEffect, useRef, useState } from "react";

export default function CambridgeRecording({ part, position = 0, onPosition, sourceUrl, locked = false }) {
 const audio = useRef(null);
 const [sourceIndex, setSourceIndex] = useState(0);
 const [status, setStatus] = useState("Loading recording…");
 const resume = useRef(position);
 const urls = part.audioUrls || [];
 useEffect(() => { if (locked) audio.current?.pause(); }, [locked]);
 function failed(event) {
  resume.current = event.currentTarget.currentTime || resume.current;
  if (sourceIndex + 1 < urls.length) { setStatus("Trying backup recording…"); setSourceIndex(sourceIndex + 1); }
  else setStatus("Could not load recording");
 }
 return <>
  <span className="recording-label">Part {part.id} recording</span>
  {/* Inspect the file rather than assuming MP3: some sources actually contain AAC/M4A. */}
  <audio ref={audio} src={urls[sourceIndex]} controls={!locked} preload="metadata" aria-label={`Part ${part.id} recording`}
   onLoadedMetadata={event => { if (resume.current > 0) event.currentTarget.currentTime = Math.min(resume.current, event.currentTarget.duration || resume.current); setStatus("Ready to play"); }}
   onPlay={event => { if (locked) event.currentTarget.pause(); else setStatus("Playing"); }}
   onPause={() => setStatus("Paused")} onEnded={() => setStatus("Recording ended")}
   onWaiting={() => setStatus("Buffering…")} onPlaying={() => setStatus("Playing")}
   onError={failed}
   onTimeUpdate={event => { resume.current = event.currentTarget.currentTime; onPosition?.(Math.floor(resume.current)); }} />
  <p className="exam-audio-state" role="status">{status}</p>
  {status === "Could not load recording" && <><button type="button" disabled={locked} onClick={() => { setStatus("Loading recording…"); if (sourceIndex) setSourceIndex(0); else audio.current?.load(); }}>Retry recording</button> {sourceUrl && <a href={sourceUrl} target="_blank" rel="noreferrer">Open source recording ↗</a>}</>}
 </>;
}
