/**
 * PHASE 03 unit + safety tests for the External Creative Production Adapter.
 *
 * Deterministic, offline, network-free. Verifies the production package builders,
 * the adapter contracts/payloads, the capability matrix/routing, and — most
 * importantly — the SAFETY posture: every adapter is LIVE-INTEGRATION-BLOCKED,
 * payloads are dry-run and not published, and the human review gate blocks.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildProductionPackage,
  validateProductionManifestObject,
  writeProductionPackage,
} from "../src/production/productionPackage.ts";
import { ADAPTERS, ROLE_ROUTES, allAdaptersBlocked, capabilityMatrix } from "../src/adapters/registry.ts";
import { validate } from "../gates/shared/gateUtils.ts";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
type Schema = Parameters<typeof validate>[0];
const schema = (name: string): Schema =>
  JSON.parse(readFileSync(join(repoRoot, "schemas", name), "utf8")) as Schema;

test("production package assembles all required parts for one video", () => {
  const pkg = buildProductionPackage("MIAC-01");
  assert.equal(pkg.videoId, "MIAC-01");
  assert.equal(pkg.published, false);
  assert.equal(pkg.liveStatus, "LIVE-INTEGRATION-BLOCKED");
  assert.ok(pkg.script.hook.length > 0);
  assert.ok(pkg.script.answerWithin60s.length > 0);
  assert.ok(pkg.storyboard.scenes.length >= 5);
  assert.equal(pkg.visualPrompts.prompts.length, pkg.storyboard.scenes.length);
  assert.ok(pkg.voiceover.lines.length > 0);
  assert.equal(pkg.adapterPayloads.length, 4);
  assert.equal(pkg.renderRequest.lanes.length, 4);
  assert.equal(pkg.review.decision, "Pending");
  assert.equal(pkg.review.blocking, true);
});

test("package includes research, blueprint, and publish package (the 9-part contract)", () => {
  const pkg = buildProductionPackage("MIAC-01");
  // Research: offline, mock-labelled, scores in range.
  assert.equal(pkg.research.generator, "deterministic-template");
  assert.ok(pkg.research.audienceQuestions.length >= 3);
  const s = pkg.research.opportunityScore;
  for (const v of [s.demand, s.brandFit, s.monetization, s.retention, s.originality]) {
    assert.ok(v >= 1 && v <= 5, `score ${v} out of 1-5 range`);
  }
  assert.match(s.method, /mock/i);
  // Blueprint: packaging + beats aligned to the storyboard.
  assert.ok(pkg.blueprint.titleOptions.length >= 2);
  assert.equal(pkg.blueprint.beats.length, pkg.storyboard.scenes.length);
  assert.ok(pkg.blueprint.corePromise.length > 0);
  // Publish package: metadata ready, posting hard-blocked.
  const pub = pkg.publishPackage;
  assert.equal(pub.autoPostAllowed, false);
  assert.equal(pub.requiresHumanApproval, true);
  assert.equal(pub.visibility, "private");
  assert.equal(pub.published, false);
  assert.equal(pub.approval.state, "Pending");
  assert.equal(pub.aiDisclosure.syntheticVoice, true);
  assert.ok(pub.hashtags.length > 0 && pub.hashtags.every((h) => h.startsWith("#")));
});

test("opportunity scores are deterministic across builds", () => {
  const a = buildProductionPackage("MIAC-01").research.opportunityScore;
  const b = buildProductionPackage("MIAC-01").research.opportunityScore;
  assert.deepEqual(a, b);
});

test("NEGATIVE: a manifest missing the publish-package artifact is rejected", () => {
  const pkg = buildProductionPackage("MIAC-01");
  const dir = mkdtempSync(join(tmpdir(), "csai-prod-"));
  try {
    const { manifest } = writeProductionPackage(pkg, dir);
    const artifacts = (manifest.artifacts as Array<{ name: string }>).filter(
      (a) => a.name !== "publish-package",
    );
    const errors = validateProductionManifestObject({ ...manifest, artifacts });
    assert.ok(errors.some((e) => /publish-package/.test(e)), errors.join("\n"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("storyboard scene durations sum to the storyboard total", () => {
  const pkg = buildProductionPackage("MIAC-01");
  const sum = pkg.storyboard.scenes.reduce((a, s) => a + s.durationSeconds, 0);
  assert.equal(sum, pkg.storyboard.totalDurationSeconds);
});

test("all four adapter contracts validate and are LIVE-INTEGRATION-BLOCKED", () => {
  const s = schema("adapter-contract.schema.json");
  const vendors = new Set<string>();
  for (const a of ADAPTERS) {
    assert.deepEqual(validate(s, a.contract), [], `contract ${a.contract.id}`);
    assert.equal(a.contract.liveStatus, "LIVE-INTEGRATION-BLOCKED");
    vendors.add(a.contract.vendor);
  }
  assert.equal(ADAPTERS.length, 4);
  assert.equal(allAdaptersBlocked(), true);
  assert.ok(vendors.has("HeyGen") && vendors.has("Higgsfield") && vendors.has("Canva"));
});

test("every adapter payload validates and is dry-run / blocked / not published", () => {
  const pkg = buildProductionPackage("MIAC-01");
  const s = schema("adapter-payload.schema.json");
  for (const payload of pkg.adapterPayloads) {
    assert.deepEqual(validate(s, payload), [], `payload ${payload.adapterId}`);
    assert.equal(payload.dryRun, true);
    assert.equal(payload.published, false);
    assert.equal(payload.liveStatus, "LIVE-INTEGRATION-BLOCKED");
    assert.equal(payload.credentialsPresent, false); // no creds in the test env
  }
});

test("role routing covers the four lanes with a local-mock-render fallback", () => {
  assert.equal(ROLE_ROUTES.length, 4);
  for (const r of ROLE_ROUTES) assert.equal(r.fallback, "local-mock-render");
  assert.equal(capabilityMatrix().length, 4);
});

test("written manifest validates against the production-package schema", () => {
  const dir = mkdtempSync(join(tmpdir(), "csai-prod-"));
  try {
    const pkg = buildProductionPackage("MIAC-01");
    const { manifest } = writeProductionPackage(pkg, dir);
    assert.deepEqual(validateProductionManifestObject(manifest), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("NEGATIVE: a manifest claiming published:true is rejected", () => {
  const pkg = buildProductionPackage("MIAC-01");
  const dir = mkdtempSync(join(tmpdir(), "csai-prod-"));
  try {
    const { manifest } = writeProductionPackage(pkg, dir);
    const tampered = { ...manifest, published: true };
    const errors = validateProductionManifestObject(tampered);
    assert.ok(errors.some((e) => /published/.test(e)), errors.join("\n"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("NEGATIVE: a manifest with a LIVE-READY adapter is rejected in Phase 03", () => {
  const pkg = buildProductionPackage("MIAC-01");
  const dir = mkdtempSync(join(tmpdir(), "csai-prod-"));
  try {
    const { manifest } = writeProductionPackage(pkg, dir);
    const adapters = (manifest.adapters as Array<Record<string, unknown>>).map((a, i) =>
      i === 0 ? { ...a, liveStatus: "LIVE-READY" } : a,
    );
    const tampered = { ...manifest, adapters };
    const errors = validateProductionManifestObject(tampered);
    assert.ok(errors.some((e) => /LIVE-INTEGRATION-BLOCKED/.test(e)), errors.join("\n"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
