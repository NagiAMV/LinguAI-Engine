# Speaking question bank and encoding repair

The Speaking view now opens a question bank with 68 supplied September 2026 sets. Each retains its Part 1 question/answer pairs, Part 2 cue card and model answer, Part 3 discussion pairs and vocabulary hints in Uzbek. Source file name and SHA-256 are recorded in `src/data/speaking-question-bank.json`; only literal S({...}) session records were extracted. The source page's authentication, scripts and tracking code were not imported. These are supplied practice materials, not verified exam predictions.

The redesigned view includes search, category filtering, persistent topic bookmarks, random topic selection, Parts 1–3, collapsible model answers and a one-minute preparation / two-minute speaking timer. Vocabulary hints support hover and keyboard focus. Choosing a topic on mobile scrolls to its practice desk. The existing full mock interview remains accessible through the second tab.

The malformed separators and apostrophes came from Windows-default decoding of UTF-8 JSON in the CDI importer. Its JSON reads now explicitly request UTF-8. `scripts/repair-content-encoding.py` reverses valid UTF-8/Windows-1252 mojibake without replacing legitimate non-English text; it repaired the Listening catalog and keys. Content regression checks reject broken UTF-8 sequences. All other existing paper JSON files were already intact.

Validation: 71 Node tests, successful production build, browser checks for clean catalog text, all 68 sets, search, saved-topic persistence, all parts, model answers, timer, mobile width and launching the mock interview. Screenshots: speaking-hub-desktop.png, speaking-hub-mobile.png and listening-catalog-encoding-fixed.png.
