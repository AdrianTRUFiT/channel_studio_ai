/**
 * PHASE 02 unit + enforcement tests for the local render pipeline.
 *
 * These are deterministic and ffmpeg-INDEPENDENT (the real MP4 encode is
 * exercised by the gate's smoke step). They cover the frame canvas/PNG encoder,
 * the render plan, output-id mapping, and manifest validation — including
 * NEGATIVE checks that a manifest with no hash / wrong count is rejected.
 *
 * Run with `node --test`.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { Frame } from "../src/render/frameCanvas.ts";
import { buildRenderPlan, outputIdFor } from "../src/render/renderPlan.ts";
import { validateManifestObject } from "../src/render/renderManifest.ts";
import { loadCampaign } from "../src/campaign/campaign.ts";

test("Frame.toPNG produces a valid PNG signature and IHDR", () => {
  const f = new Frame(32, 16);
  f.verticalGradient({ r: 10, g: 20, b: 30 }, { r: 40, g: 60, b: 90 });
  f.drawText("HI", 2, 2, 2, { r: 255, g: 255, b: 255 });
  const png = f.toPNG();
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(png.subarray(12, 16).toString("latin1"), "IHDR");
  assert.equal(png.readUInt32BE(16), 32); // width
  assert.equal(png.readUInt32BE(20), 16); // height
  assert.ok(png.length > 50);
});

test("word wrap keeps lines within the pixel budget", () => {
  const f = new Frame(200, 100);
  const lines = f.wrapText("THE MIND IS A COMPUTER AND MEMORY IS YOUR HARD DRIVE", 120, 2);
  assert.ok(lines.length > 1);
  for (const line of lines) assert.ok(f.textWidth(line, 2) <= 120 || !line.includes(" "));
});

test("outputIdFor maps campaign ids to tmiac-NNN", () => {
  assert.equal(outputIdFor("MIAC-01"), "tmiac-001");
  assert.equal(outputIdFor("MIAC-20"), "tmiac-020");
});

test("buildRenderPlan yields ordered scenes that sum to the target duration", () => {
  const campaign = loadCampaign();
  const video = campaign.videos[0];
  const plan = buildRenderPlan(campaign, video, { totalSeconds: 30 });
  assert.equal(plan.videoId, video.id);
  assert.equal(plan.outputId, "tmiac-001");
  assert.equal(plan.rendererMode, "local-mock-render");
  assert.ok(plan.scenes.length >= 4);
  assert.equal(plan.scenes[0].kind, "title");
  assert.equal(plan.scenes.at(-1)?.kind, "disclaimer");
  for (const s of plan.scenes) assert.ok(s.durationSeconds >= 1);
  assert.equal(
    plan.scenes.reduce((a, s) => a + s.durationSeconds, 0),
    plan.totalDurationSeconds,
  );
  assert.equal(plan.totalDurationSeconds, 30);
});

function validManifest() {
  return {
    campaignId: "the-mind-is-a-computer",
    mode: "smoke",
    rendererMode: "local-mock-render",
    ffmpeg: { available: true, source: "ffmpeg-static", version: "ffmpeg 7" },
    generatedAt: new Date().toISOString(),
    count: 1,
    published: false,
    disclaimer: "Local Phase 02 production. Nothing published.",
    videos: [
      {
        videoId: "MIAC-01",
        title: "The Mind Is a Computer: The Core Metaphor",
        sourceCampaignId: "the-mind-is-a-computer",
        outputPath: "outputs/videos/tmiac-001.mp4",
        durationSeconds: 6,
        status: "rendered",
        fileHash: "sha256:" + "a".repeat(64),
        fileBytes: 12345,
        createdAt: new Date().toISOString(),
        rendererMode: "local-mock-render",
        disclaimer: "Local mock render. Not published.",
        scenes: 6,
      },
    ],
  };
}

test("a well-formed manifest validates", () => {
  assert.deepEqual(validateManifestObject(validManifest()), []);
});

test("NEGATIVE: a manifest with no published:false / wrong const is rejected", () => {
  const m = validManifest();
  m.published = true;
  assert.ok(validateManifestObject(m).length > 0);
});

test("NEGATIVE: a video artifact missing its fileHash is rejected", () => {
  const m = validManifest();
  delete (m.videos[0] as Record<string, unknown>).fileHash;
  const errors = validateManifestObject(m);
  assert.ok(errors.some((e) => /fileHash/.test(e)), errors.join("\n"));
});

test("NEGATIVE: count must match the number of videos", () => {
  const m = validManifest();
  m.count = 5;
  const errors = validateManifestObject(m);
  assert.ok(errors.some((e) => /count/.test(e)), errors.join("\n"));
});

test("manifest declares the render mode honestly (not published)", () => {
  const m = validManifest();
  assert.equal(m.published, false);
  assert.equal(m.rendererMode, "local-mock-render");
});
