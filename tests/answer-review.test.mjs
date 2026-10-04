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
    "pending",
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
  assert.equal(reviewAnswer("anything", [14], second).status, "pending");
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
