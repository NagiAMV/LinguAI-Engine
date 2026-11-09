import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {citationOffsets} from '../src/components/content/review-evidence.mjs';
import {transcriptQuestionRange,prepareTranscriptGroups} from '../src/components/content/transcript-groups.mjs';

test('citations tolerate punctuation, omissions and timestamp annotations without matching partial words',()=>{
 const text='Speaker: Eyesaver was founded [01:30] by Timothy Gaines, thirty years ago (Q11).';
 const match=citationOffsets(text,'Eyesaver was founded … thirty years ago');
 assert.equal(text.slice(match.start,match.end),'Eyesaver was founded [01:30] by Timothy Gaines, thirty years ago');
 assert.equal(citationOffsets('noteworthy','worthy'),null);
 assert.equal(citationOffsets('birds fly','telescopes'),null);
 assert.equal(citationOffsets('second first','first … second'),null);
});
test('reading-time announcements support written and spoken question ranges',()=>{
 assert.deepEqual(transcriptQuestionRange('Look at questions seven to ten.'),[7,10]);
 assert.deepEqual(transcriptQuestionRange('questions twenty-six to thirty'),[26,30]);
 assert.deepEqual(transcriptQuestionRange('Questions 31–40'),[31,40]);
 assert.equal(transcriptQuestionRange('questions ten to seven'),null);
});
test('a group divider belongs before the announcement, not the preceding answer',()=>{
 const previous=globalThis.document;
 const inserted=[];
 const paragraphs=['The deposit is twenty pounds.','Before you hear the rest, look at questions seven to ten.','Now listen and answer questions seven to ten.'].map((textContent,index)=>({textContent,closest:()=>null,before:node=>inserted.push({index,text:node.textContent})}));
 globalThis.document={createElement:()=>({dataset:{},remove(){}})};
 try{prepareTranscriptGroups({querySelectorAll:()=>paragraphs},{fieldLabels:{a:'Question 1',b:'Question 10'}});assert.deepEqual(inserted,[{index:1,text:'Questions 7–10'}]);}
 finally{globalThis.document=previous;}
});
test('Listening 17 telescope explanations use the correct topic and quoted source words',()=>{
 const data=JSON.parse(fs.readFileSync(new URL('../src/data/listening-explanations.json',import.meta.url)));
 const part=JSON.parse(fs.readFileSync(new URL('../public/practice/practice-listening-17.json',import.meta.url))).parts[3];
 const text=part.passage.replace(/<[^>]+>/g,' ');
 for(let n=31;n<=40;n++){
  const e=data['practice-listening-17'][n];assert.equal(e.part,4);
  assert.ok(citationOffsets(text,e.quotes[0]),`Missing telescope citation ${n}`);
  assert.doesNotMatch(e.en,/chicks|peregrine|nest/);
 }
 assert.match(data['single-listening-55']['22'].en,/^C — tourism/);
});
