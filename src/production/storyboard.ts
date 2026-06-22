/**
 * storyboard — scene-by-scene plan derived from the script package.
 * Deterministic: scenes map 1:1 to the script's structural beats.
 */

import type { VideoAsset } from "../campaign/types.ts";
import type { ScriptPackage, Storyboard, StoryboardScene, SceneKind } from "./types.ts";

interface Beat {
  kind: SceneKind;
  onScreenText: string;
  voiceoverText: string;
  visualDirection: string;
  motion: string;
  weight: number;
}

export function buildStoryboard(
  script: ScriptPackage,
  video: VideoAsset,
  aspectRatio = "9:16",
): Storyboard {
  const total = Math.max(6, video.targetDurationSeconds || 60);

  const beats: Beat[] = [
    {
      kind: "title",
      onScreenText: script.title,
      voiceoverText: script.hook,
      visualDirection: "Bold kinetic title card, dark background, blue accent sweep.",
      motion: "Title scales in; accent line wipes left-to-right.",
      weight: 2,
    },
    {
      kind: "hook",
      onScreenText: "THE BIG IDEA",
      voiceoverText: script.answerWithin60s,
      visualDirection: "Presenter or animated keyword stack; emphasize the one-line answer.",
      motion: "Words pop in sync with narration beats.",
      weight: 3,
    },
    {
      kind: "point",
      onScreenText: script.coreExplanation.slice(0, 64),
      voiceoverText: script.coreExplanation,
      visualDirection: "Diagram of the mental model; label components as they are named.",
      motion: "Nodes connect with animated edges.",
      weight: 4,
    },
    {
      kind: "example",
      onScreenText: "ONE CONCRETE EXAMPLE",
      voiceoverText: script.example,
      visualDirection: "Real-world vignette / B-roll matching the example.",
      motion: "Slow push-in on the subject.",
      weight: 3,
    },
    {
      kind: "cta",
      onScreenText: "READ THE EBOOK",
      voiceoverText: script.cta,
      visualDirection: "Ebook cover + follow prompt; brand lockup.",
      motion: "Cover slides up; subscribe glyph pulses.",
      weight: 2,
    },
    {
      kind: "disclaimer",
      onScreenText: "EXTERNAL PRODUCTION — PENDING HUMAN REVIEW",
      voiceoverText: "",
      visualDirection: "Quiet end card. Honest status: not yet rendered or published.",
      motion: "Static hold.",
      weight: 1,
    },
  ];

  const weightSum = beats.reduce((s, b) => s + b.weight, 0);
  let allocated = 0;
  const scenes: StoryboardScene[] = beats.map((b, i) => {
    const durationSeconds =
      i === beats.length - 1
        ? Math.max(1, total - allocated)
        : Math.max(1, Math.round((total * b.weight) / weightSum));
    allocated += durationSeconds;
    return {
      index: i,
      kind: b.kind,
      durationSeconds,
      onScreenText: b.onScreenText,
      voiceoverText: b.voiceoverText,
      visualDirection: b.visualDirection,
      motion: b.motion,
    };
  });

  return {
    videoId: script.videoId,
    aspectRatio,
    totalDurationSeconds: scenes.reduce((s, sc) => s + sc.durationSeconds, 0),
    scenes,
  };
}
