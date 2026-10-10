"use client";
import { useEffect } from 'react';
import { HIGHLIGHT_COLORS, highlightRange } from './exam-annotations.mjs';
export default function TextHighlights({ root, highlights = [], part, area, revision }) {
 useEffect(() => {
  if (!CSS.highlights || !globalThis.Highlight || !root.current) return;
  for (const color of HIGHLIGHT_COLORS) {
   const ranges = highlights.filter(h=>h.part===part&&h.area===area&&h.color===color).map(h=>highlightRange(root.current,h)).filter(Boolean);
   CSS.highlights.set('exam-'+area+'-'+color,new Highlight(...ranges));
  }
  return () => { for(const color of HIGHLIGHT_COLORS) CSS.highlights.delete('exam-'+area+'-'+color); };
 }, [root,highlights,part,area,revision]);
 return null;
}
