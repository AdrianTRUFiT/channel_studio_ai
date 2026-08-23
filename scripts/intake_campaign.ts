/**
 * scripts/intake_campaign.ts — operator CLI for the Campaign Intake Engine.
 *
 *   npm run intake -- --topic "Sleep Optimization for Founders"
 *   npm run intake -- --topic "Chess Openings" --count 10 --mode smoke
 *   npm run intake -- --topic "Sleep Optimization for Founders" --cycle topic-cycle
 *
 * Flags:
 *   --topic "<text>"       required operator topic
 *   --count N              videos to generate (default 20, max 200; not used with --cycle topic-cycle)
 *   --cycle topic-cycle    generate exactly 1 evergreen long anchor + 7 derived shorts
 *                          (8 videos, Day 1-7 publishing schedule) instead of N independent videos
 *   --mode smoke|full      render-layer mode recorded for the run (default full)
 *   --product-title "<t>"  optional product framing (defaults to the topic)
 *   --product-type "<t>"   optional product type (default content-series)
 *
 * Thin wrapper only: all logic lives in src/intake/campaignIntake.ts so future
 * desktop/web consoles call the same deterministic core. Offline; nothing is
 * rendered, called, or published by intake itself.
 */

import {
  runIntake,
  DEFAULT_VIDEO_COUNT,
  type ProductionMode,
  type IntakeCycleMode,
} from "../src/intake/campaignIntake.ts";

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function main(): number {
  const topic = flag("topic");
  if (!topic) {
    process.stderr.write(
      'intake: --topic is required.\n  usage: npm run intake -- --topic "Your Topic" [--count 20] [--mode smoke|full]\n',
    );
    return 1;
  }

  const cycle = flag("cycle") as IntakeCycleMode | undefined;
  const countRaw = flag("count");
  const videoCount =
    countRaw === undefined ? (cycle === "topic-cycle" ? undefined : DEFAULT_VIDEO_COUNT) : Number(countRaw);
  const mode = flag("mode") as ProductionMode | undefined;

  let result;
  try {
    result = runIntake({
      topic,
      videoCount,
      cycle,
      mode,
      productTitle: flag("product-title"),
      productType: flag("product-type"),
    });
  } catch (e) {
    process.stderr.write(`${(e as Error).message}\n`);
    return 1;
  }

  const c = result.campaign;
  process.stdout.write(
    `Channel Studio AI — campaign intake\n` +
      `  campaign:  ${c.name}\n` +
      `  id:        ${result.campaignId}\n` +
      `  videos:    ${c.videos.length} (${result.videoIds[0]} … ${result.videoIds[result.videoIds.length - 1]})\n` +
      `  pillars:   ${c.brandPillars.length}\n` +
      `  file:      ${result.campaignFile}${result.overwroteExisting ? "  (overwrote existing — deterministic re-run)" : ""}\n` +
      `  manifest:  ${result.intakeManifestFile}\n` +
      `  dataSource: mock · published=false · schema-valid\n`,
  );

  if (cycle === "topic-cycle") {
    const anchor = c.videos.find((v) => v.assetRole === "long_anchor");
    const shorts = [...c.videos.filter((v) => v.assetRole === "short")].sort(
      (a, b) => (a.publishDay ?? 0) - (b.publishDay ?? 0),
    );
    process.stdout.write(
      `\nTopic Cycle:\n` +
        `  Day 1: ${anchor?.id} (evergreen long anchor, ${anchor?.evergreen?.state}) + ${shorts[0]?.id} (short 1)\n` +
        shorts
          .slice(1)
          .map((s) => `  Day ${s.publishDay}: ${s.id} (short, derivedFrom ${s.derivedFrom})\n`)
          .join(""),
    );
  }

  process.stdout.write(
    `\nNext steps:\n` +
      `  npm run build:production -- --campaign ${result.campaignFile} --video ${result.videoIds[0]}\n` +
      `  npm run produce:videos -- --campaign ${result.campaignFile}\n`,
  );
  return 0;
}

process.exit(main());
