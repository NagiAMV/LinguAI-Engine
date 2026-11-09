import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export function serializeVocabulary(items) {
  return JSON.stringify(items, null, 2).replace(/\[\n(?:\s*"(?:\\.|[^"\\])*",?\n)+\s*\]/g, value => '[' + JSON.parse(value).map(item => JSON.stringify(item)).join(', ') + ']') + '\n';
}

export function createVocabularyStore(filename) {
  let queue = Promise.resolve();
  async function read() {
    try {
      const items = JSON.parse(await fs.readFile(filename, 'utf8'));
      if (!Array.isArray(items)) throw new Error('Invalid vocabulary file');
      return items;
    } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  }
  function remember(word, fields) {
    const operation = queue.then(async () => {
      const items = await read();
      let entry = items.find(item => item.word?.trim().toLowerCase() === word);
      const previous = JSON.stringify(entry);
      if (!entry) { entry = { word, translations: {}, status: 'learning' }; items.push(entry); }
      function fill(target, source) {
        for (const [key, value] of Object.entries(source || {})) {
          if (value == null || value === '') continue;
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            if (!target[key]) target[key] = {};
            if (typeof target[key] === 'object' && !Array.isArray(target[key])) fill(target[key], value);
          } else if (target[key] == null || target[key] === '' || (Array.isArray(target[key]) && !target[key].length)) target[key] = value;
        }
      }
      fill(entry, fields);
      if (previous !== JSON.stringify(entry)) {
        const temporary = `${filename}.${randomUUID()}.tmp`;
        try { await fs.writeFile(temporary, serializeVocabulary(items), 'utf8'); await fs.rename(temporary, filename); }
        finally { await fs.rm(temporary, { force: true }).catch(() => {}); }
      }
      return entry;
    });
    queue = operation.catch(() => {});
    return operation;
  }
  return { read, remember };
}
export const vocabularyStore = createVocabularyStore(path.join(process.cwd(), 'data', 'vocabulary_base.json'));
