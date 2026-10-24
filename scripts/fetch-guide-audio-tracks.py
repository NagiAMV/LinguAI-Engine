"""Read a public ZIP with HTTP ranges; download only reviewed test tracks."""
import io,json,urllib.request,zipfile,argparse,concurrent.futures
from pathlib import Path
URL='https://gitlab.com/ieltsportal/misc-files/-/raw/main/The_Official_Cambridge_Guide_To_IELTS_Audio.zip?inline=false'
SIZE=307094984
class Remote(io.RawIOBase):
 def __init__(self):self.position=0
 def readable(self):return True
 def seekable(self):return True
 def tell(self):return self.position
 def seek(self,offset,whence=0):
  self.position=offset if whence==0 else self.position+offset if whence==1 else SIZE+offset
  return self.position
 def read(self,n=-1):
  n=SIZE-self.position if n<0 else min(n,SIZE-self.position)
  if not n:return b''
  req=urllib.request.Request(URL,headers={'Range':f'bytes={self.position}-{self.position+n-1}'})
  with urllib.request.urlopen(req,timeout=90) as r:
   if r.status!=206:raise ValueError('Server did not honour requested range')
   data=r.read()
  if len(data)!=n:raise ValueError('Incomplete range')
  self.position+=n;return data
parser=argparse.ArgumentParser();parser.add_argument('--extract',action='store_true');args=parser.parse_args()
with zipfile.ZipFile(Remote()) as z:
 entries=[{'name':i.filename,'size':i.file_size} for i in z.infolist() if not i.is_dir()]
Path('.cache/guide-zip-index.json').write_text(json.dumps(entries,indent=2),encoding='utf8')
if not args.extract:
 for e in entries:print(e)
else:
 selected=json.loads(Path('.cache/guide-track-selection.json').read_text(encoding='utf8'))
 root=Path('.cache/80-audio-source');root.mkdir(exist_ok=True)
 def fetch(entry):
  p=root/entry['output']
  if not p.exists():
   with zipfile.ZipFile(Remote()) as z:p.write_bytes(z.read(entry['name']))
  print(entry['output'],p.stat().st_size,flush=True)
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(fetch,selected))
