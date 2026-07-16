/**
 * Phase 01 — campaign loader + deterministic validator.
 *
 * Reuses the Phase 00 `validate` primitive (the same minimal JSON-schema
 * validator the gates trust) so Phase 01 data is governed by code, not by
 * assertion. Also runs cross-checks the schema alone cannot express:
 *   - exactly REQUIRED_VIDEO_COUNT (20) videos
 *   - unique, well-formed video ids
 *   - statusModel deep-equals the canonical VIDEO_STATUSES enum
 *   - each video + its agentState validate against their schemas
 *
 * CLI:
 *   node src/campaign/campaign.ts validate [path-to-campaign.json]
 */

import { readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validate } from "../../gates/shared/gateUtils.ts";
import {
  REQUIRED_VIDEO_COUNT,
  SAMPLE_CAMPAIGN_PATH,
  VIDEO_STATUSES,
} from "./status.ts";
import type { Campaign } from "./types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Repo root (two levels up from src/campaign). */
function repoRoot(): string {
  return resolve(__dirname, "..", "..");
}

type Schema = Parameters<typeof validate>[0];

function loadSchema(name: string): Schema {
  return JSON.parse(readFileSync(join(repoRoot(), "schemas", name), "utf8")) as Schema;
}

/** Resolve a campaign path (default: the sample campaign) and parse it. */
export function loadCampaign(path: string = SAMPLE_CAMPAIGN_PATH): Campaign {
  const full = isAbsolute(path) ? path : join(repoRoot(), path);
  return JSON.parse(readFileSync(full, "utf8")) as Campaign;
}

/**
 * Validate a campaign object. Returns a list of human-readable errors; an empty
 * list means the campaign is valid and conforms to the Phase 01 state model.
 */
export function validateCampaignObject(campaign: unknown): string[] {
  const errors: string[] = [];

  // 1. Top-level shape.
  errors.push(...validate(loadSchema("campaign.schema.json"), campaign).map((e) => `campaign ${e}`));

  const c = campaign as Campaign;
  const videos = Array.isArray(c?.videos) ? c.videos : [];

  // 2. Exactly as many videos as the campaign declares (default 20). The
  //    intake engine may generate other sizes; each campaign self-declares its
  //    target and must match it exactly.
  const expected =
    typeof c?.targetVideoCount === "number" ? c.targetVideoCount : REQUIRED_VIDEO_COUNT;
  if (!Number.isInteger(expected) || expected < 1) {
    errors.push(`campaign.targetVideoCount must be a positive integer, found ${String(c?.targetVideoCount)}`);
  }
  if (videos.length !== expected) {
    errors.push(`campaign must contain exactly ${expected} videos, found ${videos.length}`);
  }

  // 3. statusModel must deep-equal the canonical enum, in order.
  const model = Array.isArray(c?.statusModel) ? c.statusModel : [];
  if (JSON.stringify(model) !== JSON.stringify([...VIDEO_STATUSES])) {
    errors.push("campaign.statusModel must deep-equal the canonical VIDEO_STATUSES enum, in order");
  }

  // 4. Per-video checks.
  const videoSchema = loadSchema("video-asset.schema.json");
  const agentSchema = loadSchema("agent-state.schema.json");
  const seen = new Set<string>();
  videos.forEach((video, i) => {
    const where = `videos[${i}] (${(video as { id?: string })?.id ?? "?"})`;
    errors.push(...validate(videoSchema, video).map((e) => `${where} ${e}`));
    errors.push(...validate(agentSchema, (video as { agentState?: unknown })?.agentState).map((e) => `${where}.agentState ${e}`));

    const id = (video as { id?: string })?.id;
    if (id) {
      if (seen.has(id)) errors.push(`${where}: duplicate video id "${id}"`);
      seen.add(id);
    }
  });

  return errors;
}

/** Convenience: load + validate the sample (or given) campaign from disk. */
export function validateCampaignFile(path?: string): { campaign: Campaign; errors: string[] } {
  const campaign = loadCampaign(path);
  return { campaign, errors: validateCampaignObject(campaign) };
}

/* ----------------------------------- CLI ----------------------------------- */

function main(argv: string[]): void {
  const [command, pathArg] = argv;
  if (command !== "validate") {
    process.stderr.write(`campaign: unknown command "${command ?? ""}". Expected: validate [path]\n`);
    process.exit(1);
  }

  let result: { campaign: Campaign; errors: string[] };
  try {
    result = validateCampaignFile(pathArg);
  } catch (e) {
    process.stderr.write(`campaign: could not load campaign: ${(e as Error).message}\n`);
    process.exit(1);
    return;
  }

  if (result.errors.length > 0) {
    process.stderr.write(`campaign INVALID (${result.errors.length} error(s)):\n  ${result.errors.join("\n  ")}\n`);
    process.exit(1);
  }

  const c = result.campaign;
  process.stdout.write(
    `campaign valid: "${c.name}" — ${c.videos.length} videos (exactly ${REQUIRED_VIDEO_COUNT}), ` +
      `status model OK, dataSource=${c.provenance.dataSource}.\n`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2));
}
