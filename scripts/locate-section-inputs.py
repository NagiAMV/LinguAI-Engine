"""Locate worksheet gaps using PDF text geometry; uncertain matches require review."""
import json,re
from pathlib import Path
import pdfplumber
pdf=pdfplumber.open('C:/Users/user/Downloads/Telegram Desktop/80 IELTS Listening Tests (2).pdf')
papers=json.loads(Path('.cache/80-book-structured.json').read_text(encoding='utf8'));result={}
for paper in papers:
 rows=[]
 for page_number in paper['pages']:
  page=pdf.pages[page_number-1];words=page.extract_words(x_tolerance=2,y_tolerance=3)
  for q in range((paper['sectionNumber']-1)*10+1,paper['sectionNumber']*10+1):
   candidates=[]
   for w in words:
    if not (re.fullmatch(r'-?'+str(q)+r'[.\u2026_\ufffd:)]*',w['text']) or re.match('^'+str(q)+r'[.\u2026_\ufffd]{2,}',w['text'])) or w['top']<55 or w['bottom']>790:continue
    line=[v for v in words if abs(v['top']-w['top'])<4]
    context=' '.join(v['text'] for v in line)
    if re.match(r'\s*(?:Questions?|TEST|PART)\b',context,re.I):continue
    dots=[v for v in line if v['x0']>=w['x1']-2 and re.fullmatch(r'[.\u2026_\ufffd]{2,}',v['text'])]
    dot=min(dots,key=lambda v:v['x0']) if dots and min(v['x0'] for v in dots)-w['x1']<50 else None
    if re.search(r'[.\u2026_\ufffd]{2}',w['text']):dot={'x0':w['x0']+len(str(q))*7,'x1':w['x1'],'top':w['top'],'bottom':w['bottom']}
    candidates.append({'q':q,'page':page_number,'anchor':w,'gap':dot,'line':context,'pageWidth':page.width,'pageHeight':page.height})
   rows.extend(candidates)
 result[str(paper['number'])]=rows
Path('.cache/section-input-candidates.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
for paper in papers:
 rows=result[str(paper['number'])];qs=list(range((paper['sectionNumber']-1)*10+1,paper['sectionNumber']*10+1));bad=[q for q in qs if len([r for r in rows if r['q']==q])!=1]
 print(paper['number'],'gaps',sum(bool(r['gap']) for r in rows),'ambiguous',bad,flush=True)
