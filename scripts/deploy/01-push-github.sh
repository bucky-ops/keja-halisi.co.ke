#!/usr/bin/env bash
# ============================================================
# KEJA HALISI — STEP 1/3: Push the repo to GitHub
# ============================================================
# Usage:
#   bash scripts/deploy/01-push-github.sh https://github.com/<your-username>/keja-halisi.co.ke.git
#
# What it does (safe to re-run):
#   1. Pre-flight: hygiene checks (no .env / *.db tracked)
#   2. Optionally creates the GitHub repo for you (needs `gh` CLI logged in)
#   3. Sets `origin` to your repo URL
#   4. Pushes `main` + ALL version tags (v0.0.1-init … v1.x)
set -euo pipefail

BLUE='\033[1;34m'; GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
step() { echo -e "${BLUE}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
die()  { echo -e "${RED}✗ $1${NC}"; exit 1; }

REPO_URL="${1:-${GH_REPO_URL:-}}"
[ -z "$REPO_URL" ] && die "Pass your repo URL:  bash scripts/deploy/01-push-github.sh https://github.com/<you>/keja-halisi.co.ke.git"
case "$REPO_URL" in *"<"*|*">"*) die "Replace <your-username> with your real GitHub username.";; esac

step "Pre-flight: no secrets tracked in git"
LEAKS="$(git ls-files | grep -E '^\.env$|\.db$|^db/' || true)"
[ -n "$LEAKS" ] && die "Sensitive files are tracked! Remove them first: $LEAKS"
ok "clean — .env, db/, *.db are not in the repo"

# ---- Optional: create the repo on GitHub if it doesn't exist yet ----
if command -v gh >/dev/null 2>&1; then
  GH_SLUG="${REPO_URL#*github.com*/}" ; GH_SLUG="${GH_SLUG%.git}"
  step "Checking GitHub repo $GH_SLUG"
  if gh repo view "$GH_SLUG" >/dev/null 2>&1; then
    ok "repo already exists"
  elif gh auth status >/dev/null 2>&1; then
    step "Creating public repo $GH_SLUG"
    gh repo create "$GH_SLUG" --public --description "Keja Halisi.co.ke — Nairobi TikTok rental anti-scam platform. Hakuna Kulipa Kabla Ya Kuona Nyumba." >/dev/null \
      && ok "repo created" || echo "  ⚠ could not create repo — create it manually on github.com/new"
  else
    echo "  (gh not logged in — create the repo manually at https://github.com/new)"
  fi
else
  echo "  (gh CLI not installed — create the repo manually at https://github.com/new if you haven't)"
fi

step "Setting git remote origin → $REPO_URL"
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"
ok "remote set"

step "Pushing main + all tags (this sends the whole phase history)"
git push -u origin main
git push origin --tags
ok "pushed. See commits + tags at: ${REPO_URL%.git}"

echo ""
ok "STEP 1 DONE → next: bash scripts/deploy/02-supabase-env.sh"
