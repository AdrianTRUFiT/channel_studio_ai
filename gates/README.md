# Gates

This directory contains deterministic phase gates.

Claude Code may build phase outputs, but Claude Code must not self-certify completion.

A phase passes only when its `gates/check_phase_0N.sh` script exits `0` and emits a valid PASS record in `records/`.

## Gate Requirements

Each gate must:

1. validate prior PASS record
2. validate required files
3. run schema checks
4. run at least one smoke test
5. compute content hash for required outputs
6. emit PASS record only after success
7. emit or support FAIL diagnostics after bounded repair attempts

## Rule

No PASS, no advance.
