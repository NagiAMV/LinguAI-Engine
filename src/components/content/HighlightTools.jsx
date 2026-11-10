'use client';
import {HIGHLIGHT_COLORS} from './exam-annotations.mjs';

export default function HighlightTools({enabled,locked,color,fontSize,eraseMode,onEraseMode,onToggle,onColor,onFontSize}){
 return <div className="exam-highlight-control">
  <button type="button" className="exam-utility exam-highlight-toggle" disabled={locked} aria-pressed={enabled} aria-expanded={enabled&&!locked} aria-controls="exam-highlight-tools" title="Select text to highlight · Esc to exit" onClick={onToggle}><span className={'highlight-dot '+color}/>Highlight{enabled?' on':''}</button>
  <div className="highlight-quick-colours" role="group" aria-label="Quick highlight colours">{HIGHLIGHT_COLORS.map(value=><button type="button" key={value} disabled={locked} className={'highlight-dot '+value} aria-label={'Use '+value+' highlight'} aria-pressed={color===value} title={value[0].toUpperCase()+value.slice(1)+' highlight'} onClick={()=>onColor(value)}/>)}</div>
  {enabled&&!locked&&<div id="exam-highlight-tools" className="exam-highlight-tools" role="group" aria-label="Highlight tools">
   <div className="highlight-tool-heading"><strong>Your marker</strong><button type="button" aria-label="Close highlight mode" onClick={onToggle}>×</button></div>
   <div className="highlight-action-modes" role="group" aria-label="Marker action"><button type="button" aria-label="Highlight text" aria-pressed={!eraseMode} onClick={()=>onEraseMode(false)}>Mark</button><button type="button" aria-label="Erase highlight" aria-pressed={eraseMode} onClick={()=>onEraseMode(true)}>⌫ Erase</button></div>
   <fieldset><legend>Highlight colour</legend><div className="highlight-palette">{HIGHLIGHT_COLORS.map(value=><button type="button" key={value} className={'highlight-dot '+value} aria-label={value+' highlight'} aria-pressed={color===value} title={value[0].toUpperCase()+value.slice(1)} onClick={()=>onColor(value)}/>)}</div></fieldset>
   <fieldset><legend>Text size</legend><div className="highlight-text-sizes">{[16,18,20].map((value,i)=><button type="button" key={value} aria-label={['Normal','Large','Extra large'][i]+' text'} aria-pressed={fontSize===value} onClick={()=>onFontSize(value)} style={{fontSize:value-2}}>Aa</button>)}</div></fieldset>
   <p>{eraseMode?'Tap an existing highlight to erase it.':'Select a phrase to mark it. Existing colours stay unchanged.'}</p>
  </div>}
 </div>;
}
