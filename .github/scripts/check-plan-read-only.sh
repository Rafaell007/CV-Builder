#!/usr/bin/env bash
# Fails when a PR changes PLAN.md (above the §12 Progress log) or docs/pages/ without the label plan-change.
# Usage: check-plan-read-only.sh <base-ref>
set -euo pipefail

base="origin/$1"
progress_log='^## 12\. Progress log'
failed=0

if ! diff -q \
  <(git show "$base:PLAN.md" | sed "/$progress_log/,\$d") \
  <(sed "/$progress_log/,\$d" PLAN.md) >/dev/null; then
  echo "::error file=PLAN.md::PLAN.md changed above the Progress log. Add the label plan-change if this plan change is wanted."
  failed=1
fi

if ! git diff --quiet "$base"...HEAD -- docs/pages; then
  echo "::error::docs/pages/ changed. Add the label plan-change if this change is wanted."
  failed=1
fi

exit "$failed"
