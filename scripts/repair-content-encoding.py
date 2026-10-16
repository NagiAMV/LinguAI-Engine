"""Repair reversible UTF-8 text decoded as Windows-1252; leave other text untouched."""
from pathlib import Path
import json

def byte(c):
 try:return c.encode('cp1252')[0]
 except UnicodeEncodeError:
  return ord(c) if 128<=ord(c)<=159 else None

def repair(value):
 for _ in range(6):
  out=[];i=0
  while i<len(value):
   lead=byte(value[i]);size=2 if lead and 194<=lead<=223 else 3 if lead and 224<=lead<=239 else 4 if lead and 240<=lead<=244 else 0
   if size and i+size<=len(value):
    bs=[byte(c) for c in value[i:i+size]]
    if all(b is not None for b in bs) and all(128<=b<=191 for b in bs[1:]):
     try:
      decoded=bytes(bs).decode('utf8');out.append(decoded);i+=size;continue
     except UnicodeDecodeError:pass
   out.append(value[i]);i+=1
  changed=''.join(out)
  if changed==value:break
  value=changed
 return value

def nested(v):
 if isinstance(v,str):return repair(v)
 if isinstance(v,list):return [nested(x) for x in v]
 if isinstance(v,dict):return {k:nested(x) for k,x in v.items()}
 return v
if __name__=='__main__':
 changed=[]
 for p in [*Path('src/data').glob('*.json'),*Path('public/practice').glob('*.json')]:
  original=json.loads(p.read_text(encoding='utf8'));fixed=nested(original)
  if fixed!=original:
   p.write_text(json.dumps(fixed,ensure_ascii=False,indent=2)+'\n',encoding='utf8');changed.append(str(p))
 Path('.cache/encoding-repair-report.json').write_text(json.dumps(changed,indent=2),encoding='utf8')
 print('Repaired',len(changed),'JSON files');print('\n'.join(changed))
