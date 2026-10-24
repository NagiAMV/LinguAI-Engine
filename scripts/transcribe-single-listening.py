"""Resumable local GPU ASR. Transcript content comes only from audio, never answer keys."""
import argparse,hashlib,html,json,os,re,subprocess,time
from pathlib import Path
import numpy as np

parser=argparse.ArgumentParser();parser.add_argument('--ids',default='');parser.add_argument('--device',default='cuda',choices=['cuda','cpu']);parser.add_argument('--batch-size',type=int,default=8);parser.add_argument('--attach-only',action='store_true');args=parser.parse_args()
handles=[]
if os.name=='nt':
 folder=Path('C:/Users/user/AppData/Local/Programs/Ollama/lib/ollama/cuda_v12')
 if folder.exists():
  handles.append(os.add_dll_directory(str(folder.resolve())));os.environ['PATH']=str(folder.resolve())+os.pathsep+os.environ.get('PATH','')
 for folder in Path('.cache/cuda-runtime').glob('nvidia/*/bin'):
  handles.append(os.add_dll_directory(str(folder.resolve())));os.environ['PATH']=str(folder.resolve())+os.pathsep+os.environ.get('PATH','')
if not args.attach_only:
 from faster_whisper import WhisperModel,BatchedInferencePipeline
 model=WhisperModel('small.en',device=args.device,compute_type='int8_float16' if args.device=='cuda' else 'int8',cpu_threads=8,num_workers=1,download_root='.cache/speech-models',local_files_only=True)
 pipeline=BatchedInferencePipeline(model=model)
cache=Path('.cache/single-listening-transcripts');cache.mkdir(exist_ok=True)
catalog=json.loads(Path('src/data/single-section-listening-catalog.json').read_text(encoding='utf8'))
selected=set(map(int,args.ids.split(','))) if args.ids else None
auditpath=Path('docs/single-listening-transcripts.json');audit=json.loads(auditpath.read_text(encoding='utf8')) if auditpath.exists() else {}
def save(path,data):
 temporary=path.with_suffix(path.suffix+'.tmp')
 temporary.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8');temporary.replace(path)
def attach(item,data,audiohash):
 path=Path('public/practice/'+item['id']+'.json');paper=json.loads(path.read_text(encoding='utf8'));part=paper['parts'][0]
 paragraphs=['<p class="transcript-source-note"><strong>Audio transcript · draft</strong><br>Transcribed locally from this recording. This is not an official transcript and has not been fully checked by a person. Names, numbers and uncertain words may contain recognition errors. Times are relative to this section recording.</p>']
 uncertain=[]
 for segment in data['segments']:
  weak=segment['avgLogprob']<-.6 or segment.get('uncertainWords',0)>=2 or segment.get('noSpeechProb',0)>.6
  text=html.escape(segment['text'],quote=False)
  if weak:
   text='<em>[Unclear — check the recording] '+text+'</em>';uncertain.append(segment['start'])
  minutes,seconds=divmod(int(segment['start']),60);paragraphs.append(f'<p><small>[{minutes:02}:{seconds:02}]</small> {text}</p>')
 part.update(passage='\n'.join(paragraphs),transcriptStatus='asr-draft',transcriptStartSeconds=0,transcriptEndSeconds=data['audioDuration'])
 paper['transcriptProvenance']={'type':'local-audio-transcription','model':'small.en','status':'draft-not-fully-audited','audioSha256':audiohash,'timedSegments':len(data['segments']),'uncertainSegmentStarts':uncertain,'inferenceDevice':data.get('inferenceDevice','cpu'),'answerKeyUsedForGeneration':False}
 save(path,paper)
 audit[item['id']]={'section':item['sectionNumber'],'model':'small.en','status':'draft-not-fully-audited','audioSha256':audiohash,'duration':data['audioDuration'],'timedSegments':len(data['segments']),'wordCount':sum(len(s['text'].split()) for s in data['segments']),'uncertainSegmentStarts':uncertain}
 save(auditpath,audit)

print('Local ASR ready:',args.device,'batch',args.batch_size,flush=True)
for item in catalog:
 if selected is not None and item['number'] not in selected:continue
 source=Path('public/practice/assets/'+item['id']+'.mp3');audiohash=hashlib.sha256(source.read_bytes()).hexdigest();output=cache/(item['id']+'.json');started=time.time()
 data=json.loads(output.read_text(encoding='utf8')) if output.exists() else {}
 if not(data.get('complete') and data.get('audioSha256')==audiohash):
  if args.attach_only:raise ValueError('A complete matching checkpoint is required: '+item['id'])
  decoded=subprocess.run(['ffmpeg','-v','error','-i',str(source),'-f','f32le','-ac','1','-ar','16000','pipe:1'],capture_output=True,check=True)
  audio=np.frombuffer(decoded.stdout,dtype=np.float32);duration=len(audio)/16000
  data={'id':item['id'],'audioSha256':audiohash,'audioDuration':round(duration,2),'model':'small.en','inferenceDevice':args.device,'segments':[],'complete':False}
  segments,info=pipeline.transcribe(audio,language='en',beam_size=5,batch_size=args.batch_size,vad_filter=True,word_timestamps=True)
  last=0
  for segment in segments:
   words=segment.words or [];text=segment.text.strip()
   if not text:continue
   data['segments'].append({'start':round(float(segment.start),2),'end':round(float(segment.end),2),'text':text,'avgLogprob':round(float(segment.avg_logprob),3),'noSpeechProb':round(float(segment.no_speech_prob),3),'wordCount':len(words),'uncertainWords':int(sum(w.probability<.4 for w in words))})
   save(output,data)
   if segment.end-last>=120:
    print(item['id'],round(segment.end),'/',round(duration),'audio seconds; elapsed',round(time.time()-started),flush=True);last=segment.end
  assert len(data['segments'])>=5 and sum(len(s['text'].split()) for s in data['segments'])>=200,('Insufficient transcription',item['id'])
  data['complete']=True;save(output,data)
 attach(item,data,audiohash)
 print('ATTACHED',item['id'],len(data['segments']),'segments;',round(time.time()-started),'seconds',flush=True)
print('Finished selected recordings.',flush=True)
