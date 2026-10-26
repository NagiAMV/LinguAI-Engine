"""Rebuild worksheets as semantic HTML; retain only embedded maps/diagrams as images."""
import html,json,re
from pathlib import Path
import pdfplumber,pypdfium2
SOURCE='C:/Users/user/Downloads/Telegram Desktop/80 IELTS Listening Tests (2).pdf'
pdf=pdfplumber.open(SOURCE);raster=pypdfium2.PdfDocument(SOURCE)
sources=json.loads(Path('.cache/80-book-structured.json').read_text(encoding='utf8'));keys=json.loads(Path('src/data/single-section-listening-keys.json').read_text(encoding='utf8'))
E=lambda s:html.escape(str(s),quote=True)
def inside(x,y,b):return b[0]-1<=x<=b[2]+1 and b[1]-1<=y<=b[3]+1
def lines(words):
 out=[]
 for w in sorted(words,key=lambda w:(round(w['top']/3),w['x0'])):
  row=next((r for r in reversed(out[-3:]) if abs(r['y']-w['top'])<3.5),None)
  if row is None:row={'y':w['top'],'words':[]};out.append(row)
  row['words'].append(w)
 for row in out:row['words'].sort(key=lambda w:w['x0'])
 return sorted(out,key=lambda r:r['y'])

for source in sources:
 n=source['number'];path=Path(f'public/practice/single-listening-{n}.json');paper=json.loads(path.read_text(encoding='utf8'));part=paper['parts'][0];positions=paper['worksheetInputPositions'];groups=keys[paper['id']]['parts'][str(part['id'])]['groups'];emitted=set();fields={};migrations=[]
 matching_options={}
 headings=list(re.finditer(r'^Questions?\s+(\d+)(?:\s*(?:[-–]|and)\s*(\d+))?[^\n]*',source['text'],re.M|re.I))
 for index,heading in enumerate(headings):
  block=source['text'][heading.end():headings[index+1].start() if index+1<len(headings) else len(source['text'])]
  if re.search(r'correct letter|answers from (?:the )?(?:box|list)',block,re.I):
   letters=re.search(r'\bA\s*[-–]\s*([B-I])\b',block)
   if letters:
    for q in range(int(heading[1]),int(heading[2] or heading[1])+1):matching_options[q]=[chr(v) for v in range(65,ord(letters[1])+1)]
 def control(q,kind='text',options=None):
  if q in emitted:return ''
  emitted.add(q);name=f'single_listening_{n}_{q}';fields[name]=f'Question {q}'
  if options:
   return f'<fieldset class="native-question ielts-listening-question-item"><legend><strong class="ielts-listening-question-number">{q}</strong></legend>'+''.join(f'<label class="native-option"><input type="radio" name="{name}" value="{E(letter)}" aria-label="Question {q}: {E(letter)}"><b>{E(letter)}</b> {E(text)}</label>' for letter,text in options)+'</fieldset>'
  field=(f'<select name="{name}" aria-label="Question {q}"><option value="">Choose an answer</option>'+''.join(f'<option value="{letter}">{letter}</option>' for letter in matching_options[q])+'</select>') if q in matching_options else f'<input type="text" name="{name}" aria-label="Question {q}" autocomplete="off" placeholder="Answer">'
  return f'<span class="native-gap ielts-listening-question-item"><strong class="ielts-listening-question-number">{q}</strong>{field}</span>'
 def group_control(group,options):
  qs=group['questions'];first=qs[0];name=f'single_listening_{n}_{first}';fields[name]=f'Question {first}';emitted.update(qs)
  migrations.append({'target':name,'sources':[f'single_listening_{n}_{q}' for q in qs]})
  return '<fieldset class="native-question native-multiple ielts-listening-question-item"><legend>'+''.join(f'<strong class="ielts-listening-question-number">{q}</strong> ' for q in qs)+f' — Choose {len(qs)}</legend>'+''.join(f'<label class="native-option"><input type="checkbox" name="{name}" value="{E(letter)}" aria-label="Question {first}: {E(letter)}"><b>{E(letter)}</b> {E(text)}</label>' for letter,text in options)+'</fieldset>'
 def render_words(words,controls):
  if not words:return ''.join(control(p['question']) for p in controls)
  rows=lines(words)
  for p in controls:
   target=min(rows,key=lambda row:abs(row['y']-(p['y']+2)));target.setdefault('controls',[]).append(p)
  output=[];i=0
  while i<len(rows):
   row=rows[i];ws=row['words'];text=' '.join(w['text'] for w in ws);cs=row.get('controls',[])
   if n==43 and re.fullmatch(r'Questions 21[-–]22',text):text='Questions 21–25'
   # Choice option banks follow a heading or a question, never an answer key.
   if re.match(r'^Questions?\s+\d',text,re.I):
    group=next((g for g in groups if g['questions'][0] not in emitted and re.search(r'\b'+str(g['questions'][0])+r'\b',text) and re.search(r'\b'+str(g['questions'][-1])+r'\b',text)),None)
    if group:
     end=next((j for j in range(i+1,len(rows)) if re.match(r'^Questions?\s+\d',' '.join(w['text'] for w in rows[j]['words']),re.I)),len(rows));bank=[];intro=[]
     for r in rows[i+1:end]:
      s=' '.join(w['text'] for w in r['words']);m=re.match(r'^([A-I])\s+(.+)',s)
      if m:bank.append((m[1],m[2]))
      elif bank:bank[-1]=(bank[-1][0],bank[-1][1]+' '+s)
      else:intro.append(s)
     if len(bank)>=len(group['questions']):
      output.append('<h2>'+E(text)+'</h2>'+''.join('<p>'+E(s)+'</p>' for s in intro)+group_control(group,bank));i=end;continue
   # Individual multiple choice questions: keep prompt and clickable options together.
   if len(cs)==1 and cs[0]['mode']=='choice':
    q=cs[0]['question'];end=next((j for j in range(i+1,len(rows)) if rows[j].get('controls') or re.match(r'^Questions?\s+\d',' '.join(w['text'] for w in rows[j]['words']),re.I)),len(rows));bank=[];prompt=[re.sub(r'^\d+\s*','',text)]
    for r in rows[i+1:end]:
     s=' '.join(w['text'] for w in r['words']);m=re.match(r'^([A-I])\s+(.+)',s)
     if m:bank.append((m[1],m[2]))
     elif bank:bank[-1]=(bank[-1][0],bank[-1][1]+' '+s)
     else:prompt.append(s)
    if len(bank)>=2:
     output.append('<section class="native-mcq"><h3>'+E(' '.join(prompt))+'</h3>'+control(q,options=bank)+'</section>');i=end;continue
   if re.match(r'^Questions?\s+\d',text,re.I):output.append('<h2>'+E(text)+'</h2>');i+=1;continue
   if not cs:
    output.append('<p>'+E(text)+'</p>');i+=1;continue
   # Replace the printed dotted gap in its own sentence/table cell.
   pieces=[];used=set()
   for w in ws:
    p=next((p for p in cs if p['question'] not in used and (w['x1']>=p['x']-4 and w['x0']<=p['x']+p['width']+4) and re.search(r'[.\u2026\ufffd_]{2,}',w['text'])),None)
    if p:
     q=p['question'];used.add(q);m=re.search(r'[.\u2026\ufffd_]{2,}',w['text']);prefix=w['text'][:m.start()];suffix=w['text'][m.end():];prefix=re.sub(r'^'+str(q)+r'$','',prefix)
     if pieces and re.fullmatch(r'-?'+str(q),re.sub('<[^>]+>','',pieces[-1])):pieces.pop()
     elif len(pieces)>1 and pieces[-1] in ['£','$','€'] and pieces[-2]==str(q):pieces.pop(-2)
     pieces.append(E(prefix)+control(q)+E(suffix))
    else:pieces.append(E(w['text']))
   for p in cs:
    if p['question'] not in used:pieces.append(control(p['question']))
   output.append('<p class="native-text-row">'+' '.join(pieces)+'</p>');i+=1
  return ''.join(output)
 blocks=[]
 for page_number in source['pages']:
  page=pdf.pages[page_number-1];words=[w for w in page.extract_words(x_tolerance=2,y_tolerance=3) if 55<w['top']<795]
  # Remove paper-only exercise headings. All task wording remains.
  words=[w for row in lines(words) if not re.match(r'^(?:TEST|PART)\b',' '.join(v['text'] for v in row['words'])) for w in row['words']]
  pos=[p for p in positions if p['page']==page_number];regions=[]
  for image in page.images:
   b=(image['x0'],image['top'],image['x1'],image['bottom'])
   if image['width']<60 or image['height']<45:continue
   regions.append(('image',b,image))
  for table in page.find_tables():
   if any(inside((table.bbox[0]+table.bbox[2])/2,(table.bbox[1]+table.bbox[3])/2,b) for _,b,_ in regions):continue
   regions.append(('table',table.bbox,table))
  regions.sort(key=lambda r:r[1][1]);cursor=55
  for kind,b,region in regions:
   before=[w for w in words if cursor<=w['top']<b[1]-2];beforepos=[p for p in pos if p['question'] not in emitted and cursor<=p['y']<b[1]-2]
   blocks.append(render_words(before,beforepos))
   contained=[p for p in pos if inside(p['x'],p['y']+5,b) and p['question'] not in emitted]
   if kind=='image':
    asset=Path(f'public/practice/assets/single-listening-{n}-diagram-{page_number}-{len(blocks)}.webp');scale=1.7;img=raster[page_number-1].render(scale=scale).to_pil();img.crop(tuple(round(v*scale) for v in b)).save(asset,format='WEBP',quality=90)
    overlays=[]
    for p in contained:
     q=p['question'];fields[f'single_listening_{n}_{q}']=f'Question {q}';emitted.add(q)
     overlays.append(f'<span class="worksheet-input ielts-listening-question-item" style="left:{(p["x"]-b[0])/(b[2]-b[0])*100:.4f}%;top:{(p["y"]-b[1])/(b[3]-b[1])*100:.4f}%;width:{p["width"]/(b[2]-b[0])*100:.4f}%;height:{17/(b[3]-b[1])*100:.4f}%"><strong class="worksheet-number ielts-listening-question-number">{q}</strong><input name="single_listening_{n}_{q}" type="text" aria-label="Question {q}" placeholder="{q}" autocomplete="off"></span>')
    blocks.append('<div class="native-diagram-scroll"><div class="inline-worksheet-page native-diagram"><img src="/practice/assets/'+asset.name+'" alt="Map or diagram for this task">'+''.join(overlays)+'</div></div>')
   else:
    cells=[]
    for rowindex,row in enumerate(region.rows):
     rowcells=[]
     for cell in row.cells:
      if cell is None:rowcells.append('<td></td>');continue
      cw=[w for w in words if inside((w['x0']+w['x1'])/2,(w['top']+w['bottom'])/2,cell)];cp=[p for p in contained if p['question'] not in emitted and inside(p['x'],p['y']+5,cell)]
      cellhtml=render_words(cw,cp)
      if len(row.cells)>1:cellhtml=cellhtml.replace('</p><p>',' ')
      rowcells.append('<td>'+cellhtml+'</td>')
     if rowindex==0 and len(rowcells)>1 and sum(cell!='<td></td>' for cell in rowcells)==1:
      title=next(cell for cell in rowcells if cell!='<td></td>');rowcells=[title.replace('<td>',f'<td colspan="{len(rowcells)}" class="native-table-title">',1)]
     cells.append('<tr>'+''.join(rowcells)+'</tr>')
    notes=all(len(row.cells)==1 for row in region.rows)
    blocks.append('<div class="native-table-scroll"><table class="native-task-table'+(' native-notes' if notes else '')+'"><tbody>'+''.join(cells)+'</tbody></table></div>')
   cursor=b[3]-1
  blocks.append(render_words([w for w in words if w['top']>=cursor],[p for p in pos if p['question'] not in emitted and p['y']>=cursor-4]))
 missing=set(range((part['id']-1)*10+1,part['id']*10+1))-emitted
 if missing:raise ValueError(('Missing native controls',n,missing))
 part['questions']='<div class="native-section-tasks">'+''.join(blocks)+'</div>';part['fieldNames']=list(fields);part['fieldLabels']=fields;paper['nativeAnswerGroups']=migrations;paper['provenance']['questionPresentation']='native-html-tasks-with-diagrams'
 path.write_text(json.dumps(paper,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print('Native',n,'fields',len(fields),flush=True)
