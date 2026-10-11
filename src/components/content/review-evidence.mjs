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
