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
  /** Always true in Phase 01 â€” this asset is not a real produced video. */
  mock: boolean;
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

