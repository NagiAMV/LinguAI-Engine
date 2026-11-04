import test from 'node:test';
import assert from 'node:assert/strict';
import {adjacentQuestion} from '../src/components/content/question-navigation.mjs';

test('Tab visits each question field once, preserves group choices and crosses parts',()=>{
 const questions=[{number:'33',name:'q33',partIndex:0},{number:'34',name:'pair',partIndex:0},{number:'35',name:'pair',partIndex:0},{number:'36',name:'q36',partIndex:1}];
 assert.equal(adjacentQuestion(questions,'q33',0,1).number,'34');
 assert.equal(adjacentQuestion(questions,'pair',0,1).number,'36');
 assert.equal(adjacentQuestion(questions,'q36',1,-1).number,'34');
 assert.equal(adjacentQuestion(questions,'q33',0,-1),null);
 assert.equal(adjacentQuestion(questions,'q36',1,1),null);
 assert.equal(adjacentQuestion(questions,'missing',0,1),null);
});
