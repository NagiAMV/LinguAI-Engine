# Activating Writing AI review

1. Choose a provider and a model that supports JSON responses. Set AI_PROVIDER to groq, openai, gemini or ollama.
2. In the server .env.local (or deployment secret settings), set the matching OPENAI_API_KEY / GEMINI_API_KEY and OPENAI_MODEL / GEMINI_MODEL. Ollama needs OLLAMA_MODEL and optionally OLLAMA_BASE_URL. Never prefix these with NEXT_PUBLIC_ and never commit keys.
   Groq uses GROQ_API_KEY and GROQ_MODEL (tested with openai/gpt-oss-120b on Groq). Its endpoint is fixed to https://api.groq.com/openai/v1/chat/completions; this does not send requests to OpenAI. GPT OSS requests use low reasoning effort. Availability is checked against the actual account during setup; there is no silent model fallback. API reference: https://console.groq.com/docs/api-reference
3. Set a provider-side spending limit or alerts before activation. Then set AI_REVIEW_ENABLED=true and restart the server. Reload Writing to refresh readiness.
4. Submit one known essay and inspect the feedback in the selected language. Automated tests use mock responses; live model quality has not been verified.

Defaults: 12,000 response characters, 6,000 task characters, 64 KB request body, 2 simultaneous reviews, 30 provider requests per UTC day per server process, 2,400 output tokens, 60-second timeout. Change the latter three using AI_REVIEW_DAILY_LIMIT, AI_REVIEW_MAX_OUTPUT_TOKENS and AI_REVIEW_TIMEOUT_MS. Invalid settings fall back to defaults. A failed provider request also counts toward the daily cap; there are no automatic retries.

The in-memory cap resets when the server restarts and is separate for each server process. It is not a monetary billing limit or authenticated per-user quota. Before opening paid review to public traffic, add authenticated quotas in shared storage and deployment-level rate limiting. Aborting a browser request or reaching a timeout does not guarantee the provider stops billing.

GET /api/ai/evaluate exposes only readiness, never keys. Readiness checks configuration presence; it does not verify credentials or credit. POST stays disabled until activated. Drafts remain local to the browser. On request, the task and essay are sent to the selected provider; private planning notes are not sent.

Writing feedback uses four criteria, Task Achievement for Task 1 and Task Response for Task 2. Scores are practice estimates. Incomplete, truncated or malformed feedback and corrections quoting text absent from the essay are rejected. Prompt instructions reduce but cannot eliminate model errors or prompt injection.

OpenAI integration uses Chat Completions with JSON mode and max_completion_tokens. Configure a compatible model; no model is silently substituted. Reference: https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create

Run offline checks: node --test tests/ai-evaluation.test.js tests/ai-review-service.test.js

## Writing studio

- 74 original prompts: 60 Task 2 essays, eight Task 1 tables, and six chart/map/process tasks. All graphical source data is fictional and included as text in the AI review request.
- Training Mode has no timer, includes private planning notes and structure hints, and allows feedback while writing.
- Exam Mode runs 20 minutes for Task 1, 40 for Task 2, or 60 for a chosen pair. One absolute deadline is saved; changing task or reloading does not reset it. Expiry or submission locks the answer. Exam text disables browser spellcheck/autocorrect; browser extensions remain outside site control.
- Feedback includes four criterion comments and numeric bands, exact quoted corrections, three next steps and an expandable English revision. Missing or invalid provider output is rejected. These are AI practice estimates, not official examiner scores.
- A full-session estimate appears only when both tasks have reviews; Task 2 has double weight and the combined estimate is rounded to a half band.
- “Rewrite” archives the current attempt and its reviews, with a choice to keep the text or start blank. Up to 12 previous attempts per task/pair are kept on this device. Existing writing-v2 drafts are imported without deleting them. Notes and essay text are scoped to the signed-in account or guest on this browser; Writing versions are not synced to cloud storage.
- The library shows draft/completed status and filters by task, question type, topic and progress. Layout, text size and a dark Writing desk are available while practising.

Local activation does not update deployment secrets. Set the same server-only variables in hosting settings and redeploy/restart when publishing. Rotate any key pasted in chat or exposed elsewhere. No secret values belong in this document.

Verification (November 2026): real Groq Task 1 and Task 2 responses covered all four criterion bands, corrections, a revision and three next steps. Russian Task 1 feedback and English Task 2 feedback were checked. Case-only quotation differences are restored to the exact essay spelling; fabricated quotations are still rejected. Groq GPT OSS uses strict JSON schema output. This is an integration smoke test, not a calibration study of IELTS score accuracy. Browser regression checks reuse a saved response as a local fixture, without additional provider requests.

Timing and weighting follow the [British Council Writing format](https://takeielts.britishcouncil.org/what-is-ielts/how-it-works/test-format/writing). The 20/40 split is a practice allocation; the full exam keeps a single shared 60-minute clock and lets the learner switch freely between tasks.

Session regression tests: node --test tests/writing-session.test.mjs tests/ai-review-service.test.js tests/ai-evaluation.test.js
