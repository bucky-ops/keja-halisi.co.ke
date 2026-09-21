#!/usr/bin/env bash
# ============================================================
# KEJA HALISI — STEP 3/3: Deploy to Vercel (production)
# ============================================================
# Usage:
#   bash scripts/deploy/03-vercel-deploy.sh [project-name]
#   (project name defaults to: keja-halisi)
#
# Requires:
#   • Vercel CLI  → install once with:  npm i -g vercel   (or: bunx vercel)
#   • A one-time browser login → `vercel login`
#
# What it does (safe to re-run):
#   1. Links this folder to the Vercel project
#   2. Uploads every var in .env.production.local as a Production env var
#   3. Runs `vercel --prod` and prints your live URL
#   4. Cron jobs (/api/cron/*) are already declared in vercel.json → nothing to do
set -euo pipefail

BLUE='\033[1;34m'; GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
step() { echo -e "${BLUE}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
die()  { echo -e "${RED}✗ $1${NC}"; exit 1; }

PROJECT="${1:-keja-halisi}"
ENV_FILE=".env.production.local"
[ -f "$ENV_FILE" ] || die "$ENV_FILE not found — run scripts/deploy/02-supabase-env.sh first"
command -v vercel >/dev/null 2>&1 || { export PATH="$HOME/.npm-global/bin:$PATH"; command -v vercel >/dev/null 2>&1 || die "Vercel CLI missing → run: npm i -g vercel && vercel login"; }

step "Linking Vercel project: $PROJECT"
vercel link --yes --project "$PROJECT" || die "vercel link failed — run 'vercel login' first"

step "Uploading environment variables (Production)"
UPLOADED=0
while IFS='=' read -r KEY VALUE; do
  KEY="$(echo "$KEY" | xargs)"; VALUE="${VALUE%\"}"; VALUE="${VALUE#\"}"
  [ -z "$KEY" ] && continue
  case "$KEY" in \#*) continue;; esac
  [ -z "$VALUE" ] && continue
  printf '%s' "$VALUE" | vercel env add "$KEY" production >/dev/null 2>&1 \
    && { ok "  $KEY ✓"; UPLOADED=$((UPLOADED+1)); } \
    || echo "  ⚠ $KEY skipped (may already exist — remove it in dashboard → Settings → Env)"
done < <(grep -vE '^\s*$' "$ENV_FILE" | grep -v '^#')
ok "$UPLOADED env vars uploaded"

step "Deploying to production (this builds on Vercel)"
vercel --prod || die "deployment failed — check the build log above"

echo ""
ok "STEP 3 DONE 🚀  $PROJECT is live"
echo "  • Verify:  curl -s https://<your-domain>/api/stats | head -c 200"
echo "  • Crons (already in vercel.json):"
echo "      03:00 UTC daily → /api/cron/expire-listings   (7-day expiry)"
echo "      06:00 UTC daily → /api/cron/nudge-availability (YES/NO SMS)"
echo "  • Custom domain: vercel domains add keja-halisi.co.ke  (or dashboard → Settings → Domains)"
