export const DURATION = 60 * 60 * 1000;
export function restoreSession(saved = {}, now = Date.now()) {
  const base = { ...saved, version: 2, answers: saved.answers || {}, flags: saved.flags || [], audioTimes: saved.audioTimes || {}, partIndex: saved.partIndex || 0 };
  if (saved.version !== 2) return { ...base, phase: saved.finishedAt ? 'submitted' : 'ready', deadline: null, startedAt: null };
  if (saved.phase === 'running' && (!Number.isFinite(saved.deadline) || now >= saved.deadline)) return { ...base, phase: 'expired' };
  return base;
}
export function transition(session, action, now = Date.now()) {
  const state = restoreSession(session, now);
  if (action.type === 'start' && state.phase === 'ready') return { ...state, phase: 'running', startedAt: now, deadline: now + DURATION, finishedAt: null };
  if (action.type === 'submit' && ['running', 'expired'].includes(state.phase)) return { ...state, phase: 'submitted', finishedAt: now };
  if (action.type === 'edit' && state.phase === 'running') return { ...state, ...action.patch };
  return state;
}
export function remaining(session, now = Date.now()) {
  if (session.phase === 'ready') return DURATION;
  if (session.phase === 'expired') return 0;
  return Math.min(DURATION, Math.max(0, (session.deadline || 0) - (session.finishedAt || now)));
}
export function countdown(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
