"""Sanitize the extracted static tests and adapt controls to the shared exam player."""
import base64
import hashlib
import html
import json
import re
from pathlib import Path
from html.parser import HTMLParser

class Node:
    def __init__(self, tag='', attrs=None, text=''):
        self.tag, self.attrs, self.text, self.children, self.parent = tag, dict(attrs or []), text, [], None
    def add(self, child):
        child.parent = self
        self.children.append(child)
        return child
    def all(self):
        yield self
        for child in list(self.children): yield from child.all()

VOID = {'input','img','br','hr','wbr'}
class Tree(HTMLParser):
    def __init__(self, markup):
        super().__init__(convert_charrefs=True)
        self.root=Node('root'); self.current=self.root
        self.feed(markup)
    def handle_starttag(self, tag, attrs):
        node=self.current.add(Node(tag,attrs))
        if tag not in VOID: self.current=node
    def handle_startendtag(self, tag, attrs):
        self.current.add(Node(tag,attrs))
    def handle_endtag(self, tag):
        node=self.current
        while node.parent:
            if node.tag==tag:
                self.current=node.parent; return
            node=node.parent
    def handle_data(self, data): self.current.add(Node(text=data))

def cls(node): return node.attrs.get('class','').split()
def ancestor(node, predicate):
    while node:
        if predicate(node): return node
        node=node.parent
def remove(node): node.parent.children.remove(node)
def number_node(n): return Node('strong',{'class':'ielts-listening-question-number'},str(n))
def question(node, numbers):
    node.attrs['class']=' '.join(cls(node)+['ielts-listening-question-item'])
    for n in reversed(numbers):
        child=number_node(n); child.parent=node; node.children.insert(0,child)

ALLOWED={'section','div','p','span','strong','b','em','i','h2','h3','h4','table','thead','tbody','tr','th','td','ul','ol','li','label','select','option','input','img','br','hr','small','sup','sub'}
ATTRS={'class','colspan','rowspan','scope','start','type','name','value','aria-label','alt','src','placeholder','autocomplete','id'}
def serialize(node):
    if not node.tag: return html.escape(node.text,quote=False)
    if node.tag in {'script','style','iframe','object','embed','svg','details'}: return ''
    children=html.escape(node.text,quote=False)+''.join(serialize(c) for c in node.children)
    if node.tag not in ALLOWED: return children
    attrs={k:v for k,v in node.attrs.items() if k in ATTRS and v is not None}
    if 'src' in attrs and not re.fullmatch(r'/practice/assets/[a-z0-9.-]+',attrs['src']): del attrs['src']
    attributes=''.join(f' {k}="{html.escape(v,quote=True)}"' for k,v in attrs.items())
    return '<'+node.tag+attributes+'>'+('' if node.tag in VOID else children+'</'+node.tag+'>')

def adapt(markup, test, part, groups):
    root=Tree(markup).root
    for node in list(root.all()):
        if 'feedback-pill' in cls(node): remove(node)
        if node.tag=='img' and node.attrs.get('src','').startswith('data:image/jpeg;base64,'):
            data=base64.b64decode(node.attrs['src'].split(',',1)[1],validate=True)
            path=Path('public/practice/assets/sports-centre.jpg');path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
            node.attrs['src']='/practice/assets/sports-centre.jpg'
    fields={}
    for node in list(root.all()):
        if node.tag not in {'input','select'}: continue
        groupid=node.attrs.get('data-group')
        if node.attrs.get('type')=='checkbox':
            host=ancestor(node,lambda n:'checkbox-group' in cls(n) or 'ms-group' in cls(n))
            numbers=groups[groupid]['qs'] if groupid else [int(n) for n in host.attrs['data-ms-ids'].split(',')]
            n=numbers[0];name=f'practice_{test}_{n}_{numbers[-1]}'
            if name not in fields: question(host,numbers)
        else:
            n=int(re.sub(r'\D','',node.attrs.get('data-lq') or node.attrs.get('data-q') or ''))
            numbers=[n];name=f'practice_{test}_{n}'
            if node.attrs.get('type')=='hidden':
                host=node.parent
                for child in list(host.children):
                    if 'drag-drop' in cls(child): remove(child)
                node.tag='select';node.attrs.pop('type',None)
                node.add(Node('option',{'value':''},'Choose an answer'))
                for letter in 'ABCDEFG': node.add(Node('option',{'value':letter},letter))
            if name not in fields:
                if node.attrs.get('type')=='radio':
                    host=ancestor(node,lambda n:n.tag=='li' or 'q-card' in cls(n));question(host,numbers)
                elif 'matching-item' in cls(node.parent) or 'drag-item-row' in cls(node.parent):
                    question(node.parent,numbers)
                else:
                    wrapper=Node('span');parent=node.parent;i=parent.children.index(node)
                    parent.children[i]=wrapper;wrapper.parent=parent;wrapper.add(node);question(wrapper,numbers)
        node.attrs.update(name=name,id=f'{name}_{node.attrs.get("value","")}',autocomplete='off',**{'aria-label':f'Question {n}'+(f': {node.attrs["value"]}' if node.attrs.get('type') in {'radio','checkbox'} else '')})
        if node.tag=='input' and node.attrs.get('type') not in {'radio','checkbox'}:node.attrs['placeholder']='Answer'
        fields[name]=f'Question {n}'
    return ''.join(serialize(c) for c in root.children), fields

def main():
    extracted=json.loads(Path('.cache/listening-extracted.json').read_text(encoding='utf8'))
    keys={};catalog=[]
    for index, source in enumerate(extracted,1):
        testid=f'practice-listening-{index}'
        parts=[];transcripts={p:[] for p in range(1,5)};p=1
        for line in source['transcript']:
            if line.get('type')=='break':p=int(re.search(r'Part (\d)',line['label'])[1]);continue
            transcripts[p].append('<p><strong>'+html.escape(line.get('sp',''))+':</strong> '+html.escape(line['tx'],quote=False)+'</p>')
        key={'test':index,'module':'listening','answers':{},'parts':{},'sources':[{'part':p,'type':'user-provided-html','label':source['sourceFile'],'reference':source['sourceFile']} for p in range(1,5)]}
        for n, values in source['answers'].items():key['answers'][re.sub(r'\D','',n)]=values if isinstance(values,list) else values.split('|')
        for group in source['groups'].values():
            for n,v in zip(group['qs'],group['correct']):key['answers'][str(n)]=[v]
        for p,markup in enumerate(source['questions'],1):
            content, fields=adapt(markup,index,p,source['groups'])
            partgroups=[{'questions':g['qs'],'acceptedSets':[g['correct']]} for g in source['groups'].values() if (g['qs'][0]-1)//10+1==p]
            key['parts'][str(p)]={'questionNumbers':list(range((p-1)*10+1,p*10+1)),'groups':partgroups}
            parts.append({'id':p,'passage':''.join(transcripts[p]) or '<p>No transcript was included in the supplied file.</p>','questions':content,'fieldNames':list(fields),'fieldLabels':fields,'audioUrls':[f'/practice/assets/listening-{index}.mp3'],'sourceAudioUrl':source['audio']})
        test={'id':testid,'resource':'listening','test':index,'title':f'Listening · Test {index}','backUrl':'/?view=listening','audioScope':'test','parts':parts,'provenance':{'type':'user-provided-html','file':source['sourceFile'],'rightsStatus':'not-established','questionContentSha256':hashlib.sha256(''.join(source['questions']).encode()).hexdigest()},'sourceNotes':(['The supplied instruction for questions 4–10 omits the maximum word count. Original wording retained.'] if index==1 else [])}
        Path('public/practice').mkdir(parents=True,exist_ok=True)
        Path(f'public/practice/{testid}.json').write_text(json.dumps(test,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
        keys[testid]=key
        catalog.append({'id':testid,'number':index,'title':f'Test {index}','partCount':4,'questionCount':40,'topics':['Manor Farm · Sports centre · House prices · Drama activities','Activities for Lily · Volunteering · Tourism careers · Environmental reports'][index-1]})
    Path('src/data/practice-listening-keys.json').write_text(json.dumps(keys,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    Path('src/data/practice-listening-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print('Imported two sanitized tests, 80 answers and one map; original HTML scripts are not shipped.')

if __name__=='__main__': main()
