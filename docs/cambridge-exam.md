# Cambridge exam workspace

The existing 168 Academic tests and their manifest are unchanged. Test cards now link to `/cambridge/{book}/{reading|listening}/{test}`. The route validates the manifest entry before reading its existing public JSON file and renders outside the dashboard.

## Session behavior

- Keeps the existing `linguai-cd-{test.id}` localStorage key and answer field names, preserving older answers and the selected part.
- Adds the active question, flags, start/finish timestamps, an absolute deadline, attempt phase, and audio positions to that session record. Writes occur with each interaction.
- The timer starts at 60:00 only after explicit Start, for both modules. Its deadline survives refresh, background tabs, and leaving. At 00:00 all answers and navigation lock, audio pauses, and a mandatory Submit dialog opens. Submitted attempts are read-only. Legacy unfinished answers migrate to a pre-start screen without losing their content.
- Text fields, radio groups, checkbox groups, and selects use the existing sanitized markup, including answer fields embedded in Reading passages.
- Navigation derives real question numbers from the markup. Shared checkbox groups expose each question number and count filled answer slots. Review displays all selected options together without marking correctness.
- Desktop uses independent passage/audio and question scroll areas. Mobile uses one scrolling workspace with a persistent header and question navigation; wide tables scroll horizontally.
- Audio remains hosted at the existing external URLs. Playback positions are restored to the nearest saved second. Changing parts pauses the previous recording; refresh does not autoplay.
- Submit uses a native modal confirmation with the unanswered count, then shows saved answers. There is no scoring. New attempt archives existing answers locally before replacing the current attempt; archives can be read from Previous attempts. Listening transcripts appear only after submission.
- Back returns to the same module/book, with a warning that the clock continues. Dashboard module and book use URL query parameters, including browser history and refresh support.
- Compact edge-to-edge panes support keyboard/pointer divider resizing, text sizes, and browser fullscreen where supported.

## Verification (2026-09-27)

Browser checks on real imported tests:

| Test | Coverage |
| --- | --- |
| Cambridge 19 Reading 1 | Existing radio/text answers restored; new text input, part changes, direct question jump, flags, refresh, elapsed timer, cancel/confirm Finish, review refresh, Resume |
| Cambridge 10 Reading 1 | Radio, table text input, matching-heading select inside passage, select/text persistence after refresh, desktop independent scrolling, mobile question jump into a horizontally scrolling table |
| Cambridge 19 Listening 1 | Text, shared checkbox questions 21/22, matching select, refresh, audio playback advancing, saved audio position after refresh, mobile Finish and review |
| Cambridge 10 Listening 1 | Text and paired checkbox questions 11/12; partial pair counts as one unanswered; flag on second question, refresh, playback advancing, part changes, grouped review |

Responsive checks: desktop 1280x720, tablet 820x1180, mobile 390x844. No page-level horizontal overflow or overlap between the workspace and persistent controls. Mobile tables retain readable cell widths.

Production build: `node node_modules/next/dist/bin/next build` with `LINGUAI_NEXT_DIST_DIR=.cache/exam-production-check` (isolated output avoids the existing OneDrive build-folder issue).

Limitations: browser-local persistence is device-specific; audio availability depends on its external host; expiry requires Submit rather than automatically submitting. No scoring was added.

## Countdown verification (2026-09-28)

Six Node regression tests cover legacy migration, explicit start, absolute-deadline refresh behavior, late-edit rejection, immutable submissions, expiry submission, and the 60:00 display bound. Run `node --test tests/exam-session.test.mjs`.

Browser expiry checks used a temporary UI fixture with a ten-second deadline and restored the original sessions afterwards. Reading locked all 27 visible controls, retained existing answers, stayed locked after refresh and Escape, and submitted to read-only review. Listening played before expiry, paused and removed playback controls at expiry, and revealed four transcripts only in review. Archive/new-attempt flow preserved the prior answers and returned to a 60:00 pre-start screen. Back returned to `/?view=reading&book=19`; reload retained that collection. Divider keyboard resize, text size, fullscreen entry/exit, and mobile no-overlap geometry were verified. The temporary fixture was deleted.

## Answer review update (2026-09-28)

The statements above describing no correctness checking refer to the initial exam implementation. Review now compares saved answers against a separate, partially populated verified key store. No IELTS band conversion is implemented. Missing keys display Not checked. See [answer-key storage and checkpoint](cambridge-answer-keys.md) and [complete coverage audit](cambridge-answer-key-coverage.json) for current coverage and verification. The 168 imported tests and existing localStorage session/archive formats remain unchanged.
