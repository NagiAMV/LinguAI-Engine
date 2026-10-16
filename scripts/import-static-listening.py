"""Append a supplied static Listening paper, rejecting repeats before any writes."""
import argparse
import base64
import hashlib
import html
import json
import re
from pathlib import Path
import runpy
helpers=runpy.run_path(str(Path(__file__).with_name('import-listening-html.py')))
Node,Tree,cls,remove,adapt,serialize=(helpers[n] for n in ['Node','Tree','cls','remove','adapt','serialize'])

def digest(data): return hashlib.sha256(data).hexdigest()
def fingerprint(markup):
    # Ignore cosmetic HTML, whitespace, punctuation and question numbering.
    tree=Tree(markup)
    for node in list(tree.root.all()):
        if node.tag in {'input','select','script','style'} or 'ielts-listening-question-number' in cls(node):
            if node.parent:remove(node)
    text=' '.join(n.text for n in tree.root.all())
    return digest(re.sub(r'[^\w]+',' ',html.unescape(text).lower()).strip().encode())

def prepare(markup, groups):
    root=Tree(markup).root
    for node in list(root.all()):
        if 'dragbank' in cls(node) or 'multi-check' in cls(node) or 'qnum' in cls(node):remove(node)
        elif 'drop-zone' in cls(node):
            n=node.attrs['data-qnum'];node.tag='select';node.attrs={'data-lq':n};node.text='';node.children=[]
            node.add(Node('option',{'value':''},'Choose an answer'))
            for letter in 'ABCDEF':node.add(Node('option',{'value':letter},letter))
        elif 'multi-block' in cls(node):
            node.attrs['class']='q-card'; n=re.search(r'qblock-(\d+)',node.attrs['id'])[1]
            for option in node.children:
                if 'multi-opts' not in cls(option):continue
                for label in option.children:
                    letter=label.attrs['id'].rsplit('-',1)[1];label.tag='label'
                    label.add(Node('input',{'type':'radio','data-lq':n,'value':letter}))
                    label.children.insert(0,label.children.pop())
        elif 'ms-block' in cls(node):
            node.attrs['class']='checkbox-group';groupid='g'+node.attrs['data-qs'].replace(',','')
            for option in node.children:
                if 'ms-opts' not in cls(option):continue
                for label in option.children:
                    letter=label.attrs['id'].rsplit('-',1)[1];label.tag='label'
                    label.add(Node('input',{'type':'checkbox','data-group':groupid,'value':letter}))
                    label.children.insert(0,label.children.pop())
        elif node.tag=='input' and 'data-qnum' in node.attrs:node.attrs['data-lq']=node.attrs['data-qnum']
    # Keep the adapter metadata until the final allow-list sanitizer runs.
    def raw(node):
        if not node.tag:return html.escape(node.text,quote=False)
        attrs=''.join(f' {k}="{html.escape(v or "",quote=True)}"' for k,v in node.attrs.items())
        content=html.escape(node.text,quote=False)+''.join(raw(c) for c in node.children)
        return '<'+node.tag+attrs+'>'+('' if node.tag in helpers['VOID'] else content+'</'+node.tag+'>')
    return ''.join(raw(c) for c in root.children)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('file');parser.add_argument('--check-only',action='store_true');args=parser.parse_args()
    source=Path(args.file);blob=source.read_bytes();markup=blob.decode('utf-8-sig')
    root=Tree(markup).root
    panels=[n for n in root.all() if n.attrs.get('id') in {'part1','part2','part3','part4'}]
    if len(panels)!=4:raise ValueError('Expected four question panels')
    # The extraction step supplies literal answer data; bind it to this exact file.
    data=json.loads(Path('.cache/static-listening-paper.json').read_text(encoding='utf8'))
    if data.get('_sourceSha256')!=digest(blob):raise ValueError('Extracted data does not match the supplied file')
    keys_path=Path('src/data/practice-listening-keys.json');catalog_path=Path('src/data/practice-listening-catalog.json')
    keys=json.loads(keys_path.read_text(encoding='utf8'));catalog=json.loads(catalog_path.read_text(encoding='utf8'))
    source_sha=digest(blob)
    for item in catalog:
        previous=json.loads(Path(f'public/practice/{item["id"]}.json').read_text(encoding='utf8'))
        if previous['provenance'].get('sourceFileSha256')==source_sha:
            print(f'DUPLICATE: already imported as Test {item["number"]}; nothing changed.');return
    number=max(item['number'] for item in catalog)+1;testid=f'practice-listening-{number}'
    groups={'g'+''.join(map(str,g['qs'])):g for g in data['MULTI_GROUPS']}
    parts=[]
    for p,panel in enumerate(panels,1):
        # Serialize with original data attributes for the control adapter.
        def raw(n):
            if not n.tag:return html.escape(n.text,quote=False)
            attrs=''.join(f' {k}="{html.escape(v or "",quote=True)}"' for k,v in n.attrs.items())
            return '<'+n.tag+attrs+'>'+('' if n.tag in helpers['VOID'] else html.escape(n.text,quote=False)+''.join(raw(c) for c in n.children)+'</'+n.tag+'>')
        content,fields=adapt(prepare(raw(panel),groups),number,p,groups)
        if len(fields)!=(9 if p==1 else 10):raise ValueError(f'Part {p}: incomplete fields ({len(fields)})')
        transcript=''.join(serialize(n) for n in Tree(data['TRANSCRIPTS'][str(p)]).root.children)
        parts.append({'id':p,'passage':transcript,'questions':content,'fieldNames':list(fields),'fieldLabels':fields,'audioUrls':[f'/practice/assets/listening-{number}.mp3']})
    content_sha=fingerprint(''.join(p['questions'] for p in parts))
    for item in catalog:
        previous=json.loads(Path(f'public/practice/{item["id"]}.json').read_text(encoding='utf8'))
        if fingerprint(''.join(p['questions'] for p in previous['parts']))==content_sha:
            print(f'DUPLICATE CONTENT: already imported as Test {item["number"]}; nothing changed.');return
    audio=next(n.attrs['src'] for n in root.all() if n.tag=='source' and n.attrs.get('src','').startswith('data:audio/mpeg;base64,'))
    audio_blob=base64.b64decode(audio.split(',',1)[1],validate=True)
    audio_sha=digest(audio_blob)
    for item in catalog:
        existing=Path(f'public/practice/assets/listening-{item["number"]}.mp3')
        if existing.exists() and digest(existing.read_bytes())==audio_sha:
            raise ValueError(f'Possible duplicate: identical recording already used in Test {item["number"]}. Review before importing.')
    answers={str(n):values for n,values in data['SC_ACCEPT'].items()}
    for keyname in ['MCQ_CORRECT','LETTERBANK_CORRECT']:answers.update({str(n):[v] for n,v in data[keyname].items()})
    for group in groups.values():
        for n,v in zip(group['qs'],group['correct']):answers[str(n)]=[v]
    # The source key's "dives" cannot complete "deepest-___ reptiles";
    # its own transcript explicitly describes "deep-diving animals".
    if answers['32']!=['dives'] or 'deep-diving' not in data['TRANSCRIPTS']['4']:raise ValueError('Review Q32 before import')
    answers['32']=['diving']
    key={'test':number,'module':'listening','answers':answers,'parts':{str(p):{'questionNumbers':list(range((p-1)*10+1,p*10+1)),'groups':[{'questions':g['qs'],'acceptedSets':[g['correct']]} for g in groups.values() if (g['qs'][0]-1)//10+1==p]} for p in range(1,5)},'sources':[{'part':p,'type':'user-provided-html','label':source.name,'reference':source.name} for p in range(1,5)]}
    test={'id':testid,'resource':'listening','test':number,'title':f'Listening · Test {number}','backUrl':'/?view=listening','audioScope':'test','durationMinutes':40,'parts':parts,'provenance':{'type':'user-provided-html','file':source.name,'rightsStatus':'not-established','sourceFileSha256':source_sha,'questionTextSha256':content_sha,'audioSha256':audio_sha},'sourceNotes':['Q32 source key corrected from dives to diving: the question requires deepest-diving and the transcript says deep-diving animals.','Q40 says more energy while the supplied transcript says 20% less energy. Original question wording retained; the keyword energy is unchanged.']}
    if args.check_only:print(f'NEW: ready to import as Test {number}, 40 questions, embedded MP3 ({len(audio_blob)} bytes).');return
    Path(f'public/practice/assets/listening-{number}.mp3').write_bytes(audio_blob)
    Path(f'public/practice/{testid}.json').write_text(json.dumps(test,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    keys[testid]=key;catalog.append({'id':testid,'number':number,'title':f'Test {number}','partCount':4,'questionCount':40,'topics':'Insurance policies · Eyesaver charity · Study options · Leatherback turtles'})
    keys_path.write_text(json.dumps(keys,ensure_ascii=False,indent=2)+'\n',encoding='utf8');catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    Path('docs/imported-listening-3-corrections.json').write_text(json.dumps({'sourceFile':source.name,'corrections':[{'question':32,'previous':['dives'],'accepted':['diving'],'reason':'deepest-___ reptiles; transcript describes deep-diving animals'}],'retainedSourceIssue':{'question':40,'questionWording':'more energy','transcriptWording':'20% less energy'}},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(f'Imported Test {number}: 40 questions, four transcripts, embedded MP3; duplicate fingerprints saved.')

if __name__=='__main__':main()
