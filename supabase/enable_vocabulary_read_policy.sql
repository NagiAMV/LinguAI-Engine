-- LinguAI Bridge
-- Allow the Next.js frontend to read vocabulary rows with the Supabase anon key.
--
-- Run this in Supabase SQL Editor if Row Level Security is enabled for
-- public.vocabulary.

ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to vocabulary"
    ON public.vocabulary
    FOR SELECT
    TO anon
    USING (true);
