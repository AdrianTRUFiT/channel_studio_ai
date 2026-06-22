#!/usr/bin/env bash
#
# gates/check_phase_02.sh — deterministic gate for PHASE 02 (Local Video Production).
#
# Implements the governance contract from GitHub Issue #6:
#   1. Verify Phase 01 PASS is valid/current.
#   2. Run typecheck.
#   3. Run tests.
#   4. Run a SMOKE video production command (clearly distinct from full).
#   5. Confirm at least one MP4 artifact is produced locally.
#   6. Confirm the output manifest exists and validates.
#   7. Confirm a generated file hash exists in the manifest.
#   8. Emit records/PHASE_02_PASS.md only after success.
#   9. Verify Phase 02 PASS is valid/current.
#  10. Confirm Phase 03 remains locked.
#
# Local rendering only — no external APIs, nothing published. Exits non-zero
# with diagnostics on any failure (FAIL records are emitted separately after the
# 3-attempt repair budget, see README).

set -euo pipefail

PHASE="02"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

UTILS="gates/shared/gateUtils.ts"
VIDEO_DIR="outputs/videos"
MANIFEST="outputs/manifests/latest.json"

step() { printf '  [phase %s] %s\n' "$PHASE" "$1"; }
fail() { printf '\nGATE FAIL (phase %s): %s\n' "$PHASE" "$1" >&2; exit 1; }

# 1. Prior PASS rule — Phase 01 must be valid AND current.
step "verifying Phase 01 PASS is valid/current"
node "$UTILS" verify-pass-current 01 || fail "Phase 01 PASS is missing/stale; Phase 02 is locked"
node "$UTILS" require-prior "$PHASE" || fail "prior-PASS rule failed for Phase 02"

step "installing dependencies (npm install, includes vendored ffmpeg-static)"
npm install --no-audit --no-fund >/tmp/p02_install.log 2>&1 \
  || fail "npm install failed; see /tmp/p02_install.log"

# 2. Typecheck.
step "typechecking (npm run typecheck)"
npm run --silent typecheck >/tmp/p02_typecheck.log 2>&1 \
  || fail "typecheck failed:\n$(cat /tmp/p02_typecheck.log)"

# 3. Tests.
step "running tests (npm test)"
npm test >/tmp/p02_test.log 2>&1 \
  || fail "tests failed:\n$(cat /tmp/p02_test.log)"

# 4. SMOKE production sample (NOT the full 20-video campaign).
step "running SMOKE video production (sample, not full campaign)"
node scripts/produce_videos.ts --smoke --limit 2 >/tmp/p02_produce.log 2>&1 \
  || fail "smoke production failed:\n$(tail -n 40 /tmp/p02_produce.log)"

# 5. Confirm at least one MP4 artifact exists locally.
step "confirming at least one MP4 was produced locally"
MP4_COUNT="$(find "$VIDEO_DIR" -maxdepth 1 -name '*.mp4' -type f | wc -l | tr -d ' ')"
[ "$MP4_COUNT" -ge 1 ] || fail "no MP4 artifacts found in $VIDEO_DIR/ (found $MP4_COUNT)"
FIRST_MP4="$(find "$VIDEO_DIR" -maxdepth 1 -name '*.mp4' -type f | sort | head -n1)"
step "  found $MP4_COUNT MP4(s); first: $FIRST_MP4 ($(wc -c <"$FIRST_MP4" | tr -d ' ') bytes)"

# 6. Confirm output manifest exists and validates.
step "validating output manifest"
[ -f "$MANIFEST" ] || fail "manifest not found: $MANIFEST"
node src/render/renderManifest.ts validate "$MANIFEST" >/tmp/p02_manifest.log 2>&1 \
  || fail "manifest validation failed:\n$(cat /tmp/p02_manifest.log)"

# 7. Confirm a generated file hash exists in the manifest AND the file matches it.
step "confirming generated file hash exists and matches the artifact"
node -e '
  const fs = require("fs"), crypto = require("crypto");
  const m = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  const rendered = (m.videos || []).filter((v) => v.status === "rendered");
  if (rendered.length === 0) { console.error("no rendered artifact in manifest"); process.exit(1); }
  for (const v of rendered) {
    if (!/^sha256:[0-9a-f]{64}$/.test(v.fileHash || "")) {
      console.error("bad fileHash for " + v.videoId); process.exit(1);
    }
    if (!fs.existsSync(v.outputPath)) { console.error("missing artifact " + v.outputPath); process.exit(1); }
    const actual = "sha256:" + crypto.createHash("sha256").update(fs.readFileSync(v.outputPath)).digest("hex");
    if (actual !== v.fileHash) { console.error("hash mismatch for " + v.outputPath); process.exit(1); }
  }
  console.log("verified file hashes for " + rendered.length + " artifact(s)");
' "$MANIFEST" >/tmp/p02_hash.log 2>&1 || fail "file hash check failed:\n$(cat /tmp/p02_hash.log)"
cat /tmp/p02_hash.log | sed 's/^/    /'

# 8. Emit PASS record (append-only, idempotent; hashes committed source only).
step "emitting PASS record"
HASHED_FILES="src/render/frameCanvas.ts,src/render/renderPlan.ts,src/render/renderManifest.ts,src/render/videoProducer.ts,scripts/produce_videos.ts,schemas/render-manifest.schema.json,gates/check_phase_02.sh,tests/phase_02.render.test.ts,outputs/videos/.gitkeep,outputs/manifests/.gitkeep"
TEST_SUMMARY="Phase 01 current; tsc --noEmit clean; node --test passed; smoke produced ${MP4_COUNT} local MP4(s); manifest validates; artifact file hashes verified"

node "$UTILS" emit-pass "$PHASE" --files "$HASHED_FILES" --tests "$TEST_SUMMARY" \
  || fail "could not emit PASS record"

# 9. Verify the emitted record is valid AND current.
step "verifying emitted PASS record schema"
node "$UTILS" validate-record "records/PHASE_${PHASE}_PASS.md" \
  || fail "emitted PASS record failed schema validation"
step "verifying PASS record is CURRENT against hashed outputs"
node "$UTILS" verify-pass-current "$PHASE" \
  || fail "emitted PASS record is not current (stale/mismatched content hash)"

# 10. Confirm Phase 03 remains locked.
step "confirming Phase 03 remains locked"
if node "$UTILS" has-pass 03 >/dev/null 2>&1; then
  fail "Phase 03 unexpectedly has a PASS record — Phase 03 must remain unstarted"
fi
[ -f "records/PHASE_03_PASS.md" ] && fail "records/PHASE_03_PASS.md exists — Phase 03 must remain locked"
[ -f "gates/check_phase_03.sh" ] && fail "gates/check_phase_03.sh exists — Phase 03 must remain unstarted"
step "  Phase 03 is locked (no gate, no PASS record)"

printf '\nGATE PASS (phase %s): records/PHASE_%s_PASS.md is valid and current. Phase 03 remains locked.\n' "$PHASE" "$PHASE"
