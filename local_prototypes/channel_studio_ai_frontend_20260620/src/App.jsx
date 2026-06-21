import OperationsCenter from './components/OperationsCenter';
import ProductionCanvas from './components/ProductionCanvas';
import { useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEY = "channelStudioAI_pass6_state";

const seedOpportunities = [
  {
    id: "OPP-0001",
    topic: "System Override: Reclaiming the Internal Command Line",
    cluster: "Human Computer",
    demand: 92,
    brandFit: 96,
    monetization: 88,
    retention: 91,
    originality: 94,
    effort: 2,
    valueTier: "TIER_A",
    riskProfile: "LOW",
    channel: "TRUFiT Mind Mastery",
    offer: "TRUFiT Mind Mastery",
    status: "FOUND",
    evidence: "Strong fit with identity, cognition, self-command, and performance language.",
    demandEvidence: "Repeatable themes around self-control, discipline, focus, and identity-search behavior.",
    authorityMatch: "Strong alignment with TRUFiT Mind Mastery, Human Computer, and authored intelligence language.",
    packagingPromise: "Shows viewers how to interrupt internal programming and reclaim conscious command.",
    revenueThesis: "Strong fit for long-form educational funnel, digital product ladder, and performance-wellness authority building."
  },
  {
    id: "OPP-0002",
    topic: "Mental Viruses: How Repeated Thoughts Hijack Performance",
    cluster: "Performance",
    demand: 87,
    brandFit: 95,
    monetization: 82,
    retention: 89,
    originality: 91,
    effort: 3,
    valueTier: "TIER_A",
    riskProfile: "LOW",
    channel: "TRUFiT Mind Mastery",
    offer: "MindFuel / TRUFiT Reset Workflow",
    status: "FOUND",
    evidence: "Clear transformation angle with strong hook potential.",
    demandEvidence: "Recurring audience pain around negative thoughts, mental loops, emotional regulation, and performance blocks.",
    authorityMatch: "Strong performance-wellness fit; connects lived resilience with practical cognitive framing.",
    packagingPromise: "Explains how repeated thoughts become internal operating patterns and how to interrupt them.",
    revenueThesis: "Useful for wellness education, habit-change funnel, and short-to-long content sequence."
  },
  {
    id: "OPP-0003",
    topic: "Adaptive Cognition AI: Why Identity Must Govern Intelligence",
    cluster: "AI",
    demand: 79,
    brandFit: 98,
    monetization: 76,
    retention: 84,
    originality: 97,
    effort: 5,
    valueTier: "TIER_B",
    riskProfile: "MEDIUM",
    channel: "BizTech Wellness AI",
    offer: "Governed Intelligence Infrastructure",
    status: "FOUND",
    evidence: "High originality and brand fit; demand needs stronger external validation.",
    demandEvidence: "Emerging category interest; requires stronger search and audience validation before production priority.",
    authorityMatch: "Very strong BizTech Wellness AI fit; high doctrine and positioning value.",
    packagingPromise: "Explains why identity must govern intelligence before AI systems act.",
    revenueThesis: "Better for authority-building, white paper, investor education, or B2B positioning than immediate content revenue."
  }
];

const tabs = ["Operate", "Dashboard", "Canvas", "Research", "Opportunities", "Validation", "Allocation", "Production", "Production Intelligence", "Blueprint Generator", "Inventory", "Performance", "Learning", "Settings"];

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    opportunities: seedOpportunities,
    inventory: [], blueprints: [], performance: []
  };
}

function saveState(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function scoreOpportunity(opp) {
  const weighted =
    opp.demand * 0.25 +
    opp.brandFit * 0.2 +
    opp.monetization * 0.25 +
    opp.retention * 0.15 +
    opp.originality * 0.15;

  const effortPenalty = opp.effort * 1.25;
  const riskPenalty = opp.riskProfile === "HIGH" ? 8 : opp.riskProfile === "MEDIUM" ? 4 : 1;
  return Math.round(weighted - effortPenalty - riskPenalty);
}

function priorityTier(score) {
  if (score >= 88) return "HIGH";
  if (score >= 78) return "MEDIUM";
  return "LOW";
}

function buildBlueprint(opp) {
  return {
    titleOptions: [
      opp.topic,
      `${opp.cluster}: The Hidden Pattern Behind ${opp.topic.split(":")[0]}`,
      `How to Understand ${opp.topic.split(":")[0]} Before It Controls You`
    ],
    hook: opp.packagingPromise,
    scriptObligation: "Answer the core promise early, prove the point with one specific example, then route the viewer toward the next logical action.",
    visualPlan: "Clean executive explainer. Calm motion. High-contrast text. Diagram-first scenes. No sci-fi clutter.",
    monetizationMatch: opp.offer,
    status: "Blueprint generated. Renderer remains mocked."
  };
}

export default function App() {
  const [state, setState] = useState(loadState);
  const [activeTab, setActiveTab] = useState("Operate");
  const [selectedId, setSelectedId] = useState(state.opportunities[0]?.id || "OPP-0001");
  const [seedKeyword, setSeedKeyword] = useState("Identity");
  const [semanticMap, setSemanticMap] = useState(null);
  const [lastSentCandidate, setLastSentCandidate] = useState("");

  const updateState = (next) => {
    setState(next);
    saveState(next);
  };

  const ranked = useMemo(() => {
    return state.opportunities
      .map((opp) => ({ ...opp, score: scoreOpportunity(opp), priority: priorityTier(scoreOpportunity(opp)) }))
      .sort((a, b) => b.score - a.score);
  }, [state.opportunities]);

  const selected = ranked.find((item) => item.id === selectedId) || ranked[0];
  const approved = ranked.filter((o) => ["APPROVED", "ALLOCATED", "BLUEPRINT", "INVENTORY"].includes(o.status));
  const allocated = ranked.filter((o) => ["ALLOCATED", "BLUEPRINT", "INVENTORY"].includes(o.status)).slice(0, 2);
  const blueprint = buildBlueprint(selected);

  const setOpportunityStatus = (id, status) => {
    const now = new Date().toISOString();
    const opportunities = state.opportunities.map((opp) =>
      opp.id === id
        ? { ...opp, status, approvedAt: status === "APPROVED" ? now : opp.approvedAt, updatedAt: now }
        : opp
    );
    updateState({ ...state, opportunities });
  };

  const allocateTop = () => {
    const ids = approved.slice(0, 2).map((o) => o.id);
    const opportunities = state.opportunities.map((opp) =>
      ids.includes(opp.id) ? { ...opp, status: "ALLOCATED", allocatedAt: new Date().toISOString() } : opp
    );
    updateState({ ...state, opportunities });
  };

  const addToInventory = () => {
    const exists = state.inventory.some((a) => a.opportunityId === selected.id);
    const asset = {
      id: `ASSET-${selected.id}`,
      opportunityId: selected.id,
      title: selected.topic,
      cluster: selected.cluster,
      channel: selected.channel,
      offer: selected.offer,
      stage: "INVENTORY",
      assetType: "Video Project Package",
      priority: selected.priority,
      valueTier: selected.valueTier,
      riskProfile: selected.riskProfile,
      potentialScore: selected.score,
      publishStatus: "Not Scheduled",
      revenueStatus: "Not Live",
      createdAt: new Date().toLocaleString()
    };

    const opportunities = state.opportunities.map((opp) =>
      opp.id === selected.id ? { ...opp, status: "INVENTORY", inventoriedAt: new Date().toISOString() } : opp
    );

    updateState({
      ...state,
      opportunities,
      inventory: exists ? state.inventory : [asset, ...state.inventory]
    });
  };

  const simulatePerformance = () => {
    const target = state.inventory[0];
    if (!target) return;

    const record = {
      assetId: target.id,
      title: target.title,
      simulatedViews: 12500,
      simulatedConversions: 45,
      estimatedRetentionDelta: "+2.4%",
      systemFeedback: "MAINTAIN_NICHE_FOCUS",
      recalibrationDelta: 0,
      createdAt: new Date().toLocaleString()
    };

    updateState({ ...state, performance: [record, ...state.performance] });
  };

  const generateSemanticMap = () => {
    const cleanSeed = seedKeyword.trim() || "Identity";
    const map = {
      seed: cleanSeed,
      territory: cleanSeed.toLowerCase().includes("ai")
        ? "Identity-Governed Intelligence"
        : "The Mind Is A Computer",
      clusters: [
        {
          id: "CLUS-001",
          name: "Human Computer",
          nodes: ["Internal Command Line", "System Override", "Self-Programming"],
          candidate: {
            topic: "System Override: Reclaiming the Internal Command Line",
            cluster: "Human Computer",
            demand: 92,
            brandFit: 96,
            monetization: 88,
            retention: 91,
            originality: 96,
            effort: 2,
            valueTier: "TIER_A",
            riskProfile: "LOW",
            channel: "TRUFiT Mind Mastery",
            offer: "TRUFiT Mind Mastery",
            evidence: "Generated from semantic territory around identity, self-command, and cognitive control.",
            demandEvidence: "Mock discovery signal: repeated audience pain around focus, self-control, internal dialogue, and discipline.",
            authorityMatch: "Matches Human Computer, TRUFiT Mind Mastery, and authored intelligence positioning.",
            packagingPromise: "Shows viewers how to interrupt internal programming and reclaim conscious command.",
            revenueThesis: "Strong fit for education, digital product funnel, and performance-wellness authority building."
          }
        },
        {
          id: "CLUS-002",
          name: "Mental Viruses",
          nodes: ["Thought Loops", "Emotional Hijack", "Pattern Interrupt"],
          candidate: {
            topic: "Mental Viruses: How Repeated Thoughts Hijack Performance",
            cluster: "Performance",
            demand: 87,
            brandFit: 95,
            monetization: 82,
            retention: 89,
            originality: 91,
            effort: 3,
            valueTier: "TIER_A",
            riskProfile: "LOW",
            channel: "TRUFiT Mind Mastery",
            offer: "MindFuel / TRUFiT Reset Workflow",
            evidence: "Generated from performance, emotional regulation, and thought-pattern semantic territory.",
            demandEvidence: "Mock discovery signal: recurring audience pain around negative thoughts and mental loops.",
            authorityMatch: "Strong alignment with resilience, discipline, wellness, and performance conditioning.",
            packagingPromise: "Explains how repeated thoughts become internal operating patterns and how to interrupt them.",
            revenueThesis: "Useful for wellness education, habit-change content, and short-to-long funnel building."
          }
        },
        {
          id: "CLUS-003",
          name: "Adaptive Cognition",
          nodes: ["Identity-Governed AI", "Authored Intelligence", "Human Authority"],
          candidate: {
            topic: "Adaptive Cognition AI: Why Identity Must Govern Intelligence",
            cluster: "AI",
            demand: 79,
            brandFit: 98,
            monetization: 76,
            retention: 84,
            originality: 97,
            effort: 5,
            valueTier: "TIER_B",
            riskProfile: "MEDIUM",
            channel: "BizTech Wellness AI",
            offer: "Governed Intelligence Infrastructure",
            evidence: "Generated from identity-first AI and governed intelligence semantic territory.",
            demandEvidence: "Mock discovery signal: emerging category; needs future API validation.",
            authorityMatch: "Very strong BizTech Wellness AI doctrine fit.",
            packagingPromise: "Explains why identity must govern intelligence before AI systems act.",
            revenueThesis: "Better for authority building, B2B trust, investor education, and doctrine positioning."
          }
        }
      ]
    };

    setSemanticMap(map);
  };

  const sendCandidateToLedger = (candidate) => {
    if (candidate.originality < 85) return;

    const exists = state.opportunities.some((opp) => opp.topic === candidate.topic);
    if (exists) {
      setLastSentCandidate(`${candidate.topic} is already in the Opportunity Ledger.`);
      setActiveTab("Validation");
      return;
    }

    const nextId = `OPP-${String(state.opportunities.length + 1).padStart(4, "0")}`;
    const nextOpportunity = {
      id: nextId,
      ...candidate,
      status: "FOUND",
      discoveredAt: new Date().toISOString()
    };

    updateState({
      ...state,
      opportunities: [nextOpportunity, ...state.opportunities]
    });

    setSelectedId(nextId);
    setLastSentCandidate(`${candidate.topic} sent to DAVE Validation.`);
    setActiveTab("Validation");
  };

  const generateBlueprintPackage = () => {
    const exists = state.blueprints?.some((bp) => bp.opportunityId === selected.id);

    const blueprintRecord = {
      id: `BP-${selected.id}`,
      opportunityId: selected.id,
      title: selected.topic,
      titleCandidates: [
        selected.topic,
        `Why Your Mind Needs a ${selected.topic.split(":")[0]}`,
        `The Self-Programming Protocol Behind ${selected.cluster}`
      ],
      hook: "Most people think they control their thoughts. They don't.",
      corePromise: selected.packagingPromise,
      informationGain: ["Mental Viruses", "Internal Command Line", "Adaptive Cognition"],
      aeoStatus: "VALID",
      packagingBrief: "High contrast. Single focal point. Clean typography. Curiosity gap without visual clutter.",
      productionBrief: "Educational authority style. Long-form capable. Executive tone. Diagram-first scenes. Renderer remains mocked.",
      durationTargetSeconds: 600,
      tone: "Executive Educational",
      status: "READY_FOR_PRODUCTION",
      createdAt: new Date().toLocaleString()
    };

    const opportunities = state.opportunities.map((opp) =>
      opp.id === selected.id
        ? { ...opp, status: "BLUEPRINT_READY", blueprintReadyAt: new Date().toISOString() }
        : opp
    );

    updateState({
      ...state,
      opportunities,
      blueprints: exists ? state.blueprints : [blueprintRecord, ...(state.blueprints || [])]
    });

    setActiveTab("Blueprint Generator");
  };

  const approveProductionAsset = () => {
    const exists = state.inventory.some((a) => a.opportunityId === selected.id);

    const asset = {
      id: `ASSET-${selected.id}`,
      opportunityId: selected.id,
      title: selected.topic,
      cluster: selected.cluster,
      channel: selected.channel,
      offer: selected.offer,
      stage: "PRODUCTION_READY",
      assetType: "Production Intelligence Package",
      priority: selected.priority,
      valueTier: selected.valueTier,
      riskProfile: selected.riskProfile,
      potentialScore: selected.score,
      publishStatus: "Not Scheduled",
      revenueStatus: "Not Live",
      governanceStatus: "DAVE_APPROVED",
      productionReady: true,
      createdAt: new Date().toLocaleString()
    };

    const opportunities = state.opportunities.map((opp) =>
      opp.id === selected.id
        ? { ...opp, status: "PRODUCTION_READY", productionReadyAt: new Date().toISOString() }
        : opp
    );

    updateState({
      ...state,
      opportunities,
      inventory: exists ? state.inventory : [asset, ...state.inventory]
    });

    setActiveTab("Inventory");
  };

  const resetSystem = () => {
    const fresh = { opportunities: seedOpportunities, inventory: [], blueprints: [], performance: [] };
    updateState(fresh);
    setSelectedId(seedOpportunities[0].id);
    setActiveTab("Operate");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Candidate Build — Not Canonical</p>
          <h1>Channel Studio AI</h1>
          <p className="subtitle">Before we render pixels, we verify purpose. Before we scale production, we preserve decisions.</p>
        </div>
        <div className="governance-pill">AI may recommend. Human approves.</div>
      </header>

      <nav className="nav">
        {tabs.map((item) => (
          <button key={item} className={activeTab === item ? "active" : ""} onClick={() => setActiveTab(item)}>
            {item}
          </button>
        ))}
      </nav>

      <section className="tab-banner">
        <strong>{activeTab}</strong>
        <span>
          {activeTab === "Operate" && "Visible production floor for active assets, departments, and human attention."}
          {activeTab === "Dashboard" && "Executive view of the business loop."}
          {activeTab === "Canvas" && "Module authority canvas for SOLVE / NOTIFY / STOP visibility."}
          {activeTab === "Research" && "Discovery workspace: seed keyword → semantic territory → qualified candidates."}
          {activeTab === "Opportunities" && "Opportunity Ledger and candidate scoring."}
          {activeTab === "Validation" && "DAVE evidence review before production resources are authorized."}
          {activeTab === "Allocation" && "Approved opportunities assigned to limited production capacity."}
          {activeTab === "Production" && "Blueprint generation before any video renderer is connected."}
          {activeTab === "Production Intelligence" && "Blueprint readiness, governance readiness, and mocked production signals before rendering."}
          {activeTab === "Blueprint Generator" && "Turns approved production intelligence into a structured production package."}
          {activeTab === "Allocation" && "Prioritizes approved blueprints by business potential, effort, risk, and strategic value."}
          {activeTab === "Inventory" && "Approved blueprints become managed asset records before publish."}
          {activeTab === "Performance" && "Mock performance layer for future analytics."}
          {activeTab === "Learning" && "Mock feedback loop for future optimization."}
          {activeTab === "Settings" && "Criteria, thresholds, capacity, and automation boundaries."}
        </span>
      </section>

      {activeTab === "Operate" && (
        <main className="single">
          <section className="panel">
            <OperationsCenter />
          </section>
        </main>
      )}

      {activeTab === "Dashboard" && (
        <main className="grid">
          <section className="panel hero-panel">
            <p className="eyebrow">Executive Portfolio Loop</p>
            <h2>Find → Validate → Allocate → Produce → Inventory → Measure → Learn</h2>
            <p>The renderer remains locked. This layer proves business state, decision preservation, and portfolio movement first.</p>
            <div className="metrics">
              <div><span>{ranked.length}</span><small>Ledger Records</small></div>
              <div><span>{approved.length}</span><small>Approved</small></div>
              <div><span>{state.inventory.length}</span><small>Inventory Assets</small></div>
              <div><span>{state.performance.length}</span><small>Learning Records</small></div>
            </div>
          </section>
          <OpportunityQueue ranked={ranked} selected={selected} setSelectedId={setSelectedId} />
          <PortfolioPanel inventory={state.inventory} />
          <LearningSummary performance={state.performance} />
        </main>
      )}
      {activeTab === "Research" && (
        <main className="single">
          <section className="panel">
            <p className="eyebrow">Opportunity Workspace</p>
            <h2>Semantic Discovery Engine</h2>
            <p>Generate mock semantic clusters before sending qualified candidates into the Opportunity Ledger.</p>

            <div className="research-grid">
              <div className="research-column">
                <small>1. Seed Input</small>
                <input
                  value={seedKeyword}
                  onChange={(e) => setSeedKeyword(e.target.value)}
                  placeholder="Identity, AI, Performance, Wellness..."
                />
                <button className="primary" onClick={generateSemanticMap}>Generate Semantic Map</button>
                {lastSentCandidate && <p className="send-feedback">{lastSentCandidate}</p>}
              </div>

              <div className="research-column">
                <small>2. Cluster Graph</small>
                {!semanticMap ? (
                  <p className="empty">No semantic map generated yet.</p>
                ) : (
                  <>
                    <h3>{semanticMap.territory}</h3>
                    {semanticMap.clusters.map((cluster) => (
                      <div className="cluster-card" key={cluster.id}>
                        <strong>{cluster.name}</strong>
                        <p>{cluster.nodes.join(" → ")}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="research-column">
                <small>3. Target Candidates</small>
                {!semanticMap ? (
                  <p className="empty">Generate a map to surface candidates.</p>
                ) : (
                  semanticMap.clusters.map((cluster) => (
                    <div className="candidate-card" key={cluster.id}>
                      <strong>{cluster.candidate.topic}</strong>
                      <p>{cluster.candidate.cluster}</p>
                      <div className="inventory-meta">
                        <span>Originality {cluster.candidate.originality}</span>
                        <span>AEO Ready</span>
                        <span>{cluster.candidate.valueTier}</span>
                      </div>
                      {cluster.candidate.originality >= 85 ? (
                        <button
                          className="primary send-button"
                          title="Send this candidate into the DAVE Validation Gate"
                          onClick={() => sendCandidateToLedger(cluster.candidate)}
                        >
                          Send to DAVE →
                        </button>
                      ) : (
                        <div className="locked">Blocked: Originality Below 85</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </main>
      )}

      {activeTab === "Opportunities" && (
        <main className="grid">
          <OpportunityQueue ranked={ranked} selected={selected} setSelectedId={setSelectedId} />
          <OpportunityDetail selected={selected} />
        </main>
      )}

      {activeTab === "Validation" && (
        <main className="single">
          <ValidationGate selected={selected} approve={() => setOpportunityStatus(selected.id, "APPROVED")} />
        </main>
      )}

      {activeTab === "Allocation" && (
        <main className="grid">
          <section className="panel">
            <p className="eyebrow">Production Capacity</p>
            <h2>2 Slots Today</h2>
            <p>Only approved opportunities can enter allocation. This prevents compute burn from unverified ideas.</p>
            <button className="primary" onClick={allocateTop}>Allocate Top Approved</button>
          </section>
          <section className="panel">
            <p className="eyebrow">Allocation Queue</p>
            <AllocationQueue allocationQueue={allocated} />
          </section>
        </main>
      )}

      {activeTab === "Production" && (
        <main className="single">
          <ProductionBlueprint selected={selected} blueprint={blueprint} addToInventory={addToInventory} />
        </main>
      )}
      {activeTab === "Production Intelligence" && (
        <main className="single">
          <section className="panel">
            <p className="eyebrow">Production Intelligence</p>
            <h2>Governance & Readiness Gateway</h2>
            <p>This verifies blueprint quality, governance readiness, and mocked production signals before any render engine is connected.</p>

            <div className="production-intel-grid">
              <div className="intel-card">
                <small>1. Blueprint Readiness</small>
                <h3>{selected.topic}</h3>
                <p><strong>Title Candidate:</strong> {selected.topic}</p>
                <p><strong>Hook:</strong> {selected.packagingPromise}</p>
                <p><strong>Duration Target:</strong> 600 seconds</p>
                <p><strong>Language:</strong> EN</p>
                <div className="inventory-meta">
                  <span>AEO VALID</span>
                  <span>ANSWER EARLY</span>
                  <span>STAGED</span>
                </div>
              </div>

              <div className="intel-card">
                <small>2. Governance Readiness</small>
                <h3>Originality {selected.originality}</h3>
                <p>DAVE checks demand evidence, authority match, packaging promise, and business potential before production readiness.</p>
                <div className="dave-checklist compact">
                  <div><span>✓</span> Demand</div>
                  <div><span>✓</span> Authority</div>
                  <div><span>✓</span> Value</div>
                  <div><span>✓</span> Effort</div>
                  <div><span>!</span> Human Review</div>
                </div>
                <button className="primary" onClick={generateBlueprintPackage}>Generate Blueprint</button>
              </div>

              <div className="intel-card">
                <small>3. Production Signals</small>
                <h3>Mock Signal Health</h3>
                <p>These are structural placeholders only. No YouTube API, scraping, rendering, upload, or platform automation is connected.</p>
                <div className="signal-list">
                  <div><strong>Velocity</strong><span>4.2x Mock Spike</span></div>
                  <div><strong>Trend</strong><span>UPWARD_STABLE</span></div>
                  <div><strong>Novelty</strong><span>{selected.originality}</span></div>
                  <div><strong>Packaging</strong><span>HIGH_CONTRAST_OPTIMAL</span></div>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}
      {activeTab === "Blueprint Generator" && (
        <main className="single">
          <section className="panel">
            <p className="eyebrow">Blueprint Generator</p>
            <h2>Production Package</h2>
            <p>This is the structured source-of-truth package before rendering, publishing, or external automation.</p>

            <BlueprintGenerator blueprints={state.blueprints || []} selected={selected} addToInventory={approveProductionAsset} />
          </section>
        </main>
      )}
      {activeTab === "Allocation" && (
        <main className="single">
          <section className="panel">
            <p className="eyebrow">Allocation Engine</p>
            <h2>Production Priority Queue</h2>
            <p>Allocation converts inventory into strategy. Highest-value, lowest-friction assets rise first.</p>

            <AllocationEngine inventory={state.inventory || []} />
          </section>
        </main>
      )}

      {activeTab === "Inventory" && (
        <main className="single">
          <section className="panel">
            <p className="eyebrow">Portfolio Inventory</p>
            <h2>Managed Asset Records</h2>
            <p>Inventory stores approved production packages as trackable business assets before publishing.</p>
            <InventoryList inventory={state.inventory} />
          </section>
        </main>
      )}

      {activeTab === "Performance" && (
        <main className="single">
          <section className="panel">
            <p className="eyebrow">Mock Performance</p>
            <h2>Performance Readiness Layer</h2>
            <p>Use mocked data to prove the learning loop before external analytics APIs are connected.</p>
            <button className="primary" onClick={simulatePerformance}>Simulate Performance Record</button>
            <PerformanceList performance={state.performance} />
          </section>
        </main>
      )}

      {activeTab === "Learning" && (
        <main className="single">
          <section className="panel">
            <p className="eyebrow">Learning Loop</p>
            <h2>What the System Learns</h2>
            <p>Future optimization will recalibrate demand, retention, originality, and allocation priority from live performance.</p>
            <LearningSummary performance={state.performance} />
          </section>
        </main>
      )}

      {activeTab === "Settings" && (
        <main className="single">
          <section className="panel">
            <p className="eyebrow">Operating Criteria</p>
            <h2>Governance Settings</h2>
            <div className="settings-grid">
              <div><small>Build Mode</small><strong>Candidate</strong></div>
              <div><small>Autopilot</small><strong>Locked</strong></div>
              <div><small>Publishing</small><strong>Human Approval Required</strong></div>
              <div><small>Renderer</small><strong>Mocked</strong></div>
            </div>
            <button className="secondary" onClick={resetSystem}>Reset Local State</button>
          </section>
        </main>
      )}
    </div>
  );
}

function OpportunityQueue({ ranked, selected, setSelectedId }) {
  return (
    <section className="panel">
      <p className="eyebrow">Opportunity Ledger</p>
      <div className="cards">
        {ranked.map((opp) => (
          <button key={opp.id} className={`opportunity-card ${selected.id === opp.id ? "active" : ""}`} onClick={() => setSelectedId(opp.id)}>
            <div><strong>{opp.topic}</strong><small>{opp.cluster} · {opp.status}</small></div>
            <span>{opp.score}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function OpportunityDetail({ selected }) {
  return (
    <section className="panel">
      <p className="eyebrow">Business Potential</p>
      <h2>{selected.topic}</h2>
      <p>{selected.evidence}</p>
      <div className="score-grid">
        {["demand", "brandFit", "monetization", "retention", "originality"].map((key) => (
          <div key={key} className="score-card"><small>{key.replace(/([A-Z])/g, " $1")}</small><strong>{selected[key]}</strong></div>
        ))}
      </div>
      <div className="settings-grid">
        <div><small>Value Tier</small><strong>{selected.valueTier}</strong></div>
        <div><small>Effort Score</small><strong>{selected.effort}</strong></div>
        <div><small>Risk Profile</small><strong>{selected.riskProfile}</strong></div>
        <div><small>Priority</small><strong>{selected.priority}</strong></div>
      </div>
    </section>
  );
}

function ValidationGate({ selected, approve }) {
  return (
    <section className="panel">
      <p className="eyebrow">DAVE Validation Gate</p>
      <div className="detail-header">
        <div><h2>{selected.topic}</h2><p>{selected.evidence}</p></div>
        <div className={`status ${selected.status.toLowerCase()}`}>{selected.status}</div>
      </div>
      <div className="evidence-grid">
        <div><small>Demand Evidence</small><p>{selected.demandEvidence}</p></div>
        <div><small>Authority Match</small><p>{selected.authorityMatch}</p></div>
        <div><small>Packaging Promise</small><p>{selected.packagingPromise}</p></div>
        <div><small>Revenue Thesis</small><p>{selected.revenueThesis}</p></div>
        <div><small>Suggested Offer</small><p>{selected.offer}</p></div>
        <div><small>Risk Profile</small><p>{selected.riskProfile}</p></div>
      </div>
      <div className="dave-checklist">
        <div><span>✓</span> Demand evidence present</div>
        <div><span>✓</span> Authority fit present</div>
        <div><span>✓</span> Packaging promise defined</div>
        <div><span>✓</span> Business potential estimated</div>
        <div><span>✓</span> Human approval required</div>
      </div>
      <button className="primary" onClick={approve}>DAVE Approve Opportunity</button>
    </section>
  );
}

function AllocationQueue({ allocationQueue }) {
  if (allocationQueue.length === 0) return <p className="empty">No allocated opportunities yet. Approve and allocate first.</p>;
  return allocationQueue.map((item, index) => (
    <div className="allocation-item" key={item.id}>
      <span>#{index + 1}</span>
      <div><strong>{item.topic}</strong><small>{item.channel} · {item.priority}</small></div>
    </div>
  ));
}

function ProductionBlueprint({ selected, blueprint, addToInventory }) {
  return (
    <section className="panel">
      <p className="eyebrow">Production Blueprint Generator</p>
      <h2>{selected.topic}</h2>
      <p>This is the structured production package. It is not a render. It is the proof-before-pixels layer.</p>
      <div className="blueprint-grid">
        <div><small>Title Options</small>{blueprint.titleOptions.map((title) => <p key={title}>• {title}</p>)}</div>
        <div><small>Hook</small><p>{blueprint.hook}</p></div>
        <div><small>Script Obligation</small><p>{blueprint.scriptObligation}</p></div>
        <div><small>Visual Plan</small><p>{blueprint.visualPlan}</p></div>
        <div><small>Monetization Match</small><p>{blueprint.monetizationMatch}</p></div>
        <div><small>Status</small><p>{blueprint.status}</p></div>
      </div>
      <div className="blueprint-actions">
        <button className="primary" onClick={addToInventory}>Stage Blueprint Package</button>
        <span>Inventory stores the asset package. Publishing remains locked.</span>
      </div>
    </section>
  );
}

function InventoryList({ inventory }) {
  if (inventory.length === 0) return <p className="empty">No asset records yet.</p>;
  return <div className="inventory-list">{inventory.map((asset) => (
    <div className="inventory-card" key={asset.id}>
      <small>{asset.assetType}</small>
      <h3>{asset.title}</h3>
      <p>{asset.cluster} · {asset.channel} · {asset.offer}</p>
      <div className="inventory-meta">
        <span>{asset.stage}</span><span>{asset.priority}</span><span>{asset.valueTier}</span><span>{asset.riskProfile}</span><span>{asset.publishStatus}</span><span>{asset.revenueStatus}</span>
      </div>
      <p className="timestamp">Created: {asset.createdAt}</p><p className="state-note">Stored once. Duplicate clicks should update state, not create noise.</p><p className="state-note">Stored once. Duplicate clicks are ignored when opportunity ID already exists.</p>
    </div>
  ))}</div>;
}

function PortfolioPanel({ inventory }) {
  return (
    <section className="panel">
      <p className="eyebrow">Portfolio Inventory</p>
      <h2>{inventory.length} Managed Assets</h2>
      <p>{inventory.length ? "Asset records are being preserved before publishing." : "No inventory yet. Move approved blueprints into inventory."}</p>
    </section>
  );
}

function PerformanceList({ performance }) {
  if (performance.length === 0) return <p className="empty">No mock performance records yet.</p>;
  return <div className="inventory-list">{performance.map((p, i) => (
    <div className="inventory-card" key={`${p.assetId}-${i}`}>
      <small>Mock Performance</small>
      <h3>{p.title}</h3>
      <p>{p.simulatedViews.toLocaleString()} views · {p.simulatedConversions} conversions · Retention {p.estimatedRetentionDelta}</p>
      <div className="inventory-meta"><span>{p.systemFeedback}</span><span>Delta {p.recalibrationDelta}</span></div>
      <p className="timestamp">Created: {p.createdAt}</p>
    </div>
  ))}</div>;
}

function LearningSummary({ performance }) {
  const latest = performance[0];
  return (
    <section className="panel">
      <p className="eyebrow">Learning Loop</p>
      <h2>{latest ? latest.systemFeedback : "Awaiting Signal"}</h2>
      <p>{latest ? `Latest mock signal: ${latest.simulatedViews.toLocaleString()} views, ${latest.simulatedConversions} conversions, retention ${latest.estimatedRetentionDelta}.` : "Simulate performance after inventory exists to create learning records."}</p>
    </section>
  );
}






function allocationScore(item) {
  const demand = item.demand || item.potentialScore || 80;
  const monetization = item.monetization || 82;
  const originality = item.originality || 88;
  const effort = item.effort || 3;
  const risk = item.riskProfile === "HIGH" ? 8 : item.riskProfile === "MEDIUM" ? 4 : 1;

  return Math.max(0, Math.min(10, ((demand + monetization + originality) / 30) - (effort * 0.18) - (risk * 0.12))).toFixed(1);
}

function allocationTier(score) {
  const s = Number(score);
  if (s >= 8.8) return "TIER_A";
  if (s >= 7.5) return "TIER_B";
  if (s >= 5.5) return "TIER_C";
  return "TIER_D";
}

function allocationAction(tier) {
  if (tier === "TIER_A") return "BUILD_IMMEDIATELY";
  if (tier === "TIER_B") return "BUILD_NEXT";
  if (tier === "TIER_C") return "HOLD_MONITOR";
  return "ARCHIVE_OR_REPURPOSE";
}
function BlueprintGenerator({ blueprints, selected, addToInventory }) {
  const blueprint = blueprints.find((bp) => bp.opportunityId === selected.id) || blueprints[0];

  if (!blueprint) {
    return (
      <div className="empty-box">
        <p className="empty">No blueprint package yet. Go to Production Intelligence and click Generate Blueprint.</p>
      </div>
    );
  }

  return (
    <>
      <div className="blueprint-package-grid">
        <div className="intel-card">
          <small>1. Blueprint Core</small>
          <h3>{blueprint.title}</h3>
          <p><strong>Hook:</strong> {blueprint.hook}</p>
          <p><strong>Core Promise:</strong> {blueprint.corePromise}</p>
          <small>Title Candidates</small>
          {blueprint.titleCandidates.map((title) => (
            <p key={title}>• {title}</p>
          ))}
          <div className="inventory-meta">
            {blueprint.informationGain.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div className="intel-card">
          <small>2. AEO & Packaging</small>
          <h3>{blueprint.aeoStatus}</h3>
          <p><strong>Answer Early:</strong> YES</p>
          <p><strong>Specific Entities:</strong> YES</p>
          <p><strong>Information Gain:</strong> YES</p>
          <p><strong>Packaging Brief:</strong> {blueprint.packagingBrief}</p>
        </div>

        <div className="intel-card">
          <small>3. Production Brief</small>
          <h3>{blueprint.status}</h3>
          <p><strong>Duration:</strong> {blueprint.durationTargetSeconds} seconds</p>
          <p><strong>Tone:</strong> {blueprint.tone}</p>
          <p>{blueprint.productionBrief}</p>
          <button className="primary" onClick={addToInventory}>
            Commit Final Blueprint to Inventory
          </button>
        </div>
      </div>
    </>
  );
}


function AllocationEngine({ inventory }) {
  if (!inventory.length) {
    return <p className="empty">No inventory assets yet. Commit a blueprint to inventory first.</p>;
  }

  const ranked = inventory
    .map((asset) => {
      const score = allocationScore(asset);
      const tier = allocationTier(score);
      return {
        ...asset,
        allocationScore: score,
        allocationTier: tier,
        allocationAction: allocationAction(tier)
      };
    })
    .sort((a, b) => Number(b.allocationScore) - Number(a.allocationScore));

  const top = ranked[0];

  return (
    <div className="allocation-grid">
      <div className="intel-card">
        <small>1. Priority Queue</small>
        {ranked.map((asset, index) => (
          <div className="allocation-row" key={asset.id}>
            <span>#{index + 1}</span>
            <div>
              <strong>{asset.title}</strong>
              <p>{asset.allocationTier} · Score {asset.allocationScore}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="intel-card">
        <small>2. Resource Balance Matrix</small>
        <h3>{top.title}</h3>
        <div className="signal-list">
          <div><strong>Business Potential</strong><span>{top.valueTier}</span></div>
          <div><strong>Effort</strong><span>{top.effort || "LOW"}</span></div>
          <div><strong>Risk</strong><span>{top.riskProfile}</span></div>
          <div><strong>Allocation</strong><span>{top.allocationScore}</span></div>
        </div>
      </div>

      <div className="intel-card">
        <small>3. Executive Action</small>
        <h3>{top.allocationAction}</h3>
        <p>The system recommends this asset receive the next available production slot.</p>
        <div className="inventory-meta">
          <span>{top.allocationTier}</span>
          <span>{top.priority}</span>
          <span>{top.stage}</span>
        </div>
        <button className="primary" onClick={() => console.log(`Production slot marked for: ${top.title}`)}>
          Mark Production Slot
        </button>
      </div>
    </div>
  );
}







