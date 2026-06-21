/**
 * PHASE 00 negative-enforcement tests.
 *
 * Proves the governance is MECHANICAL: bad transitions are blocked. Every test
 * runs against an isolated fixture tree via the CSAI_ROOT override, so the real
 * records/ ledger is never read or mutated.
 *
 * Run with `node --test`.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  sourceRoot,
  verifyPassCurrent,
  canPhaseBegin,
  activePhaseId,
  emitPass,
  passRecordPath,
} from "../gates/shared/gateUtils.ts";
import { getPhase, PHASES } from "../src/phases.ts";

/** Phase ids whose gate script is actually built in the source tree (in order). */
function builtGatePhaseIds(): string[] {
  const out: string[] = [];
  for (const p of PHASES) {
    if (existsSync(join(sourceRoot(), p.gate))) out.push(p.id);
    else break; // gates are built contiguously from 00; stop at the first gap
  }
  return out;
}

/** Run `fn` with CSAI_ROOT pointed at a fresh temp dir; always clean up. */
function withFixtureRoot(fn: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), "csai-fixture-"));
  mkdirSync(join(root, "records"), { recursive: true });
  const prev = process.env.CSAI_ROOT;
  process.env.CSAI_ROOT = root;
  try {
    fn(root);
  } finally {
    if (prev === undefined) delete process.env.CSAI_ROOT;
    else process.env.CSAI_ROOT = prev;
    rmSync(root, { recursive: true, force: true });
  }
}

/** Write a valid, current PASS record for `phaseId` into the fixture root. */
function seedValidPass(root: string, phaseId: string): void {
  const fname = `seed-${phaseId}.txt`;
  writeFileSync(join(root, fname), `deterministic seed for phase ${phaseId}\n`);
  const result = emitPass({
    phase: getPhase(phaseId)!,
    files: [fname],
    testSummary: "fixture seed",
  });
  assert.equal(result.written, true);
}

/** Write a valid, current PHASE 00 PASS record into the fixture root. */
function seedValidPhase00(root: string): void {
  seedValidPass(root, "00");
}

test("1. Phase 01 is blocked when Phase 00 PASS is missing", () => {
  withFixtureRoot(() => {
    assert.equal(verifyPassCurrent("00").ok, false);
    assert.equal(canPhaseBegin("01"), false);
  });
});

test("2. A malformed Phase 00 PASS record does not unlock Phase 01", () => {
  withFixtureRoot(() => {
    // Looks like a record, but the JSON payload is garbage.
    writeFileSync(passRecordPath("00"), "# PHASE 00 PASS\n\n```json\n{ not valid json }\n```\n");
    assert.equal(verifyPassCurrent("00").ok, false);
    assert.equal(canPhaseBegin("01"), false);
  });
});

test("2b. A stale (tampered) Phase 00 PASS record does not unlock Phase 01", () => {
  withFixtureRoot((root) => {
    seedValidPhase00(root);
    assert.equal(verifyPassCurrent("00").ok, true);
    // Tamper a hashed output AFTER the record was emitted → content hash drifts.
    writeFileSync(join(root, "seed-00.txt"), "tampered\n");
    const result = verifyPassCurrent("00");
    assert.equal(result.ok, false);
    assert.match(result.reason, /stale|hash mismatch/);
    assert.equal(canPhaseBegin("01"), false);
  });
});

test("5. A valid PASS record unlocks only the next phase, not arbitrary later phases", () => {
  withFixtureRoot((root) => {
    seedValidPhase00(root);
    assert.equal(verifyPassCurrent("00").ok, true);
    assert.equal(canPhaseBegin("01"), true); // next phase unlocked
    assert.equal(canPhaseBegin("02"), false); // not arbitrary later phases
    assert.equal(canPhaseBegin("05"), false);
    assert.equal(canPhaseBegin("12"), false);
    assert.equal(activePhaseId(), "01");
  });
});

test("3. pre_phase_guard.sh blocks work on Phase 02 when only Phase 00 PASS exists", () => {
  withFixtureRoot((root) => {
    seedValidPhase00(root);
    const hook = join(sourceRoot(), "hooks", "pre_phase_guard.sh");
    const input = JSON.stringify({ tool_input: { file_path: "gates/check_phase_02.sh" } });

    let status = 0;
    let stderr = "";
    try {
      execFileSync("bash", [hook], {
        input,
        env: { ...process.env, CSAI_ROOT: root },
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (e) {
      const err = e as { status?: number; stderr?: Buffer };
      status = err.status ?? -1;
      stderr = err.stderr?.toString() ?? "";
    }
    assert.equal(status, 2, "guard must exit 2 to block");
    assert.match(stderr, /BLOCKED by pre_phase_guard/);
  });
});

test("3b. pre_phase_guard.sh allows Phase 01 work once Phase 00 PASS is valid", () => {
  withFixtureRoot((root) => {
    seedValidPhase00(root);
    const hook = join(sourceRoot(), "hooks", "pre_phase_guard.sh");
    const input = JSON.stringify({ tool_input: { file_path: "phases/PHASE_01.md" } });
    // Should NOT throw (exit 0).
    execFileSync("bash", [hook], {
      input,
      env: { ...process.env, CSAI_ROOT: root },
      stdio: ["pipe", "pipe", "pipe"],
    });
  });
});

test("4. stop_guard.sh blocks stopping when active phase has a built gate but no valid PASS/FAIL", () => {
  withFixtureRoot((root) => {
    // Empty records → active phase is 00, whose gate IS built in the source tree,
    // and there is no valid PASS and no valid FAIL → stopping must be blocked.
    const hook = join(sourceRoot(), "hooks", "stop_guard.sh");

    let status = 0;
    let stderr = "";
    try {
      execFileSync("bash", [hook], {
        input: "{}",
        env: { ...process.env, CSAI_ROOT: root },
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (e) {
      const err = e as { status?: number; stderr?: Buffer };
      status = err.status ?? -1;
      stderr = err.stderr?.toString() ?? "";
    }
    assert.equal(status, 2, "stop guard must exit 2 to block");
    assert.match(stderr, /BLOCKED by stop_guard/);
  });
});

test("4b. stop_guard.sh allows stopping when the active phase has no built gate", () => {
  withFixtureRoot((root) => {
    // Seed valid PASS records for every phase whose gate is built in the source
    // tree, so the active phase is the first one WITHOUT a built gate → allow stop.
    for (const id of builtGatePhaseIds()) seedValidPass(root, id);
    const hook = join(sourceRoot(), "hooks", "stop_guard.sh");
    execFileSync("bash", [hook], {
      input: "{}",
      env: { ...process.env, CSAI_ROOT: root },
      stdio: ["pipe", "pipe", "pipe"],
    });
  });
});
