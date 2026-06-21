// Derive pipeline metrics from the governed campaign. The status ORDER comes
// from the campaign's own statusModel (which the gate verifies equals the
// canonical enum), so the UI cannot drift from the governed state model.

export function statusCounts(campaign) {
  const counts = Object.fromEntries(campaign.statusModel.map((s) => [s, 0]));
  for (const v of campaign.videos) {
    if (v.status in counts) counts[v.status] += 1;
  }
  return campaign.statusModel.map((status) => ({ status, count: counts[status] }));
}

// A coarse "production floor" grouping for the status cards.
const GROUP = {
  "Not Started": "intake",
  Researching: "intelligence",
  "Blueprint Ready": "blueprint",
  "Script Ready": "script",
  "Voice Ready": "package",
  "Visuals Ready": "package",
  "Render Ready": "render",
  "Human Review": "review",
  Approved: "review",
  "Publish Ready": "publish",
  Published: "publish",
  Blocked: "blocked",
};

export function groupOf(status) {
  return GROUP[status] ?? "intake";
}

export function reviewQueueCount(campaign) {
  return campaign.videos.filter((v) => v.status === "Human Review").length;
}

export function blockedCount(campaign) {
  return campaign.videos.filter((v) => v.status === "Blocked").length;
}

export function publishedCount(campaign) {
  return campaign.videos.filter((v) => v.status === "Published").length;
}
