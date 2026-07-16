/**
 * publishPackage — the Publish artifact of a production package.
 *
 * Publish-READY metadata only. Auto-posting is HARD-BLOCKED by construction:
 * `autoPostAllowed` is the literal type `false`, human approval is required,
 * visibility is `private`, and AI-generated voice/visuals are disclosed. No
 * YouTube (or any) API is called anywhere in this lane.
 */

import type { Campaign, VideoAsset } from "../campaign/types.ts";
import type { NarrativeBlueprint, PublishPackage, ScriptPackage } from "./types.ts";

export function buildPublishPackage(
  campaign: Campaign,
  video: VideoAsset,
  script: ScriptPackage,
  blueprint: NarrativeBlueprint,
): PublishPackage {
  const hashtags = Array.from(
    new Set(
      [
        ...video.authorityPillar.toLowerCase().split(/\s+/),
        "mentalmodels",
        "themindisacomputer",
        "faceless",
      ].map((w) => `#${w.replace(/[^a-z0-9]/g, "")}`),
    ),
  ).slice(0, 8);

  const description = [
    script.answerWithin60s,
    "",
    `From the "${campaign.product.title}" launch series — ${video.authorityPillar}.`,
    script.cta,
    "",
    "Disclosure: this video uses AI-generated voice and visuals.",
  ].join("\n");

  return {
    videoId: video.id,
    platform: "youtube",
    title: video.title,
    description,
    hashtags,
    thumbnailDirection: blueprint.thumbnailConcept,
    visibility: "private",
    aiDisclosure: {
      syntheticVoice: true,
      syntheticVisuals: true,
      disclosureText:
        "This content contains AI-generated (synthetic) voice and visuals and will be disclosed " +
        "as altered/synthetic content at publish time.",
    },
    autoPostAllowed: false,
    requiresHumanApproval: true,
    approval: { state: "Pending", approver: null },
    published: false,
    disclaimer:
      "Publish-ready metadata only. No upload or post occurred, no platform API was called, and " +
      "auto-posting is blocked pending explicit human approval.",
  };
}
