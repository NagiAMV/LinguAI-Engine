"""Import reviewed literal builders and supplied script; never execute page startup."""
import base64,html,json,re,runpy
from pathlib import Path
h=runpy.run_path('scripts/import-listening-html.py');Tree,Node,serialize,adapt=h['Tree'],h['Node'],h['serialize'],h['adapt']
def save(p,d):Path(p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
d=json.loads(Path('.cache/mock-listening-rendered.json').read_text(encoding='utf8'));catalog=json.loads(Path('src/data/practice-listening-catalog.json').read_text(encoding='utf8'));keys=json.loads(Path('src/data/practice-listening-keys.json').read_text(encoding='utf8'))
sha=json.loads(Path('.cache/oct24-paths.json').read_text(encoding='utf8'))[1]['sha256']
if any(json.loads(p.read_text(encoding='utf8')).get('provenance',{}).get('sourceFileSha256')==sha for p in Path('public/practice').glob('practice-listening-*.json')):print('Already imported');raise SystemExit
n=max(x['number'] for x in catalog)+1;tid=f'practice-listening-{n}'
source=Path('.cache/mock-listening.html').read_text(encoding='utf8');audio=re.search(r'data:audio/[^;]+;base64,([A-Za-z0-9+/=]+)',source);assert audio
Path(f'public/practice/assets/listening-{n}.mp3').write_bytes(base64.b64decode(audio[1],validate=True))
transcripts={};part=0
for row in d['transcript']:
 if row.get('type')=='break':part+=1;transcripts[part]=[]
 else:transcripts[part].append('<p><strong>'+html.escape(row.get('sp',''))+':</strong> '+html.escape(row.get('tx',''))+'</p>')
parts=[];keyparts={}
for p in d['parts']:
 k=p['id'];markup=p['html'];markup=re.sub(r'<div class="note-flow">(?:=+ PART \d =+|floating arrows|←\s*→)</div>','',markup)
 markup=re.sub(r'\b(\d+)\s*(<span class="gap-field" id="lq-row-\1")',r'\2',markup)
 root=Tree(markup).root
 for node in list(root.all()):
  if node.tag=='img' and node.attrs.get('src','').startswith('data:image/'):
   prefix,data=node.attrs['src'].split(',',1);ext='jpg' if 'jpeg' in prefix else 'png';asset=f'listening-{n}-part-{k}-plan.{ext}';Path('public/practice/assets/'+asset).write_bytes(base64.b64decode(data,validate=True));node.attrs['src']='/practice/assets/'+asset
  if node.tag=='input' and node.attrs.get('type')=='hidden':
   q=int(node.attrs['data-lq']);node.tag='select';node.attrs.pop('type');node.add(Node('option',{'value':''},'Choose an answer'))
   for letter in ('ABCDEFGHIJ' if 16<=q<=20 else 'ABCDEF'):node.add(Node('option',{'value':letter},letter))
 # Remove visual drop targets; the native select is the sole answer field.
 for node in list(root.all()):
  if 'drag-drop' in h['cls'](node):h['remove'](node)
 markup=''.join(serialize(c) for c in root.children)
 # Sanitizing before adaptation strips data attributes: adapt the original tree via raw serializer.
 def raw(node):
  if not node.tag:return html.escape(node.text)
  attrs=''.join(' '+a+'="'+html.escape(str(v),quote=True)+'"' for a,v in node.attrs.items())
  return '<'+node.tag+attrs+'>'+('' if node.tag in h['VOID'] else html.escape(node.text)+''.join(raw(c) for c in node.children)+'</'+node.tag+'>')
 markup=''.join(raw(c) for c in root.children);questions,fields=adapt(markup,n,k,{})
 assert len(fields)==10,(k,fields)
 parts.append({'id':k,'questions':questions,'passage':''.join(transcripts[k]),'transcriptStatus':'supplied','fieldNames':list(fields),'fieldLabels':fields,'audioUrls':[f'/practice/assets/listening-{n}.mp3']})
 keyparts[str(k)]={'questionNumbers':list(range((k-1)*10+1,k*10+1)),'groups':[]}
paper={'id':tid,'resource':'listening','test':n,'title':f'Listening · Test {n}','backUrl':'/?view=listening','audioScope':'test','parts':parts,'provenance':{'type':'user-provided-html','file':'FULL MOCK 05.10.2026.html','sourceFileSha256':sha}}
save(f'public/practice/{tid}.json',paper)
keys[tid]={'test':n,'module':'listening','answers':{str(q):v.split('|') if isinstance(v,str) else v for q,v in d['answers'].items()},'parts':keyparts,'sources':[{'part':k,'label':'FULL MOCK 05.10.2026.html','type':'user-provided-html'} for k in range(1,5)]}
catalog.append({'id':tid,'number':n,'title':f'Test {n}','partCount':4,'questionCount':40,'topics':'Local Newspaper Enquiry · Hospitality Training · Battery-Powered Motorbike · History of the Telescope'})
save('src/data/practice-listening-catalog.json',catalog);save('src/data/practice-listening-keys.json',keys);print('Imported',tid)
