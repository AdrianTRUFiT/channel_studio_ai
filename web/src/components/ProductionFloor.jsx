import MockBadge from "./MockBadge.jsx";

function StatusBadge({ status }) {
  const cls =
    status === "Blocked"
      ? "blocked"
      : status === "Human Review"
        ? "review"
        : ["Approved", "Publish Ready", "Published"].includes(status)
          ? "good"
          : "dim";
  return <span className={`badge ${cls}`}>{status}</span>;
}

function ReviewBadge({ review }) {
  if (review.decision === "Pending") return <span className="badge review">Review: Pending</span>;
  if (review.decision === "Approved") return <span className="badge good">Review: Approved</span>;
  if (review.decision === "Rejected") return <span className="badge blocked">Review: Rejected</span>;
  return <span className="badge dim">Review: —</span>;
}

export default function ProductionFloor({ campaign }) {
  return (
    <>
      <div className="section-h">
        <h2>Production Floor</h2>
        <span className="hint">
          {campaign.videos.length} video assets · every row is mock/prototype state
        </span>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Status</th>
            <th>Human Review</th>
            <th>Owner / Stage</th>
          </tr>
        </thead>
        <tbody>
          {campaign.videos.map((v) => (
            <tr key={v.id}>
              <td className="id">{v.id}</td>
              <td>
                <div className="title">{v.title}</div>
                <div className="pillar">{v.authorityPillar}</div>
              </td>
              <td>
                <StatusBadge status={v.status} />
              </td>
              <td>
                <ReviewBadge review={v.review} />
              </td>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span className="badge dim">{v.agentState.assignedAgent}</span>
                  {v.mock ? <MockBadge /> : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
