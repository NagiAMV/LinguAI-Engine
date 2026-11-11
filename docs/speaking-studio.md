# Speaking Studio

The existing bank of 68 sets, Parts 1–3, model answers, Uzbek phrase hints, search and bookmarks remains available. “Training & Exam” opens a full session for the selected set; the practice desk can open one part. The previous text interview remains separately accessible.

## Practice flow

- Training Mode advances when the learner chooses. It includes model answers, notes, question selection, microphone recording, audio upload, transcription and feedback.
- Exam Mode uses absolute deadlines and automatic progression. A full practice session allocates four minutes to Part 1, one minute of preparation and two minutes speaking in Part 2, and four minutes to Part 3. A focused part uses the corresponding allocation. This 11-minute practice schedule is within the [IELTS Speaking format](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking); it is not a live examiner and cannot adapt follow-up questions as a human would.
- Recording starts after microphone permission for Exam Mode. It pauses during Part 2 preparation and resumes afterwards. Model answers and AI review are hidden until submission. The learner can finish early.
- Microphone recording needs HTTPS or localhost. Without permission/support the user can explicitly choose upload/text practice; no microphone is silently accessed. Browser speech synthesis can read a prompt on demand. Use headphones to avoid recording the prompt.
- English recognition is separate from AI review. Users can correct recognition errors before requesting feedback. Audio goes to Groq only on “Transcribe”; text goes to the review provider only on “Get AI feedback”. Private notes are excluded.

## Persistence and recording

Session metadata and transcripts are scoped to an account/guest in localStorage. Audio blobs are scoped to the same owner in IndexedDB. Recordings have local backups at five-second intervals. Reloading interrupts the microphone; a saved partial clip is labelled and the user can record another clip. The last unfinished interval may be lost. Microphone access is never automatically resumed after reload. Device storage failures are reported; keep downloaded copies of important recordings.

An attempt can have up to four clips of up to 20 MB each for transcription. Previous attempts retain transcripts, feedback and locally saved recording IDs; the UI keeps eight metadata versions per topic/part. Audio is local, not cloud synced. Clearing browser data removes it. Download links are provided for recordings and transcripts.

## Evaluation limits

Groq Whisper produces text and segment timestamps; it is not a validated phonetic pronunciation assessment. See [Groq speech-to-text documentation](https://console.groq.com/docs/speech-to-text). Timestamp controls replay the corresponding recording. Words per minute is a descriptive measurement across recognised audio duration, including pauses; it is not a fluency band.

The AI review offers a transcript-based language estimate, vocabulary/grammar/coherence comments, grounded corrections and three next steps. Pronunciation is fixed to “Not assessed: transcript only; audio analysis is required.” Acoustic fluency, stress and intonation are not scored. Idea development is presented as a coaching note, not an additional IELTS scoring criterion. New transcript reviews do not contribute a fabricated overall Speaking band to the Overview readiness score.

## Server configuration

Use the existing server-only GROQ_API_KEY. Set AI_TRANSCRIPTION_ENABLED=true and optionally GROQ_TRANSCRIPTION_MODEL=whisper-large-v3-turbo. AI_REVIEW_ENABLED and the existing review provider/model settings control transcript review. Never use NEXT_PUBLIC_ for secrets. GET /api/ai/transcribe returns only availability. POST accepts multipart audio with a bounded 20 MB upload, a 60-second provider timeout, two concurrent jobs and 30 attempts per UTC day per server process. These in-memory limits reset on restart and are not a shared production billing/authentication quota.

The application keeps provider keys out of client bundles and errors. API calls are made server-side to fixed Groq transcription endpoints. Hosting providers may impose smaller request limits than 20 MB; set an appropriate deployment limit before public hosting.

## Verification

Tests cover every bank plan, clock catch-up and expiry, training navigation, safe upload limits, transcription result validation and refusal to fabricate pronunciation scores. A synthetic English WAV was transcribed by the real Groq service and its text received a real AI review. Browser tests use a fake microphone and fixture API responses; they do not access the user's microphone or repeatedly bill the provider. Real microphone behaviour still depends on browser/device permissions.
