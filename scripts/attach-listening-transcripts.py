"""Attach local ASR drafts only after explicit section boundaries have been reviewed."""
import argparse,hashlib,html,json
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('test',type=int,choices=[1,4,16]);parser.add_argument('--boundaries',required=True,help='Start seconds for parts 1,2,3,4, separated by commas');args=parser.parse_args()
starts=[float(n) for n in args.boundaries.split(',')]
spellings={1:{"Carrara's":"Karrara's","Professor Messi":"Professor Massey","Professor Lounds":"Professor Lowndes"},4:{'Ciricini':'Seracini'}}.get(args.test,{})
if len(starts)!=4 or starts!=sorted(set(starts)) or starts[0]!=0:raise ValueError('Four ascending part boundaries starting at zero required')
source=Path(f'.cache/listening-{args.test}-transcription.json');data=json.loads(source.read_text(encoding='utf8'))
if not data.get('complete'):raise ValueError('Transcription is not complete')
path=Path(f'public/practice/practice-listening-{args.test}.json');test=json.loads(path.read_text(encoding='utf8'));counts=[]
for i,part in enumerate(test['parts']):
 end=starts[i+1] if i<3 else data['audioDuration']+1
 segments=[s for s in data['segments'] if starts[i]<=s['start']<end]
 if len(segments)<15:raise ValueError(f'Part {i+1} has too little text: verify boundaries')
 paragraphs=['<p class="transcript-source-note"><strong>Audio transcript · draft</strong><br>Transcribed locally from the recording. Not an official transcript; speech recognition may contain errors. Uncertain passages are marked. Times refer to the full recording.</p>']
 for s in segments:
  minutes,seconds=divmod(int(s['start']),60);uncertain=s['avgLogprob']<-.8
  wording=s['text']
  for before,after in spellings.items():wording=wording.replace(before,after)
  text=html.escape(wording,quote=False)
  if uncertain:text='<em>[Unclear — check the recording] '+text+'</em>'
  paragraphs.append(f'<p><small>[{minutes:02}:{seconds:02}]</small> {text}</p>')
 part['passage']='\n'.join(paragraphs);part['transcriptStatus']='asr-draft';part['transcriptStartSeconds']=starts[i];part['transcriptEndSeconds']=min(end,data['audioDuration']);counts.append(len(segments))
test['transcriptProvenance']={'type':'local-audio-transcription','model':data['model'],'status':'draft-not-fully-audited','audioSha256':hashlib.sha256(Path(f'public/practice/assets/listening-{args.test}.mp3').read_bytes()).hexdigest(),'sectionStarts':starts,'timedSegments':len(data['segments']),'properNounSpellingsAlignedToQuestions':spellings}
path.write_text(json.dumps(test,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
audit=Path(f'docs/listening-{args.test}-transcription.json');audit.write_text(json.dumps({'test':args.test,'duration':data['audioDuration'],'model':data['model'],'status':'draft-not-fully-audited','sectionStarts':starts,'segmentsPerPart':counts,'uncertainSegments':[{'start':s['start'],'text':s['text'],'avgLogprob':s['avgLogprob']} for s in data['segments'] if s['avgLogprob']<-.8]},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(f'Test {args.test}: attached four timed draft transcripts; segment counts {counts}.')
