import test from "node:test";

import assert from "node:assert/strict";

import {
  reviewAnswer,
  buildReviewRows,
} from "../src/components/content/answer-review.mjs";

const key = {
  answers: { 1: ["FALSE"], 2: ["paint", "paints"], 3: ["B"], 4: ["D"] },
};

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

test("multiple choice is order independent and requires the exact set", () => {
  assert.equal(reviewAnswer(["D", "B"], [3, 4], key, true).status, "correct");
  assert.equal(reviewAnswer(["B"], [3, 4], key, true).status, "incorrect");
  assert.equal(
    reviewAnswer(["B", "D", "E"], [3, 4], key, true).status,
    "incorrect",
  );
  assert.equal(reviewAnswer(["B", "B"], [3, 4], key, true).status, "incorrect");
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
    "incorrect",
  );
  assert.equal(reviewAnswer([], [21, 22], fixture, true).status, "blank");
  assert.equal(
    reviewAnswer(["B", "B"], [21, 22], fixture, true).status,
    "incorrect",
  );
});
