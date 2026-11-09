import {textNodes, highlightRange} from './exam-annotations.mjs';

// Expand a verified quote to its containing sentence(s), never search by answer words.
export function evidenceExcerpt(text, quote) {
 const start=text.indexOf(quote);
 if(!quote || start<0 || text.indexOf(quote,start+1)>=0)return null;
 const end=start+quote.length;
 const sentences=[...new Intl.Segmenter('en',{granularity:'sentence'}).segment(text)];
 const first=sentences.find(s=>s.index<=start&&s.index+s.segment.length>start);
 const last=sentences.find(s=>s.index<end&&s.index+s.segment.length>=end);
 const from=first?.index??start, to=last?last.index+last.segment.trimEnd().length:end;
 return {start:from,end:to,text:text.slice(from,to)};
}


// Keep a citation inside its prose block: a DOM Range must not span an
// inserted heading selector or feedback card between passage paragraphs.
export function citationOffsets(text, quote) {
 if (!quote?.trim()) return null;
 // Match source words, tolerating typography and explicitly omitted phrases.
 const positions=[]; let normalized='';
 for(let i=0;i<text.length;i++) {
  const marker=text.slice(i).match(/^(?:\[\d{1,2}:\d{2}(?::\d{2})?\]|\(Q\d+\))/i);
  if(marker){if(normalized&&!normalized.endsWith(' ')){normalized+=' ';positions.push(i);}i+=marker[0].length-1;continue;}
  const c=text[i].toLowerCase();
  if(/[\p{L}\p{N}]/u.test(c)){normalized+=c;positions.push(i);}
  else if(normalized&&!normalized.endsWith(' ')){normalized+=' ';positions.push(i);}
 }
 const chunks=quote.split(/\.{3}|…|\s+[—–]\s+/).map(s=>s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()).filter(Boolean);
 if(!chunks.length)return null;
 let from=0, first=-1, last=-1;
 for(const chunk of chunks){
  let start=normalized.indexOf(chunk,from);
  while(start>=0&&((start>0&&normalized[start-1]!==' ')||(start+chunk.length<normalized.length&&normalized[start+chunk.length]!==' ')))start=normalized.indexOf(chunk,start+1);
  if(start<0||(last>=0&&start-last>1500))return null;
  if(first<0)first=start;last=start+chunk.length;from=last;
 }
 return {start:positions[first],end:positions[last-1]+1};
}
export function evidenceRange(root, quote) {
 const nodes=textNodes(root), text=nodes.map(node=>node.textContent).join('');
 let searchable='',offset=0;const mapping=[];
 for(const node of nodes){
  if(!node.parentElement?.closest('sup')){
   if(searchable){searchable+=' ';mapping.push(offset);}
   for(let i=0;i<node.textContent.length;i++){searchable+=node.textContent[i];mapping.push(offset+i);}
  }
  offset+=node.textContent.length;
 }
 const projected=citationOffsets(searchable,quote);
 const match=projected?{start:mapping[projected.start],end:mapping[projected.end-1]+1}:citationOffsets(text,quote);
 if(!match)return null;
 const {start,end}=match;
 const exact=highlightRange(root,{start,end,text:text.slice(start,end)});
 if(!exact)return null;
 const block=exact.startContainer.parentElement?.closest('p,li,td,th,blockquote,h1,h2,h3,h4,h5,h6');
 if(block&&root.contains(block)&&block.contains(exact.endContainer)){
  const prose=textNodes(block).map(node=>node.textContent).join('');
  const excerpt=evidenceExcerpt(prose,quote);
  const expanded=excerpt&&highlightRange(block,excerpt);
  if(expanded&&!Array.from(block.querySelectorAll('[data-review-feedback],input,select,textarea,button')).some(node=>expanded.intersectsNode(node)))return expanded;
 }
 return exact;
}
