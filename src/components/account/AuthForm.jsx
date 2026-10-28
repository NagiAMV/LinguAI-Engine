'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { safeNext } from '@/lib/account-model.mjs';
import { useAccount, accountError } from './AccountProvider';

export default function AuthForm() {
  const { configured } = useAccount();
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const callback = () => `${window.location.origin}/auth/callback`;
  const titles = { login: 'Welcome back.', signup: 'Your next chapter starts here.', magic: 'One link. You’re in.', reset: 'Let’s get you back in.' };
  function changeMode(next) { setMode(next); setError(''); setMessage(''); }
  async function google() {
    setBusy(true); setError(''); setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callback(), queryParams: { prompt: 'select_account' } } });
      if (error) throw error;
    } catch (e) { setError(accountError(e)); setBusy(false); }
  }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email')).trim();
    const password = String(form.get('password') || '');
    try {
      let result;
      if (mode === 'signup') {
        if (password.length < 10) throw Error('Use a password with at least 10 characters.');
        result = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: callback(), data: { display_name: String(form.get('name')).trim().slice(0, 60), target_band: 7, learning_language: 'en', avatar_color: 'sage' } } });
      } else if (mode === 'login') result = await supabase.auth.signInWithPassword({ email, password });
      else if (mode === 'magic') result = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: callback(), shouldCreateUser: true } });
      else result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${callback()}?recovery=1` });
      if (result.error) throw result.error;
      if (result.data?.session) window.location.assign(safeNext('/?view=profile'));
      else setMessage(mode === 'reset' ? 'If this email has an account, a password reset link is on its way. Open it in this browser.' : 'Check your email and open the confirmation link in this browser. It may take a moment to arrive.');
    } catch (e) { setError(accountError(e)); }
    finally { setBusy(false); }
  }
  return <section className="account-auth-card">
    <div className="account-auth-intro"><span className="account-brand-mark">L</span><p className="section-kicker">Your personal learning space</p><h2>{titles[mode]}</h2><p>Keep your results together, set your IELTS goal, and see your progress grow.</p><ul><li>Reading & Listening history</li><li>Your target band and exam date</li><li>Progress across your devices</li></ul><small>You can keep practising as a guest.</small></div>
    <div className="account-auth-form">
      <div className="account-tabs" role="group" aria-label="Account access"><button aria-pressed={mode !== 'signup'} onClick={() => changeMode('login')}>Sign in</button><button aria-pressed={mode === 'signup'} onClick={() => changeMode('signup')}>Create account</button></div>
      {!configured && <p className="account-notice" role="status">Account connection is being set up. Guest practice remains available. The site owner needs to configure the Supabase project URL.</p>}
      <button className="account-social" disabled={!configured || busy} onClick={google}><span className="google-letter" aria-hidden="true">G</span>Continue with Google</button>
      <div className="account-divider"><span>or with email</span></div>
      <form onSubmit={submit}>
        {mode === 'signup' && <label>Your name<input name="name" autoComplete="name" required maxLength={60} placeholder="What should we call you?" /></label>}
        <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" /></label>
        {['login', 'signup'].includes(mode) && <label>Password<div className="account-password"><input name="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={mode === 'signup' ? 10 : 1} maxLength={128} placeholder={mode === 'signup' ? 'At least 10 characters' : 'Your password'} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></div></label>}
        <button className="account-primary" disabled={!configured || busy}>{busy ? 'Please wait…' : ({ login: 'Sign in →', signup: 'Create account →', reset: 'Send reset link', magic: 'Email me a sign-in link' })[mode]}</button>
      </form>
      {error && <p className="account-error" role="alert">{error}</p>}{message && <p className="account-success" role="status">{message}</p>}
      <div className="account-text-actions"><button onClick={() => changeMode(mode === 'magic' ? 'login' : 'magic')}>{mode === 'magic' ? 'Use a password' : 'Sign in without a password'}</button><button onClick={() => changeMode('reset')}>Forgot password?</button></div>
      <small className="account-privacy">Your profile and results belong to your account. Passwords are handled by Supabase Auth.</small>
    </div>
  </section>;
}
