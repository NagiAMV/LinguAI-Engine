// Only explicit source alternatives are accepted. No inferred synonyms or band scores.
export function normalizeAnswer(value) {
  return String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
}

export function reviewAnswer(value, numbers, key, multiple = false) {
  const group = multiple && Object.values(key?.parts || {}).flatMap(part => part.groups || []).find(group => group.questions.length === numbers.length && group.questions.every(n => numbers.map(Number).includes(n)));
  if (group) {
    const sets = group.acceptedSets;
    if (!Array.isArray(sets) || !sets.length || sets.some(set => !Array.isArray(set) || set.length !== numbers.length || !set.every(answer => typeof answer === 'string' && answer.trim()))) return { status: 'pending', display: null };
    const display = sets.map(set => set.join(', ')).join(' OR ');
    const selected = (Array.isArray(value) ? value : [value]).map(normalizeAnswer).filter(Boolean).sort();
    if (!selected.length) return { status: 'blank', display };
    const correct = sets.some(set => JSON.stringify(set.map(normalizeAnswer).sort()) === JSON.stringify(selected));
    return { status: correct ? 'correct' : 'incorrect', display };
  }
  const entries = numbers.map(number => key?.answers?.[number]);
  const available = entries.length > 0 && entries.every(entry => Array.isArray(entry) && entry.length && entry.every(v => typeof v === 'string' && v.trim()));
  const responses = (Array.isArray(value) ? value : [value]).map(normalizeAnswer).filter(Boolean);
  const display = available ? entries.map(entry => entry.join(' / ')).join(', ') : null;
  if (!available) return { status: 'pending', display: null };
  if (!responses.length) return { status: 'blank', display };
  if (!multiple) return { status: entries[0].some(answer => normalizeAnswer(answer) === responses[0]) ? 'correct' : 'incorrect', display };
  // Match each choice to one answer slot, irrespective of selection order.
  const choices = [...new Set(responses)];
  const used = new Set();
  function matches(index) {
    if (index === entries.length) return true;
    for (let i = 0; i < choices.length; i++) {
      if (!used.has(i) && entries[index].some(answer => normalizeAnswer(answer) === choices[i])) {
        used.add(i);
        if (matches(index + 1)) return true;
        used.delete(i);
      }
    }
    return false;
  }
  return { status: choices.length === entries.length && matches(0) ? 'correct' : 'incorrect', display };
}
