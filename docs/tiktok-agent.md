# KEJA HALISI — TikTok Ingest Agent

A web-based agent that automatically searches TikTok for Nairobi house
listings, verifies them, generates photos from the videos when none exist,
and publishes verified rows into the Keja Halisi catalog. Runs from the CLI,
from the 15-min sandbox cron, or hourly from GitHub Actions.

```
DISCOVER ──▶ RESOLVE ──▶ VERIFY ──▶ SNAPSHOT ──▶ STORE
  search       tikwm       6 gates     ffmpeg      link-only
  battery      metadata    (below)     frames      listing rows
```

## 1. Architecture (`scripts/agent-tiktok/`)

| Module | Role |
|---|---|
| `index.ts` | Orchestrator + CLI flags (`--live`, `--limit N`, `--seeds <file\|urls>`, `--no-snapshots`) |
| `search.ts` | **Discovery**: web-search battery (z-ai `web_search`) mines `tiktok.com/@h/video/<id>` links + `agent-seeds.txt` (always-available human path) |
| `resolve.ts` | **Resolution**: tikwm mirror → title, cover, `images[]` (photo posts), `play` mp4 URL, region, author, stats — LINKS ONLY |
| `verify.ts` | **Verification gates** (see §2) |
| `snapshot.ts` | **Photography**: photo posts → store image LINKS; video posts → ephemeral mp4 download (tmpfs, wiped) → ffmpeg scene-detection frames at room transitions, fallback fixed 25/50/75% timestamps → 540px JPEG |
| `store.ts` | **Storage**: Agent upsert (djb2 synthetic phone), link-only Listing row, Snapshot payloads, 7-day expiry, audit flags |

## 2. Verification gates (anti-scam core)

| Gate | Rule | On failure |
|---|---|---|
| G0 dedupe | videoId already in link index | reject (repost) |
| G1 region | tikwm region must be `KE` | reject |
| G2 rent signal | caption looks like a rental (rent/ksh/bedsitter…) | reject |
| G3 location | caption resolves to a **canonical catalog estate** (60 estates, aliasMap) | reject |
| G4 price | price parseable (`25k`, `Ksh 85,000`, `KES 12500`) | reject |
| G5 bait | price < 50% of estate avg → `pending_review` for a human admin | review |

Only fully-verified listings enter the public green catalog (`approved`).
Photo-less videos get **3 ffmpeg snapshots** stored in the `Snapshot` table and
linked from the listing as `/api/snapshots/<id>` (served immutable). The
listing table itself still obeys the LINK-ONLY law — URLs and tags only.

## 3. Running it

```bash
# DRY RUN — full pipeline, no writes
bun run agent:tiktok

# LIVE — write to whatever DATABASE_URL points at
bun run agent:tiktok --live --limit 8

# LIVE with seed links (from the TikTok app's search — copy video links in)
bun run agent:tiktok --live --seeds agent-seeds.txt

# Target production (Neon) from a machine with IPv4 + the pooled URL
export DATABASE_URL="postgresql://…neon…-pooler…/neondb?sslmode=require"
bunx prisma generate --schema prisma/schema.postgres.prisma
bun run agent:tiktok --live --limit 8
```

Sandbox note: the dev sandbox blocks IPv6 while DNS returns AAAA first, so
Prisma needs the IPv4 shim: `LD_PRELOAD=/tmp/force4.so` (rebuild:
`gcc -shared -fPIC -O2 -o /tmp/force4.so /tmp/force4.c -ldl`). GitHub
Actions runners don't need the shim.

## 4. Scheduled automation (GitHub Actions — recommended)

`.github/workflows/tiktok-agent.yml` runs the agent **hourly from GitHub's
runner IPs**, which are not behind the Cloudflare walls that block datacenter
IPs (TikTok mirrors wall our sandbox; GH runners get clean shots).

One-time setup in GitHub → Settings → Secrets and variables → Actions:

| Secret | Value |
|---|---|
| `DATABASE_URL` | Neon **pooled** string (`…-pooler…neon.tech/neondb?sslmode=require`) |
| `DIRECT_URL` | Neon **direct** string (`…neon.tech/neondb?sslmode=require`) |

Trigger it manually: repo → Actions → **tiktok-agent** → *Run workflow*.
The engine rotates which queries surface video links, so yield varies run to
run; commit extra links to `agent-seeds.txt` for guaranteed ingestion.

## 5. Where results show up

- **Home / estate pages** — verified listings with photo cards
  (photo-post images → external TikTok links; video posts → ffmpeg snapshots).
- **Admin console** (`/` → More → Admin, PIN gate) — bait-price ingests land
  in *Pending listings* for human review; new poster handles appear in
  *Verification queue* as `pending`.
- **Listing detail** — original TikTok embed (oEmbed, tap-to-play) + snapshot
  gallery.

## 6. How to update the repository with new code (brief guide)

```bash
# 1 — branch or commit straight to main (this project commits to main)
git add scripts/agent-tiktok .github/workflows/tiktok-agent.yml agent-seeds.txt docs/tiktok-agent.md
git commit -m "feat(agent): <what changed>"

# 2 — push (use a tokenized remote once, then clean it)
git push https://<token>@github.com/bucky-ops/keja-halisi.co.ke.git main
git remote set-url origin https://github.com/bucky-ops/keja-halisi.co.ke.git

# 3 — tag the release
git tag v1.6.0-tiktok-agent
git push https://<token>@github.com/bucky-ops/keja-halisi.co.ke.git v1.6.0-tiktok-agent
```

Pushing to `main` auto-deploys to Vercel (git-connected project). The Actions
workflow picks up secrets immediately after they're saved.
