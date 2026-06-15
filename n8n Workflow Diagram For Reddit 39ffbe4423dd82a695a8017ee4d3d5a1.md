# n8n Workflow Diagram For Reddit

n8n workflow diagram for your Reddit Lead Gen Pipeline, expressed in a way you can build directly, modify easily, and run sovereignly inside your local automation stack.

I’m giving you the actual node‑by‑node wiring, the data flow, and the agent invocation pattern so you can drop this straight into your Lead Engine.

---

🔥 Reddit Lead Gen Pipeline — n8n Workflow Diagram

Below is the full pipeline, expressed as a visual graph in text form so you can recreate it exactly inside n8n.

Each node is a box, each arrow is a flow, and each agent call is a local function/HTTP node.

---

🧩 Top‑Level Flow

[Start]
↓
[Build Reddit Queries]
↓
[Loop: For Each Query]
↓
[Search Reddit (TOS-safe)]
↓
[Loop: For Each Post]
↓
[Extract Pain Signals]
↓
[Build Author Profile]
↓
[Enrich Lead]
↓
[Qualify Lead]
↓
[Score Lead]
↓
[Tag Lead]
↓
[Route Lead]
↓
[Write to leads.db + logs]
↓
[End]

This is the exact wiring.

---

🧱 Node‑by‑Node Breakdown

Below is the full n8n diagram in structured form.

---

1. Start Node
- Trigger: manual, cron, or webhook
• Output: { run_id, timestamp }

---

1. Build Reddit Queries (Function Node)

Uses your ICP + signals.

Inputs:

- /research/icp/icp_profiles.json
• /research/signals/signals.json

Outputs:

{
"queries": [
"AI governance help",
"automation overwhelm",
"workflow broken small business"
]
}

---

1. Split Queries (Split In Batches Node)

Iterates through each query.

---

1. Search Reddit (HTTP Node)

TOS‑safe method:
Use a search engine query:

[https://www.google.com/search?q=site:reddit.com+](https://www.google.com/search?q=site:reddit.com+)"{{ $json.query }}"

Outputs:

- List of Reddit post URLs
• Titles
• Snippets

---

1. Extract Post Content (Function Node)

Fetches the post body using a public preview endpoint or text‑only view.

Outputs a normalized object:

{
"url": "...",
"title": "...",
"body": "...",
"author": "u/username",
"subreddit": "r/smallbusiness"
}

---

1. Split Posts (Split In Batches Node)

Iterates through each post.

---

1. Extract Pain Signals (HTTP Node → Local Agent)

Calls your local agent:

POST [http://localhost:8000/pain-agent/extract](http://localhost:8000/pain-agent/extract)

Outputs:

{
"pain_points": [...],
"severity": "high"
}

---

1. Build Author Profile (HTTP Node → Local Agent)

POST [http://localhost:8000/profile-agent/build](http://localhost:8000/profile-agent/build)

Outputs:

{
"role": "founder",
"stage": "early",
"pain_intensity": 8
}

---

1. Enrich Lead (HTTP Node → Local Agent)

POST [http://localhost:8000/enrichment-agent/enrich](http://localhost:8000/enrichment-agent/enrich)

Outputs:

{
"lead_id": "reddit_u_username",
"source": "reddit",
"role": "founder",
"pain": "automation overwhelm",
"post_url": "..."
}

---

1. Qualify Lead (HTTP Node → Local Agent)

POST [http://localhost:8000/qualification-agent/qualify](http://localhost:8000/qualification-agent/qualify)

Outputs:

{
"qualified": true,
"reason": "Matches ICP"
}

---

1. Score Lead (HTTP Node → Local Agent)

POST [http://localhost:8000/scoring-agent/score](http://localhost:8000/scoring-agent/score)

Outputs:

{
"score": 87
}

---

1. Tag Lead (HTTP Node → Local Agent)

POST [http://localhost:8000/tagging-agent/tag](http://localhost:8000/tagging-agent/tag)

Outputs:

{
"tags": ["ICP-core", "pain:automation", "intent:high"]
}

---

1. Route Lead (HTTP Node → Local Agent)

POST [http://localhost:8000/routing-agent/route](http://localhost:8000/routing-agent/route)

Outputs:

{
"next_action": "nurture_sequence_A",
"priority": "high"
}

---

1. Write to leads.db (SQLite Node)

Insert or update:

- lead_id
• role
• pain
• score
• tags
• next_action
• source
• timestamps

---

1. Write to lead_actions.log (Write Binary File Node)

Append a JSON line:

{
"lead_id": "...",
"action": "nurture_sequence_A",
"timestamp": "..."
}

---

1. End Node

---

🧩 Full Workflow (ASCII Diagram)

┌──────────┐
│  Start   │
└────┬─────┘
↓
┌───────────────┐
│ Build Queries │
└────┬──────────┘
↓
┌──────────────────────┐
│ Split Queries (Loop) │
└────┬─────────────────┘
↓
┌──────────────────┐
│ Search Reddit    │
└────┬─────────────┘
↓
┌────────────────────┐
│ Extract Post Data  │
└────┬───────────────┘
↓
┌──────────────────────┐
│ Split Posts (Loop)   │
└────┬─────────────────┘
↓
┌──────────────────────┐
│ Extract Pain Signals │
└────┬─────────────────┘
↓
┌──────────────────────┐
│ Build Author Profile │
└────┬─────────────────┘
↓
┌──────────────────────┐
│   Enrich Lead        │
└────┬─────────────────┘
↓
┌──────────────────────┐
│  Qualify Lead        │
└────┬─────────────────┘
↓
┌──────────────────────┐
│   Score Lead         │
└────┬─────────────────┘
↓
┌──────────────────────┐
│    Tag Lead          │
└────┬─────────────────┘
↓
┌──────────────────────┐
│   Route Lead         │
└────┬─────────────────┘
↓
┌──────────────────────┐
│ Write to leads.db    │
└────┬─────────────────┘
↓
┌──────────────────────┐
│ Write lead_actions   │
└────┬─────────────────┘
↓
┌──────────┐
│   End    │
└──────────┘

---

🚀 If you want next

I can generate:

- The full n8n JSON export
• The agent API spec
• The Python agent skeletons
• The exact prompts each agent uses
• The folder structure for Reddit leads

Just tell me which one you want to lock in.