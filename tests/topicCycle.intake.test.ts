/**
 * Topic Cycle tests.
 *
 * Proves: given one Key Topic, intake in "topic-cycle" mode deterministically
 * emits a schema-valid campaign containing exactly 8 correctly related
 * assets - 1 evergreen long anchor on Day 1, 7 shorts derived from it, Short 1
 * on Day 1 and Shorts 2-7 on Days 2-7 - and that the evergreen requirement on
 * the long anchor is enforced as a gate (a malformed/unverified anchor is
 * rejected), not read as descriptive metadata.
 *
 * Does not touch Phase 03 production logic; only exercises intake + the new
 * topic-cycle validator on top of the existing campaign/video-asset contract.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCampaignFromIntake } from "../src/intake/campaignIntake.ts";
import { validateCampaignObject } from "../src/campaign/campaign.ts";
import {
  TOPIC_CYCLE_SHORT_COUNT,
  TOPIC_CYCLE_VIDEO_COUNT,
  validateTopicCycleObject,
} from "../src/campaign/topicCycle.ts";
import type { VideoAsset } from "../src/campaign/types.ts";

const FIXED_NOW = new Date("2026-06-24T00:00:00.000Z");

test("topic-cycle intake is deterministic: same topic yields byte-identical campaigns", () => {
  const a = buildCampaignFromIntake({ topic: "Sleep Optimization for Founders", cycle: "topic-cycle", now: FIXED_NOW });
  const b = buildCampaignFromIntake({ topic: "Sleep Optimization for Founders", cycle: "topic-cycle", now: FIXED_NOW });
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

test("topic-cycle campaign contains exactly 8 videos and is schema-valid", () => {
  const c = buildCampaignFromIntake({ topic: "Deep Work for Founders", cycle: "topic-cycle", now: FIXED_NOW });
  assert.deepEqual(validateCampaignObject(c), []);
  assert.equal(c.videos.length, TOPIC_CYCLE_VIDEO_COUNT);
  assert.equal(c.targetVideoCount, TOPIC_CYCLE_VIDEO_COUNT);
  assert.equal(TOPIC_CYCLE_VIDEO_COUNT, 8);
  assert.equal(TOPIC_CYCLE_SHORT_COUNT, 7);
});

test("topic-cycle campaign has exactly 1 evergreen long anchor on Day 1", () => {
  const c = buildCampaignFromIntake({ topic: "Deep Work for Founders", cycle: "topic-cycle", now: FIXED_NOW });
  assert.deepEqual(validateTopicCycleObject(c), []);

  const anchors = c.videos.filter((v) => v.assetRole === "long_anchor");
  assert.equal(anchors.length, 1);
  const anchor = anchors[0]!;
  assert.equal(anchor.publishDay, 1);
  assert.equal(anchor.derivedFrom, null);
  assert.equal(anchor.evergreen?.required, true);
  assert.equal(anchor.evergreen?.state, "Verified");
  assert.equal(anchor.title, "Deep Work for Founders"); // the topic itself, verbatim
});

test("topic-cycle campaign has exactly 7 shorts, derived from the anchor, on Days 1-7", () => {
  const c = buildCampaignFromIntake({ topic: "Deep Work for Founders", cycle: "topic-cycle", now: FIXED_NOW });
  const anchor = c.videos.find((v) => v.assetRole === "long_anchor")!;
  const shorts = c.videos.filter((v) => v.assetRole === "short");

  assert.equal(shorts.length, TOPIC_CYCLE_SHORT_COUNT);
  for (const s of shorts) {
    assert.equal(s.derivedFrom, anchor.id);
    assert.equal(s.evergreen, undefined);
  }

  const days = shorts.map((s) => s.publishDay).sort((a, b) => (a ?? 0) - (b ?? 0));
  assert.deepEqual(days, [1, 2, 3, 4, 5, 6, 7]);

  // Short 1 shares Day 1 with the long anchor; Shorts 2-7 own Days 2-7 alone.
  const day1 = shorts.filter((s) => s.publishDay === 1);
  assert.equal(day1.length, 1);
  for (let day = 2; day <= 7; day++) {
    assert.equal(shorts.filter((s) => s.publishDay === day).length, 1);
  }
});

test("publishing schedule matches the canonical 7-day cadence exactly", () => {
  const c = buildCampaignFromIntake({ topic: "Deep Work for Founders", cycle: "topic-cycle", now: FIXED_NOW });
  const byDay = new Map<number, VideoAsset[]>();
  for (const v of c.videos) {
    const day = v.publishDay;
    if (day === undefined) continue;
    byDay.set(day, [...(byDay.get(day) ?? []), v]);
  }

  // Day 1 = Long Video + Short 1 (exactly 2 assets).
  assert.equal(byDay.get(1)?.length, 2);
  assert.ok(byDay.get(1)?.some((v) => v.assetRole === "long_anchor"));
  assert.ok(byDay.get(1)?.some((v) => v.assetRole === "short"));
  // Days 2-7 = exactly one short each.
  for (let day = 2; day <= 7; day++) {
    assert.equal(byDay.get(day)?.length, 1);
    assert.equal(byDay.get(day)?.[0]?.assetRole, "short");
  }
});

test("contentBrief and creativeIntent contracts are preserved unchanged in topic-cycle mode", () => {
  const c = buildCampaignFromIntake({
    topic: "Deep Work for Founders",
    cycle: "topic-cycle",
    now: FIXED_NOW,
    contentBrief: {
      objective: "Build durable authority on one topic per week.",
      audiences: ["Founders"],
      coreMessage: "Deep work compounds; shallow work does not.",
      callToAction: "Subscribe for the weekly breakdown.",
    },
  });
  assert.deepEqual(validateCampaignObject(c), []);
  assert.equal(c.contentBrief.objective, "Build durable authority on one topic per week.");
  assert.equal(c.contentBrief.coreMessage, "Deep work compounds; shallow work does not.");

  const anchor = c.videos.find((v) => v.assetRole === "long_anchor")!;
  assert.equal(anchor.creativeIntent.audience, "Founders");
  assert.equal(anchor.creativeIntent.objective, "Build durable authority on one topic per week.");
  assert.equal(anchor.creativeIntent.callToAction, "Subscribe for the weekly breakdown.");
  assert.equal(anchor.creativeIntent.message, "Deep work compounds; shallow work does not.");

  for (const s of c.videos.filter((v) => v.assetRole === "short")) {
    assert.equal(s.creativeIntent.audience, "Founders");
    assert.equal(s.creativeIntent.objective, "Build durable authority on one topic per week.");
    assert.equal(s.creativeIntent.callToAction, "Subscribe for the weekly breakdown.");
  }
});

test("NEGATIVE: an explicit videoCount conflicting with topic-cycle mode is rejected", () => {
  assert.throws(
    () => buildCampaignFromIntake({ topic: "Deep Work for Founders", cycle: "topic-cycle", videoCount: 20 }),
    /always generates exactly 8 videos/,
  );
});

test("NEGATIVE: evergreen is enforced as a gate, not descriptive metadata", () => {
  const c = buildCampaignFromIntake({ topic: "Deep Work for Founders", cycle: "topic-cycle", now: FIXED_NOW });
  const anchorIndex = c.videos.findIndex((v) => v.assetRole === "long_anchor");

  // Anchor missing the evergreen gate entirely.
  const missingGate = {
    ...c,
    videos: c.videos.map((v, i) => (i === anchorIndex ? { ...v, evergreen: undefined } : v)),
  };
  const err1 = validateTopicCycleObject(missingGate);
  assert.ok(err1.some((e) => /evergreen\.required = true/.test(e)), err1.join("\n"));

  // Anchor declares evergreen required but unverified ("Pending").
  const unverified = {
    ...c,
    videos: c.videos.map((v, i) =>
      i === anchorIndex ? { ...v, evergreen: { required: true, state: "Pending" as const, note: v.evergreen!.note } } : v,
    ),
  };
  const err2 = validateTopicCycleObject(unverified);
  assert.ok(err2.some((e) => /evergreen gate not satisfied/.test(e)), err2.join("\n"));
});

test("NEGATIVE: a short with a broken derivedFrom link is rejected", () => {
  const c = buildCampaignFromIntake({ topic: "Deep Work for Founders", cycle: "topic-cycle", now: FIXED_NOW });
  const shortIndex = c.videos.findIndex((v) => v.assetRole === "short");
  const tampered = {
    ...c,
    videos: c.videos.map((v, i) => (i === shortIndex ? { ...v, derivedFrom: "NOT-THE-ANCHOR-01" } : v)),
  };
  const errors = validateTopicCycleObject(tampered);
  assert.ok(errors.some((e) => /must have derivedFrom equal to the long_anchor id/.test(e)), errors.join("\n"));
});

test("NEGATIVE: a duplicated publishDay among shorts is rejected", () => {
  const c = buildCampaignFromIntake({ topic: "Deep Work for Founders", cycle: "topic-cycle", now: FIXED_NOW });
  const shorts = c.videos.filter((v) => v.assetRole === "short");
  const tampered = {
    ...c,
    videos: c.videos.map((v) => (v.id === shorts[1]!.id ? { ...v, publishDay: 1 } : v)),
  };
  const errors = validateTopicCycleObject(tampered);
  assert.ok(errors.some((e) => /duplicate publishDay/.test(e)), errors.join("\n"));
  assert.ok(errors.some((e) => /no short is assigned to publishDay 2/.test(e)), errors.join("\n"));
});

test("standard (non-cycle) intake is unaffected: default behavior is unchanged", () => {
  const c = buildCampaignFromIntake({ topic: "Chess Openings", now: FIXED_NOW });
  assert.deepEqual(validateCampaignObject(c), []);
  assert.equal(c.videos.length, 20);
  for (const v of c.videos) {
    assert.equal(v.assetRole, undefined);
    assert.equal(v.derivedFrom, undefined);
    assert.equal(v.publishDay, undefined);
    assert.equal(v.evergreen, undefined);
  }
});
