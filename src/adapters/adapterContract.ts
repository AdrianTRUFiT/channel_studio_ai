/**
 * adapterContract — the shared contract every external creative tool adapter
 * must satisfy, BEFORE any live connector is wired.
 *
 * Doctrine (Live Integration Rule): build the interface, build a mock adapter,
 * build an offline contract test, mark live execution LIVE-INTEGRATION-BLOCKED,
 * and never claim a real API ran. Adapters here build deterministic, offline
 * request payloads (`dryRun: true`) — they do NOT call any vendor API.
 */

import { createHash } from "node:crypto";
import type { ProductionPackage } from "../production/types.ts";

export type AdapterKind = "avatar-video" | "generative-video" | "design-graphics" | "voiceover";
export type LiveStatus = "LIVE-INTEGRATION-BLOCKED" | "LIVE-READY";

/** A declarative contract for one external creative tool. */
export interface AdapterContract {
  id: string;
  vendor: string;
  name: string;
  kind: AdapterKind;
  version: string;
  /** Human-readable capabilities this tool provides. */
  capabilities: string[];
  /** Which parts of the production package this adapter consumes. */
  acceptsFrom: string[];
  /** What a live run would produce. */
  produces: string;
  /** Environment variables a live run would require (none present in Phase 03). */
  credentialsEnv: string[];
  liveStatus: LiveStatus;
  liveBlockedReason: string;
  docsHint: string;
}

/** A tool-specific, OFFLINE request payload. Never sent anywhere in Phase 03. */
export interface AdapterPayload {
  adapterId: string;
  vendor: string;
  kind: AdapterKind;
  videoId: string;
  /** The vendor-shaped request body that WOULD be submitted on a live run. */
  request: Record<string, unknown>;
  liveStatus: LiveStatus;
  dryRun: true;
  published: false;
  credentialsPresent: boolean;
  createdAt: string;
  checksum: string;
}

/** An adapter: a contract + an offline payload builder. */
export interface Adapter {
  readonly contract: AdapterContract;
  buildPayload(pkg: ProductionPackage): AdapterPayload;
}

/** sha256 over a stable JSON serialization. */
export function checksumOf(value: unknown): string {
  return "sha256:" + createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

/** True only if every named credential env var is actually set (non-empty). */
export function credentialsPresent(envVars: string[]): boolean {
  if (envVars.length === 0) return false;
  return envVars.every((v) => Boolean(process.env[v] && process.env[v]!.length > 0));
}

/**
 * Assemble a payload, computing its checksum and honestly recording whether
 * credentials exist. liveStatus stays BLOCKED unless credentials are present
 * AND the contract is explicitly LIVE-READY (never the case in Phase 03).
 */
export function makePayload(
  contract: AdapterContract,
  videoId: string,
  request: Record<string, unknown>,
): AdapterPayload {
  const hasCreds = credentialsPresent(contract.credentialsEnv);
  const liveStatus: LiveStatus =
    hasCreds && contract.liveStatus === "LIVE-READY" ? "LIVE-READY" : "LIVE-INTEGRATION-BLOCKED";
  const base = {
    adapterId: contract.id,
    vendor: contract.vendor,
    kind: contract.kind,
    videoId,
    request,
    liveStatus,
    dryRun: true as const,
    published: false as const,
    credentialsPresent: hasCreds,
    createdAt: new Date().toISOString(),
  };
  return { ...base, checksum: checksumOf({ ...base, createdAt: undefined }) };
}
