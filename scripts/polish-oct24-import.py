import json,re
from pathlib import Path
p=Path('public/practice/practice-listening-17.json');d=json.loads(p.read_text(encoding='utf8'))
for part in d['parts']:
 part['questions']=re.sub(r'<span class="q-pill">\d+</span>','',part['questions'].replace(' Move the correct letter into the gap.',''))
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
