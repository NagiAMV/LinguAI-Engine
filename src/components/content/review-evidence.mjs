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
export function evidenceRange(root, quote) {
 const nodes=textNodes(root), text=nodes.map(node=>node.textContent).join('');
 const start=text.indexOf(quote);
 if(!quote||start<0||text.indexOf(quote,start+1)>=0)return null;
 const exact=highlightRange(root,{start,end:start+quote.length,text:quote});
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
