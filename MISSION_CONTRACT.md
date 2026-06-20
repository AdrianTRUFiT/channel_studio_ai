# Channel Studio AI — Deterministic Production Runtime Contract

## Objective

Build Channel Studio AI as a governed faceless video production line where a campaign such as `Create 20 faceless videos for The Mind Is a Computer ebook launch` can be processed from opportunity discovery to publish-ready distribution.

## Runtime Principle

The project must be phase-gated. Claude Code may create outputs, but deterministic gate scripts decide whether the phase passes.

**No PASS record, no advance.**

## Required Runtime Structure

```text
.
├── CLAUDE.md
├── README.md
├── MISSION_CONTRACT.md
├── src/
├── agents/
├── workflows/
├── api/
├── gates/
├── hooks/
├── orchestrator/
├── records/
├── schemas/
├── tests/
├── mock/
├── phases/
└── archive/
```

## Record Rule

The `records/` directory is an append-only ledger. PASS records are emitted only by gate scripts.

Every PASS record must include:

- phase id
- phase name
- timestamp
- gate script name
- content hash of required outputs
- test summary
- next unlocked phase

## Fail Rule

Each phase gets a maximum of 3 repair attempts. After 3 failed attempts, emit a FAIL record and halt.

## Live Integration Rule

If credentials are missing, build:

1. interface
2. mock adapter
3. offline contract test
4. LIVE-INTEGRATION-BLOCKED status

Do not claim live execution unless it actually ran.

## Phase Map

| Phase | Name | Purpose |
|---|---|---|
| 00 | Runtime Foundation | Folders, schemas, runner, gate utilities |
| 01 | Campaign Intake and State Model | Campaign and video asset schemas |
| 02 | Opportunity Intelligence | Demand scan, knowledge match, scorecard |
| 03 | Human Blueprint Approval Gate | MAPS decision firewall |
| 04 | Strategic Blueprinting and Script Production | SCRIPT.md per video |
| 05 | Voice, Visual, and Asset Packaging | Mock adapters and production packages |
| 06 | HTML-to-Video Render Engine | HTML source-of-truth render lane |
| 07 | Inspector and Human Review | Review, reject, approve workflows |
| 08 | Compliance and Disclosure Audit | AI disclosure, C2PA/SynthID placeholders |
| 09 | Publishing Queue | YouTube publish package, no auto-post without approval |
| 10 | Distribution Pack | Medium, Pinterest, transcript, SEO package |
| 11 | Analytics Feedback Loop | Session time, citation frequency, weight update proposal |
| 12 | End-to-End 20 Video Campaign Test | Full campaign proof |

## Final Definition of Done

The project is complete only when:

- PHASE_00 through PHASE_12 PASS records exist and validate
- 20-video sample campaign exists
- one-unit smoke tests exist for every phase
- no live API is falsely claimed
- mock adapters exist for blocked integrations
- build/typecheck passes
- final production report exists
