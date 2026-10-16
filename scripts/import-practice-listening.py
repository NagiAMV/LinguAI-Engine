import hashlib,html,json,re,runpy
from pathlib import Path
h=runpy.run_path(str(Path(__file__).with_name('import-listening-html.py')));dups=runpy.run_path(str(Path(__file__).with_name('import-static-listening.py')))
Node,Tree,cls,adapt,serialize=(h[n] for n in ['Node','Tree','cls','adapt','serialize'])
def raw(n):
 if not n.tag:return html.escape(n.text,quote=False)
 attrs=''.join(f' {k}="{html.escape(v or "",quote=True)}"' for k,v in n.attrs.items())
 return '<'+n.tag+attrs+'>'+('' if n.tag in h['VOID'] else html.escape(n.text,quote=False)+''.join(raw(c) for c in n.children)+'</'+n.tag+'>')
for source in json.loads(Path('.cache/practice-listening-batch.json').read_text(encoding='utf8')):
 cp=Path('src/data/practice-listening-catalog.json');kp=Path('src/data/practice-listening-keys.json');catalog=json.loads(cp.read_text(encoding='utf8'));keys=json.loads(kp.read_text(encoding='utf8'));old=[json.loads(Path(f'public/practice/{i["id"]}.json').read_text(encoding='utf8')) for i in catalog]
 if any(t['provenance'].get('sourceFileSha256')==source['sourceSha256'] for t in old):print('DUPLICATE:',source['sourceFile']);continue
 number=max(i['number'] for i in catalog)+1;tid=f'practice-listening-{number}';blob=Path(source['file']).read_bytes()
 if hashlib.sha256(blob).hexdigest()!=source['sourceSha256']:raise ValueError('Source changed')
 groups=[]
 root=Tree(blob.decode('utf-8-sig')).root;transcripts=next(n for n in root.all() if n.attrs.get('id')=='transcription-data');parts=[]
 for p in range(1,5):
  panel=next(n for n in root.all() if n.attrs.get('id')==f'part-{p}')
  for node in panel.all():
   if node.tag in {'input','select'}:
    if node.attrs.get('type')=='checkbox':
     nums=list(map(int,re.findall(r'\d+',node.attrs['name'])));host=h['ancestor'](node,lambda c:'checkbox-group' in cls(c));host.attrs['data-ms-ids']=','.join(map(str,nums))
     if not any(g['questions']==nums for g in groups):groups.append({'questions':nums,'acceptedSets':[source['correctAnswers'][node.attrs['name']]]})
     continue
    n=re.sub(r'\D','',node.attrs.get('id') or node.attrs.get('name',''));node.attrs['data-lq']=n
    if node.attrs.get('type')=='radio':
     host=h['ancestor'](node,lambda c:'multi-choice-question' in cls(c));
     if not host:
      host=node.parent.parent.parent
      assert {c.attrs.get('name') for c in host.all() if c.tag=='input' and c.attrs.get('type')=='radio'}=={node.attrs.get('name')},'Review radio grouping'
     host.attrs['class']='multi-choice-question q-card'
  content,fields=adapt(''.join(raw(c) for c in panel.children),number,p,{})
  if len(fields)!=10-sum(len(g['questions'])-1 for g in groups if (g['questions'][0]-1)//10+1==p):raise ValueError(f'{source["sourceFile"]} part {p}: {len(fields)} fields')
  transcript=next(n for n in transcripts.children if n.attrs.get('data-part')==str(p));paragraphs=[]
  for child in transcript.children:
   if child.tag:paragraphs.append(serialize(child))
   else:paragraphs.extend('<p>'+html.escape(t.strip(),quote=False)+'</p>' for t in re.split(r'\n\s*\n',child.text) if t.strip())
  parts.append({'id':p,'questions':content,'passage':'\n'.join(paragraphs),'transcriptStatus':'supplied','fieldNames':list(fields),'fieldLabels':fields,'audioUrls':[f'/practice/assets/listening-{number}.mp3'],'sourceAudioUrl':source['audioSource']})
 sig=dups['fingerprint'](''.join(p['questions'] for p in parts))
 if any(dups['fingerprint'](''.join(p['questions'] for p in t['parts']))==sig for t in old):print('DUPLICATE CONTENT:',source['sourceFile']);continue
 audio=Path(f'.cache/listening-{number}.mp3').read_bytes();audio_hash=hashlib.sha256(audio).hexdigest()
 if any(t['provenance'].get('audioSha256')==audio_hash for t in old):raise ValueError('Possible duplicate recording')
 test={'id':tid,'resource':'listening','test':number,'title':f'Listening · Test {number}','backUrl':'/?view=listening','audioScope':'test','parts':parts,'provenance':{'type':'user-provided-html','file':source['sourceFile'],'sourceFileSha256':source['sourceSha256'],'questionTextSha256':sig,'audioSha256':audio_hash,'rightsStatus':'not-established'}}
 answers={re.sub(r'\D','',n):v if isinstance(v,list) else [v] for n,v in source['correctAnswers'].items() if '-' not in n}
 for group in groups:
  for n,v in zip(group['questions'],group['acceptedSets'][0]):answers[str(n)]=[v]
 keys[tid]={'test':number,'module':'listening','answers':answers,'parts':{str(p):{'questionNumbers':list(range((p-1)*10+1,p*10+1)),'groups':[g for g in groups if (g['questions'][0]-1)//10+1==p]} for p in range(1,5)},'sources':[{'part':p,'type':'user-provided-html','label':source['sourceFile'],'reference':source['sourceFile']} for p in range(1,5)]}
 topics=' · '.join(html.unescape(' '.join(n.text for n in heading.all())).strip() for part in parts for heading in Tree(part['questions']).root.all() if heading.tag=='h2')
 catalog.append({'id':tid,'number':number,'title':f'Test {number}','partCount':4,'questionCount':40,'topics':topics})
 Path(f'public/practice/assets/listening-{number}.mp3').write_bytes(audio);Path(f'public/practice/{tid}.json').write_text(json.dumps(test,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 for path,data in [(cp,catalog),(kp,keys)]:path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print(f'Imported Test {number}: {source["sourceFile"]}, 40 questions, four supplied transcripts.')
