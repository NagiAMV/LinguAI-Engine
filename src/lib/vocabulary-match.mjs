export function normalizeVocabularyWord(word) {
  return String(word || '').trim().toLowerCase().replace(/[’‘]/g, "'");
}

// Use explicitly recorded forms rather than guessing stems (e.g. news → new).
export function findVocabularyEntry(entries, word) {
  const normalized = normalizeVocabularyWord(word);
  const exact = entries.find(entry => normalizeVocabularyWord(entry.word) === normalized);
  if (exact) return exact;
  return entries.find(entry => ['past', 'participle', 'plural', 'third_person', 'present_participle'].some(key => {
    const forms = entry.grammar?.[key];
    return (Array.isArray(forms) ? forms : String(forms || '').split(/[,;/]/)).some(form => normalizeVocabularyWord(form) === normalized);
  }));
}

export function translationMetadata(entry, language) {
  const provider = entry?.translationSources?.[language] || 'local';
  return { translationProvider: provider, machineTranslated: provider === 'MyMemory' };
}
