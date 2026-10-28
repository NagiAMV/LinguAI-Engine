'use client';

import { useEffect, useState } from 'react';
import { useAccount, accountError } from '@/components/account/AccountProvider';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const { ready, user, configured } = useAccount();
  const [error, setError] = useState('');
  const [recovery, setRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const url = new URL(window.location.href);
    setRecovery(url.searchParams.get('recovery') === '1');
    const description = url.searchParams.get('error_description') || new URLSearchParams(url.hash.slice(1)).get('error_description');
    if (description) setError(description.slice(0, 300));
    // Supabase handles the PKCE code exchange when initialising the browser client.
    if (description) window.history.replaceState(null, '', `/auth/callback${url.searchParams.get('recovery') === '1' ? '?recovery=1' : ''}`);
  }, []);
  useEffect(() => {
    if (ready && user && !recovery && !new URLSearchParams(window.location.search).has('recovery') && !error) window.location.replace('/?view=profile');
  }, [ready, user, recovery, error]);
  return <main className="account-callback"><section className="account-card"><a className="section-kicker" href="/">LinguAI Bridge</a><h1>{recovery ? 'Choose a new password.' : 'Connecting your account…'}</h1>
    {error && <p className="account-error" role="alert">{error}</p>}
    {!configured && <p>Account connection is not configured yet.</p>}
    {ready && !user && configured && <p>The link could not be completed. It may have expired or been opened in a different browser. Request a new link and open it on the same device.</p>}
    {ready && user && recovery && <form onSubmit={async e => { e.preventDefault(); const data = new FormData(e.currentTarget); if (data.get('password') !== data.get('confirm')) { setError('Passwords do not match.'); return; } setBusy(true); setError(''); try { const { error } = await supabase.auth.updateUser({ password: data.get('password') }); if (error) throw error; window.location.replace('/?view=profile'); } catch (e) { setError(accountError(e)); } finally { setBusy(false); } }}><label>New password<input type="password" name="password" required minLength={10} maxLength={128} autoComplete="new-password" /></label><label>Confirm password<input type="password" name="confirm" required minLength={10} maxLength={128} autoComplete="new-password" /></label><button className="account-primary" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button></form>}
    <a href="/?view=profile">Back to profile →</a>
  </section></main>;
}
