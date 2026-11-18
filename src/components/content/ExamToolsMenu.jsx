'use client';
import {useEffect,useId,useRef,useState} from 'react';
export default function ExamToolsMenu({children}){
 const [open,setOpen]=useState(false),root=useRef(null),trigger=useRef(null),id=useId();
 useEffect(()=>{if(!open)return;const outside=event=>{if(!root.current?.contains(event.target))setOpen(false);};const escape=event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setOpen(false);trigger.current?.focus();}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape,true);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape,true);};},[open]);
 function close(){setOpen(false);trigger.current?.focus();}
 return <div className="exam-tools-menu" ref={root} onKeyDown={event=>{if(event.key==='Escape'&&open){event.preventDefault();event.stopPropagation();close();}}}>
  <button ref={trigger} type="button" className="exam-utility exam-tools-trigger" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(value=>!value)}><span aria-hidden="true">☷</span> Tools <span aria-hidden="true">⌄</span></button>
  <div id={id} hidden={!open} className="exam-tools-panel" role="group" aria-label="Practice tools" onClick={event=>{if(event.target.closest('.exam-highlight-toggle,.highlight-quick-colours button,.highlight-palette button,.highlight-action-modes button,.exam-notes-toggle,.exam-fullscreen,.exam-translate-toggle'))setOpen(false);}}>
   <div className="exam-tools-heading"><strong>Your workspace</strong><button type="button" aria-label="Close tools" onClick={close}>×</button></div>
   {children}
  </div>
 </div>;
}
