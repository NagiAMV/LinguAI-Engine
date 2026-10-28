export const AVATAR_COLORS = ['sage', 'ocean', 'clay', 'lavender'];
export function profileFromUser(user) {
  const m = user?.user_metadata || {};
  return {
    name: String(m.display_name || m.full_name || m.name || '').slice(0, 60),
    targetBand: Number(m.target_band) >= 1 && Number(m.target_band) <= 9 && Number.isInteger(Number(m.target_band) * 2) ? Number(m.target_band) : 7,
    examDate: /^\d{4}-\d{2}-\d{2}$/.test(m.exam_date || '') ? m.exam_date : '',
    language: ['en', 'ru', 'uz'].includes(m.learning_language) ? m.learning_language : 'en',
    avatar: AVATAR_COLORS.includes(m.avatar_color) ? m.avatar_color : 'sage',
  };
}
export function profileMetadata(profile) {
  const name = String(profile.name || '').trim();
  if (!name || name.length > 60) throw Error('Enter a name between 1 and 60 characters.');
  const target = Number(profile.targetBand);
  if (target < 1 || target > 9 || !Number.isInteger(target * 2)) throw Error('Choose a target band from 1 to 9.');
  if (profile.examDate && (!/^\d{4}-\d{2}-\d{2}$/.test(profile.examDate) || Number.isNaN(Date.parse(profile.examDate)))) throw Error('Choose a valid exam date.');
  if (!['en', 'ru', 'uz'].includes(profile.language) || !AVATAR_COLORS.includes(profile.avatar)) throw Error('Invalid profile preference.');
  return { display_name: name, target_band: target, exam_date: profile.examDate || null, learning_language: profile.language, avatar_color: profile.avatar };
}
export function initials(name = '') {
  return name.trim().split(/\s+/u).filter(Boolean).slice(0, 2).map(word => [...word][0]).join('').toUpperCase() || 'L';
}
export function safeNext(path) {
  return typeof path === 'string' && /^\/(?!\/)/.test(path) && !/[\\\u0000-\u0020]/.test(path) ? path : '/?view=profile';
}
export function attemptKey(owner) { return `linguai-attempts-v1:${owner || 'guest'}`; }
export function validAttempt(a) {
  return a && typeof a.id === 'string' && a.id.length <= 180 && /^(single|practice)-(reading|listening)-\d+$/.test(a.test_id)
    && ['reading', 'listening'].includes(a.resource) && typeof a.title === 'string' && a.title.length <= 240
    && Number.isInteger(a.total) && a.total > 0 && a.total <= 100 && Number.isInteger(a.correct) && a.correct >= 0 && a.correct <= a.total
    && Number.isInteger(a.checked) && a.checked >= a.correct && a.checked <= a.total
    && a.test_id.includes(`-${a.resource}-`) && (a.band == null || (a.total === 40 && a.checked === 40 && ['< 2.5','2.5','3.0','3.5','4.0','4.5','5.0','5.5','6.0','6.5','7.0','7.5','8.0','8.5','9.0'].includes(a.band)))
    && Number.isFinite(Date.parse(a.finished_at)) && Number.isInteger(a.duration_seconds) && a.duration_seconds >= 0 && a.duration_seconds <= 86400;
}
export function mergeAttempts(...lists) {
  const map = new Map();
  for (const list of lists) for (const a of list || []) if (validAttempt(a)) map.set(a.id, a);
  return [...map.values()].sort((a, b) => Date.parse(b.finished_at) - Date.parse(a.finished_at));
}
export function attemptRoute(a) {
  const [, format, resource, number] = /^(single|practice)-(reading|listening)-(\d+)$/.exec(a.test_id) || [];
  return resource ? `/practice/${resource}/${format === 'single' ? 'single/' : ''}${number}` : '/';
}
export function progressSummary(attempts) {
  const result = {};
  for (const resource of ['reading', 'listening']) {
    const rows = attempts.filter(a => a.resource === resource);
    const checked = rows.reduce((n, a) => n + a.checked, 0);
    result[resource] = { count: rows.length, accuracy: checked ? Math.round(rows.reduce((n, a) => n + a.correct, 0) / checked * 100) : null, latestBand: rows.find(a => a.total === 40 && a.checked === 40)?.band || null };
  }
  return result;
}
