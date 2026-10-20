# Reading explanation languages and Listening 16 transcript

All current full and single-passage Reading papers offer Russian, English and Uzbek explanations. English explanations and source evidence quotes remain unchanged. Existing Uzbek explanations remain; missing Russian and Uzbek explanations are translated from English. Machine-translated entries retain provider and source-hash metadata and show a translation note in the review interface. Answer keys are not translated.

Listening 16 now includes a local Whisper `small.en` draft transcript with 223 timed segments. Part boundaries, reviewed from the recording's section announcements, are 0, 330.70, 694.42 and 1037.77 seconds. Each review part starts the same recording at its own section boundary. The transcript is explicitly marked as an unofficial ASR draft, not a fully audited transcript.

Transcript inventory: Listening 1, 4, 12 and 16 have ASR drafts; 2–3, 5–11 and 13–15 have supplied transcripts. All sixteen Listening papers now have transcripts in all four parts.

`scripts/translate-reading-explanations.py` caches translations before writing completed datasets and preserves English answer labels such as TRUE/FALSE and option letters. `scripts/transcribe-practice-listening.py` can resume an interrupted local transcription. `scripts/attach-listening-transcripts.py` requires explicit section boundaries before publishing a transcript into the player.

Validation: all 953 explanation entries contain the three languages; an import snapshot confirms English text, part references and evidence quotes are unchanged. All 117 Node tests and the production build passed. Browser checks covered exact selected-language text in single passages 24 and 47, language switching in full tests 1 and 8, mobile width, and all four timed transcript/audio positions in Listening 16.

Listening 12 follow-up: 249 local ASR segments attached at reviewed section boundaries 0, 474.17, 885.32 and 1302.70 seconds. The recording lasts approximately 1717 seconds. Draft provenance and timecodes remain visible in review. All 118 automated tests passed, including a complete inventory check for all sixteen Listening papers.

Listening 12 browser validation also passed: all four transcript panels, playback at the corresponding section start, continuous audio between parts, end-of-recording decoding, answer persistence, 40/40 source-key scoring, and mobile width. Production build passed.
