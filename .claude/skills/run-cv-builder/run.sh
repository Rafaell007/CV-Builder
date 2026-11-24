#!/usr/bin/env bash
# Runs one or more Playwright scenario files against the real app (Next.js, NestJS, PostgreSQL) and keeps screenshots.
# Usage (from anywhere): .claude/skills/run-cv-builder/run.sh [scenario.spec.ts ...]
# Default scenario: smoke.spec.ts next to this file. Screenshots go to $RUN_OUT (default e2e/test-results/run-skill).
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SKILL_DIR/../../.." && pwd)"
# playwright.config.ts has `testDir: "."`, so a scenario must sit inside e2e/ to run. It is copied here and removed on exit.
TMP="$ROOT/e2e/zz-run-skill"
export RUN_OUT="${RUN_OUT:-$ROOT/e2e/test-results/run-skill}"

if [ $# -eq 0 ]; then set -- "$SKILL_DIR/smoke.spec.ts"; fi

cd "$ROOT"
docker compose up -d --wait

rm -rf "$TMP"
mkdir -p "$TMP" "$RUN_OUT"
trap 'rm -rf "$TMP"' EXIT
for spec in "$@"; do cp "$spec" "$TMP/"; done

# --no-deps skips the cvs-list project (it counts CV rows and takes a minute). The config builds and starts the backend
# on 4100 and the frontend on 3100, after emptying and seeding cv_builder_test. A running `pnpm dev` is never touched.
pnpm --filter @cv-builder/e2e exec playwright test zz-run-skill \
  --project=chromium --no-deps --workers=1 --reporter=list

echo "Screenshots: $RUN_OUT"
