# Accounts and progress

The site has email/password sign-up, confirmation emails, email sign-in links, password recovery, Google OAuth, editable profiles, real Reading/Listening summaries, and result history. Public practice still works without signing in.

## Connect the existing Supabase project

1. Open the Supabase dashboard and select your project. In **Project Settings → Data API / API**, copy **Project URL**. It looks like `https://your-project.supabase.co`. Put that URL in `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`. This workspace now uses `https://sqqwcskghvdvqbdzvgoe.supabase.co`; the `/rest/v1/` suffix belongs to the Data API and is not included in the SDK project URL. Auth settings returned HTTP 200: email enabled, Google disabled. `practice_attempts` was not yet present when checked.
2. Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the **publishable** or legacy **anon** key from the same project. Never use a secret/service-role key in a `NEXT_PUBLIC_` variable. No project administrator key is required by the app.
3. Run [supabase/account-progress.sql](../supabase/account-progress.sql) in the project's SQL Editor. It creates the result table and row-level policies which restrict every operation to `auth.uid() = user_id`. There is no anonymous access. Profiles are stored as the authenticated user's editable Auth metadata; metadata is never used to grant permissions.
4. In **Authentication → URL Configuration**, set Site URL to your final HTTPS website. Add exact redirect URLs such as `http://localhost:3012/auth/callback` and `http://localhost:3012/auth/callback?recovery=1` for local development. Add the equivalent production URLs. Use the same hostname and port before and after sign-in. Do not add broad wildcard production redirects.
5. In **Authentication → Providers → Email**, enable email sign-up and email confirmations. Configure production SMTP and appropriate rate limits before launch. Password reset and email-link templates must retain Supabase's confirmation URL. Use a password policy of at least 10 characters in the dashboard as well as the UI.
6. In **Authentication → Providers → Google**, enable Google and supply the OAuth client ID and secret created in your Google Cloud project. Google Cloud's authorised redirect URI is the callback shown by Supabase, typically `https://your-project.supabase.co/auth/v1/callback`, **not** the Next.js `/auth/callback` URL. Configure your consent screen and test users while the Google app is in testing.
7. Rebuild/restart Next.js after environment changes. Run `node --env-file=.env.local scripts/check-next-env.js` to check the URL/key formats without printing values.

### Existing credential correction

The original `.env.local` had a publishable key in the URL field and a **secret** key in `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The publishable key has been moved into the correct public-key variable. The old secret has been preserved only in the server-side `SUPABASE_SECRET_KEY` variable; this application does not use it. **Rotate/revoke that old secret in Supabase**, because previous client builds may have included it. Rebuild and replace any previously served assets. Do not put the replacement secret in any `NEXT_PUBLIC_` variable.

Google setup: https://supabase.com/docs/guides/auth/social-sign-in/auth-google
Email setup: https://supabase.com/docs/guides/auth/passwords
PKCE: https://supabase.com/docs/guides/auth/sessions/pkce-flow

## Data and session behaviour

- The browser Supabase client handles PKCE, refresh, persisted sessions, and auth changes. `/auth/callback` completes SDK-managed code exchange. Email links must be opened in the browser where the request originated.
- The API for account operations is Supabase Auth (`signUp`, `signInWithPassword`, `signInWithOAuth`, `signInWithOtp`, `resetPasswordForEmail`, `updateUser`, `signOut`). Cloud results use the Supabase PostgREST API with the user's access token and RLS. No new unauthenticated custom account API is introduced.
- Profile: display name, target band, optional exam date, preferred explanation language, initials/avatar colour. Passwords are never saved in app storage or exported. No IP addresses are collected by application code.
- Submitted exam summaries contain test ID/title, module, correct/total/checked counts, indicative band, finish time and duration. Notes, text selections, audio, and answers are not uploaded. Results are personal practice data, not a tamper-proof official examination record.
- Finished results are queued in local storage per user and synced on submission, sign-in, reconnect, or Retry sync. Cloud history fetches the latest 1,000 results; local results are retained. Failed sync displays a message and keeps the local copy.
- Exam drafts are scoped to account ID. Guests retain the previous browser-local exam keys. Accounts cannot automatically inherit another account's drafts. Guest score history can be imported by an explicit button. Old pre-feature guest attempts are still available in their exam results; opening a submitted result adds its summary to guest history.
- Signing out ends the current browser's session. Account-specific local caches remain for the same user's next sign-in, but are not displayed for other users. Use a private browser on shared devices. This client app has no secret auth cookie/server session and does not gate the public practice catalogue.
- The default profile language is used when opening explanations; the review selector can override it for that review.
- Current scope: Reading/Listening attempt history; existing Speaking/Writing evaluator histories are not yet synced to this table.

## Verify after configuration

Create an email account, confirm email, edit the profile, reload, sign out/in, request a password reset, and open the email link in the same browser. Test Google with a consent-screen test account. Submit one single-section and one full practice; check that only the full 40-question result gets a band. Sign in on a second device and confirm the result history. With a second user, confirm neither account can read or update the other's rows (including direct PostgREST requests); verify guest drafts do not appear in either account automatically. Test an offline submission and Retry sync. Exported data must contain no tokens.

Automated local checks cover profile validation, redirect handling, history merging, guest UI, mocked Auth flows and account isolation. Real Google consent/email delivery and database RLS require the project settings above and must be checked against the connected project before calling account setup complete.
