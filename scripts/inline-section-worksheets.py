"""Place native saved inputs over the source worksheet gaps, preserving the printed page."""
import html,json,re
from pathlib import Path
import pdfplumber,pypdfium2
source='C:/Users/user/Downloads/Telegram Desktop/80 IELTS Listening Tests (2).pdf'
pdf=pdfplumber.open(source);render=pypdfium2.PdfDocument(source)
papers=json.loads(Path('.cache/80-book-structured.json').read_text(encoding='utf8'));candidates=json.loads(Path('.cache/section-input-candidates.json').read_text(encoding='utf8'))
keys=json.loads(Path('src/data/single-section-listening-keys.json').read_text(encoding='utf8'))
# Coordinates checked against the diagrams; values are PDF points, not answer content.
manual={30:{11:(45,207,435,110),12:(45,415,307,110)},32:{15:(50,391,483,93),16:(50,83,430,94),17:(50,298,272,91)},34:{12:(52,341,407,76),13:(52,204,618,77),14:(52,330,666,77)},40:{11:(63,92,573,46),12:(63,104,697,47),13:(63,472,682,47)},43:{21:(69,149,256,69),22:(69,203,438,35),23:(69,310,244,36),24:(69,459,324,37),25:(69,397,416,69)},51:{23:(84,111,671,70),24:(84,257,734,67),25:(84,406,660,84)}}
audit={}
for paper in papers:
 n=paper['number'];path=Path(f'public/practice/single-listening-{n}.json');data=json.loads(path.read_text(encoding='utf8'));part=data['parts'][0];positions=[]
 pagewords={p:pdf.pages[p-1].extract_words(x_tolerance=2,y_tolerance=3) for p in paper['pages']}
 for q in range((paper['sectionNumber']-1)*10+1,paper['sectionNumber']*10+1):
  mode='gap';r=None
  if q in manual.get(n,{}):page,x,y,width=manual[n][q];mode='diagram'
  else:
   options=[r for r in candidates[str(n)] if r['q']==q]
   group=next((g for g in keys[data['id']]['parts'][str(part['id'])]['groups'] if q in g['questions']),None)
   if group and (n in [20,37] or not any(r['gap'] for r in options)):options=[]
   if n==71 and q==31:options=[r for r in candidates[str(n)] if r['q']==32]
   if n==71 and q in [32,33,34]:options=[r for r in candidates[str(n)] if r['q']==q+1 and not r['gap']]
   if options:
    # A printed gap wins over incidental numbers such as times or prices.
    r=sorted(options,key=lambda r:(bool(r['gap']),-r['anchor']['x0']),reverse=True)[0];page=r['page'];w=r['anchor'];line=[v for v in pagewords[page] if abs(v['top']-w['top'])<4]
    def dotted(v):
     m=re.search(r'[.\u2026_\ufffd]{2,}',v['text'])
     if not m:return None
     width=(v['x1']-v['x0'])/len(v['text']);return {**v,'x0':v['x0']+m.start()*width,'x1':v['x0']+m.end()*width}
    dots=[d for v in line if v['x0']>=w['x1']-2 and (d:=dotted(v))]
    gap=r['gap'] or (min(dots,key=lambda v:v['x0']) if dots else None)
    if gap:
     x=gap['x0'];y=gap['top']-2;width=min(180,max(35,gap['x1']-x));mode='gap'
     if '\ufffd' in w['text'] or '\u2026' in w['text']:
      embedded=dotted(w)
      if embedded:x=embedded['x0'];width=min(140,max(35,embedded['x1']-x))
    else:
     following=[d for v in pagewords[page] if 10<v['top']-w['top']<40 and (d:=dotted(v))]
     if following:
      gap=min(following,key=lambda v:(v['top'],v['x0']));x=gap['x0'];y=gap['top']-2;width=min(180,max(35,gap['x1']-x));mode='gap'
     else:x=548;y=w['top']-3;width=40;mode='choice'
   else:
    group=next((g for g in keys[data['id']]['parts'][str(part['id'])]['groups'] if q in g['questions']),None)
    assert group,(n,q,'No source anchor')
    first,last=group['questions'][0],group['questions'][-1];found=[]
    for p,words in pagewords.items():
     for w in words:
      if re.fullmatch(str(first)+r'[-–]'+str(last),w['text']) or w['text']==str(first):
       near=' '.join(v['text'] for v in words if abs(v['top']-w['top'])<4)
       if 'Question' in near:found.append((p,w))
    assert found,(n,q,'No group heading')
    page,w=found[0];x=430+(q-first)*48;y=w['top']-2;width=43;mode='group-choice'
  assert 0<=x<595 and 0<=y<800,(n,q,x,y)
  positions.append({'question':q,'page':page,'x':round(x,2),'y':round(y,2),'width':round(width,2),'height':17,'mode':mode})
 blocks=[]
 for p in paper['pages']:
  asset=Path(f'public/practice/assets/single-listening-{n}-page-{p}.webp')
  if not asset.exists():render[p-1].render(scale=1.6).to_pil().save(asset,format='WEBP',quality=88)
  controls=[]
  for pos in [v for v in positions if v['page']==p]:
   q=pos['question'];field=f'single_listening_{n}_{q}';style=f'left:{pos["x"]/pdf.pages[p-1].width*100:.4f}%;top:{pos["y"]/pdf.pages[p-1].height*100:.4f}%;width:{pos["width"]/pdf.pages[p-1].width*100:.4f}%;height:{17/pdf.pages[p-1].height*100:.4f}%'
   controls.append(f'<span class="worksheet-input ielts-listening-question-item" style="{style}" data-worksheet-question="{q}"><strong class="worksheet-number ielts-listening-question-number">{q}</strong><input type="text" name="{field}" aria-label="Question {q}" autocomplete="off" placeholder="{q}"></span>')
  blocks.append(f'<div class="inline-worksheet-page" data-source-page="{p}"><img src="/practice/assets/{asset.name}" alt="Section {part["id"]} worksheet, page {p}" loading="lazy">'+''.join(controls)+'</div>')
 part['questions']='<div class="inline-worksheet-scroll"><div class="inline-worksheets">'+''.join(blocks)+'</div></div>';data['worksheetInputPositions']=positions;data['provenance']['pages']=paper['pages'];data['provenance']['questionPresentation']='native-inputs-on-original-worksheet'
 path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8');audit[str(n)]=positions
Path('src/data/single-listening-input-positions.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Updated',len(audit),'worksheets;',sum(map(len,audit.values())),'inline inputs')
