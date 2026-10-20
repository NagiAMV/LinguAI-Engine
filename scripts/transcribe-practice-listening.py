"""Local ASR only: keep timed raw segments for review; never infer speech from keys."""
import argparse,json,time,subprocess
import numpy as np
from pathlib import Path
from faster_whisper import WhisperModel
parser=argparse.ArgumentParser();parser.add_argument('--download-only',action='store_true');parser.add_argument('--test',type=int,choices=[1,4,12,16]);args=parser.parse_args()
model=WhisperModel('small.en',device='cpu',compute_type='int8',cpu_threads=8,num_workers=1,download_root='.cache/speech-models',local_files_only=not args.download_only)
print('Local small.en model ready.',flush=True)
if args.download_only:raise SystemExit
numbers=[args.test] if args.test else [1,4]
for number in numbers:
 output=Path(f'.cache/listening-{number}-transcription.json');segments=[];started=time.time();last=0;offset=0
 if output.exists():
  previous=json.loads(output.read_text(encoding='utf8'))
  if previous.get('complete'):print(f'Test {number}: complete cached transcription already exists.',flush=True);continue
  if previous.get('segments'):
   offset=max(0,previous['segments'][-1]['start']-1)
   segments=[s for s in previous['segments'] if s['end']<=offset]
 decoded=subprocess.run(['ffmpeg','-v','error','-i',f'public/practice/assets/listening-{number}.mp3','-f','f32le','-ac','1','-ar','16000','pipe:1'],capture_output=True,check=True)
 audio=np.frombuffer(decoded.stdout,dtype=np.float32)
 duration=len(audio)/16000
 result,info=model.transcribe(audio[int(offset*16000):],language='en',beam_size=5,vad_filter=True,condition_on_previous_text=False,word_timestamps=True)
 for segment in result:
  segments.append({'start':round(segment.start+offset,2),'end':round(segment.end+offset,2),'text':segment.text.strip(),'avgLogprob':round(segment.avg_logprob,3),'noSpeechProb':round(segment.no_speech_prob,3),'words':[{'start':round(w.start+offset,2),'end':round(w.end+offset,2),'word':w.word,'probability':round(w.probability,3)} for w in segment.words or []]})
  output.write_text(json.dumps({'test':number,'model':'small.en','language':'en','audioDuration':duration,'segments':segments,'complete':False},ensure_ascii=False,indent=2),encoding='utf8')
  if segment.end+offset-last>=60:print(f'Test {number}: {segment.end+offset:.0f}/{duration:.0f} audio seconds; elapsed {time.time()-started:.0f}s',flush=True);last=segment.end+offset
 output.write_text(json.dumps({'test':number,'model':'small.en','language':'en','audioDuration':duration,'segments':segments,'complete':True},ensure_ascii=False,indent=2),encoding='utf8')
 print(f'Test {number} complete: {len(segments)} timed segments.',flush=True)
