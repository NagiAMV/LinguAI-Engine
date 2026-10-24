# Single Listening transcript drafts

The 80 single-section recordings are transcribed locally with faster-whisper `small.en`, beam size 5, VAD, word timing and batched inference. Transcripts are English ASR drafts, not official scripts and not fully checked by a person. Answer keys are never used to generate or rewrite speech.

Each completed result is attached to its existing paper and shown in answer review. Timestamps start at zero for the individual section recording. A visible source note explains the draft status. Paragraphs are marked for checking when average log probability is below −0.6, at least two words have confidence below 0.4, or the no-speech probability exceeds 0.6. These flags are imperfect; unflagged text may still contain recognition errors, especially names and numbers.

`docs/single-listening-transcripts.json` records duration, audio SHA-256, segment/word counts and uncertain timestamps. The papers also retain transcript provenance. Timed raw recognition segments are checkpointed in `.cache/single-listening-transcripts/`. A completed checkpoint is reused only when its audio hash matches. Reimporting the worksheets preserves an existing matching transcript.

Resume or regenerate attached HTML from the completed checkpoints:

```powershell
& .cache/transcription-venv/Scripts/python.exe scripts/transcribe-single-listening.py --device cuda --batch-size 8
```

Use `--device cpu` when CUDA is unavailable, or `--ids 1,2,3` for selected exercises. GPU runtime DLLs remain in the local `.cache` directory; the script also detects the existing Ollama CUDA directory on this computer. No paid transcription API is used, and audio is not uploaded for recognition.

Use `--attach-only` to rebuild the displayed transcript from completed checkpoints without loading the recognition model again.

Validation includes audio hash matching, coverage of all 80 papers, nonempty transcript content, draft notices, section-relative timing, and browser checks that the transcript and the correct recording appear in review. Recognition accuracy still requires human listening; passing these checks is not a claim of a verbatim official transcript.
