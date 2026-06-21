/**
 * Phase 01 — Campaign state model: the canonical status enum.
 *
 * This is the governed source of truth for video lifecycle status. The sample
 * campaign JSON carries a `statusModel` array that MUST deep-equal this list,
 * and the dashboard renders the pipeline in this exact order. Code governs.
 */

/** Ordered video lifecycle statuses (intake → published), plus Blocked. */
export const VIDEO_STATUSES = [
  "Not Started",
  "Researching",
  "Blueprint Ready",
  "Script Ready",
  "Voice Ready",
  "Visuals Ready",
  "Render Ready",
  "Human Review",
  "Approved",
  "Publish Ready",
  "Published",
  "Blocked",
] as const;

export type VideoStatus = (typeof VIDEO_STATUSES)[number];

/** MAPS human-review decision states (Machine Assisted, Person Supervised). */
export const REVIEW_DECISIONS = ["Pending", "Approved", "Rejected", "Not Reached"] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

/** A campaign must contain exactly this many video records in Phase 01. */
export const REQUIRED_VIDEO_COUNT = 20;

/** Canonical path (relative to repo root) of the Phase 01 sample campaign. */
export const SAMPLE_CAMPAIGN_PATH = "data/campaigns/the-mind-is-a-computer.campaign.json";

export function isVideoStatus(value: unknown): value is VideoStatus {
  return typeof value === "string" && (VIDEO_STATUSES as readonly string[]).includes(value);
}
