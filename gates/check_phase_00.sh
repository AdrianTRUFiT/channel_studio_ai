#!/usr/bin/env bash
#
# gates/check_phase_00.sh — deterministic gate for PHASE 00 (Runtime Foundation).
#
# This script GOVERNS phase completion. Claude Code may build the foundation,
# but only a clean exit-0 run of this gate emits records/PHASE_00_PASS.md.
#
# It exits non-zero with diagnostics on any failure. It does NOT auto-write a
# FAIL record — FAIL records are emitted by the orchestrator/human after the
# bounded 3-attempt repair budget is exhausted (see README).

set -euo pipefail

PHASE="00"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

GATE="gates/check_phase_00.sh"
UTILS="gates/shared/gateUtils.ts"

step()  { printf '  [phase %s] %s\n' "$PHASE" "$1"; }
fail()  { printf '\nGATE FAIL (phase %s): %s\n' "$PHASE" "$1" >&2; exit 1; }

step "validating prior PASS (none required for PHASE 00)"
node "$UTILS" require-prior "$PHASE" || fail "prior-PASS check failed"

step "checking required directories"
for d in src agents workflows api gates hooks orchestrator records schemas tests mock archive; do
  [ -d "$d" ] || fail "missing directory: $d/"
done

step "checking required files"
REQUIRED_FILES=(
  CLAUDE.md
  README.md
  MISSION_CONTRACT.md
  package.json
  tsconfig.json
  orchestrator/runner.ts
  gates/shared/gateUtils.ts
  records/README.md
  schemas/phase.schema.json
  schemas/pass-record.schema.json
  schemas/fail-record.schema.json
  gates/check_phase_00.sh
  hooks/pre_phase_guard.sh
  hooks/stop_guard.sh
)
for f in "${REQUIRED_FILES[@]}"; do
  [ -f "$f" ] || fail "missing file: $f"
done

step "installing dependencies (npm install)"
if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund >/tmp/p00_install.log 2>&1 \
    || npm install --no-audit --no-fund >/tmp/p00_install.log 2>&1 \
    || fail "npm install failed; see /tmp/p00_install.log"
else
  npm install --no-audit --no-fund >/tmp/p00_install.log 2>&1 \
    || fail "npm install failed; see /tmp/p00_install.log"
fi

step "typechecking (npm run typecheck)"
npm run --silent typecheck >/tmp/p00_typecheck.log 2>&1 \
  || fail "typecheck failed:\n$(cat /tmp/p00_typecheck.log)"

step "validating runtime schemas"
node "$UTILS" validate-schemas >/tmp/p00_schemas.log 2>&1 \
  || fail "schema validation failed:\n$(cat /tmp/p00_schemas.log)"

step "smoke test: orchestrator status runs"
node orchestrator/runner.ts status >/tmp/p00_status.log 2>&1 \
  || fail "orchestrator status failed:\n$(cat /tmp/p00_status.log)"

step "smoke test: node --test (foundation unit test)"
npm test >/tmp/p00_test.log 2>&1 \
  || fail "unit tests failed:\n$(cat /tmp/p00_test.log)"

step "emitting PASS record"
HASHED_FILES="package.json,tsconfig.json,orchestrator/runner.ts,gates/shared/gateUtils.ts,src/phases.ts,schemas/phase.schema.json,schemas/pass-record.schema.json,schemas/fail-record.schema.json,gates/check_phase_00.sh,hooks/pre_phase_guard.sh,hooks/stop_guard.sh"
TEST_SUMMARY="npm install ok; tsc --noEmit clean; schemas valid; orchestrator status ok; node --test foundation suite passed"

node "$UTILS" emit-pass "$PHASE" --files "$HASHED_FILES" --tests "$TEST_SUMMARY" \
  || fail "could not emit PASS record"

step "verifying emitted PASS record validates"
node "$UTILS" validate-record "records/PHASE_${PHASE}_PASS.md" \
  || fail "emitted PASS record failed schema validation"

printf '\nGATE PASS (phase %s): records/PHASE_%s_PASS.md is valid.\n' "$PHASE" "$PHASE"
