/**
 * Phase 01 â€” Campaign state model types.
 *
 * These mirror the JSON schemas in `schemas/` and the sample campaign data.
 * Nothing here is connected to a live system: every record is mock/prototype
 * data migrated from the audited local frontend (see GitHub Issue #2).
 */

import type { ReviewDecision, VideoStatus } from "./status.ts";

/** MAPS human-review state for a single video. */
export interface ReviewState {
  /** Whether human approval is required (a blocking MAPS firewall). */
  required: boolean;
  decision: ReviewDecision;
  /** Approver identity placeholder â€” no auth in Phase 01. */
  reviewer: string | null;
  note: string;
}

/** Per-video agent state (which machine stage owns the asset). */
export interface AgentState {
  stage: VideoStatus;
  assignedAgent: string;
  note: string;
  /** Always true in Phase 01 â€” no real agent has run. */
  mock: boolean;
}


export interface ContentBrief {
  objective: string;
  audiences: string[];
  coreMessage: string;
  callToAction: string;
  contentPrinciples: string[];
  sourceAuthority: string[];
  claimConstraints: string[];
  defaultFormat: string;
}

export interface CreativeIntent {
  audience: string;
  message: string;
  objective: string;
  format: string;
  callToAction: string;
}

/**
 * Topic Cycle asset role (additive, optional - absent on non-cycle campaigns).
 * `long_anchor` is the single evergreen authority video a Topic Cycle is built
 * from; `short` is one of the 7 derived daily-distribution assets.
 */
export type AssetRole = "long_anchor" | "short";

export type EvergreenState = "Pending" | "Verified" | "Failed";

/**
 * The evergreen production gate for a long-anchor video. Presence of this
 * field alone proves nothing - `validateTopicCycleObject` (src/campaign/
 * topicCycle.ts) actively enforces `required === true` and `state ===
 * "Verified"` before a Topic Cycle campaign is accepted. Evergreen is a
 * production requirement, not descriptive metadata.
 */
export interface EvergreenGate {
  required: boolean;
  state: EvergreenState;
  note: string;
}

/** A single faceless video asset moving through the production line. */
export interface VideoAsset {
  id: string;
  title: string;
  summary: string;
  authorityPillar: string;
  targetDurationSeconds: number;
  creativeIntent: CreativeIntent;
  status: VideoStatus;
  review: ReviewState;
  agentState: AgentState;
  /** Always true in Phase 01 - this asset is not a real produced video. */
  mock: boolean;
  /** Topic Cycle fields - additive/optional, absent on non-cycle campaigns. */
  assetRole?: AssetRole;
  /** For a short: the id of its long_anchor. Null/absent for a long_anchor. */
  derivedFrom?: string | null;
  /** 1â€“7: which day of the 7-day publishing cycle this asset publishes on. */
  publishDay?: number;
  /** Present only on a long_anchor: the evergreen production gate. */
  evergreen?: EvergreenGate;
}

/** A blocking MAPS approval firewall (decision gate represented in data). */
export interface ApprovalFirewall {
  id: string;
  phase: string;
  label: string;
  blocking: boolean;
  state: ReviewDecision;
}

export interface MapsPosture {
  posture: string;
  approvalFirewalls: ApprovalFirewall[];
  note: string;
}

/** Honest provenance: what is real vs. mock in this build. */
export interface Provenance {
  origin: string;
  dataSource: "mock" | "live";
  notReal: string[];
  disclaimer: string;
}

export interface CampaignProduct {
  title: string;
  type: string;
  launchWindow?: string;
}

export interface Campaign {
  id: string;
  name: string;
  product: CampaignProduct;
  brandPillars: string[];
  contentBrief: ContentBrief;
  targetVideoCount: number;
  status: VideoStatus;
  createdAt: string;
  statusModel: string[];
  videos: VideoAsset[];
  maps: MapsPosture;
  provenance: Provenance;
}

