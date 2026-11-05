export const ERROR_TAGS = ['Misheard', 'Spelling', 'Distractor', 'Time management'];
export function cleanErrorTags(value) {
 if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
 return Object.fromEntries(Object.entries(value).filter(([key,tags]) => /^\d+:\d+$/.test(key) && Array.isArray(tags)).map(([key,tags]) => [key,[...new Set(tags.filter(tag => ERROR_TAGS.includes(tag)))]]).filter(([,tags]) => tags.length));
}
export function toggleErrorTag(value, key, tag) {
 const tags = cleanErrorTags(value);
 if (!/^\d+:\d+$/.test(key) || !ERROR_TAGS.includes(tag)) return tags;
 const current = tags[key] || [];
 const next = current.includes(tag) ? current.filter(item => item !== tag) : [...current,tag];
 if (next.length) tags[key] = next;
 else delete tags[key];
 return tags;
}
