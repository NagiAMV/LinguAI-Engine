import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {evidenceExcerpt} from '../src/components/content/review-evidence.mjs';
import {createHash} from 'node:crypto';
test('evidence expands only unique citations into their complete sentence',()=>{
 assert.equal(evidenceExcerpt('First sentence. The answer is in this sentence. Last sentence.','answer is').text,'The answer is in this sentence.');
 assert.equal(evidenceExcerpt('No proof here.','unknown'),null);assert.equal(evidenceExcerpt('Repeat. Repeat.','Repeat'),null);
});
test('translated explanations preserve English answer labels and source provenance',()=>{
 for(const file of ['practice-reading-explanations','single-passage-reading-explanations']){
  const data=JSON.parse(fs.readFileSync('src/data/'+file+'.json','utf8'));
  for(const [id,entries] of Object.entries(data))for(const [number,entry] of Object.entries(entries)){
   for(const [language,metadata] of Object.entries(entry.translationProvenance||{})){
    assert.equal(metadata.sourceSha256,createHash('sha256').update(entry.en).digest('hex'),id+' '+number);
    const label=entry.en.match(/^(TRUE|FALSE|NOT GIVEN|YES|NO|[A-J])\s*[.:—–-]/)?.[1];
    if(label)assert.ok(entry[language].startsWith(label),id+' '+number+' '+language+' label');
   }
  }
 }
});
for(const file of ['practice-reading-explanations','single-passage-reading-explanations'])test(`${file}: supplied explanations retain their available languages and their own passage`,()=>{
 const data=JSON.parse(fs.readFileSync('src/data/'+file+'.json','utf8'));
 for(const [id,entries] of Object.entries(data)){const paper=JSON.parse(fs.readFileSync('public/practice/'+id+'.json','utf8'));assert.deepEqual(paper.reviewLanguages,['ru','en','uz'],id);for(const [number,entry] of Object.entries(entries)){for(const lang of paper.reviewLanguages)assert.ok(entry[lang]?.length>20,id+' '+number+' '+lang);assert.ok(paper.parts.some(p=>p.id===entry.part));}}
});
