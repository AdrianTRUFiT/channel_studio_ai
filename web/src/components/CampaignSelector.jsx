import { FolderOpen } from "lucide-react";

// Only rendered when the intake API is reachable (npm run dev). Lets the
// operator switch the dashboard between every governed campaign on disk,
// including ones just created through IntakeForm — without which a newly
// created campaign would be invisible (the dashboard would still show
// whichever file happened to load first).
export default function CampaignSelector({ campaigns, activeFile, onSelect }) {
  if (campaigns.length <= 1) return null;
  return (
    <div className="campaign-selector">
      <FolderOpen size={14} />
      <select value={activeFile ?? ""} onChange={(e) => onSelect(e.target.value)}>
        {campaigns.map((c) => (
          <option key={c.file} value={c.file}>
            {c.name} ({c.videoCount} video{c.videoCount === 1 ? "" : "s"})
          </option>
        ))}
      </select>
    </div>
  );
}
