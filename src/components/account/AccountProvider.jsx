'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase, supabaseConfigError } from '@/lib/supabase';
import { attemptKey, mergeAttempts, profileFromUser, profileMetadata } from '@/lib/account-model.mjs';

const AccountContext = createContext(null);
function readAttempts(owner) {
  try { return mergeAttempts(JSON.parse(localStorage.getItem(attemptKey(owner)) || '[]')); } catch { return []; }
}
function writeAttempts(owner, attempts) {
  localStorage.setItem(attemptKey(owner), JSON.stringify(attempts));
}
export function accountError(error) {
  if (!error) return '';
  if (error.code === 'PGRST205' || error.code === '42P01') return 'Cloud history is not configured yet. Your results remain on this device.';
  if (/provider.*(disabled|not enabled|not supported)/i.test(error.message || '')) return 'This sign-in provider needs to be enabled in Supabase first.';
  if (/fetch|network/i.test(error.message || '')) return 'Could not reach the account service. Check your connection and retry.';
  return error.message || 'The account service is unavailable. Please retry.';
}

export default function AccountProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncing, setSyncing] = useState(false);
  const activeOwner = useRef(null);
  const syncGeneration = useRef(0);
  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      // Do not await other Supabase calls inside this callback (auth lock).
      activeOwner.current = session?.user?.id || null;
      setAttempts(readAttempts(activeOwner.current));
      setSyncMessage('');
      setUser(session?.user || null);
      setReady(true);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (mounted) { if (error) setSyncMessage(accountError(error)); activeOwner.current = data.session?.user?.id || null; setAttempts(readAttempts(activeOwner.current)); setUser(data.session?.user || null); setReady(true); }
    }).catch(() => { if (mounted) { setReady(true); setSyncMessage('Could not load your account. Please refresh to retry.'); } });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const refreshAttempts = useCallback(async () => {
    const owner = user?.id || null;
    if (activeOwner.current !== owner) return;
    const generation = ++syncGeneration.current;
    const current = () => generation === syncGeneration.current && activeOwner.current === owner;
    const local = readAttempts(owner);
    setAttempts(local);
    setSyncMessage('');
    setSyncing(false);
    if (!owner || !supabase) return;
    setSyncing(true);
    try {
      const pending = local.filter(a => !a.synced);
      if (pending.length) {
        const payload = pending.map(({ synced, ...a }) => ({ ...a, user_id: owner }));
        const { error } = await supabase.from('practice_attempts').upsert(payload, { onConflict: 'user_id,id' });
        if (error) throw error;
        // Re-read so an attempt finished during the upload is never dropped.
        const ids = new Set(pending.map(a => a.id));
        writeAttempts(owner, readAttempts(owner).map(a => ids.has(a.id) ? { ...a, synced: true } : a));
      }
      const { data, error } = await supabase.from('practice_attempts').select('id,test_id,title,resource,correct,total,checked,band,finished_at,duration_seconds,focus_stats').eq('user_id', owner).order('finished_at', { ascending: false }).limit(1000);
      if (error) throw error;
      const cached = readAttempts(owner);
      const merged = mergeAttempts(cached.filter(a => a.synced), data.map(a => ({ ...a, synced: true })), cached.filter(a => !a.synced));
      writeAttempts(owner, merged);
      if (current()) setAttempts(merged);
    } catch (error) { if (current()) setSyncMessage(accountError(error)); }
    finally { if (current()) setSyncing(false); }
  }, [user?.id]);
  useEffect(() => {
    if (!ready) return;
    refreshAttempts();
    window.addEventListener('online', refreshAttempts);
    return () => { ++syncGeneration.current; window.removeEventListener('online', refreshAttempts); };
  }, [ready, refreshAttempts]);

  const recordAttempt = useCallback((attempt) => {
    const owner = user?.id || null;
    // Reject an effect left over from a previous account's exam screen.
    if (activeOwner.current !== owner) return;
    try {
      const local = readAttempts(owner);
      const existing = local.find(a => a.id === attempt.id);
      if (existing && JSON.stringify(existing.focus_stats || []) === JSON.stringify(attempt.focus_stats || [])) return;
      const next = mergeAttempts(local, [{ ...attempt, synced: false }]);
      writeAttempts(owner, next);
      setAttempts(next);
      if (owner) refreshAttempts();
    } catch { setSyncMessage('Browser storage is full or unavailable. This result could not be added to history.'); }
  }, [user?.id, refreshAttempts]);

  async function saveProfile(profile) {
    if (!supabase || !user) throw Error('Sign in to save your profile.');
    const { data, error } = await supabase.auth.updateUser({ data: profileMetadata(profile) });
    if (error) throw error;
    if (activeOwner.current === user.id) setUser(data.user);
  }
  async function signOut() {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
    activeOwner.current = null; setUser(null); setAttempts(readAttempts(null));
  }
  async function importGuestAttempts() {
    if (!user) return;
    writeAttempts(user.id, mergeAttempts(readAttempts(user.id), readAttempts(null).map(a => ({ ...a, synced: false }))));
    await refreshAttempts();
  }
  return <AccountContext.Provider value={{ user, ready, profile: profileFromUser(user), attempts, syncMessage, syncing, configured: !supabaseConfigError, saveProfile, signOut, recordAttempt, refreshAttempts, importGuestAttempts }}>{children}</AccountContext.Provider>;
}
export function useAccount() { return useContext(AccountContext); }
