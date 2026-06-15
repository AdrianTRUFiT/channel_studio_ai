# Architecture overview

---

Layer	Role	Main focus	
Orchestration layer	Pipelines, routing, state	Deterministic flow	
Agent layer	Specialized AI workers	Autonomy, judgment, tool use	
Revenue surface layer	Offers, leads, delivery, analytics	Money in, money out, feedback

You use pipelines to guarantee flow, and agents to handle complexity and variation.  thinking.inc +1

---

1. Orchestration layer (pipelines)

Goal: every important business outcome is a named, repeatable pipeline.

- Core concept:• Input → stages → output, with explicit steps like:• research → analysis → generation → QA → publish → log thinking.inc
- On your laptop, use:• Language: Python or Node (pick one and commit)
• Orchestration: simple custom pipeline framework or LangGraph/CrewAI if you want more structure DEV Community
• Task runner: make or task to trigger pipelines (task lead-gen, task publish-post)

Why: pipelines give you predictability, observability, and debuggability. Agents plug into them, they don’t replace them.

---

1. Agent layer (specialized workers)

Goal: agents own roles, not everything.

Create 3–5 core agents:

- Research agent:• Finds competitors, examples, audience language, pain points.
- Strategy/offer agent:• Turns research into positioning, offer structures, pricing hypotheses.
- Content agent:• Writes emails, pages, scripts, posts from strategy inputs.
- QA/compliance agent:• Checks clarity, coherence, tone, and basic risk.
- Ops agent (optional):• Generates checklists, SOPs, and task breakdowns.

Each agent:

- has a clear mandate and tool access (files, APIs, vector store)
• is invoked inside a pipeline stage, not free‑roaming
• writes to and reads from shared state (e.g., JSON, DB, or files) DEV Commu... +1

Why: specialization increases quality and scale; orchestration keeps them from becoming chaos.

---

1. Revenue surface layer

Goal: every pipeline and agent ultimately serves offers, leads, and delivery.

On the laptop, define three surfaces:

- Offers surface• Folder: ./offers/
• Each offer has: [01-research.md](http://01-research.md/), [02-strategy.md](http://02-strategy.md/), 03-assets/, 04-metrics.json.
- Leads & CRM lite• Simple DB: SQLite or Airtable/Notion synced from scripts.
• Pipelines: lead_capture, lead_nurture, offer_launch.
- Delivery & analytics• ./delivery/ for client artifacts and logs.
• ./revenue/ for dashboards (CSV/SQLite + a simple notebook or script to visualize). Medium

Why: hybrid automation is only useful if you can see where money is coming from and going to.

---

1. Concrete stack on the new laptop
- Runtime & orchestration• Python 3.10+
• uv or pip + venv
• make or task for commands
- Agent frameworks (optional but helpful)• LangGraph or CrewAI for multi‑agent coordination. Medium +1
- Data & state• SQLite for leads, revenue, pipeline logs
• Local vector store (Chroma or similar) for knowledge and assets
- Authoring• VS Code + Markdown repo for offers, scripts, and docs

---

1. Folder layout (hybrid‑ready)
- automations/ — pipelines, task files, orchestration code
• agents/ — agent definitions, tools, prompts
• offers/ — each offer as its own subfolder
• content/ — generated assets, ready vs draft
• delivery/ — client work, fulfillment artifacts
• revenue/ — DB, reports, charts
• logs/ — pipeline runs, agent decisions

---

If you want, next step we can design one flagship hybrid pipeline end‑to‑end—for example:
idea → research → offer → sales page → email sequence → launch log.