"""Extract source numbering, page spans and raw answer records for review."""
import json,re,sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf8')
pages=json.loads(Path('.cache/80-pages.json').read_text(encoding='utf8'))
starts=[]
for p in pages[:128]:
 m=re.search(r'\bTEST\s+(\d+)\b',p['text'])
 if m:starts.append((int(m[1]),p['page']))
papers=[]
for i,(n,page) in enumerate(starts):
 end=starts[i+1][1]-1 if i+1<len(starts) else 128
 selected=[p for p in pages if page<=p['page']<=end and len(re.sub(r'Proper English School[^\n]*|\bPART\s*\d\b|\d|\s','',p['text']))>30]
 papers.append({'number':n,'sectionNumber':(n-1)//20+1,'sectionTest':(n-1)%20+1,'pages':[p['page'] for p in selected],'text':'\n'.join(p['text'] for p in selected)})
records={}
for p in pages[128:]:
 chunks=re.split(r'\bTEST\s+(\d+)\b',p['text'])
 for i in range(1,len(chunks),2):
  n=int(chunks[i]);rows=[]
  for line in chunks[i+1].splitlines():
   line=line.strip()
   if not line or line.startswith('Proper English') or re.fullmatch(r'\d{3}',line):continue
   if rows and rows[-1]['lines'][-1].rstrip().endswith('/'):
    rows[-1]['lines'].append(line);continue
   m=re.match(r'^(\d{1,2})(?:\s*[-–&/]\s*(\d{1,2}))?\s+(.+)$',line)
   if m and 1<=int(m[1])<=40:
    rows.append({'questions':list(range(int(m[1]),int(m[2] or m[1])+1)),'lines':[m[3]]})
   elif rows:rows[-1]['lines'].append(line)
  records[str(n)]=rows
records['67'][7]['questions']=[38] # Key page prints 39 twice; the worksheet labels this blank 38.
for paper in papers:
 paper['keyRecords']=records[str(paper['number'])]
 actual=[n for r in paper['keyRecords'] for n in r['questions']];expected=list(range((paper['sectionNumber']-1)*10+1,paper['sectionNumber']*10+1))
 if actual!=expected:print('REVIEW NUMBERS',paper['number'],actual,expected)
 for r in paper['keyRecords']:
  if len(r['questions'])>1 or any('ORDER' in s or 'REQUIRED' in s for s in r['lines']):print('GROUP',paper['number'],r)
Path('.cache/80-book-structured.json').write_text(json.dumps(papers,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('papers',len(papers),'question slots',sum(len(r['questions']) for p in papers for r in p['keyRecords']))
