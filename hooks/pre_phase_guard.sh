#!/usr/bin/env bash
#
# hooks/pre_phase_guard.sh — Claude Code PreToolUse guard.
#
# Blocks edits/commands that target a later phase's artifacts unless the PRIOR
# phase holds a PASS record that is structurally valid AND current. Validity is
# decided by `gateUtils verify-pass-current` (via require-prior), NOT by mere
# file existence: a missing, malformed, or stale PASS record unlocks nothing.
#
# Wiring (settings.json), matching Edit|Write|Bash:
#   "hooks": {
#     "PreToolUse": [
#       { "matcher": "Edit|Write|Bash",
#         "hooks": [{ "type": "command", "command": "bash hooks/pre_phase_guard.sh" }] }
#     ]
#   }
#
# Protocol: exit 0 = allow. exit 2 = block (stderr is returned to Claude).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UTILS="$ROOT/gates/shared/gateUtils.ts"
INPUT="$(cat 2>/dev/null || true)"

# Extract ONLY the targeted path(s)/command from the tool call — never file
# content — so editing foundation files that merely mention phases is allowed.
TARGET="$(printf '%s' "$INPUT" | node -e '
  let d = "";
  process.stdin.on("data", (c) => (d += c)).on("end", () => {
    try {
      const j = JSON.parse(d);
      const t = j.tool_input || {};
      const parts = [t.file_path, t.path, t.notebook_path, t.command].filter(Boolean);
      process.stdout.write(parts.join("\n"));
    } catch { /* allow on parse failure */ }
  });
' 2>/dev/null || true)"

[ -z "$TARGET" ] && exit 0

# Highest phase number referenced by a per-phase artifact token in the target.
TOKENS="$(printf '%s' "$TARGET" | grep -oiE 'check_phase_[0-9]{2}|PHASE_[0-9]{2}|phase_[0-9]{2}' || true)"
[ -z "$TOKENS" ] && exit 0

N="$(printf '%s\n' "$TOKENS" | grep -oE '[0-9]{2}' | sort -rn | head -n1)"
[ -z "$N" ] && exit 0

# PHASE 00 has no prior; always allowed.
[ "$N" = "00" ] && exit 0

# Ask gateUtils whether PHASE N may begin (prior PASS must be valid AND current).
if ! REASON="$(node "$UTILS" require-prior "$N" 2>&1)"; then
  echo "BLOCKED by pre_phase_guard: work on PHASE ${N} is not unlocked. ${REASON}" >&2
  echo "No valid, current prior PASS, no advance." >&2
  exit 2
fi

exit 0
