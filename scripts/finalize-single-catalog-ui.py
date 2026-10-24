import json,re
from pathlib import Path
p=Path('src/components/content/PracticeLibrary.jsx');s=p.read_text(encoding='utf8');s=s.replace('  <section aria-label=', '''  <nav className="single-practice-filters" aria-label="Practice format"><Link href={`/?view=${resource}`} aria-current="page">Full tests</Link><Link href={`/?view=${resource}&format=single`}>Single {resource==='reading'?'passages':'sections'}</Link></nav>
  <section aria-label=''');p.write_text(s,encoding='utf8')
p=Path('src/components/content/ExamPlayer.jsx');s=p.read_text(encoding='utf8').replace("test.audioScope === 'test' ? 'imported-listening' : ''","test.resource === 'listening' ? 'imported-listening' : ''");s=s.replace('className={`practice-exam ', 'className={`practice-exam ${test.id.startsWith("single-listening-") ? "single-listening-exam" : ""} ');p.write_text(s,encoding='utf8')
p=Path('src/data/single-passage-reading-catalog.json');c=json.loads(p.read_text(encoding='utf8'))
for x in c:
 ns=x.get('originalQuestionNumbers',[])
 if not ns:continue
 paper=json.loads(Path('public/practice/'+x['id']+'.json').read_text(encoding='utf8'));m=re.search(r'(?:passage[ _-]*|reading[ _-]*p)([123])',paper.get('provenance',{}).get('file',''),re.I)
 x['passageNumber']=int(m[1]) if m else 3 if min(ns)>=27 else 2 if min(ns)>=14 else 1
p.write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
