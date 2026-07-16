/**
 * scripts/produce_videos.ts — Phase 02 local video production entry point.
 *
 *   npm run produce:videos              # full: all 20 videos at target length
 *   npm run produce:videos -- --smoke   # smoke sample (fast, few short videos)
 *
 * Flags:
 *   --smoke              smoke mode (default 2 videos, short, smaller frame)
 *   --limit N            produce only the first N campaign videos
 *   --seconds N          total seconds per video (overrides defaults)
 *   --width N / --height N / --fps N
 *
 * Local rendering only. No external APIs. Nothing is published.
 */

import { produceCampaign, resolveFfmpeg } from "../src/render/videoProducer.ts";

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function has(name: string): boolean {
  return process.argv.includes(`--${name}`);
}
function num(name: string): number | undefined {
  const v = flag(name);
  return v === undefined ? undefined : Number(v);
}

function main(): number {
  const smoke = has("smoke");
  const ff = resolveFfmpeg();

  process.stdout.write(
    `Channel Studio AI — local video production (${smoke ? "SMOKE" : "FULL"})\n` +
      `  ffmpeg: ${ff.available ? `${ff.source} — ${ff.version}` : "UNAVAILABLE"}\n`,
  );

  if (!ff.available) {
    process.stdout.write(
      "\nBLOCKER: no local ffmpeg found.\n" +
        "  Phase 02 will not fake an MP4. Install a local ffmpeg (the project vendors\n" +
        "  `ffmpeg-static` via npm install) or set $CSAI_FFMPEG to a binary, then retry.\n" +
        "  Storyboard fallback frames will be written, but no MP4 is produced.\n",
    );
  }

  // Optional governed campaign file (e.g. from the intake engine); defaults to
  // the sample campaign when omitted.
  const campaignPath = flag("campaign");

  const opts = smoke
    ? {
        mode: "smoke" as const,
        campaignPath,
        limit: num("limit") ?? 2,
        totalSeconds: num("seconds") ?? 6,
        width: num("width") ?? 640,
        height: num("height") ?? 360,
        fps: num("fps") ?? 24,
      }
    : {
        mode: "full" as const,
        campaignPath,
        limit: num("limit"),
        totalSeconds: num("seconds"),
        width: num("width") ?? 1280,
        height: num("height") ?? 720,
        fps: num("fps") ?? 24,
      };

  const { manifest, manifestPath, latestPath } = produceCampaign(opts);

  const rendered = manifest.videos.filter((v) => v.status === "rendered");
  process.stdout.write(`\nProduced ${rendered.length}/${manifest.count} artifact(s):\n`);
  for (const v of manifest.videos) {
    const tag = v.status === "rendered" ? "OK " : "BLK";
    const kb = (v.fileBytes / 1024).toFixed(1);
    process.stdout.write(`  [${tag}] ${v.outputPath}  ${v.durationSeconds}s  ${kb} KB  ${v.fileHash.slice(0, 16)}…\n`);
  }
  process.stdout.write(
    `\nManifest:  ${manifestPath}\n` +
      `Latest:    ${latestPath}\n` +
      `Mode:      ${manifest.rendererMode} · published=${manifest.published}\n`,
  );

  // Exit non-zero if NOTHING rendered (honest failure for the gate/user).
  return rendered.length > 0 ? 0 : 1;
}

process.exit(main());
