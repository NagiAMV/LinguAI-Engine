import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';

// Accept exactly one verified part at a time, and never replace existing answers.
export function mergeVerifiedPart(store, part) {
  const { book, test, module, section, sourceUrl, answers, groups = [] } = part;
  if (!Number.isInteger(book) || book < 1 || book > 21 || !Number.isInteger(test) || test < 1 || test > 4 || !['reading','listening'].includes(module) || !Number.isInteger(section) || section < 1 || section > (module === 'reading' ? 3 : 4)) throw new Error('Invalid Cambridge Academic test identity');
  const source = part.source?.type === "user-transcription" ? null : new URL(sourceUrl);
  if (source && (source.protocol !== 'https:' || source.hostname !== 'engnovate.com')) throw new Error('Expected a verified Engnovate source URL');
  if (!source && (typeof part.source.label !== 'string' || !part.source.label.trim() || typeof part.source.reference !== 'string' || !part.source.reference.startsWith('docs/'))) throw new Error('User transcription requires a label and project reference');
  const provenance = source ? { part: section, url: sourceUrl } : { part: section, ...part.source };
  if (!answers || typeof answers !== 'object' || Array.isArray(answers) || !Object.keys(answers).length) throw new Error('No verified answers supplied');
  for (const [number, accepted] of Object.entries(answers)) {
    if (!/^[1-9][0-9]{0,2}$/.test(number) || !Array.isArray(accepted) || !accepted.length || !accepted.every(value => typeof value === 'string' && value.trim())) throw new Error(`Invalid accepted answers for ${number}`);
  }
  if (!Array.isArray(groups) || groups.some(group => !Array.isArray(group.questions) || group.questions.length < 2 || new Set(group.questions).size !== group.questions.length || group.questions.some(n => !answers[n]) || !Array.isArray(group.acceptedSets) || !group.acceptedSets.length || group.acceptedSets.some(set => !Array.isArray(set) || set.length !== group.questions.length || !set.every(value => typeof value === 'string' && value.trim()) || new Set(set).size !== set.length))) throw new Error('Invalid verified answer set');
  const id = `${module}-${book}-${test}`;
  const next = structuredClone(store);
  const entry = next[id] || { book, test, module, answers: {}, parts: {}, sources: [] };
  if (entry.book !== book || entry.test !== test || entry.module !== module) throw new Error('Existing test identity differs');
  for (const [number, accepted] of Object.entries(answers)) {
    if (entry.answers[number] && JSON.stringify(entry.answers[number]) !== JSON.stringify(accepted)) throw new Error(`Refusing to overwrite verified answer ${id} Q${number}`);
    if (Object.entries(entry.parts).some(([p, value]) => Number(p) !== section && value.questionNumbers.includes(Number(number)))) throw new Error(`Question ${number} already belongs to another part`);
    entry.answers[number] = accepted;
  }
  const savedPart = entry.parts[section] || { questionNumbers: [], groups: [] };
  for (const group of groups) {
    const previous = savedPart.groups.find(old => old.questions.some(n => group.questions.includes(n)));
    if (previous && JSON.stringify(previous) !== JSON.stringify(group)) throw new Error('Refusing to overwrite a verified answer group');
    if (!previous) savedPart.groups.push(group);
  }
  savedPart.questionNumbers = [...new Set([...savedPart.questionNumbers, ...Object.keys(answers).map(Number)])].sort((a,b) => a-b);
  entry.parts[section] = savedPart;
  if (!entry.sources.some(s => JSON.stringify(s) === JSON.stringify(provenance))) entry.sources.push(provenance);
  next[id] = entry;
  return next;
}

export function saveVerifiedPart(file, part) {
  if (file instanceof URL) file = fileURLToPath(file);
  const store = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const next = mergeVerifiedPart(store, part);
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, JSON.stringify(next, null, 2) + '\n', { flag: 'wx' });
  renameSync(temporary, file);
  return next;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.argv[2]) throw new Error('Usage: node scripts/save-cambridge-answer-key.mjs verified-part.json');
  const part = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const imported = JSON.parse(readFileSync(new URL('../public/cambridge/' + part.module + '-' + part.book + '-' + part.test + '.json', import.meta.url), 'utf8'));
  const section = imported.parts.find(p => p.id === part.section);
  if (!section) throw new Error('Part not found in existing dataset');
  const numbers = [...(section.passage + section.questions).matchAll(/id="ielts-(?:reading|listening)-question-number-(\d+)"/g)].map(match=>match[1]);
  if (Object.keys(part.answers || {}).some(number=>!numbers.includes(number))) throw new Error('Answer number does not belong to this imported part');
  saveVerifiedPart(new URL('../src/data/cambridge-answer-keys.json', import.meta.url), part);
  await import('./audit-cambridge-answer-keys.mjs');
  console.log(`Saved ${part.module}-${part.book}-${part.test} part ${part.section} immediately.`);
}
