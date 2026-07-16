/**
 * scripts/intake_campaign.ts — operator CLI for the Campaign Intake Engine.
 *
 *   npm run intake -- --topic "Sleep Optimization for Founders"
 *   npm run intake -- --topic "Chess Openings" --count 10 --mode smoke
 *
 * Flags:
 *   --topic "<text>"       required operator topic
 *   --count N              videos to generate (default 20, max 200)
 *   --mode smoke|full      render-layer mode recorded for the run (default full)
 *   --product-title "<t>"  optional product framing (defaults to the topic)
 *   --product-type "<t>"   optional product type (default content-series)
 *
 * Thin wrapper only: all logic lives in src/intake/campaignIntake.ts so future
 * desktop/web consoles call the same deterministic core. Offline; nothing is
 * rendered, called, or published by intake itself.
 */

import { runIntake, DEFAULT_VIDEO_COUNT, type ProductionMode } from "../src/intake/campaignIntake.ts";

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

  const countRaw = flag("count");
  const videoCount = countRaw === undefined ? DEFAULT_VIDEO_COUNT : Number(countRaw);
  const mode = flag("mode") as ProductionMode | undefined;

  let result;
  try {
    result = runIntake({
      topic,
      videoCount,
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
      `  dataSource: mock · published=false · schema-valid\n` +
      `\nNext steps:\n` +
      `  npm run build:production -- --campaign ${result.campaignFile} --video ${result.videoIds[0]}\n` +
      `  npm run produce:videos -- --campaign ${result.campaignFile}\n`,
  );
  return 0;
}

process.exit(main());
