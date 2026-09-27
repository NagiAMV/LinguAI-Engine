# Cambridge exam workspace

The existing 168 Academic tests and their manifest are unchanged. Test cards now link to `/cambridge/{book}/{reading|listening}/{test}`. The route validates the manifest entry before reading its existing public JSON file and renders outside the dashboard.

## Session behavior

- Keeps the existing `linguai-cd-{test.id}` localStorage key and answer field names, preserving older answers and the selected part.
- Adds the active question, flags, start/finish timestamps, and audio positions to that session record. Writes occur with each interaction.
- The timer counts elapsed wall-clock time, including refreshes, background tabs, and time away until Finish. Finishing freezes it; Resume excludes the review interval.
- Text fields, radio groups, checkbox groups, and selects use the existing sanitized markup, including answer fields embedded in Reading passages.
- Navigation derives real question numbers from the markup. Shared checkbox groups expose each question number and count filled answer slots. Review displays all selected options together without marking correctness.
- Desktop uses independent passage/audio and question scroll areas. Mobile uses one scrolling workspace with a persistent header and question navigation; wide tables scroll horizontally.
- Audio remains hosted at the existing external URLs. Playback positions are restored to the nearest saved second. Changing parts pauses the previous recording; refresh does not autoplay.
- Finish uses a native modal confirmation with the unanswered count, then shows saved answers. There is no scoring or automatic submission.

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

Limitations: browser-local persistence is device-specific; audio availability depends on its external host; this is an elapsed timer, not a timed auto-submit exam. No scoring was added.
