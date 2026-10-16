"""Import the reviewed literal CDI data extracted into .cache/new-papers-rendered.json."""
import base64,hashlib,html,json,re,runpy,sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf8')
h=runpy.run_path('scripts/import-listening-html.py');Tree,Node,adapt,serialize=(h[n] for n in ['Tree','Node','adapt','serialize'])
def clean(s):return ''.join(serialize(n) for n in Tree(s).root.children)
def text(s):return html.unescape(' '.join(n.text for n in Tree(s).root.all())).strip()
def raw(n):
 if not n.tag:return html.escape(n.text,quote=False)
 return '<'+n.tag+''.join(f' {k}="{html.escape(v or "",quote=True)}"' for k,v in n.attrs.items())+'>'+('' if n.tag in h['VOID'] else html.escape(n.text,quote=False)+''.join(raw(c) for c in n.children)+'</'+n.tag+'>')
def select(n,opts):return '<select data-lq="'+str(n)+'"><option value="">Choose an answer</option>'+''.join('<option value="'+html.escape(str(v),quote=True)+'">'+html.escape(text(str(t)))+'</option>' for v,t in opts)+'</select>'
def dump(p,d):Path(p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def sha(b):return hashlib.sha256(b).hexdigest()
def signature(s):return sha(re.sub(r'\W+',' ',text(s).lower()).strip().encode())
batch=json.loads(Path('.cache/new-papers-rendered.json').read_text(encoding='utf8'));singles=[];report=[]
for d in batch:
 if sha(Path(d['file']).read_bytes())!=d['sha256']:raise ValueError('Source changed')
 old=[json.loads(p.read_text(encoding='utf8')) for p in Path('public/practice').glob('*.json')]
 if any(t.get('provenance',{}).get('sourceFileSha256')==d['sha256'] for t in old):print('DUPLICATE',d['sourceFile']);continue
 if d['reading']:
  passage=next(iter(d['PASSAGES'].values()));sections=sum(d['SECTIONS'].values(),[]);qs='';answers={}
  if any(signature(p['passage'])==signature('<h2>'+passage['title']+'</h2>'+passage['content']) for t in old for p in t['parts']):print('DUPLICATE TEXT',d['sourceFile']);continue
  for sec in sections:
   items=sec['items'];typ=sec['type'];qs+='<section><h3>Questions '+str(items[0]['id'])+'–'+str(items[-1]['id'])+'</h3><p>'+sec['instruction']+'</p>'
   if typ in ['tfng','ynng']:qs+='<p>'+('TRUE / FALSE / NOT GIVEN' if typ=='tfng' else 'YES / NO / NOT GIVEN')+'</p>'
   if sec.get('noteTitle'):qs+='<h4>'+sec['noteTitle']+'</h4>'
   if sec.get('people'):qs+='<h4>'+sec.get('bankLabel','Options')+'</h4><ul>'+''.join('<li>'+p['l']+'. '+p['name']+'</li>' for p in sec['people'])+'</ul>'
   if typ=='matching-headings':qs+='<h4>List of Headings</h4><ul>'+''.join('<li>'+v['id']+'. '+v['text']+'</li>' for v in passage['headings'])+'</ul>'
   if typ=='summary':qs+='<p>'
   for i,q in enumerate(items):
    n=q['id'];answers[str(n)]=q['answer'].split('|');label=q.get('label','');label=re.sub(r'\s*'+str(n)+r'\s*_+', '',label)
    if typ=='matching-headings':label='Paragraph '+chr(65+i)
    if typ in ['notes','summary']:control='<input type="text" data-lq="'+str(n)+'">'
    elif typ=='mcq':control=''.join('<label><input type="radio" data-lq="'+str(n)+'" value="'+chr(65+j)+'">'+o+'</label>' for j,o in enumerate(q['options']))
    else:
     opts=([(v,v) for v in ['TRUE','FALSE','NOT GIVEN']] if typ=='tfng' else [(v,v) for v in ['YES','NO','NOT GIVEN']] if typ=='ynng' else [(p['l'],p['l']) for p in sec['people']] if typ=='matching-features' else [(v['id'],v['id']) for v in passage['headings']] if typ=='matching-headings' else [(v,v) for v in sec['options']]);control=select(n,opts)
    chunk=label+' '+control+' '+q.get('after','')
    qs+=('<span>'+chunk+'</span> ' if typ=='summary' else '<div class="q-card">'+chunk+'</div>')
   if typ=='summary':qs+='</p>'
   qs+='</section>'
  ex={};high=[]
  for n,e in d['READING_EXPLANATIONS'].items():
   ex[n]={'en':text(e['en']),'uz':text(e['uz'])}
   high.extend({'q':n,'txt':text(q)} for q in e.get('highlights',[]))
  singles.append({**d,'PASSAGE_TITLE':html.unescape(passage['title']),'PASSAGE_HTML':passage['content'],'questions':qs,'ANSWERS':answers,'EXPLANATIONS':ex,'HIGHLIGHTS':high});continue
 catalog=json.loads(Path('src/data/practice-listening-catalog.json').read_text(encoding='utf8'));keys=json.loads(Path('src/data/practice-listening-keys.json').read_text(encoding='utf8'));number=max(i['number'] for i in catalog)+1;tid=f'practice-listening-{number}';parts=[];groups=[];answers={n:v.split('|') for n,v in d['LISTENING_ANSWERS'].items()};transcripts={p:[] for p in range(1,5)};p=1
 for line in d['TRANSCRIPT']:
  if line.get('type')=='break':p=int(re.search(r'Part (\d)',line['label'])[1]);continue
  transcripts[p].append('<p><strong>'+html.escape(line.get('sp',''))+':</strong> '+html.escape(line.get('tx',''))+'</p>')
 topics=[]
 for p,markup in enumerate(d['questions'],1):
  root=Tree(markup).root;poolletters=list(dict.fromkeys(n.attrs['data-val'] for n in root.all() if 'data-val' in n.attrs))
  for node in list(root.all()):
   if node.tag=='img' and node.attrs.get('src','').startswith('data:image/'):
    meta,enc=node.attrs['src'].split(',',1);ext='png' if 'png' in meta else 'jpg';asset=f'listening-{number}-part-{p}.{ext}';Path('public/practice/assets/'+asset).write_bytes(base64.b64decode(enc,validate=True));node.attrs['src']='/practice/assets/'+asset
   if node.tag=='input' and node.attrs.get('type')=='hidden':
    n=node.attrs['data-lq'];host=node.parent
    while host.parent and 'drag-match-layout' not in h['cls'](host):host=host.parent
    localletters=list(dict.fromkeys(c.attrs['data-val'] for c in host.all() if 'data-val' in c.attrs)) if host.parent else []
    if not localletters:
     for prior in root.all():
      if prior is node:break
      if prior.attrs.get('id','').startswith('pool-'):localletters=list(dict.fromkeys(c.attrs['data-val'] for c in prior.all() if 'data-val' in c.attrs))
    node.tag='select';node.attrs={'data-lq':n};node.children=[];node.add(Node('option',{'value':''},'Choose an answer'))
    for v in (localletters or poolletters):node.add(Node('option',{'value':v},v))
   if 'data-ms-ids' in node.attrs:
    nums=list(map(int,node.attrs['data-ms-ids'].split(',')));groups.append({'questions':nums,'acceptedSets':[[answers[str(n)][0] for n in nums]]})
  for node in list(root.all()):
   if 'drag-drop' in h['cls'](node):h['remove'](node)
  content,fields=adapt(''.join(raw(n) for n in root.children),number,p,{})
  shared=sum(len(g['questions'])-1 for g in groups if (g['questions'][0]-1)//10+1==p)
  assert len(fields)==10-shared,(d['sourceFile'],p,len(fields))
  topics+=re.findall(r'<h2>(.*?)</h2>',markup)[:1]
  parts.append({'id':p,'passage':clean(''.join(transcripts[p])) or '<p>No transcript was included in the supplied file.</p>','transcriptStatus':'supplied' if transcripts[p] else 'not-supplied','questions':content,'fieldNames':list(fields),'fieldLabels':fields,'audioUrls':[f'/practice/assets/listening-{number}.mp3'],'sourceAudioUrl':d['audio']})
 fingerprint=signature(''.join(p['questions'] for p in parts))
 if any(signature(''.join(p['questions'] for p in t['parts']))==fingerprint for t in old if t['resource']=='listening'):print('DUPLICATE QUESTIONS',d['sourceFile']);continue
 dump('public/practice/'+tid+'.json',{'id':tid,'resource':'listening','test':number,'title':f'Listening · Test {number}','backUrl':'/?view=listening','audioScope':'test','durationMinutes':40,'parts':parts,'provenance':{'type':'user-provided-html','file':d['sourceFile'],'rightsStatus':'not-established','sourceFileSha256':d['sha256'],'questionTextSha256':fingerprint}})
 keys[tid]={'test':number,'module':'listening','answers':answers,'parts':{str(p):{'questionNumbers':list(range((p-1)*10+1,p*10+1)),'groups':[g for g in groups if (g['questions'][0]-1)//10+1==p]} for p in range(1,5)},'sources':[{'part':p,'type':'user-provided-html','label':d['sourceFile'],'reference':d['sourceFile']} for p in range(1,5)]}
 catalog.append({'id':tid,'number':number,'title':f'Test {number}','partCount':4,'questionCount':40,'topics':' · '.join(text(t) for t in topics)})
 dump('src/data/practice-listening-catalog.json',catalog);dump('src/data/practice-listening-keys.json',keys);report.append({'number':number,'audio':d['audio'],'file':d['sourceFile']});print('Imported Listening',number,d['sourceFile'])
dump('.cache/single-reading-batch.json',singles);dump('.cache/new-audio-downloads.json',report)
runpy.run_path('scripts/import-single-reading.py',run_name='__main__')
