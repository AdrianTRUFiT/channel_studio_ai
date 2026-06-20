#!/usr/bin/env bash
#
# hooks/stop_guard.sh — Claude Code Stop guard.
#
# Prevents ending a turn with a phase left unresolved: if the active phase has a
# built gate but neither a PASS nor a FAIL record, the model must either earn the
# PASS (run the gate) or emit a FAIL after the 3-attempt repair budget.
#
# Wiring (settings.json):
#   "hooks": {
#     "Stop": [
#       { "hooks": [{ "type": "command", "command": "bash hooks/stop_guard.sh" }] }
#     ]
#   }
#
# Protocol: exit 0 = allow stop. exit 2 = block stop (stderr is returned to Claude).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cat >/dev/null 2>&1 || true  # drain stdin

# The active phase is the lowest id with no PASS record.
ACTIVE=""
for N in 00 01 02 03 04 05 06 07 08 09 10 11 12; do
  if [ ! -f "$ROOT/records/PHASE_${N}_PASS.md" ]; then
    ACTIVE="$N"
    break
  fi
done

# Every phase has passed — the line is complete; allow stop.
[ -z "$ACTIVE" ] && exit 0

# If the active phase's gate exists but it is unresolved (no PASS, no FAIL), block.
if [ -f "$ROOT/gates/check_phase_${ACTIVE}.sh" ] && [ ! -f "$ROOT/records/PHASE_${ACTIVE}_FAIL.md" ]; then
  echo "BLOCKED by stop_guard: PHASE ${ACTIVE} is unresolved. Run 'bash gates/check_phase_${ACTIVE}.sh' to earn a PASS record, or emit records/PHASE_${ACTIVE}_FAIL.md after 3 failed repair attempts, before stopping." >&2
  exit 2
fi

# Active phase has no gate yet (not started) — nothing to resolve; allow stop.
exit 0
