// Runs in a browser DOM. Wrappers preserve every original character and inline element.
export function annotateSpeakers(html, audio, window, cachedWords = []) {
 const doc=new DOMParser().parseFromString(html,'text/html'),root=doc.body,before=root.textContent;
 if(root.querySelector('[data-speaker]'))return {html,status:'existing',speakers:[...new Set([...root.querySelectorAll('[data-speaker]')].map(n=>n.dataset.speaker))],unchanged:true};
 const excluded=n=>n.closest('.transcript-source-note,small,time,h1,h2,h3,h4');
 const plainLabel=text=>{
  const match=text.match(/^\s*([A-Za-z][A-Za-z .'-]{0,30}):\s/) || text.match(/^\s*(Jim|Dave|Tutor|Hillary)(?: {3,}|\n)/);
  return match&&!/^(section|part|lesson|example|answer|questions|note|stage)/i.test(match[1])?match[1].trim():null;
 };
 // Some imported scripts use BR separators rather than paragraphs.
 if(!root.querySelector('p')){
  let group=[];
  const flush=()=>{if(!group.length)return;const text=group.map(n=>n.textContent).join('');if(text.trim()){const p=doc.createElement('span');p.className='transcript-line';group[0].before(p);group.forEach(n=>p.append(n));}group=[];};
  [...root.childNodes].forEach(node=>{if(node.nodeName==='BR')flush();else group.push(node);});flush();
 }
 const blocks=[...root.querySelectorAll('p,.transcript-line')].filter(n=>!excluded(n));
 let named=0;
 blocks.forEach(n=>{const speaker=plainLabel(n.textContent);if(speaker){n.dataset.speaker=speaker;named++;}});
 // Explicitly named scripts are authoritative; do not infer identities for unlabeled lines.
 if(named){return {html:root.innerHTML,status:'source-labelled',speakers:[...new Set(blocks.map(n=>n.dataset.speaker).filter(Boolean))],unchanged:before===root.textContent};}
 const turns=(audio?.segments||[]).filter(t=>t.end>window.start&&t.start<window.end);
 if(!turns.length)throw Error('No audio speaker segments in transcript window');
 const speakerIds=[];
 const name=id=>{if(!speakerIds.includes(id))speakerIds.push(id);return 'Speaker '+(speakerIds.indexOf(id)+1);};
 const tokensFor=node=>{
  const walker=doc.createTreeWalker(node,NodeFilter.SHOW_TEXT),result=[];let t;
  while(t=walker.nextNode()){if(excluded(t.parentElement))continue;for(const m of t.textContent.matchAll(/\S+\s*/g))result.push({node:t,start:m.index,end:m.index+m[0].length,text:m[0]});}
  return result;
 };
 const items=blocks.map(node=>({node,tokens:tokensFor(node),start:(()=>{const m=node.querySelector('small,time')?.textContent.match(/\[?(\d+):(\d{2})\]?/);return m?Number(m[1])*60+Number(m[2]):null;})()})).filter(x=>x.tokens.length);
 const total=items.reduce((s,x)=>s+x.tokens.length,0);let offset=0,exact=0,approximate=0;
 const normal=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
 items.forEach((item,index)=>{
  const start=item.start??window.start+(window.end-window.start)*offset/total;
  offset+=item.tokens.length;
  const next=items[index+1]?.start;
  const end=next??(item.start!==null?window.end:window.start+(window.end-window.start)*offset/total);
  const spoken=turns.filter(t=>t.end>start&&t.start<end).map(t=>({...t,start:Math.max(start,t.start),end:Math.min(end,t.end)}));
  if(!spoken.length){const nearest=turns.reduce((a,b)=>Math.abs(b.start-start)<Math.abs(a.start-start)?b:a);spoken.push({...nearest,start,end});}
  const duration=spoken.reduce((s,t)=>s+t.end-t.start,0);
  const words=cachedWords.find(s=>Math.abs(s.start-start)<1.6)?.words;
  const exactWords=words?.length===item.tokens.length&&words.every((w,i)=>normal(w.word)===normal(item.tokens[i].text));
  const labelled=item.tokens.map((token,i)=>{
   let segment;
   if(exactWords){const time=(words[i].start+words[i].end)/2;segment=spoken.find(t=>t.start<=time&&t.end>=time)||spoken.reduce((a,b)=>Math.abs((b.start+b.end)/2-time)<Math.abs((a.start+a.end)/2-time)?b:a);exact++;}
   else{let point=duration*(i+0.5)/item.tokens.length;segment=spoken.at(-1);for(const t of spoken){point-=t.end-t.start;if(point<=0){segment=t;break;}}approximate++;}
   return {...token,speaker:name(segment.speaker)};
  });
  const byNode=new Map();labelled.forEach(t=>{if(!byNode.has(t.node))byNode.set(t.node,[]);byNode.get(t.node).push(t);});
  for(const [node,tokens] of byNode){const fragment=doc.createDocumentFragment();let cursor=0,last;
   for(const token of tokens){if(token.start>cursor)fragment.append(doc.createTextNode(node.textContent.slice(cursor,token.start)));
    if(last?.dataset.speaker!==token.speaker){last=doc.createElement('span');last.dataset.speaker=token.speaker;fragment.append(last);}
    last.append(doc.createTextNode(node.textContent.slice(token.start,token.end)));cursor=token.end;
   }
   if(cursor<node.textContent.length)fragment.append(doc.createTextNode(node.textContent.slice(cursor)));node.replaceWith(fragment);
  }
 });
 if(before!==root.textContent)throw Error('Transcript text changed during speaker annotation');
 return {html:root.innerHTML,status:'audio-automatic',speakers:speakerIds.map((_,i)=>'Speaker '+(i+1)),unchanged:true,exactWordCount:exact,approximateWordCount:approximate};
}
