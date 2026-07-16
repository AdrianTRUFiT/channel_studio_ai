/**
 * researchBrief — the Research artifact of a production package.
 *
 * Deterministic and OFFLINE: everything is derived from governed campaign
 * fields (title, summary, authority pillar, brand pillars). Opportunity scores
 * are a mock-deterministic heuristic (stable hash → 1–5), honestly labelled —
 * they are NOT real demand data. Live demand scanning is a later, gated,
 * explicitly-approved integration.
 */

import { createHash } from "node:crypto";
import type { Campaign, VideoAsset } from "../campaign/types.ts";
import type { OpportunityScore, ResearchBrief } from "./types.ts";

/** Stable 1–5 score from a seed — deterministic across runs and machines. */
function scoreFrom(seed: string, dimension: string): number {
  const h = createHash("sha256").update(`${seed}:${dimension}`).digest();
  return 1 + (h[0] % 5);
}

export function buildOpportunityScore(video: VideoAsset): OpportunityScore {
  const seed = `${video.id}:${video.authorityPillar}`;
  const demand = scoreFrom(seed, "demand");
  const brandFit = scoreFrom(seed, "brandFit");
  const monetization = scoreFrom(seed, "monetization");
  const retention = scoreFrom(seed, "retention");
  const originality = scoreFrom(seed, "originality");
  const aggregate =
    Math.round(((demand + brandFit + monetization + retention + originality) / 5) * 10) / 10;
  return {
    demand,
    brandFit,
    monetization,
    retention,
    originality,
    aggregate,
    method:
      "mock-deterministic-heuristic (stable hash of videoId+pillar). NOT real demand data; " +
      "live demand scanning is a future gated integration.",
  };
}

export function buildResearchBrief(campaign: Campaign, video: VideoAsset): ResearchBrief {
  const topic = video.title;
  const pillar = video.authorityPillar;

  const audienceQuestions = [
    `What does "${topic}" actually mean in practice?`,
    `How do I apply ${pillar.toLowerCase()} to my daily thinking?`,
    `What is one concrete example of this model in action?`,
    `Why should I read "${campaign.product.title}" to go deeper?`,
  ];

  const searchKeywords = Array.from(
    new Set(
      [
        ...topic.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/),
        ...pillar.toLowerCase().split(/\s+/),
        "mental models",
        "faceless video",
      ].filter((w) => w.length > 2),
    ),
  );

  return {
    videoId: video.id,
    topic,
    authorityPillar: pillar,
    generator: "deterministic-template",
    audienceQuestions,
    searchKeywords,
    contentAngle: `${video.summary} Framed through the ${pillar} brand pillar for the "${campaign.product.title}" launch.`,
    opportunityScore: buildOpportunityScore(video),
    sources: [
      "governed campaign record (data/campaigns) — no external sources queried in this build",
    ],
    disclaimer:
      "Offline research brief derived from governed campaign data. No live demand scan, search API, " +
      "or analytics source was queried. Scores are a labelled mock heuristic.",
  };
}
