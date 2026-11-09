import fs from 'node:fs';
import {citationOffsets} from '../src/components/content/review-evidence.mjs';

// Check against the current catalog, not a cached export of its transcripts.
function prose(html) {
 const entities={amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' ',rsquo:'’',lsquo:'‘',ldquo:'“',rdquo:'”',ndash:'–',mdash:'—',hellip:'…',pound:'£',euro:'€'};
 return html.replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi,' ').replace(/<[^>]+>/g,' ')
  .replace(/&(#x[\da-f]+|#\d+|\w+);/gi,(all,key)=>key[0]==='#'?String.fromCodePoint(parseInt(key.slice(key[1]==='x'?2:1),key[1]==='x'?16:10)):entities[key]??all);
}
let failed=0;
for(const file of ['practice-reading-explanations','single-passage-reading-explanations','listening-explanations']) {
 const explanations=JSON.parse(fs.readFileSync(new URL('../src/data/'+file+'.json',import.meta.url)));
 let checked=0;
 for(const [id,rows] of Object.entries(explanations)) {
  const test=JSON.parse(fs.readFileSync(new URL('../public/practice/'+id+'.json',import.meta.url)));
  for(const [number,e] of Object.entries(rows)) {
   const quotes=e.quotes?.length?e.quotes:e.quote?[e.quote]:[];
   if(!quotes.length)continue;
   checked++;
   const part=test.parts.find(p=>p.id===e.part),text=prose(part?.passage||'');
   if(!quotes.some(quote=>citationOffsets(text,quote))){failed++;console.error(`${id} question ${number}: citation not found`);}
  }
 }
 console.log(`${file}: ${checked} explanations checked`);
}
if(failed){console.error(`${failed} explanations have no matching citation`);process.exitCode=1;}
else console.log('All quoted explanations have evidence in the current catalog.');
