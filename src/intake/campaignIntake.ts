/**
 * campaignIntake — the deterministic Campaign Intake Engine (Shift 02).
 *
 * Converts operator input (topic, optional video count, optional production
 * mode) into a governed, schema-valid campaign that flows directly into the
 * existing pipeline (produce:videos, build:production) — no completed phase is
 * modified, no UI is assumed. CLI, desktop, and web front-ends all call this
 * same core.
 *
 * Determinism: the same input (plus an injectable `now` for the timestamp)
 * always yields byte-identical campaign JSON. All copy is template-derived and
 * honestly labelled mock; no external source is queried.
 */

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { VIDEO_STATUSES } from "../campaign/status.ts";
import { validateCampaignObject } from "../campaign/campaign.ts";
import type { Campaign, VideoAsset } from "../campaign/types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
function repoRoot(): string {
  return resolve(__dirname, "..", "..");
}

export const DEFAULT_VIDEO_COUNT = 20;
export const MAX_VIDEO_COUNT = 200;

/** Render-layer production modes the existing architecture supports. */
export type ProductionMode = "smoke" | "full";

export interface IntakeInput {
  /** Required operator topic, e.g. "Sleep Optimization for Founders". */
  topic: string;
  /** Number of governed video records (default 20, max 200). */
  videoCount?: number;
  /** Optional render-layer mode recorded for the run (smoke|full). */
  mode?: ProductionMode;
  /** Optional product framing (defaults derived from the topic). */
  productTitle?: string;
  productType?: string;
  /** Injectable clock for byte-deterministic output (tests). */
  now?: Date;
}

export interface IntakeResult {
  campaign: Campaign;
  campaignId: string;
  /** Repo-relative path the campaign was written to. */
  campaignFile: string;
  /** Repo-relative path of the intake run manifest. */
  intakeManifestFile: string;
  videoIds: string[];
  overwroteExisting: boolean;
}

/** kebab-case slug for campaign ids and filenames. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "");
}

const STOP_WORDS = new Set(["a", "an", "and", "for", "in", "of", "on", "the", "to", "with"]);

/** Deterministic uppercase id prefix from the topic (acronym or first letters). */
export function idPrefixFor(topic: string): string {
  const all = slugify(topic).split("-").filter(Boolean);
  const meaningful = all.filter((w) => !STOP_WORDS.has(w));
  const words = meaningful.length >= 2 ? meaningful : all;
  let prefix =
    words.length >= 2
      ? words.map((w) => w[0]).join("")
      : (words[0] ?? "topic").slice(0, 4);
  prefix = prefix.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (prefix.length < 2) prefix = (prefix + "XX").slice(0, 2);
  return prefix.slice(0, 12);
}

/** 20 deterministic angle templates, cycled for larger counts. */
const ANGLES: ReadonlyArray<{ title: (t: string) => string; summary: (t: string) => string }> = [
  { title: (t) => `${t}: The Core Idea in 60 Seconds`, summary: (t) => `The one-sentence model behind ${t} and why it matters now.` },
  { title: (t) => `The Biggest Myth About ${t}`, summary: (t) => `The most common misconception about ${t} — and what is actually true.` },
  { title: (t) => `${t} for Complete Beginners`, summary: (t) => `A zero-jargon starting point for ${t} you can apply today.` },
  { title: (t) => `3 Mistakes Everyone Makes With ${t}`, summary: (t) => `The three most frequent ${t} mistakes and the fix for each.` },
  { title: (t) => `A Simple Framework for ${t}`, summary: (t) => `One repeatable framework that makes ${t} decisions easier.` },
  { title: (t) => `${t}: What the Experts Do Differently`, summary: (t) => `The practices that separate skilled practitioners of ${t} from beginners.` },
  { title: (t) => `The 5-Minute ${t} Routine`, summary: (t) => `A minimal daily routine that compounds results in ${t}.` },
  { title: (t) => `${t} Explained With One Example`, summary: (t) => `A single concrete example that makes ${t} click.` },
  { title: (t) => `Before You Start ${t}, Watch This`, summary: (t) => `The essentials to know before investing time in ${t}.` },
  { title: (t) => `How ${t} Actually Works`, summary: (t) => `The mechanism underneath ${t}, explained step by step.` },
  { title: (t) => `${t}: Signs You're Doing It Wrong`, summary: (t) => `Early warning signals that your ${t} approach needs a correction.` },
  { title: (t) => `The Hidden Cost of Ignoring ${t}`, summary: (t) => `What ignoring ${t} quietly costs you over a year.` },
  { title: (t) => `${t} in the Real World`, summary: (t) => `Where ${t} shows up in everyday situations you already face.` },
  { title: (t) => `One Habit That Transforms ${t}`, summary: (t) => `The single highest-leverage habit for improving ${t}.` },
  { title: (t) => `${t}: Quick Wins vs Long Games`, summary: (t) => `Which ${t} efforts pay off this week and which pay off this year.` },
  { title: (t) => `The Tools That Make ${t} Easier`, summary: (t) => `A short, opinionated toolkit for ${t} without the overwhelm.` },
  { title: (t) => `${t} Questions Everyone Asks`, summary: (t) => `Direct answers to the most-asked questions about ${t}.` },
  { title: (t) => `From Zero to Confident in ${t}`, summary: (t) => `A staged path from first exposure to real confidence in ${t}.` },
  { title: (t) => `${t}: The 80/20 Breakdown`, summary: (t) => `The 20% of ${t} that produces 80% of the results.` },
  { title: (t) => `What's Next for ${t}`, summary: (t) => `Where ${t} is heading and how to position yourself early.` },
];

/** 5 deterministic brand-pillar templates parameterized by topic. */
function pillarsFor(topic: string): string[] {
  return [
    `${topic} Fundamentals`,
    `${topic} Mistakes & Myths`,
    `${topic} Frameworks`,
    `${topic} In Practice`,
    `${topic} Systems & Habits`,
  ];
}

function assertValidInput(input: IntakeInput): void {
  if (!input.topic || slugify(input.topic).length === 0) {
    throw new Error("intake: topic is required and must contain letters or digits");
  }
  const count = input.videoCount ?? DEFAULT_VIDEO_COUNT;
  if (!Number.isInteger(count) || count < 1 || count > MAX_VIDEO_COUNT) {
    throw new Error(`intake: videoCount must be an integer between 1 and ${MAX_VIDEO_COUNT}, got ${input.videoCount}`);
  }
  if (input.mode !== undefined && input.mode !== "smoke" && input.mode !== "full") {
    throw new Error(`intake: mode must be "smoke" or "full", got "${input.mode}"`);
  }
}

/** Build a governed, schema-valid campaign from operator input. Pure + deterministic. */
export function buildCampaignFromIntake(input: IntakeInput): Campaign {
  assertValidInput(input);
  const topic = input.topic.trim();
  const count = input.videoCount ?? DEFAULT_VIDEO_COUNT;
  const now = (input.now ?? new Date()).toISOString();
  const id = slugify(topic);
  const prefix = idPrefixFor(topic);
  const pad = count > 99 ? 3 : 2;
  const pillars = pillarsFor(topic);

  const videos: VideoAsset[] = Array.from({ length: count }, (_, i) => {
    const angle = ANGLES[i % ANGLES.length];
    const cycle = Math.floor(i / ANGLES.length);
    const title = cycle === 0 ? angle.title(topic) : `${angle.title(topic)} (Part ${cycle + 1})`;
    return {
      id: `${prefix}-${String(i + 1).padStart(pad, "0")}`,
      title,
      summary: angle.summary(topic),
      authorityPillar: pillars[i % pillars.length],
      targetDurationSeconds: 60,
      status: "Not Started",
      review: {
        required: true,
        decision: "Not Reached",
        reviewer: null,
        note: "Not yet entered the production line.",
      },
      agentState: {
        stage: "Not Started",
        assignedAgent: "intake-agent",
        note: "Queued at campaign intake (operator-generated campaign).",
        mock: true,
      },
      mock: true,
    };
  });

  const campaign: Campaign = {
    id,
    name: `${topic} — ${count} Faceless Video Campaign`,
    product: {
      title: input.productTitle ?? topic,
      type: input.productType ?? "content-series",
    },
    brandPillars: pillars,
    targetVideoCount: count,
    status: "Not Started",
    createdAt: now,
    statusModel: [...VIDEO_STATUSES],
    maps: {
      posture: "Machine Assisted, Person Supervised",
      note:
        "Human approval is required at decision firewalls. Approval gates are blocking states " +
        "represented in code and data; they are not engineered around.",
      approvalFirewalls: [
        { id: "blueprint-approval", phase: "03", label: "Human Blueprint Approval", blocking: true, state: "Not Reached" },
        { id: "inspector-review", phase: "07", label: "Inspector / Human Review", blocking: true, state: "Not Reached" },
      ],
    },
    provenance: {
      origin:
        `Generated by the deterministic Campaign Intake Engine from operator topic "${topic}". ` +
        `All titles/summaries are template-derived; no external research source was queried.`,
      dataSource: "mock",
      notReal: [
        "video rendering",
        "voiceover synthesis",
        "visual generation",
        "YouTube/TikTok publishing",
        "analytics ingestion",
        "external APIs",
      ],
      disclaimer:
        "All pipeline activity in this build is mock/prototype data. No rendering, publishing, " +
        "analytics, or external APIs are connected. Statuses are illustrative of the governed " +
        "state model only.",
    },
    videos,
  };

  const errors = validateCampaignObject(campaign);
  if (errors.length > 0) {
    throw new Error(`intake: generated campaign failed validation:\n  ${errors.join("\n  ")}`);
  }
  return campaign;
}

function sha256(text: string): string {
  return "sha256:" + createHash("sha256").update(text).digest("hex");
}

/**
 * Build, validate, and persist a campaign plus its intake run manifest.
 * Writes data/campaigns/<id>.campaign.json and outputs/intake/<id>.intake.json.
 */
export function runIntake(input: IntakeInput, outDir?: string): IntakeResult {
  const campaign = buildCampaignFromIntake(input);
  const campaignsDir = outDir
    ? isAbsolute(outDir)
      ? outDir
      : join(repoRoot(), outDir)
    : join(repoRoot(), "data", "campaigns");
  mkdirSync(campaignsDir, { recursive: true });

  const campaignAbs = join(campaignsDir, `${campaign.id}.campaign.json`);
  const overwroteExisting = existsSync(campaignAbs);
  const json = JSON.stringify(campaign, null, 2) + "\n";
  writeFileSync(campaignAbs, json, "utf8");

  const rel = (abs: string) =>
    abs.startsWith(repoRoot()) ? abs.slice(repoRoot().length + 1) : abs;
  const campaignFile = rel(campaignAbs);

  // Governed run manifest: what was requested, what was produced, what's next.
  const intakeDir = join(repoRoot(), "outputs", "intake");
  mkdirSync(intakeDir, { recursive: true });
  const intakeManifestAbs = join(intakeDir, `${campaign.id}.intake.json`);
  const manifest = {
    campaignId: campaign.id,
    topic: input.topic.trim(),
    videoCount: campaign.targetVideoCount,
    mode: input.mode ?? "full",
    productTitle: campaign.product.title,
    productType: campaign.product.type,
    campaignFile,
    campaignChecksum: sha256(json),
    generator: "deterministic-template",
    dataSource: "mock",
    published: false,
    createdAt: campaign.createdAt,
    videoIds: campaign.videos.map((v) => v.id),
    nextSteps: [
      `npm run build:production -- --campaign ${campaignFile} --video ${campaign.videos[0]?.id}`,
      `npm run produce:videos -- --campaign ${campaignFile}${input.mode === "smoke" ? " --smoke" : ""}`,
    ],
  };
  writeFileSync(intakeManifestAbs, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  return {
    campaign,
    campaignId: campaign.id,
    campaignFile,
    intakeManifestFile: rel(intakeManifestAbs),
    videoIds: manifest.videoIds,
    overwroteExisting,
  };
}
