import { Film, FolderOpen, FlaskConical, Ban } from "lucide-react";
import status from "../data/renderStatus.json";
import MockBadge from "./MockBadge.jsx";

// Phase 02 render panel. Shows local production status, produced file count,
// output directory, last manifest, and a loud "not published" label. The
// counts come from renderStatus.json's lastRun, written by `produce:videos`.
export default function RenderStatus() {
  const run = status.lastRun;
  return (
    <>
      <div className="section-h">
        <h2>Local Video Production</h2>
        <span className="hint">Phase 02 — local render only, nothing published</span>
      </div>

      <div className="banner mock">
        <FlaskConical size={18} color="var(--mock)" />
        <div>
          <h3>{status.label}</h3>
          <p>
            {status.note} Renderer mode: <code>{status.rendererMode}</code>.
          </p>
        </div>
      </div>

      <div className="grid metrics">
        <div className="card">
          <div className="label">Render status</div>
          <div className="value" style={{ fontSize: 18 }}>
            {run ? (run.renderedCount > 0 ? "Produced" : "Blocked") : "Not run yet"}{" "}
            <MockBadge label="LOCAL" />
          </div>
        </div>
        <div className="card">
          <div className="label">Produced files</div>
          <div className="value">
            {run ? run.renderedCount : 0} <small>/ target {status.targetVideoCount}</small>
          </div>
        </div>
        <div className="card">
          <div className="label">Output directory</div>
          <div className="value" style={{ fontSize: 15 }}>
            <FolderOpen size={15} /> {status.outputDir}
          </div>
        </div>
        <div className="card">
          <div className="label">Published</div>
          <div className="value" style={{ fontSize: 18 }}>
            <Ban size={16} color="var(--blocked)" /> No
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="label">Last produced manifest</div>
        {run ? (
          <>
            <div style={{ marginTop: 8, fontFamily: "var(--mono)", fontSize: 12.5 }}>
              <Film size={13} /> {run.manifestFile}
            </div>
            <p style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 8 }}>
              mode <code>{run.mode}</code> · renderer <code>{run.rendererMode}</code> · ffmpeg{" "}
              <code>{run.ffmpeg?.available ? run.ffmpeg.source : "unavailable"}</code> · generated{" "}
              {run.generatedAt}
            </p>
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {run.videoFiles.slice(0, 24).map((f) => (
                <span className="badge dim" key={f}>
                  {f.replace("outputs/videos/", "")}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p style={{ color: "var(--text-dim)", fontSize: 12.5, marginTop: 8 }}>
            No local run recorded yet. Run <code>{status.command}</code> (or{" "}
            <code>{status.smokeCommand}</code>) to produce MP4s into <code>{status.outputDir}</code>.
          </p>
        )}
      </div>
    </>
  );
}
