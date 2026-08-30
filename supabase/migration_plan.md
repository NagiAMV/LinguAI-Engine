# LinguAI Bridge: Supabase Migration Plan

This document tracks the migration of the local vocabulary dataset to Supabase.

## Current Project State

- Local dataset: `data/vocabulary_base.json`
- Dataset size: 244 unique vocabulary cards
- Validator script: `validate_json.py`
- Target database: Supabase PostgreSQL
- Target table: `public.vocabulary`

## JSON Card Structure

Each vocabulary card must contain these required fields:

- `word`
- `grammar`
- `word_formation`
- `definition`
- `synonyms`
- `ielts_level`
- `category`
- `status`

The `synonyms` field must be a list of strings.

## Step 1: Create Supabase Table

SQL file:

```text
supabase/create_vocabulary_table.sql
```

The table includes:

- `id` as an auto-incrementing primary key
- JSON-matched fields from the local dataset
- `synonyms` as `TEXT[]`
- `created_at` as an automatic timestamp
- `last_reviewed` as a future review-tracking timestamp
- indexes for filtering by category, status, IELTS level, and synonyms

Run this file in:

```text
Supabase Dashboard -> SQL Editor -> Run
```

## Step 2: Create Python Migration Script

Planned file:

```text
migrate_to_supabase.py
```

The script should:

- import `supabase`
- read `SUPABASE_URL` from environment variables
- read `SUPABASE_KEY` from environment variables
- load `data/vocabulary_base.json`
- support both possible JSON shapes:
  - a root list: `[{...}, {...}]`
  - an object with a `data` key: `{ "data": [{...}, {...}] }`
- normalize records before upload
- bulk insert all vocabulary cards into `public.vocabulary`
- print clear success and error logs

## Step 3: Configure Environment Variables

Required variables:

```text
SUPABASE_URL
SUPABASE_KEY
```

Recommended local setup:

```text
.env
```

Do not commit real Supabase keys to Git.

## Step 4: Install Python Dependency

```bash
pip install supabase
```

Optional, if using `.env` loading:

```bash
pip install python-dotenv
```

## Step 5: Run Local Validation

```bash
python validate_json.py
```

Expected result:

- JSON syntax is valid
- required fields are present
- `synonyms` is a list
- words are unique

## Step 6: Run Migration

```bash
python migrate_to_supabase.py
```

Expected result:

- 244 records are inserted into Supabase
- console logs show the number of inserted rows
- errors, if any, are printed with useful details

## Step 7: Verify in Supabase

Run in Supabase SQL Editor:

```sql
SELECT COUNT(*) FROM public.vocabulary;
```

Expected result:

```text
244
```

Optional spot check:

```sql
SELECT id, word, ielts_level, category, status
FROM public.vocabulary
ORDER BY id
LIMIT 10;
```

## Step 8: Connect Next.js Frontend

After migration, the frontend can read from the `vocabulary` table using:

- Supabase client in Next.js
- server-side data fetching
- API routes or server actions, depending on the app structure

Recommended first frontend features:

- list vocabulary cards
- filter by `category`
- filter by `ielts_level`
- filter by `status`
- search by `word`
