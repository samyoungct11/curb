-- Curb backend schema — run once in the Supabase SQL editor
-- (app.supabase.com → your project → SQL Editor → paste → Run).
--
-- The API routes access these tables with the SERVICE-ROLE key, which
-- bypasses row-level security; identity is enforced in api/_auth.ts by
-- verifying the caller's JWT and deriving user_id from it. RLS is still
-- enabled below as defense in depth: the browser-side ANON key gets no
-- policies, so it can read or write nothing here even if leaked.
--
-- Also required: Authentication → Sign In / Up → enable "Anonymous sign-ins"
-- (the app signs users in with supabase.auth.signInAnonymously()).

-- One row per connected bank login (a Plaid "Item").
create table if not exists plaid_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  access_token text not null, -- Plaid access token: server-side only, never sent to the browser
  item_id text unique not null,
  institution_name text,
  created_at timestamptz not null default now()
);

-- Plaid transactionsSync cursor, one per item (null cursor = first sync).
create table if not exists plaid_sync_cursors (
  plaid_item_id uuid primary key references plaid_items (id) on delete cascade,
  cursor text,
  last_synced_at timestamptz
);

-- Synced bank transactions, keyed by Plaid's transaction_id (upserts are idempotent).
create table if not exists transactions (
  id text primary key,
  user_id uuid not null,
  plaid_item_id uuid references plaid_items (id) on delete cascade,
  amount numeric not null, -- Plaid convention: positive = money out
  date date not null,
  merchant text,
  category text,
  raw_category text,
  pending boolean not null default false
);

create index if not exists transactions_user_date_idx
  on transactions (user_id, date desc);

create index if not exists plaid_items_user_idx
  on plaid_items (user_id);

-- No policies on purpose: deny-all for the anon key. The service-role key
-- used by api/* bypasses RLS.
alter table plaid_items enable row level security;
alter table plaid_sync_cursors enable row level security;
alter table transactions enable row level security;
