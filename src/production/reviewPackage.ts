/**
 * reviewPackage — the MAPS human review firewall for external creative
 * production. The package starts Pending and BLOCKS any live render until a
 * person approves. This preserves the doctrine's decision firewall: AI may
 * assemble the package, but a human gate stands between it and any paid render.
 */

import type { ReviewPackage } from "./types.ts";

export function buildReviewPackage(videoId: string): ReviewPackage {
  return {
    videoId,
    gate: "external-creative-production",
    required: true,
    blocking: true,
    decision: "Pending",
    reviewer: null,
    blocksLiveRenderUntilApproved: true,
    checklist: [
      "Script: opening answer lands in the first 60 seconds",
      "Script: no unverified factual claims",
      "Storyboard: scenes and pacing match the script",
      "Visual prompts: on-brand, no banned content, text-safe",
      "Voiceover: persona and language correct",
      "Adapters: payloads target the intended tool and aspect ratio",
      "Compliance: AI-generated voice/visual disclosure planned",
      "Approval to spend on a paid live render is granted separately",
    ],
    note:
      "Human approval is required before any live (paid) render. Until approved, the only " +
      "available output is the Phase 02 local mock render fallback. Nothing is published.",
  };
}

/** Render the review gate as human-readable REVIEW.md. */
export function reviewMarkdown(review: ReviewPackage, title: string): string {
  return `# REVIEW GATE — ${title}

- **Gate:** ${review.gate}
- **Decision:** ${review.decision} (blocking: ${review.blocking})
- **Reviewer:** ${review.reviewer ?? "(unassigned)"}
- **Blocks live render until approved:** ${review.blocksLiveRenderUntilApproved}

${review.note}

## Checklist
${review.checklist.map((c) => `- [ ] ${c}`).join("\n")}
`;
}
