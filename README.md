# KEJA HALISI.co.ke — Real House Verified

**Nairobi TikTok Rental Anti-Scam Platform.** Stop scrolling fake kejas. Only verified TikTok houses in Nairobi.

> **Hakuna Kulipa Kabla Ya Kuona Nyumba.** — No paying before you see the house.

---

## 🛡️ ANTI-SCAM RULES (PRODUCT LAW — non-negotiable)

| Rule | Enforcement |
|---|---|
| **No viewing fee before viewing** | Asking a fee before a physical viewing = report → review → **ban**. Red fee-warning banner on any listing with a fee signal. |
| **Exact house number hidden** | Public UI shows **estate + road only** (e.g. "Kileleshwa • Othaya Rd"). Exact door number lives encrypted in the private vault. |
| **Phone masked until contact** | Numbers render as `07** *** 123`. Tapping **Call / WhatsApp** logs a lead (masked) and only then reveals contact. |
| **ID docs → private vault** | IDs, selfies and mandate letters live in the private `verification-docs` / `mandate-letters` buckets. Never rendered publicly. |
| **3 reports = auto-hide** | On the 3rd report the listing auto-hides (`publish_state → rejected`) and queues admin review. |
| **Evidence checklist required** | Outside • Gate • Inside • Water running • Window view — publish is blocked until all 5 are checked. |
| **7-day expiry + re-check** | Listings auto-expire after 7 days; availability nudge SMS "Is keja still available? Reply YES/NO" before expiry. |

---

## 🏙️ COVERAGE — 6 Boroughs × 17 Sub-counties (configurable)

| Borough | Sub-counties | Estates |
|---|---|---|
| Western | Westlands • Dagoretti North • Dagoretti South | Kileleshwa 28k-45k • Lavington 35k-60k • Parklands • Kangemi • Kawangware |
| Southern | Langata • Kibra | Karen 50k+ • South C 22k-35k • Langata |
| Central | Starehe • Kamukunji • Mathare | Ngara 12k-20k • Pangani • Eastleigh |
| Eastern | Embakasi North/West/Central | Umoja 10k-16k • Buruburu 15k-22k • Donholm |
| South Eastern | Embakasi South/East • Makadara | Pipeline 7k-12k • Utawala 9k-15k • Syokimau 15k-25k |
| Northern | Ruaraka • Roysambu • Kasarani | Kasarani 10k-18k • Roysambu • Zimmerman • Githurai 6k-10k |

---

## 👥 4 ROLES

- **Agent** — lists many estates • commission • 2 old TikTok videos + 2 referrals
- **Owner** — owns unit • direct • ID + KPLC bill matching name
- **Developer** — multiple units • M-Pesa Till • Title/Lease + company reg
- **Caretaker** — estate-limited • **owner mandate letter required** • cannot list outside mandate

## ✅ Verification levels

1. **Basic** — OTP + phone age (Africa's Talking + Truecaller >6 months)
2. **Verified** 🟢 — ID + selfie face-match (private vault)
3. **Trusted** — role evidence (mandate / KPLC / title deed)
4. **Gold** 👑 (optional) — KRA PIN / Business Reg + Pro subscription

## 💚 Trust pills

`✓ Verified Green` · `No Viewing Fee Blue` · `Reported Red` · `Fresh ≤24h` · `Response ~Xmin`

---

## 🧱 TECH STACK

- **Next.js 16 App Router + TypeScript strict**
- **Tailwind CSS 4 + shadcn/ui** (New York) — Sora Bold headings / Inter body / 24px rounded cards / 44px touch targets
- **Prisma + SQLite** (this sandbox) → **Supabase Postgres** in production (`/supabase/migrations/0001_init.sql` has the exact SQL incl. RLS)
- **TikTok oEmbed** — legal iframe embed, never re-uploads creator media
- **M-Pesa Daraja STK** — simulated (no real payment)
- Africa's Talking OTP (mock) · Google Distance Matrix (mock) · OpenWeather (mock) · Gemini Vision caption parse (mock) · Truecaller age check (mock)

## 🚀 RUN

```bash
bun install
bun run db:push       # prisma schema → sqlite
bun run scripts/seed.ts
bun run dev           # http://localhost:3000
```

## 📦 Phase tags

| Tag | Phase |
|---|---|
| `v0.0.1-init` | Repo init, schema, seed, design tokens |
| `v0.1.0-phase1-marketplace` | Home, estate browse, listing detail, trust filters |
| `v0.2.0-phase2-verification` | 4 roles, OTP, ID+selfie, mandate, agent profiles |
| `v0.3.0-phase3-trust` | Evidence checklist, reports auto-hide, expiry cron, phone masking |
| `v0.4.0-phase4-owner-dev-caretaker` | Dashboards: projects, units, leads, caretaker permissions |
| `v0.5.0-phase5-payments` | M-Pesa STK simulation, subscriptions, wallet, escrow |
| `v0.6.0-phase6-maps-analytics` | Map pins, distance-to-road, weather, market pulse trends |
| `v0.7.0-phase7-ai-moderation` | Caption parsing, repost detection, bait alerts, moderation queue |
| `v0.8.0-phase8-scale` | Rate limiting, audit trail, responsive QA, low-data toggle |

## 🔐 ENVIRONMENT

See `.env.example`. Supabase production secrets (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) are **server-only**. Never expose service keys to the client.

## 📜 License & content

- TikTok videos are embedded via official **oEmbed iframes** — creator media is never re-uploaded.
- Demo data: real estate names + realistic KES prices; agents, phones and metrics are illustrative.
