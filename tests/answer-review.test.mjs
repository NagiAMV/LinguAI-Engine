import test from "node:test";
import assert from "node:assert/strict";
import {
  reviewAnswer,
  buildReviewRows,
} from "../src/components/content/answer-review.mjs";
import { readFileSync } from "node:fs";
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
test("imported key remains attached to the verified test and question range", () => {
  const keys = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-answer-keys.json", import.meta.url),
    ),
  );
  assert.equal(keys["reading-19-1"].parts[1].questionNumbers.length, 13);
  assert.equal(
    reviewAnswer("paint", [8], keys["reading-19-1"]).status,
    "correct",
  );
  assert.equal(
    reviewAnswer("spin", [9], keys["reading-19-1"]).status,
    "incorrect",
  );
  assert.equal(
    reviewAnswer("anything", [14], keys["reading-19-2"]).status,
    "incorrect",
  );
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
  // Synthetic fixtures only, never saved as Cambridge answers.
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

test("new verified Cambridge 19 keys handle real alternatives and unordered pairs", () => {
  const keys = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-answer-keys.json", import.meta.url),
    ),
  );
  const first = keys["reading-19-1"];
  const second = keys["reading-19-2"];
  assert.equal(Object.keys(first.answers).length, 40);
  assert.equal(
    reviewAnswer(["D", "B"], [20, 21], first, true).status,
    "correct",
  );
  assert.equal(
    reviewAnswer(["B", "B"], [20, 21], first, true).status,
    "incorrect",
  );
  assert.equal(
    reviewAnswer(["E", "C"], [22, 23], first, true).status,
    "correct",
  );
  assert.equal(reviewAnswer(["B"], [20, 21], first, true).status, "incorrect");
  assert.equal(reviewAnswer(" labor ", [4], second).status, "correct");
  assert.equal(reviewAnswer("LABOUR", [4], second).status, "correct");
  assert.equal(reviewAnswer("the labour", [4], second).status, "incorrect");
  assert.equal(reviewAnswer("", [4], second).status, "blank");
  assert.equal(reviewAnswer("anything", [14], second).status, "incorrect");
});

test("Cambridge 1 Reading Test 1 Part 1 uses saved source keys", () => {
  const keys = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-answer-keys.json", import.meta.url),
    ),
  );
  const first = keys["reading-1-1"];
  assert.equal(first.parts[1].questionNumbers.length, 15);
  assert.equal(reviewAnswer(" PRESERVE ", [1], first).status, "correct");
  assert.equal(reviewAnswer("make", [1], first).status, "incorrect");
  assert.equal(reviewAnswer("f", [9], first).status, "correct");
  assert.equal(reviewAnswer("", [8], first).status, "blank");
  assert.equal(reviewAnswer("anything", [16], undefined).status, "pending");
});

test("user-transcribed Cambridge 1 Test 1 accepts exact alternatives and all triple permutations", () => {
  const k = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-answer-keys.json", import.meta.url),
    ),
  )["reading-1-1"];
  assert.equal(Object.keys(k.answers).length, 40);
  for (const value of k.answers[32])
    assert.equal(reviewAnswer(value, [32], k).status, "correct");
  for (const value of k.answers[35])
    assert.equal(reviewAnswer(value, [35], k).status, "correct");
  for (const value of [
    ["A", "D", "E"],
    ["A", "E", "D"],
    ["D", "A", "E"],
    ["D", "E", "A"],
    ["E", "A", "D"],
    ["E", "D", "A"],
  ])
    assert.equal(reviewAnswer(value, [26, 27, 28], k, true).status, "correct");
  assert.equal(
    reviewAnswer(["A", "D"], [26, 27, 28], k, true).status,
    "incorrect",
  );
  assert.equal(
    reviewAnswer(["A", "D", "B"], [26, 27, 28], k, true).status,
    "incorrect",
  );
  assert.equal(
    reviewAnswer("the timber and stone", [29], k).status,
    "incorrect",
  );
  assert.equal(reviewAnswer("", [29], k).status, "blank");
  assert.ok(
    k.sources.some((s) => s.part === 3 && s.type === "user-transcription"),
  );
});

test("Cambridge 1 Test 2 covers 41 questions and explicit optional words", () => {
  const k = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-answer-keys.json", import.meta.url),
    ),
  )["reading-1-2"];
  assert.equal(Object.keys(k.answers).length, 41);
  for (const text of ["cells", "HEXAGONAL CELLS", "comb"])
    assert.equal(reviewAnswer(text, [20], k).status, "correct");
  for (const text of ["frames", "frames of comb"])
    assert.equal(reviewAnswer(text, [21], k).status, "correct");
  assert.equal(reviewAnswer("the frames", [21], k).status, "incorrect");
  assert.equal(reviewAnswer(" BROOD   CHAMBER ", [23], k).status, "correct");
  assert.equal(reviewAnswer("III", [28], k).status, "correct");
  assert.equal(reviewAnswer("15-20%", [8], k).status, "correct");
  assert.equal(reviewAnswer("40%", [8], k).status, "incorrect");
  assert.equal(reviewAnswer("h", [41], k).status, "correct");
  assert.equal(reviewAnswer("", [41], k).status, "blank");
});

test("connected user files cover Cambridge 1 and Cambridge 2 tests 1–3", () => {
  const keys = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-answer-keys.json", import.meta.url),
    ),
  );
  for (const [id, total] of [
    ["reading-1-3", 38],
    ["reading-1-4", 39],
    ["reading-2-1", 40],
    ["reading-2-2", 40],
    ["reading-2-3", 40],
  ])
    assert.equal(Object.keys(keys[id].answers).length, total);
  assert.equal(
    reviewAnswer(
      ["G", "B", "F", "D"],
      [35, 36, 37, 38],
      keys["reading-1-3"],
      true,
    ).status,
    "correct",
  );
  assert.equal(
    reviewAnswer("ROSTERS", [9], keys["reading-2-3"]).status,
    "correct",
  );
  assert.equal(
    reviewAnswer("may become extinct", [36], keys["reading-1-4"]).status,
    "correct",
  );
});
test("unordered answers across separate text fields form one review row", () => {
  const keys = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-answer-keys.json", import.meta.url),
    ),
  );
  const data = JSON.parse(
    readFileSync(
      new URL("../public/cambridge/reading-2-1.json", import.meta.url),
    ),
  );
  const questions = data.parts.flatMap((p, partIndex) =>
    p.fieldNames.map((name) => ({
      name,
      number: p.fieldLabels[name].replace("Question ", ""),
      id: name,
      partIndex,
      multiple: false,
    })),
  );
  const q10 = questions.find((q) => q.number === "10"),
    q11 = questions.find((q) => q.number === "11");
  const answers = { [q10.name]: "SEA WALLS", [q11.name]: "Lantau Island" };
  let rows = buildReviewRows(data, questions, answers, [], keys[data.id]);
  assert.equal(rows.filter((r) => r.numbers === "10–11").length, 1);
  assert.equal(rows.find((r) => r.numbers === "10–11").status, "correct");
  assert.equal(rows.length, 39);
  rows = buildReviewRows(
    data,
    questions,
    { [q10.name]: "Lantau Island", [q11.name]: "Lantau Island" },
    [],
    keys[data.id],
  );
  assert.equal(rows.find((r) => r.numbers === "10–11").status, "incorrect");
});
test("confirmed four-category group rejects repeated categories and accepts permutations", () => {
  const keys = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-answer-keys.json", import.meta.url),
    ),
  );
  const k = keys["reading-2-2"];
  assert.equal(
    reviewAnswer(
      [
        "technical glossaries",
        "industrial training schemes",
        "translation services",
        "part-time language courses",
      ],
      [21, 22, 23, 24],
      k,
      true,
    ).status,
    "correct",
  );
  assert.equal(
    reviewAnswer(
      ["training", "industrial training", "translation services", "glossaries"],
      [21, 22, 23, 24],
      k,
      true,
    ).status,
    "incorrect",
  );
  assert.equal(
    reviewAnswer(
      ["training", "translation services", "glossaries"],
      [21, 22, 23, 24],
      k,
      true,
    ).status,
    "incorrect",
  );
});

test("Cambridge 2 Test 4 preserves supplied variants and full coverage", () => {
  const k = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-answer-keys.json", import.meta.url),
    ),
  )["reading-2-4"];
  assert.equal(Object.keys(k.answers).length, 40);
  for (const answer of ["Apollo programme", "APOLLO SPACE PROGRAMME"])
    assert.equal(reviewAnswer(answer, [27], k).status, "correct");
  for (const answer of ["next century", "early next century"])
    assert.equal(reviewAnswer(answer, [28], k).status, "correct");
  assert.equal(reviewAnswer("the next century", [28], k).status, "incorrect");
  assert.equal(reviewAnswer("7,000", [29], k).status, "correct");
  assert.equal(reviewAnswer(" CYSTIC   FIBROSIS ", [32], k).status, "correct");
  assert.equal(reviewAnswer("", [40], k).status, "blank");
  const status = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-key-status.json", import.meta.url),
    ),
  );
  for (const book of [1, 2])
    for (let t = 1; t <= 4; t++)
      assert.equal(status["reading-" + book + "-" + t].status, "complete");
});

test("Cambridge 3 Test 1 preserves all keys and accepts either order for 34–35", () => {
  const k = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-answer-keys.json", import.meta.url),
    ),
  )["reading-3-1"];
  assert.equal(Object.keys(k.answers).length, 40);
  assert.equal(reviewAnswer("IV", [1], k).status, "correct");
  assert.equal(reviewAnswer(" not   given ", [19], k).status, "correct");
  for (const pair of [
    ["B", "F"],
    ["F", "B"],
  ])
    assert.equal(reviewAnswer(pair, [34, 35], k, true).status, "correct");
  for (const pair of [["B"], ["B", "B"], ["B", "D"]])
    assert.equal(reviewAnswer(pair, [34, 35], k, true).status, "incorrect");
  assert.equal(reviewAnswer("", [40], k).status, "blank");
  assert.equal(reviewAnswer("A", [40], k).status, "incorrect");
});

test("Cambridge 3 Test 2 preserves explicit spelling and number alternatives", () => {
  const k = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-answer-keys.json", import.meta.url),
    ),
  )["reading-3-2"];
  assert.equal(Object.keys(k.answers).length, 40);
  for (const answer of ["2-5", "TWO TO FIVE"])
    assert.equal(reviewAnswer(answer, [11], k).status, "correct");
  assert.equal(k.answers[13].length, 8);
  for (const word of ["tunneling", "tunnelling", "tunneler", "tunneller"])
    for (const suffix of ["", " species"])
      assert.equal(
        reviewAnswer("SOUTH AFRICAN " + word + suffix, [13], k).status,
        "correct",
      );
  assert.equal(reviewAnswer("tunnelling", [13], k).status, "incorrect");
  assert.equal(reviewAnswer("role set", [36], k).status, "incorrect");
  assert.equal(reviewAnswer(" ROLE   SIGN ", [36], k).status, "correct");
  assert.equal(reviewAnswer("", [40], k).status, "blank");
});

test("Cambridge 3 Test 3 preserves case-insensitive keys and unordered triple", () => {
  const k = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-answer-keys.json", import.meta.url),
    ),
  )["reading-3-3"];
  assert.equal(Object.keys(k.answers).length, 40);
  assert.equal(reviewAnswer("ts", [7], k).status, "correct");
  assert.equal(reviewAnswer("VI", [15], k).status, "correct");
  assert.equal(reviewAnswer("NOT   GIVEN", [29], k).status, "correct");
  for (const set of [
    ["B", "D", "E"],
    ["B", "E", "D"],
    ["D", "B", "E"],
    ["D", "E", "B"],
    ["E", "B", "D"],
    ["E", "D", "B"],
  ])
    assert.equal(reviewAnswer(set, [35, 36, 37], k, true).status, "correct");
  for (const set of [
    ["B", "D"],
    ["B", "B", "E"],
    ["B", "D", "F"],
  ])
    assert.equal(reviewAnswer(set, [35, 36, 37], k, true).status, "incorrect");
  assert.equal(reviewAnswer("", [40], k).status, "blank");
});

test("Cambridge 3 Test 4 maps confirmed numbering shift and preserves variants", () => {
  const k = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-answer-keys.json", import.meta.url),
    ),
  )["reading-3-4"];
  assert.equal(Object.keys(k.answers).length, 41);
  assert.equal(reviewAnswer(["E", "D"], [16, 17], k, true).status, "correct");
  assert.equal(reviewAnswer(["D"], [16, 17], k, true).status, "incorrect");
  for (const value of [
    "advertising",
    "selling advertising",
    "advertising space",
    "selling advertising space",
  ])
    assert.equal(reviewAnswer(value, [18], k).status, "correct");
  for (const value of [
    "colour scheme",
    "three colours",
    "purple, white, green",
    "purple, white, and green",
  ])
    assert.equal(reviewAnswer(value, [19], k).status, "correct");
  assert.equal(
    reviewAnswer("THE WOMAN'S EXHIBITION", [20], k).status,
    "correct",
  );
  assert.equal(reviewAnswer("NO", [21], k).status, "correct");
  assert.equal(reviewAnswer("A", [29], k).status, "correct");
  for (const value of ["supervision", "leadership", "management"])
    assert.equal(reviewAnswer(value, [32], k).status, "correct");
  assert.equal(
    reviewAnswer("group methods of leadership", [35], k).status,
    "correct",
  );
  assert.equal(reviewAnswer("decreased", [37], k).status, "correct");
  assert.equal(reviewAnswer("F", [41], k).status, "correct");
  assert.equal(reviewAnswer("G", [41], k).status, "incorrect");
  const statuses = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-key-status.json", import.meta.url),
    ),
  );
  for (let book = 1; book <= 3; book++)
    for (let test = 1; test <= 4; test++)
      assert.equal(statuses["reading-" + book + "-" + test].status, "complete");
});

test("Cambridge 4 Test 1 requires both words within a single answer", () => {
  const k = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-answer-keys.json", import.meta.url),
    ),
  )["reading-4-1"];
  assert.equal(Object.keys(k.answers).length, 40);
  for (const [number, a, b] of [
    [17, "forward", "downward"],
    [21, "bowhead", "humpback"],
  ]) {
    for (const words of [
      [a, b],
      [b, a],
    ])
      for (const separator of [" ", ", ", " and "])
        assert.equal(
          reviewAnswer(words.join(separator).toUpperCase(), [number], k).status,
          "correct",
        );
    for (const value of [a, b, a + " " + a, a + " " + b + " extra"])
      assert.equal(reviewAnswer(value, [number], k).status, "incorrect");
    assert.equal(reviewAnswer("", [number], k).status, "blank");
  }
  for (const value of [
    "freshwater dolphin",
    "freshwater dolphins",
    "the freshwater dolphin",
    "the freshwater dolphins",
  ])
    assert.equal(reviewAnswer(value, [18], k).status, "correct");
  for (const value of [
    "clear water",
    "clear waters",
    "clear open water",
    "clear open waters",
  ])
    assert.equal(reviewAnswer(value, [25], k).status, "correct");
  assert.equal(reviewAnswer("airborne flying fish", [24], k).status, "correct");
  assert.equal(reviewAnswer("flying fish", [24], k).status, "incorrect");
});

test("Cambridge 4 Test 2 preserves explicit alternatives and the unordered triple", () => {
  const k = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-answer-keys.json", import.meta.url),
    ),
  )["reading-4-2"];
  assert.equal(Object.keys(k.answers).length, 40);
  for (const value of [
    "economic globalisation",
    "economic globalization",
    "socio-economic pressures",
  ])
    assert.equal(reviewAnswer(value, [2], k).status, "correct");
  assert.equal(reviewAnswer("economic globalism", [2], k).status, "incorrect");
  for (const value of ["emotional", "emotional problems"])
    assert.equal(reviewAnswer(value, [24], k).status, "correct");
  for (const value of ["headache", "headaches"])
    assert.equal(reviewAnswer(value, [25], k).status, "correct");
  for (const set of [
    ["A", "C", "F"],
    ["A", "F", "C"],
    ["C", "A", "F"],
    ["C", "F", "A"],
    ["F", "A", "C"],
    ["F", "C", "A"],
  ])
    assert.equal(reviewAnswer(set, [33, 34, 35], k, true).status, "correct");
  for (const set of [
    ["A", "C"],
    ["A", "A", "F"],
    ["A", "C", "G"],
  ])
    assert.equal(reviewAnswer(set, [33, 34, 35], k, true).status, "incorrect");
  const statuses = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-key-status.json", import.meta.url),
    ),
  );
  assert.equal(statuses["reading-4-2"].status, "complete");
});

test("Cambridge 4 Test 3 requires both Q5 countries and preserves supplied variants", () => {
  const k = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-answer-keys.json", import.meta.url),
    ),
  )["reading-4-3"];
  assert.equal(Object.keys(k.answers).length, 40);
  for (const [a, b] of [
    ["Sudan", "India"],
    ["India", "Sudan"],
  ])
    for (const separator of [" ", ", ", " and "])
      assert.equal(reviewAnswer(a + separator + b, [5], k).status, "correct");
  for (const value of ["Sudan", "India", "Sudan Sudan", "Sudan India extra"])
    assert.equal(reviewAnswer(value, [5], k).status, "incorrect");
  for (const value of [
    "linguist",
    "the linguist",
    "linguist acts",
    "the linguist acts",
    "linguists",
    "the linguists",
    "linguists act",
    "the linguists act",
  ])
    assert.equal(reviewAnswer(value, [32], k).status, "correct");
  for (const value of ["Shoe Shine", "Shoe Shine Collective"])
    assert.equal(reviewAnswer(value, [7], k).status, "correct");
  for (const value of ["plates", "the plates", "the tectonic plates"])
    assert.equal(reviewAnswer(value, [18], k).status, "correct");
  for (const value of ["behaviour", "behavior"])
    assert.equal(reviewAnswer(value, [35], k).status, "incorrect");
  assert.equal(reviewAnswer("non-verbal behavior", [35], k).status, "correct");
  const statuses = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-key-status.json", import.meta.url),
    ),
  );
  assert.equal(statuses["reading-4-3"].status, "complete");
});

test("Cambridge 4 Test 4 accepts each supplied unordered pair only as a full set", () => {
  const k = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-answer-keys.json", import.meta.url),
    ),
  )["reading-4-4"];
  assert.equal(Object.keys(k.answers).length, 40);
  for (const [numbers, a, b] of [
    [[20, 21], "D", "E"],
    [[22, 23], "C", "D"],
    [[25, 26], "humanistic study", "historical discipline"],
  ]) {
    assert.equal(reviewAnswer([a, b], numbers, k, true).status, "correct");
    assert.equal(reviewAnswer([b, a], numbers, k, true).status, "correct");
    assert.equal(reviewAnswer([a], numbers, k, true).status, "incorrect");
    assert.equal(reviewAnswer([a, a], numbers, k, true).status, "incorrect");
  }
  assert.equal(reviewAnswer(["D", "F"], [20, 21], k, true).status, "incorrect");
  assert.equal(reviewAnswer(["C", "A"], [22, 23], k, true).status, "incorrect");
  assert.equal(reviewAnswer("oral histories", [24], k).status, "correct");
  assert.equal(reviewAnswer("scientist", [27], k).status, "correct");
  const statuses = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-key-status.json", import.meta.url),
    ),
  );
  assert.equal(statuses["reading-4-4"].status, "complete");
});

test("Cambridge 5 Tests 1-3 preserve all keys and unordered answer groups", () => {
  const keys = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-answer-keys.json", import.meta.url),
    ),
  );
  const statuses = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-key-status.json", import.meta.url),
    ),
  );
  const t1 = keys["reading-5-1"];
  assert.equal(Object.keys(t1.answers).length, 40);
  for (const set of [
    ["D", "E", "G"],
    ["D", "G", "E"],
    ["E", "D", "G"],
    ["E", "G", "D"],
    ["G", "D", "E"],
    ["G", "E", "D"],
  ])
    assert.equal(reviewAnswer(set, [1, 2, 3], t1, true).status, "correct");
  for (const set of [
    ["D", "E"],
    ["D", "D", "G"],
    ["D", "E", "A"],
  ])
    assert.equal(reviewAnswer(set, [1, 2, 3], t1, true).status, "incorrect");
  for (const value of ["clerks", "copying clerks"])
    assert.equal(reviewAnswer(value, [4], t1).status, "correct");

  const t2 = keys["reading-5-2"];
  assert.equal(Object.keys(t2.answers).length, 40);
  for (const pair of [
    ["technical vocabulary", "grammatical resources"],
    ["grammatical resources", "technical vocabulary"],
  ])
    assert.equal(reviewAnswer(pair, [30, 31], t2, true).status, "correct");
  for (const pair of [
    ["technical vocabulary"],
    ["technical vocabulary", "technical vocabulary"],
    ["technical vocabulary", "grammar"],
  ])
    assert.equal(reviewAnswer(pair, [30, 31], t2, true).status, "incorrect");
  for (const value of [
    "Principia",
    "the principia",
    "Newton's Principia",
    "mathematical treatise",
  ])
    assert.equal(reviewAnswer(value, [39], t2).status, "correct");
  for (const value of ["local", "more local", "local audience"])
    assert.equal(reviewAnswer(value, [40], t2).status, "correct");

  const t3 = keys["reading-5-3"];
  assert.equal(Object.keys(t3.answers).length, 40);
  assert.equal(reviewAnswer("iv", [14], t3).status, "correct");
  assert.equal(reviewAnswer("FALSE", [36], t3).status, "correct");
  for (const test of [1, 2, 3])
    assert.equal(statuses[`reading-5-${test}`].status, "complete");
});

test("Cambridge 5 Test 4 preserves explicitly supplied answer variants", () => {
  const keys = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-answer-keys.json", import.meta.url),
    ),
  );
  const t4 = keys["reading-5-4"];
  assert.equal(Object.keys(t4.answers).length, 40);
  for (const value of ["tourism", "tourist", "tour"])
    assert.equal(reviewAnswer(value, [11], t4).status, "correct");
  for (const value of ["jewellery", "jewelry"])
    assert.equal(reviewAnswer(value, [13], t4).status, "correct");
  for (const value of ["day neutral", "day-neutral plants"])
    assert.equal(reviewAnswer(value, [35], t4).status, "correct");
  assert.equal(reviewAnswer("day-neutral", [35], t4).status, "incorrect");
  for (const value of [
    "food",
    "food resources",
    "adequate food",
    "adequate food resources",
  ])
    assert.equal(reviewAnswer(value, [36], t4).status, "correct");
  for (const value of ["insects", "fertilizations by insects"])
    assert.equal(reviewAnswer(value, [37], t4).status, "correct");
  for (const value of ["rainfall", "suitable rainfall"])
    assert.equal(reviewAnswer(value, [38], t4).status, "correct");
  const statuses = JSON.parse(
    readFileSync(
      new URL("../src/data/cambridge-key-status.json", import.meta.url),
    ),
  );
  for (const test of [1, 2, 3, 4])
    assert.equal(statuses[`reading-5-${test}`].status, "complete");
});

test("Cambridge 6 Test 1 retains optional article and explicit percentage alternatives", () => {
  const keys = JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json', import.meta.url)));
  const saved = keys['reading-6-1'];
  assert.equal(Object.keys(saved.answers).length, 40);
  for (const value of ['competition model', ' A   COMPETITION MODEL '])
    assert.equal(reviewAnswer(value, [12], saved).status, 'correct');
  for (const value of ['by 2 per cent', 'BY 2%', 'by 2 %'])
    assert.equal(reviewAnswer(value, [13], saved).status, 'correct');
  for (const value of ['2%', 'by 3%', 'by two percent'])
    assert.equal(reviewAnswer(value, [13], saved).status, 'incorrect');
  assert.equal(reviewAnswer('the competition model', [12], saved).status, 'incorrect');
  assert.equal(reviewAnswer('', [13], saved).status, 'blank');
  assert.equal(reviewAnswer('d', [40], saved).status, 'correct');
  assert.deepEqual(Object.values(saved.parts).map(p => p.questionNumbers.length), [13, 13, 14]);
});

test('Cambridge 6 Tests 2–4 cover real part boundaries, optional words and unordered pair', () => {
  const keys = JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json', import.meta.url)));
  const statuses = JSON.parse(readFileSync(new URL('../src/data/cambridge-key-status.json', import.meta.url)));
  for (const number of [2,3,4]) {
    const saved = keys[`reading-6-${number}`];
    assert.equal(Object.keys(saved.answers).length, 40);
    assert.equal(statuses[`reading-6-${number}`].status, 'complete');
  }
  const t2=keys['reading-6-2'], t3=keys['reading-6-3'], t4=keys['reading-6-4'];
  assert.equal(reviewAnswer(' II ',[1],t2).status,'correct');
  assert.equal(reviewAnswer('not given',[40],t2).status,'correct');
  assert.equal(t3.parts[2].questionNumbers.at(-1),27);
  assert.equal(t3.parts[3].questionNumbers[0],28);
  assert.equal(reviewAnswer(' FREE   RADICALS ',[39],t3).status,'correct');
  for(const pair of [['C','E'],['e','c']]) assert.equal(reviewAnswer(pair,[25,26],t4,true).status,'correct');
  for(const pair of [['C'],['C','C'],['C','B']]) assert.equal(reviewAnswer(pair,[25,26],t4,true).status,'incorrect');
  for(const value of ['guidelines','explicit guidelines']) assert.equal(reviewAnswer(value,[36],t4).status,'correct');
  for(const value of ['curriculum','school curriculum']) assert.equal(reviewAnswer(value,[37],t4).status,'correct');
  assert.equal(reviewAnswer('the curriculum',[37],t4).status,'incorrect');
  assert.equal(reviewAnswer('',[38],t4).status,'blank');
});

test('Cambridge 7 complete keys preserve supplied variants and recognize unanswered questions', () => {
  const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
  for(const [t,count] of [[1,40],[2,40],[3,40],[4,40]]) assert.equal(Object.keys(keys[`reading-7-${t}`].answers).length,count);
  const t1=keys['reading-7-1'],t2=keys['reading-7-2'],t3=keys['reading-7-3'],t4=keys['reading-7-4'];
  for(const a of ['echoes','obstacles']) assert.equal(reviewAnswer(a,[7],t1).status,'correct');
  assert.equal(reviewAnswer('modern intensive farming',[23],t2).status,'correct');
  assert.equal(reviewAnswer('i',[37],t2).status,'correct');
  for(const n of [11,12,13,25,26]) assert.equal(reviewAnswer('anything',[n],t2).status,'incorrect');
  for(const n of [12,13,24,25,26,38,39,40]) assert.equal(reviewAnswer('',[n],t3).status,'blank');
  for(const [n,a] of [[12,'O'],[13,'E'],[24,'A'],[25,'A'],[26,'A'],[38,'G'],[39,'D'],[40,'B']]) assert.equal(reviewAnswer(a.toLowerCase(),[n],t3).status,'correct');
  for(const a of ['pulleys','WOODEN PULLEYS']) assert.equal(reviewAnswer(a,[8],t4).status,'correct');
  assert.equal(reviewAnswer('the pulleys',[8],t4).status,'incorrect');
});

test('Cambridge 8 supplied keys preserve optional words and reject inferred synonyms', () => {
 const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 const t1=keys['reading-8-1'],t2=keys['reading-8-2'],t4=keys['reading-8-4'];
 for(const a of ['wheel','ESCAPE WHEEL']) assert.equal(reviewAnswer(a,[10],t1).status,'correct');
 for(const a of ['big enough','large enough']) assert.equal(reviewAnswer(a,[40],t1).status,'correct');
 assert.equal(reviewAnswer('big',[40],t1).status,'incorrect');
 for(const a of ['tin','molten tin','metal','molten metal']) assert.equal(reviewAnswer(a,[7],t2).status,'correct');
 assert.equal(reviewAnswer('glass',[7],t2).status,'incorrect');
 assert.equal(reviewAnswer(' LEAF   LITTER ',[38],t4).status,'correct');
 assert.equal(Object.keys(t4.answers).length,40);
});

test('Cambridge 8 explicit corrections replace Q5 and preserve unordered pairs', () => {
 const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 const a=keys['reading-8-1'],b=keys['reading-8-2'];
 assert.equal(reviewAnswer('D',[5],a).status,'correct');
 assert.equal(reviewAnswer('B',[5],a).status,'incorrect');
 for(const v of ['anchor',"ship's anchor",'an anchor','the anchor'])assert.equal(reviewAnswer(v,[9],a).status,'correct');
 for(const v of ['fraud','outright fraud','or fraud','or outright fraud'])for(const pair of [['sensory leakage',v],[v,'sensory leakage']])assert.equal(reviewAnswer(pair,[34,35],a,true).status,'correct');
 assert.equal(reviewAnswer(['fraud','fraud'],[34,35],a,true).status,'incorrect');
 for(const pair of [['B','C'],['C','B']])assert.equal(reviewAnswer(pair,[18,19],b,true).status,'correct');
 assert.equal(reviewAnswer(['B'],[18,19],b,true).status,'incorrect');
 assert.equal(reviewAnswer('rollers',[8],b).status,'correct');
 assert.equal(reviewAnswer('rolles',[8],b).status,'incorrect');
 for(const v of ['labour intensive','labour-intensive','labor intensive','labor-intensive'])assert.equal(reviewAnswer(v,[3],b).status,'correct');
 assert.equal(Object.keys(a.answers).length,40);assert.equal(Object.keys(b.answers).length,40);
});

test('Cambridge 8 Test 3 confirmed sets require distinct answers in any order', () => {
 const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 const key=keys['reading-8-3'];
 assert.equal(Object.keys(key.answers).length,40);
 const permutations = values => values.length ? values.flatMap((v,i)=>permutations(values.filter((_,j)=>i!==j)).map(rest=>[v,...rest])) : [[]];
 for(const set of permutations(['B','C','F','H','J'])) assert.equal(reviewAnswer(set,[14,15,16,17,18],key,true).status,'correct');
 for(const set of [['B','C','F','H'],['B','C','F','H','H'],['B','C','F','H','A']]) assert.equal(reviewAnswer(set,[14,15,16,17,18],key,true).status,'incorrect');
 for(const word of ['thermodynamics','and thermodynamics']) for(const set of [['physical chemistry',word],[word,'physical chemistry']]) assert.equal(reviewAnswer(set,[33,34],key,true).status,'correct');
 assert.equal(reviewAnswer(['physical chemistry','physical chemistry'],[33,34],key,true).status,'incorrect');
 assert.equal(reviewAnswer(['thermodynamics'],[33,34],key,true).status,'incorrect');
});

test('Cambridge 7 Test 2 completed key requires both Q26 terms for one answer', () => {
 const key=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-7-2'];
 assert.equal(reviewAnswer('B',[5],key).status,'correct');
 assert.equal(reviewAnswer('D',[5],key).status,'incorrect');
 for(const a of ['farmers consumers','farmers and consumers','consumers farmers','CONSUMERS AND FARMERS']) assert.equal(reviewAnswer(a,[26],key).status,'correct');
 for(const a of ['farmers','consumers','farmers and farmers']) assert.equal(reviewAnswer(a,[26],key).status,'incorrect');
 assert.equal(reviewAnswer('greener food standard',[25],key).status,'correct');
 assert.equal(Object.keys(key.answers).length,40);
});

test('Cambridge 9 complete keys support confirmed letter, variants and both-required answers', () => {
 const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 for(const t of [1,2,3,4])assert.equal(Object.keys(keys[`reading-9-${t}`].answers).length,40);
 const a=keys['reading-9-1'],b=keys['reading-9-2'],c=keys['reading-9-3'],d=keys['reading-9-4'];
 assert.equal(reviewAnswer('H',[1],b).status,'correct');assert.equal(reviewAnswer('ii',[1],b).status,'incorrect');
 for(const v of ['breathing reproduction','reproduction and breathing'])assert.equal(reviewAnswer(v,[28],a).status,'correct');
 assert.equal(reviewAnswer('breathing',[28],a).status,'incorrect');
 assert.equal(reviewAnswer(['C','A'],[11,12],b,true).status,'correct');
 assert.equal(reviewAnswer(['C','C'],[11,12],b,true).status,'incorrect');
 assert.equal(reviewAnswer(['J','F','E','D','A'],[18,19,20,21,22],c,true).status,'correct');
 assert.equal(reviewAnswer(['J','F','E','D','D'],[18,19,20,21,22],c,true).status,'incorrect');
 assert.equal(reviewAnswer('maintenance',[23],c).status,'correct');
 assert.equal(reviewAnswer('Saturn and Jupiter',[33],c).status,'correct');
 assert.equal(reviewAnswer('circuits sensors',[35],c).status,'correct');
 assert.equal(reviewAnswer('sensors',[35],c).status,'incorrect');
 for(const v of ['leukaemia','leukemia'])assert.equal(reviewAnswer(v,[13],d).status,'correct');
});

test('Cambridge 10 Tests 1–2 preserve variants and require both Q23 terms', () => {
 const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 const a=keys['reading-10-1'],b=keys['reading-10-2'];
 assert.equal(Object.keys(a.answers).length,40);assert.equal(Object.keys(b.answers).length,40);
 for(const v of ['4 sides','four sides'])assert.equal(reviewAnswer(v,[10],a).status,'correct');
 assert.equal(reviewAnswer('4',[10],a).status,'incorrect');
 for(const v of ['verandas','verandahs'])assert.equal(reviewAnswer(v,[12],a).status,'correct');
 for(const v of ['books activities','activities books','books and activities','activities and books','books, activities','activities, books'])assert.equal(reviewAnswer(v,[23],b).status,'correct');
 for(const v of ['books','activities','books and books'])assert.equal(reviewAnswer(v,[23],b).status,'incorrect');
 for(const v of ['internal regulation','SELF-REGULATION'])assert.equal(reviewAnswer(v,[24],b).status,'correct');
 assert.equal(reviewAnswer('',[23],b).status,'blank');
});

test('Cambridge 10 Tests 3–4 preserve explicit variants and shared words', () => {
 const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 const a=keys['reading-10-3'],b=keys['reading-10-4'];
 for(const key of [a,b])assert.equal(Object.keys(key.answers).length,40);
 for(const v of ['source of income','industry'])assert.equal(reviewAnswer(v,[11],a).status,'correct');
 for(const v of ['sun','SUNLIGHT'])assert.equal(reviewAnswer(v,[19],a).status,'correct');
 for(const v of ['10 times','ten times'])assert.equal(reviewAnswer(v,[2],b).status,'correct');
 assert.equal(reviewAnswer('10',[2],b).status,'incorrect');
 for(const v of ['negative emotions','negative feelings'])assert.equal(reviewAnswer(v,[18],b).status,'correct');
 assert.equal(reviewAnswer('positive feelings',[18],b).status,'incorrect');
 assert.equal(reviewAnswer('',[18],b).status,'blank');
});

test('Cambridge 11 keys preserve optional words, spelling and unordered pair', () => {
 const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 for(const t of [1,2,3,4])assert.equal(Object.keys(keys[`reading-11-${t}`].answers).length,40);
 const a=keys['reading-11-1'],b=keys['reading-11-2'],c=keys['reading-11-3'];
 for(const v of ['urban centres','urban centers'])assert.equal(reviewAnswer(v,[2],a).status,'correct');
 for(const v of ['trays','STACKED TRAYS'])assert.equal(reviewAnswer(v,[6],a).status,'correct');
 for(const v of ['frame','lifting frame'])assert.equal(reviewAnswer(v,[9],b).status,'correct');
 for(const v of ['cradle','lifting cradle'])assert.equal(reviewAnswer(v,[12],b).status,'correct');
 for(const pair of [['B','C'],['C','B']])assert.equal(reviewAnswer(pair,[25,26],b,true).status,'correct');
 for(const pair of [['B'],['B','B'],['B','D']])assert.equal(reviewAnswer(pair,[25,26],b,true).status,'incorrect');
 for(const v of ['corridor','passageway'])assert.equal(reviewAnswer(v,[26],c).status,'correct');
 assert.equal(reviewAnswer('',[26],c).status,'blank');
});

test('Cambridge 12 Test 1 preserves supplied alternatives without accepting synonyms', () => {
 const key=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-12-1'];
 assert.equal(Object.keys(key.answers).length,40);
 for(const [n,values] of [[17,['contact','meetings']],[18,['hunt','desire']],[19,['aimless','empty']]])for(const v of values)assert.equal(reviewAnswer(v,[n],key).status,'correct');
 assert.equal(reviewAnswer(' FIRE   SCIENCE ',[33],key).status,'correct');
 assert.equal(reviewAnswer('meeting',[17],key).status,'incorrect');
 assert.equal(reviewAnswer('',[17],key).status,'blank');
 assert.equal(reviewAnswer('vi',[27],key).status,'correct');
});

test('Cambridge 12 Test 2 keeps Choose TWO groups separate and order independent', () => {
 const key=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-12-2'];
 assert.equal(Object.keys(key.answers).length,40);
 for(const [numbers,letters] of [[[10,11],['D','E']],[[12,13],['C','D']]]){
  for(const pair of [letters,[...letters].reverse()])assert.equal(reviewAnswer(pair,numbers,key,true).status,'correct');
  assert.equal(reviewAnswer([letters[0],letters[0]],numbers,key,true).status,'incorrect');
  assert.equal(reviewAnswer([letters[0]],numbers,key,true).status,'incorrect');
 }
 assert.equal(reviewAnswer(['D','E'],[12,13],key,true).status,'incorrect');
 assert.equal(reviewAnswer(' EYE   MOVEMENTS ',[27],key).status,'correct');
 assert.equal(reviewAnswer('language co-activation',[28],key).status,'correct');
 assert.equal(reviewAnswer('eye movement',[27],key).status,'incorrect');
 assert.equal(reviewAnswer('',[29],key).status,'blank');
});

test('Cambridge 12 Test 3 keys retain question mapping and safe normalization', () => {
 const key=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-12-3'];
 assert.equal(Object.keys(key.answers).length,40);
 assert.deepEqual(Object.values(key.parts).map(p=>p.questionNumbers.length),[13,13,14]);
 assert.equal(reviewAnswer('V',[1],key).status,'correct');
 assert.equal(reviewAnswer('MOSQUITOS',[22],key).status,'correct');
 assert.equal(reviewAnswer(' ANTICIPATORY   PHASE ',[30],key).status,'correct');
 assert.equal(reviewAnswer('anticipation',[30],key).status,'incorrect');
 assert.equal(reviewAnswer('',[30],key).status,'blank');
 assert.equal(reviewAnswer('c',[40],key).status,'correct');
});

test('Cambridge 12 Test 4 completes coverage and preserves final alternatives', () => {
 const key=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-12-4'];
 assert.equal(Object.keys(key.answers).length,40);
 assert.deepEqual(Object.values(key.parts).map(p=>p.questionNumbers.length),[13,13,14]);
 for(const v of ['investors','SHAREHOLDERS'])assert.equal(reviewAnswer(v,[40],key).status,'correct');
 assert.equal(reviewAnswer('investor',[40],key).status,'incorrect');
 assert.equal(reviewAnswer('',[40],key).status,'blank');
 assert.equal(reviewAnswer(' iv ',[27],key).status,'correct');
});

test('Cambridge 13 covers all four tests and explicit optional answers', () => {
 const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 for(const t of [1,2,3,4]){
  const key=keys[`reading-13-${t}`];
  assert.equal(Object.keys(key.answers).length,40);
  assert.deepEqual(Object.values(key.parts).map(p=>p.questionNumbers.length),[13,13,14]);
 }
 const key=keys['reading-13-3'];
 for(const v of ['fathers','DADS'])assert.equal(reviewAnswer(v,[19],key).status,'correct');
 for(const v of ['vests','audio-recording vests'])assert.equal(reviewAnswer(v,[22],key).status,'correct');
 assert.equal(reviewAnswer('vest',[22],key).status,'incorrect');
 assert.equal(reviewAnswer('',[22],key).status,'blank');
 assert.equal(reviewAnswer(' BRIDGE   HYPOTHESIS ',[20],key).status,'correct');
});

test('Cambridge 14 Test 1 checks each unordered pair independently', () => {
 const key=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-14-1'];
 assert.equal(Object.keys(key.answers).length,40);
 for(const [numbers,answers] of [[[4,5],['traffic','crime']],[[19,20],['B','D']],[[21,22],['D','F']]]){
  for(const pair of [answers,[...answers].reverse()])assert.equal(reviewAnswer(pair,numbers,key,true).status,'correct');
  assert.equal(reviewAnswer([answers[0]],numbers,key,true).status,'incorrect');
  assert.equal(reviewAnswer([answers[0],answers[0]],numbers,key,true).status,'incorrect');
  assert.equal(reviewAnswer([],numbers,key,true).status,'blank');
 }
 assert.equal(reviewAnswer(['B','D'],[21,22],key,true).status,'incorrect');
 assert.equal(reviewAnswer(' CHARACTERISTICS ',[40],key).status,'correct');
});

test('Cambridge 14 Tests 2–4 preserve variants and independent unordered pairs', () => {
 const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 for(const t of [2,3,4])assert.equal(Object.keys(keys[`reading-14-${t}`].answers).length,40);
 for(const v of ['design','DESIGNS'])assert.equal(reviewAnswer(v,[19],keys['reading-14-2']).status,'correct');
 for(const v of ['four','4'])assert.equal(reviewAnswer(v,[1],keys['reading-14-4']).status,'correct');
 for(const [t,nums,pair] of [[3,[21,22],['B','C']],[4,[23,24],['B','D']],[4,[25,26],['B','E']]]){
  const key=keys[`reading-14-${t}`];
  for(const v of [pair,[...pair].reverse()])assert.equal(reviewAnswer(v,nums,key,true).status,'correct');
  assert.equal(reviewAnswer([pair[0]],nums,key,true).status,'incorrect');
  assert.equal(reviewAnswer([pair[0],pair[0]],nums,key,true).status,'incorrect');
  assert.equal(reviewAnswer([],nums,key,true).status,'blank');
 }
 assert.equal(reviewAnswer(['B','D'],[25,26],keys['reading-14-4'],true).status,'incorrect');
});

test('Cambridge 15 preserves optional words, hyphen and required complete pairs', () => {
 const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 for(const t of [1,2,3,4])assert.equal(Object.keys(keys[`reading-15-${t}`].answers).length,40);
 const a=keys['reading-15-1'],b=keys['reading-15-2'],d=keys['reading-15-4'];
 for(const v of ['car sharing','car-sharing'])assert.equal(reviewAnswer(v,[20],a).status,'correct');
 for(const [nums,pair] of [[[23,24],['C','D']],[[25,26],['A','E']]]){
  for(const v of [pair,[...pair].reverse()])assert.equal(reviewAnswer(v,nums,a,true).status,'correct');
  assert.equal(reviewAnswer([pair[0],pair[0]],nums,a,true).status,'incorrect');
 }
 for(const v of ['emissions','carbon emissions'])assert.equal(reviewAnswer(v,[22],b).status,'correct');
 for(const v of ['branches','its branches','huarango branches','the branches'])assert.equal(reviewAnswer(v,[6],d).status,'correct');
 for(const v of ['leaves bark','LEAVES AND BARK'])assert.equal(reviewAnswer(v,[7],d).status,'correct');
 for(const v of ['leaves','bark'])assert.equal(reviewAnswer(v,[7],d).status,'incorrect');
 assert.equal(reviewAnswer('',[7],d).status,'blank');
});

test('Cambridge 16 Test 1 accepts Roman numeral case and unordered B/D pair', () => {
 const key=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-16-1'];
 assert.equal(Object.keys(key.answers).length,40);
 assert.deepEqual(Object.values(key.parts).map(p=>p.questionNumbers.length),[13,13,14]);
 assert.equal(reviewAnswer('iv',[14],key).status,'correct');
 assert.equal(reviewAnswer('viii',[19],key).status,'correct');
 for(const pair of [['B','D'],['d','b']])assert.equal(reviewAnswer(pair,[25,26],key,true).status,'correct');
 for(const pair of [['B'],['B','B'],['B','C']])assert.equal(reviewAnswer(pair,[25,26],key,true).status,'incorrect');
 assert.equal(reviewAnswer([],[25,26],key,true).status,'blank');
 assert.equal(reviewAnswer(' PHOTOGRAPHER ',[11],key).status,'correct');
});

test('Cambridge 16 Tests 2–4 retain optional components and independent pairs', () => {
 const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 for(const t of [2,3,4])assert.equal(Object.keys(keys[`reading-16-${t}`].answers).length,40);
 const c=keys['reading-16-3'],d=keys['reading-16-4'];
 for(const v of ['microorganisms','micro-organisms'])assert.equal(reviewAnswer(v,[20],c).status,'correct');
 for(const v of ['warm','warm winter'])assert.equal(reviewAnswer(v,[38],c).status,'correct');
 for(const v of ['mustard','mustard plant','mustard plants'])assert.equal(reviewAnswer(v,[40],c).status,'correct');
 for(const [nums,pair] of [[[23,24],['B','C']],[[25,26],['A','C']]]){
  for(const v of [pair,[...pair].reverse()])assert.equal(reviewAnswer(v,nums,c,true).status,'correct');
  assert.equal(reviewAnswer([pair[0],pair[0]],nums,c,true).status,'incorrect');
 }
 for(const prefix of ['','the '])for(const possessive of ['',"'s"])for(const suffix of ['',' name'])assert.equal(reviewAnswer(prefix+'architect'+possessive+suffix,[12],d).status,'correct');
 assert.equal(reviewAnswer('name',[12],d).status,'incorrect');
 for(const v of ['harbour','harbor','the harbour','the harbor'])assert.equal(reviewAnswer(v,[13],d).status,'correct');
 assert.equal(reviewAnswer('iii',[27],d).status,'correct');
});

test('Cambridge 17 preserves spelling variants and all five independent pairs', () => {
 const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 for(const t of [1,2,3,4])assert.equal(Object.keys(keys[`reading-17-${t}`].answers).length,40);
 for(const v of ['flavour','flavor'])assert.equal(reviewAnswer(v,[24],keys['reading-17-2']).status,'correct');
 for(const v of ['orangutan','orang-utan','Sumatran orangutan','Sumatran orang-utan'])assert.equal(reviewAnswer(v,[24],keys['reading-17-3']).status,'correct');
 for(const [t,nums,pair] of [[1,[23,24],['C','D']],[1,[25,26],['B','E']],[3,[21,22],['B','C']],[4,[23,24],['B','E']],[4,[25,26],['B','D']]]){
  const key=keys[`reading-17-${t}`];
  for(const v of [pair,[...pair].reverse()])assert.equal(reviewAnswer(v,nums,key,true).status,'correct');
  assert.equal(reviewAnswer([pair[0]],nums,key,true).status,'incorrect');
  assert.equal(reviewAnswer([pair[0],pair[0]],nums,key,true).status,'incorrect');
  assert.equal(reviewAnswer([],nums,key,true).status,'blank');
 }
 assert.equal(reviewAnswer(['B','E'],[25,26],keys['reading-17-4'],true).status,'incorrect');
});

test('Cambridge 18 preserves supplied variants and independent unordered pairs', () => {
 const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 for(const t of [1,2,3,4])assert.equal(Object.keys(keys[`reading-18-${t}`].answers).length,40);
 for(const [t,n,variants] of [[1,3,['consumption','food consumption']],[1,7,['flavour','flavor']],[2,1,['antlers','deer antlers']],[2,2,['posts','timber posts']],[3,25,['fifty','50']]]){
  for(const value of variants)assert.equal(reviewAnswer(`  ${value.toUpperCase()}  `,[n],keys[`reading-18-${t}`]).status,'correct');
 }
 const key=keys['reading-18-4'];
 for(const [nums,pair] of [[[10,11],['C','D']],[[12,13],['A','D']]]){
  assert.equal(reviewAnswer([...pair].reverse(),nums,key,true).status,'correct');
  assert.equal(reviewAnswer([pair[0],pair[0]],nums,key,true).status,'incorrect');
  assert.equal(reviewAnswer([pair[0]],nums,key,true).status,'incorrect');
  assert.equal(reviewAnswer([],nums,key,true).status,'blank');
 }
 assert.equal(reviewAnswer(['A','D'],[10,11],key,true).status,'incorrect');
 assert.equal(reviewAnswer('the antlers',[1],keys['reading-18-2']).status,'incorrect');
});

test('Cambridge 19 Test 2 is complete and preserves explicit alternatives and independent pairs', () => {
 const key=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-19-2'];
 assert.equal(Object.keys(key.answers).length,40);
 assert.deepEqual(Object.values(key.parts).map(p=>p.questionNumbers.length),[13,13,14]);
 for(const [n,variants] of [[4,['labour','labor']],[6,['railway','railways']],[22,['visualisation','visualization']]])for(const v of variants)assert.equal(reviewAnswer(` ${v.toUpperCase()} `,[n],key).status,'correct');
 for(const [nums,pair] of [[[23,24],['B','D']],[[25,26],['A','E']]]){
  for(const v of [pair,[...pair].reverse()])assert.equal(reviewAnswer(v,nums,key,true).status,'correct');
  assert.equal(reviewAnswer([pair[0]],nums,key,true).status,'incorrect');
  assert.equal(reviewAnswer([pair[0],pair[0]],nums,key,true).status,'incorrect');
  assert.equal(reviewAnswer([],nums,key,true).status,'blank');
 }
 assert.equal(reviewAnswer(['A','E'],[23,24],key,true).status,'incorrect');
 assert.equal(reviewAnswer('the railway',[6],key).status,'incorrect');
});

test('Cambridge 19 Test 1 accepts the user-supplied gut alternative', () => {
 const key=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-19-1'];
 for(const value of ['intestines','gut',' GUT '])assert.equal(reviewAnswer(value,[11],key).status,'correct');
 assert.equal(reviewAnswer('the gut',[11],key).status,'incorrect');
});

test('Cambridge 19 Tests 3 and 4 are complete and retain explicit singular/plural alternatives', () => {
 const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 for(const t of [3,4]){
  const key=keys[`reading-19-${t}`];
  assert.equal(Object.keys(key.answers).length,40);
  assert.deepEqual(Object.values(key.parts).map(p=>p.questionNumbers.length),[13,13,14]);
 }
 const third=keys['reading-19-3'],fourth=keys['reading-19-4'];
 assert.equal(reviewAnswer(' NOT   GIVEN ',[38],third).status,'correct');
 assert.equal(reviewAnswer('biodiversity',[20],third).status,'correct');
 assert.equal(reviewAnswer('NO',[40],third).status,'incorrect');
 for(const v of ['habitat','habitats',' HABITATS '])assert.equal(reviewAnswer(v,[10],fourth).status,'correct');
 assert.equal(reviewAnswer('the habitat',[10],fourth).status,'incorrect');
 assert.equal(reviewAnswer('',[10],fourth).status,'blank');
 assert.equal(reviewAnswer('EGALITARIANISM',[31],fourth).status,'correct');
});

test('Cambridge 20 Test 2 matches imported question ranges and separates choose-two pairs', () => {
 const key=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-20-2'];
 assert.equal(Object.keys(key.answers).length,40);
 assert.deepEqual(Object.values(key.parts).map(p=>p.questionNumbers.length),[13,13,14]);
 assert.equal(reviewAnswer(' FLIPPERS ',[2],key).status,'correct');
 assert.equal(reviewAnswer('NOT   GIVEN',[8],key).status,'correct');
 assert.equal(reviewAnswer('flipper',[2],key).status,'incorrect');
 assert.equal(reviewAnswer('',[2],key).status,'blank');
 for(const [nums,pair] of [[[23,24],['A','C']],[[25,26],['A','E']]]){
  for(const v of [pair,[...pair].reverse()])assert.equal(reviewAnswer(v,nums,key,true).status,'correct');
  for(const v of [[pair[0]],[pair[0],pair[0]]])assert.equal(reviewAnswer(v,nums,key,true).status,'incorrect');
 }
 assert.equal(reviewAnswer(['A','E'],[23,24],key,true).status,'incorrect');
 assert.equal(reviewAnswer(['A','C'],[25,26],key,true).status,'incorrect');
});

test('Cambridge 20 Test 1 stores expanded truth labels and the corrected NO transcription', () => {
 const key=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-20-1'];
 assert.equal(Object.keys(key.answers).length,40);
 assert.deepEqual(Object.values(key.parts).map(p=>p.questionNumbers.length),[13,13,14]);
 assert.equal(reviewAnswer('false',[1],key).status,'correct');
 assert.equal(reviewAnswer('TRUE',[5],key).status,'correct');
 assert.equal(reviewAnswer(' BULBS ',[7],key).status,'correct');
 assert.equal(reviewAnswer('1980',[11],key).status,'correct');
 assert.equal(reviewAnswer('NO',[38],key).status,'correct');
 assert.equal(reviewAnswer('YES',[38],key).status,'incorrect');
 assert.equal(reviewAnswer('',[38],key).status,'blank');
});

test('Cambridge 20 Test 3 preserves spelling variants and separate choose-two groups', () => {
 const key=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-20-3'];
 assert.equal(Object.keys(key.answers).length,40);
 assert.deepEqual(Object.values(key.parts).map(p=>p.questionNumbers.length),[13,13,14]);
 assert.equal(reviewAnswer(' POTATOES ',[1],key).status,'correct');
 assert.equal(reviewAnswer('VII',[17],key).status,'correct');
 for(const v of ['colour','color'])assert.equal(reviewAnswer(v,[26],key).status,'correct');
 assert.equal(reviewAnswer('colours',[26],key).status,'incorrect');
 assert.equal(reviewAnswer('',[26],key).status,'blank');
 for(const [nums,pair] of [[[20,21],['C','E']],[[22,23],['B','D']]]){
  for(const v of [pair,[...pair].reverse()])assert.equal(reviewAnswer(v,nums,key,true).status,'correct');
  for(const v of [[pair[0]],[pair[0],pair[0]]])assert.equal(reviewAnswer(v,nums,key,true).status,'incorrect');
 }
 assert.equal(reviewAnswer(['B','D'],[20,21],key,true).status,'incorrect');
 assert.equal(reviewAnswer(['C','E'],[22,23],key,true).status,'incorrect');
});

test('Cambridge 20 Test 4 is complete and checks words without case sensitivity', () => {
 const key=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-20-4'];
 assert.equal(Object.keys(key.answers).length,40);
 assert.deepEqual(Object.values(key.parts).map(p=>p.questionNumbers.length),[13,13,14]);
 for(const [n,v] of [[1,'TEACHER'],[18,' Pumps '],[37,'Jackals'],[40,'FOXES']])assert.equal(reviewAnswer(v,[n],key).status,'correct');
 assert.equal(reviewAnswer('NOT   GIVEN',[12],key).status,'correct');
 assert.equal(reviewAnswer('fox',[40],key).status,'incorrect');
 assert.equal(reviewAnswer('',[40],key).status,'blank');
});

test('Cambridge 21 Test 1 is complete and preserves supplied answer spellings', () => {
 const key=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-21-1'];
 assert.equal(Object.keys(key.answers).length,40);
 assert.deepEqual(Object.values(key.parts).map(p=>p.questionNumbers.length),[13,13,14]);
 for(const [n,v] of [[1,' MINING '],[5,'venice'],[19,'QUESTIONNAIRE'],[20,'wellbeing']])assert.equal(reviewAnswer(v,[n],key).status,'correct');
 assert.equal(reviewAnswer('NOT   GIVEN',[38],key).status,'correct');
 assert.equal(reviewAnswer('YES',[39],key).status,'incorrect');
 assert.equal(reviewAnswer('',[20],key).status,'blank');
});

test('Cambridge 21 Test 2 accepts both jewellery spellings and the unordered gold pair', () => {
 const key=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-21-2'];
 assert.equal(Object.keys(key.answers).length,40);
 assert.deepEqual(Object.values(key.parts).map(p=>p.questionNumbers.length),[13,13,14]);
 for(const v of ['jewellery','jewelry',' JEWELRY '])assert.equal(reviewAnswer(v,[26],key).status,'correct');
 for(const v of [['B','D'],['d','b']])assert.equal(reviewAnswer(v,[20,21],key,true).status,'correct');
 for(const v of [['B'],['B','B'],['A','D']])assert.equal(reviewAnswer(v,[20,21],key,true).status,'incorrect');
 assert.equal(reviewAnswer([],[20,21],key,true).status,'blank');
 assert.equal(reviewAnswer('NOT   GIVEN',[37],key).status,'correct');
 assert.equal(reviewAnswer('rat',[1],key).status,'incorrect');
});

test('Cambridge 21 Test 3 covers all parts and keeps supplied word forms', () => {
 const key=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-21-3'];
 assert.equal(Object.keys(key.answers).length,40);
 assert.deepEqual(Object.values(key.parts).map(p=>p.questionNumbers.length),[13,13,14]);
 for(const [n,v] of [[1,' DUST '],[21,'WHEELCHAIRS'],[24,'smartcards'],[40,'no']])assert.equal(reviewAnswer(v,[n],key).status,'correct');
 assert.equal(reviewAnswer('NOT   GIVEN',[14],key).status,'correct');
 assert.equal(reviewAnswer('wheelchair',[21],key).status,'incorrect');
 assert.equal(reviewAnswer('',[21],key).status,'blank');
});

test('Cambridge 21 Test 4 preserves both fermentation alternatives', () => {
 const key=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['reading-21-4'];
 assert.equal(Object.keys(key.answers).length,40);
 assert.deepEqual(Object.values(key.parts).map(p=>p.questionNumbers.length),[13,13,14]);
 for(const v of ['fermentation','fermentation process',' FERMENTATION   PROCESS '])assert.equal(reviewAnswer(v,[9],key).status,'correct');
 assert.equal(reviewAnswer('COW DUNG',[8],key).status,'correct');
 assert.equal(reviewAnswer('process',[9],key).status,'incorrect');
 assert.equal(reviewAnswer('',[9],key).status,'blank');
});

test('Cambridge 1 Listening Test 1 preserves 41 answers, alternatives and unordered headlines', () => {
 const key=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['listening-1-1'];
 assert.equal(Object.keys(key.answers).length,41);
 assert.deepEqual(Object.values(key.parts).map(p=>p.questionNumbers.length),[10,11,10,10]);
 for(const n of [14,15,17,18,21,26,28,29,31,34,35])for(const v of key.answers[n])assert.equal(reviewAnswer(` ${v.toUpperCase()} `,[n],key).status,'correct');
 for(const v of [['E','F','H'],['H','E','F'],['F','H','E'],['E','H','F'],['F','E','H'],['H','F','E']])assert.equal(reviewAnswer(v,[11,12,13],key,true).status,'correct');
 for(const v of [['E','F'],['E','E','H'],['E','F','G']])assert.equal(reviewAnswer(v,[11,12,13],key,true).status,'incorrect');
 assert.equal(reviewAnswer([],[11,12,13],key,true).status,'blank');
 assert.equal(reviewAnswer('a',[41],key).status,'correct');
 assert.equal(reviewAnswer('economics',[34],key).status,'incorrect');
});

test('Cambridge 2 and 3 Listening Test 1 retain all supplied alternatives and independent groups', () => {
 const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 for(const [book,count,sizes] of [[2,40,[10,10,10,10]],[3,41,[10,11,10,10]]]){
  const key=keys[`listening-${book}-1`];
  assert.equal(Object.keys(key.answers).length,count);
  assert.deepEqual(Object.values(key.parts).map(p=>p.questionNumbers.length),sizes);
  for(const [n,accepted] of Object.entries(key.answers)){
   if(Object.values(key.parts).some(p=>p.groups.some(g=>g.questions.includes(+n))))continue;
   for(const v of accepted)assert.equal(reviewAnswer(` ${v.toUpperCase()} `,[+n],key).status,'correct');
  }
 }
 for(const [book,nums,pair] of [[2,[6,7,8],['B','D','F']],[2,[16,17,18],['B','C','E']],[2,[19,20],['B','D']],[3,[19,20],['B','E']]]){
  const key=keys[`listening-${book}-1`];
  for(const v of [pair,[...pair].reverse()])assert.equal(reviewAnswer(v,nums,key,true).status,'correct');
  assert.equal(reviewAnswer(pair.slice(1),nums,key,true).status,'incorrect');
  assert.equal(reviewAnswer(pair.map(()=>pair[0]),nums,key,true).status,'incorrect');
  assert.equal(reviewAnswer([],nums,key,true).status,'blank');
 }
 assert.equal(reviewAnswer(['B','D'],[19,20],keys['listening-3-1'],true).status,'incorrect');
 assert.equal(reviewAnswer('the garden',[3],keys['listening-3-1']).status,'incorrect');
});

test('Cambridge 1 Listening Test 2 preserves optional phrases and explicitly rejected wording', () => {
 const key=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['listening-1-2'];
 assert.equal(Object.keys(key.answers).length,41);
 assert.deepEqual(Object.values(key.parts).map(p=>p.questionNumbers.length),[10,10,12,9]);
 for(const n of [3,4,9,14,15,18,28,30,37,38,39,40,41])for(const v of key.answers[n])assert.equal(reviewAnswer(` ${v.toUpperCase()} `,[n],key).status,'correct');
 assert.equal(reviewAnswer('lonely',[3],key).status,'incorrect');
 assert.equal(reviewAnswer('town ridding',[15],key).status,'incorrect');
 for(const v of [['C','D'],['d','c']])assert.equal(reviewAnswer(v,[31,32],key,true).status,'correct');
 for(const v of [['C'],['C','C'],['B','D']])assert.equal(reviewAnswer(v,[31,32],key,true).status,'incorrect');
 assert.equal(reviewAnswer([],[31,32],key,true).status,'blank');
});

test('Cambridge 1 Listening Test 3 preserves 42 answers and optional wording without case penalties', () => {
 const key=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['listening-1-3'];
 assert.equal(Object.keys(key.answers).length,42);
 assert.deepEqual(Object.values(key.parts).map(p=>p.questionNumbers.length),[12,11,9,10]);
 for(const n of [12,14,17,21,28,29,30,31,33,34,35,37,38,39])for(const v of key.answers[n])assert.equal(reviewAnswer(` ${v.toUpperCase()} `,[n],key).status,'correct');
 for(const [n,v] of [[5,'richard lee'],[6,'30 enmore road'],[7,'newport'],[36,'spaceman'],[42,'CHOCOLATES']])assert.equal(reviewAnswer(v,[n],key).status,'correct');
 assert.equal(reviewAnswer('Richard Leigh',[5],key).status,'incorrect');
 assert.equal(reviewAnswer('sea',[20],key).status,'incorrect');
 assert.equal(reviewAnswer('',[42],key).status,'blank');
});

test('Cambridge 1 Listening Test 4 retains mandatory wording and supplied variants', () => {
 const key=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['listening-1-4'];
 for(const n of [9,16,18,20,28,33,36,38,39,41,42])for(const v of key.answers[n])assert.equal(reviewAnswer(` ${v.toUpperCase()} `,[n],key).status,'correct');
 assert.equal(reviewAnswer('',[9],key).status,'blank');
 assert.equal(reviewAnswer('law',[10],key).status,'incorrect');
 assert.equal(reviewAnswer('first year law',[10],key).status,'correct');
 assert.equal(reviewAnswer('julia perkins',[6],key).status,'correct');
 assert.equal(reviewAnswer('flang',[29],key).status,'incorrect');
});

test('Cambridge 1 Listening Test 4 Q21 accepts complete times and has no duplicated suffix', () => {
 const key=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['listening-1-4'];
 assert.equal(Object.keys(key.answers).length,42);
 for(const v of ['4.30 pm to 5 pm','4.30 pm or 5 pm'])assert.equal(reviewAnswer(v,[21],key).status,'correct');
 for(const v of ['4.30 pm','5 pm'])assert.equal(reviewAnswer(v,[21],key).status,'incorrect');
 const data=JSON.parse(readFileSync(new URL('../public/cambridge/listening-1-4.json',import.meta.url)));
 assert.ok(data.parts[1].questions.includes('name="ielts_listening_answer_3167509_9"'));
 assert.ok(!data.parts[1].questions.includes('</span> or 5 pm during the week.'));
});

test('Cambridge 2 Listening Tests 2 and 4 preserve required components and unordered variants', () => {
 const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 const a=keys['listening-2-2'],b=keys['listening-2-4'];
 assert.equal(Object.keys(a.answers).length,40);
 for(const [n,v] of [[34,'cool and wet'],[35,'wool timber'],[38,'warm wet']])assert.equal(reviewAnswer(v,[n],a).status,'correct');
 for(const [n,v] of [[34,'cool'],[35,'wool'],[38,'wet'],[6,'184 monthly']])assert.equal(reviewAnswer(v,[n],a).status,'incorrect');
 assert.equal(reviewAnswer('the balconys',[18],a).status,'correct');
 assert.equal(reviewAnswer(['long trousers','walking boots','socks'],[16,17,18],b,true).status,'correct');
 assert.equal(reviewAnswer(['plants','poisonous snakes'],[19,20],b,true).status,'correct');
 assert.equal(reviewAnswer(['plants','plants'],[19,20],b,true).status,'incorrect');
 assert.equal(reviewAnswer('check over your errors',[26],b).status,'correct');
});

test('Cambridge 2 Listening Test 3 mapping and Test 4 full time range are complete', () => {
 const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 const a=keys['listening-2-3'],b=keys['listening-2-4'];
 assert.equal(Object.keys(a.answers).length,43);assert.equal(Object.keys(b.answers).length,40);
 for(const [nums,set] of [[[5,6],['E','A']],[[7,8],['C','A']],[[9,10],['E','C']],[[14,15,16,17],['G','E','C','A']],[[18,19],['E','B']],[[41,42,43],['E','D','B']]]){
  assert.equal(reviewAnswer(set,nums,a,true).status,'correct');
  assert.equal(reviewAnswer(set.slice(1),nums,a,true).status,'incorrect');
 }
 assert.equal(reviewAnswer('research',[26],a).status,'incorrect');
 assert.equal(reviewAnswer('research methods',[26],a).status,'correct');
 assert.equal(reviewAnswer('18,000 - 20,000',[25],a).status,'correct');
 assert.equal(reviewAnswer('20,000',[25],a).status,'incorrect');
 for(const v of b.answers[10])assert.equal(reviewAnswer(v,[10],b).status,'correct');
 assert.equal(reviewAnswer('5 pm',[10],b).status,'incorrect');
});

test('Cambridge 3 Listening additions preserve required words, groups and unresolved keys', () => {
 const k=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 const a=k['listening-3-2'],b=k['listening-3-3'],c=k['listening-3-4'];
 assert.equal(Object.keys(a.answers).length,40);assert.equal(Object.keys(c.answers).length,40);assert.equal(Object.keys(b.answers).length,40);
 for(const [n,v] of [[1,'Hall'],[13,'essay'],[29,'expert'],[34,'side'],[37,'white brown']])assert.equal(reviewAnswer(v,[n],a).status,'incorrect');
 assert.equal(reviewAnswer('2/3',[28],a).status,'correct');
 assert.equal(reviewAnswer(['army','ancient Chinese'],[26,27],a,true).status,'correct');
 assert.equal(reviewAnswer('white grey brown',[37],a).status,'correct');
 assert.equal(reviewAnswer('7.30 to 5.30',[31],c).status,'incorrect');
 assert.equal(reviewAnswer('25,000',[34],c).status,'incorrect');
 assert.equal(reviewAnswer('$25,000',[34],c).status,'correct');
 for(const n of [8,9,10,15,24,28,29,34,35,38])assert.equal(reviewAnswer('anything',[n],b).status,'incorrect');
});

test('Cambridge 3 Listening Test 3 verified corrections reject transcription errors', () => {
 const k=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)))['listening-3-3'];
 for(const [n,v] of [[1,'Rajdoot'],[6,'lentil curry'],[11,'9.50'],[15,'book'],[21,'Anne Rea'],[22,'16'],[24,'2.5'],[28,'electrics'],[29,'in plastic'],[30,'1 July'],[33,'beef'],[38,'C']])assert.equal(reviewAnswer(v,[n],k).status,'correct');
 for(const [n,v] of [[1,'Radisson'],[6,'lentil soup'],[11,'20'],[22,'18'],[28,'electric'],[29,'pieces'],[38,'B']])assert.equal(reviewAnswer(v,[n],k).status,'incorrect');
 assert.equal(reviewAnswer(['cheap','safe for children','educational'],[25,26,27],k,true).status,'correct');
 assert.equal(reviewAnswer(['cheap','cheap','educational'],[25,26,27],k,true).status,'incorrect');
});

test('Cambridge 4 Listening keys cover all slots and preserve combined answers', () => {
 const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 for(const [t,total] of [[1,40],[2,40],[3,42],[4,40]])assert.equal(Object.keys(keys[`listening-4-${t}`].answers).length,total);
 for(const [t,ns,v] of [[2,[25,26],['C','B']],[2,[39,40],['E','D']],[3,[38,39],['F','D']],[3,[41,42],['C','A']],[4,[39,40],['E','B']]]){
 const k=keys[`listening-4-${t}`];assert.equal(reviewAnswer(v,ns,k,true).status,'correct');assert.equal(reviewAnswer([v[0],v[0]],ns,k,true).status,'incorrect');}
 assert.equal(reviewAnswer('coal',[11],keys['listening-4-1']).status,'incorrect');
 assert.equal(reviewAnswer('coal, firewood',[11],keys['listening-4-1']).status,'correct');
 assert.equal(reviewAnswer('traffic parking',[35],keys['listening-4-3']).status,'correct');
 assert.equal(reviewAnswer('1-1/2 years',[1],keys['listening-4-3']).status,'correct');
 assert.equal(reviewAnswer('3,000 - 4,000',[24],keys['listening-4-2']).status,'correct');
 assert.equal(reviewAnswer('WHITE LIGHT',[26],keys['listening-4-4']).status,'correct');
});

test('Cambridge 5 Listening Tests 1 and 2 use verified corrections and unordered groups', () => {
 const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 const a=keys['listening-5-1'],b=keys['listening-5-2'];
 for(const k of [a,b])assert.equal(Object.keys(k.answers).length,40);
 for(const [n,v] of [[8,'14'],[9,'20%'],[10,'39745t']])assert.equal(reviewAnswer(v,[n],a).status,'correct');
 assert.equal(reviewAnswer('50',[10],a).status,'incorrect');
 for(const [nums,set] of [[[5,6],['D','B']],[[24,25],['D','B']]])assert.equal(reviewAnswer(set,nums,a,true).status,'correct');
 for(const [n,v] of [[13,'A'],[14,'C'],[16,'£75,000'],[17,'COMPUTERS'],[26,'persuading'],[37,'3,500'],[38,'ocean currents'],[39,'the pollution'],[40,'young']])assert.equal(reviewAnswer(v,[n],b).status,'correct');
 assert.equal(reviewAnswer(['F','C','E'],[18,19,20],b,true).status,'correct');
 assert.equal(reviewAnswer(['C','C','E'],[18,19,20],b,true).status,'incorrect');
 assert.equal(reviewAnswer('B',[14],b).status,'incorrect');
 assert.equal(reviewAnswer('UI',[38],b).status,'incorrect');
 assert.equal(reviewAnswer('',[37],b).status,'blank');
});

test('Cambridge 5 Listening Tests 3 and 4 use linked verified keys for changed sections', () => {
 const keys=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 const a=keys['listening-5-3'],b=keys['listening-5-4'];
 for(const k of [a,b])assert.equal(Object.keys(k.answers).length,40);
 assert.equal(reviewAnswer(['E','C'],[11,12],a,true).status,'correct');
 assert.equal(reviewAnswer(['C','C'],[11,12],a,true).status,'incorrect');
 for(const [n,v] of [[13,'references'],[21,'5th May'],[25,'the 2nd half'],[30,'support for students']])assert.equal(reviewAnswer(v,[n],a).status,'correct');
 assert.equal(reviewAnswer('placement',[21],a).status,'incorrect');
 for(const [n,v] of [[2,'between 9 and 9.30'],[19,'send out newsletters'],[20,'supervise teams'],[28,'C'],[30,'D'],[31,'B'],[40,'C']])assert.equal(reviewAnswer(v,[n],b).status,'correct');
 assert.equal(reviewAnswer('B',[19],b).status,'incorrect');
 assert.equal(reviewAnswer('individual',[31],b).status,'incorrect');
});

test('Cambridge 6 Listening keys handle printed context, corrected year and unordered groups', () => {
 const k=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 for(let t=1;t<=4;t++)assert.equal(Object.keys(k[`listening-6-${t}`].answers).length,40);
 for(const [t,n,v] of [[1,19,'Thursday'],[1,32,'leather'],[1,34,'ships'],[2,28,'2000'],[3,2,'1973'],[3,7,'mother'],[3,36,'sand'],[4,27,'7 working days']])assert.equal(reviewAnswer(v,[n],k[`listening-6-${t}`]).status,'correct');
 for(const [t,n,v] of [[1,32,'metal'],[2,28,'200'],[3,7,'month'],[3,36,'water sand'],[4,27,'working days']])assert.equal(reviewAnswer(v,[n],k[`listening-6-${t}`]).status,'incorrect');
 for(const [t,nums,set] of [[1,[26,27],['printers','laptops']],[1,[38,39,40],['F','C','E']],[2,[18,19,20],['G','D','C']],[4,[28,29,30],['F','E','C']]]){
 assert.equal(reviewAnswer(set,nums,k[`listening-6-${t}`],true).status,'correct');assert.equal(reviewAnswer(set.slice(1),nums,k[`listening-6-${t}`],true).status,'incorrect');}
});

test('Cambridge 7 Listening preserves verified corrections and independent pairs', () => {
 const k=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 for(let t=1;t<=4;t++)assert.equal(Object.keys(k[`listening-7-${t}`].answers).length,40);
 for(const [t,n,v] of [[2,6,'Paynter'],[2,18,'7 screen'],[3,1,'business'],[3,9,'answer the phone'],[3,21,'cigar'],[3,36,'kitchen'],[4,2,'JO6337'],[4,21,'5'],[4,37,'new taste']])assert.equal(reviewAnswer(v,[n],k[`listening-7-${t}`]).status,'correct');
 for(const [t,n,v] of [[2,6,'Painter'],[2,18,'screen'],[3,21,'radar'],[4,37,'FDA']])assert.equal(reviewAnswer(v,[n],k[`listening-7-${t}`]).status,'incorrect');
 for(const [t,nums,set] of [[2,[29,30],['D','A']],[4,[35,36],['cheese','meat']]]){
 assert.equal(reviewAnswer(set,nums,k[`listening-7-${t}`],true).status,'correct');assert.equal(reviewAnswer([set[0],set[0]],nums,k[`listening-7-${t}`],true).status,'incorrect');}
});

test('Cambridge 8 Listening verified keys preserve numbering and independent groups', () => {
 const k=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 for(let t=1;t<=4;t++)assert.equal(Object.keys(k[`listening-8-${t}`].answers).length,40);
 for(const [t,n,v] of [[1,4,'WS6 2YH'],[1,7,'pianist'],[1,21,'A'],[2,25,'insects'],[2,29,'wings'],[3,18,'Three Lives'],[3,36,'safety'],[4,34,'A'],[4,29,'small tasks']])assert.equal(reviewAnswer(v,[n],k[`listening-8-${t}`]).status,'correct');
 for(const [t,n,v] of [[1,7,'peanut'],[2,25,'scouts'],[3,18,'3'],[4,34,'sense of smell']])assert.equal(reviewAnswer(v,[n],k[`listening-8-${t}`]).status,'incorrect');
 for(const [t,nums,set] of [[1,[16,17,18],['G','F','C']],[1,[19,20],['E','B']],[1,[25,26,27],['F','B','C']],[3,[9,10],['E','B']],[4,[21,22],['E','B']],[4,[23,24],['C','A']]]){
 assert.equal(reviewAnswer(set,nums,k[`listening-8-${t}`],true).status,'correct');assert.equal(reviewAnswer(set.slice(1),nums,k[`listening-8-${t}`],true).status,'incorrect');}
 assert.equal(reviewAnswer('horses',[28],k['listening-8-1']).status,'incorrect');
 assert.equal(reviewAnswer('12,000',[29],k['listening-8-1']).status,'incorrect');
});

test('Cambridge 9 Listening verified keys preserve printed context and reject transcription errors', () => {
 const k=JSON.parse(readFileSync(new URL('../src/data/cambridge-answer-keys.json',import.meta.url)));
 for(let t=1;t<=4;t++)assert.equal(Object.keys(k[`listening-9-${t}`].answers).length,40);
 for(const [t,n,v] of [[1,2,'Hillsdunne Road'],[1,7,'clear voice'],[1,33,'plants'],[2,6,'bedsit'],[2,12,'Friday'],[2,34,'risks'],[3,10,'Ludlow'],[3,29,'three times'],[3,33,'glass'],[4,1,'babies'],[4,38,'predators']])assert.equal(reviewAnswer(v,[n],k[`listening-9-${t}`]).status,'correct');
 for(const [t,n,v] of [[1,21,'D'],[2,12,'Sunday'],[3,33,'B'],[4,38,'pesticides']])assert.equal(reviewAnswer(v,[n],k[`listening-9-${t}`]).status,'incorrect');
 for(const [t,nums,set] of [[1,[19,20],['E','A']],[4,[5,6],['E','B']]]){assert.equal(reviewAnswer(set,nums,k[`listening-9-${t}`],true).status,'correct');assert.equal(reviewAnswer([set[0],set[0]],nums,k[`listening-9-${t}`],true).status,'incorrect');}
});
