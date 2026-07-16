/**
 * HeyGen adapter — avatar / talking-head video lane.
 *
 * Contract + OFFLINE payload builder only. No HeyGen API is called in Phase 03;
 * live execution is LIVE-INTEGRATION-BLOCKED until credentials are provisioned
 * AND a live run is explicitly approved.
 */

import {
  makePayload,
  type Adapter,
  type AdapterContract,
  type AdapterPayload,
} from "./adapterContract.ts";
import type { ProductionPackage } from "../production/types.ts";

const contract: AdapterContract = {
  id: "heygen.avatar-video.v1",
  vendor: "HeyGen",
  name: "HeyGen Avatar Video",
  kind: "avatar-video",
  version: "1.0.0",
  capabilities: ["avatar-presenter", "text-to-speech-voice", "captions", "scene-composition"],
  acceptsFrom: ["voiceover", "script", "animation", "storyboard"],
  produces: "An MP4 of an AI avatar presenting the script with synced voice and captions.",
  credentialsEnv: ["HEYGEN_API_KEY"],
  liveStatus: "LIVE-INTEGRATION-BLOCKED",
  liveBlockedReason:
    "No HEYGEN_API_KEY provisioned and live (paid) calls are not approved in Phase 03.",
  docsHint: "Mirrors HeyGen video_inputs (character/voice/background) + dimension + caption.",
};

export const heygenAdapter: Adapter = {
  contract,
  buildPayload(pkg: ProductionPackage): AdapterPayload {
    const inputText = pkg.voiceover.lines.map((l) => l.text).join(" ");
    const request = {
      title: pkg.title,
      caption: true,
      dimension: { width: 1080, height: 1920 }, // vertical faceless short
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: "<AVATAR_ID_PLACEHOLDER>",
            avatar_style: pkg.animation.avatarMode,
          },
          voice: {
            type: "text",
            input_text: inputText,
            voice_id: "<VOICE_ID_PLACEHOLDER>",
          },
          background: { type: "color", value: pkg.animation.brandColors[0] ?? "#0b0f17" },
        },
      ],
      scenes: pkg.storyboard.scenes.map((s) => ({
        index: s.index,
        on_screen_text: s.onScreenText,
        voiceover: s.voiceoverText,
        duration_seconds: s.durationSeconds,
      })),
    };
    return makePayload(contract, pkg.videoId, request);
  },
};
