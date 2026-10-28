'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AVATAR_COLORS, attemptRoute, initials, progressSummary } from '@/lib/account-model.mjs';
import { useAccount, accountError } from './AccountProvider';
import AuthForm from './AuthForm';

export function ProgressCards({ attempts }) {
  const stats = progressSummary(attempts);
  return <div className="account-progress">{['reading', 'listening'].map(skill => <section key={skill} className={`account-progress-card ${skill}`}><p className="section-kicker">{skill}</p><h3>{stats[skill].latestBand || '—'}<small> latest estimated band</small></h3><div className="account-progress-track"><i style={{ width: `${stats[skill].accuracy || 0}%` }} /></div><p><b>{stats[skill].accuracy === null ? 'No results yet' : `${stats[skill].accuracy}% correct`}</b><span>{stats[skill].count} attempts</span></p><small>Band estimates use complete 40-question tests.</small></section>)}</div>;
}
export default function ProfileView() {
  const { user, ready, profile, attempts, saveProfile, signOut, syncMessage, syncing, refreshAttempts, importGuestAttempts } = useAccount();
  const [draft, setDraft] = useState(profile);
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  useEffect(() => { setDraft(profile); }, [user]);
  useEffect(() => { try { setGuestCount(JSON.parse(localStorage.getItem('linguai-attempts-v1:guest') || '[]').length); } catch {} }, [user]);
  async function action(fn, success) {
    setBusy(true); setMessage(''); setError('');
    try { await fn(); setMessage(success); } catch (e) { setError(accountError(e)); } finally { setBusy(false); }
  }
  function exportData() {
    const blob = new Blob([JSON.stringify({ profile, email: user.email, attempts: attempts.map(({ synced, ...a }) => a) }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'linguai-my-progress.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (!ready) return <main className="view-content" role="status">Loading your profile…</main>;
  if (!user) return <main className="view-content account-view"><AuthForm /><ProgressCards attempts={attempts} /><p className="account-caption">Guest results are saved in this browser. Sign in to keep future results with your account.</p></main>;
  const visible = attempts.filter(a => filter === 'all' || a.resource === filter);
  return <main className="view-content account-view">
    <header className="account-heading"><div><p className="section-kicker">Your learning passport</p><h1>Make it yours<span>.</span></h1><p>A clear goal. Every attempt. Your own pace.</p></div><button className="account-secondary" disabled={busy} onClick={() => action(signOut, '')}>Sign out ↗</button></header>
    <div className="account-profile-grid"><section className="account-card"><div className="account-identity"><div className={`account-avatar ${draft.avatar}`}>{initials(draft.name)}</div><div><h2>{profile.name || 'Your profile'}</h2><p>{user.email}</p><small>{user.email_confirmed_at ? '✓ Email confirmed' : 'Email confirmation pending'}</small></div></div>
      <form onSubmit={e => { e.preventDefault(); action(() => saveProfile(draft), 'Profile saved.'); }}>
        <label>Display name<input value={draft.name} required maxLength={60} autoComplete="name" onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
        <div className="account-form-row"><label>Target IELTS band<select value={draft.targetBand} onChange={e => setDraft({ ...draft, targetBand: Number(e.target.value) })}>{Array.from({ length: 17 }, (_, n) => 1 + n * .5).map(b => <option key={b} value={b}>{b.toFixed(1)}</option>)}</select></label><label>Exam date (optional)<input type="date" value={draft.examDate} onChange={e => setDraft({ ...draft, examDate: e.target.value })} /></label></div>
        <label>Preferred explanation language<select value={draft.language} onChange={e => setDraft({ ...draft, language: e.target.value })}><option value="en">English</option><option value="ru">Русский</option><option value="uz">O‘zbekcha</option></select></label>
        <fieldset className="account-colors"><legend>Avatar colour</legend>{AVATAR_COLORS.map(color => <button key={color} className={`account-color ${color}`} type="button" aria-label={`${color} avatar`} aria-pressed={draft.avatar === color} onClick={() => setDraft({ ...draft, avatar: color })}>{draft.avatar === color ? '✓' : ''}</button>)}</fieldset>
        <button className="account-primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
      </form>
    </section><aside className="account-goal-card"><p className="section-kicker">The next chapter</p><strong>{Number(profile.targetBand).toFixed(1)}</strong><span>Your target IELTS band</span><p>{profile.examDate ? `Exam date · ${new Date(`${profile.examDate}T12:00:00`).toLocaleDateString()}` : 'One focused session brings you closer.'}</p><a href="/?view=listening">Keep practising →</a><div className="account-connected"><small>Sign-in methods</small>{(user.identities || []).map(i => <span key={i.id}>{i.provider === 'email' ? 'Email' : i.provider === 'google' ? 'Google' : i.provider} ✓</span>)}</div></aside></div>
    {error && <p role="alert" className="account-error">{error}</p>}{message && <p role="status" className="account-success">{message}</p>}
    <ProgressCards attempts={attempts} />
    <section className="account-card account-history"><div className="account-section-heading"><div><p className="section-kicker">Proof of progress</p><h2>Your attempts</h2></div><label>Skill<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All skills</option><option value="reading">Reading</option><option value="listening">Listening</option></select></label></div>
      <p className="account-sync" role="status">{syncing ? 'Syncing your history…' : syncMessage || 'Your results are saved to your account.'} <button onClick={refreshAttempts} disabled={syncing}>Retry sync</button></p>
      {guestCount > 0 && <div className="account-import"><span>{guestCount} guest results are also on this device.</span><button disabled={busy} onClick={() => action(importGuestAttempts, 'Guest results added to this account.')}>Import guest results</button></div>}
      {visible.length ? <div className="account-table-scroll"><table><thead><tr><th>Practice</th><th>Score</th><th>Band estimate</th><th>Completed</th><th>Saved</th></tr></thead><tbody>{visible.map(a => <tr key={a.id}><td><a href={attemptRoute(a)}>{a.title} ↗</a><small>{a.resource}</small></td><td>{a.correct} / {a.total}{a.checked < a.total && <small>{a.total - a.checked} not checked</small>}</td><td>{a.band || '—'}</td><td>{new Date(a.finished_at).toLocaleDateString()}<small>{Math.floor(a.duration_seconds / 60)} min</small></td><td>{a.synced ? 'Cloud ✓' : 'This device'}</td></tr>)}</tbody></table></div> : <div className="account-empty"><span>↗</span><h3>Your first result starts the story.</h3><p>Finish a Reading or Listening practice and it will appear here.</p><a href="/?view=reading">Choose a practice →</a></div>}
    </section>
    <section className="account-card account-security"><div><p className="section-kicker">Account & security</p><h2>You’re in control.</h2><p>Download your profile and scores, or update your password.</p></div><div className="account-security-actions"><button className="account-secondary" onClick={exportData}>Export my data ↓</button><button className="account-secondary" onClick={() => setPasswordOpen(!passwordOpen)}>Set / change password</button></div>
      {passwordOpen && <form onSubmit={e => { e.preventDefault(); const password = new FormData(e.currentTarget).get('password'); action(async () => { const { error } = await supabase.auth.updateUser({ password }); if (error) throw error; setPasswordOpen(false); }, 'Password updated.'); }}><label>New password<input type="password" name="password" autoComplete="new-password" minLength={10} maxLength={128} required placeholder="At least 10 characters" /></label><button className="account-primary" disabled={busy}>Update password</button></form>}
    </section>
  </main>;
}
