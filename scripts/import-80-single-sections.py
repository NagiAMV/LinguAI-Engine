"""Import user supplied worksheets, matched recordings and literal answer keys."""
import hashlib,html,itertools,json,math,re,subprocess
from pathlib import Path
import pypdfium2 as pdfium

ROOT=Path('.');ASSETS=ROOT/'public/practice/assets'
def save(path,value):Path(path).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def expand(s):
 m=re.search(r'\(([^()]*)\)',s)
 if m:
  return [v for choice in ['',*m[1].split('/')] for v in expand(s[:m.start()]+choice+s[m.end():])]
 return [' '.join(v.split()).strip(' ;') for v in s.split('/') if v.strip()]
OVERRIDES={
 (1,1):['café','cafe'],(1,7):['Maughan'],
 (1,2):['9','nine','9 am','nine am',"9 o'clock","nine o'clock"],
 (1,3):['5','five','5 km','five km','5 kilometers','five kilometers','5 kilometres','five kilometres'],
 (1,10):['taking photos','take photos','taking photographs','take photographs'],
 (2,1):['3000','3,000','three thousand','3000 words','3,000 words','three thousand words'],
 (2,2):['surprise','surprising ending','surprise ending'],
 (3,1):['Symonds'],(5,5):['13th May','13 May','thirteenth May','May 13','May 13th','May thirteenth'],
 (7,7):['Shadforth'],
 (8,8):['14 May','14th May','fourteenth May','the fourteenth of May','May 14','May 14th','May fourteenth','14.05','14.5','05.14','5.14'],
 (9,2):['city centre','city center'],
 (10,8):['work','to work','travelling to work','traveling to work','travelling','traveling'],
 (13,7):['pianist','the pianist','a pianist','piano player'],
 (21,16):['fifty minutes','50 minutes','fifty mins','50 mins'],
 (35,11):['classical music','classical concerts','music concerts','concerts'],
 (50,27):['1882 to 1883','1882-1883','1882–1883','1882 to 83','1882-83'],
 (61,32):['southern Europe','south Europe'],(76,38):['sea levels','sea level','water levels','water level'],
 (77,33):[a+join+b for a,b in itertools.chain(itertools.product(['plants'],['animals','fish','fishes']),itertools.product(['animals','fish','fishes'],['plants'])) for join in [' and ',', ',' & ',' ']],
}
def variants(p,n,lines):
 if (p,n) in OVERRIDES:return OVERRIDES[p,n]
 raw=' '.join(lines)
 raw=re.sub(r'IN (?:EITHER|ETHER|ANY) ORDER[;:]?','',raw,flags=re.I).strip()
 out=expand(raw)
 for v in list(out):
  if re.fullmatch(r'[\d\s]+',v):out.append(v.replace(' ',''))
 return list(dict.fromkeys(out))

def main():
 papers=json.loads(Path('.cache/80-book-structured.json').read_text(encoding='utf8'))
 boundaries=json.loads(Path('.cache/80-section-boundaries.json').read_text(encoding='utf8'))
 source=Path('C:/Users/user/Downloads/Telegram Desktop/80 IELTS Listening Tests (2).pdf')
 pdf=pdfium.PdfDocument(source);sha=hashlib.sha256(source.read_bytes()).hexdigest();catalog=[];keys={};hashes={}
 for p in papers:
  n,section,t=p['number'],p['sectionNumber'],p['sectionTest'];tid=f'single-listening-{n}'
  if t<=8:audio=Path(f'.cache/80-audio-source/guide-test-{t}-section-{section}.mp3');start=0;end=None;method='source-section-track'
  else:
   book=7+(t-9)//4;test=(t-9)%4+1;audio=Path(f'.cache/80-audio-source/book-{book}-test-{test}.mp3');b=boundaries[audio.name]
   assert len(b['starts'])==4,audio
   start=b['starts'][str(section)];end=b['starts'].get(str(section+1),b['duration']);method=b['method']
  out=ASSETS/f'{tid}.mp3'
  if not out.exists():
   args=['ffmpeg','-v','error','-y','-ss',str(start),'-i',str(audio)]
   if end is not None:args+=['-t',str(end-start)]
   subprocess.run(args+['-vn','-c:a','copy',str(out)],check=True)
  previous=Path(f'public/practice/{tid}.json')
  duration=json.loads(previous.read_text(encoding='utf8'))['parts'][0]['audioDurationSeconds'] if previous.exists() else float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(out)],text=True).strip())
  images=[]
  for page in p['pages']:
   asset=ASSETS/f'{tid}-page-{page}.webp'
   if not asset.exists():
    rendered=pdf[page-1].render(scale=1.6).to_pil();rendered.save(asset,format='WEBP',quality=88)
   images.append(f'<img src="/practice/assets/{asset.name}" alt="Original worksheet, Section {section}, page {page}" loading="lazy">')
  numbers=list(range((section-1)*10+1,section*10+1));fields=[f'single_listening_{n}_{q}' for q in numbers]
  sheet=''.join(f'<label class="section-answer-row ielts-listening-question-item"><strong class="ielts-listening-question-number">{q}</strong><input type="text" name="{field}" aria-label="Question {q}" autocomplete="off" placeholder="Answer"></label>' for q,field in zip(numbers,fields))
  questions=f'<div class="section-practice-layout"><div class="section-source-pages">'+''.join(images)+f'</div><aside class="section-answer-sheet"><h2>Answer sheet</h2><p>Enter words, numbers or option letters as instructed on the worksheet.</p>{sheet}</aside></div>'
  answers={};groups=[]
  for r in p['keyRecords']:
   qs=r['questions']
   if len(qs)>1:
    lines=[x for x in r['lines'] if not re.search('ORDER',x)]
    choices=[v.strip() for x in lines for v in re.split(r'\s*&\s*',x) if v.strip()]
    assert len(choices)==len(qs),(n,r)
    groups.append({'questions':qs,'acceptedSets':[choices]})
    for q,v in zip(qs,choices):answers[str(q)]=[v]
   else:answers[str(qs[0])]=variants(n,qs[0],r['lines'])
  assert sorted(map(int,answers))==numbers
  assert all(answers.values())
  title=f'Section {section} · Exercise {t}';minutes=math.ceil(duration/60)+1
  if audio.name not in hashes:hashes[audio.name]=hashlib.sha256(audio.read_bytes()).hexdigest()
  provenance={'type':'user-provided-pdf','file':source.name,'sourceFileSha256':sha,'pages':p['pages'],'sourceExercise':n,'audioSourceFile':audio.name,'audioSourceSha256':hashes[audio.name],'audioStartSeconds':start,'audioEndSeconds':end,'audioMatchingMethod':method,'rawAnswerRecords':p['keyRecords']}
  if n==67:provenance['keyCorrection']='Source key repeats 39; entertainment belongs to worksheet blank 38.'
  paper={'id':tid,'resource':'listening','practiceFormat':'single','test':n,'title':title,'backUrl':f'/?view=listening&format=single&part={section}','durationMinutes':minutes,'audioScope':'section','parts':[{'id':section,'passage':'<p>A transcript was not supplied with this worksheet. Listen to the section recording and use the original worksheet alongside the answer sheet.</p>','transcriptStatus':'not-supplied','questions':questions,'fieldNames':fields,'fieldLabels':dict(zip(fields,[f'Question {q}' for q in numbers])),'audio':f'/practice/assets/{tid}.mp3','audioDurationSeconds':round(duration,2)}],'provenance':provenance}
  # Shared player expects recording objects.
  paper['parts'][0].pop('audio');paper['parts'][0]['audioUrls']=[f'/practice/assets/{tid}.mp3']
  if previous.exists():
   old=json.loads(previous.read_text(encoding='utf8'))
   if old.get('transcriptProvenance',{}).get('audioSha256')==hashlib.sha256(out.read_bytes()).hexdigest():
    for field in ['passage','transcriptStatus','transcriptStartSeconds','transcriptEndSeconds']:
     if field in old['parts'][0]:paper['parts'][0][field]=old['parts'][0][field]
    paper['transcriptProvenance']=old['transcriptProvenance']
  save(f'public/practice/{tid}.json',paper)
  keys[tid]={'test':n,'module':'listening','answers':answers,'parts':{str(section):{'questionNumbers':numbers,'groups':groups}},'sources':[{'part':section,'type':'user-provided-pdf','label':source.name,'reference':f'Test {n}'}]}
  catalog.append({'id':tid,'number':n,'title':title,'sectionNumber':section,'partCount':1,'questionCount':10,'durationMinutes':minutes,'sourceExercise':n})
  print('Imported',n,'section',section,'duration',round(duration),flush=True)
 save('src/data/single-section-listening-catalog.json',catalog);save('src/data/single-section-listening-keys.json',keys)
if __name__=='__main__':main()
