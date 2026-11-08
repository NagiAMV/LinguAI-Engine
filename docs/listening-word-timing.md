# Listening word timing

Run the resumable local processor from the repository root:

```powershell
& .cache/transcription-venv/Scripts/python.exe scripts/time-listening-words.py
```

The processor covers full and single Listening JSON files. It preserves transcript text and speaker markup. Audio recognition runs locally using the existing small.en model. Word clocks are cached by the audio SHA-256 in `.cache/listening-word-clocks`. Existing word cues are preserved. The same recording is processed only once.

Only runs of at least two matching words receive timestamps. Unmatched words are not assigned invented timings. Parts below 55% matched coverage are left unchanged and recorded as `needs-review`. Automatic timing still needs listening-based spot checks, particularly around repeated phrases, speaker transitions, and seeking. `report.json` records progress; it is not proof of manual verification.

The Follow audio control remains optional. Speaker colours apply to labels, while transcript text inherits the normal theme foreground. Existing automatic speaker boundaries remain approximate.

## Temporary public review link plan

1. Verify the current local site port and start a production preview for external review.
2. Install or locate `cloudflared`.
3. Run `cloudflared tunnel --url http://localhost:3000` using the actual preview port.
4. Verify the generated HTTPS URL, a Listening test, audio playback and submission.
5. Share the URL with reviewers. Keep the server, tunnel and computer running.
6. Stop the tunnel when review ends. The hostname changes on the next run.

Quick Tunnels do not support SSE. Check any streaming features separately before including them in the review. Authentication callbacks may also require the temporary origin to be configured before testing sign-in.

Reference: https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/

This document is a plan. No tunnel has been started by this change.
