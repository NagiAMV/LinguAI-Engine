import hashlib,html,json,re,runpy
from pathlib import Path
h=runpy.run_path(str(Path(__file__).with_name('import-listening-html.py')));Node,Tree,cls,serialize,adapt=(h[n] for n in ['Node','Tree','cls','serialize','adapt'])
def clean(markup):return ''.join(serialize(n) for n in Tree(markup).root.children)
def plain(markup):return ' '.join(n.text for n in Tree(markup).root.all()).strip()
def raw(n):
 if not n.tag:return html.escape(n.text,quote=False)
 attrs=''.join(f' {k}="{html.escape(v or "",quote=True)}"' for k,v in n.attrs.items())
 return '<'+n.tag+attrs+'>'+('' if n.tag in h['VOID'] else html.escape(n.text,quote=False)+''.join(raw(c) for c in n.children)+'</'+n.tag+'>')
def signature(s):return hashlib.sha256(re.sub(r'\W+',' ',plain(s).lower()).strip().encode()).hexdigest()
cp=Path('src/data/single-passage-reading-catalog.json');kp=Path('src/data/single-passage-reading-keys.json');ep=Path('src/data/single-passage-reading-explanations.json')
catalog=json.loads(cp.read_text(encoding='utf8'));keys=json.loads(kp.read_text(encoding='utf8')) if kp.exists() else {};explanations=json.loads(ep.read_text(encoding='utf8')) if ep.exists() else {}
for source in json.loads(Path('.cache/single-reading-batch.json').read_text(encoding='utf8')):
 blob=Path(source['file']).read_bytes()
 if hashlib.sha256(blob).hexdigest()!=source['sha256']:raise ValueError('Source changed')
 root=Tree(blob.decode('utf-8-sig')).root
 if source.get('PASSAGE_HTML'):
  title=source['PASSAGE_TITLE'];passage=clean('<h2>'+html.escape(title)+'</h2>'+source['PASSAGE_HTML']);questions=source['questions']
 else:
  left=next(n for n in root.all() if n.attrs.get('id')=='pane-left');right=next(n for n in root.all() if n.attrs.get('id')=='pane-right');title=plain(next(n for n in left.all() if 'passage-title' in cls(n)).text or raw(next(n for n in left.all() if 'passage-title' in cls(n))))
  passage=clean(''.join(raw(n) for n in left.children if not any(c in cls(n) for c in ['watermark','passage-label'])));questions=''.join(raw(n) for n in right.children)
 sig=signature(passage);duplicate=None
 for path in [*Path('public/practice').glob('*.json'),*Path('public/cambridge').glob('reading-*.json')]:
  old=json.loads(path.read_text(encoding='utf8'))
  if old.get('provenance',{}).get('sourceFileSha256')==source['sha256'] or any(signature(p['passage'])==sig for p in old['parts']):duplicate=old['title'];break
 if duplicate:print('DUPLICATE:',source['sourceFile'],'matches',duplicate);continue
 number=max([i['number'] for i in catalog],default=0)+1;tid=f'single-reading-{number}';tree=Tree(questions).root
 for node in list(tree.all()):
  if 'q-item' in cls(node):node.attrs['class']='q-item q-card'
  if node.tag=='b' and plain(raw(node)).strip() in source['ANSWERS']:
   h['remove'](node);continue
  if 'opt-btns' in cls(node):
   n=node.attrs['data-qnum'];values=[c.attrs['data-val'] for c in node.children if c.tag=='button'];node.tag='select';node.attrs={'data-lq':n};node.children=[];node.add(Node('option',{'value':''},'Choose an answer'))
   for v in values:node.add(Node('option',{'value':v},v))
  if node.tag in {'input','select'}:
   node.attrs['data-lq']=node.attrs.get('data-lq') or node.attrs.get('data-qnum') or node.attrs.get('data-q')
   if node.tag=='input':node.attrs.setdefault('type','text')
 markup,fields=adapt(''.join(raw(n) for n in tree.children),f'single_reading_{number}',1,{})
 if len(fields)!=len(source['ANSWERS']):raise ValueError('Incomplete controls')
 part={'id':1,'passage':passage,'questions':markup,'fieldNames':list(fields),'fieldLabels':fields};numbers=sorted(map(int,source['ANSWERS']))
 test={'id':tid,'resource':'reading','test':number,'title':title,'backUrl':'/?view=reading&format=single','durationMinutes':20,'reviewLanguages':['en','uz'],'parts':[part],'provenance':{'type':'user-provided-html','file':source['sourceFile'],'sourceFileSha256':source['sha256'],'passageTextSha256':sig,'rightsStatus':'not-established'}}
 Path(f'public/practice/{tid}.json').write_text(json.dumps(test,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 groups=[{'questions':[11,12,13],'acceptedSets':[['C','D','E']]}] if source['sourceFile']=='William_Gilbert_and_Magnetism.html' else []
 keys[tid]={'test':number,'module':'reading','answers':source['ANSWERS'],'parts':{'1':{'questionNumbers':numbers,'groups':groups}},'sources':[{'part':1,'type':'user-provided-html','label':source['sourceFile'],'reference':source['sourceFile']}]}
 entries={}
 for n,e in source['EXPLANATIONS'].items():
  quotes=[q['txt'] for q in source.get('HIGHLIGHTS',[]) if str(q['q'])==str(n) and plain(passage).count(q['txt'])==1]
  entries[n]={'part':1,'en':e['en'],'uz':e['uz'],'quotes':quotes}
 for group in groups:
  members=[entries[str(n)] for n in group['questions']];entries['–'.join(map(str,group['questions']))]={'part':1,'en':'\n\n'.join(dict.fromkeys(e['en'] for e in members)),'uz':'\n\n'.join(dict.fromkeys(e['uz'] for e in members)),'quotes':list(dict.fromkeys(q for e in members for q in e['quotes']))}
 explanations[tid]=entries;catalog.append({'id':tid,'number':number,'title':title,'questionCount':len(numbers),'durationMinutes':20,'originalQuestionNumbers':numbers});print(f'Imported single passage {number}: {title}; {len(numbers)} questions.')
for path,data in [(cp,catalog),(kp,keys),(ep,explanations)]:path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
