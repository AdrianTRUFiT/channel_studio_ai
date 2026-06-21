#!/usr/bin/env bash
#
# gates/check_phase_01.sh — deterministic gate for PHASE 01 (Campaign Intake & State Model).
#
# Implements the governance contract from GitHub Issue #2:
#   1. Verify Phase 00 PASS is valid/current.
#   2. Validate Phase 01 schema/data.
#   3. Run typecheck/build/test.
#   4. Confirm app entry files exist.
#   5. Confirm the sample campaign has exactly 20 videos.
#   6. Emit records/PHASE_01_PASS.md only after success.
#   7. Verify the Phase 01 PASS record is valid/current.
#
# Exits non-zero with diagnostics on any failure. Does NOT auto-write a FAIL
# record (FAIL is emitted after the 3-attempt repair budget, see README).

set -euo pipefail

PHASE="01"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

GATE="gates/check_phase_01.sh"
UTILS="gates/shared/gateUtils.ts"
CAMPAIGN="data/campaigns/the-mind-is-a-computer.campaign.json"

step() { printf '  [phase %s] %s\n' "$PHASE" "$1"; }
fail() { printf '\nGATE FAIL (phase %s): %s\n' "$PHASE" "$1" >&2; exit 1; }

# 1. Prior PASS rule — Phase 00 must be valid AND current (content-hash verified).
step "verifying Phase 00 PASS is valid/current"
node "$UTILS" verify-pass-current 00 || fail "Phase 00 PASS is missing/stale; Phase 01 is locked"
node "$UTILS" require-prior "$PHASE" || fail "prior-PASS rule failed for Phase 01"

# Dependencies (root + web workspace) must be installed for build/test.
step "installing dependencies (npm install, workspaces)"
npm install --no-audit --no-fund >/tmp/p01_install.log 2>&1 \
  || fail "npm install failed; see /tmp/p01_install.log"

# 2. Validate Phase 01 schema/data (campaign + per-video + agent state + statusModel).
step "validating campaign schema/data"
node src/campaign/campaign.ts validate "$CAMPAIGN" >/tmp/p01_campaign.log 2>&1 \
  || fail "campaign validation failed:\n$(cat /tmp/p01_campaign.log)"

# 3a. Typecheck (governance runtime).
step "typechecking (npm run typecheck)"
npm run --silent typecheck >/tmp/p01_typecheck.log 2>&1 \
  || fail "typecheck failed:\n$(cat /tmp/p01_typecheck.log)"

# 3b. Tests (Phase 00 + Phase 01 suites).
step "running tests (npm test)"
npm test >/tmp/p01_test.log 2>&1 \
  || fail "tests failed:\n$(cat /tmp/p01_test.log)"

# 3c. Build the dashboard (vite build proves the product shell compiles).
step "building dashboard (vite build)"
npm run --silent build:web >/tmp/p01_build.log 2>&1 \
  || fail "dashboard build failed:\n$(tail -n 40 /tmp/p01_build.log)"

# 4. Confirm app entry files exist.
step "confirming dashboard entry files exist"
for f in web/index.html web/src/main.jsx web/src/App.jsx web/package.json web/vite.config.js; do
  [ -f "$f" ] || fail "missing dashboard entry file: $f"
done

# 5. Confirm the sample campaign has exactly 20 videos (independent of the validator).
step "confirming sample campaign has exactly 20 videos"
COUNT="$(node -e "const c=require('fs').readFileSync('$CAMPAIGN','utf8');process.stdout.write(String(JSON.parse(c).videos.length))")"
[ "$COUNT" = "20" ] || fail "campaign must have exactly 20 videos, found $COUNT"

# 6. Emit PASS record (append-only, idempotent).
step "emitting PASS record"
HASHED_FILES="data/campaigns/the-mind-is-a-computer.campaign.json,schemas/campaign.schema.json,schemas/video-asset.schema.json,schemas/agent-state.schema.json,src/campaign/status.ts,src/campaign/types.ts,src/campaign/campaign.ts,web/package.json,web/vite.config.js,web/index.html,web/src/main.jsx,web/src/App.jsx,gates/check_phase_01.sh,tests/phase_01.campaign.test.ts"
TEST_SUMMARY="Phase 00 current; campaign schema/data valid; exactly 20 videos; tsc --noEmit clean; node --test (Phase 00+01) passed; vite build ok"

node "$UTILS" emit-pass "$PHASE" --files "$HASHED_FILES" --tests "$TEST_SUMMARY" \
  || fail "could not emit PASS record"

# 7. Verify the emitted record is valid AND current.
step "verifying emitted PASS record schema"
node "$UTILS" validate-record "records/PHASE_${PHASE}_PASS.md" \
  || fail "emitted PASS record failed schema validation"

step "verifying PASS record is CURRENT against hashed outputs"
node "$UTILS" verify-pass-current "$PHASE" \
  || fail "emitted PASS record is not current (stale/mismatched content hash)"

printf '\nGATE PASS (phase %s): records/PHASE_%s_PASS.md is valid and current.\n' "$PHASE" "$PHASE"
