"""Offline, resumable speaker diarization. Does not edit published transcripts.

Models/API: https://k2-fsa.github.io/sherpa/onnx/speaker-diarization/
Run in the local transcription venv after installing sherpa-onnx==2.0.1.
"""
import concurrent.futures, hashlib, json, os, pathlib, subprocess, time
import numpy as np
import sherpa_onnx as sherpa

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = ROOT / '.cache/speaker-diarization'
MODELS = ROOT / '.cache/speaker-models'
PARAMS = {'segmentation':'pyannote-segmentation-3.0-int8','embedding':'wespeaker-en-voxceleb-resnet34','threshold':0.25,'windowShiftRatio':0.5,'version':1}
engine = None
config = None

def initialize():
 global engine, config
 config = sherpa.OfflineSpeakerDiarizationConfig(
  segmentation=sherpa.OfflineSpeakerSegmentationModelConfig(
   pyannote=sherpa.OfflineSpeakerSegmentationPyannoteModelConfig(model=str(MODELS/'sherpa-onnx-pyannote-segmentation-3-0/model.int8.onnx'),window_shift_ratio=PARAMS['windowShiftRatio']),num_threads=2),
  embedding=sherpa.SpeakerEmbeddingExtractorConfig(model=str(MODELS/'wespeaker.onnx'),num_threads=2),
  clustering=sherpa.FastClusteringConfig(num_clusters=-1,threshold=PARAMS['threshold']),
  min_duration_on=0.3,min_duration_off=0.5)
 if not config.validate(): raise RuntimeError('Missing diarization model files')
 engine=sherpa.OfflineSpeakerDiarization(config)

def process(task):
 audio_path=ROOT/task['audio']
 output=CACHE/(audio_path.stem+'.json')
 sha=hashlib.sha256(audio_path.read_bytes()).hexdigest()
 old=None
 cap=task.get('speakerLimit',10)
 if output.exists():
  old=json.loads(output.read_text(encoding='utf8'))
  if old.get('complete') and old.get('audioSha256')==sha and old.get('params')==PARAMS and old['speakers']<=cap:return {'audio':audio_path.name,'cached':True,'speakers':old['speakers'],'seconds':0}
 started=time.time()
 decoded=subprocess.run(['ffmpeg','-v','error','-i',str(audio_path),'-f','f32le','-ac','1','-ar','16000','pipe:1'],capture_output=True,check=True)
 samples=np.frombuffer(decoded.stdout,dtype=np.float32).copy()
 config.clustering.num_clusters=cap if old and old.get('speakers',0)>cap else -1
 engine.set_config(config)
 segments=engine.process(samples).sort_by_start_time()
 if len(set(turn.speaker for turn in segments))>cap:
  config.clustering.num_clusters=cap;engine.set_config(config)
  segments=engine.process(samples).sort_by_start_time()
 turns=[{'start':round(turn.start,3),'end':round(turn.end,3),'speaker':int(turn.speaker)} for turn in segments]
 duration=len(samples)/16000
 result={'complete':True,'audio':task['audio'],'audioSha256':sha,'params':PARAMS,'speakerLimit':cap,'duration':duration,'speakers':len(set(turn['speaker'] for turn in turns)),'segments':turns,'processingSeconds':round(time.time()-started,2)}
 temporary=output.with_suffix('.tmp')
 temporary.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf8');temporary.replace(output)
 return {'audio':audio_path.name,'speakers':result['speakers'],'seconds':result['processingSeconds'],'audioSeconds':round(duration)}

if __name__=='__main__':
 os.chdir(ROOT);CACHE.mkdir(exist_ok=True)
 tasks=json.loads((CACHE/'tasks.json').read_text(encoding='utf8'))
 tasks.sort(key=lambda task:(not pathlib.Path(task['audio']).stem.startswith('single-'),task['audio']))
 started=time.time();done=[];errors=[]
 print(json.dumps({'starting':len(tasks),'workers':4,'params':PARAMS}),flush=True)
 with concurrent.futures.ProcessPoolExecutor(max_workers=4,initializer=initialize) as pool:
  pending={pool.submit(process,task):task for task in tasks}
  for future in concurrent.futures.as_completed(pending):
   try:result=future.result();done.append(result);print(json.dumps({'done':len(done),'total':len(tasks),'elapsed':round(time.time()-started),**result}),flush=True)
   except Exception as error:errors.append({'audio':pending[future]['audio'],'error':str(error)});print(json.dumps(errors[-1]),flush=True)
 summary={'done':done,'errors':errors,'elapsed':round(time.time()-started)}
 (CACHE/'run-report.json').write_text(json.dumps(summary,indent=2),encoding='utf8')
 if errors:raise SystemExit(1)
