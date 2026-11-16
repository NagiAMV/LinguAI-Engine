# Personal study recommendations

Overview now has result-based suggestions for all four skills and an explicitly requested AI plan. AI generation is enabled locally with the existing server-only Groq configuration and AI_COACH_ENABLED=true. Public hosting must configure its own server environment and restart/redeploy; local configuration does not update a hosted site.

## Learner flow

Choose 15, 30, 45 or 60 minutes and English, Russian or Uzbek, then request a plan. The server requires exactly three steps of at least five minutes, with the total no greater than the selected budget. Numeric duration instructions inside action prose are rejected to prevent conflicts with the displayed allocations. Short Writing activities should be planning/revising a paragraph, not completing an entire essay in an unrealistic time.

Plans, language/time preferences and completion checkboxes are saved on this device, separately for each owner. An unchanged current plan cannot be regenerated accidentally. A changed local day, result summary or setting marks a plan stale and enables updating it; updates are explicit, not automatic provider requests. Cached plans keep their original validated task links, even when a newer result changes the next suggested task. Failed or cancelled requests preserve the previous plan. Checking a step does not invent practice time or add an exam result.

There is always a result-based fallback for Listening, Reading, Writing and Speaking. Links open actual single sections/passages, a selected Writing topic, or the selected Speaking set/part. Pending drafts and recordings are prioritised where appropriate. Direct task links still present the normal mode choice and do not silently start an exam or microphone.

## Data used

- Latest retakes replace older attempts for the same Reading/Listening paper. Part-level accuracy and blanks use up to five recent results per part.
- Current Writing drafts and archived review criterion bands are summarised; Task Achievement and Task Response are matched to the linked Task 1 or Task 2.
- Speaking practice can exist without a valid overall band. Transcript-only estimates are never treated as full Speaking scores in the coach summary.
- Weekly recorded activity, target band and learner-reported error-tag counts complete the context. Missing assessments remain unknown, not zero.

No raw essays, notes, recordings, transcripts or feedback quotations are sent to the coach. The server validates and reconstructs the aggregate summary before sending it to the provider, stripping unexpected fields. Learner error tags are not diagnoses. The UI provides a summary of the information used. Recommendations are AI coaching suggestions, not official IELTS predictions.

The small speaking-topic catalog deliberately contains only set numbers and titles, without model answers. When updating the speaking question bank, run `node scripts/sync-speaking-topic-catalog.mjs`; the regression test checks catalog coverage.

## Provider and limits

GET /api/ai/recommendations exposes only availability. POST has an 8 KB body cap, strict input validation, a bounded three-step output schema and a total-time check. Groq GPT OSS uses strict JSON-schema output through the shared review transport. AI_COACH_DAILY_LIMIT defaults to 15 attempts per UTC day per server process, with two concurrent requests. Failed provider attempts count toward the cap. These in-memory limits reset on process restart and are not shared authenticated production billing quotas. Cancelling a browser request does not guarantee that provider billing stops.

Never put keys in NEXT_PUBLIC_ variables or source control. The current client bundle was checked for key leakage.

## Verification, 15 November 2026

Production build and 38 targeted regression tests passed. The real HTTP endpoint returned a Russian three-step plan within a 30-minute budget; invalid and oversized bodies returned 400 and 413. Browser checks covered private aggregates, pending work, all four skills, time/language controls, caching, completion persistence, quota/cancellation behaviour, stale results, direct task links and desktop/tablet/mobile layout. Browser plan responses are fixtures to avoid repeated provider spending; the separate HTTP smoke test used Groq.

Run tests:

`node --test tests/study-recommendations.test.mjs scripts/study-dashboard.test.mjs tests/ai-review-service.test.js tests/ai-evaluation.test.js tests/writing-session.test.mjs tests/speaking-studio.test.mjs tests/speech-transcription.test.js`
