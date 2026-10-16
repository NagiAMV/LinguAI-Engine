"""Import the reviewed L_HTML/KEY Listening format without source page code."""
from pathlib import Path
import json,re,html,hashlib,runpy
h=runpy.run_path('scripts/import-listening-html.py');Tree,cls,Node=h['Tree'],h['cls'],h['Node']
def raw(n):
 if not n.tag:return html.escape(n.text,quote=False)
 return '<'+n.tag+''.join(f' {k}="{html.escape(v or "",quote=True)}"' for k,v in n.attrs.items())+'>'+('' if n.tag in h['VOID'] else html.escape(n.text,quote=False)+''.join(raw(c) for c in n.children)+'</'+n.tag+'>')
d=next(d for d in json.loads(Path('.cache/rendered-27.json').read_text(encoding='utf8')) if 'L_HTML'in d);v=d['vars'];cp=Path('src/data/practice-listening-catalog.json');kp=Path('src/data/practice-listening-keys.json');catalog=json.loads(cp.read_text(encoding='utf8'));keys=json.loads(kp.read_text(encoding='utf8'))
if any(json.loads(Path('public/practice/'+i['id']+'.json').read_text(encoding='utf8'))['provenance'].get('sourceFileSha256')==d['sha256'] for i in catalog):print('DUPLICATE',d['name']);raise SystemExit()
number=max(i['number'] for i in catalog)+1;tid=f'practice-listening-{number}';groups={ '_'.join(map(str,g['nums'])):{'qs':g['nums'],'correct':g['answers']} for g in v['GROUPS']};parts=[];topics=[]
for p in range(1,5):
 root=Tree(d['L_HTML'][str(p)]).root
 for n in root.all():
  if n.tag!='input':continue
  if n.attrs.get('type')=='checkbox':
   groupid=n.attrs['data-group'];host=n.parent
   while host.parent and {c.attrs.get('data-group') for c in host.parent.all() if c.tag=='input'and c.attrs.get('type')=='checkbox'}=={groupid}:host=host.parent
   host.attrs['class']=' '.join([*cls(host),'ms-group']);host.attrs['data-ms-ids']=','.join(map(str,groups[groupid]['qs']));continue
  q=int(n.attrs.get('data-q') or re.sub(r'\D','',n.attrs.get('name','')));n.attrs['data-lq']=str(q)
  if n.attrs.get('type')=='radio':
   host=n.parent
   while host.parent and {c.attrs.get('name') for c in host.parent.all() if c.tag=='input' and c.attrs.get('type')=='radio'}=={n.attrs['name']}:host=host.parent
   host.attrs['class']=' '.join([*cls(host),'q-card'])
  else:n.attrs['type']='text'
 content,fields=h['adapt'](''.join(raw(n) for n in root.children),number,p,groups);assert len(fields)==10-sum(len(g['qs'])-1 for g in groups.values() if (g['qs'][0]-1)//10+1==p)
 parts.append({'id':p,'passage':'<p>No transcript was included in the supplied file.</p>','transcriptStatus':'not-supplied','questions':content,'fieldNames':list(fields),'fieldLabels':fields,'audioUrls':[f'/practice/assets/listening-{number}.mp3'],'sourceAudioUrl':'https://raw.githubusercontent.com/Shaxxriyor/new-listening-tests/main/test%2B16.mp3'})
 topics+=re.findall(r'<h[23][^>]*>(.*?)</h[23]>',content)[:1]
audio=Path('.cache/listening-16.mp3').read_bytes();assert len(audio)>1000000;Path(f'public/practice/assets/listening-{number}.mp3').write_bytes(audio)
test={'id':tid,'resource':'listening','test':number,'title':f'Listening · Test {number}','backUrl':'/?view=listening','audioScope':'test','parts':parts,'provenance':{'type':'user-provided-html','file':d['name'],'sourceFileSha256':d['sha256'],'audioSha256':hashlib.sha256(audio).hexdigest(),'rightsStatus':'not-established'}}
keys[tid]={'test':number,'module':'listening','answers':v['KEY'],'parts':{str(p):{'questionNumbers':list(range((p-1)*10+1,p*10+1)),'groups':[{'questions':g['qs'],'acceptedSets':[g['correct']]} for g in groups.values() if (g['qs'][0]-1)//10+1==p]} for p in range(1,5)},'sources':[{'part':p,'type':'user-provided-html','label':d['name'],'reference':d['name']} for p in range(1,5)]}
catalog.append({'id':tid,'number':number,'title':f'Test {number}','partCount':4,'questionCount':40,'topics':'The London Relocation Services · Moving Office · Mona’s presentation · Graphical symbols'})
for path,data in [(Path('public/practice/'+tid+'.json'),test),(cp,catalog),(kp,keys)]:path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Imported Listening',number,d['name'],'40 questions, local audio, no supplied transcript.')
