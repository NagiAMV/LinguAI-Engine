import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {findVocabularyEntry,translationMetadata} from '../src/lib/vocabulary-match.mjs';
import {createVocabularyStore} from '../src/lib/vocabulary-store.mjs';
const entries=JSON.parse(fs.readFileSync(new URL('../data/vocabulary_base.json',import.meta.url)));
test('tell and its recorded forms share the corrected verb entry',()=>{
 for(const word of ['tell','told','tells','telling']){
  const entry=findVocabularyEntry(entries,word);
  assert.equal(entry.word,'tell');assert.match(entry.translations.ru,/рассказывать/);
  assert.notEqual(entry.translations.ru.toLowerCase(),'ты');
  assert.equal(entry.meanings[0].partOfSpeech,'verb');
  assert.match(entry.meanings[0].definitions[0].definition,/communicate/);
 }
 assert.match(findVocabularyEntry(entries,'face').translations.ru,/лицо/);
 assert.match(findVocabularyEntry(entries,'the').translations.ru,/артикль/);
});
test('only explicit forms resolve to a base word, exact entries retain priority',()=>{
 const data=[{word:'new'},{word:'tell',grammar:{past:'told'}},{word:'told',translations:{ru:'отдельная запись'}}];
 assert.equal(findVocabularyEntry(data,'news'),undefined);
 assert.equal(findVocabularyEntry(data,'TOLD').word,'told');
});
test('a cached machine translation remains labelled machine-generated',()=>{
 assert.equal(translationMetadata({translationSources:{ru:'MyMemory'}},'ru').machineTranslated,true);
 assert.equal(translationMetadata(findVocabularyEntry(entries,'tell'),'ru').machineTranslated,false);
});
test('automatic remember does not overwrite a corrected local translation',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'linguai-vocabulary-'));
 try{
  const file=path.join(dir,'words.json');fs.writeFileSync(file,JSON.stringify([findVocabularyEntry(entries,'tell')]));
  const store=createVocabularyStore(file);const saved=await store.remember('tell',{translations:{ru:'Ты'},translationSources:{ru:'MyMemory'}});
  assert.match(saved.translations.ru,/рассказывать/);assert.equal(saved.translationSources.ru,'LinguAI editorial');
 }finally{fs.unlinkSync(path.join(dir,'words.json'));fs.rmdirSync(dir);}
});
