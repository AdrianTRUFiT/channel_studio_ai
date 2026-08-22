// Thin fetch wrappers around the dev-server Campaign Intake API
// (web/server/intakeApi.js). These only succeed when running `npm run dev`
// (Vite's configureServer hook is dev-only) — a static/preview build has no
// backend, and callers must treat a failed fetch as "API unavailable", not as
// an application error. See useCampaigns.js for the fallback behavior.

async function asJson(res) {
  let body;
  try {
    body = await res.json();
  } catch {
    throw new Error(`unexpected response (status ${res.status})`);
  }
  if (!res.ok || body.ok === false) {
    throw new Error(body?.error || `request failed (status ${res.status})`);
  }
  return body;
}

export async function fetchCampaignList() {
  const res = await fetch("/api/campaigns");
  const body = await asJson(res);
  return body.campaigns;
}

export async function fetchCampaign(file) {
  const res = await fetch(`/api/campaigns/one?file=${encodeURIComponent(file)}`);
  const body = await asJson(res);
  return body.campaign;
}

export async function postIntake(input) {
  const res = await fetch("/api/intake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return asJson(res);
}
