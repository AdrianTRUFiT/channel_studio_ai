/**
 * renderManifest — types, schema validation, and IO for the Phase 02 output
 * manifest. The manifest is the governed proof that local video files were
 * produced: one record per output video, each with a content hash.
 *
 * CLI:
 *   node src/render/renderManifest.ts validate <manifest.json>
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validate } from "../../gates/shared/gateUtils.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
function repoRoot(): string {
  return resolve(__dirname, "..", "..");
}

export type RenderMode = "smoke" | "full";
export type RendererMode = "local-mock-render" | "local-frames-only-no-ffmpeg";
export type ArtifactStatus = "rendered" | "blocked-no-ffmpeg";

export interface VideoArtifact {
  videoId: string;
  title: string;
  sourceCampaignId: string;
  outputPath: string;
  durationSeconds: number;
  status: ArtifactStatus;
  fileHash: string;
  fileBytes: number;
  createdAt: string;
  rendererMode: RendererMode;
  disclaimer: string;
  scenes: number;
}

export interface RenderManifest {
  campaignId: string;
  mode: RenderMode;
  rendererMode: RendererMode;
  ffmpeg: { available: boolean; source: string; version: string | null };
  generatedAt: string;
  count: number;
  published: false;
  disclaimer: string;
  videos: VideoArtifact[];
}

type Schema = Parameters<typeof validate>[0];

function manifestSchema(): Schema {
  return JSON.parse(
    readFileSync(join(repoRoot(), "schemas", "render-manifest.schema.json"), "utf8"),
  ) as Schema;
}

/** Validate a manifest object; empty array means valid. */
export function validateManifestObject(manifest: unknown): string[] {
  const errors = validate(manifestSchema(), manifest).map((e) => `manifest ${e}`);

  const m = manifest as RenderManifest;
  if (Array.isArray(m?.videos)) {
    if (m.count !== m.videos.length) {
      errors.push(`manifest.count (${m.count}) does not match videos length (${m.videos.length})`);
    }
    // Every artifact must carry a real content hash — the core Phase 02 proof.
    m.videos.forEach((v, i) => {
      if (!/^sha256:[0-9a-f]{64}$/.test(v?.fileHash ?? "")) {
        errors.push(`videos[${i}] (${v?.videoId}) missing/invalid fileHash`);
      }
    });
  }
  return errors;
}

export function readManifest(path: string): RenderManifest {
  const full = isAbsolute(path) ? path : join(repoRoot(), path);
  return JSON.parse(readFileSync(full, "utf8")) as RenderManifest;
}

export function writeManifest(path: string, manifest: RenderManifest): void {
  const full = isAbsolute(path) ? path : join(repoRoot(), path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

/* ----------------------------------- CLI ----------------------------------- */

function main(argv: string[]): void {
  const [command, pathArg] = argv;
  if (command !== "validate" || !pathArg) {
    process.stderr.write("renderManifest: usage: validate <manifest.json>\n");
    process.exit(1);
  }

  let manifest: unknown;
  try {
    manifest = readManifest(pathArg);
  } catch (e) {
    process.stderr.write(`renderManifest: cannot read manifest: ${(e as Error).message}\n`);
    process.exit(1);
    return;
  }

  const errors = validateManifestObject(manifest);
  if (errors.length) {
    process.stderr.write(`manifest INVALID (${errors.length}):\n  ${errors.join("\n  ")}\n`);
    process.exit(1);
  }
  const m = manifest as RenderManifest;
  process.stdout.write(
    `manifest valid: ${m.count} video(s), mode=${m.mode}, rendererMode=${m.rendererMode}, published=${m.published}\n`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2));
}
