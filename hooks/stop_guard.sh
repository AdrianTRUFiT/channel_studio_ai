#!/usr/bin/env bash
#
# hooks/stop_guard.sh — Claude Code Stop guard.
#
# Prevents ending a turn with a phase left unresolved. The active phase is the
# lowest phase that lacks a VALID, CURRENT PASS record (decided by
# `gateUtils stop-check`, not by file existence). If that phase has a built gate
# but neither a valid current PASS nor a valid FAIL record, stopping is blocked:
# the model must earn the PASS (run the gate) or emit a FAIL after the 3-attempt
# repair budget. A malformed PASS/FAIL does NOT count as resolved.
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
UTILS="$ROOT/gates/shared/gateUtils.ts"
cat >/dev/null 2>&1 || true  # drain stdin

if ! REASON="$(node "$UTILS" stop-check 2>&1)"; then
  echo "BLOCKED by stop_guard: ${REASON}" >&2
  exit 2
fi

exit 0
