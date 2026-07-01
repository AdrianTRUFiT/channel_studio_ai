/**
 * Higgsfield adapter — generative B-roll / motion video lane.
 *
 * Contract + OFFLINE payload builder only. No Higgsfield API is called in
 * Phase 03; live execution is LIVE-INTEGRATION-BLOCKED.
 */

import {
  makePayload,
  type Adapter,
  type AdapterContract,
  type AdapterPayload,
} from "./adapterContract.ts";
import type { ProductionPackage } from "../production/types.ts";

const contract: AdapterContract = {
  id: "higgsfield.generative-video.v1",
  vendor: "Higgsfield",
  name: "Higgsfield Generative Video",
  kind: "generative-video",
  version: "1.0.0",
  capabilities: ["text-to-video", "image-to-video", "motion-control", "aspect-reframe"],
  acceptsFrom: ["visualPrompts", "storyboard"],
  produces: "Per-scene generative video clips (B-roll) from visual prompts.",
  credentialsEnv: ["HIGGSFIELD_API_KEY"],
  liveStatus: "LIVE-INTEGRATION-BLOCKED",
  liveBlockedReason:
    "No HIGGSFIELD_API_KEY provisioned and live (paid) calls are not approved in Phase 03.",
  docsHint: "Mirrors a generate_video request per scene: model/prompt/negative/aspect/duration/seed.",
};

export const higgsfieldAdapter: Adapter = {
  contract,
  buildPayload(pkg: ProductionPackage): AdapterPayload {
    const byScene = new Map(pkg.storyboard.scenes.map((s) => [s.index, s]));
    const request = {
      workspace: "<WORKSPACE_ID_PLACEHOLDER>",
      aspect_ratio: pkg.visualPrompts.prompts[0]?.aspectRatio ?? "9:16",
      clips: pkg.visualPrompts.prompts.map((p) => ({
        scene_index: p.sceneIndex,
        model: "<HIGGSFIELD_MODEL_PLACEHOLDER>",
        prompt: p.positivePrompt,
        negative_prompt: p.negativePrompt,
        aspect_ratio: p.aspectRatio,
        duration_seconds: byScene.get(p.sceneIndex)?.durationSeconds ?? 5,
        // Deterministic seed so payloads are reproducible across runs.
        seed: 1000 + p.sceneIndex,
      })),
    };
    return makePayload(contract, pkg.videoId, request);
  },
};
