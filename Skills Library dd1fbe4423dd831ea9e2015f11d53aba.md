# Skills Library

Here s the Skill Library Structure defined the way a sovereign, agent‑driven system must be organized:
clean, modular, testable, and built for long‑term extensibility.

This is the structure that lets your agents pull capabilities like modules, your pipelines invoke them predictably, and your entire system grow without chaos.

Below is the full architecture — the directory layout, the contracts, the loading mechanism, and the wiring pattern.

---

⭐ The Skill Library Structure (Canonical)

Your skill library lives in a single top‑level directory:

/skills/
registry.json
/retrieval/
/interpretation/
/reasoning/
/generation/
/action/

Each subfolder contains atomic skill modules — one skill per file.

This gives you:

- discoverability
• modularity
• testability
• version control clarity
• agent‑level governance

---

🧩 Folder‑by‑Folder Breakdown

1. /skills/retrieval/

Skills that pull information from memory.

Examples:

- RetrieveLeadRecord
• RetrieveICP
• RetrieveSimilarLeads
• RetrievePainPatterns
• RetrieveOfferPackage
• RetrieveCanonicalTemplate

These skills never call the LLM.
They are pure data access.

---

1. /skills/interpretation/

Skills that understand or extract meaning.

Examples:

- ExtractPainSignals
• ClassifySeverity
• InferRole
• DetectIntent
• ClusterSignals

These skills often call the LLM.

---

1. /skills/reasoning/

Skills that decide or compute.

Examples:

- ComputeLeadScore
• MatchICP
• DetermineNextAction
• EvaluateOfferFit
• AssessUrgency

These skills always call the LLM.

---

1. /skills/generation/

Skills that produce structured output.

Examples:

- GenerateDeliveryMessage
• GenerateNurtureSequence
• GenerateSummary
• GenerateOpportunityMap

These skills call the LLM and return Markdown or JSON.

---

1. /skills/action/

Skills that change system state.

Examples:

- WriteLeadScore
• WriteQualification
• WriteRoutingDecision
• WriteDeliveryArtifact
• WritePainRecord

These skills never call the LLM.
They write to DB, logs, or filesystem.

---

⭐ Skill File Structure (Per Skill)

Each skill is a single Python file with a Skill Contract at the top.

Example:

/skills/interpretation/extract_pain_signals.py

Inside:

SKILL = {
"name": "ExtractPainSignals",
"category": "interpretation",
"inputs": ["post_body"],
"outputs": ["pains", "frustrations", "unmet_needs", "severity"],
"memory_used": [],
"llm_required": True
}

def run(agent, context):
# agent = the calling agent instance
# context = dict of inputs
prompt = agent.build_prompt_from_skill(SKILL, context)
raw = agent.call_llm(prompt, model="qwen2.5-coder")
return agent.parse_json(raw)

This gives you:

- a contract
• a run() function
• a clear interface

---

⭐ registry.json (The Capability Map)

This file maps agents → skills.

Example:

{
"PainAgent": {
"skills": [
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
"ComputeLeadScore",
"WriteLeadScore"
]
}
}

This is the governance layer.

---

⭐ How Agents Load Skills

Agents load skills dynamically:

class BaseAgent:
def load_skills(self):
allowed = self.registry[[self.name](http://self.name/)]["skills"]
self.skills = {}

```
    for skill_name in allowed:
        module = importlib.import_module(f"skills.{self.find_category(skill_name)}.{skill_name}")
        self.skills[skill_name] = module.run
```

Agents now call skills like:

result = self.skills["ExtractPainSignals"](self, context)

This gives you:

- dynamic loading
• hot‑swappable skills
• clean separation of concerns

---

⭐ Visual Diagram: Skill Library Wiring

/skills/
registry.json
/retrieval/
/interpretation/
/reasoning/
/generation/
/action/

Agent
↓ loads allowed skills
Skill Registry
↓ maps agent → skills
Skill Modules
↓ run() executes capability
Memory + LLM
↓ provide intelligence
Pipeline

This is the capability loop.

---

🚀 Why This Structure Works

Because it gives you:

- Governance — agents can only use approved skills
• Modularity — skills are atomic and reusable
• Testability — each skill can be unit‑tested
• Extensibility — add new skills without touching agents
• Sovereignty — everything runs local, under your control

This is how your system becomes scalable, maintainable, and future‑proof.

---

🔮 Next Step

Which layer do you want to define next:

- Skill Interface (Python)
• Skill Execution Flow
• Agent → Skill Binding Code
• Skill Versioning Strategy

Choose one and I’ll build it at production‑grade clarity.