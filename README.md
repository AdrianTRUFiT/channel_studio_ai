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

## Dashboard (Phase 01)

Phase 01 adds the first visible product face: a governed **dashboard shell** in
the `web/` npm workspace (React + Vite), inspired by the audited local prototype
(GitHub Issue #2). It renders the same governed campaign file the gate
validates — a single source of truth — and **loudly labels everything mock**.

```bash
npm install     # installs root devDeps + the web/ workspace (react, vite)
npm run dev      # launches the dashboard at http://localhost:5173
```

The dashboard shows the Channel Studio AI masthead, the MAPⓈ posture banner, a
prototype/mock disclaimer, campaign intake, pipeline status cards driven by the
governed 12-stage state model, and a Production Floor table of the 20-video
sample campaign for *The Mind Is a Computer*. No rendering, publishing,
analytics, or external APIs are connected — those are deferred to later phases.

The campaign state model is governed under `src/campaign/` and validated by
`schemas/campaign.schema.json`, `schemas/video-asset.schema.json`, and
`schemas/agent-state.schema.json`. The sample campaign lives at
`data/campaigns/the-mind-is-a-computer.campaign.json` and must contain exactly
20 video records; `gates/check_phase_01.sh` enforces this.

> Note: adding the `web/` workspace changed the root `package.json`, which is a
> Phase 00 hashed output. The Phase 00 gate was re-run so its PASS record stays
> current — proof currency working as designed, not bypassed.

## Local video production (Phase 02)

Phase 02 makes the machine produce **actual local MP4 files** from the governed
20-video campaign — local rendering only, no external APIs, nothing published.

```bash
npm run produce:videos            # full: all 20 videos → outputs/videos/tmiac-001.mp4 …
npm run produce:videos -- --smoke # fast smoke sample (the gate uses this)
```

Pipeline (per video): campaign record → `renderPlan` (title / hook / point / CTA
/ disclaimer scenes) → PNG scene frames drawn in pure Node (`src/render/frameCanvas.ts`,
a hand-rolled 5×7 bitmap font + PNG encoder, zero native deps) → **ffmpeg**
encodes the frames into an H.264 MP4 with a **silent placeholder audio track**.

- **ffmpeg is local only.** It is resolved from `$CSAI_FFMPEG`/`$FFMPEG_PATH`,
  then the vendored `ffmpeg-static` npm binary, then a system `ffmpeg`. No
  network call, no API. If no ffmpeg is usable, production is **not faked** — each
  video is marked `blocked-no-ffmpeg`, a storyboard frame is written, and the
  blocker is reported.
- **`rendererMode: local-mock-render`** is honest: generated slides + silent
  audio. There is no real narration or AI video, and nothing is published
  (`published: false`).
- Outputs (`outputs/videos/*.mp4`, `outputs/manifests/*.json`) are **local-only
  and git-ignored**. Each run writes a manifest with one record per video,
  including a `sha256:` file hash, validated against
  `schemas/render-manifest.schema.json`.
- The dashboard's **Video Production** tab shows render status, produced count,
  output directory, the last manifest, and a loud "local mock render — not
  published" label (`web/src/data/renderStatus.json`, updated by the producer).

`gates/check_phase_02.sh` verifies Phase 01 is current, typechecks, tests, runs a
**smoke** production (distinct from full), confirms ≥1 MP4 + a valid manifest +
matching file hashes, emits `records/PHASE_02_PASS.md`, verifies it, and confirms
**Phase 03 remains locked**.

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

PHASE 00 (Runtime Foundation) and PHASE 01 (Campaign Intake & State Model) hold
valid, current PASS records. Run `npm run gate:00` and `npm run gate:01` to
re-verify; `npm run status` shows the whole line. PHASE 02 remains locked until
its gate is built and PHASE 01's PASS record validates. Subsequent phases are
built one at a time, each gated by its predecessor's PASS record.
