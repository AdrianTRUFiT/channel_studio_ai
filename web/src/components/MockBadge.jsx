import { FlaskConical } from "lucide-react";

// A deliberately loud, reusable marker. Phase 01 must never let mock data read
// as real, so anything not connected to a live system wears this.
export default function MockBadge({ label = "MOCK" }) {
  return (
    <span className="badge mock" title="Not a live system — mock/prototype data">
      <FlaskConical size={12} /> {label}
    </span>
  );
}
