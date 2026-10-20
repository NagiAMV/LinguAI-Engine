"""Normalize reviewed literal data and static reading panes; original startup code never runs."""
import json,re,runpy,html,hashlib,sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf8')
h=runpy.run_path('scripts/import-listening-html.py');Node,Tree,cls=h['Node'],h['Tree'],h['cls']
def raw(n):
 if not n.tag:return html.escape(n.text,quote=False)
 return '<'+n.tag+''.join(f' {k}="{html.escape(v or "",quote=True)}"' for k,v in n.attrs.items())+'>'+('' if n.tag in h['VOID'] else html.escape(n.text,quote=False)+''.join(raw(c) for c in n.children)+'</'+n.tag+'>')
def text(n):return ' '.join(c.text for c in n.all()).strip()
def parse_num(n):
 value=n.attrs.get('data-lq') or n.attrs.get('data-qnum') or n.attrs.get('data-q') or n.attrs.get('data-n') or n.attrs.get('name') or n.attrs.get('id','');m=re.findall(r'\d+',value);return int(m[0]) if m else None
def host_num(n):
 while n:
  v=n.attrs.get('id','');m=re.search(r'(?:qblock|qtarget|qcard|tfnblock|parablock|matchblock|qb|mcq|q)[-_]?(\d+)',v)
  if m:return int(m[1])
  if n.attrs.get('data-qnum'):return int(n.attrs['data-qnum'])
  n=n.parent
 return None
def select(n,values):
 node=Node('select',{'data-lq':str(n)});node.add(Node('option',{'value':''},'Choose an answer'))
 for v in values:node.add(Node('option',{'value':str(v)},str(v)))
 return node

def normkeys(v):
 answers={}
 for key in ['CORRECT','ANSWERS','correctAnswers','PEOPLE_CORRECT','YN_CORRECT','DATE_CORRECT','TFNG_CORRECT','SC_ACCEPT']:
  for n,a in v.get(key,{}).items():
   if not re.fullmatch(r'q?\d+',str(n)):continue
   answers[str(int(re.sub(r'\D','',str(n))))]=a if isinstance(a,list) else str(a).split('|')
 for key,value in v.items():
  if isinstance(value,list):
   for q in value:
    if not isinstance(q,dict) or not isinstance(q.get('id'),int):continue
    a=q.get('accept',q.get('correct'))
    if a is not None:answers[str(q['id'])]=a if isinstance(a,list) else str(a).split('|')
 for n,a in v.get('ACCEPT',{}).items():answers[re.sub(r'\D','',n)]=a
 return answers

def grams(s):
 words=re.findall(r'\w+',html.unescape(s).lower());words=[w for w in words if len(w)>1];return set(zip(*(words[i:] for i in range(5))))
def existing_match(passage):
 g=grams(text(Tree(passage).root));best=(0,None)
 for path in Path('public/practice').glob('single-reading-*.json'):
  old=json.loads(path.read_text(encoding='utf8'))
  if old.get('resource')!='reading':continue
  for p in old['parts']:
   other=grams(text(Tree(p['passage']).root));ratio=len(g&other)/min(len(g),len(other)) if min(len(g),len(other)) else 0
   if ratio>best[0]:best=(ratio,(old['id'],p['id']))
 return best

out=[];duplicates=[]
for d in json.loads(Path('.cache/rendered-27.json').read_text(encoding='utf8')):
 v=d['vars']
 if 'QSECTIONS'in v or 'L_HTML'in d:continue
 root=Tree(Path(d['file']).read_text(encoding='utf-8-sig')).root
 for id,markup in d.get('panels',{}).items():
  n=next(n for n in root.all() if n.attrs.get('id')==id);n.children=[]
  for child in Tree(markup).root.children:n.add(child)
 left=next((n for n in root.all() if n.attrs.get('id')in ['pane-left','passagePane','passage-text-1']),None)
 passage=v.get('PASSAGE_HTML') or (''.join(raw(c) for c in left.children) if left else '')
 assert passage,d['name']+' missing passage'
 score,match=existing_match(passage)
 if score>.96:
  print('DUPLICATE PASSAGE',d['name'],match,round(score,3));duplicates.append({'file':d['name'],'match':match,'similarity':score});continue
 if score>.85:print('REVIEW SIMILARITY',d['name'],match,round(score,3))
 title=v.get('PASSAGE_TITLE')
 if not title:
  headings=[n for n in (left.all() if left else []) if n.tag in ['h1','h2'] or 'passage-title'in cls(n)]
  title=text(headings[0]) if headings else re.sub(r'IELTS.*?[—–-]\s*','',text(next(n for n in root.all() if n.tag=='title')))
 right=next((n for n in root.all() if n.attrs.get('id')in ['pane-right','qPane','questions-1']),None)
 qroot=Tree(d.get('questions') or ''.join(raw(c) for c in right.children)).root
 answers=normkeys(v);assert answers,d['name']+' missing keys'
 groups=[]
 for n,g in v.get('PAIR_GROUPS',{}).items():
  nums=sorted([int(n),g['partner']])
  if not any(x['questions']==nums for x in groups):groups.append({'questions':nums,'acceptedSets':[g['set']]})
 # Adjacent choose-two slots explicitly share the same letter set in these source keys.
 for n in sorted(map(int,answers)):
  a=answers[str(n)]
  if len(a)>1 and all(re.fullmatch('[A-Z]',x)for x in a) and answers.get(str(n+1))==a and not any(n in x['questions'] for x in groups):groups.append({'questions':[n,n+1],'acceptedSets':[a]})
 # Complete source keys derived from PAIR_GROUPS, without using them to construct question options.
 for g in groups:
  for n,a in zip(g['questions'],g['acceptedSets'][0]):answers.setdefault(str(n),[a])
 banks={}
 for n in qroot.all():
  val=n.attrs.get('data-key') or n.attrs.get('data-val');bank=n.attrs.get('data-bank')
  if val and bank:banks.setdefault(bank,[]).append(val)
 for n in list(qroot.all()):
  # Source click-only True/False and letter controls become native selects.
  buttons=[c for c in n.children if c.tag=='button' and 'data-val'in c.attrs]
  if buttons and (n.attrs.get('data-qnum') or n.attrs.get('data-q')):
   q=parse_num(n);replacement=select(q,[b.attrs['data-val'] for b in buttons]);n.tag=replacement.tag;n.attrs=replacement.attrs;n.text='';n.children=replacement.children
  if any(c in cls(n) for c in ['tfn-opts','tfng-opts','multi-opts','mcq-opts']) and not any(c.tag in ['input','select'] for c in n.all()):
   q=host_num(n)
   if q:
    opts=[]
    for c in n.children:
     if not c.tag:continue
     value=c.attrs.get('data-val')
     if not value:
      onclick=c.attrs.get('onclick','');m=re.search(r"(?:select\w+)\(\s*\d+\s*,\s*['\"]([^'\"]+)",onclick)
      value=m[1] if m else None
     if value:opts.append((value,text(c)))
    if opts:
     n.children=[]
     for value,label in opts:
      lab=n.add(Node('label'));lab.add(Node('input',{'type':'radio','data-lq':str(q),'value':value}));lab.add(Node(text=label))
  if 'drop-zone'in cls(n):
   q=parse_num(n);bank=n.attrs.get('data-bank');values=list(dict.fromkeys(banks.get(bank,[])))
   if not values:
    # Source bank is elsewhere in the page; matching keys never determine the options.
    banknode=next((b for b in root.all() if b.attrs.get('id')=='bank-'+str(bank)),None)
    if banknode:values=list(dict.fromkeys(b.attrs.get('data-key')or b.attrs.get('data-val') for b in banknode.all() if b.attrs.get('data-key')or b.attrs.get('data-val')))
   assert q and values,(d['name'],'missing drag bank',q,bank)
   replacement=select(q,values);n.tag='select';n.attrs=replacement.attrs;n.text='';n.children=replacement.children
 # Replace choose-two checkbox widgets with one selector per answer slot, preserving option descriptions.
 for g in groups:
  checks=[n for n in qroot.all() if n.tag=='input' and n.attrs.get('type')=='checkbox' and (parse_num(n) in g['questions'] or host_num(n)in g['questions'])]
  if checks:
   parent=checks[0].parent
   while parent.parent and not all(any(c is x for c in parent.all()) for x in checks):parent=parent.parent
   options=list(dict.fromkeys(n.attrs['value'] for n in checks))
   for n in checks:h['remove'](n)
   for q in g['questions']:parent.add(select(q,options))
 for n in qroot.all():
  if n.tag in ['input','select']:
   q=parse_num(n) or host_num(n);assert q,(d['name'],n.attrs);n.attrs['data-lq']=str(q)
   if n.tag=='input' and n.attrs.get('type')=='radio':
    host=n.parent
    while host.parent and {parse_num(c) for c in host.parent.all() if c.tag=='input' and c.attrs.get('type')=='radio'}=={q}:host=host.parent
    host.attrs['class']=' '.join([*cls(host),'q-card'])
 # Native controls already carry the source number; strip decorative actions and unsafe markup later.
 markup=''.join(raw(c) for c in qroot.children);_,fields=h['adapt'](markup,'preview',1,{})
 numbers=sorted(int(label.replace('Question ','')) for label in fields.values())
 assert numbers==sorted(map(int,answers)),(d['name'],'fields',numbers,'keys',sorted(map(int,answers)))
 explanations=v.get('EXPLANATIONS',v.get('EXPLAIN',v.get('explanations',{})));ex={}
 for n,e in explanations.items():
  n=re.sub(r'\D','',n)
  if n not in answers:continue
  ex[n]={'en':e if isinstance(e,str) else e.get('en',''),'uz':'' if isinstance(e,str) else e.get('uz','')}
 assert all(str(n)in ex and ex[str(n)]['en'] for n in answers),(d['name'],'missing explanations')
 out.append({'file':d['file'],'sourceFile':d['name'],'sha256':d['sha256'],'PASSAGE_TITLE':title,'PASSAGE_HTML':passage,'questions':markup,'ANSWERS':answers,'EXPLANATIONS':ex,'HIGHLIGHTS':v.get('HIGHLIGHTS',[]),'groups':groups,'reviewLanguages':['en','uz'] if all(e['uz'] for e in ex.values()) else ['en']})
 print('PREPARED',d['name'],title,len(numbers),'groups',len(groups))
Path('.cache/normalized27-singles.json').write_text(json.dumps(out,ensure_ascii=False),encoding='utf8');Path('.cache/batch27-duplicates.json').write_text(json.dumps(duplicates,ensure_ascii=False,indent=2),encoding='utf8')
