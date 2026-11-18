// Styling wrappers preserve every text character and saved highlight offsets.
export function emphasizeOptionLetters(root){
 if(!root)return;
 for(const letter of root.querySelectorAll('[class$="option-letter"],.opt-letter,.eh-letter,label > b,label > strong'))if(/^[A-Z]$/.test(letter.textContent.trim()))letter.classList.add('exam-option-letter');
 const rows=[...root.querySelectorAll('p,li,.mb-row,.opt-row,.eh-opt')].filter(row=>!row.closest('[data-review-feedback]')&&!row.querySelector('input,select'));
 const candidate=row=>{if(!row)return null;const walker=document.createTreeWalker(row,NodeFilter.SHOW_TEXT);while(walker.nextNode()){const node=walker.currentNode;if(!node.textContent.trim())continue;const match=node.textContent.match(/^(\s*)([A-Z])(?:[.)]?\s+|[.)]$|$)/);if(!match)return null;return {node,match,code:match[2].charCodeAt(0)};}return null;};
 const candidates=new Map(rows.map(row=>[row,candidate(row)]));
 for(const row of rows){const item=candidates.get(row);if(!item||item.node.parentElement.closest('.exam-option-letter'))continue;const prev=candidates.get(row.previousElementSibling),next=candidates.get(row.nextElementSibling);if(prev?.code!==item.code-1&&next?.code!==item.code+1&&!row.closest('.opt-box,.matching-box,.optbank-block,.options-box'))continue;
  const range=document.createRange();range.setStart(item.node,item.match[1].length);range.setEnd(item.node,item.match[1].length+1);const letter=document.createElement('span');letter.className='exam-option-letter';range.surroundContents(letter);
 }
}
