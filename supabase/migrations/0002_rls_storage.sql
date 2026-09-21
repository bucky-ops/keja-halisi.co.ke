-- ============================================================
-- KEJA HALISI — 0002: RLS policies + private storage buckets
-- Runs AFTER `bun run db:push:pg` (Prisma creates PascalCase tables
-- with quoted camelCase columns — no @map, so identifiers differ
-- from the snake_case reference in 0001_init.sql).
-- Safe to re-run (idempotent guards).
-- ============================================================

-- 1) Enable RLS everywhere (Prisma connects as table owner → unaffected;
--    anon/authenticated REST clients get the policies below)
alter table "Estate"      enable row level security;
alter table "Agent"       enable row level security;
alter table "Listing"     enable row level security;
alter table "Verification" enable row level security;
alter table "Report"      enable row level security;
alter table "Lead"        enable row level security;
alter table "Developer"   enable row level security;
alter table "Unit"        enable row level security;
alter table "AuditEvent"  enable row level security;
alter table "Review"      enable row level security;
alter table "Otp"         enable row level security;
alter table "Payment"     enable row level security;

-- 2) Public read surface (mirror of 0001_init.sql intent)
drop policy if exists "public read estates" on "Estate";
create policy "public read estates" on "Estate" for select using (true);

drop policy if exists "public read agents" on "Agent";
create policy "public read agents" on "Agent" for select using (true);

drop policy if exists "public read listings" on "Listing";
create policy "public read listings" on "Listing" for select
  using ("publishState" = 'approved' and "status" in ('Available','Reserved'));

drop policy if exists "public read reviews" on "Review";
create policy "public read reviews" on "Review" for select using (true);

-- Internal tables (Verifications, Reports, Leads, Developers, Units, Otp, Payments):
-- no SELECT policy → denied for anon/authenticated (minimum-necessary exposure).
-- The Next.js app reads them server-side as table owner (RLS not applied to owner).

-- 3) audit_events — APPEND ONLY (defense-in-depth; API layer also enforces)
drop policy if exists "no update audit" on "AuditEvent";
create policy "no update audit" on "AuditEvent" for update using (false);
drop policy if exists "no delete audit" on "AuditEvent";
create policy "no delete audit" on "AuditEvent" for delete using (false);

-- 4) Private storage vault buckets (never public)
insert into storage.buckets (id, name, public)
values
  ('verification-docs', 'verification-docs', false),
  ('mandate-letters',   'mandate-letters',   false),
  ('listing-photos',    'listing-photos',    false)
on conflict (id) do nothing;

-- Deny public object access on the private buckets (RLS on storage.objects)
drop policy if exists "vault deny public read" on storage.objects;
create policy "vault deny public read" on storage.objects for select
  using (bucket_id in ('verification-docs','mandate-letters') and false);
