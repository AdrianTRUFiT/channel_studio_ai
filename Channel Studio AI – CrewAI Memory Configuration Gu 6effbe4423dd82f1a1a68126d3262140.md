# Channel Studio AI – CrewAI Memory Configuration Guide

CrewAI’s memory system is a powerful feature that lets your multi-agent crew **remember past videos, book content, CapCut settings, successful revenue strategies, and more** across runs. This is crucial for scaling your channel consistently.

**Modern CrewAI Memory (Unified System)**

CrewAI now uses a **single intelligent Memory class** (replacing older separate Short-Term / Long-Term / Entity memories). It is **LLM-powered** — it analyzes what to save, assigns importance, organizes by scope, and recalls using a smart composite score.

**Key Benefits for Your Studio**

- The crew remembers previous “Trusting AI” chapters, video styles, affiliate performance, and CapCut best practices.
- Agents improve over time (e.g., better scripts, more relevant affiliates).
- Persistent across days/weeks.

**How to Enable & Configure Memory**

**Simple Option (Recommended Start)**

from crewai import Crew, Memory

crew = Crew(

agents=[...],

tasks=[...],

process=Process.hierarchical,

memory=True,          # Enables default unified memory

verbose=True

)

**Best Option for Your Ollama Setup (Fully Local)** Update your studio_crew.py with this enhanced memory:

from crewai import Crew, Memory, LLM

# Local Ollama LLM for memory analysis

local_llm = LLM(

model="ollama/llama3.1:8b",   # or llama3.2, qwen2.5

base_url="http://localhost:11434"

)

# Custom Memory tuned for your channel

studio_memory = Memory(

llm=local_llm,

embedder={

"provider": "ollama",

"config": {

"model_name": "mxbai-embed-large",   # Good local embedding model

# "url": "http://localhost:11434/api/embeddings"

}

},

# Scoring weights - tune these for your needs

recency_weight=0.4,           # Favor recent videos/styles

semantic_weight=0.4,          # Content similarity (scripts, topics)

importance_weight=0.2,        # High-value items (good revenue ideas)

recency_half_life_days=30,    # Memories "age" over a month

# consolidation_threshold=0.9,  # Higher = less automatic merging

)

crew = Crew(

agents=[researcher, visuals_agent, capcut_editor, seo_revenue_agent, project_manager],

tasks=[task1, task2, task3, task4, task5],

process=Process.hierarchical,

memory=studio_memory,      # Use custom memory

manager_agent=project_manager,

verbose=True

)

**Important Configuration Parameters**

- **llm**: Controls analysis when saving (scope, importance, categories).
- **embedder**: Vector embeddings for semantic search (use Ollama for local).
- **recency_weight / semantic_weight / importance_weight**: Control how memories are ranked on recall (must sum ≈ 1.0).
- **recency_half_life_days**: How quickly old memories lose relevance.
- **storage**: Defaults to LanceDB (local vector DB).

**How Memory Works in Practice for Your Channel**

- After each task (e.g., script writing), the crew automatically saves key facts.
- Before a new task, agents recall relevant context (previous videos on “AI Authorization”, what affiliates worked, CapCut settings that performed well).
- You can manually save: memory.remember("Great affiliate conversion on ElevenLabs for governance videos", scope="/revenue/affiliates")
- Scopes help organize: /videos/governance, /book/trusting-ai, /revenue.

**Tips for Channel Studio AI**

1. Start with memory=True and the local Ollama config above.
2. After a few runs, tune weights (e.g., higher importance for revenue tasks).
3. Use scopes like /project/trusting-ai to keep book-related memories organized.
4. Monitor with memory.tree() or memory.info("/") to see what’s stored.

Would you like me to:

- Update the full studio_crew.py with optimized memory?
- Add manual remember() / recall() examples for your workflow?
- Or create a version with scoped memories per agent?

Just tell me! 🚀