import { calculatePriorityScore, priorityLabel } from "../lib/roi/roiEngine";

const DEPARTMENTS = [
  { id: "research", name: "Research", purpose: "Find what should be made.", lanes: ["Target", "Source", "Opportunities"] },
  { id: "development", name: "Development", purpose: "Shape what will be said and verify it is safe to say.", lanes: ["Concepts", "Scripts", "Legal"] },
  { id: "production", name: "Production", purpose: "Create the actual assets.", lanes: ["Video", "Audio", "Image", "Text"] },
  { id: "distribution", name: "Distribution", purpose: "Package, schedule, publish, and track delivery.", lanes: ["Calendar", "Content", "Platforms"] },
  { id: "analytics", name: "Analytics", purpose: "Measure what worked and feed the next cycle.", lanes: ["Results", "Revenue"] },
];

const ASSETS = [
  {
    title: "Mental Viruses",
    keyword: "mental viruses repeated thoughts",
    current: "Production",
    authority: "NOTIFY",
    health: "Healthy",
    activity: "Video department producing scene package.",
    needHuman: false,
    roi: {
      targetChannel: "TRUFiT Mind Mastery",
      targetOffer: "TRUFiT Mind Mastery",
      revenueIntent: "Lead magnet → course funnel",
      estimatedValueTier: "TIER_A",
      channelFitScore: 92,
      offerMatchScore: 94,
      effortScore: 2,
      riskScore: 2,
      nextRevenueAction: "Finish video package and route to publishing queue."
    }
  },
  {
    title: "System Override",
    keyword: "system override self command",
    current: "Development",
    authority: "STOP",
    health: "Needs Human",
    activity: "Legal check waiting on claim review.",
    needHuman: true,
    roi: {
      targetChannel: "Human Computer",
      targetOffer: "Identity-first AI authority content",
      revenueIntent: "Authority building → consulting lead path",
      estimatedValueTier: "TIER_B",
      channelFitScore: 88,
      offerMatchScore: 82,
      effortScore: 4,
      riskScore: 5,
      nextRevenueAction: "Resolve claim review before production."
    }
  },
  {
    title: "Adaptive Cognition AI",
    keyword: "identity must govern intelligence",
    current: "Distribution",
    authority: "SOLVE",
    health: "Healthy",
    activity: "Publishing package queued for platform delivery.",
    needHuman: false,
    roi: {
      targetChannel: "BizTech Wellness AI",
      targetOffer: "Governed Intelligence Infrastructure",
      revenueIntent: "B2B authority → discovery call",
      estimatedValueTier: "TIER_A",
      channelFitScore: 96,
      offerMatchScore: 91,
      effortScore: 3,
      riskScore: 3,
      nextRevenueAction: "Schedule with B2B positioning CTA."
    }
  },
];

const FEED = [
  ["8:52 PM", "ROI", "Adaptive Cognition AI ranked highest for B2B authority value"],
  ["8:47 PM", "Production", "Mental Viruses video scene package started"],
  ["8:44 PM", "Development", "System Override legal review triggered STOP"],
  ["8:41 PM", "Research", "Adaptive Cognition AI opportunity validated"],
];

function DepartmentRail({ asset }) {
  const activeIndex = DEPARTMENTS.findIndex((d) => d.name === asset.current);

  return (
    <div className="floor-rail">
      {DEPARTMENTS.map((dept, index) => {
        const complete = index < activeIndex;
        const active = index === activeIndex;
        return (
          <div key={dept.id} className={`floor-dept ${complete ? "complete" : ""} ${active ? "active" : ""}`} title={dept.purpose}>
            <span>{complete ? "✓" : active ? "◐" : "○"}</span>
            <strong>{dept.name}</strong>
          </div>
        );
      })}
    </div>
  );
}

function RoiPanel({ asset }) {
  const score = calculatePriorityScore(asset);
  const label = priorityLabel(score);

  return (
    <div className="roi-panel">
      <div className="roi-score">
        <span>Priority</span>
        <strong>{score}</strong>
        <em>{label}</em>
      </div>

      <div className="roi-grid">
        <div><span>Keyword</span><strong>{asset.keyword}</strong></div>
        <div><span>Target Channel</span><strong>{asset.roi.targetChannel}</strong></div>
        <div><span>Target Offer</span><strong>{asset.roi.targetOffer}</strong></div>
        <div><span>Revenue Intent</span><strong>{asset.roi.revenueIntent}</strong></div>
        <div><span>Value</span><strong>{asset.roi.estimatedValueTier}</strong></div>
        <div><span>Effort / Risk</span><strong>{asset.roi.effortScore} / {asset.roi.riskScore}</strong></div>
      </div>

      <div className="roi-next">
        <span>Next Revenue Action</span>
        <strong>{asset.roi.nextRevenueAction}</strong>
      </div>
    </div>
  );
}

function AssetCard({ asset }) {
  const score = calculatePriorityScore(asset);

  return (
    <article className={`floor-asset ${asset.needHuman ? "needs-human" : ""}`}>
      <div className="floor-asset-head">
        <div>
          <p className="eyebrow">Active Production</p>
          <h3>{asset.title}</h3>
        </div>
        <div className="floor-pill-stack">
          <span>{asset.current}</span>
          <strong>{asset.authority}</strong>
          <b className="roi-mini">ROI {score}</b>
        </div>
      </div>

      <DepartmentRail asset={asset} />

      <div className="floor-current">
        <div>
          <span>Current Activity</span>
          <strong>{asset.activity}</strong>
        </div>
        <div>
          <span>Needs Human</span>
          <strong>{asset.needHuman ? "Yes" : "No"}</strong>
        </div>
      </div>

      <RoiPanel asset={asset} />
    </article>
  );
}

export default function OperationsCenter() {
  const rankedAssets = [...ASSETS].sort((a, b) => calculatePriorityScore(b) - calculatePriorityScore(a));
  const top = rankedAssets[0];

  return (
    <div className="floor-shell">
      <section className="floor-hero">
        <div>
          <p className="eyebrow">Operations Center</p>
          <h2>Visible production floor for YouTube content creation.</h2>
          <p>Now prioritizing assets by revenue potential, offer fit, effort, risk, and next monetization action.</p>
        </div>

        <div className="floor-autopilot">
          <span className="floor-green-dot" />
          <div>
            <strong>Top ROI: {top.title}</strong>
            <p>Priority {calculatePriorityScore(top)} · {priorityLabel(calculatePriorityScore(top))}</p>
          </div>
        </div>
      </section>

      <section className="roi-leaderboard">
        <div>
          <p className="eyebrow">ROI Priority</p>
          <h3>Build Order</h3>
        </div>
        {rankedAssets.map((asset, index) => (
          <div key={asset.title} className="roi-rank">
            <span>#{index + 1}</span>
            <strong>{asset.title}</strong>
            <em>{calculatePriorityScore(asset)} · {priorityLabel(calculatePriorityScore(asset))}</em>
          </div>
        ))}
      </section>

      <section className="floor-departments">
        {DEPARTMENTS.map((dept) => (
          <article key={dept.id} className="floor-department-card">
            <h3>{dept.name}</h3>
            <p>{dept.purpose}</p>
            <div>{dept.lanes.map((lane) => <span key={lane}>{lane}</span>)}</div>
          </article>
        ))}
      </section>

      <section className="floor-layout">
        <main className="floor-main">
          <div className="ops-section-title">
            <h3>Active Assets</h3>
            <p>Highest-value, lowest-friction assets rise first.</p>
          </div>

          {rankedAssets.map((asset) => <AssetCard key={asset.title} asset={asset} />)}
        </main>

        <aside className="floor-side">
          <div className="ops-panel">
            <div className="ops-section-title">
              <h3>Kitchen Feed</h3>
              <p>Only meaningful production and ROI events.</p>
            </div>

            <div className="ops-feed">
              {FEED.map(([time, dept, event]) => (
                <div key={`${time}-${event}`} className="ops-feed-item">
                  <span>{time}</span>
                  <strong>{dept}</strong>
                  <p>{event}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="ops-panel attention-panel">
            <div className="ops-section-title">
              <h3>Needs Attention</h3>
              <p>Human action only when useful.</p>
            </div>

            <div className="ops-alert">
              <strong>1 STOP event</strong>
              <p>System Override — legal review requires human decision before revenue action.</p>
              <button className="primary">Review</button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
