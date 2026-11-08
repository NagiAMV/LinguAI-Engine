import fs from 'node:fs';

let removed = 0;
const changed = [];
for (const file of fs.readdirSync('public/practice').filter(name => /^(practice|single)-listening-\d+\.json$/.test(name))) {
  const path = 'public/practice/' + file;
  const test = JSON.parse(fs.readFileSync(path, 'utf8'));
  let count = 0;
  for (const part of test.parts) {
    // Match the same number immediately before its interactive badge.
    // Keep currency symbols and all input attributes intact.
    part.questions = part.questions.replace(/\b(\d+)[.)]\s*([£$€]?\s*)(<span class="ielts-listening-question-item"><strong class="ielts-listening-question-number">)(\d+)(<\/strong>)/g,
      (match, number, currency, opening, badge, closing) => {
        if (number !== badge) return match;
        count++;
        return currency + opening + badge + closing;
      });
  }
  if (count) {
    fs.writeFileSync(path, JSON.stringify(test, null, 2) + '\n');
    changed.push({file, removed: count});
    removed += count;
  }
}
console.log(JSON.stringify({removed, changed}));
