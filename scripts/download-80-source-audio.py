"""Download only the public source recordings matched to the supplied 80-section book."""
import concurrent.futures,urllib.request,time,json
from pathlib import Path
root=Path('.cache/80-audio-source');root.mkdir(exist_ok=True)
jobs=[(f'book-{book}-test-{test}.mp3',f'https://gitlab.com/ieltsportal/audio/-/raw/main/BOOK_{book}/Cambridge_IELTS_{book}_-_Listening_Test_{test}.mp3?inline=false') for book in [7,8,9] for test in range(1,5)]
def download(job):
 name,url=job;p=root/name
 if p.exists() and p.stat().st_size>1000000:return {'name':name,'url':url,'status':'cached'}
 for attempt in range(3):
  try:
   with urllib.request.urlopen(url,timeout=180) as response,p.with_suffix('.part').open('wb') as output:
    while chunk:=response.read(1024*256):output.write(chunk)
   if p.with_suffix('.part').stat().st_size<1000000:raise ValueError('Recording too small')
   p.with_suffix('.part').replace(p);return {'name':name,'url':url,'status':'downloaded'}
  except Exception as error:
   if attempt==2:return {'name':name,'url':url,'status':'failed','error':str(error)}
   time.sleep(2)
results=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for result in pool.map(download,jobs):results.append(result);print(result,flush=True);(root/'manifest.json').write_text(json.dumps(results,indent=2),encoding='utf8')
