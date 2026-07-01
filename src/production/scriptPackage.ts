/**
 * scriptPackage — build an AEO-style script package from a campaign video record.
 *
 * This is a DETERMINISTIC TEMPLATE, not AI-authored prose: it scaffolds the
 * hook / 60-second answer / core / example / CTA structure from the existing
 * governed fields so downstream adapters have structured input. LLM-authored
 * scripts are a later enhancement; we do not claim this is polished copy.
 */

import type { Campaign, VideoAsset } from "../campaign/types.ts";
import type { ScriptPackage } from "./types.ts";

const WORDS_PER_SECOND = 2.6; // ~155 wpm narration

function countWords(...parts: string[]): number {
  return parts.join(" ").split(/\s+/).filter(Boolean).length;
}

export function buildScriptPackage(campaign: Campaign, video: VideoAsset): ScriptPackage {
  const pillar = video.authorityPillar;
  const topic = video.title;

  const hook = `${topic}? Here's the model in 60 seconds.`;
  const openingAnswer = `${video.summary}`;
  const answerWithin60s =
    `${video.summary} In short: treat it as a system you can observe, debug, and improve.`;
  const coreExplanation =
    `Through the lens of ${pillar}, ${topic.toLowerCase()} stops being abstract. ` +
    `You get a concrete mental model: name the component, see how it behaves under load, ` +
    `and change one variable at a time.`;
  const example =
    `Example: notice one place this shows up in your day, label it with the model, ` +
    `then make a single deliberate change and watch what shifts.`;
  const cta = `Read "${campaign.product.title}" to go deeper, and follow for the next breakdown.`;

  const dataDensityChecklist = [
    "Opening answer delivered within the first 60 seconds",
    `Anchored to a named brand pillar (${pillar})`,
    "Exactly one concrete example included",
    "One clear, single call to action",
    "No unverified factual claims (flag any for human review)",
  ];

  const wordCount = countWords(hook, openingAnswer, coreExplanation, example, cta);
  const estimatedDurationSeconds = Math.max(1, Math.round(wordCount / WORDS_PER_SECOND));

  return {
    videoId: video.id,
    title: video.title,
    generator: "deterministic-template",
    hook,
    openingAnswer,
    answerWithin60s,
    coreExplanation,
    example,
    cta,
    dataDensityChecklist,
    estimatedDurationSeconds,
    wordCount,
  };
}

/** Render the script package as human-readable SCRIPT.md. */
export function scriptMarkdown(script: ScriptPackage): string {
  return `# SCRIPT — ${script.title}

> Generator: \`${script.generator}\` (deterministic scaffold, not AI-authored prose).
> Estimated narration: ~${script.estimatedDurationSeconds}s (${script.wordCount} words).

## Hook
${script.hook}

## Opening answer (60-second rule)
${script.answerWithin60s}

## Core explanation
${script.coreExplanation}

## Example
${script.example}

## Call to action
${script.cta}

## Data-density checklist
${script.dataDensityChecklist.map((c) => `- [ ] ${c}`).join("\n")}
`;
}
