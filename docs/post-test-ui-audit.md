# Post-test UI audit

Checked 2026-11-04 against the current local catalog:
- 159 papers: full and single Reading / Listening.
- 954 rendered result scenarios: blank, correct and mixed/long responses at 1440 px and 390 px.
- 462 rendered review scenarios: 231 parts at both widths, with explanations expanded (Russian / Uzbek).

The browser harness renders the real ExamResults component and executes the current AnnotatedContent effect against the original question markup. It checks container overflow, visible feedback coverage, disabled answer controls and preservation of annotation text offsets. Expected horizontal scrolling inside tables is allowed; feedback extending outside its scrollable content is rejected.

Fixed during audit:
- Imported map arrangement now retains intervening whitespace nodes, preserving saved highlight offsets.
- Feedback for fields positioned on diagrams is shown in numbered cards below the diagram rather than clipped over the image.
- Question navigation directs focus to the corresponding diagram feedback card.

Latest run: 0 detected failures. The result-filter rendering tests also verify correct / incorrect / unanswered / answered / pending and part filters.

Run: node scripts/check-post-test-pages.mjs
Machine-readable report: .cache/post-test-audit.json
This is a UI/rendering audit. It does not verify answer-key accuracy, listen to recordings, or exercise authenticated account synchronization.
