#!/usr/bin/env bash
#
# gates/check_phase_03.sh — deterministic gate for PHASE 03
# (External Creative Production Adapter).
#
# Proves: one campaign video record converts into a complete, OFFLINE
# polished-production package (script, storyboard, prompts, voiceover, animation
# direction, adapter payloads, render request, human review gate) with adapter
# CONTRACTS first and NO live/paid API calls. Live render is
# LIVE-INTEGRATION-BLOCKED; nothing is published; Phase 04 stays locked.
#
# Exits non-zero with diagnostics on any failure.

set -euo pipefail

PHASE="03"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

UTILS="gates/shared/gateUtils.ts"
VIDEO="MIAC-01"
PKG_DIR="outputs/production/${VIDEO}"
MANIFEST="${PKG_DIR}/package.json"

step() { printf '  [phase %s] %s\n' "$PHASE" "$1"; }
fail() { printf '\nGATE FAIL (phase %s): %s\n' "$PHASE" "$1" >&2; exit 1; }

# 1. Prior PASS rule — Phase 02 must be valid AND current.
step "verifying Phase 02 PASS is valid/current"
node "$UTILS" verify-pass-current 02 || fail "Phase 02 PASS is missing/stale; Phase 03 is locked"
node "$UTILS" require-prior "$PHASE" || fail "prior-PASS rule failed for Phase 03"

step "installing dependencies (npm install)"
npm install --no-audit --no-fund >/tmp/p03_install.log 2>&1 || fail "npm install failed; see /tmp/p03_install.log"

# 2. Typecheck.
step "typechecking (npm run typecheck)"
npm run --silent typecheck >/tmp/p03_typecheck.log 2>&1 || fail "typecheck failed:\n$(cat /tmp/p03_typecheck.log)"

# 3. Tests.
step "running tests (npm test)"
npm test >/tmp/p03_test.log 2>&1 || fail "tests failed:\n$(cat /tmp/p03_test.log)"

# 4. Adapter CONTRACTS valid and all LIVE-INTEGRATION-BLOCKED (contracts first).
step "validating adapter contracts (HeyGen, Higgsfield, Canva, Voiceover)"
node src/adapters/validate.ts contracts >/tmp/p03_contracts.log 2>&1 \
  || fail "adapter contract validation failed:\n$(cat /tmp/p03_contracts.log)"
cat /tmp/p03_contracts.log | sed 's/^/    /'

# 5. Build the production package for ONE video (no batching).
step "building external-production package for ${VIDEO} (offline, one video)"
node scripts/build_production_package.ts --video "$VIDEO" >/tmp/p03_build.log 2>&1 \
  || fail "production package build failed:\n$(tail -n 40 /tmp/p03_build.log)"

# 6. Manifest exists and validates (asserts blocked + not published).
step "validating production package manifest"
[ -f "$MANIFEST" ] || fail "manifest not found: $MANIFEST"
node src/production/productionPackage.ts validate "$MANIFEST" >/tmp/p03_manifest.log 2>&1 \
  || fail "manifest validation failed:\n$(cat /tmp/p03_manifest.log)"
cat /tmp/p03_manifest.log | sed 's/^/    /'

# 7. All required artifacts present.
step "confirming all package artifacts exist"
REQUIRED=(
  "research.json" "blueprint.json"
  "script-package.json" "SCRIPT.md" "storyboard.json" "visual-prompt-pack.json"
  "voiceover-script.json" "animation-direction.json" "review-package.json" "REVIEW.md"
  "render-request.json" "publish-package.json"
  "adapters/heygen.payload.json" "adapters/higgsfield.payload.json"
  "adapters/canva.payload.json" "adapters/voiceover.payload.json"
)
for f in "${REQUIRED[@]}"; do
  [ -f "${PKG_DIR}/${f}" ] || fail "missing package artifact: ${PKG_DIR}/${f}"
done

# 8. Each adapter payload validates and is blocked/dry-run/not-published.
step "validating each adapter payload (offline, blocked, not published)"
for f in "${PKG_DIR}"/adapters/*.payload.json; do
  node src/adapters/validate.ts payload "$f" >/tmp/p03_payload.log 2>&1 \
    || fail "adapter payload invalid ($f):\n$(cat /tmp/p03_payload.log)"
done
step "  all 4 adapter payloads valid and LIVE-INTEGRATION-BLOCKED"

# 9. Assert no live call happened: review Pending + blocking, nothing published.
step "asserting human review gate is Pending/blocking and nothing was published"
node -e '
  const fs=require("fs");
  const m=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
  if(m.published!==false){console.error("published must be false");process.exit(1);}
  if(m.liveStatus!=="LIVE-INTEGRATION-BLOCKED"){console.error("liveStatus must be blocked");process.exit(1);}
  if(m.review.decision!=="Pending"||m.review.blocking!==true){console.error("review must be Pending+blocking");process.exit(1);}
  console.log("review Pending+blocking; liveStatus blocked; published=false");
' "$MANIFEST" >/tmp/p03_assert.log 2>&1 || fail "safety assertion failed:\n$(cat /tmp/p03_assert.log)"
cat /tmp/p03_assert.log | sed 's/^/    /'

# 9b. Publish safety: auto-post hard-blocked, private, disclosed, unapproved.
step "asserting publish package blocks auto-post and requires human approval"
node -e '
  const fs=require("fs");
  const p=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
  if(p.autoPostAllowed!==false){console.error("autoPostAllowed must be false");process.exit(1);}
  if(p.requiresHumanApproval!==true){console.error("requiresHumanApproval must be true");process.exit(1);}
  if(p.visibility!=="private"){console.error("visibility must be private");process.exit(1);}
  if(p.published!==false){console.error("published must be false");process.exit(1);}
  if(p.approval.state!=="Pending"){console.error("approval must be Pending");process.exit(1);}
  if(!p.aiDisclosure||p.aiDisclosure.syntheticVoice!==true){console.error("AI voice disclosure required");process.exit(1);}
  console.log("publish package safe: auto-post blocked, private, AI-disclosed, approval Pending");
' "${PKG_DIR}/publish-package.json" >/tmp/p03_publish.log 2>&1 \
  || fail "publish safety assertion failed:\n$(cat /tmp/p03_publish.log)"
cat /tmp/p03_publish.log | sed 's/^/    /'

# 10. Emit PASS record (hashes committed source only).
step "emitting PASS record"
HASHED_FILES="src/production/types.ts,src/production/scriptPackage.ts,src/production/storyboard.ts,src/production/creativeBriefs.ts,src/production/reviewPackage.ts,src/production/researchBrief.ts,src/production/blueprint.ts,src/production/publishPackage.ts,src/production/productionPackage.ts,src/adapters/adapterContract.ts,src/adapters/heygenAdapter.ts,src/adapters/higgsfieldAdapter.ts,src/adapters/canvaAdapter.ts,src/adapters/voiceoverAdapter.ts,src/adapters/registry.ts,src/adapters/validate.ts,scripts/build_production_package.ts,schemas/adapter-contract.schema.json,schemas/adapter-payload.schema.json,schemas/production-package.schema.json,gates/check_phase_03.sh,tests/phase_03.production.test.ts,outputs/production/.gitkeep"
TEST_SUMMARY="Phase 02 current; tsc clean; node --test passed; 4 adapter contracts valid + all LIVE-INTEGRATION-BLOCKED; built complete offline production package for ${VIDEO} (research, blueprint, script, storyboard, prompts, voice, adapters, review, publish); manifest + 4 payloads validate; publish auto-post blocked; review Pending/blocking; nothing published"

node "$UTILS" emit-pass "$PHASE" --files "$HASHED_FILES" --tests "$TEST_SUMMARY" || fail "could not emit PASS record"

# 11. Verify the emitted record is valid AND current.
step "verifying emitted PASS record schema"
node "$UTILS" validate-record "records/PHASE_${PHASE}_PASS.md" || fail "emitted PASS record failed schema validation"
step "verifying PASS record is CURRENT against hashed outputs"
node "$UTILS" verify-pass-current "$PHASE" || fail "emitted PASS record is not current"

# 12. Confirm Phase 04 remains locked.
step "confirming Phase 04 remains locked"
node "$UTILS" has-pass 04 >/dev/null 2>&1 && fail "Phase 04 unexpectedly has a PASS record"
[ -f "records/PHASE_04_PASS.md" ] && fail "records/PHASE_04_PASS.md exists — Phase 04 must remain locked"
[ -f "gates/check_phase_04.sh" ] && fail "gates/check_phase_04.sh exists — Phase 04 must remain unstarted"
step "  Phase 04 is locked (no gate, no PASS record)"

printf '\nGATE PASS (phase %s): records/PHASE_%s_PASS.md is valid and current. No live API used; Phase 04 remains locked.\n' "$PHASE" "$PHASE"
