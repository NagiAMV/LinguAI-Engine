import io,json,urllib.request,zipfile
from pathlib import Path
with urllib.request.urlopen('https://pypi.org/pypi/nvidia-cudnn-cu12/9.1.0.70/json',timeout=30) as r:d=json.load(r)
wheel=next(x for x in d['urls'] if x['filename'].endswith('win_amd64.whl'));size=wheel['size']
class Remote(io.RawIOBase):
 def __init__(self):self.position=0
 def seekable(self):return True
 def tell(self):return self.position
 def seek(self,o,w=0):self.position=o if w==0 else self.position+o if w==1 else size+o;return self.position
 def read(self,n=-1):
  n=size-self.position if n<0 else min(n,size-self.position)
  if not n:return b''
  req=urllib.request.Request(wheel['url'],headers={'Range':f'bytes={self.position}-{self.position+n-1}'})
  with urllib.request.urlopen(req,timeout=60) as r:assert r.status==206;data=r.read()
  self.position+=len(data);return data
with zipfile.ZipFile(Remote()) as z:
 for i in z.infolist():print(i.filename,i.file_size,i.compress_size,flush=True)
