import { NextResponse } from 'next/server';
import { vocabularyStore } from '@/lib/vocabulary-store.mjs';
import { findVocabularyEntry, translationMetadata } from '@/lib/vocabulary-match.mjs';

export const runtime = 'nodejs';
const pending = new Map();
async function lookup(word, language, details) {
  const entries = await vocabularyStore.read();
  let entry = findVocabularyEntry(entries, word);
  const headword = entry?.word || word;
  let source = 'local', saved = true;
  let translation = entry?.translations?.[language];
  if (!translation) {
    const url = new URL('https://api.mymemory.translated.net/get');
    url.searchParams.set('q', headword); url.searchParams.set('langpair', `en|${language}`);
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const result = await response.json();
    if (!response.ok || Number(result.responseStatus) !== 200 || !result.responseData?.translatedText || result.quotaFinished) throw new Error('Translation unavailable');
    translation = result.responseData.translatedText;
    source = 'online';
    const fields = { translations: { [language]: translation }, translationSources: { [language]: 'MyMemory' } };
    try { entry = await vocabularyStore.remember(headword, fields); }
    catch { saved = false; entry = { ...entry, word: headword, translations: { ...entry?.translations, [language]: translation }, translationSources: { ...entry?.translationSources, ...fields.translationSources } }; }
  }
  if (details && !entry?.definition) {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(headword)}`, { signal: AbortSignal.timeout(8000) });
      const results = await response.json();
      const item = response.ok && Array.isArray(results) && results[0];
      if (item) {
        const meanings = (item.meanings || []).slice(0, 4).map(m => ({ partOfSpeech: m.partOfSpeech, definitions: (m.definitions || []).slice(0, 3).map(d => ({ definition: d.definition, example: d.example || '' })) }));
        const definitions = (item.meanings || []).flatMap(m => m.definitions || []);
        const fields = { definition: definitions[0]?.definition || '', transcription: item.phonetic || item.phonetics?.find(p => p.text)?.text || '', grammar: { part_of_speech: item.meanings?.[0]?.partOfSpeech || '' }, meanings, examples: definitions.map(d => d.example).filter(Boolean).slice(0, 5), synonyms: [...new Set((item.meanings || []).flatMap(m => [...(m.synonyms || []), ...(m.definitions || []).flatMap(d => d.synonyms || [])]))].slice(0, 12), antonyms: [...new Set((item.meanings || []).flatMap(m => [...(m.antonyms || []), ...(m.definitions || []).flatMap(d => d.antonyms || [])]))].slice(0, 12), etymology: item.origin || '', dictionarySource: { provider: 'Free Dictionary API', urls: item.sourceUrls || [], license: item.license || null } };
        try { entry = await vocabularyStore.remember(headword, fields); }
        catch { saved = false; entry = { ...entry, ...fields }; }
      }
    } catch { /* Keep the translation usable if detailed information is unavailable. */ }
  }
  return { word, headword, translation, language, source, saved, entry, detailsLoaded: details, ...translationMetadata(entry, language) };
}
export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const word = (params.get('word') || '').trim().toLowerCase();
  const language = params.get('language') === 'uz' ? 'uz' : 'ru';
  const details = params.get('details') === '1';
  if (!/^[a-z]+(?:['’-][a-z]+)*$/.test(word) || word.length > 60) return NextResponse.json({ error: 'Choose one English word.' }, { status: 400 });
  const key = `${language}:${word}:${details}`;
  try {
    if (!pending.has(key)) pending.set(key, lookup(word, language, details));
    return NextResponse.json(await pending.get(key), { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Dictionary is temporarily unavailable. Try again.' }, { status: 502 }); }
  finally { pending.delete(key); }
}
