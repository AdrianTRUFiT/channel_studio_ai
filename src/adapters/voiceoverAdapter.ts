/**
 * Voiceover adapter — text-to-speech narration lane (vendor-neutral).
 *
 * Contract + OFFLINE payload builder only. No TTS API is called in Phase 03;
 * live execution is LIVE-INTEGRATION-BLOCKED. The local mock renderer's silent
 * audio track (Phase 02) remains the fallback when no real narration exists.
 */

import {
  makePayload,
  type Adapter,
  type AdapterContract,
  type AdapterPayload,
} from "./adapterContract.ts";
import type { ProductionPackage } from "../production/types.ts";

const contract: AdapterContract = {
  id: "voiceover.tts.v1",
  vendor: "Voiceover (ElevenLabs-compatible)",
  name: "Voiceover Text-to-Speech",
  kind: "voiceover",
  version: "1.0.0",
  capabilities: ["text-to-speech", "ssml", "voice-persona", "per-scene-timing"],
  acceptsFrom: ["voiceover", "script"],
  produces: "A narration audio track (mp3) per scene from the voiceover script.",
  credentialsEnv: ["VOICEOVER_API_KEY", "ELEVENLABS_API_KEY"],
  liveStatus: "LIVE-INTEGRATION-BLOCKED",
  liveBlockedReason:
    "No voiceover/TTS credentials provisioned and live (paid) calls are not approved in Phase 03.",
  docsHint: "Mirrors a TTS request: model/voice/language/format + per-scene SSML segments.",
};

export const voiceoverAdapter: Adapter = {
  contract,
  buildPayload(pkg: ProductionPackage): AdapterPayload {
    const request = {
      model: "<TTS_MODEL_PLACEHOLDER>",
      voice_id: "<VOICE_ID_PLACEHOLDER>",
      voice_persona: pkg.voiceover.voicePersona,
      language: pkg.voiceover.language,
      format: "mp3",
      segments: pkg.voiceover.lines.map((l) => ({
        scene_index: l.sceneIndex,
        text: l.text,
        ssml: l.ssml,
        pause_after_ms: l.pauseAfterMs,
      })),
    };
    return makePayload(contract, pkg.videoId, request);
  },
};
