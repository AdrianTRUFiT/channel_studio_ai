/**
 * PHASE 01 one-unit smoke + enforcement tests for the campaign state model.
 *
 * Proves the gate can load the campaign and count exactly 20 videos, that the
 * data conforms to the schemas, and that the validator REJECTS a campaign with
 * the wrong video count (negative check) — using an in-memory mutation so the
 * real data file is never modified.
 *
 * Run with `node --test`.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  loadCampaign,
  validateCampaignObject,
  validateCampaignFile,
} from "../src/campaign/campaign.ts";
import { REQUIRED_VIDEO_COUNT, VIDEO_STATUSES, isVideoStatus } from "../src/campaign/status.ts";

test("sample campaign loads and contains exactly 20 videos", () => {
  const campaign = loadCampaign();
  assert.equal(campaign.videos.length, REQUIRED_VIDEO_COUNT);
  assert.equal(campaign.product.title, "The Mind Is a Computer");
});

test("sample campaign validates cleanly against the Phase 01 schemas", () => {
  const { errors } = validateCampaignFile();
  assert.deepEqual(errors, [], `expected no errors, got:\n${errors.join("\n")}`);
});

test("every video has a valid status, unique id, and required MAPS review state", () => {
  const campaign = loadCampaign();
  const ids = new Set<string>();
  for (const v of campaign.videos) {
    assert.match(v.id, /^MIAC-\d{2}$/, `bad id ${v.id}`);
    assert.ok(!ids.has(v.id), `duplicate id ${v.id}`);
    ids.add(v.id);
    assert.ok(isVideoStatus(v.status), `bad status ${v.status}`);
    assert.equal(v.review.required, true, `${v.id} must require human review (MAPS)`);
    assert.equal(v.mock, true, `${v.id} must be marked mock in Phase 01`);
  }
  assert.equal(ids.size, REQUIRED_VIDEO_COUNT);
});

test("campaign.statusModel deep-equals the canonical status enum", () => {
  const campaign = loadCampaign();
  assert.deepEqual(campaign.statusModel, [...VIDEO_STATUSES]);
});

test("provenance is honest: data is mock and nothing real is claimed", () => {
  const campaign = loadCampaign();
  assert.equal(campaign.provenance.dataSource, "mock");
  assert.ok(campaign.provenance.notReal.includes("video rendering"));
  assert.ok(campaign.provenance.notReal.includes("analytics ingestion"));
});

test("NEGATIVE: a campaign without exactly 20 videos is rejected", () => {
  const campaign = loadCampaign();
  const tooFew = { ...campaign, videos: campaign.videos.slice(0, 19) };
  const errors = validateCampaignObject(tooFew);
  assert.ok(
    errors.some((e) => /exactly 20 videos/.test(e)),
    `expected a 20-video count error, got:\n${errors.join("\n")}`,
  );
});

test("NEGATIVE: a tampered statusModel is rejected", () => {
  const campaign = loadCampaign();
  const tampered = { ...campaign, statusModel: campaign.statusModel.slice().reverse() };
  const errors = validateCampaignObject(tampered);
  assert.ok(
    errors.some((e) => /statusModel/.test(e)),
    `expected a statusModel error, got:\n${errors.join("\n")}`,
  );
});
