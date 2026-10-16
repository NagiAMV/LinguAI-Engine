import hashlib,html,json,re,runpy,sys
from pathlib import Path
h=runpy.run_path(str(Path(__file__).with_name('import-listening-html.py')))
dup=runpy.run_path(str(Path(__file__).with_name('import-static-listening.py')))
Node,Tree,cls,remove,adapt,serialize=(h[n] for n in ['Node','Tree','cls','remove','adapt','serialize'])
def raw(n):
    if not n.tag:return html.escape(n.text,quote=False)
    attrs=''.join(f' {k}="{html.escape(v or "",quote=True)}"' for k,v in n.attrs.items())
    return '<'+n.tag+attrs+'>'+('' if n.tag in h['VOID'] else html.escape(n.text,quote=False)+''.join(raw(c) for c in n.children)+'</'+n.tag+'>')
def main():
    data=json.loads(Path('.cache/grid-listening-paper.json').read_text(encoding='utf8'))
    catalog_path=Path('src/data/practice-listening-catalog.json');keys_path=Path('src/data/practice-listening-keys.json')
    catalog=json.loads(catalog_path.read_text(encoding='utf8'));keys=json.loads(keys_path.read_text(encoding='utf8'))
    existing=[json.loads(Path(f'public/practice/{i["id"]}.json').read_text(encoding='utf8')) for i in catalog]
    for t in existing:
        if t['provenance'].get('sourceFileSha256')==data['sourceFileSha256']:print(f'DUPLICATE: Test {t["test"]}; no changes.');return
    number=max(i['number'] for i in catalog)+1;testid=f'practice-listening-{number}';parts=[]
    for p,markup in enumerate(data['questions'],1):
        root=Tree(markup).root
        for table in [n for n in root.all() if 'matchgrid' in cls(n)]:
            replacement=Node('div',{'class':'matching-box'});parent=table.parent;parent.children[parent.children.index(table)]=replacement;replacement.parent=parent
            for row in [n for n in table.all() if n.tag=='tr' and n.attrs.get('id','').startswith('lqi-')]:
                n=row.attrs['id'].split('-')[-1];first=next(c for c in row.children if c.tag=='td');letters=[c.attrs['value'] for c in row.all() if c.tag=='input']
                label=Node('span',{'class':'mi-label'})
                for child in list(first.children):
                    if 'num' not in cls(child):label.add(child)
                item=replacement.add(Node('div',{'class':'matching-item'}));item.add(label);select=item.add(Node('select',{'data-lq':n}));select.add(Node('option',{'value':''},'Choose an answer'))
                for letter in letters:select.add(Node('option',{'value':letter},letter))
        for n in list(root.all()):
            if 'q-num' in cls(n):remove(n)
            if n.tag=='input':
                n.attrs['data-lq']=n.attrs.get('data-q') or re.sub(r'\D','',n.attrs.get('name',''))
                n.attrs.setdefault('type','text')
                if n.attrs['type']=='radio':
                    host=h['ancestor'](n,lambda x:'q-item' in cls(x) or 'q-card' in cls(x));host.attrs['class']='q-card'
        content,fields=adapt(''.join(raw(c) for c in root.children),number,p,{})
        if len(fields)!=10:raise ValueError(f'Part {p}: {len(fields)} fields')
        parts.append({'id':p,'questions':content,'passage':'<p>No transcript was included in the supplied file.</p>','fieldNames':list(fields),'fieldLabels':fields,'audioUrls':[f'/practice/assets/listening-{number}.mp3'],'sourceAudioUrl':data['audio']})
    fingerprint=dup['fingerprint'](''.join(p['questions'] for p in parts))
    for t in existing:
        if dup['fingerprint'](''.join(p['questions'] for p in t['parts']))==fingerprint:print(f'DUPLICATE CONTENT: Test {t["test"]}; no changes.');return
    audio=Path('.cache/listening-grid.mp3').read_bytes();audio_sha=hashlib.sha256(audio).hexdigest()
    for t in existing:
        if t['provenance'].get('audioSha256')==audio_sha:raise ValueError(f'Possible duplicate audio: Test {t["test"]}')
    test={'id':testid,'resource':'listening','test':number,'title':f'Listening · Test {number}','backUrl':'/?view=listening','audioScope':'test','parts':parts,'provenance':{'type':'user-provided-html','file':data['sourceFile'],'sourceFileSha256':data['sourceFileSha256'],'questionTextSha256':fingerprint,'audioSha256':audio_sha,'rightsStatus':'not-established'},'sourceNotes':['The source is untimed practice; imported into the standard 60-minute player. No transcript was supplied.']}
    keys[testid]={'test':number,'module':'listening','answers':data['answers'],'parts':{str(p):{'questionNumbers':list(range((p-1)*10+1,p*10+1)),'groups':[]} for p in range(1,5)},'sources':[{'part':p,'type':'user-provided-html','label':data['sourceFile'],'reference':data['sourceFile']} for p in range(1,5)]}
    Path(f'public/practice/assets/listening-{number}.mp3').write_bytes(audio);Path(f'public/practice/{testid}.json').write_text(json.dumps(test,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    catalog.append({'id':testid,'number':number,'title':f'Test {number}','partCount':4,'questionCount':40,'topics':'Birthday arrangements · Curling · Art authentication · Sustainability'})
    keys_path.write_text(json.dumps(keys,ensure_ascii=False,indent=2)+'\n',encoding='utf8');catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print(f'Imported Test {number}: 40 questions, full recording, source keys. No transcript supplied.')
if __name__=='__main__':main()
