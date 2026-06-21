export function valueWeight(tier) {
  const map = { TIER_A: 10, TIER_B: 8, TIER_C: 5, TIER_D: 2 };
  return map[tier] || 5;
}

export function calculatePriorityScore(asset) {
  const value = valueWeight(asset.roi.estimatedValueTier);
  const channelFit = asset.roi.channelFitScore || 0;
  const offerFit = asset.roi.offerMatchScore || 0;
  const effort = asset.roi.effortScore || 5;
  const risk = asset.roi.riskScore || 5;

  const raw =
    value * 0.35 +
    channelFit * 0.025 +
    offerFit * 0.025 -
    effort * 0.35 -
    risk * 0.25;

  return Math.max(1, Math.min(10, Number(raw.toFixed(1))));
}

export function priorityLabel(score) {
  if (score >= 8.5) return "BUILD_NOW";
  if (score >= 7) return "BUILD_NEXT";
  if (score >= 5) return "HOLD";
  return "REWORK";
}
