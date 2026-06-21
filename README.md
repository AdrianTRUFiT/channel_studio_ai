# Channel Studio AI

A **governed faceless video production runtime**. Channel Studio AI moves video
assets through an ordered production line — from opportunity discovery to
publish-ready distribution — where every phase transition must be *earned*, not
asserted.

> **Doctrine**
> Claude processes. Code governs. Records prove. Hooks block.
>
> No phase may advance because a model says it is complete. A phase advances
> only when its deterministic gate script exits `0` and emits a valid PASS
> record.

See [`CLAUDE.md`](./CLAUDE.md) for the runtime doctrine and
[`MISSION_CONTRACT.md`](./MISSION_CONTRACT.md) for the full phase contract.

## MAPⓈ posture

Machine Assisted, Person Supervised. AI agents run the production machinery;
human approval is a required, blocking state at decision firewalls (Phases 03
and 07). The human gate is represented in code — it is not engineered around.

## Requirements

- **Node.js ≥ 22.6** (the gates run TypeScript directly via native type
  stripping; `node orchestrator/runner.ts` works without a build step).
- npm (for `npm install` / `npm run typecheck`).

## Layout

```text
.
├── CLAUDE.md            # runtime doctrine (Claude's operating rules)
├── MISSION_CONTRACT.md  # the deterministic production contract
├── README.md
├── package.json
├── tsconfig.json
├── src/                 # shared domain code (phase registry, future state model)
├── agents/              # production agents (added per phase)
├── workflows/           # phase workflows (added per phase)
├── api/                 # live/mocked integration interfaces (added per phase)
├── gates/               # deterministic phase gates  →  the law
│   ├── shared/gateUtils.ts
│   └── check_phase_0N.sh
├── hooks/               # PreToolUse / Stop guards    →  enforcement
├── orchestrator/        # runner: phase → gate → PASS record → next
├── records/             # append-only proof ledger (PASS/FAIL records)
├── schemas/             # JSON schemas for phases and records
├── tests/               # one-unit smoke tests per phase
├── mock/                # mock adapters for blocked live integrations
├── phases/              # human-readable phase specs
└── archive/             # retired artifacts
```

## How governance works

1. **Code governs ordering.** `src/phases.ts` is the single ordered registry of
   phases 00 → 12. The orchestrator and gates read from it.
2. **Gates certify completion.** Each `gates/check_phase_0N.sh` checks the prior
   PASS record, validates required outputs, runs the typecheck and the phase's
   one-unit smoke test, then calls `gateUtils.ts emit-pass` — the *only* path
   that writes a PASS record.
3. **Records prove what happened.** `records/` is an append-only ledger. PASS
   records embed a machine-checkable JSON payload (see
   `schemas/pass-record.schema.json`) that includes the phase id/name,
   timestamp, gate script, git commit, a SHA-256 content hash of the required
   outputs, a test summary, and the next unlocked phase.
4. **Hooks block bypasses.** The guards in `hooks/` stop out-of-order edits and
   premature stops at the tool boundary.

## Commands

```bash
npm install            # install devDependencies (typescript, @types/node)
npm run typecheck      # tsc --noEmit  (also: npm run build)
npm test               # node --test   (one-unit smoke tests)
npm run status         # show PASS/FAIL state of every phase
npm run gate:00        # run the PHASE 00 gate

# Orchestrator
node orchestrator/runner.ts status     # production-line status
node orchestrator/runner.ts run 00     # run a single phase's gate
node orchestrator/runner.ts run all    # run gates in order, halt on first failure
```

## The append-only record rule

- PASS records are **never** written by hand — only by gate scripts via
  `gateUtils emit-pass`. Emission is idempotent: an existing valid PASS record
  is left untouched.
- A phase may not begin unless the previous phase has a valid PASS record
  (`records/PHASE_0N_PASS.md`). PHASE 00 is the only phase with no prior.
- After **3** failed repair attempts a phase emits
  `records/PHASE_0N_FAIL.md` (via `gateUtils emit-fail`) and the line halts.

## Proof integrity — a PASS record is not valid merely because it exists

A PASS record is not valid merely because it exists.

A PASS record must validate **structurally** (against
`schemas/pass-record.schema.json`) and must **verify against current hashed
outputs** — its stored content hash must equal a fresh recomputation over the
files it lists in `hashedOutputs`.

Hooks use **validation, not existence**, to determine whether a phase may
advance. A missing, malformed, or stale PASS record unlocks nothing; a
malformed FAIL record does not count as resolved.

```bash
node gates/shared/gateUtils.ts verify-pass-current 00   # structural + currency check
```

The PHASE 00 gate runs this verifier as its final step, so a passing gate
guarantees the emitted record is both schema-valid and current.

## Live integration rule

When a phase needs credentials or paid APIs that are unavailable, do not block
the whole build. Instead: build the interface, add a mock adapter under
`mock/`, write an offline contract test, mark the live path
**LIVE-INTEGRATION-BLOCKED**, and pass the phase on the offline contract test.
Never claim a live API ran unless it actually ran.

## Wiring the hooks into Claude Code

The guards are plain scripts; enable them by adding hooks to your Claude Code
settings (`.claude/settings.json` in this repo, or your user settings):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write|Bash",
        "hooks": [
          { "type": "command", "command": "bash hooks/pre_phase_guard.sh" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "bash hooks/stop_guard.sh" }
        ]
      }
    ]
  }
}
```

- **`pre_phase_guard.sh`** (PreToolUse) inspects the *targeted* path/command of
  an Edit/Write/Bash call. If it touches a later phase's artifacts
  (`check_phase_0N.sh`, `PHASE_0N_*`) while the prior phase has no PASS record,
  it exits `2` and the action is blocked.
- **`stop_guard.sh`** (Stop) blocks ending a turn while the active phase has a
  built gate but no PASS and no FAIL record — forcing the phase to be resolved.

Both follow the standard hook protocol: exit `0` allows, exit `2` blocks and
returns the stderr message to Claude.

## Status

PHASE 00 (Runtime Foundation) is the entry point. Run `npm run gate:00`; on
success it emits `records/PHASE_00_PASS.md`, which unlocks PHASE 01. Subsequent
phases are built one at a time, each gated by its predecessor's PASS record.
