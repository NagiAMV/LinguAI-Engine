# Overview study dashboard

Momentum and the daily journal use submitted Reading/Listening attempts, dated Writing draft updates, saved AI Writing/Speaking reviews, and completed two-minute Speaking timers. Draft updates are grouped by task and local date and carry no invented duration. Historical undated drafts are not imported. Dates use the viewer's device time zone; tests spanning midnight are attributed to their submission date. Test durations are elapsed session times, not measurements of focused work.

Readiness uses the latest complete, checked 40-question tests for Reading/Listening and saved AI practice estimates for Writing/Speaking. The combined practice estimate appears only with four numeric estimates; it is not an official IELTS result. Missing or `< 2.5` skill scores are not guessed.

## AI connection

The Overview coach has a separate opt-in, and does not make paid requests automatically.

1. Configure the existing server provider/model/key variables described in `.env.example`.
2. Set `AI_COACH_ENABLED=true` on the server and restart/redeploy.
3. Press **Create my AI plan** in Overview.

Do not put API keys in `NEXT_PUBLIC_` variables, browser storage, or chat. The endpoint is `GET/POST /api/ai/recommendations`. Only validated aggregates (skill scores, accuracy, counts, weekly time, learner-selected error-tag counts, target and language) are forwarded. Responses are validated for three actionable steps, 5–60 minutes each. Provider usage is rate-limited with the existing process-local limiter; multi-instance production hosting requires a shared quota store for a strict global limit.

Result-based practice suggestions work without an API. AI plans are cached on the device per account and marked stale when their input summary changes. New Writing/Speaking activity is device-local; existing Reading/Listening account synchronisation remains unchanged. Error tags available to the coach are those saved on this device.

The shared JSON transport follows the [official OpenAI JSON mode documentation](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=chat); the application validates the returned structure separately.

## Checks

`node --test scripts/study-dashboard.test.mjs`
