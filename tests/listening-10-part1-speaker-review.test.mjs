import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {currentTranscriptIndex} from '../src/components/content/transcript-follow.mjs';
function speakerAt(html,time){const stack=[];for(const m of html.matchAll(/<span\b[^>]*>|<\/span>/g)){const tag=m[0];if(tag==='</span>'){stack.pop();continue;}const speaker=tag.match(/data-speaker="([^"]+)"/)?.[1]||stack.at(-1);stack.push(speaker);if(Number(tag.match(/data-cue-start="([^"]+)"/)?.[1])===time)return speaker;}}
test('Test 10 Part 1 keeps instructions and hotel activities with their actual speakers',()=>{
 const html=JSON.parse(fs.readFileSync('public/practice/practice-listening-10.json')).parts[0].passage;
 for(const [time,speaker]of [[255.18,'Speaker 1'],[288.48,'Speaker 3'],[340.12,'Speaker 2'],[148.08,'Speaker 2'],[135.15,'Speaker 3'],[58.88,'Speaker 3'],[73.52,'Speaker 1'],[80.86,'Speaker 1']])assert.equal(speakerAt(html,time),speaker,`word at ${time}`);
});
test('Test 10 Part 1 second hotel greeting starts after the narrator instructions',()=>{
 const html=JSON.parse(fs.readFileSync('public/practice/practice-listening-10.json')).parts[0].passage;
 const greetings=[...html.matchAll(/<span data-cue-start="([^"]+)" data-cue-end="[^"]+">Good<\/span>/g)];
 assert.equal(greetings.length,2);assert.ok(+greetings[1][1]>95&&+greetings[1][1]<98,'Greeting must not seek to narrator at 92 seconds');
 const part=JSON.parse(fs.readFileSync('public/practice/practice-listening-10.json')).parts[0];
 const cues=[...html.matchAll(/<span data-cue-start="([^"]+)" data-cue-end="([^"]+)">([^<]*)<\/span>/g)].map(m=>({start:+m[1],end:+m[2],word:m[3]}));
 assert.equal(cues.length,719);
 for(const [time,word]of [[58.9,"I'm"],[73.55,'The'],[80.9,'Now'],[96.1,'Good']])assert.equal(cues[currentTranscriptIndex(cues,time,part.transcriptEndSeconds)]?.word,word,`follow audio at ${time}`);
});
