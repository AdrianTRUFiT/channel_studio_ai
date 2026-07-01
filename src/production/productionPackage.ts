/**
 * productionPackage — assemble ONE video's complete external-production package
 * and write it to disk. Offline only: adapters build payloads, nothing is sent,
 * nothing is published, and the human review gate is Pending (blocking).
 *
 * CLI:
 *   node src/production/productionPackage.ts validate <package.json>
 */

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validate } from "../../gates/shared/gateUtils.ts";
import { loadCampaign } from "../campaign/campaign.ts";
import { ADAPTERS, ROLE_ROUTES, capabilityMatrix } from "../adapters/registry.ts";
import { checksumOf, type AdapterPayload } from "../adapters/adapterContract.ts";
import { buildScriptPackage, scriptMarkdown } from "./scriptPackage.ts";
import { buildStoryboard } from "./storyboard.ts";
import {
  buildVisualPromptPack,
  buildVoiceoverScript,
  buildAnimationDirection,
} from "./creativeBriefs.ts";
import { buildReviewPackage, reviewMarkdown } from "./reviewPackage.ts";
import { TARGET_VIDEO_ID, type ProductionPackage } from "./types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
function repoRoot(): string {
  return resolve(__dirname, "..", "..");
}

function slugFor(adapterId: string): string {
  return adapterId.split(".")[0];
}

/** Build the complete in-memory production package for one video. */
export function buildProductionPackage(
  videoId: string = TARGET_VIDEO_ID,
  campaignPath?: string,
): ProductionPackage {
  const campaign = loadCampaign(campaignPath);
  const video = campaign.videos.find((v) => v.id === videoId);
  if (!video) throw new Error(`unknown video id ${videoId}`);

  const script = buildScriptPackage(campaign, video);
  const storyboard = buildStoryboard(script, video);
  const visualPrompts = buildVisualPromptPack(storyboard, video.authorityPillar);
  const voiceover = buildVoiceoverScript(storyboard);
  const animation = buildAnimationDirection(script, storyboard);
  const review = buildReviewPackage(videoId);

  const pkg: ProductionPackage = {
    videoId,
    title: video.title,
    campaignId: campaign.id,
    generatedAt: new Date().toISOString(),
    published: false,
    liveStatus: "LIVE-INTEGRATION-BLOCKED",
    script,
    storyboard,
    visualPrompts,
    voiceover,
    animation,
    adapterPayloads: [],
    renderRequest: {
      videoId,
      lanes: [],
      fallback: "local-mock-render",
      liveStatus: "LIVE-INTEGRATION-BLOCKED",
      published: false,
      humanReviewRequired: true,
      note: "Lanes route roles to external tools, but live render is blocked pending credentials and human approval.",
    },
    review,
    disclaimer:
      "Phase 03 external-production package. No external tool was called; all adapter payloads are " +
      "offline dry-runs. Live render is LIVE-INTEGRATION-BLOCKED and nothing is published. The Phase 02 " +
      "local mock renderer remains the fallback lane.",
  };

  const adapterPayloads: AdapterPayload[] = ADAPTERS.map((a) => a.buildPayload(pkg));
  pkg.adapterPayloads = adapterPayloads;

  pkg.renderRequest.lanes = ROLE_ROUTES.map((r) => ({
    role: r.role,
    adapterId: r.adapterId,
    vendor: r.vendor,
    payloadFile: `adapters/${slugFor(r.adapterId)}.payload.json`,
    liveStatus: "LIVE-INTEGRATION-BLOCKED",
  }));

  return pkg;
}

export interface WrittenPackage {
  dir: string;
  manifestPath: string;
  manifest: Record<string, unknown>;
}

/** Write the package (artifacts + manifest) under <baseDir>/<videoId>/. */
export function writeProductionPackage(pkg: ProductionPackage, baseDir?: string): WrittenPackage {
  const root = baseDir ?? join(repoRoot(), "outputs", "production");
  const dir = join(root, pkg.videoId);
  mkdirSync(join(dir, "adapters"), { recursive: true });

  const artifacts: Array<{ name: string; file: string; checksum: string }> = [];
  const put = (name: string, file: string, data: unknown) => {
    const text = typeof data === "string" ? data : JSON.stringify(data, null, 2) + "\n";
    writeFileSync(join(dir, file), text, "utf8");
    artifacts.push({ name, file, checksum: checksumOf(text) });
  };

  put("script-package", "script-package.json", pkg.script);
  put("script-md", "SCRIPT.md", scriptMarkdown(pkg.script));
  put("storyboard", "storyboard.json", pkg.storyboard);
  put("visual-prompt-pack", "visual-prompt-pack.json", pkg.visualPrompts);
  put("voiceover-script", "voiceover-script.json", pkg.voiceover);
  put("animation-direction", "animation-direction.json", pkg.animation);
  put("review-package", "review-package.json", pkg.review);
  put("review-md", "REVIEW.md", reviewMarkdown(pkg.review, pkg.title));
  put("render-request", "render-request.json", pkg.renderRequest);

  const adapters = pkg.adapterPayloads.map((payload) => {
    const file = `adapters/${slugFor(payload.adapterId)}.payload.json`;
    writeFileSync(join(dir, file), JSON.stringify(payload, null, 2) + "\n", "utf8");
    return {
      adapterId: payload.adapterId,
      vendor: payload.vendor,
      kind: payload.kind,
      liveStatus: payload.liveStatus,
      credentialsPresent: payload.credentialsPresent,
      payloadFile: file,
      checksum: payload.checksum,
    };
  });

  const manifest = {
    videoId: pkg.videoId,
    title: pkg.title,
    campaignId: pkg.campaignId,
    generatedAt: pkg.generatedAt,
    published: false,
    liveStatus: pkg.liveStatus,
    fallback: "local-mock-render",
    artifacts,
    adapters,
    review: {
      gate: pkg.review.gate,
      decision: pkg.review.decision,
      required: pkg.review.required,
      blocking: pkg.review.blocking,
    },
    capabilityMatrix: capabilityMatrix(),
    disclaimer: pkg.disclaimer,
  };

  const manifestPath = join(dir, "package.json");
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  return { dir, manifestPath, manifest };
}

/* ----------------------------- validation ----------------------------- */

type Schema = Parameters<typeof validate>[0];
function loadSchema(name: string): Schema {
  return JSON.parse(readFileSync(join(repoRoot(), "schemas", name), "utf8")) as Schema;
}

/** Validate a production manifest + each adapter payload it references. */
export function validateProductionManifestObject(manifest: unknown): string[] {
  const errors = validate(loadSchema("production-package.schema.json"), manifest).map(
    (e) => `production-package ${e}`,
  );
  const m = manifest as {
    adapters?: Array<{ vendor?: string; liveStatus?: string }>;
    published?: boolean;
    liveStatus?: string;
  };
  if (m?.published !== false) errors.push("production-package: published must be false");
  if (m?.liveStatus !== "LIVE-INTEGRATION-BLOCKED") {
    errors.push("production-package: liveStatus must be LIVE-INTEGRATION-BLOCKED in Phase 03");
  }
  if (Array.isArray(m?.adapters)) {
    if (m.adapters.length < 4) errors.push("production-package: expected at least 4 adapter lanes");
    m.adapters.forEach((a, i) => {
      if (a.liveStatus !== "LIVE-INTEGRATION-BLOCKED") {
        errors.push(`production-package.adapters[${i}] (${a.vendor}) must be LIVE-INTEGRATION-BLOCKED`);
      }
    });
  }
  return errors;
}

function main(argv: string[]): void {
  const [command, pathArg] = argv;
  if (command !== "validate" || !pathArg) {
    process.stderr.write("productionPackage: usage: validate <package.json>\n");
    process.exit(1);
  }
  const full = isAbsolute(pathArg) ? pathArg : join(repoRoot(), pathArg);
  let manifest: unknown;
  try {
    manifest = JSON.parse(readFileSync(full, "utf8"));
  } catch (e) {
    process.stderr.write(`productionPackage: cannot read manifest: ${(e as Error).message}\n`);
    process.exit(1);
    return;
  }
  const errors = validateProductionManifestObject(manifest);
  if (errors.length) {
    process.stderr.write(`production package INVALID (${errors.length}):\n  ${errors.join("\n  ")}\n`);
    process.exit(1);
  }
  const m = manifest as { videoId: string; adapters: unknown[] };
  process.stdout.write(
    `production package valid: ${m.videoId}, ${m.adapters.length} adapter lane(s), liveStatus=LIVE-INTEGRATION-BLOCKED, published=false\n`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2));
}
