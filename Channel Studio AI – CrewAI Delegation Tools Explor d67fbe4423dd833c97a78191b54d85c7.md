# Channel Studio AI – CrewAI Delegation Tools Exploration

CrewAI provides **two main delegation mechanisms** that allow agents to collaborate intelligently. These are perfect for your multi-step video production + revenue workflow.

**1. Core Delegation Tools (Enabled by `allow_delegation=True`)**

When you set allow_delegation=True on an agent, CrewAI **automatically injects two powerful tools**:

| **Tool Name** | **Purpose** | **Signature / Usage** |
| --- | --- | --- |
| **Delegate Work Tool** | Assign a full sub-task to another agent | Delegate work to coworker(task: str, context: str, coworker: str) |
| **Ask Question Tool** | Ask for information or clarification | Ask question to coworker(question: str, context: str, coworker: str) |

These tools let agents dynamically collaborate during execution.

**Example in Code**:

researcher = Agent(

role="Book Researcher & Script Writer",

goal="Create educational scripts from Trusting AI book",

backstory="Expert at breaking down AI Governance topics...",

allow_delegation=True,   # ← This activates the two tools

verbose=True

)

**2. Hierarchical Delegation (Recommended for Your Studio)**

Use Process.hierarchical + a dedicated **Project Manager Agent**. This is cleaner and more controllable than peer-to-peer delegation.

- The Manager Agent receives high-level tasks.
- It **delegates** subtasks to the best specialist agents.
- It reviews results and can re-delegate or compile final output.

**Best Practice Setup for Channel Studio AI**:

project_manager = Agent(

role="Studio Project Manager",

goal="Coordinate the full video + revenue workflow and ensure quality",

backstory="Organized leader helping 10-year-olds run Channel Studio AI efficiently.",

allow_delegation=True,      # Manager can delegate

verbose=True

)

# Specialists should usually have delegation OFF to avoid loops

researcher = Agent(..., allow_delegation=False)

capcut_editor = Agent(..., allow_delegation=False)

seo_revenue_agent = Agent(..., allow_delegation=False)

Then create the crew:

crew = Crew(

agents=[researcher, visuals_agent, capcut_editor, seo_revenue_agent],

tasks=[task1, task2, task3, task4],

manager_agent=project_manager,     # ← Enables hierarchical delegation

process=Process.hierarchical,

memory=True,                       # Combine with memory

verbose=True

)

**Delegation Strategy Tips for Your Project**

- **Enable delegation** on the **Project Manager** and maybe one generalist agent.
- **Disable delegation** (allow_delegation=False) on specialists (Researcher, CapCut Editor, SEO) to keep them focused.
- Use **clear roles and goals** — this helps the manager delegate correctly.
- Combine with **Memory** so the manager remembers what worked in previous videos (e.g., good CapCut settings, successful affiliates).

This setup lets your Ollama-based AI crew function like a real studio team: the Project Manager Kid gives one high-level command, and the AI Manager Agent intelligently delegates the rest.

Would you like me to:

- Provide the **full updated studio_crew.py** with hierarchical delegation + memory?
- Add delegation examples specific to book-to-course or video production?
- Show how to monitor delegation in logs?

Just tell me the next step! 🚀