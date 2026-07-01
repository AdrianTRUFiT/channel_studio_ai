/**
 * blueprint — the Narrative Blueprint artifact of a production package.
 *
 * Deterministic packaging + retention design derived from the research brief,
 * script package, and storyboard. This is the strategic layer between research
 * and script execution: audience, promise, angle, title/thumbnail packaging,
 * and beat map. Template-generated and labelled as such.
 */

import type { Campaign, VideoAsset } from "../campaign/types.ts";
import type {
  NarrativeBlueprint,
  ResearchBrief,
  ScriptPackage,
  Storyboard,
} from "./types.ts";

export function buildBlueprint(
  campaign: Campaign,
  video: VideoAsset,
  research: ResearchBrief,
  script: ScriptPackage,
  storyboard: Storyboard,
): NarrativeBlueprint {
  const pillar = video.authorityPillar;

  return {
    videoId: video.id,
    generator: "deterministic-template",
    targetAudience:
      `Self-improvement viewers curious about ${pillar.toLowerCase()} who want practical ` +
      `mental models, not academic theory — the launch audience for "${campaign.product.title}".`,
    corePromise: script.answerWithin60s,
    narrativeAngle: research.contentAngle,
    retentionDesign: [
      "Answer the core question inside the first 60 seconds (AEO rule)",
      "One idea per scene; on-screen text mirrors narration beats",
      "Concrete example before the CTA to earn the ask",
      "Hard cuts on beats; no scene longer than ~15 seconds",
    ],
    titleOptions: [
      { title: video.title, style: "direct (campaign canonical)" },
      { title: `${script.hook.replace(/\?.*$/, "?")}`, style: "question hook" },
      { title: `${pillar}: ${video.summary.slice(0, 60)}`, style: "pillar-led" },
    ],
    thumbnailConcept:
      `Dark editorial card, bold 3–5 word phrase from the title, single ${pillar.toLowerCase()} ` +
      `icon/diagram motif, blue accent (#5b8cff) on near-black (#0b0f17). Text-safe margins.`,
    beats: storyboard.scenes.map((s) => ({
      index: s.index,
      beat: s.kind,
      purpose: s.onScreenText,
    })),
  };
}
