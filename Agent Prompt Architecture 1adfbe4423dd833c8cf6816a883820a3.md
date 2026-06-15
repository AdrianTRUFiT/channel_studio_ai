# Agent Prompt Architecture

This is the core intelligence contract of your entire sovereign system.
The Agent Prompt Architecture is the layer that turns Ollama from “a model runner” into a governed intelligence substrate that behaves predictably, consistently, and systemically across every engine.

Below is the full architecture — structured, layered, and ready to wire into your Lead Engine, Fulfillment Engine, Monetization Engine, and Reddit pipeline.

---

⭐ The Agent Prompt Architecture (APA)

The APA is built from five layers, each one wrapping the next:

1. Role Layer — who the agent is
2. Objective Layer — what the agent must accomplish
3. Context Layer — what the agent must know
4. Constraint Layer — what the agent must obey
5. Output Contract Layer — what the agent must return

Every agent prompt in your system follows this structure.

This is how you get deterministic intelligence instead of “LLM vibes.”

---

1️⃣ Role Layer — Identity = Behavior

This is the anchor.
It defines the persona, domain, and decision authority of the agent.

Examples:

- LeadScoringAgent
“You are a lead‑scoring intelligence that evaluates prospects based on ICP fit, pain intensity, and inferred intent.”
• PainAgent
“You are a pain‑signal extraction model specializing in identifying emotional and operational friction.”
• FulfillmentAgent
“You are a transformational delivery architect responsible for generating premium, system‑aligned delivery messages.”

The role layer ensures consistency across calls.

---

2️⃣ Objective Layer — The Mission

This layer defines the exact task the agent must complete.

Examples:

- Extract pains, frustrations, unmet needs
• Score a lead from 0–100
• Generate a delivery message using the canonical template
• Build an author profile from Reddit signals
• Qualify a lead against ICP criteria

This layer ensures purpose.

---

3️⃣ Context Layer — The Information

This is where you feed the agent:

- ICP profiles
• Pain patterns
• Signals
• Similar leads
• Offer templates
• Buyer profiles
• Reddit post content
• Manuals
• Engine definitions

This is the recall layer.

Agents pull from:

- Operational memory (SQLite)
• Semantic memory (Qdrant/Chroma)
• Knowledge memory (MANUAL folder)

This layer ensures intelligence.

---

4️⃣ Constraint Layer — The Rules

This is where you enforce:

- No hallucination
• No assumptions beyond provided context
• Use only the given schema
• Follow the system’s logic
• Stay inside the ICP
• Use the canonical templates
• Return only structured output

This layer ensures governance.

---

5️⃣ Output Contract Layer — The Shape

This is the most important part.

Every agent must return strict JSON, strict Markdown, or strict key/value.

Examples:

PainAgent

{
"pains": [],
"frustrations": [],
"unmet_needs": [],
"severity": 0
}

LeadScoringAgent

{
"score": 0,
"rationale": ""
}

FulfillmentAgent

# Delivery Message

...

This layer ensures machine‑readability.

---

🧩 The Full Prompt Architecture Template

Here is the canonical APA template every agent uses:

ROLE:
You are the {AgentName}, a specialized intelligence responsible for {mission}.

OBJECTIVE:
Your goal is to {specific task}.

CONTEXT:
Here is the information you must use:
{context_block}

CONSTRAINTS:

- Use only the information provided.
- Do not hallucinate.
- Follow the system’s logic.
- Follow the ICP and patterns.
- Follow the canonical templates.
- Return only the output format specified.

OUTPUT CONTRACT:
Return your answer in the following format:
{json_or_markdown_schema}

This template is universal across all agents.

---

🧠 Example: LeadScoringAgent Prompt (APA Applied)

ROLE:
You are the LeadScoringAgent, an intelligence that evaluates prospects based on ICP fit, pain intensity, subreddit context, and inferred intent.

OBJECTIVE:
Score this lead from 0–100 and explain your reasoning.

CONTEXT:
Lead:
{lead_json}

ICP:
{icp_json}

Similar Leads:
{similar_leads_json}

Pain Patterns:
{pain_patterns_json}

CONSTRAINTS:

- Use only the provided context.
- Do not hallucinate.
- Score must be an integer 0–100.
- Rationale must be concise and grounded in evidence.

OUTPUT CONTRACT:
{
"score": 0,
"rationale": ""
}

This is deterministic intelligence.

---

🧠 Example: PainAgent Prompt (APA Applied)

ROLE:
You are the PainAgent, a model specializing in extracting emotional and operational pain signals.

OBJECTIVE:
Extract pains, frustrations, unmet needs, and severity.

CONTEXT:
Post:
{post_body}

CONSTRAINTS:

- Use only the text provided.
- Severity must be 1–10.
- Return JSON only.

OUTPUT CONTRACT:
{
"pains": [],
"frustrations": [],
"unmet_needs": [],
"severity": 0
}

---

🧠 Example: FulfillmentAgent Prompt (APA Applied)

ROLE:
You are the FulfillmentAgent, responsible for generating transformational delivery messages.

OBJECTIVE:
Produce a delivery message using the canonical template.

CONTEXT:
Offer Package:
{offer_json}

Buyer Profile:
{buyer_json}

Canonical Template:
{template_markdown}

CONSTRAINTS:

- Follow the template exactly.
- Maintain transformational tone.
- Return Markdown only.

OUTPUT CONTRACT:
{markdown_output}

---

🔌 How This Wires Into Ollama

Every agent:

1. Builds the APA prompt
2. Sends it to Ollama via localhost:11434/v1/chat/completions
3. Parses the structured output
4. Returns it to the pipeline

This is how Ollama becomes your intelligence substrate.

---

🚀 What This Gives You

- Predictable agents
• Deterministic outputs
• Zero hallucination
• System‑aligned intelligence
• Reusable architecture
• Fully sovereign reasoning layer

This is the brain contract of your entire system.

---

🔮 Next Step

Which do you want to define next:

- Agent Class Skeletons
• Pipeline → Ollama Integration
• Model Strategy & Selection
• Memory → Agent Recall Wiring

Choose one and I’ll build it at production‑grade clarity.