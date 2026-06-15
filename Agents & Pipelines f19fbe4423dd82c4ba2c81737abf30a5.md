# Agents & Pipelines

Here’s the clean wiring so your agents and pipelines sit on top of the sovereign stack without ever touching a metered API.

---

1. High‑level wiring

Element	Runs where	Talks to what	
Pipelines	n8n / Python scripts	Local LLM, DB, vector store, file system	
Agents	Python modules	Local LLM API, vector store, DB	
LLM runtime	Ollama / LM Studio	Exposes HTTP API on localhost	
Memory	Qdrant/Chroma + files	Queried by agents via client libraries	
State	SQLite/Postgres	Updated by pipelines + agents

Pipelines own flow.
Agents own judgment and generation.
Everything talks over localhost.

---

1. Core pattern: “pipeline calls agent”

For every engine (Research, Lead, Revenue, Fulfillment), the pattern is:

1. Pipeline stage starts (n8n node or Python function).
2. It assembles context (inputs, IDs, file paths).
3. It calls an agent (Python class/function) with that context.
4. The agent:• calls the local LLM ([http://localhost](http://localhost/):PORT/v1/chat/completions style),
• reads/writes vector store (Qdrant/Chroma),
• reads/writes DB (SQLite/Postgres),
• returns a structured result (JSON + file paths).
5. Pipeline persists outputs and moves to the next stage.

No agent ever runs “free”; it’s always invoked inside a pipeline stage.

---

1. Example wiring: Fulfillment pipeline

Pipeline stages (in n8n or Python)

1. Package Intake• Node: LoadOfferPackage
• Reads: /monetization/offers/{offer_id}/package/
• Writes: fulfillment_payload.json
2. Delivery Prep• Node: CallMessagingAgent
• Calls: MessagingAgent.prepare_delivery(payload)
• MessagingAgent:• Queries local LLM for the canonical transformational delivery message.
• Writes: delivery_message.md, [instructions.md](http://instructions.md/).
3. Delivery Execution• Node: DeliverPackage
• Uses: SMTP / portal API (your choice, still under your control).
• Writes: delivery_event.json.
4. Confirmation• Node: CallLoggingAgent
• LoggingAgent:• Writes to revenue.db and delivery.log.
• Returns: delivery_receipt.md.

All LLM calls inside agents go to your local runtime, not the cloud.

---

1. Example wiring: Research engine

Pipeline stages

1. Intake• Node: CollectSources
• Writes raw files to /research/raw/.
2. Normalization• Node: CallNormalizationAgent
• NormalizationAgent:• Cleans text, chunks, embeds via local embedding model.
• Writes to Qdrant/Chroma.
3. Pattern Extraction• Node: CallPatternAgent
• PatternAgent:• Retrieves from vector store.
• Calls local LLM to extract pains, desires, objections.
• Writes patterns.json.
4. Synthesis• Node: CallSynthesisAgent
• SynthesisAgent:• Produces [insights.md](http://insights.md/), icp_profiles.json, opportunity_map.md.

Again: pipelines orchestrate, agents think, everything is local.

---

1. Agent structure (per engine)

Each agent is a Python module with:

- Input: structured context (dict/JSON).
• Process:• optional vector store query,
• one or more local LLM calls,
• optional DB/file writes.
- Output: structured result (dict/JSON + file paths).

Examples:

- ResearchAgent, LeadAgent, ContentAgent, NurtureAgent,
OfferAgent, FulfillmentAgent, LoggingAgent, UpsellAgent.

They all share:

- a common LLM client (pointing to localhost),
• a common vector client,
• a common DB client.

---

1. n8n ↔ agents ↔ LLM wiring
- n8n nodes call your agents via:• HTTP (local FastAPI/Flask server), or
• direct command (python agent_runner.py ...) if you prefer CLI.
- Agents call the LLM via:• HTTP to localhost (Ollama/LM Studio).
- Agents call Qdrant/Chroma via:• their Python client libraries.
- Agents call SQLite/Postgres via:• sqlalchemy or direct drivers.

So the wiring graph is:

n8n / Python pipeline → Agent → Local LLM + Vector + DB → Agent result → Pipeline next stage

---

1. How this stays sovereign
- All endpoints are localhost or your own LAN.
• No external AI APIs in the loop.
• Pipelines and agents are versioned in Git.
• Models are pinned in your local runtime.

You get full control over behavior, cost, and evolution.

---

If you want, next step we can pick one engine (e.g., Fulfillment or Research) and I’ll lay out the exact agent list, function signatures, and pipeline stages as a skeleton you can drop straight into code.