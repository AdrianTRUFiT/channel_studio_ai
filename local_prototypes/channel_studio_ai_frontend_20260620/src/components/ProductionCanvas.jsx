import { DEFAULT_MODULE_AUTHORITY, AUTHORITY_MODES } from "../lib/operations/authorityModes";
import LiveActivityFeed from "./LiveActivityFeed";

const MODULE_STATUS = {
  source_intake: "Ready",
  research: "Running",
  validation: "Waiting",
  blueprint: "Ready",
  performance: "Ready",
  allocation: "Waiting",
  production: "Halted",
  inventory: "Ready",
  publishing: "Locked",
  learning: "Ready",
};

const MODULE_PURPOSE = {
  source_intake: "Normalizes incoming source material before anything enters the workflow.",
  research: "Finds content opportunities and source signals worth evaluating.",
  validation: "Checks whether the opportunity deserves production attention.",
  blueprint: "Turns validated ideas into structured production packages.",
  performance: "Defines emotional, visual, audio, and viewer-response direction.",
  allocation: "Prioritizes which assets deserve production capacity first.",
  production: "Represents the future production lane. Rendering remains locked.",
  inventory: "Stores approved asset records and production packages.",
  publishing: "Stages release decisions. Publishing remains human-governed.",
  learning: "Feeds performance outcomes back into future decisions.",
};

export default function ProductionCanvas() {
  return (
    <div className="canvas-shell">
      <div className="canvas-header">
        <div>
          <p className="eyebrow">Live Workflow Canvas</p>
          <h2>Channel Operations Center</h2>
          <p>
            A calm view of what is happening, where authority sits, and when human help is needed.
          </p>
        </div>
        <div className="canvas-principle">
          Silent when healthy. Visible when useful. Interruptive only when necessary.
        </div>
      </div>

      <div className="canvas-operating-layout"><div className="canvas-grid">
        {DEFAULT_MODULE_AUTHORITY.map((module, index) => {
          const status = MODULE_STATUS[module.id] || "Ready";
          const authority = AUTHORITY_MODES[module.mode];

          return (
            <button
              key={module.id}
              className={`canvas-card authority-${module.mode.toLowerCase()} status-${status.toLowerCase()}`}
              onClick={() => window.dispatchEvent(new CustomEvent("canvas-module-selected", { detail: module }))}
              onDoubleClick={() => window.dispatchEvent(new CustomEvent("canvas-module-opened", { detail: module }))}
              title="Click to inspect. Double click to open module workspace."
            >
              <div className="canvas-card-top">
                <span className="canvas-step">{String(index + 1).padStart(2, "0")}</span>
                <span className="canvas-status">{status}</span>
              </div>

              <h3>{module.label}</h3>
              <p>{MODULE_PURPOSE[module.id]}</p>

              <div className="canvas-card-bottom">
                <span className="authority-pill">{module.mode}</span>
                <span className="sensitivity">Sensitivity {module.sensitivity}%</span>
              </div>

              <small>{authority.meaning}</small>
            </button>
          );
        })}
      </div><LiveActivityFeed /></div><div className="canvas-footer-note">
        Click a module for inspector view. Double click later opens the full workbench.
      </div>
    </div>
  );
}

