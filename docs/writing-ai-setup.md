# Activating Writing AI review

1. Choose a provider and a model that supports JSON responses. Set AI_PROVIDER to openai, gemini or ollama.
2. In the server .env.local (or deployment secret settings), set the matching OPENAI_API_KEY / GEMINI_API_KEY and OPENAI_MODEL / GEMINI_MODEL. Ollama needs OLLAMA_MODEL and optionally OLLAMA_BASE_URL. Never prefix these with NEXT_PUBLIC_ and never commit keys.
3. Set a provider-side spending limit or alerts before activation. Then set AI_REVIEW_ENABLED=true and restart the server. Reload Writing to refresh readiness.
4. Submit one known essay and inspect the feedback in the selected language. Automated tests use mock responses; live model quality has not been verified.

Defaults: 12,000 response characters, 6,000 task characters, 64 KB request body, 2 simultaneous reviews, 30 provider requests per UTC day per server process, 2,400 output tokens, 60-second timeout. Change the latter three using AI_REVIEW_DAILY_LIMIT, AI_REVIEW_MAX_OUTPUT_TOKENS and AI_REVIEW_TIMEOUT_MS. Invalid settings fall back to defaults. A failed provider request also counts toward the daily cap; there are no automatic retries.

The in-memory cap resets when the server restarts and is separate for each server process. It is not a monetary billing limit or authenticated per-user quota. Before opening paid review to public traffic, add authenticated quotas in shared storage and deployment-level rate limiting. Aborting a browser request or reaching a timeout does not guarantee the provider stops billing.

GET /api/ai/evaluate exposes only readiness, never keys. Readiness checks configuration presence; it does not verify credentials or credit. POST stays disabled until activated. Drafts remain local to the browser. On request, the task and essay are sent to the selected provider; private planning notes are not sent.

Writing feedback uses four criteria, Task Achievement for Task 1 and Task Response for Task 2. Scores are practice estimates. Incomplete, truncated or malformed feedback and corrections quoting text absent from the essay are rejected. Prompt instructions reduce but cannot eliminate model errors or prompt injection.

OpenAI integration uses Chat Completions with JSON mode and max_completion_tokens. Configure a compatible model; no model is silently substituted. Reference: https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create

Run offline checks: node --test tests/ai-evaluation.test.js tests/ai-review-service.test.js
