/**
 * creativeBriefs — visual prompt pack, voiceover script, and animation
 * direction, all derived deterministically from the storyboard + script.
 * These are the structured briefs handed to the external tool adapters.
 */

import type {
  AnimationDirection,
  ScriptPackage,
  Storyboard,
  VisualPrompt,
  VisualPromptPack,
  VoiceoverLine,
  VoiceoverScript,
} from "./types.ts";

const BASE_STYLE =
  "clean modern motion graphics, dark editorial UI, soft blue accent, high contrast, 9:16 vertical";
const NEGATIVE =
  "garbled text, misspelled words, watermark, logo, extra fingers, low resolution, jpeg artifacts";
const BRAND_COLORS = ["#0b0f17", "#5b8cff", "#e7ecf5"];

export function buildVisualPromptPack(
  storyboard: Storyboard,
  pillar: string,
): VisualPromptPack {
  const prompts: VisualPrompt[] = storyboard.scenes.map((s) => ({
    sceneIndex: s.index,
    purpose: s.kind,
    positivePrompt:
      `${s.visualDirection} Theme: ${pillar}. ${BASE_STYLE}. ` +
      `Cinematic lighting, purposeful negative space for on-screen text.`,
    negativePrompt: NEGATIVE,
    style: BASE_STYLE,
    aspectRatio: storyboard.aspectRatio,
    referenceHints: [pillar, s.kind, "faceless short-form"],
  }));
  return { videoId: storyboard.videoId, style: BASE_STYLE, prompts };
}

export function buildVoiceoverScript(
  storyboard: Storyboard,
  persona = "calm, authoritative narrator",
  language = "en-US",
): VoiceoverScript {
  const lines: VoiceoverLine[] = storyboard.scenes
    .filter((s) => s.voiceoverText.trim().length > 0)
    .map((s) => ({
      sceneIndex: s.index,
      text: s.voiceoverText,
      ssml: `<speak><prosody rate="medium">${escapeSsml(s.voiceoverText)}</prosody><break time="350ms"/></speak>`,
      pauseAfterMs: 350,
    }));
  const totalWords = lines.reduce((n, l) => n + l.text.split(/\s+/).filter(Boolean).length, 0);
  return { videoId: storyboard.videoId, voicePersona: persona, language, totalWords, lines };
}

export function buildAnimationDirection(
  script: ScriptPackage,
  storyboard: Storyboard,
): AnimationDirection {
  return {
    videoId: script.videoId,
    avatarMode: "minimal",
    avatarPersona: "neutral faceless presenter (optional); prefer kinetic typography",
    motionStyle: "snappy keyframe motion graphics synced to narration",
    pacing: "fast intro, steady core, calm outro",
    brandColors: BRAND_COLORS,
    transitions: "hard cuts on beats; one accent wipe between act breaks",
    perScene: storyboard.scenes.map((s) => ({
      sceneIndex: s.index,
      direction: `${s.kind}: ${s.motion}`,
    })),
  };
}

function escapeSsml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
