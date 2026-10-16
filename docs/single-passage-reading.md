# Single-passage Reading imports

| Number | Passage | Source | Original questions | Time |
| --- | --- | --- | --- | --- |
| 1 | What if everything had a barcode? | Barcode_reading_cdi.html | 1–13 | 20 minutes |
| 2 | IQ Scores | IQ_Scores.html | 14–26 | 20 minutes |
| 3 | Rebranding Art Museums | Rebranding_Art_Museums.html | 27–40 | 20 minutes |
| 4 | Sweet Trouble | Sweet_Trouble.html | 1–13 | 20 minutes |
| 5 | William Gilbert and Magnetism | William_Gilbert_and_Magnetism.html | 1–13 | 20 minutes |
| 6 | Child's Play in Medieval England | Childs_Play_in_Medieval_England.html | 27–40 | 20 minutes |
| 7 | Footprints in the Muds of Time | Footprints_in_the_Muds_of_Time (2).html | 1–13 | 20 minutes |
| 8 | Sorry, Who Are You? | Sorry_Who_Are_You (2).html | 1–13 | 20 minutes |
| 9 | The Art of Deception | The_Art_of_Deception.html | 27–40 | 20 minutes |
| 10 | The University of Life | The_University_of_Life.html | 1–13 | 20 minutes |

Passages 9–10 add 27 questions, bringing the collection to ten texts and 133 questions. Their explicit answer alternatives and EN/UZ explanations were retained. The three simultaneously resubmitted Listening files were byte-for-byte matches for Tests 5, 6 and 4, respectively, and were skipped. Re-importing the new Reading pair was also rejected as duplicate content/source.

The six additional papers contribute 80 questions (106 total). All were new; re-importing the batch rejected all six as duplicates. The Gilbert paper explicitly requires C/D/E in any order across 11–13: the key includes an unordered group, scoring uses one-to-one matching, and repeating one letter cannot earn three marks. The grouped explanation combines the supplied individual explanations and available exact citations. All eight papers have supplied EN/UZ explanations; no new explanations were invented.

Both papers live under `/practice/reading/single/{number}` and the separate Reading → Single passages collection. Their texts, source keys, explicit alternatives and EN/UZ explanations are retained. Original question numbering is preserved, including IQ Scores starting at 14. The shared player supplies saved answers, flags, themes, notes, highlights and review. Scores are out of 13; no IELTS band is extrapolated from a single passage.

The importer reads literal data and the specifically reviewed pure IQ option/row templates. Original authentication, advertising, page scripts and event handlers are not imported. Markup uses the existing allow-list sanitizer. Source-file hashes and normalized passage signatures are checked against existing papers, including full Reading tests, before adding a new record. Both repeated imports were detected and skipped.

Browser checks cover all 26 controls, 13/13 scores, twenty-minute timers, EN/UZ explanations, mobile width, collection links and unavailable band conversion. See `single-reading-browser-check.json` and the corresponding desktop/mobile screenshots. This is an import and functional check, not a complete independent audit of every source answer.


## Additional CDI papers (11–19)

| Number | Passage | Original questions |
| --- | --- | --- |
| 11 | The Conquest of Malaria in Italy | 14–26 |
| 12 | The Constant Evolution of the Humble Tomato | 14–26 |
| 13 | Transport and transport systems during the Roman Empire | 1–13 |
| 14 | What Lucy Taught Us | 1–13 |
| 15 | Why don’t we sleep? | 14–26 |
| 16 | Bovids | 1–13 |
| 17 | How to Clean a Beach | 27–40 |
| 18 | Images and Places | 27–40 |
| 19 | Sign, Baby, Sign! | 27–40 |

These nine supplied papers add 120 questions (19 passages / 253 questions total). Literal SECTIONS, PASSAGES and READING_EXPLANATIONS data are extracted without running page startup scripts. Question types become native controls; summary order, answer alternatives, all eight Images and Places headings, original numbering, English/Uzbek explanations and matching exact quotations are retained. Each passage has the existing 20-minute single-passage timer and no extrapolated band. New passages appear directly in the compact Reading grid.

All 19 papers passed browser checks for perfect-score grading, both explanation languages and mobile width. Re-importing the full twelve-file batch rejected every source as a duplicate and left all paper/catalog/key/explanation hashes unchanged. This verifies import behaviour, not an independent editorial audit of every source answer.


## Flower Power (20)

`Flower_Power.html` adds fourteen questions (27–40) and the supplied English/Uzbek explanations. All eight headings and the first/second/third study options are retained. The original drag-only heading assignment is represented by native selectors, with adapted instructions. The catalog now contains twenty single passages / 267 questions. Flower Power passed perfect-score grading, both explanation languages and mobile-width checks.

`Full Reading Test (4).html` separately became full Reading Test 2, with three passages, forty questions, all headings and word-bank choices, supplied English/Uzbek explanations and unordered answer groups 23–24 and 25–26. Its browser check verified 40/40, review explanations and mobile width.


## Additional Reading papers 21–23 and full Test 3

| Single passage | Source | Questions |
| --- | --- | --- |
| 21 — In Deep Water | In_Deep_Water_P1_V3.html | 1–13 |
| 22 — Mercator the Map Maker | Mercator_the_Map_Maker.html | 27–40 |
| 23 — Brains Trust: Learning About Ourselves | Brains_Trust_Learning_About_Ourselves.html | 14–26 |

Source alternatives, numbering and supplied English/Uzbek explanations are preserved. Source question helpers are limited to reviewed pure string templates, not page startup logic. `Full_Reading_Test_5 (2).html` separately became full Reading Test 3. Its headings, word bank and matching-features name bank are retained with native controls; its choose-two answers remain unordered. Source code, tracking and styles are not shipped. These are functional import checks, not a new editorial audit of the supplied answer keys.

Batch validation: production build and all 84 Node tests passed. Browser checks passed for new papers, correct scoring, explanation display, saved answers, full audio playback and mobile width. Re-importing the batch left existing paper, catalog, key and explanation checksums unchanged.
