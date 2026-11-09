import { transcriptTime } from './transcript-follow.mjs';

export function prepareTranscriptTimestamps(element, onSeek, language = 'en') {
  const buttons = [];
  for (const stamp of element.querySelectorAll('small,time')) {
    const seconds = transcriptTime(stamp.textContent);
    if (seconds === null || stamp.closest('.transcript-source-note')) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'transcript-time-button';
    button.dataset.transcriptSeek = String(seconds);
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
  };
}
