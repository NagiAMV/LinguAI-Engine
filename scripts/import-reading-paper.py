"""Render the extracted literal Reading data in the shared exam format."""
import hashlib,html,json,re,runpy
from pathlib import Path
h=runpy.run_path(str(Path(__file__).with_name('import-listening-html.py')))
Tree,serialize=h['Tree'],h['serialize']
def clean(s):return ''.join(serialize(n) for n in Tree(s).root.children)
def text(s):return html.unescape(' '.join(n.text for n in Tree(s).root.all())).strip()
def signature(passages):return hashlib.sha256(re.sub(r'\s+',' ',' '.join(text(p) for p in passages)).strip().lower().encode()).hexdigest()
def main():
 data=json.loads(Path('.cache/reading-paper.json').read_text(encoding='utf8'))
 cp=Path('src/data/practice-reading-catalog.json');kp=Path('src/data/practice-reading-keys.json')
 catalog=json.loads(cp.read_text(encoding='utf8')) if cp.exists() else [];keys=json.loads(kp.read_text(encoding='utf8')) if kp.exists() else {}
 sig=signature(p['content'] for p in data['PASSAGES'].values())
 for path in [*Path('public/practice').glob('practice-reading-*.json')]:
  old=json.loads(path.read_text(encoding='utf8'))
  if old.get('provenance',{}).get('sourceFileSha256')==data['sourceSha256'] or signature(re.sub(r'<h2>.*?</h2>','',p['passage'],count=1) for p in old['parts'])==sig:print('DUPLICATE:',old['title'],'; no changes.');return
 number=max([i['number'] for i in catalog],default=0)+1;tid=f'practice-reading-{number}';parts=[];answers={};explanations={}
 def control(n,options=None):
  name=f'practice_reading_{number}_{n}'
  if options:
   field=f'<select name="{name}" aria-label="Question {n}"><option value="">Choose an answer</option>'+''.join(f'<option value="{html.escape(v)}">{html.escape(v)}</option>' for v in options)+'</select>'
  else:field=f'<input type="text" name="{name}" aria-label="Question {n}" autocomplete="off" placeholder="Answer">'
  return f'<span class="ielts-reading-question-item"><strong class="ielts-reading-question-number">{n}</strong>{field}</span>'
 for p in range(1,4):
  blocks=[];fields={}
  for sec in data['SECTIONS'][str(p)]:
   kind=sec['type'];items=sec['items'];blocks.append(f'<h2>Questions {items[0]["id"]}–{items[-1]["id"]}</h2><p>{sec["instruction"]}</p>')
   if sec.get('noteTitle'):blocks.append('<h3>'+sec['noteTitle']+'</h3>')
   if kind=='wordbank':
    blocks.append('<div class="reading-word-bank">'+''.join('<p><strong>'+b['id']+'</strong> '+b['word']+'</p>' for b in sec['bank'])+'</div>')
    blocks.append('<p>'+re.sub(r'\{\{(\d+)\}\}',lambda m:control(int(m[1]),[b['id'] for b in sec['bank']]),sec['prose'])+'</p>')
   else:
    if kind in {'tfng','ynng'}:blocks.append('<p>'+('TRUE / FALSE / NOT GIVEN' if kind=='tfng' else 'YES / NO / NOT GIVEN')+'</p>')
    for item in items:
     n=item['id'];label=item.get('label','')
     if kind=='mcq':
      name=f'practice_reading_{number}_{n}'
      blocks.append(f'<div class="ielts-reading-question-item"><p><strong class="ielts-reading-question-number">{n}</strong> {label}</p>'+''.join(f'<label><input type="radio" name="{name}" aria-label="Question {n}: {o[0]}" value="{o[0]}"> {o}</label>' for o in item['options'])+'</div>')
     else:
      options=['TRUE','FALSE','NOT GIVEN'] if kind=='tfng' else ['YES','NO','NOT GIVEN'] if kind=='ynng' else sec.get('paragraphs')
      blocks.append('<p>'+label+' '+control(n,options)+' '+item.get('after','')+'</p>')
   for item in items:
    n=item['id'];fields[f'practice_reading_{number}_{n}']=f'Question {n}';answers[str(n)]=item['answer'] if isinstance(item['answer'],list) else [item['answer']]
    source=data['READING_EXPLANATIONS'].get(str(n),{});quotes=[html.unescape(q) for q in source.get('highlights',[]) if text(data['PASSAGES'][str(p)]['content']).count(html.unescape(q))==1]
    explanations[str(n)]={'part':p,'en':text(source.get('en',source.get('explanation',''))),'uz':text(source.get('uz','')),'quotes':quotes}
  passage=data['PASSAGES'][str(p)];parts.append({'id':p,'passage':clean('<h2>'+passage['title']+'</h2>'+passage['content']),'questions':clean(''.join(blocks)),'fieldNames':list(fields),'fieldLabels':fields})
 test={'id':tid,'resource':'reading','test':number,'title':f'Reading · Test {number}','backUrl':'/?view=reading','durationMinutes':60,'reviewLanguages':['en','uz'],'parts':parts,'provenance':{'type':'user-provided-html','file':data['sourceFile'],'sourceFileSha256':data['sourceSha256'],'passageTextSha256':sig,'rightsStatus':'not-established'}}
 Path(f'public/practice/{tid}.json').write_text(json.dumps(test,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 keys[tid]={'test':number,'module':'reading','answers':answers,'parts':{str(p):{'questionNumbers':[int(n.replace('Question ','')) for n in part['fieldLabels'].values()],'groups':[]} for p,part in enumerate(parts,1)},'sources':[{'part':p,'type':'user-provided-html','label':data['sourceFile'],'reference':data['sourceFile']} for p in range(1,4)]}
 catalog.append({'id':tid,'number':number,'title':f'Test {number}','partCount':3,'questionCount':40,'topics':'Business cards · Deserts · Communicating through art'})
 ep=Path('src/data/practice-reading-explanations.json');all_explanations=json.loads(ep.read_text(encoding='utf8')) if ep.exists() else {};all_explanations[tid]=explanations
 for path,value in [(cp,catalog),(kp,keys),(ep,all_explanations)]:path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print(f'Imported Reading Test {number}: three passages, 40 questions and supplied English/Uzbek explanations.')
if __name__=='__main__':main()
