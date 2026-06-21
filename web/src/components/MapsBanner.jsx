import { ShieldCheck, FlaskConical } from "lucide-react";

export default function MapsBanner({ campaign }) {
  return (
    <>
      <div className="banner maps">
        <ShieldCheck size={18} color="var(--accent)" />
        <div>
          <h3>MAPⓈ — {campaign.maps.posture}</h3>
          <p>{campaign.maps.note}</p>
        </div>
      </div>
      <div className="banner mock">
        <FlaskConical size={18} color="var(--mock)" />
        <div>
          <h3>Prototype shell — mock data only</h3>
          <p>{campaign.provenance.disclaimer}</p>
        </div>
      </div>
    </>
  );
}
