import { transcriptTime } from './transcript-follow.mjs';

export function transcriptClock(seconds) {
  const total=Math.max(0,Math.floor(seconds));
  const minute=String(Math.floor(total/60)%60).padStart(2,'0'),second=String(total%60).padStart(2,'0');
  return total>=3600?`[${String(Math.floor(total/3600)).padStart(2,'0')}:${minute}:${second}]`:`[${minute}:${second}]`;
}

export function prepareTranscriptTimestamps(element, onSeek, language = 'en') {
  // Some transcripts contain exact word cues but no printed timestamps.
  // Keep generated controls outside the prose so speaker labels and quote
  // offsets remain intact. Cue times already use their recording's timeline.
  const generated=[];
  const blocks=[...element.querySelectorAll('p,.transcript-line,[data-speaker]')].filter(node=>
    !node.closest('.transcript-source-note,[data-reading-ui]') && node.querySelector('[data-cue-start]') &&
    !node.parentElement?.closest('p,.transcript-line,[data-speaker]'));
  if(!blocks.length&&element.querySelector('[data-cue-start]'))blocks.push(element);
  for(const block of blocks){
    if([...block.querySelectorAll('small,time')].some(node=>transcriptTime(node.textContent)!==null))continue;
    const cue=block.querySelector('[data-cue-start]');
    const raw=cue?.getAttribute('data-cue-start'),time=raw?.trim()?Number(raw):NaN;
    if(!Number.isFinite(time)||time<0)continue;
    const stamp=document.createElement('small');stamp.className='transcript-generated-time';stamp.dataset.readingUi='';stamp.dataset.generatedTranscriptTime=String(time);stamp.textContent=transcriptClock(time);
    if(block===element)element.prepend(stamp);else block.before(stamp);
    generated.push(stamp);
  }
  const buttons = [];
  for (const stamp of element.querySelectorAll('small,time')) {
    const seconds = transcriptTime(stamp.textContent);
    if (seconds === null || stamp.closest('.transcript-source-note')) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'transcript-time-button';
    button.dataset.transcriptSeek = stamp.dataset.generatedTranscriptTime || String(seconds);
    button.textContent = stamp.textContent;
    button.title = (language === 'ru' ? 'Слушать с ' : language === 'uz' ? 'Shu vaqtdan tinglash: ' : 'Play from ') + stamp.textContent;
    button.setAttribute('aria-label', button.title);
    stamp.replaceChildren(button);
    buttons.push(button);
  }
  const click = event => {
    const button = event.target.closest('[data-transcript-seek]');
    if (!button || !element.contains(button)) return;
    event.preventDefault();
    onSeek(Number(button.dataset.transcriptSeek));
  };
  element.addEventListener('click', click);
  return () => {
    element.removeEventListener('click', click);
    buttons.forEach(button => { if (button.isConnected) button.replaceWith(document.createTextNode(button.textContent)); });
    generated.forEach(stamp=>stamp.remove());
  };
}
