# 🚀 KEJA HALISI.co.ke — Production Deploy Guide
### GitHub → Supabase → Vercel, in 3 steps

> **Hakuna Kulipa Kabla Ya Kuona Nyumba.** — the banner ships with the build.

---

## 📋 Your deployment card (fill these once)

| Item | Value |
|---|---|
| **Local project directory** | `/home/z/my-project` *(this repo — already a git repo with 13 version tags)* |
| **GitHub repository URL** | `https://github.com/<your-username>/keja-halisi.co.ke` *(you create it — step 1 can do it for you)* |
| **Supabase Project URL** | `https://<project-ref>.supabase.co` *(Dashboard → Settings → API)* |
| **Supabase anon key** | `eyJhbGciOi…` *(Settings → API → `anon` `public` — safe for the browser)* |
| **Supabase service_role key** | `eyJhbGciOi…` *(Settings → API → `service_role` — **secret**, server-only)* |
| **Supabase Postgres URLs** | Dashboard → **Connect** → copy *Connection pooler* (port 6543) + *Direct connection* (port 5432), insert your DB password |
| **Vercel project name** | `keja-halisi` |

**Fastest path — 3 commands** (details below):

```bash
bash scripts/deploy/01-push-github.sh  https://github.com/<your-username>/keja-halisi.co.ke.git
bash scripts/deploy/02-supabase-env.sh
bash scripts/deploy/03-vercel-deploy.sh
```

---

## ✅ Step 0 — Pre-flight (already done for you)

- [x] Git repo initialized, `main` branch, **13 tags** (`v0.0.1-init` → `v1.4.0-*`)
- [x] **Security hygiene**: `.env`, `db/*.db`, sandbox artifacts are **not tracked** (verified — nothing secret can leak)
- [x] `.env.example` committed — the exact env-var template Vercel needs
- [x] `vercel.json` committed — Next.js framework preset + **2 cron jobs** (expiry 03:00 UTC, nudge 06:00 UTC)
- [x] `supabase/migrations/0001_init.sql` — full production SQL incl. **RLS policies** + append-only audit
- [x] `prisma/schema.postgres.prisma` — Postgres twin of the SQLite dev schema (+ `db:push:pg` / `db:seed:pg` scripts)
- [x] `postinstall: prisma generate` in `package.json` — so Vercel builds pass automatically

---

## 1️⃣ STEP 1 — Push the project to GitHub

**Option A — one command (recommended)**

```bash
bash scripts/deploy/01-push-github.sh https://github.com/<your-username>/keja-halisi.co.ke.git
```

The script: checks no secrets are tracked → (optionally creates the repo via `gh`) → sets `origin` → pushes `main` **and all version tags**.

**Option B — manual bullets (same thing)**

- Create the repo: github.com → **New repository** → name `keja-halisi.co.ke` → Public → *don't* add a README (we have one)
- Link + push:

```bash
cd /home/z/my-project
git remote add origin https://github.com/<your-username>/keja-halisi.co.ke.git
git push -u origin main        # the app
git push origin --tags         # v0.0.1-init … v1.x phase history
```

✔ **Checkpoint**: open the repo on github.com — you see `src/`, `prisma/`, `supabase/`, `vercel.json`, `DEPLOY.md`, and the tag list. You do **not** see `.env` or `db/`.

---

## 2️⃣ STEP 2 — Connect the project to Supabase

### 2a. Create the project
- supabase.com → **New project** → name `keja-halisi` → pick region **eu-central-1** (matches `vercel.json` fra1) → set a strong **DB password** (save it!)

### 2b. Create the tables (pick ONE)

- **Prisma route (recommended — matches the app code):**

```bash
bash scripts/deploy/02-supabase-env.sh   # interactive: pastes URL + keys + DB URLs, tests, writes .env.production.local,
                                         # runs bun run db:push:pg (creates tables) + bun run db:seed:pg (29 estates, 18 listings)
```

- **SQL route:** Dashboard → **SQL Editor** → paste `supabase/migrations/0001_init.sql` → **Run**. This also creates the **RLS policies** (public reads only `Available + approved` listings; `audit_events` is append-only).

### 2c. Create the 3 private storage buckets
Dashboard → **Storage** → New bucket (each one, **toggle OFF "Public bucket"**):
- `verification-docs` — IDs + selfies
- `mandate-letters` — Caretaker mandates
- `listing-photos` — evidence clips thumbnails

### 2d. Copy your keys
Settings → **API**: `Project URL`, `anon public`, `service_role` (this one is **secret — server only, never in the browser**).

✔ **Checkpoint**: `bun run db:seed:pg` printed "Seeded" and Table Editor shows `estates` (29 rows), `agents`, `listings`.

---

## 3️⃣ STEP 3 — Deploy the project on Vercel

**Option A — dashboard import (most common)**

- vercel.com → **Add New → Project** → **Import** your `keja-halisi.co.ke` GitHub repo
- Framework preset auto-detects **Next.js** — leave build settings default
- **Environment Variables** — add (Production):

| Key | Value | Notes |
|---|---|---|
| `DATABASE_URL` | pooled Postgres URL (**port 6543**, `?pgbouncer=true&connection_limit=1`) | required |
| `DIRECT_URL` | direct Postgres URL (**port 5432**) | used by Prisma migrations |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | required |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | required, server-only |
| `TIKTOK_OEMBED_URL` | `https://www.tiktok.com/oembed` | optional (mock fallback built-in) |
| others (`GOOGLE_MAPS_KEY`, `OPENWEATHER_KEY`, `AFRICASTALKING_API_KEY`, `GEMINI_API_KEY`, `MPESA_*`, `TRUECALLER_API_KEY`) | leave empty for now | every integration has a safe sandbox mock until you add real keys |

- Click **Deploy** → wait ~2 min → 🎉 live URL `keja-halisi.vercel.app`

**Option B — one command (uploads the same vars from `.env.production.local` for you)**

```bash
npm i -g vercel && vercel login        # once
bash scripts/deploy/03-vercel-deploy.sh keja-halisi
```

### 3a. Cron jobs — nothing to do
`vercel.json` already registers them on deploy:
- `0 3 * * *` → `/api/cron/expire-listings` (7-day auto-expiry)
- `0 6 * * *` → `/api/cron/nudge-availability` ("Is keja still available? YES/NO")

### 3b. Custom domain
Dashboard → Project → **Settings → Domains** → add `keja-halisi.co.ke` → at your registrar point DNS:
- `A` record `@` → `76.76.21.21`
- `CNAME` `www` → `cname.vercel-dns.com`

---

## 🩺 Step 4 — Post-launch checklist (5 minutes)

```bash
curl -s https://<your-domain>/api/stats          # {"totalAgents":…} → API + DB live
```

- [ ] Homepage shows the **"Hakuna Kulipa Kabla Ya Kuona Nyumba"** banner
- [ ] Marketplace filter works (e.g. borough **Western** → Kileleshwa cards)
- [ ] Open a listing → **Call Agent** → phone is masked `07** *** 123` until reveal
- [ ] **Report Scam** modal submits (3rd report auto-hides the listing)
- [ ] Payments → STK modal shows **"STK Push simulated • no real payment was made"**
- [ ] Vercel → **Cron Jobs** tab shows both jobs with "Success"

---

## 🔧 Troubleshooting

| Symptom | Fix |
|---|---|
| Build fails with `PrismaClientInitializationError` | `DATABASE_URL` must be the **pooled 6543** URL on Vercel; `DIRECT_URL` the 5432 one |
| `P1001 can't reach database` | append `?pgbouncer=true&connection_limit=1` to the pooled URL; check project region |
| Empty marketplace | run the seed: `bun run db:seed:pg` (or SQL `0001_init.sql` + demo inserts) |
| `401` on `/api/cron/*` from Vercel Cron | expected in dev; on Vercel the `x-vercel-cron` header is set automatically |
| Repo push rejected | you have a remote named `origin` already → `git remote set-url origin <url>` |

---

*Everything above is idempotent — safe to re-run. Keys live only in `.env.production.local` (gitignored) and Vercel's encrypted env store.*
