"""Locate spoken section announcements around long pauses; retain recognition for audit."""
import json,re,subprocess,time
from pathlib import Path
import numpy as np
from faster_whisper import WhisperModel
model=WhisperModel('small.en',device='cpu',compute_type='int8',cpu_threads=8,download_root='.cache/speech-models',local_files_only=True)
outpath=Path('.cache/80-section-boundaries.json');out=json.loads(outpath.read_text(encoding='utf8')) if outpath.exists() else {}
for path in sorted(Path('.cache/80-audio-source').glob('book-*-test-*.mp3')):
 if path.name in out and len(out[path.name]['starts'])==4:continue
 started=time.time()
 probe=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(path)],capture_output=True,text=True,check=True)
 duration=float(probe.stdout)
 detect=subprocess.run(['ffmpeg','-hide_banner','-i',str(path),'-af','silencedetect=noise=-42dB:d=14','-f','null','-'],capture_output=True,text=True,check=True)
 ends=[float(n) for n in re.findall(r'silence_end: ([\d.]+)',detect.stderr)]
 starts={1:0};audit=[]
 for end in ends:
  if end>duration-15:continue
  clip=max(0,end-.7)
  audio=subprocess.run(['ffmpeg','-v','error','-ss',str(clip),'-i',str(path),'-t','22','-f','f32le','-ac','1','-ar','16000','pipe:1'],capture_output=True,check=True).stdout
  segments,_=model.transcribe(np.frombuffer(audio,dtype=np.float32),beam_size=1,language='en',condition_on_previous_text=False,vad_filter=True)
  segments=list(segments);text=' '.join(s.text for s in segments)
  audit.append({'pauseEnd':end,'text':text})
  match=re.search(r'(?:turn to |now |^|\s)section\s+(two|three|four|[234])\b',text,re.I)
  if match:
   n={'two':2,'three':3,'four':4}.get(match[1].lower(),int(match[1]) if match[1].isdigit() else 0)
   if n not in starts:
    matching=next((s for s in segments if re.search(r'section\s+'+re.escape(match[1])+r'\b',s.text,re.I)),segments[0]);starts[n]=round(clip+matching.start,2)
    print(path.name,'section',n,starts[n],text[:120],flush=True)
  if len(starts)==4:break
 out[path.name]={'duration':duration,'starts':{str(k):v for k,v in starts.items()},'pauseAudit':audit,'method':'local-ASR-of-section-announcements'}
 outpath.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print(path.name,'found',starts,'elapsed',round(time.time()-started),flush=True)
