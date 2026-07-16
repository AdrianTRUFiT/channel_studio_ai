/**
 * Shift 02 — Campaign Intake Engine tests.
 *
 * Proves: deterministic operator-input processing, schema-valid campaign
 * generation, downstream pipeline integration (production package builds from
 * a generated campaign), and rejection of invalid input. The sample campaign
 * regression stays covered by tests/phase_01.campaign.test.ts.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildCampaignFromIntake,
  idPrefixFor,
  slugify,
  DEFAULT_VIDEO_COUNT,
  MAX_VIDEO_COUNT,
} from "../src/intake/campaignIntake.ts";
import { validateCampaignObject } from "../src/campaign/campaign.ts";
import { VIDEO_STATUSES } from "../src/campaign/status.ts";
import { outputIdFor } from "../src/render/renderPlan.ts";
import {
  buildProductionPackage,
  validateProductionManifestObject,
  writeProductionPackage,
} from "../src/production/productionPackage.ts";

const FIXED_NOW = new Date("2026-06-24T00:00:00.000Z");

test("intake is deterministic: same input yields byte-identical campaigns", () => {
  const a = buildCampaignFromIntake({ topic: "Sleep Optimization for Founders", now: FIXED_NOW });
  const b = buildCampaignFromIntake({ topic: "Sleep Optimization for Founders", now: FIXED_NOW });
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

test("generated campaign is schema-valid with the default 20 videos", () => {
  const c = buildCampaignFromIntake({ topic: "Chess Openings", now: FIXED_NOW });
  assert.deepEqual(validateCampaignObject(c), []);
  assert.equal(c.videos.length, DEFAULT_VIDEO_COUNT);
  assert.equal(c.targetVideoCount, DEFAULT_VIDEO_COUNT);
  assert.equal(c.id, "chess-openings");
  assert.deepEqual(c.statusModel, [...VIDEO_STATUSES]);
  assert.equal(c.provenance.dataSource, "mock");
  assert.equal(c.maps.approvalFirewalls.length, 2);
});

test("custom video count is honored and validates (non-20 campaigns)", () => {
  const c = buildCampaignFromIntake({ topic: "Cold Email Basics", videoCount: 7, now: FIXED_NOW });
  assert.deepEqual(validateCampaignObject(c), []);
  assert.equal(c.videos.length, 7);
  const ids = new Set(c.videos.map((v) => v.id));
  assert.equal(ids.size, 7);
  for (const v of c.videos) {
    assert.match(v.id, /^[A-Z0-9]{2,12}-[0-9]{2,4}$/);
    assert.equal(v.review.required, true);
    assert.equal(v.mock, true);
    assert.equal(v.status, "Not Started");
  }
});

test("titles stay unique when the count cycles past the angle templates", () => {
  const c = buildCampaignFromIntake({ topic: "Gardening", videoCount: 45, now: FIXED_NOW });
  assert.deepEqual(validateCampaignObject(c), []);
  const titles = new Set(c.videos.map((v) => v.title));
  assert.equal(titles.size, 45);
});

test("id prefixes and render output ids do not collide with the sample campaign", () => {
  assert.equal(idPrefixFor("Sleep Optimization for Founders"), "SOF");
  assert.equal(slugify("Sleep Optimization for Founders"), "sleep-optimization-for-founders");
  // Legacy alias preserved for the sample campaign…
  assert.equal(outputIdFor("MIAC-01"), "tmiac-001");
  // …while generated campaigns get their own namespace.
  assert.equal(outputIdFor("SOF-01"), "sof-001");
  assert.equal(outputIdFor("SOF-105"), "sof-105");
});

test("INTEGRATION: a generated campaign flows into the 9-part production package", () => {
  const dir = mkdtempSync(join(tmpdir(), "csai-intake-"));
  try {
    const campaign = buildCampaignFromIntake({ topic: "Sleep Optimization for Founders", videoCount: 3, now: FIXED_NOW });
    const campaignPath = join(dir, `${campaign.id}.campaign.json`);
    writeFileSync(campaignPath, JSON.stringify(campaign, null, 2));

    const pkg = buildProductionPackage(campaign.videos[0].id, campaignPath);
    assert.equal(pkg.videoId, "SOF-01");
    assert.equal(pkg.campaignId, campaign.id);
    assert.equal(pkg.liveStatus, "LIVE-INTEGRATION-BLOCKED");
    assert.equal(pkg.publishPackage.autoPostAllowed, false);
    assert.equal(pkg.adapterPayloads.length, 4);

    const { manifest } = writeProductionPackage(pkg, dir);
    assert.deepEqual(validateProductionManifestObject(manifest), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("NEGATIVE: invalid operator input is rejected", () => {
  assert.throws(() => buildCampaignFromIntake({ topic: "" }), /topic is required/);
  assert.throws(() => buildCampaignFromIntake({ topic: "!!!" }), /topic is required/);
  assert.throws(() => buildCampaignFromIntake({ topic: "Valid", videoCount: 0 }), /between 1 and/);
  assert.throws(
    () => buildCampaignFromIntake({ topic: "Valid", videoCount: MAX_VIDEO_COUNT + 1 }),
    /between 1 and/,
  );
  assert.throws(() => buildCampaignFromIntake({ topic: "Valid", videoCount: 2.5 }), /between 1 and/);
  assert.throws(
    () => buildCampaignFromIntake({ topic: "Valid", mode: "live" as never }),
    /mode must be/,
  );
});

test("NEGATIVE: a campaign whose videos do not match its declared target is rejected", () => {
  const c = buildCampaignFromIntake({ topic: "Watercolor Painting", videoCount: 5, now: FIXED_NOW });
  const tampered = { ...c, videos: c.videos.slice(0, 4) };
  const errors = validateCampaignObject(tampered);
  assert.ok(errors.some((e) => /exactly 5 videos/.test(e)), errors.join("\n"));
});
