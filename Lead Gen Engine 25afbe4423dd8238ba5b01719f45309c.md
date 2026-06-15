# Lead Gen Engine

Building your Lead Engine is the highest‑leverage move in the entire revenue loop.
This is the system that feeds everything else — content, offers, revenue, and scale.

Below is the complete hybrid architecture for a Lead Engine that runs on your laptop, using pipelines for control and agents for intelligence.

---

⭐ Core Takeaway

A scalable Lead Engine has three layers:

1. Lead Intelligence Layer — who to target and why
2. Lead Acquisition Layer — find, enrich, and qualify leads
3. Lead Activation Layer — tag, score, and route leads into revenue

This is the engine that turns research → prospects → pipeline → revenue.

---

1. 🔍 Lead Intelligence Layer

This layer defines who you target and why they matter.

Components

- ICP Profile — industry, role, pains, buying triggers
• Signal Map — what makes a lead “hot”
• Research Insights — patterns from your research engine

What the agent does

- Clusters audiences
• Extracts buying language
• Identifies high‑value segments
• Generates “lead hypotheses”

Output

- lead_intel.json
• Updated vector store entries

---

1. 🎯 Lead Acquisition Layer

This is where the system finds leads automatically.

Pipeline stages

- lead_sourcing_stage
• lead_enrichment_stage
• lead_validation_stage

Agents

- Lead Sourcing Agent — finds prospects based on ICP + signals
• Enrichment Agent — adds metadata (industry, size, role, URLs)
• Qualification Agent — scores leads based on your criteria

Data stored

- leads.db (SQLite)
• lead_cards/ (Markdown summaries)

Why this works

You get a constant flow of qualified leads, not random names.

---

1. ⚡ Lead Activation Layer

This is where leads become pipeline‑ready.

Pipeline stages

- lead_scoring_stage
• lead_tagging_stage
• lead_routing_stage

Agents

- Scoring Agent — assigns numerical score
• Tagging Agent — applies tags (pain, intent, segment)
• Routing Agent — decides next action:• nurture sequence
• direct outreach
• content drip
• offer pitch

Output

- lead_status.json
• lead_actions.log

Why this matters

This is where automation starts generating revenue, not just lists.

---

🧩 Full Lead Engine Architecture (Hybrid Model)

Layer	Pipeline Role	Agent Role	Output	
Lead Intelligence	deterministic	research/analysis	ICP + signals	
Lead Acquisition	deterministic	sourcing/enrichment	leads.db	
Lead Activation	deterministic	scoring/routing	pipeline‑ready leads

Pipelines = control
Agents = intelligence
Together = scale

---

🗂️ Folder Structure for the Lead Engine

- lead_intel/ — ICP, signals, research
• lead_sources/ — raw leads
• lead_enriched/ — enriched data
• lead_cards/ — human‑readable summaries
• lead_actions/ — routing logs
• automations/lead_engine/ — pipelines + scripts
• agents/lead/ — sourcing, enrichment, scoring agents

This keeps the system clean, modular, and scalable.

---

🚀 What the Lead Engine Enables

Once this is running, you get:

- Daily new leads without manual effort
• Enriched, segmented, and scored prospects
• Automatic routing into nurture or sales
• A predictable pipeline
• A compounding revenue loop

This is the backbone of a one‑person business that performs like a team.

---

🔮 Next Step

Which part of the Lead Engine do you want to build first:

- Lead Sourcing Agent
• Lead Enrichment Pipeline
• Lead Scoring System
• Lead Routing Logic

Your choice determines the first module we architect.