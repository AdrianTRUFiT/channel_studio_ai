import { statusCounts } from "../lib/pipeline.js";

const COLOR = {
  "Not Started": "var(--text-dim)",
  Researching: "var(--accent)",
  "Blueprint Ready": "var(--accent)",
  "Script Ready": "var(--accent)",
  "Voice Ready": "var(--warn)",
  "Visuals Ready": "var(--warn)",
  "Render Ready": "var(--warn)",
  "Human Review": "var(--review)",
  Approved: "var(--good)",
  "Publish Ready": "var(--good)",
  Published: "var(--good)",
  Blocked: "var(--blocked)",
};

export default function PipelineStatusCards({ campaign }) {
  const rows = statusCounts(campaign);
  return (
    <div className="grid pipeline">
      {rows.map(({ status, count }) => (
        <div className="pip" key={status}>
          <span className="name">
            <span
              className="dot"
              style={{ background: COLOR[status] ?? "var(--text-dim)", marginRight: 8 }}
            />
            {status}
          </span>
          <span className="count">{count}</span>
        </div>
      ))}
    </div>
  );
}
