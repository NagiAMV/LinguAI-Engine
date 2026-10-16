import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {evidenceExcerpt} from '../src/components/content/review-evidence.mjs';
test('evidence expands only unique citations into their complete sentence',()=>{
 assert.equal(evidenceExcerpt('First sentence. The answer is in this sentence. Last sentence.','answer is').text,'The answer is in this sentence.');
 assert.equal(evidenceExcerpt('No proof here.','unknown'),null);assert.equal(evidenceExcerpt('Repeat. Repeat.','Repeat'),null);
});
for(const file of ['practice-reading-explanations','single-passage-reading-explanations'])test(`${file}: supplied explanations retain English, Uzbek and their own passage`,()=>{
 const data=JSON.parse(fs.readFileSync('src/data/'+file+'.json','utf8'));
 for(const [id,entries] of Object.entries(data)){const paper=JSON.parse(fs.readFileSync('public/practice/'+id+'.json','utf8'));for(const [number,entry] of Object.entries(entries)){assert.ok(entry.en.length>20&&entry.uz.length>20,id+' '+number);assert.ok(paper.parts.some(p=>p.id===entry.part));}}
});
