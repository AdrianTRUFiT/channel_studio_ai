# Channel Studio AI – CrewAI Multi-Agent Setup with Ollama

**What is CrewAI?**

CrewAI is a Python framework that lets you create a **team of AI agents** (a “Crew”) that work together like your human team. Each agent has a **role** (e.g., Script Writer, Video Editor Helper) and specific **tasks**.

Instead of one big AI doing everything, specialized agents hand off work to each other — perfect for your full video workflow.

**Why use it with Ollama?** Everything runs **locally** on your computer — private, free, and matches your original Ollama setup.

**Simple Crew for Your Channel (Recommended Starter Team)**

| **Agent Name** | **Role** | **Main Tasks** |
| --- | --- | --- |
| **Researcher** | Script & Affiliate Researcher | Read request, write script, suggest affiliate |
| **Visuals Agent** | Image & Thumbnail Creator | Generate prompts for visuals/thumbnail |
| **Editor Agent** | CapCut Automation Guide | Give exact CapCut steps (auto captions, music, etc.) |
| **SEO Agent** | Launch Expert | Write title, description (with disclosure), tags |
| **Project Manager Agent** | Coordinator | Oversee the whole process, create checklists, ask for kid approval |

**Step-by-Step Setup (Adult + Project Manager Kid)**

**1. Prerequisites**

- Ollama running with good models (e.g., ollama pull llama3.1:8b or qwen2.5:14b — bigger = smarter but slower).
- Python 3.10+ installed.

**2. Install CrewAI** Open terminal/command prompt and run:

pip install crewai crewai-tools langchain-ollama

**3. Create Your First Crew Script** Create a folder D:\Studio\CrewAI and a file studio_crew.py inside it. Paste this code (kid can help edit):

from crewai import Agent, Task, Crew, Process, LLM

import os

# Connect to your local Ollama

llm = LLM(

model="ollama/llama3.1:8b",      # Change to your best model

base_url="http://localhost:11434"

)

# Define Agents

researcher = Agent(

role="Script Researcher",

goal="Create simple, educational scripts for faceless YouTube videos",

backstory="You are great at explaining AI topics to kids.",

llm=llm,

verbose=True

)

editor = Agent(

role="CapCut Video Editor",

goal="Give exact step-by-step instructions for CapCut automation, auto captions, music, and export",

backstory="You know all the CapCut tricks for fast faceless videos.",

llm=llm,

verbose=True

)

seo = Agent(

role="YouTube SEO Expert",

goal="Create catchy titles, descriptions with affiliate disclosure, and tags",

backstory="You help videos get more views.",

llm=llm,

verbose=True

)

manager = Agent(

role="Studio Project Manager",

goal="Coordinate the whole team and make checklists",

backstory="You keep everything on track and ask the human kid for approval.",

llm=llm,

verbose=True

)

# Define Tasks

task1 = Task(

description="Read the request from D:\\Studio\\Instructions and write a 300-word script for the video.",

agent=researcher,

expected_output="A complete script with affiliate suggestion"

)

task2 = Task(

description="Provide full CapCut automation steps including auto captions settings, music, and export.",

agent=editor,

expected_output="Numbered CapCut instructions"

)

task3 = Task(

description="Create title, description with affiliate disclosure, and tags.",

agent=seo,

expected_output="Ready-to-use YouTube metadata"

)

# Create the Crew

crew = Crew(

agents=[researcher, editor, seo],

tasks=[task1, task2, task3],

manager_agent=manager,

process=Process.hierarchical,   # Manager coordinates

verbose=True

)

# Run it!

result = crew.kickoff(inputs={"topic": "AI Authorization"})

print(result)

**4. Run the Crew**

cd D:\Studio\CrewAI

python studio_crew.py

The agents will work together and output everything in order!

**How the Project Manager Kid Uses It**

1. Put the new request in the Instructions folder.
2. Run the Python script (or tell the main Ollama Agent to run it).
3. Review the output (script, CapCut steps, metadata).
4. Approve → other kids do the hands-on parts (CapCut, upload).
5. Save results to the correct folders.

**Tips for Kids & Team**

- Start with smaller/faster models if your computer is slow.
- Add more agents later (e.g., Reviewer Agent).
- The **Project Manager Agent** can ask the kid “Ready for next phase?” automatically.
- Save this script and improve it over time.

This is the next level after simple Ollama chat — now you have a **real AI team** running your Channel Studio AI workflow!

**Want me to create next?**

- A ready-to-use studio_crew.py file tailored exactly to your 6 phases
- Instructions to make it run from Open WebUI
- Or a printable kid guide for running the crew

Let me know! 🚀