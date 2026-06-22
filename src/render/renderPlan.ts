/**
 * renderPlan — turn a governed campaign video record into a deterministic
 * scene list. No script generation lives here yet (that is a later phase): we
 * derive title / hook / point / CTA / disclaimer cards from the existing
 * campaign fields, honestly labelled as a local mock render.
 */

import type { Campaign, VideoAsset } from "../campaign/types.ts";
import type { RGB } from "./frameCanvas.ts";

export type SceneKind = "title" | "hook" | "point" | "cta" | "disclaimer";

export interface Scene {
  kind: SceneKind;
  heading: string;
  body: string;
  durationSeconds: number;
  bgTop: RGB;
  bgBottom: RGB;
}

export interface RenderPlan {
  videoId: string;
  outputId: string;
  title: string;
  sourceCampaignId: string;
  width: number;
  height: number;
  fps: number;
  scenes: Scene[];
  totalDurationSeconds: number;
  rendererMode: "local-mock-render";
}

export interface PlanOptions {
  /** Total seconds for the whole video; defaults to the video's target. */
  totalSeconds?: number;
  width?: number;
  height?: number;
  fps?: number;
}

const PALETTE: Record<SceneKind, { top: RGB; bottom: RGB }> = {
  title: { top: { r: 14, g: 20, b: 34 }, bottom: { r: 26, g: 44, b: 84 } },
  hook: { top: { r: 18, g: 24, b: 38 }, bottom: { r: 20, g: 30, b: 52 } },
  point: { top: { r: 16, g: 22, b: 36 }, bottom: { r: 24, g: 34, b: 56 } },
  cta: { top: { r: 30, g: 22, b: 60 }, bottom: { r: 14, g: 18, b: 40 } },
  disclaimer: { top: { r: 36, g: 28, b: 10 }, bottom: { r: 18, g: 14, b: 6 } },
};

/** Map a campaign video id (MIAC-01) to an output id (tmiac-001). */
export function outputIdFor(videoId: string): string {
  const m = videoId.match(/(\d+)\s*$/);
  const n = m ? parseInt(m[1], 10) : 0;
  return `tmiac-${String(n).padStart(3, "0")}`;
}

function scene(kind: SceneKind, heading: string, body: string, weight: number): {
  kind: SceneKind;
  heading: string;
  body: string;
  weight: number;
  bgTop: RGB;
  bgBottom: RGB;
} {
  return { kind, heading, body, weight, bgTop: PALETTE[kind].top, bgBottom: PALETTE[kind].bottom };
}

export function buildRenderPlan(
  campaign: Campaign,
  video: VideoAsset,
  opts: PlanOptions = {},
): RenderPlan {
  const width = opts.width ?? 1280;
  const height = opts.height ?? 720;
  const fps = opts.fps ?? 24;
  const total = Math.max(2, Math.round(opts.totalSeconds ?? video.targetDurationSeconds ?? 60));

  // Weighted scene skeleton derived from the governed record (no fabricated
  // facts: every line comes from existing campaign fields).
  const draft = [
    scene("title", video.title, `${campaign.product.title} · ${video.authorityPillar}`, 3),
    scene("hook", "THE BIG IDEA", video.summary, 4),
    scene("point", "WHY IT MATTERS", `${video.authorityPillar} — a mental model you can apply today.`, 4),
    scene("point", "THE MODEL", video.summary, 4),
    scene("cta", "THE MIND IS A COMPUTER", "Read the ebook to go deeper.", 3),
    scene("disclaimer", "LOCAL MOCK RENDER", "Generated locally. Mock audio. Not published.", 2),
  ];

  const weightSum = draft.reduce((s, d) => s + d.weight, 0);
  let allocated = 0;
  const scenes: Scene[] = draft.map((d, i) => {
    // Distribute total seconds by weight; last scene absorbs the rounding remainder.
    let secs =
      i === draft.length - 1
        ? Math.max(1, total - allocated)
        : Math.max(1, Math.round((total * d.weight) / weightSum));
    allocated += secs;
    return {
      kind: d.kind,
      heading: d.heading,
      body: d.body,
      durationSeconds: secs,
      bgTop: d.bgTop,
      bgBottom: d.bgBottom,
    };
  });

  const totalDurationSeconds = scenes.reduce((s, sc) => s + sc.durationSeconds, 0);

  return {
    videoId: video.id,
    outputId: outputIdFor(video.id),
    title: video.title,
    sourceCampaignId: campaign.id,
    width,
    height,
    fps,
    scenes,
    totalDurationSeconds,
    rendererMode: "local-mock-render",
  };
}
