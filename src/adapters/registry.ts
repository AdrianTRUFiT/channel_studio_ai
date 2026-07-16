/**
 * registry — the controlled set of external creative adapters and the routing
 * from production "roles" to adapters. Building this registry (contracts first)
 * is deliberate: the system does NOT get to reach for every connector freely.
 * The local mock renderer (Phase 02) is the universal fallback lane.
 */

import type { Adapter } from "./adapterContract.ts";
import { heygenAdapter } from "./heygenAdapter.ts";
import { higgsfieldAdapter } from "./higgsfieldAdapter.ts";
import { canvaAdapter } from "./canvaAdapter.ts";
import { voiceoverAdapter } from "./voiceoverAdapter.ts";

/** All registered adapters, in a stable order. */
export const ADAPTERS: readonly Adapter[] = [
  heygenAdapter,
  higgsfieldAdapter,
  canvaAdapter,
  voiceoverAdapter,
];

export function getAdapter(id: string): Adapter | undefined {
  return ADAPTERS.find((a) => a.contract.id === id);
}

/** A production role mapped to its primary adapter, with the local fallback. */
export interface RoleRoute {
  role: string;
  adapterId: string;
  vendor: string;
  fallback: "local-mock-render";
}

/** Controlled routing: which adapter owns which part of a polished video. */
export const ROLE_ROUTES: readonly RoleRoute[] = [
  { role: "presenter-video", adapterId: "heygen.avatar-video.v1", vendor: "HeyGen", fallback: "local-mock-render" },
  { role: "broll-video", adapterId: "higgsfield.generative-video.v1", vendor: "Higgsfield", fallback: "local-mock-render" },
  { role: "graphics", adapterId: "canva.design-graphics.v1", vendor: "Canva", fallback: "local-mock-render" },
  { role: "narration", adapterId: "voiceover.tts.v1", vendor: "Voiceover (ElevenLabs-compatible)", fallback: "local-mock-render" },
];

/** Capability matrix (vendor → kind → capabilities), for review and the gate. */
export function capabilityMatrix(): Array<{ vendor: string; kind: string; liveStatus: string; capabilities: string[] }> {
  return ADAPTERS.map((a) => ({
    vendor: a.contract.vendor,
    kind: a.contract.kind,
    liveStatus: a.contract.liveStatus,
    capabilities: a.contract.capabilities,
  }));
}

/** True iff every registered adapter is currently LIVE-INTEGRATION-BLOCKED. */
export function allAdaptersBlocked(): boolean {
  return ADAPTERS.every((a) => a.contract.liveStatus === "LIVE-INTEGRATION-BLOCKED");
}
