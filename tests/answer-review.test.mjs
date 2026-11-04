import test from "node:test";

import assert from "node:assert/strict";

import {
  reviewAnswer,
  buildReviewRows,
  splitResultRows,
} from "../src/components/content/answer-review.mjs";

const key = {
  answers: { 1: ["FALSE"], 2: ["paint", "paints"], 3: ["B"], 4: ["D"] },
};

test('result rows give unordered answers separate marks without duplicating credit',()=>{
 const paper={parts:[{id:2,fieldNames:['pair']}]};
 const questions=[19,20].map(n=>({id:String(n),number:String(n),partIndex:0,name:'pair',multiple:true}));
 const key={parts:{2:{groups:[{questions:[19,20],acceptedSets:[['A','E']]}]}}};
 for(const [answers,statuses] of [[['A','C'],['correct','incorrect']],[['E','A'],['correct','correct']],[['A','A'],['incorrect','correct']],[['A'],['correct','blank']],[[],['blank','blank']]]){
  const grouped=buildReviewRows(paper,questions,{pair:answers},[],key);
  const rows=splitResultRows(grouped);
  assert.deepEqual(rows.map(r=>r.numbers),['19','20']);
  // Duplicate values may be matched to either slot, but can only earn one mark.
  if(answers.join(',')==='A,A')assert.equal(rows.filter(r=>r.status==='correct').length,1);
  else assert.deepEqual(rows.map(r=>r.status),statuses);
  assert.equal(rows.filter(r=>r.status==='correct').length,grouped[0].credit);
  assert.equal(rows[0].groupRow,grouped[0]);
 }
 const pending=splitResultRows(buildReviewRows(paper,questions,{pair:['A']},[],null));
 assert.deepEqual(pending.map(r=>r.status),['pending','pending']);
 const excess=splitResultRows(buildReviewRows(paper,questions,{pair:['A','E','C']},[],key));
 assert.ok(excess.every(r=>r.status==='incorrect'));assert.equal(excess[1].response,'E, C');
});

test("compares explicit alternatives without case or whitespace sensitivity", () => {
  assert.equal(reviewAnswer(" false ", [1], key).status, "correct");
  assert.equal(reviewAnswer("PAINTS", [2], key).status, "correct");
  assert.equal(reviewAnswer("painting", [2], key).status, "incorrect");
});

test("does not grade missing keys or mark blanks as correct", () => {
  assert.equal(reviewAnswer("anything", [5], key).status, "pending");
  assert.equal(reviewAnswer("", [5], key).status, "pending");
  assert.equal(reviewAnswer("", [1], key).status, "blank");
  assert.equal(reviewAnswer("", [], key).status, "pending");
});

test("multiple choice distinguishes complete, partial and excessive selections", () => {
  assert.equal(reviewAnswer(["D", "B"], [3, 4], key, true).status, "correct");
  assert.equal(reviewAnswer(["B"], [3, 4], key, true).status, "partial");
  assert.equal(
    reviewAnswer(["B", "D", "E"], [3, 4], key, true).status,
    "incorrect",
  );
  assert.equal(reviewAnswer(["B", "B"], [3, 4], key, true).status, "partial");
  assert.equal(reviewAnswer(["B", "D"], [3, 5], key, true).status, "pending");
});

test("normalizes repeated whitespace but never drops articles", () => {
  const fixture = {
    answers: { 1: ["the old hall"], 2: ["an apple", "apple"] },
  };
  assert.equal(
    reviewAnswer(" THE   OLD\tHALL ", [1], fixture).status,
    "correct",
  );
  assert.equal(reviewAnswer("old hall", [1], fixture).status, "incorrect");
  assert.equal(reviewAnswer("apple", [2], fixture).status, "correct");
  assert.equal(reviewAnswer("a apple", [2], fixture).status, "incorrect");
});

test("explicit alternative sets cannot be combined into an unverified set", () => {
  // Synthetic fixtures only.
  const fixture = {
    parts: {
      1: {
        groups: [
          {
            questions: [21, 22],
            acceptedSets: [
              ["B", "D"],
              ["A", "C"],
            ],
          },
        ],
      },
    },
  };
  assert.equal(
    reviewAnswer(["D", "B"], [21, 22], fixture, true).status,
    "correct",
  );
  assert.equal(
    reviewAnswer(["C", "A"], [21, 22], fixture, true).status,
    "correct",
  );
  assert.equal(
    reviewAnswer(["B", "C"], [21, 22], fixture, true).status,
    "partial",
  );
  assert.equal(reviewAnswer([], [21, 22], fixture, true).status, "blank");
  assert.equal(
    reviewAnswer(["B", "B"], [21, 22], fixture, true).status,
    "partial",
  );
});

test('a correct choice in a partially wrong pair stays correct',()=>{
 const fixture={parts:{2:{groups:[{questions:[19,20],acceptedSets:[['A','E']]}]}}};
 const result=reviewAnswer(['A','C'],[19,20],fixture,true);
 assert.equal(result.status,'partial');assert.equal(result.credit,1);
 assert.deepEqual(result.choices.map(c=>c.status),['correct','incorrect']);
 const duplicate=reviewAnswer(['A','A'],[19,20],fixture,true);
 assert.equal(duplicate.credit,1);assert.deepEqual(duplicate.choices.map(c=>c.status),['correct','incorrect']);
 const excessive=reviewAnswer(['A','E','C'],[19,20],fixture,true);
 assert.equal(excessive.credit,0);assert.equal(excessive.overSelected,true);
 const reversed=reviewAnswer(['E','A'],[19,20],fixture,true);
 assert.equal(reversed.credit,2);assert.equal(reversed.status,'correct');
});

test('alternative accepted sets never combine to give extra credit',()=>{
 const fixture={parts:{1:{groups:[{questions:[1,2],acceptedSets:[['A','B'],['C','D']]}]}}};
 const result=reviewAnswer(['A','C'],[1,2],fixture,true);
 assert.equal(result.credit,1);assert.equal(result.choices.filter(c=>c.status==='correct').length,1);
});
