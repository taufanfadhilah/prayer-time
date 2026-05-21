-- Run this in Supabase SQL Editor to create the global_config table.
-- Table: public.global_config
-- Single-row table (id always = 1) for site-wide settings.

create table if not exists public.global_config (
  id integer primary key default 1,
  hijri_day_offset integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

-- Seed the one config row (safe to run multiple times)
insert into public.global_config (id, hijri_day_offset)
values (1, 0)
on conflict (id) do nothing;

-- RLS: keep off to match the mosques table pattern (anon key has full access)
-- If you want to restrict writes to authenticated users only, enable RLS and
-- add policies here.
