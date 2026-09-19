function buildSmartEvaluationPrompt(mode, submission, task = "") {
  const normalizedMode = String(mode || "writing").toLowerCase();
  const criteria = {
    writing: [
      "Task Response",
      "Coherence and Cohesion",
      "Lexical Resource",
      "Grammar Range and Accuracy",
      "Spelling and punctuation",
    ],
    speaking: [
      "Fluency and Coherence",
      "Lexical Resource",
      "Grammatical Range and Accuracy",
      "Pronunciation",
      "Interaction and Development of Ideas",
    ],
  };

  const list = criteria[normalizedMode] || criteria.writing;
  const isSpeaking = normalizedMode === "speaking";

  const criteriaObject = isSpeaking
    ? `{
    "Fluency and Coherence": "short feedback string",
    "Lexical Resource": "short feedback string",
    "Grammatical Range and Accuracy": "short feedback string",
    "Pronunciation": "short feedback string",
    "Interaction and Development of Ideas": "short feedback string"
  }`
    : `{
    "Task Response": "short feedback string",
    "Coherence and Cohesion": "short feedback string",
    "Lexical Resource": "short feedback string",
    "Grammar Range and Accuracy": "short feedback string",
    "Spelling and punctuation": "short feedback string"
  }`;

  return `You are a senior IELTS examiner and elite coach. Evaluate the text as if it were a real IELTS ${normalizedMode} response.

Return ONLY valid JSON with this exact structure:
{
  "bandScore": number,
  "summary": "string",
  "strengths": ["string", "string"],
  "improvements": ["string", "string"],
  "criteria": ${criteriaObject},
  "corrections": [
    { "original": "string", "corrected": "string", "explanation": "string" }
  ],
  "nextSteps": ["string", "string"]
}

Important rules:
- Judge fairly and do not invent missing evidence.
- Keep the feedback specific and actionable.
- If the answer is short or weak, reflect that honestly.
- Focus on the most important weaknesses and priority improvements.
- For speaking, treat the transcript as a spoken response and assess clarity, fluency, coherence, grammar, vocabulary, pronunciation, and interaction.
- For writing, assess the criteria: ${list.join(", ")}.
- Use the criterion labels shown in the JSON schema exactly as written.

Task:
${task || "No task provided."}

Submission:
${submission}`;
}

function parseStructuredFeedback(content) {
  if (!content || typeof content !== "string") {
    throw new Error("AI response was empty");
  }

  const trimmed = content.trim();
  const cleaned = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonBlock = cleaned.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonBlock) {
      throw new Error("AI response was not valid JSON");
    }
    return JSON.parse(jsonBlock);
  }
}

module.exports = {
  buildSmartEvaluationPrompt,
  parseStructuredFeedback,
};
