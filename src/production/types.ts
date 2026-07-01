/**
 * Phase 03 — External Creative Production Adapter: shared types.
 *
 * Phase 03 converts ONE governed campaign video record into a complete,
 * polished-PRODUCTION package: a structured hand-off (script, storyboard,
 * prompts, voiceover, animation direction) plus tool-specific adapter payloads
 * and a human review gate. It does NOT call external tools — every adapter is a
 * contract + offline payload builder. The local mock renderer (Phase 02) is the
 * declared fallback lane.
 *
 * Nothing here is "real": no API runs, nothing is published, and the human
 * review gate blocks any live render until a person approves.
 */

import type { AdapterPayload } from "../adapters/adapterContract.ts";

export const TARGET_VIDEO_ID = "MIAC-01";

/** AEO-style script package derived deterministically from the campaign record. */
export interface ScriptPackage {
  videoId: string;
  title: string;
  generator: "deterministic-template"; // honest: not AI-authored prose
  hook: string;
  openingAnswer: string; // the 60-second answer
  answerWithin60s: string;
  coreExplanation: string;
  example: string;
  cta: string;
  dataDensityChecklist: string[];
  estimatedDurationSeconds: number;
  wordCount: number;
}

export type SceneKind = "title" | "hook" | "point" | "example" | "cta" | "disclaimer";

export interface StoryboardScene {
  index: number;
  kind: SceneKind;
  durationSeconds: number;
  onScreenText: string;
  voiceoverText: string;
  visualDirection: string;
  motion: string;
}

export interface Storyboard {
  videoId: string;
  aspectRatio: string;
  totalDurationSeconds: number;
  scenes: StoryboardScene[];
}

export interface VisualPrompt {
  sceneIndex: number;
  purpose: string;
  positivePrompt: string;
  negativePrompt: string;
  style: string;
  aspectRatio: string;
  referenceHints: string[];
}

export interface VisualPromptPack {
  videoId: string;
  style: string;
  prompts: VisualPrompt[];
}

export interface VoiceoverLine {
  sceneIndex: number;
  text: string;
  ssml: string;
  pauseAfterMs: number;
}

export interface VoiceoverScript {
  videoId: string;
  voicePersona: string;
  language: string;
  totalWords: number;
  lines: VoiceoverLine[];
}

export interface PerSceneDirection {
  sceneIndex: number;
  direction: string;
}

export interface AnimationDirection {
  videoId: string;
  avatarMode: string;
  avatarPersona: string;
  motionStyle: string;
  pacing: string;
  brandColors: string[];
  transitions: string;
  perScene: PerSceneDirection[];
}

/** Mock-deterministic opportunity scores (1–5). NOT real demand data. */
export interface OpportunityScore {
  demand: number;
  brandFit: number;
  monetization: number;
  retention: number;
  originality: number;
  aggregate: number;
  method: string;
}

/** Research brief derived from governed campaign fields. Honest: no live data. */
export interface ResearchBrief {
  videoId: string;
  topic: string;
  authorityPillar: string;
  generator: "deterministic-template";
  audienceQuestions: string[];
  searchKeywords: string[];
  contentAngle: string;
  opportunityScore: OpportunityScore;
  sources: string[];
  disclaimer: string;
}

export interface TitleOption {
  title: string;
  style: string;
}

export interface BlueprintBeat {
  index: number;
  beat: string;
  purpose: string;
}

/** Narrative blueprint: packaging + retention design for one video. */
export interface NarrativeBlueprint {
  videoId: string;
  generator: "deterministic-template";
  targetAudience: string;
  corePromise: string;
  narrativeAngle: string;
  retentionDesign: string[];
  titleOptions: TitleOption[];
  thumbnailConcept: string;
  beats: BlueprintBeat[];
}

/** Publish-ready metadata. Auto-post is HARD-BLOCKED pending human approval. */
export interface PublishPackage {
  videoId: string;
  platform: "youtube";
  title: string;
  description: string;
  hashtags: string[];
  thumbnailDirection: string;
  visibility: "private";
  aiDisclosure: {
    syntheticVoice: boolean;
    syntheticVisuals: boolean;
    disclosureText: string;
  };
  autoPostAllowed: false;
  requiresHumanApproval: true;
  approval: { state: "Pending"; approver: null };
  published: false;
  disclaimer: string;
}

export type ReviewDecision = "Pending" | "Approved" | "Rejected";

/** MAPS human review firewall: blocks any live render until approved. */
export interface ReviewPackage {
  videoId: string;
  gate: "external-creative-production";
  required: true;
  blocking: true;
  decision: ReviewDecision;
  reviewer: string | null;
  checklist: string[];
  blocksLiveRenderUntilApproved: true;
  note: string;
}

/** One production lane: a role routed to an adapter (with a fallback). */
export interface RenderLane {
  role: string;
  adapterId: string;
  vendor: string;
  payloadFile: string;
  liveStatus: string;
}

export interface RenderRequestPackage {
  videoId: string;
  lanes: RenderLane[];
  fallback: "local-mock-render";
  liveStatus: "LIVE-INTEGRATION-BLOCKED";
  published: false;
  humanReviewRequired: true;
  note: string;
}

/** The complete in-memory production package for one video. */
export interface ProductionPackage {
  videoId: string;
  title: string;
  campaignId: string;
  generatedAt: string;
  published: false;
  liveStatus: "LIVE-INTEGRATION-BLOCKED";
  research: ResearchBrief;
  blueprint: NarrativeBlueprint;
  script: ScriptPackage;
  storyboard: Storyboard;
  visualPrompts: VisualPromptPack;
  voiceover: VoiceoverScript;
  animation: AnimationDirection;
  adapterPayloads: AdapterPayload[];
  renderRequest: RenderRequestPackage;
  review: ReviewPackage;
  publishPackage: PublishPackage;
  disclaimer: string;
}
