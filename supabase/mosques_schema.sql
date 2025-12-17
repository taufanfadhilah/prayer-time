-- Run this in Supabase SQL Editor to create the mosques table.
-- Table: public.mosques

create extension if not exists "pgcrypto";

create table if not exists public.mosques (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location_id integer not null,
  fajr_time text null,
  footer_text text null,
  created_at timestamptz not null default now()
);

-- Optional: helpful index for ordering
create index if not exists mosques_created_at_idx on public.mosques (created_at desc);

-- SECURITY NOTE:
-- - For the quickest start, leave RLS OFF (default for new tables).
-- - For production, enable RLS and require Supabase Auth or a server-side API for writes.


