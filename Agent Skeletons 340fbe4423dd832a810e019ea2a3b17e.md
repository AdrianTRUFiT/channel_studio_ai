# Agent Skeletons

Here’s a clean, reusable agent skeleton set you can drop straight into your repo and wire to Ollama, DB, vector store, and filesystem.

I’ll keep it tight and canonical so you can extend without friction.

---

🔧 Common base: `BaseAgent`

from abc import ABC, abstractmethod
from typing import Any, Dict

class BaseAgent(ABC):
def **init**(self, llm_client, db_client=None, vector_client=None, fs_client=None):
self.llm = llm_client        # Ollama/OpenAI-style client
self.db = db_client          # SQLite/Postgres wrapper
self.vector = vector_client  # Qdrant/Chroma wrapper
self.fs = fs_client          # File/Manuals wrapper

```
@abstractmethod
def recall(self, *args, **kwargs) -> Dict[str, Any]:
    """Gather context from memory layers."""
    ...

@abstractmethod
def build_prompt(self, context: Dict[str, Any]) -> str:
    """Build APA prompt from role, objective, context, constraints, schema."""
    ...

@abstractmethod
def parse(self, raw_llm_output: str) -> Dict[str, Any]:
    """Parse structured output (JSON/Markdown) from LLM."""
    ...

def call_llm(self, prompt: str, model: str) -> str:
    """Send prompt to local LLM via Ollama."""
    response = self.llm.chat(model=model, messages=[{"role": "user", "content": prompt}])
    return response["choices"][0]["message"]["content"]
```

---

🧠 PainAgent (Reddit / signals)

class PainAgent(BaseAgent):
ROLE = "PainAgent"
OBJECTIVE = "Extract pains, frustrations, unmet needs, and severity."
OUTPUT_SCHEMA = {
"pains": [],
"frustrations": [],
"unmet_needs": [],
"severity": 0
}

```
def recall(self, post: Dict[str, Any]) -> Dict[str, Any]:
    # Minimal: just the post body; can add patterns from vector store later
    return {"post_body": post.get("body", "")}

def build_prompt(self, context: Dict[str, Any]) -> str:
    return f"""
```

ROLE:
You are the {self.ROLE}, a model specializing in extracting emotional and operational pain signals.

OBJECTIVE:
{self.OBJECTIVE}

CONTEXT:
Post:
{context['post_body']}

CONSTRAINTS:

- Use only the text provided.
- Severity must be 1–10.
- Return JSON only.

OUTPUT CONTRACT:
{self.OUTPUT_SCHEMA}
"""

```
def parse(self, raw_llm_output: str) -> Dict[str, Any]:
    import json
    return json.loads(raw_llm_output)

def extract(self, post: Dict[str, Any]) -> Dict[str, Any]:
    context = self.recall(post)
    prompt = self.build_prompt(context)
    raw = self.call_llm(prompt, model="qwen2.5-coder")
    return self.parse(raw)
```

---

🎯 LeadScoringAgent

class LeadScoringAgent(BaseAgent):
ROLE = "LeadScoringAgent"
OBJECTIVE = "Score this lead from 0–100 and explain your reasoning."
OUTPUT_SCHEMA = {"score": 0, "rationale": ""}

```
def recall(self, lead: Dict[str, Any]) -> Dict[str, Any]:
    # Example: pull ICP, similar leads, pain patterns
    icp = self.fs.load_json("/knowledge/icp/icp_profiles.json")
    similar = self.vector.search(lead["embedding"], top_k=5) if self.vector else []
    patterns = self.fs.load_json("/memory/semantic/pain_patterns.json")
    return {
        "lead": lead,
        "icp": icp,
        "similar_leads": similar,
        "pain_patterns": patterns
    }

def build_prompt(self, context: Dict[str, Any]) -> str:
    return f"""
```

ROLE:
You are the {self.ROLE}, an intelligence that evaluates prospects based on ICP fit, pain intensity, subreddit context, and inferred intent.

OBJECTIVE:
{self.OBJECTIVE}

CONTEXT:
Lead:
{context['lead']}

ICP:
{context['icp']}

Similar Leads:
{context['similar_leads']}

Pain Patterns:
{context['pain_patterns']}

CONSTRAINTS:

- Use only the provided context.
- Do not hallucinate.
- Score must be an integer 0–100.
- Rationale must be concise and grounded in evidence.

OUTPUT CONTRACT:
{self.OUTPUT_SCHEMA}
"""

```
def parse(self, raw_llm_output: str) -> Dict[str, Any]:
    import json
    return json.loads(raw_llm_output)

def score(self, lead: Dict[str, Any]) -> Dict[str, Any]:
    context = self.recall(lead)
    prompt = self.build_prompt(context)
    raw = self.call_llm(prompt, model="qwen2.5-coder")
    return self.parse(raw)
```

---

📦 FulfillmentAgent (canonical delivery message)

class FulfillmentAgent(BaseAgent):
ROLE = "FulfillmentAgent"
OBJECTIVE = "Generate a transformational delivery message using the canonical template."

```
def recall(self, offer: Dict[str, Any], buyer: Dict[str, Any]) -> Dict[str, Any]:
    template = self.fs.load_text("/knowledge/templates/canonical_delivery.md")
    return {"offer": offer, "buyer": buyer, "template": template}

def build_prompt(self, context: Dict[str, Any]) -> str:
    return f"""
```

ROLE:
You are the {self.ROLE}, responsible for generating transformational delivery messages.

OBJECTIVE:
{self.OBJECTIVE}

CONTEXT:
Offer Package:
{context['offer']}

Buyer Profile:
{context['buyer']}

Canonical Template:
{context['template']}

CONSTRAINTS:

- Follow the template exactly.
- Maintain transformational tone.
- Return Markdown only.

OUTPUT CONTRACT:
Return a single Markdown document representing the final delivery message.
"""

```
def parse(self, raw_llm_output: str) -> Dict[str, Any]:
    # For Markdown, just wrap it
    return {"markdown": raw_llm_output}

def generate_message(self, offer: Dict[str, Any], buyer: Dict[str, Any]) -> Dict[str, Any]:
    context = self.recall(offer, buyer)
    prompt = self.build_prompt(context)
    raw = self.call_llm(prompt, model="llama3.1-instruct")
    return self.parse(raw)
```

---

🧩 RoutingAgent (decide next action)

class RoutingAgent(BaseAgent):
ROLE = "RoutingAgent"
OBJECTIVE = "Decide the next action for this lead based on score, tags, and ICP."

```
OUTPUT_SCHEMA = {"next_action": "", "priority": ""}

def recall(self, lead: Dict[str, Any]) -> Dict[str, Any]:
    rules = self.fs.load_json("/knowledge/routing/rules.json")
    return {"lead": lead, "rules": rules}

def build_prompt(self, context: Dict[str, Any]) -> str:
    return f"""
```

ROLE:
You are the {self.ROLE}, a decision engine that routes leads into the correct next sequence.

OBJECTIVE:
{self.OBJECTIVE}

CONTEXT:
Lead:
{context['lead']}

Routing Rules:
{context['rules']}

CONSTRAINTS:

- Use only the provided rules.
- Do not hallucinate new actions.
- next_action must be one of the defined sequences.
- priority must be 'low', 'medium', or 'high'.

OUTPUT CONTRACT:
{self.OUTPUT_SCHEMA}
"""

```
def parse(self, raw_llm_output: str) -> Dict[str, Any]:
    import json
    return json.loads(raw_llm_output)

def route(self, lead: Dict[str, Any]) -> Dict[str, Any]:
    context = self.recall(lead)
    prompt = self.build_prompt(context)
    raw = self.call_llm(prompt, model="qwen2.5-coder")
    return self.parse(raw)
```

---

If you want, next we can define a minimal llm_client, db_client, vector_client, and fs_client interfaces so these skeletons plug cleanly into your sovereign stack without refactoring later.