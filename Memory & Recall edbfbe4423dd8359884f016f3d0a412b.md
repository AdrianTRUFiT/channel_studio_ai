# Memory & Recall

memory and recall are the backbone of your entire sovereign system.
Without them, your agents can’t think, your pipelines can’t improve, and your business can’t compound.

Let’s define it cleanly, the way an architect would:
Memory = structured, queryable, durable state
Recall = intelligent retrieval of the right state at the right time

Below is the full architecture — the one that will power your Lead Engine, Reddit pipeline, Fulfillment Engine, and everything else you’re building.

---

🧠 The Three Forms of Memory in Your System

Every sovereign AI system needs three distinct memory layers, each with a different purpose.

1. Operational Memory

This is the “what happened” layer — the system’s working memory.

- Lead records
• Fulfillment events
• Revenue logs
• Pipeline outputs
• Agent decisions
• Status flags

Stored in:
SQLite/Postgres (local, sovereign, durable)

Used by:

- Lead Engine
• Revenue Engine
• Fulfillment Engine

This is your truth layer.

---

1. Semantic Memory

This is the “what it means” layer — the system’s understanding.

- ICP profiles
• Pain patterns
• Signals
• Research clusters
• Past conversations
• Reddit pain extractions
• Enriched lead profiles

Stored in:
Qdrant or Chroma (vector store)

Used by:

- Research Engine
• Lead Gen Engine
• Content Engine
• Nurture Engine

This is your intelligence layer.

---

1. Knowledge Memory

This is the “how the system works” layer — your manuals.

- MANUAL pages
• Engine definitions
• Pipelines
• Canonical communication templates
• Offer structures
• SOPs
• Architecture docs

Stored in:
Markdown files in your repo
Indexed into your vector store for recall.

Used by:

- Every agent
• Every pipeline
• Every decision

This is your governance layer.

---

🔍 The Three Forms of Recall

Memory is useless without recall — the ability to pull the right information at the right time.

Your system uses three recall modes:

---

1. Direct Recall (Structured Query)

Used when the system knows exactly what it needs.

Examples:

- “Find all leads with score > 80”
• “Get last 10 fulfillment events”
• “Load ICP profile for founders”

Mechanism:
SQL queries to your local DB.

This is fast, deterministic, and exact.

---

1. Semantic Recall (Vector Search)

Used when the system needs meaning, not exact matches.

Examples:

- “Find posts similar to this Reddit pain signal”
• “Retrieve all content related to automation overwhelm”
• “Find ICP segments matching this new lead”

Mechanism:
Vector search in Qdrant/Chroma.

This is how your system “thinks.”

---

1. Contextual Recall (Agent‑level Retrieval)

Used when an agent needs to combine memory types.

Examples:

- LeadScoringAgent retrieves:• ICP profile
• Pain patterns
• Similar leads
• Past outcomes
- FulfillmentAgent retrieves:• Offer template
• Canonical delivery message
• Buyer profile

Mechanism:
Agent orchestrates multiple recalls
(SQL + vector + file system)

This is how your system “reasons.”

---

🧩 How Memory & Recall Wire Into Your Engines

Here’s the wiring diagram for your Lead Engine as an example:

LeadSourcingAgent
→ writes raw leads → operational memory (DB)

LeadEnrichmentAgent
→ retrieves ICP + signals → semantic memory (vector)
→ writes enriched lead → operational memory

LeadQualificationAgent
→ retrieves patterns + ICP → semantic memory
→ writes qualification → operational memory

LeadScoringAgent
→ retrieves similar leads → semantic memory
→ writes score → operational memory

LeadRoutingAgent
→ retrieves nurture sequences → knowledge memory
→ writes next_action → operational memory

Every engine follows this pattern.

---

🧱 Folder Structure for Memory

/memory/
/operational/
leads.db
revenue.db
delivery.log
conversion_events.json

```
/semantic/
    qdrant/ (or chroma/)
    embeddings/
    vectors/

/knowledge/
    MANUAL/
    engines/
    pipelines/
    templates/
```

This gives you durability, traceability, and sovereignty.

---

🚀 Why This Matters

With this architecture:

- Your Reddit Lead Gen pipeline can remember every pain signal it has ever seen.
• Your Fulfillment Engine can recall every delivery and improve messaging.
• Your Research Engine can compound insights over time.
• Your Content Engine can pull from everything you’ve ever written.
• Your Monetization Engine can predict upsell timing based on past behavior.

This is how your system becomes self‑improving.

---

🔮 Next Step

Which memory layer do you want to implement first:

- Operational Memory
• Semantic Memory
• Knowledge Memory

Choose one and I’ll generate the exact folder structure + DB schema + agent hooks for it.