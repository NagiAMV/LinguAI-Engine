const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildSmartEvaluationPrompt,
  parseStructuredFeedback,
} = require("../src/lib/ai-evaluation.js");

test("buildSmartEvaluationPrompt includes IELTS criteria for writing", () => {
  const prompt = buildSmartEvaluationPrompt("writing", "My essay...", "Task 2");
  assert.match(
    prompt,
    /Task Response|Coherence and Cohesion|Grammar|Lexical Resource|Spelling/,
  );
});

test("buildSmartEvaluationPrompt uses speaking criteria with examiner-style names", () => {
  const prompt = buildSmartEvaluationPrompt(
    "speaking",
    "I think it is important to...",
    "Part 2",
  );
  assert.match(
    prompt,
    /Fluency and Coherence|Lexical Resource|Grammatical Range and Accuracy|Pronunciation/,
  );
  assert.doesNotMatch(prompt, /Fluency and coherence/);
});

test("parseStructuredFeedback extracts JSON from markdown wrappers", () => {
  const parsed = parseStructuredFeedback(
    '```json\n{"bandScore":7.5,"summary":"Good"}\n```',
  );
  assert.equal(parsed.bandScore, 7.5);
  assert.equal(parsed.summary, "Good");
});
