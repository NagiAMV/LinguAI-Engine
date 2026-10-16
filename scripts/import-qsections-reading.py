"""Convert literal QSECTIONS full papers to the established Reading data schema."""
import json,re,runpy,sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf8')
def cell(value):
 if isinstance(value,list):return ''.join(cell(x) for x in value)
 return '{{'+re.sub(r'\D','',value)+'}}' if isinstance(value,str) and re.fullmatch(r'q\d+',value) else str(value)
for d in json.loads(Path('.cache/rendered-27.json').read_text(encoding='utf8')):
 v=d['vars']
 if 'QSECTIONS'not in v:continue
 data={'sourceFile':d['name'],'sourceSha256':d['sha256'],'SECTIONS':{},'PASSAGES':{},'READING_EXPLANATIONS':v['EXPLANATIONS']}
 for p,passage in enumerate(v['PASSAGES'],1):
  data['PASSAGES'][str(p)]={'title':passage['title'],'content':passage['html']};sections=[]
  for sec in v['QSECTIONS'][p-1]:
   typ=sec['type'];s={'instruction':sec['instruction'].replace('Tap a letter, then tap the blank.','Choose the correct letter in each answer box.').replace('Tap a heading, then tap the blank.','Choose the correct heading in each answer box.'),'items':[{'id':q['n'],'answer':q.get('accept') or q['answer'],'label':q.get('text',q.get('before',q.get('section',''))),'after':q.get('after','')} for q in sec['questions']]}
   if typ=='tfn':s['type']='tfng'
   elif typ=='text_fill':s['type']='notes'
   elif typ=='heading_match':s['type']='matching-headings';data['PASSAGES'][str(p)]['headings']=[{'id':x['letter'],'text':x['text']} for x in sec['headings']]
   elif typ=='drag_match':s['type']='matching-features';s['people']=[{'l':x['key'],'name':x['label']} for x in sec['bank']];s['bankLabel']='List of options'
   elif typ=='matching_grid':s['type']='matching-features';s['people']=[{'l':letter,'name':re.sub(r'^'+re.escape(letter)+r'\s*[–—:-]?\s*','',label)} for letter,label in zip(sec['letters'],sec['legend'])];s['bankLabel']='List of options'
   elif typ=='table_fill':s.update(type='table',headers=sec['tableHeaders'],rows=[[cell(c) for c in row] for row in sec['rows']])
   else:raise ValueError('Unreviewed section '+typ)
   sections.append(s)
  data['SECTIONS'][str(p)]=sections
 Path('.cache/reading-paper.json').write_text(json.dumps(data,ensure_ascii=False),encoding='utf8');runpy.run_path('scripts/import-reading-paper.py',run_name='__main__')
