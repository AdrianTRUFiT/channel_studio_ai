/**
 * scripts/build_production_package.ts — Phase 03 entry point.
 *
 *   npm run build:production                 # builds the package for MIAC-01
 *   npm run build:production -- --video MIAC-03
 *
 * Converts ONE campaign video record into a complete external-production
 * package (script, storyboard, prompts, voiceover, animation direction,
 * adapter payloads, render request, human review gate). OFFLINE ONLY: no
 * external tool is called, nothing is published, review starts Pending.
 *
 * One video at a time by design — no batching of all 20 in Phase 03.
 */

import { buildProductionPackage, writeProductionPackage } from "../src/production/productionPackage.ts";
import { allAdaptersBlocked } from "../src/adapters/registry.ts";
import { TARGET_VIDEO_ID } from "../src/production/types.ts";

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function main(): number {
  const videoId = flag("video") ?? TARGET_VIDEO_ID;

  process.stdout.write(`Channel Studio AI — external creative production package\n  video: ${videoId}\n`);

  const pkg = buildProductionPackage(videoId);
  const { dir, manifestPath } = writeProductionPackage(pkg);

  const liveReady = pkg.adapterPayloads.filter((p) => p.liveStatus === "LIVE-READY").length;
  process.stdout.write(
    `\nBuilt package at: ${dir}\n` +
      `  research:    opportunity aggregate ${pkg.research.opportunityScore.aggregate} (mock heuristic)\n` +
      `  blueprint:   ${pkg.blueprint.titleOptions.length} title options, ${pkg.blueprint.beats.length} beats\n` +
      `  script:      ${pkg.script.wordCount} words (~${pkg.script.estimatedDurationSeconds}s)\n` +
      `  storyboard:  ${pkg.storyboard.scenes.length} scenes (${pkg.storyboard.totalDurationSeconds}s, ${pkg.storyboard.aspectRatio})\n` +
      `  prompts:     ${pkg.visualPrompts.prompts.length} visual prompts\n` +
      `  voiceover:   ${pkg.voiceover.lines.length} lines (${pkg.voiceover.totalWords} words)\n` +
      `  adapters:    ${pkg.adapterPayloads.length} payloads (HeyGen, Higgsfield, Canva, Voiceover)\n` +
      `  review:      ${pkg.review.decision} (blocking=${pkg.review.blocking})\n` +
      `  publish:     ${pkg.publishPackage.visibility}, autoPost=${pkg.publishPackage.autoPostAllowed}, approval ${pkg.publishPackage.approval.state}\n` +
      `  liveStatus:  ${pkg.liveStatus}  ·  published=${pkg.published}\n` +
      `  manifest:    ${manifestPath}\n`,
  );

  // Safety assertion: Phase 03 must never go live. Fail loudly if it would.
  if (!allAdaptersBlocked() || liveReady > 0 || pkg.published !== false) {
    process.stderr.write("\nSAFETY ABORT: an adapter was not blocked / package not offline. Refusing.\n");
    return 1;
  }

  process.stdout.write(
    "\nNo external tool was called. Live render is LIVE-INTEGRATION-BLOCKED and requires both\n" +
      "human review approval and explicit paid-API approval. Fallback lane: local-mock-render (Phase 02).\n",
  );
  return 0;
}

process.exit(main());
