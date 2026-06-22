import { useState } from "react";
import campaign from "./data/campaign.js";
import Header from "./components/Header.jsx";
import MapsBanner from "./components/MapsBanner.jsx";
import CampaignOverview from "./components/CampaignOverview.jsx";
import PipelineStatusCards from "./components/PipelineStatusCards.jsx";
import ProductionFloor from "./components/ProductionFloor.jsx";
import RenderStatus from "./components/RenderStatus.jsx";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "floor", label: "Production Floor" },
  { id: "render", label: "Video Production" },
  { id: "intake", label: "Campaign Intake" },
];

export default function App() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="app">
      <Header />
      <MapsBanner campaign={campaign} />

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? "active" : ""}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "dashboard" && (
        <>
          <CampaignOverview campaign={campaign} />
          <div className="section-h">
            <h2>Pipeline status</h2>
            <span className="hint">governed state model — {campaign.statusModel.length} stages</span>
          </div>
          <PipelineStatusCards campaign={campaign} />
        </>
      )}

      {tab === "floor" && <ProductionFloor campaign={campaign} />}

      {tab === "render" && <RenderStatus />}

      {tab === "intake" && (
        <>
          <div className="section-h">
            <h2>Campaign Intake</h2>
            <span className="hint">Phase 01 — campaign + state model</span>
          </div>
          <div className="card">
            <div className="label">Campaign</div>
            <div className="value" style={{ fontSize: 18 }}>
              {campaign.name}
            </div>
            <p style={{ color: "var(--text-dim)", fontSize: 12.5, marginTop: 10 }}>
              {campaign.provenance.origin}
            </p>
            <div className="label" style={{ marginTop: 12 }}>
              Not real in this build
            </div>
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {campaign.provenance.notReal.map((n) => (
                <span className="badge blocked" key={n}>
                  {n}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      <footer className="foot">
        Phase 01 dashboard shell · dataSource={campaign.provenance.dataSource} · no live APIs ·
        governed by gates/check_phase_01.sh
      </footer>
    </div>
  );
}
