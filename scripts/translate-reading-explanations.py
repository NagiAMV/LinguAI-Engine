"""Cache translations of supplied explanations; preserve English, quotes and keys."""
import concurrent.futures,hashlib,json,re,time,urllib.parse,urllib.request
from pathlib import Path

files=[Path('src/data/'+name+'.json') for name in ['practice-reading-explanations','single-passage-reading-explanations']]
cache_path=Path('.cache/reading-explanation-translations.json')
cache=json.loads(cache_path.read_text(encoding='utf8')) if cache_path.exists() else {}
datasets={p:json.loads(p.read_text(encoding='utf8')) for p in files}
jobs={}
for data in datasets.values():
 for entries in data.values():
  for entry in entries.values():
   for language in ['ru','uz']:
    if not entry.get(language):
     key=language+':'+hashlib.sha256(entry['en'].encode()).hexdigest()
     if key not in cache:jobs[key]=(language,entry['en'])

def translate(job):
 key,(language,source)=job
 query=urllib.parse.urlencode({'client':'gtx','sl':'en','tl':language,'dt':'t','q':source})
 request=urllib.request.Request('https://translate.googleapis.com/translate_a/single?'+query,headers={'User-Agent':'LinguAI-translation-import/1.0'})
 for attempt in range(4):
  try:
   with urllib.request.urlopen(request,timeout=30) as response:data=json.load(response)
   result=''.join(piece[0] for piece in data[0] if piece[0])
   if not result.strip() or result==source:raise ValueError('Empty or unchanged translation')
   return key,result
  except Exception:
   if attempt==3:raise
   time.sleep(2*(attempt+1))

print(f'{len(jobs)} uncached translations; {len(cache)} cached.',flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for count,future in enumerate(concurrent.futures.as_completed([pool.submit(translate,j) for j in jobs.items()]),1):
  key,value=future.result();cache[key]=value
  cache_path.write_text(json.dumps(cache,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
  if count%25==0:print(f'Translated {count}/{len(jobs)}',flush=True)

def preserve_answer_label(source,translated):
 # Translators may turn option D into Cyrillic Г or translate TRUE into an adjective.
 # Keep the answer notation identical to the source; translate only its explanation.
 label=re.match(r'^(TRUE|FALSE|NOT GIVEN|YES|NO)\s*([.:—–-])\s*',source)
 if label:
  return re.sub(r'^.*?[.:—–-]\s*',lambda _:label.group(0),translated,count=1)
 label=re.match(r'^([A-J])(?=[\s.:—–-])',source)
 if label:
  result=re.sub(r'^[А-ЯA-Z](?=[\s.:—–-])',label.group(1),translated,count=1)
  return result if result.startswith(label.group(1)) else label.group(1)+'. '+result
 return translated

for path,data in datasets.items():
 for entries in data.values():
  for entry in entries.values():
   for language in ['ru','uz']:
    if not entry.get(language):
     entry[language]=preserve_answer_label(entry['en'],cache[language+':'+hashlib.sha256(entry['en'].encode()).hexdigest()])
     entry.setdefault('translationProvenance',{})[language]={'type':'machine-translation','sourceLanguage':'en','provider':'Google Translate','sourceSha256':hashlib.sha256(entry['en'].encode()).hexdigest()}
    if entry.get('translationProvenance',{}).get(language):entry[language]=preserve_answer_label(entry['en'],entry[language])
 path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 for paper_id in data:
  paper_path=Path('public/practice/'+paper_id+'.json')
  paper=json.loads(paper_path.read_text(encoding='utf8'));paper['reviewLanguages']=['ru','en','uz']
  paper_path.write_text(json.dumps(paper,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('All Reading explanations have Russian, English and Uzbek.',flush=True)
