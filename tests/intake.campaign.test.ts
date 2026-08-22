/**
 * Shift 02 â€” Campaign Intake Engine tests.
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

test("governed content brief is preserved at campaign and video level", () => {
  const c = buildCampaignFromIntake({
    topic: "Built for Pressure",
    videoCount: 2,
    now: FIXED_NOW,
    productTitle: "Built for Pressure Pilot",
    productType: "pilot",
    contentBrief: {
      objective: "Move audiences from awareness into meaningful participation.",
      audiences: ["Athletes", "Coaches", "Parents", "Strategic Partners"],
      coreMessage: "Pressure can be intentionally trained through sport.",
      callToAction: "Train The Mind.",
      contentPrinciples: ["Authentic", "Coach-like", "Evidence-driven", "Clear"],
      sourceAuthority: ["Mind Warriors Communications Hub"],
      claimConstraints: ["Do not publish unverified performance claims."],
      defaultFormat: "60-second vertical video",
    },
  });

  assert.deepEqual(validateCampaignObject(c), []);
  assert.equal(c.contentBrief.objective, "Move audiences from awareness into meaningful participation.");
  assert.deepEqual(c.contentBrief.audiences, ["Athletes", "Coaches", "Parents", "Strategic Partners"]);
  assert.equal(c.contentBrief.callToAction, "Train The Mind.");
  assert.equal(c.videos[0].creativeIntent.audience, "Athletes");
  assert.equal(c.videos[0].creativeIntent.objective, c.contentBrief.objective);
  assert.equal(c.videos[0].creativeIntent.callToAction, c.contentBrief.callToAction);
  assert.equal(c.videos[0].creativeIntent.format, "60-second vertical video");
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
  // Legacy alias preserved for the sample campaignâ€¦
  assert.equal(outputIdFor("MIAC-01"), "tmiac-001");
  // â€¦while generated campaigns get their own namespace.
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

test("single-assignment intake (videoCount: 1) uses the operator's topic and core message verbatim", () => {
  // A one-video campaign IS the governed assignment — there is no "angle" to
  // diversify against, so title/message must reflect the operator's own words,
  // not the generic 20-angle template used for bulk topic-only generation.
  const c = buildCampaignFromIntake({
    topic: "Built for Pressure",
    videoCount: 1,
    now: FIXED_NOW,
    contentBrief: {
      coreMessage: "Composure is demonstrated by how an athlete responds under pressure.",
    },
  });
  assert.deepEqual(validateCampaignObject(c), []);
  assert.equal(c.videos.length, 1);
  assert.equal(c.videos[0].title, "Built for Pressure");
  assert.equal(c.videos[0].summary, "Composure is demonstrated by how an athlete responds under pressure.");
  assert.equal(
    c.videos[0].creativeIntent.message,
    "Composure is demonstrated by how an athlete responds under pressure.",
  );
});

test("multi-video intake (videoCount > 1) keeps the original per-angle template behavior unchanged", () => {
  // Regression guard for the videoCount:1 branch above: bulk generation must
  // still produce distinct, angle-derived titles/messages exactly as before.
  const c = buildCampaignFromIntake({
    topic: "Watercolor Painting",
    videoCount: 3,
    now: FIXED_NOW,
    contentBrief: { coreMessage: "This exact sentence must NOT appear in every video." },
  });
  const messages = new Set(c.videos.map((v) => v.creativeIntent.message));
  assert.equal(messages.size, 3, "each video should keep its own distinct angle-derived message");
  for (const v of c.videos) {
    assert.notEqual(v.creativeIntent.message, "This exact sentence must NOT appear in every video.");
    assert.equal(v.summary, v.creativeIntent.message);
  }
});

// -----------------------------------------------------------------------------
// PROOF CASE — Mind Warriors "Built for Pressure"
//
// Mission: prove the operator intake can consume a REAL governed brief (not
// just a generic topic string) and carry it through to one complete,
// production-ready assignment.
//
// PROVENANCE BOUNDARY (read before trusting this as "hub-verified"): this
// session had NO access to the `mind-warriors-communication-hub` repository —
// git clone, the GitHub API, and a public web fetch were all denied/404 (the
// repo is private and not attached to this session, the same failure mode
// hit earlier for the AVT repository). The brief below is copied verbatim
// from literal text the operator supplied directly in this conversation, NOT
// independently verified against the hub's claims register, canonical
// messaging source, or content extraction map. `sourceAuthority` says so
// explicitly. Treat this as proof the MECHANISM works end-to-end for a real
// brief shape, not as a hub-certified Mind Warriors content assignment.
// -----------------------------------------------------------------------------
test("PROOF CASE: one real Mind Warriors brief flows into one governed assignment and a full production package", () => {
  const dir = mkdtempSync(join(tmpdir(), "csai-mindwarriors-"));
  try {
    const campaign = buildCampaignFromIntake({
      topic: "Built for Pressure",
      productTitle: "Mind Warriors",
      productType: "campaign",
      videoCount: 1, // smallest deterministic proof — not the legacy 20-idea default
      mode: "smoke",
      now: FIXED_NOW,
      contentBrief: {
        objective: "Participation",
        audiences: ["Athletes"],
        coreMessage:
          "Composure is demonstrated by how an athlete responds and returns to the next " +
          "right action under pressure.",
        callToAction: "Train The Mind Challenge",
        contentPrinciples: ["Coach voice", "Evidence-aware", "No unverified performance claims"],
        sourceAuthority: [
          "Mind Warriors Communications Hub (operator-provided brief text; NOT independently " +
            "verified against the hub repository — access was unavailable this session)",
        ],
        claimConstraints: ["Use only claims supported by the governed communications source."],
        defaultFormat: "60-second vertical video",
      },
    });

    // The brief round-trips exactly, at both campaign and video level.
    assert.deepEqual(validateCampaignObject(campaign), []);
    assert.equal(campaign.videos.length, 1);
    assert.equal(campaign.product.title, "Mind Warriors");
    assert.equal(campaign.contentBrief.objective, "Participation");
    assert.equal(campaign.contentBrief.callToAction, "Train The Mind Challenge");

    const video = campaign.videos[0];
    assert.equal(video.title, "Built for Pressure");
    assert.equal(video.creativeIntent.audience, "Athletes");
    assert.equal(video.creativeIntent.objective, "Participation");
    assert.equal(video.creativeIntent.callToAction, "Train The Mind Challenge");
    assert.match(video.creativeIntent.message, /Composure is demonstrated/);

    // Honesty: nothing here claims to be verified/live.
    assert.equal(campaign.provenance.dataSource, "mock");
    assert.match(campaign.contentBrief.sourceAuthority[0], /NOT independently verified/);

    // The SAME governed pipeline every campaign uses — no special-cased path.
    const campaignPath = join(dir, `${campaign.id}.campaign.json`);
    writeFileSync(campaignPath, JSON.stringify(campaign, null, 2));

    const pkg = buildProductionPackage(video.id, campaignPath);
    assert.equal(pkg.videoId, video.id);
    assert.equal(pkg.campaignId, campaign.id);
    assert.equal(pkg.liveStatus, "LIVE-INTEGRATION-BLOCKED");
    assert.equal(pkg.published, false);
    assert.equal(pkg.review.decision, "Pending"); // MAPS gate still blocking
    assert.equal(pkg.publishPackage.autoPostAllowed, false);
    assert.equal(pkg.adapterPayloads.length, 4); // HeyGen, Higgsfield, Canva, Voiceover

    const { manifest } = writeProductionPackage(pkg, dir);
    assert.deepEqual(validateProductionManifestObject(manifest), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

