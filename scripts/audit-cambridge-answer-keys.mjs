import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const read = file => JSON.parse(readFileSync(new URL(file, root), 'utf8'));
const catalog = read('src/data/cambridge-import.json');
const keys = read('src/data/cambridge-answer-keys.json');
const tests = catalog.items.map(item => {
  const data = read(`public/${item.contentUrl.replace(/^\//, '')}`);
  const key = keys[data.id];
  const parts = data.parts.map(part => {
    const numbers = [...new Set([...`${part.passage}${part.questions}`.matchAll(/id="ielts-(?:reading|listening)-question-number-(\d+)"/g)].map(match => Number(match[1])))].sort((a,b)=>a-b);
    const saved = numbers.filter(number => key?.answers?.[number]?.length);
    return { part: part.id, storedQuestions: saved, missingQuestions: numbers.filter(number => !saved.includes(number)) };
  });
  if (parts.some(p => !p.storedQuestions.length && !p.missingQuestions.length)) throw new Error(`Missing question index: ${data.id}`);
  if (key) {
    if (key.book !== data.book || key.module !== data.resource || key.test !== data.test) throw new Error(`Mismatched key metadata: ${data.id}`);
    for (const [number, accepted] of Object.entries(key.answers)) {
      const part = parts.find(p=>p.storedQuestions.includes(Number(number)));
      if (!part || !key.parts?.[part.part]?.questionNumbers.includes(Number(number)) || !key.sources.some(s=>s.part===part.part) || !Array.isArray(accepted) || !accepted.length || accepted.some(a=>typeof a!=='string'||!a.trim())) throw new Error(`Invalid saved key: ${data.id} Q${number}`);
    }
  }
  return { id: data.id, book: data.book, module: data.resource, test: data.test, parts };
});
if (Object.keys(keys).some(id=>!tests.some(test=>test.id===id))) throw new Error('Unknown key test');
const parts = tests.flatMap(test=>test.parts);
const summary = { tests: tests.length, parts: parts.length, totalQuestions: parts.reduce((n,p)=>n+p.storedQuestions.length+p.missingQuestions.length,0), storedAnswers: parts.reduce((n,p)=>n+p.storedQuestions.length,0), completeParts: parts.filter(p=>!p.missingQuestions.length).length, completeTests: tests.filter(t=>t.parts.every(p=>!p.missingQuestions.length)).length, testsWithAnyKeys: tests.filter(t=>t.parts.some(p=>p.storedQuestions.length)).length };
writeFileSync(new URL('docs/cambridge-answer-key-coverage.json', root), JSON.stringify({ summary, tests },null,2)+'\n');
console.log(JSON.stringify(summary,null,2));

// Small answer-free metadata for the catalogue; derive totals from imported questions.
const statuses = Object.fromEntries(tests.map(test => {
  const available = test.parts.reduce((sum,p)=>sum+p.storedQuestions.length,0);
  const total = test.parts.reduce((sum,p)=>sum+p.storedQuestions.length+p.missingQuestions.length,0);
  return [test.id, { available, total, status: available === total ? 'complete' : available ? 'partial' : 'missing' }];
}));
writeFileSync(new URL('src/data/cambridge-key-status.json', root), JSON.stringify(statuses,null,2)+'\n');
