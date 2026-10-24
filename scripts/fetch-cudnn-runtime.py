"""Fetch the official PyPI wheel in bounded ranges and verify the release hash."""
import concurrent.futures,hashlib,json,time,urllib.request
from pathlib import Path
with urllib.request.urlopen('https://pypi.org/pypi/nvidia-cudnn-cu12/9.1.0.70/json',timeout=30) as r:d=json.load(r)
wheel=next(x for x in d['urls'] if x['filename'].endswith('win_amd64.whl'));folder=Path('.cache/cuda-wheels');folder.mkdir(exist_ok=True);target=folder/wheel['filename'];size=wheel['size'];chunk=4*1024*1024
def fetch(i):
 p=folder/f'chunk-{i}';start=i*chunk;end=min(size,start+chunk)-1
 if p.exists() and p.stat().st_size==end-start+1:return p
 for attempt in range(4):
  try:
   req=urllib.request.Request(wheel['url'],headers={'Range':f'bytes={start}-{end}'})
   with urllib.request.urlopen(req,timeout=45) as r:
    assert r.status==206;data=r.read();assert len(data)==end-start+1
   p.write_bytes(data);return p
  except Exception:
   if attempt==3:raise
   time.sleep(1+attempt)
count=(size+chunk-1)//chunk
print('cuDNN official wheel:',round(size/1048576),'MB;',count,'chunks',flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=32) as pool:
 for n,_ in enumerate(pool.map(fetch,range(count)),1):
  if n%10==0:print('Downloaded',n,'/',count,flush=True)
with target.open('wb') as out:
 for i in range(count):out.write((folder/f'chunk-{i}').read_bytes())
assert hashlib.sha256(target.read_bytes()).hexdigest()==wheel['digests']['sha256']
print('Verified:',target,flush=True)
