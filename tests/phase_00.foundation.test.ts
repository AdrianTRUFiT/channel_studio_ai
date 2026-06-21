/**
 * PHASE 00 one-unit smoke test.
 *
 * Proves the runtime foundation is wired: the phase registry is well-formed,
 * the schema validator works, and the append-only PASS-record check rejects
 * malformed payloads. Run with `node --test`.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { PHASES, getPhase, priorPhaseOf } from "../src/phases.ts";
import { validate, extractJsonBlock } from "../gates/shared/gateUtils.ts";

test("phase registry is ordered 00..12 with a single terminal phase", () => {
  assert.equal(PHASES[0].id, "00");
  assert.equal(PHASES[PHASES.length - 1].id, "12");
  assert.equal(PHASES[PHASES.length - 1].next, null);
  PHASES.forEach((p, i) => {
    const expectedNext = i < PHASES.length - 1 ? PHASES[i + 1].id : null;
    assert.equal(p.next, expectedNext, `phase ${p.id} next link`);
    assert.match(p.id, /^[0-9]{2}$/);
    assert.match(p.gate, /^gates\/check_phase_[0-9]{2}\.sh$/);
  });
});

test("prior-phase linkage matches the no-advance rule", () => {
  assert.equal(priorPhaseOf("00"), null);
  assert.equal(priorPhaseOf("01")?.id, "00");
  assert.equal(priorPhaseOf("12")?.id, "11");
  assert.equal(getPhase("05")?.name, "Voice, Visual, and Asset Packaging");
});

test("schema validator enforces required fields and const", () => {
  const schema = {
    type: "object",
    required: ["status", "phaseId"],
    properties: {
      status: { type: "string", const: "PASS" },
      phaseId: { type: "string", pattern: "^[0-9]{2}$" },
    },
    additionalProperties: false,
  };
  assert.deepEqual(validate(schema, { status: "PASS", phaseId: "00" }), []);
  assert.ok(validate(schema, { status: "FAIL", phaseId: "00" }).length > 0);
  assert.ok(validate(schema, { status: "PASS" }).length > 0); // missing phaseId
  assert.ok(validate(schema, { status: "PASS", phaseId: "0" }).length > 0); // pattern
  assert.ok(validate(schema, { status: "PASS", phaseId: "00", extra: 1 }).length > 0);
});

test("extractJsonBlock reads the fenced payload from a record", () => {
  const md = "# Header\n\n```json\n{\"phaseId\":\"00\",\"status\":\"PASS\"}\n```\n";
  assert.deepEqual(extractJsonBlock(md), { phaseId: "00", status: "PASS" });
});
