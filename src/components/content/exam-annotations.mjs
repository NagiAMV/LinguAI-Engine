// Annotation IDs must also work on local-network HTTP exam URLs.
export function annotationId() {
 if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
 const bytes = new Uint8Array(16);
 globalThis.crypto.getRandomValues(bytes);
 return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
export const HIGHLIGHT_COLORS = ['yellow', 'green', 'blue', 'pink'];
export function validHighlight(item) {
 return item && typeof item.id === 'string' && Number.isInteger(item.part) && ['passage','questions'].includes(item.area) && Number.isInteger(item.start) && Number.isInteger(item.end) && item.start >= 0 && item.end > item.start && typeof item.text === 'string' && HIGHLIGHT_COLORS.includes(item.color);
}
// Ignore form options and review feedback so offsets remain stable in the read-only review.
export function textNodes(root) {
 const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: node => node.parentElement?.closest('select,input,textarea,button,[data-review-feedback]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
 const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode); return nodes;
}
export function selectionSnapshot(root, range, part, area) {
 if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
 const nodes = textNodes(root);
 function offset(container, point) {
  const prefix = document.createRange(); prefix.setStart(root,0); prefix.setEnd(container,point);
  return nodes.reduce((sum,node) => sum + (prefix.intersectsNode(node) ? (node === container ? point : node.textContent.length) : 0),0);
 }
 const start = offset(range.startContainer,range.startOffset), end = offset(range.endContainer,range.endOffset);
 const text = nodes.map(n=>n.textContent).join('').slice(start,end);
 return text.trim() && end > start ? {part,area,start,end,text} : null;
}
export function highlightRange(root, item) {
 const nodes = textNodes(root); const text = nodes.map(n=>n.textContent).join('');
 if (text.slice(item.start,item.end) !== item.text) return null;
 let offset = 0, start, end;
 for (const node of nodes) { const next = offset + node.textContent.length;
  if (!start && item.start >= offset && item.start < next) start = [node,item.start-offset];
  if (item.end > offset && item.end <= next) { end = [node,item.end-offset]; break; } offset = next;
 }
 if (!start || !end) return null;
 const range = document.createRange(); range.setStart(...start); range.setEnd(...end); return range;
}
