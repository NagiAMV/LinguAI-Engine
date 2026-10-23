import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('Neanderthal retains both source banks and original numbering',()=>{
 const p=JSON.parse(fs.readFileSync('public/practice/single-reading-51.json','utf8'));
 const q=p.parts[0].questions;assert.match(q,/Evidence of outdoor dwellings/);assert.match(q,/A vital source of power/);assert.match(q,/List of Places/);assert.match(q,/Krapina/);
 assert.equal(p.parts[0].fieldNames.length,14);assert.equal(p.parts[0].fieldLabels[p.parts[0].fieldNames[0]],'Question 27');
});
test('Horseshoe preserves both unordered sets and supporting quotations',()=>{
 const key=JSON.parse(fs.readFileSync('src/data/single-passage-reading-keys.json','utf8'))['single-reading-52'];
 assert.deepEqual(key.parts[1].groups,[{questions:[19,20],acceptedSets:[['B','D']]},{questions:[21,22],acceptedSets:[['A','E']]}]);
 const e=JSON.parse(fs.readFileSync('src/data/single-passage-reading-explanations.json','utf8'))['single-reading-52'];
 assert.equal(e['19–20'].quotes.length,2);assert.equal(e['21–22'].quotes.length,2);
});
