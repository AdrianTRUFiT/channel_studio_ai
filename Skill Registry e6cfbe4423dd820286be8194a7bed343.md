# Skill Registry

Here is the Skill Registry defined the way a real sovereign AI system needs it:
a single source of truth that maps every agent → every skill → every capability in your stack.

This is the layer that gives your system governance, predictability, and extensibility.
It’s the “capability map” your agents draw from, and the “contract” your pipelines rely on.

Below is the full architecture — clean, layered, and ready to implement.

---

⭐ What the Skill Registry is

The Skill Registry is a central dictionary that defines:

- What skills exist
• What each skill does
• Which agent can use which skill
• What inputs/outputs each skill expects
• What memory layers each skill touches
• Whether the skill requires LLM reasoning

It is the capability contract of your entire system.

---

⭐ What the Skill Registry solves

It prevents:

- Agents drifting in behavior
• Pipelines calling skills that don’t exist
• LLM prompts becoming inconsistent
• Memory recall becoming chaotic
• Capabilities being duplicated or lost

It ensures:

- Deterministic behavior
• Reusable skills
• Governed intelligence
• Predictable outputs
• Easy extension

---

🧩 The Skill Registry Structure (Canonical)

Here is the exact structure your system should use:

/skills/
registry.json
/retrieval/
/interpretation/
/reasoning/
/generation/
/action/

And the registry.json file is the master map.

---

🧠 Skill Registry (registry.json)

Below is the canonical version:

{
"PainAgent": {
"skills": [
"RetrievePostBody",
"ExtractPainSignals",
"ClassifySeverity",
"WritePainRecord"
]
},

"LeadScoringAgent": {
"skills": [
"RetrieveLeadRecord",
"RetrieveICP",
"RetrieveSimilarLeads",
"RetrievePainPatterns",
"ComputeLeadScore",
"WriteLeadScore"
]
},

"LeadQualificationAgent": {
"skills": [
"RetrieveLeadRecord",
"RetrieveICP",
"MatchICP",
"WriteQualification"
]
},

"RoutingAgent": {
"skills": [
"RetrieveRoutingRules",
"DetermineNextAction",
"WriteRoutingDecision"
]
},

"FulfillmentAgent": {
"skills": [
"RetrieveOfferPackage",
"RetrieveBuyerProfile",
"RetrieveCanonicalTemplate",
"GenerateDeliveryMessage",
"WriteDeliveryArtifact"
]
}
}

This is the capability map of your system.

---

🧱 Skill Definition Contract

Each skill has a Skill Contract stored in /skills/<category>/<skill>.json.

Here is the canonical format:

{
"name": "ExtractPainSignals",
"category": "interpretation",
"purpose": "Extract pains, frustrations, unmet needs from text.",
"inputs": ["post_body"],
"outputs": ["pains", "frustrations", "unmet_needs", "severity"],
"memory_used": ["none"],
"llm_required": true,
"constraints": [
"Return JSON only",
"Severity must be 1–10",
"Use only provided text"
]
}

Every skill in your system follows this structure.

---

🧩 How Agents Use the Skill Registry

Agents load the registry at initialization:

class BaseAgent:
def **init**(self, name, registry, llm, db, vector, fs):
[self.name](http://self.name/) = name
self.registry = registry[name]["skills"]
self.llm = llm
self.db = db
self.vector = vector
self.fs = fs

Then they call skills like this:

self.skills["ExtractPainSignals"](notion://app.notion.com/p/context)

The registry ensures:

- The skill exists
• The agent is allowed to use it
• The skill contract is valid
• The skill has the right inputs/outputs

This is governed intelligence.

---

🧠 Visual Diagram: Skill Registry Wiring

Pipeline
↓
Agent
↓ (loads allowed skills)
Skill Registry
↓ (provides skill contracts)
Skill Execution
↓
Memory Recall + LLM Reasoning
↓
Structured Output
↓
Pipeline Next Stage

This is the capability loop.

---

🚀 Why This Matters

Because with a Skill Registry:

- You can add new skills without touching agents
• You can add new agents without breaking pipelines
• You can enforce governance across the entire system
• You can test skills independently
• You can version skills cleanly
• You can evolve your system without chaos

This is how your sovereign AI stack becomes scalable and maintainable.

---

🔮 Next Step

Which layer do you want to define next:

- Skill Library Structure
• Skill Interface (Python)
• Skill Execution Flow
• Agent → Skill Binding Code

Choose one and I’ll build it at production‑grade clarity.