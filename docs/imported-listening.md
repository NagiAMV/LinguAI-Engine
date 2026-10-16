# Supplied Listening papers

## Added audio transcripts

Tests 1 and 4 now have locally transcribed English drafts for all four parts (small.en, CPU/int8). These are explicitly labelled as audio-derived drafts, not official scripts or fully audited manual transcripts. Each paragraph has a timestamp in the full recording; the review player starts at the selected part's beginning. Section boundaries were inspected against the recognised narrator announcements and topic transitions. Proper-name spellings in Test 1 (Karrara, Massey, Lowndes) and Test 4 (Seracini) were aligned with the supplied questions; the raw ASR output remains unchanged in the ignored cache.

The original source files still contain no scripts for Tests 1 and 4. All questions and answer keys, and the supplied Test 2/3 transcripts, were checksum-checked as unchanged. Provenance, source audio hashes and timing boundaries are recorded in each paper and `docs/listening-{1,4}-transcription.json`. This work does not verify every word or validate the answer keys against the audio.

Reproduction: run `scripts/transcribe-practice-listening.py` in the isolated `.cache/transcription-venv` after downloading the model. It uses ffmpeg to decode locally and never uploads audio. Attach only completed outputs with `attach-listening-transcripts.py`, supplying the four reviewed start times. Models, dependencies and raw word-level ASR output stay in ignored `.cache`.

Standalone Listening tests use `/practice/listening/{number}`, independent IDs and browser storage. The library contains only the imported papers described below.

| Number | Supplied file | Questions | Full audio |
| --- | --- | --- | --- |
| 1 | ielts listening test.html | 40 | 37:21.900 |
| 2 | FULL LISTENING TEST (5).html | 40 | 28:24.277 |
| 3 | Listening Test 10.html | 40 | Embedded full recording |
| 4 | Listening test 9_2 (2).html | 40 | Downloaded from supplied audio URL |
| 5 | Practice Listening (2).html | 40 | Downloaded from supplied Internet Archive URL |
| 6 | Practice Listening.html | 40 | Downloaded from supplied Internet Archive URL |

Tests 5–6 preserve their static question HTML, explicit answer alternatives and four supplied transcripts per paper. `extract-practice-listening.cjs` reads only the literal `correctAnswers` and `audioSource` values; `import-practice-listening.py` sanitizes and adapts the original controls. Source, question and audio hashes are checked before appending. The resubmitted `Listening test 9_2 (2).html` matched Test 4 and was skipped. Re-running the batch also rejected Tests 5–6 as duplicates. No ASR or new explanatory content was generated for these two papers; keys were transferred without a full editorial audit against the recordings.

Test 4 retains all 40 source keys, including the explicit `horse hair` / `horsehair` alternatives. Its hotel and art-technique grids become letter selectors, with all source options preserved. The file contains no transcript. The original page offers untimed practice; this import currently uses the site's standard 60-minute exam player. The source file hash, normalized question hash and audio hash are stored to detect repeated imports. Re-running `extract-grid-listening.cjs` then `import-grid-listening.py` rejects an existing source before writing.

Test 3 has four supplied transcripts and the source's 40-minute timer. Its keys retain the supplied alternatives except Q32: `dives` was corrected to `diving` to complete `deepest-diving reptiles`, supported by `deep-diving animals` in its transcript. Q40 retains the supplied question wording (`more energy`), although the source transcript says `20% less energy`; the required keyword is unchanged. See `imported-listening-3-corrections.json`.

For this static HTML format, run `node scripts/extract-static-listening.cjs <file>` then `python scripts/import-static-listening.py <file>`. Both commands read only literal data and sanitized question markup, not the supplied page logic. The importer appends the next number, binds extracted keys to the exact source hash, and checks source bytes, normalized question content, and embedded audio against existing tests before writing anything. A renamed file with altered page title was rejected as duplicate content in testing. The original two papers now also record source and audio hashes. `--check-only` performs validation without importing.

Question wording, choices, explicit answer alternatives and the first paper's map were retained. Matching drop zones in Test 2 are accessible letter selectors; paired checkbox questions are graded as unordered sets, including partial credit. The common player supplies the site's light/dark theme, notes, highlighting, flags, saved progress, answer review and indicative band conversion.

The full recording stays mounted across part changes and uses one saved playback position. Audio and the map are local assets. Original source URLs are retained in each part's `sourceAudioUrl` for provenance, not required for playback.

## Source limitations

- Test 1, questions 4–10: the supplied instruction reads `NO MORE THAN WORDS AND/OR A NUMBER`, without a word count. This wording is retained pending clarification; no guessed restriction is enforced.
- Test 1 includes keys and short answer comments, but no full transcript. The review states that no transcript was supplied. No transcript or supporting quotations were invented.
- Test 2 includes a transcript, which is divided into its original four parts and available after submission. Its source has no per-question audio timestamps.
- Imported material is recorded as user-provided, with rights status not established. Importing it does not establish a license or authorship.

## Reproduction and verification

`node scripts/extract-listening-html.cjs <first HTML path> <second HTML path>` extracts static data and the specifically reviewed pure question builders into `.cache/listening-extracted.json`. It does not execute page startup, libraries, trackers, PDF exporters or event handlers. `scripts/import-listening-html.py` uses the Python standard library to sanitize this markup and adapt the answer controls. It never modifies the supplied files. Runtime HTML includes only permitted elements and attributes; the original scripts, inline handlers, styles and remote image URLs are not shipped.

Audio was downloaded from the URLs embedded in the supplied papers. Checks confirm real MP3 headers, browser metadata, playback near the beginning and end, continuous playback across parts, all 80 usable answer slots, perfect-score grading, unordered-group partial credit, excessive-selection rejection, answer persistence and mobile page width. See `imported-listening-browser-check.json` and the accompanying screenshots. The complete Node test suite passed (143 tests), and the production build succeeded.
