/**
 * videoProducer — local, deterministic MP4 production. NO external APIs.
 *
 * Pipeline per video:
 *   campaign record → renderPlan → PNG scene frames (pure JS) → ffmpeg encodes
 *   the frames into an H.264 MP4 with a SILENT placeholder audio track → sha256.
 *
 * ffmpeg is resolved locally only: $CSAI_FFMPEG / $FFMPEG_PATH, then the
 * vendored `ffmpeg-static` binary, then a system `ffmpeg` on PATH. If none is
 * usable, production is NOT faked: each video is marked blocked-no-ffmpeg and
 * the caller reports the blocker.
 *
 * "local-mock-render" is honest: the visuals are generated slides and the audio
 * is a silent placeholder — no real narration or AI video is involved.
 */

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  statSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { loadCampaign } from "../campaign/campaign.ts";
import type { Campaign } from "../campaign/types.ts";
import { Frame, type RGB } from "./frameCanvas.ts";
import { buildRenderPlan, type RenderPlan, type Scene } from "./renderPlan.ts";
import {
  writeManifest,
  type RenderManifest,
  type RenderMode,
  type RendererMode,
  type VideoArtifact,
} from "./renderManifest.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
// require() shim for ESM scope (used to locate the vendored ffmpeg-static path).
const require = createRequire(import.meta.url);
function repoRoot(): string {
  return resolve(__dirname, "..", "..");
}

const WHITE: RGB = { r: 235, g: 240, b: 248 };
const DIM: RGB = { r: 150, g: 165, b: 190 };
const ACCENT: RGB = { r: 91, g: 140, b: 255 };
const MOCK: RGB = { r: 245, g: 185, b: 69 };

export interface FfmpegInfo {
  available: boolean;
  path: string | null;
  source: string;
  version: string | null;
}

/** Resolve a usable local ffmpeg binary (no network, no API). */
export function resolveFfmpeg(): FfmpegInfo {
  const candidates: Array<{ path: string | null; source: string }> = [];
  if (process.env.CSAI_FFMPEG) candidates.push({ path: process.env.CSAI_FFMPEG, source: "env:CSAI_FFMPEG" });
  if (process.env.FFMPEG_PATH) candidates.push({ path: process.env.FFMPEG_PATH, source: "env:FFMPEG_PATH" });
  try {
    // ffmpeg-static default export is the absolute path to a vendored binary.
    const mod = require("ffmpeg-static") as string | { default?: string };
    const p = typeof mod === "string" ? mod : mod?.default ?? null;
    if (p) candidates.push({ path: p, source: "ffmpeg-static" });
  } catch {
    /* not installed — fall through */
  }
  candidates.push({ path: "ffmpeg", source: "system-path" });

  for (const c of candidates) {
    if (!c.path) continue;
    if (c.source !== "system-path" && !existsSync(c.path)) continue;
    const probe = spawnSync(c.path, ["-version"], { encoding: "utf8" });
    if (probe.status === 0) {
      const version = (probe.stdout.split("\n")[0] || "").trim() || null;
      return { available: true, path: c.path, source: c.source, version };
    }
  }
  return { available: false, path: null, source: "none", version: null };
}

/** Render one scene to a PNG buffer. */
function renderScene(scene: Scene, plan: RenderPlan, index: number): Buffer {
  const f = new Frame(plan.width, plan.height);
  f.verticalGradient(scene.bgTop, scene.bgBottom);

  const cx = plan.width / 2;
  const margin = Math.round(plan.width * 0.08);
  const maxW = plan.width - margin * 2;

  // Accent rule under the heading.
  const headScale = Math.max(3, Math.round(plan.width / 200)); // ~6 at 1280
  const bodyScale = Math.max(2, Math.round(plan.width / 360)); // ~3-4 at 1280
  const kicker = scene.kind.toUpperCase();

  // Kicker (scene kind) top-left.
  f.drawText(kicker, margin, Math.round(plan.height * 0.1), Math.max(2, bodyScale - 1), ACCENT);

  // Heading (wrapped, centered).
  const headLines = f.wrapText(scene.heading.toUpperCase(), maxW, headScale).slice(0, 3);
  const headLineH = 7 * headScale + headScale * 2;
  let y = Math.round(plan.height * 0.3);
  for (const line of headLines) {
    f.drawTextCentered(line, cx, y, headScale, WHITE);
    y += headLineH;
  }

  // Accent bar.
  f.fillRect(Math.round(cx - 60), y + 6, 120, Math.max(2, headScale), ACCENT);
  y += 6 + headScale + Math.round(plan.height * 0.04);

  // Body (wrapped, centered).
  const bodyLines = f.wrapText(scene.body, maxW, bodyScale).slice(0, 4);
  const bodyLineH = 7 * bodyScale + bodyScale * 3;
  for (const line of bodyLines) {
    f.drawTextCentered(line, cx, y, bodyScale, DIM);
    y += bodyLineH;
  }

  // Footer: identity + honest mock / not-published label.
  const footScale = Math.max(2, bodyScale - 1);
  const footY = plan.height - Math.round(plan.height * 0.08);
  f.drawText(`${plan.outputId}  SCENE ${index + 1}`, margin, footY, footScale, DIM);
  const label = "LOCAL MOCK RENDER - NOT PUBLISHED";
  f.drawText(label, margin, footY + 7 * footScale + footScale * 2, footScale, MOCK);

  return f.toPNG();
}

function sha256File(path: string): string {
  return "sha256:" + createHash("sha256").update(readFileSync(path)).digest("hex");
}

export interface ProduceVideoOptions {
  totalSeconds?: number;
  width?: number;
  height?: number;
  fps?: number;
}

/** Produce a single MP4 (or a blocked artifact if ffmpeg is unavailable). */
export function produceOneVideo(
  campaign: Campaign,
  videoId: string,
  ff: FfmpegInfo,
  outDir: string,
  opts: ProduceVideoOptions = {},
): VideoArtifact {
  const video = campaign.videos.find((v) => v.id === videoId);
  if (!video) throw new Error(`unknown video id ${videoId}`);

  const plan = buildRenderPlan(campaign, video, opts);
  const createdAt = new Date().toISOString();
  const baseDisclaimer =
    "Local mock render. Generated slides + silent placeholder audio. No external publishing occurred.";

  mkdirSync(outDir, { recursive: true });

  if (!ff.available) {
    // Honest fallback: cannot fake an MP4 without an encoder. Persist a single
    // storyboard frame so the blocker is inspectable, and mark it blocked.
    const png = renderScene(plan.scenes[0], plan, 0);
    const outPath = join(outDir, `${plan.outputId}.fallback.png`);
    writeFileSync(outPath, png);
    return {
      videoId: video.id,
      title: video.title,
      sourceCampaignId: campaign.id,
      outputPath: relForManifest(outPath),
      durationSeconds: plan.totalDurationSeconds,
      status: "blocked-no-ffmpeg",
      fileHash: sha256File(outPath),
      fileBytes: statSync(outPath).size,
      createdAt,
      rendererMode: "local-frames-only-no-ffmpeg",
      disclaimer: baseDisclaimer + " ffmpeg unavailable: MP4 not produced.",
      scenes: plan.scenes.length,
    };
  }

  const tmp = mkdtempSync(join(tmpdir(), `csai-render-${plan.outputId}-`));
  try {
    const listLines: string[] = [];
    plan.scenes.forEach((scene, i) => {
      const pngPath = join(tmp, `scene${String(i).padStart(2, "0")}.png`);
      writeFileSync(pngPath, renderScene(scene, plan, i));
      listLines.push(`file '${pngPath.replace(/'/g, "'\\''")}'`);
      listLines.push(`duration ${scene.durationSeconds}`);
    });
    // Repeat the final image so its duration is honored by the concat demuxer.
    const lastPng = join(tmp, `scene${String(plan.scenes.length - 1).padStart(2, "0")}.png`);
    listLines.push(`file '${lastPng.replace(/'/g, "'\\''")}'`);
    const listPath = join(tmp, "scenes.txt");
    writeFileSync(listPath, listLines.join("\n") + "\n");

    const outPath = join(outDir, `${plan.outputId}.mp4`);
    const args = [
      "-y", "-hide_banner", "-loglevel", "error",
      "-f", "concat", "-safe", "0", "-i", listPath,
      "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
      "-vf", `fps=${plan.fps},format=yuv420p,scale=${plan.width}:${plan.height}:flags=neighbor,setsar=1`,
      "-c:v", "libx264", "-preset", "ultrafast", "-tune", "stillimage", "-crf", "28",
      "-c:a", "aac", "-b:a", "64k", "-shortest",
      "-fflags", "+bitexact", "-flags:v", "+bitexact", "-flags:a", "+bitexact", "-map_metadata", "-1",
      "-movflags", "+faststart",
      outPath,
    ];
    const res = spawnSync(ff.path as string, args, { encoding: "utf8" });
    if (res.status !== 0 || !existsSync(outPath)) {
      throw new Error(`ffmpeg failed for ${plan.outputId}: ${res.stderr || res.error?.message || "unknown"}`);
    }

    return {
      videoId: video.id,
      title: video.title,
      sourceCampaignId: campaign.id,
      outputPath: relForManifest(outPath),
      durationSeconds: plan.totalDurationSeconds,
      status: "rendered",
      fileHash: sha256File(outPath),
      fileBytes: statSync(outPath).size,
      createdAt,
      rendererMode: "local-mock-render",
      disclaimer: baseDisclaimer,
      scenes: plan.scenes.length,
    };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function relForManifest(absPath: string): string {
  const root = repoRoot();
  return absPath.startsWith(root) ? absPath.slice(root.length + 1) : absPath;
}

export interface ProduceCampaignOptions extends ProduceVideoOptions {
  mode: RenderMode;
  /** Limit number of videos (smoke samples). Undefined = all videos. */
  limit?: number;
  campaignPath?: string;
}

export interface ProduceResult {
  manifest: RenderManifest;
  manifestPath: string;
  latestPath: string;
}

/** Produce a campaign (smoke sample or full) and write the manifest. */
export function produceCampaign(opts: ProduceCampaignOptions): ProduceResult {
  const campaign = loadCampaign(opts.campaignPath);
  const ff = resolveFfmpeg();
  const outDir = join(repoRoot(), "outputs", "videos");

  const chosen = (opts.limit ? campaign.videos.slice(0, opts.limit) : campaign.videos).map((v) => v.id);
  const artifacts: VideoArtifact[] = chosen.map((id) =>
    produceOneVideo(campaign, id, ff, outDir, opts),
  );

  const anyBlocked = artifacts.some((a) => a.status === "blocked-no-ffmpeg");
  const rendererMode: RendererMode = anyBlocked ? "local-frames-only-no-ffmpeg" : "local-mock-render";

  const manifest: RenderManifest = {
    campaignId: campaign.id,
    mode: opts.mode,
    rendererMode,
    ffmpeg: { available: ff.available, source: ff.source, version: ff.version },
    generatedAt: new Date().toISOString(),
    count: artifacts.length,
    published: false,
    disclaimer:
      "Local Phase 02 production. All artifacts generated on-machine with a silent placeholder audio track. " +
      "No external APIs, no rendering services, nothing published.",
    videos: artifacts,
  };

  const manifestPath = join(repoRoot(), "outputs", "manifests", `manifest-${campaign.id}-${opts.mode}.json`);
  const latestPath = join(repoRoot(), "outputs", "manifests", "latest.json");
  writeManifest(manifestPath, manifest);
  writeManifest(latestPath, manifest);
  updateDashboardStatus(manifest, manifestPath);

  return { manifest, manifestPath, latestPath };
}

/** Reflect the most recent run in the committed dashboard status file. */
function updateDashboardStatus(manifest: RenderManifest, manifestPath: string): void {
  const statusPath = join(repoRoot(), "web", "src", "data", "renderStatus.json");
  if (!existsSync(statusPath)) return;
  const status = JSON.parse(readFileSync(statusPath, "utf8")) as Record<string, unknown>;
  status.lastRun = {
    mode: manifest.mode,
    rendererMode: manifest.rendererMode,
    producedCount: manifest.count,
    renderedCount: manifest.videos.filter((v) => v.status === "rendered").length,
    manifestFile: relForManifest(manifestPath),
    videoFiles: manifest.videos.map((v) => v.outputPath),
    ffmpeg: manifest.ffmpeg,
    published: manifest.published,
    generatedAt: manifest.generatedAt,
  };
  writeFileSync(statusPath, JSON.stringify(status, null, 2) + "\n", "utf8");
}
