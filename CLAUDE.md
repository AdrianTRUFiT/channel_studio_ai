# Channel Studio AI — Claude Runtime Doctrine

## Mission
Build Channel Studio AI as a governed faceless video production runtime.

The system must move video assets through an ordered production line:

Opportunity Intelligence → Strategic Blueprinting → Script Production → Voice / Visual Packaging → HTML-to-Video Render → Human Review → Compliance → Publishing Queue → Distribution Pack → Analytics Feedback.

## Core Doctrine

Claude processes.

Code governs.

Records prove.

Hooks block.

No phase may advance because the model says it is complete. A phase may advance only when its deterministic gate script exits successfully and emits a valid PASS record.

## MAPS Posture

The system operates under MAPS: Machine Assisted, Person Supervised.

AI agents perform the production machinery. Human approval is required at decision firewalls.

## Non-Negotiables

- Do not manually create PASS records.
- Do not skip phases.
- Do not fake live API integrations.
- Use mock adapters when credentials are unavailable.
- Mark unavailable live integrations as LIVE-INTEGRATION-BLOCKED.
- Stop after 3 failed repair attempts for a phase.
- Emit FAIL records with diagnostics when a phase cannot pass.
- Keep records append-only.

## Build Rule

Start at PHASE 00. Do not begin PHASE 01 until PHASE 00 emits a valid PASS record.

Every future phase must obey the same rule: no prior PASS, no advance.
