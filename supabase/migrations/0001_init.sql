-- ============================================================
-- KEJA HALISI — Supabase production migration (reference)
-- This sandbox runs Prisma + SQLite (see /prisma/schema.prisma).
-- This file is the exact Supabase/Postgres equivalent incl. RLS.
-- ============================================================

-- enums
create type user_role as enum ('Agent','Owner','Developer','Caretaker');
create type verification_status as enum ('pending','verified','rejected','gold','caretaker');
create type listing_status as enum ('Available','Taken','Reserved','Expired');
create type publish_state as enum ('draft','pending_review','approved','rejected','expired');
create type report_reason as enum ('Taken','FakePrice','ViewingFee','LocationFake','AlreadyRented','Repost');

-- estates — 6 boroughs x 17 sub-counties
create table estates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sub_county text not null,
  borough text not null,
  lat float,
  lng float,
  avg_price int
);
alter table estates enable row level security;
create policy "public read estates" on estates for select using (true);

-- agents (4 roles)
create table agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  role user_role default 'Agent',
  phone text unique,
  tiktok_handle text unique,
  verification_status verification_status default 'pending',
  badge text,
  id_encrypted text,          -- private vault
  selfie_url text,            -- private vault
  mandate_letter_url text,    -- private vault (Caretaker)
  mandate_estates jsonb,
  mandate_expiry date,
  response_time int default 30,
  rating float default 5.0,
  listings_count int default 0,
  bio text,
  created_at timestamp default now()
);
alter table agents enable row level security;
create policy "public read agents" on agents for select using (true);
create policy "agent updates own" on agents for update using (auth.uid() = user_id);

-- listings
create table listings (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid references agents(id),
  title text,
  tiktok_url text not null,
  estate text,
  sub_county text,
  borough text,
  road text,
  price int,
  deposit int,
  beds text,
  status listing_status default 'Available',
  publish_state publish_state default 'pending_review',
  amenities jsonb,
  lat float,
  lng float,
  distance_to_road_m int,
  weather_cache text,
  photos text[],
  ai_flags jsonb,
  reports_count int default 0,
  fee boolean default false,
  "freshH" int default 0,
  response_time int default 30,
  size_sqm int,
  floor text,
  views int default 0,
  exact_number_encrypted text,          -- PRIVATE VAULT — never public
  expires_at timestamp default now() + interval '7 days',
  created_at timestamp default now()
);
alter table listings enable row level security;
create policy "public read verified" on listings for select
  using (status='Available' and publish_state='approved');
create policy "poster updates own" on listings for update
  using (auth.uid() = (select user_id from agents where id = poster_id));
create policy "auth insert listings" on listings for insert
  with check (auth.role() = 'authenticated');

-- verifications (private vault refs)
create table verifications (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id),
  doc_type text,
  storage_ref text,
  status text default 'pending',
  reviewer uuid,
  reviewed_at timestamp,
  created_at timestamp default now()
);
alter table verifications enable row level security;
create policy "owner reads own verifications" on verifications for select
  using (auth.uid() = (select user_id from agents where id = agent_id));

-- reports — insert rate-limited at API; count only public
create table reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id),
  reporter_ref uuid,
  reason report_reason,
  details text,
  created_at timestamp default now()
);
alter table reports enable row level security;
create policy "count only public" on reports for select using (false);
create policy "auth insert reports" on reports for insert
  with check (auth.role() = 'authenticated');

-- leads — minimum necessary contact data
create table leads (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id),
  user_ref uuid,
  action text,
  phone_masked text,
  created_at timestamp default now()
);
alter table leads enable row level security;

-- developers
create table developers (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id),
  company_name text,
  proof_status text,
  projects jsonb,
  created_at timestamp default now()
);
alter table developers enable row level security;

-- units (developer inventory)
create table units (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid references developers(id),
  code text,
  beds text,
  price int,
  status text default 'Available',
  expires_at timestamp,
  created_at timestamp default now()
);
alter table units enable row level security;

-- audit_events — APPEND ONLY (no update / no delete, ever)
create table audit_events (
  id uuid primary key default gen_random_uuid(),
  actor text,
  action text,
  object text,
  object_id uuid,
  timestamp timestamp default now(),
  metadata jsonb
);
alter table audit_events enable row level security;
create policy "no update audit" on audit_events for update using (false);
create policy "no delete audit" on audit_events for delete using (false);

-- payments (M-Pesa simulated)
create table payments (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id),
  kind text default 'subscription',
  plan text,
  amount int,
  phone text,
  status text default 'pending',
  receipt text,
  created_at timestamp default now()
);
alter table payments enable row level security;

-- indexes
create index idx_listings_geo on listings (borough, sub_county, estate);
create index idx_listings_state on listings (status, publish_state);
create index idx_reports_listing on reports (listing_id);

-- expiry job (pg_cron in production; Vercel Cron hits /api/cron/expire-listings)
-- update listings set status='Expired', publish_state='expired'
--   where expires_at < now() and status='Available';
