-- Run once in Supabase SQL Editor. No service-role key is used by the website.
begin;
create table if not exists public.practice_attempts (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  id text not null check (char_length(id) between 1 and 180),
  test_id text not null check (test_id ~ '^(single|practice)-(reading|listening)-[0-9]+$'),
  title text not null check (char_length(title) between 1 and 240),
  resource text not null check (resource in ('reading', 'listening')),
  correct integer not null check (correct >= 0),
  total integer not null check (total between 1 and 100),
  checked integer not null check (checked between 0 and total and correct <= checked),
  band text check (band is null or (total = 40 and checked = 40 and band in ('< 2.5','2.5','3.0','3.5','4.0','4.5','5.0','5.5','6.0','6.5','7.0','7.5','8.0','8.5','9.0'))),
  finished_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds between 0 and 86400),
  primary key (user_id, id)
);
create index if not exists practice_attempts_recent on public.practice_attempts(user_id, finished_at desc);
alter table public.practice_attempts enable row level security;
revoke all on public.practice_attempts from anon;
grant select, insert, update, delete on public.practice_attempts to authenticated;
drop policy if exists "Read own attempts" on public.practice_attempts;
create policy "Read own attempts" on public.practice_attempts for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Insert own attempts" on public.practice_attempts;
create policy "Insert own attempts" on public.practice_attempts for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Update own attempts" on public.practice_attempts;
create policy "Update own attempts" on public.practice_attempts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Delete own attempts" on public.practice_attempts;
create policy "Delete own attempts" on public.practice_attempts for delete to authenticated using ((select auth.uid()) = user_id);
commit;
