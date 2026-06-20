# Records Ledger

This directory is the append-only proof layer for Channel Studio AI.

## Important

PASS records must not be written manually by Claude Code.

PASS records are emitted only by deterministic gate scripts.

## PASS Record Pattern

`PHASE_0N_PASS.md`

Must include:

- phase id
- phase name
- timestamp
- gate script name
- content hash
- test summary
- next unlocked phase

## FAIL Record Pattern

`PHASE_0N_FAIL.md`

Must include:

- failed phase
- failed gate
- failing command
- error output
- attempted repairs
- suspected cause
- recommended next action

## Ledger Rule

Records preserve what happened across every transition.
