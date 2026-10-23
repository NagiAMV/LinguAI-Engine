# Relocated Reading source files

`passage 1 (3).html` exactly matches the source SHA-256 of Dolls through the ages, single Reading 50. It is not imported twice.

Two new standalone papers are imported from the user-supplied `material for LinguAi/single passages` folder:

- 51: Neanderthal Technology, original questions 27–40 (14 questions). The complete headings and places banks are retained.
- 52: The horseshoe crab, original questions 14–26 (13 questions), using `Passage_2_The_horseshoe_crab_FIXED.html`. Both choose-two sets remain unordered: 19–20 B/D and 21–22 A/E. All option descriptions remain, with one native answer selector per slot.

Source answer keys and word limits are preserved. The supplied pages did not provide detailed explanations; English explanations were written from their passages, with unique supporting excerpts. Russian and Uzbek translations are marked as automatic translations. Source startup scripts, external Tailwind scripts, tracking and event handlers are not shipped.

All 125 automated tests passed, including explicit checks for both source banks and both unordered sets with evidence quotes.

Production build and browser checks passed: all 27 answers score correctly, both unordered groups accept reversed selections, the selected-language explanation matches the stored Russian/English/Uzbek text, and mobile width and catalogue links work. Source answer labels and choices remain separate and readable in the shared layout.
