# PHASE 01 — Campaign Intake and State Model

## Goal
Model a campaign such as `Create 20 faceless videos for The Mind Is a Computer ebook launch`.

## Required Outputs

- campaign schema
- video asset schema
- agent state schema
- sample 20-video campaign
- status enum:
  - Not Started
  - Researching
  - Blueprint Ready
  - Script Ready
  - Voice Ready
  - Visuals Ready
  - Render Ready
  - Human Review
  - Approved
  - Publish Ready
  - Published
  - Blocked
- `gates/check_phase_01.sh`

## Gate

`gates/check_phase_01.sh`

## PASS Criteria

- Phase 00 PASS validates
- sample campaign contains exactly 20 video records
- every record has required fields
- schema validation passes
- one-unit smoke test can load campaign and count 20 videos
- gate emits `records/PHASE_01_PASS.md`

## FAIL Behavior

After 3 failed repair attempts, emit `records/PHASE_01_FAIL.md` and halt.
