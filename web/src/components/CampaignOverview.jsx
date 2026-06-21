import { reviewQueueCount, blockedCount, publishedCount } from "../lib/pipeline.js";

export default function CampaignOverview({ campaign }) {
  const metrics = [
    { label: "Videos", value: campaign.videos.length, sub: `target ${campaign.targetVideoCount}` },
    { label: "Awaiting Human Review", value: reviewQueueCount(campaign), sub: "MAPS firewall" },
    { label: "Published", value: publishedCount(campaign), sub: "mock" },
    { label: "Blocked", value: blockedCount(campaign), sub: "needs reason" },
  ];

  return (
    <>
      <div className="grid metrics">
        {metrics.map((m) => (
          <div className="card" key={m.label}>
            <div className="label">{m.label}</div>
            <div className="value">
              {m.value} <small>{m.sub}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="section-h">
        <h2>Campaign</h2>
        <span className="hint">
          {campaign.product.title} · {campaign.product.type} · launch {campaign.product.launchWindow}
        </span>
      </div>
      <div className="card">
        <div className="label">Brand authority pillars</div>
        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {campaign.brandPillars.map((p) => (
            <span className="badge dim" key={p}>
              {p}
            </span>
          ))}
        </div>
        <div className="label" style={{ marginTop: 14 }}>
          MAPS approval firewalls (blocking)
        </div>
        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {campaign.maps.approvalFirewalls.map((f) => (
            <span className="badge review" key={f.id}>
              Phase {f.phase} · {f.label} · {f.state}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
