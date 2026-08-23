/**
 * Topic Cycle governance - the deterministic 1-Key-Topic weekly production
 * unit:
 *
 *   1 Key Topic -> 1 Evergreen Long Video -> 7 Shorts derived from it
 *   -> 8 total assets -> 7 publishing days (Day 1 = Long Video + Short 1,
 *   Days 2-7 = Shorts 2-7).
 *
 * This module does NOT redesign the Campaign/VideoAsset contract or Phase 03
 * production logic. It adds one small, additive governance layer on top of
 * the existing campaign state model: the shape of a Topic Cycle's 8 videos,
 * and a validator that enforces it as a production gate rather than treating
 * `assetRole`/`derivedFrom`/`publishDay`/`evergreen` as descriptive metadata
 * a campaign could carry without consequence.
 */

import type { Campaign, VideoAsset } from "./types.ts";

/** A Topic Cycle always contains exactly 1 long_anchor + 7 shorts. */
export const TOPIC_CYCLE_SHORT_COUNT = 7;
export const TOPIC_CYCLE_VIDEO_COUNT = TOPIC_CYCLE_SHORT_COUNT + 1;

/** Evergreen long-anchor target duration (10 minutes) vs. a 60s short. */
export const LONG_ANCHOR_DURATION_SECONDS = 600;
export const SHORT_DURATION_SECONDS = 60;

/**
 * Validate a campaign against the Topic Cycle contract. Returns a list of
 * human-readable errors; an empty list means the campaign represents exactly
 * one Key Topic as 1 evergreen long anchor + 7 correctly derived, correctly
 * scheduled shorts.
 *
 * This is the enforcement point for the hard rule "the long anchor MUST be
 * evergreen": a campaign whose anchor lacks `evergreen.required === true` and
 * `evergreen.state === "Verified"` fails validation here, even if it is
 * otherwise schema-valid. Evergreen is checked as a gate, not read as a
 * label.
 */
export function validateTopicCycleObject(campaign: Campaign): string[] {
  const errors: string[] = [];
  const videos: VideoAsset[] = Array.isArray(campaign?.videos) ? campaign.videos : [];

  if (videos.length !== TOPIC_CYCLE_VIDEO_COUNT) {
    errors.push(
      `topic-cycle campaign must contain exactly ${TOPIC_CYCLE_VIDEO_COUNT} videos ` +
        `(1 long_anchor + ${TOPIC_CYCLE_SHORT_COUNT} shorts), found ${videos.length}`,
    );
  }

  const anchors = videos.filter((v) => v.assetRole === "long_anchor");
  const shorts = videos.filter((v) => v.assetRole === "short");
  const other = videos.filter((v) => v.assetRole !== "long_anchor" && v.assetRole !== "short");

  if (anchors.length !== 1) {
    errors.push(`topic-cycle campaign must contain exactly 1 long_anchor video, found ${anchors.length}`);
  }
  if (shorts.length !== TOPIC_CYCLE_SHORT_COUNT) {
    errors.push(`topic-cycle campaign must contain exactly ${TOPIC_CYCLE_SHORT_COUNT} short videos, found ${shorts.length}`);
  }
  if (other.length > 0) {
    errors.push(
      `topic-cycle campaign contains ${other.length} video(s) with an assetRole other than ` +
        `"long_anchor"/"short": ${other.map((v) => v.id).join(", ")}`,
    );
  }

  const anchor = anchors[0];
  if (anchor) {
    if (anchor.derivedFrom !== null && anchor.derivedFrom !== undefined) {
      errors.push(`long_anchor ${anchor.id} must not have derivedFrom set (it is the source, not a derivative)`);
    }
    if (anchor.publishDay !== 1) {
      errors.push(`long_anchor ${anchor.id} must publish on Day 1, found ${String(anchor.publishDay)}`);
    }
    // The evergreen gate: presence of the field alone is not sufficient.
    if (!anchor.evergreen || anchor.evergreen.required !== true) {
      errors.push(
        `long_anchor ${anchor.id} must declare evergreen.required = true ` +
          `(evergreen is a production gate, not descriptive metadata)`,
      );
    } else if (anchor.evergreen.state !== "Verified") {
      errors.push(
        `long_anchor ${anchor.id} evergreen gate not satisfied: state is ` +
          `"${anchor.evergreen.state}", expected "Verified"`,
      );
    }
  }

  const seenDays = new Set<number>();
  for (const s of shorts) {
    const where = `short ${s.id}`;
    const expectedAnchorId = anchor?.id;
    if (!expectedAnchorId || s.derivedFrom !== expectedAnchorId) {
      errors.push(`${where} must have derivedFrom equal to the long_anchor id ("${expectedAnchorId ?? "?"}"), found "${String(s.derivedFrom)}"`);
    }
    if (typeof s.publishDay !== "number" || !Number.isInteger(s.publishDay) || s.publishDay < 1 || s.publishDay > TOPIC_CYCLE_SHORT_COUNT) {
      errors.push(`${where} must have an integer publishDay between 1 and ${TOPIC_CYCLE_SHORT_COUNT}, found ${String(s.publishDay)}`);
    } else {
      if (seenDays.has(s.publishDay)) errors.push(`${where}: duplicate publishDay ${s.publishDay} among shorts`);
      seenDays.add(s.publishDay);
    }
    if (s.evergreen !== undefined) {
      errors.push(`${where} must not carry an evergreen gate - only the long_anchor is evergreen`);
    }
  }
  for (let day = 1; day <= TOPIC_CYCLE_SHORT_COUNT; day++) {
    if (!seenDays.has(day)) errors.push(`no short is assigned to publishDay ${day} (Day ${day} of the 7-day cycle)`);
  }

  return errors;
}
