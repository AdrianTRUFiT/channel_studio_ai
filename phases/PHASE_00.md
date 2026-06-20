# PHASE 00 — Runtime Foundation

## Goal
Create the deterministic runtime foundation for Channel Studio AI.

## Required Outputs

- folder structure
- `CLAUDE.md`
- `README.md`
- `MISSION_CONTRACT.md`
- `orchestrator/runner.ts` or `orchestrator/runner.js`
- `gates/shared/gateUtils.ts` or `gates/shared/gateUtils.js`
- `records/README.md`
- `schemas/phase.schema.json`
- `schemas/pass-record.schema.json`
- `schemas/fail-record.schema.json`
- `gates/check_phase_00.sh`

## Gate

`gates/check_phase_00.sh`

## PASS Criteria

- required folders exist
- required schemas exist
- runner exists
- shared gate utilities exist
- install/build/typecheck command succeeds or a justified placeholder command exists
- gate emits `records/PHASE_00_PASS.md`

## FAIL Behavior

After 3 failed repair attempts, emit `records/PHASE_00_FAIL.md` and halt.
