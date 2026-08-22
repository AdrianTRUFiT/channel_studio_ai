import { useState } from "react";
import { Sparkles, FlaskConical, ServerOff, ArrowRight } from "lucide-react";
import { postIntake } from "../data/campaignApi.js";
import MockBadge from "./MockBadge.jsx";

const FIELD_HINT = {
  project: "The overall brand or initiative this content belongs to.",
  topic: "The specific assignment. With Video Count = 1 this becomes the video's title verbatim.",
  audience: "Who this is for. One per line if there are several.",
  objective: "What success looks like — e.g. Participation, Awareness, Conversion.",
  coreMessage: "The one idea every video must land. Used verbatim when Video Count = 1.",
  format: "e.g. 60-second vertical video.",
  cta: "The single call to action every video should end on.",
  principles: "Voice/tone rules the content must follow. One per line.",
  sourceAuthority: "Where claims are allowed to come from. One per line.",
  claimConstraints: "What the content must NOT claim. One per line.",
};

function linesToArray(text) {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

const initialState = {
  productTitle: "",
  topic: "",
  audiences: "",
  objective: "",
  coreMessage: "",
  defaultFormat: "60-second vertical video",
  callToAction: "",
  contentPrinciples: "",
  sourceAuthority: "",
  claimConstraints: "",
  videoCount: 1,
  mode: "full",
};

function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export default function IntakeForm({ apiAvailable, onCreated }) {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const response = await postIntake({
        topic: form.topic,
        productTitle: form.productTitle || undefined,
        videoCount: Number(form.videoCount) || 1,
        mode: form.mode,
        contentBrief: {
          objective: form.objective || undefined,
          audiences: linesToArray(form.audiences).length ? linesToArray(form.audiences) : undefined,
          coreMessage: form.coreMessage || undefined,
          callToAction: form.callToAction || undefined,
          contentPrinciples: linesToArray(form.contentPrinciples).length
            ? linesToArray(form.contentPrinciples)
            : undefined,
          sourceAuthority: linesToArray(form.sourceAuthority).length
            ? linesToArray(form.sourceAuthority)
            : undefined,
          claimConstraints: linesToArray(form.claimConstraints).length
            ? linesToArray(form.claimConstraints)
            : undefined,
          defaultFormat: form.defaultFormat || undefined,
        },
      });
      setResult(response);
      onCreated?.(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!apiAvailable) {
    return (
      <div className="banner mock">
        <ServerOff size={18} color="var(--mock)" />
        <div>
          <h3>Campaign creation needs the local sovereign dev server</h3>
          <p>
            The intake form writes governed campaign files through the deterministic Campaign
            Intake Engine, which only runs inside <code>npm run dev</code>. This static build has
            no write backend, so campaign creation is unavailable here — the dashboard still shows
            whatever campaign was bundled at build time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="banner mock">
        <FlaskConical size={18} color="var(--mock)" />
        <div>
          <h3>Local, offline, mock — every time</h3>
          <p>
            This writes a schema-valid governed campaign to <code>data/campaigns/</code>. No
            external API is called, nothing renders, nothing publishes. Human review is still
            required before any downstream step.
          </p>
        </div>
      </div>

      <form className="intake-form" onSubmit={handleSubmit}>
        <div className="grid form-grid">
          <Field label="Project / Campaign" hint={FIELD_HINT.project}>
            <input value={form.productTitle} onChange={set("productTitle")} placeholder="e.g. Mind Warriors" />
          </Field>
          <Field label="Assignment / Topic *" hint={FIELD_HINT.topic}>
            <input
              value={form.topic}
              onChange={set("topic")}
              placeholder="e.g. Built for Pressure"
              required
            />
          </Field>
          <Field label="Audience" hint={FIELD_HINT.audience}>
            <textarea rows={2} value={form.audiences} onChange={set("audiences")} placeholder="Athletes" />
          </Field>
          <Field label="Objective" hint={FIELD_HINT.objective}>
            <input value={form.objective} onChange={set("objective")} placeholder="Participation" />
          </Field>
          <Field label="Core Message" hint={FIELD_HINT.coreMessage}>
            <textarea
              rows={2}
              value={form.coreMessage}
              onChange={set("coreMessage")}
              placeholder="The one idea this content must land."
            />
          </Field>
          <Field label="Format" hint={FIELD_HINT.format}>
            <input value={form.defaultFormat} onChange={set("defaultFormat")} />
          </Field>
          <Field label="CTA" hint={FIELD_HINT.cta}>
            <input value={form.callToAction} onChange={set("callToAction")} placeholder="Train The Mind Challenge" />
          </Field>
          <Field label="Content Principles" hint={FIELD_HINT.principles}>
            <textarea rows={2} value={form.contentPrinciples} onChange={set("contentPrinciples")} />
          </Field>
          <Field label="Source Authority" hint={FIELD_HINT.sourceAuthority}>
            <textarea rows={2} value={form.sourceAuthority} onChange={set("sourceAuthority")} />
          </Field>
          <Field label="Claim Constraints" hint={FIELD_HINT.claimConstraints}>
            <textarea rows={2} value={form.claimConstraints} onChange={set("claimConstraints")} />
          </Field>
          <Field label="Video Count">
            <input type="number" min={1} max={200} value={form.videoCount} onChange={set("videoCount")} />
          </Field>
          <Field label="Production Mode">
            <select value={form.mode} onChange={set("mode")}>
              <option value="full">full</option>
              <option value="smoke">smoke</option>
            </select>
          </Field>
        </div>

        <div className="intake-form-actions">
          <span className="hint">
            {Number(form.videoCount) === 1
              ? "Video Count = 1 → this brief becomes one real, specific content assignment."
              : `Video Count = ${form.videoCount || "?"} → a bulk multi-angle campaign generated from the topic.`}
          </span>
          <button type="submit" className="btn-primary" disabled={submitting}>
            <Sparkles size={14} /> {submitting ? "Creating…" : "Create Campaign"}
          </button>
        </div>
      </form>

      {error && (
        <div className="banner mock" style={{ borderColor: "rgba(255,107,107,0.5)" }}>
          <div>
            <h3>Could not create campaign</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="card intake-result">
          <div className="label">Campaign created</div>
          <div className="value" style={{ fontSize: 18 }}>
            {result.campaign.name} <MockBadge />
          </div>
          <p style={{ color: "var(--text-dim)", fontSize: 12.5, marginTop: 8 }}>
            {result.videoIds.length} video{result.videoIds.length === 1 ? "" : "s"} (
            {result.videoIds.join(", ")}) · {result.campaignFile}
            {result.overwroteExisting ? " (overwrote existing — deterministic re-run)" : ""}
          </p>
          <div className="label" style={{ marginTop: 14 }}>
            Next steps (unchanged governed pipeline — nothing auto-runs)
          </div>
          <pre className="code-block">
            {`npm run build:production -- --campaign ${result.campaignFile} --video ${result.videoIds[0]}\n` +
              `npm run produce:videos -- --campaign ${result.campaignFile}`}
          </pre>
          <button type="button" className="btn-secondary" onClick={() => onCreated?.(result, true)}>
            View this campaign on the dashboard <ArrowRight size={13} />
          </button>
        </div>
      )}
    </>
  );
}
