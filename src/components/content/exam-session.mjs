import {cleanErrorTags, toggleErrorTag} from './error-tags.mjs';
export const DURATION = 60 * 60 * 1000;
function duration(session) { return session.mode === 'training' ? Infinity : Number.isFinite(session.durationMs) && session.durationMs > 0 && session.durationMs <= DURATION ? session.durationMs : DURATION; }
export function restoreSession(saved = {}, now = Date.now()) {
  const base = { ...saved, version: 2, answers: saved.answers || {}, flags: saved.flags || [], audioTimes: saved.audioTimes || {}, partIndex: saved.partIndex || 0, errorTags: cleanErrorTags(saved.errorTags) };
  if (saved.version !== 2) return { ...base, phase: saved.finishedAt ? 'submitted' : 'ready', deadline: null, startedAt: null };
  if (saved.phase === 'running' && saved.mode !== 'training' && (!Number.isFinite(saved.deadline) || now >= saved.deadline)) return { ...base, phase: 'expired' };
  return base;
}
export function transition(session, action, now = Date.now()) {
  const state = restoreSession(session, now);
  if (action.type === 'start' && state.phase === 'ready') { const mode=action.mode==='training'?'training':'exam'; return { ...state, mode, phase: 'running', startedAt: now, deadline: mode==='training'?null:now + duration({...state,mode}), finishedAt: null }; }
  if (action.type === 'submit' && ['running', 'expired'].includes(state.phase)) return { ...state, phase: 'submitted', finishedAt: now };
  if (action.type === 'edit' && state.phase === 'running') return { ...state, ...action.patch };
  if (action.type === 'tag-error' && state.phase === 'submitted') return {...state,errorTags:toggleErrorTag(state.errorTags,action.key,action.tag)};
  return state;
}
export function remaining(session, now = Date.now()) {
  if (session.phase === 'ready') return duration(session);
  if (session.phase === 'expired') return 0;
  if(session.mode==='training')return Infinity;
  return Math.min(duration(session), Math.max(0, (session.deadline || 0) - (session.finishedAt || now)));
}
export function countdown(milliseconds) {
  if(!Number.isFinite(milliseconds))return '∞';
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
