const labels = { part_of_speech: 'Часть речи', base_form: 'Начальная форма', past: 'Прошедшее время', participle: 'Причастие', plural: 'Множественное число', prefix: 'Приставка', suffix: 'Суффикс', opposite_form: 'Противоположная форма' };
function Fields({ value }) {
  const fields = Object.entries(value || {}).filter(([,v]) => (typeof v === 'string' || typeof v === 'number') && String(v).trim());
  return fields.length ? <dl>{fields.map(([key, value]) => <div key={key}><dt>{labels[key] || key.replaceAll('_', ' ')}</dt><dd>{String(value)}</dd></div>)}</dl> : null;
}
export default function VocabularyWordDetails({ entry }) {
  if (!entry) return null;
  return <div className="vocabulary-word-details">
    {entry.transcription && <p className="vocabulary-transcription">{entry.transcription}</p>}
    {entry.translations?.uz && <p><span className="vocabulary-detail-label">UZ</span> {entry.translations.uz}</p>}
    {entry.meanings?.length ? entry.meanings.map((meaning,index) => <section key={index}><h4>{meaning.partOfSpeech || 'Значение'}</h4>{meaning.definitions?.map((item,i) => <div key={i}><p>{item.definition}</p>{item.example && <blockquote>{item.example}</blockquote>}</div>)}</section>) : entry.definition && <section><h4>Значение</h4><p>{entry.definition}</p></section>}
    <Fields value={entry.grammar}/>
    {Object.values(entry.word_formation || {}).some(Boolean) && <section><h4>Словообразование</h4><Fields value={entry.word_formation}/></section>}
    {!entry.meanings?.length && entry.examples?.length > 0 && <section><h4>Примеры</h4>{entry.examples.map((example,i) => <blockquote key={i}>{typeof example === 'string' ? example : example.text || example.example}</blockquote>)}</section>}
    {entry.synonyms?.length > 0 && <section><h4>Синонимы</h4><p>{entry.synonyms.join(' · ')}</p></section>}
    {entry.antonyms?.length > 0 && <section><h4>Антонимы</h4><p>{entry.antonyms.join(' · ')}</p></section>}
    {entry.etymology && <section><h4>Происхождение</h4><p>{entry.etymology}</p></section>}
    {entry.ielts_level && <p className="vocabulary-level">IELTS {entry.ielts_level}</p>}
    {!entry.definition && !entry.meanings?.length && <p>Пока доступен только перевод. Дополнительные сведения не найдены.</p>}
    {entry.dictionarySource?.provider && <small>{entry.dictionarySource.provider}{entry.dictionarySource.license?.name ? ` · ${entry.dictionarySource.license.name}` : ''}</small>}
  </div>;
}
