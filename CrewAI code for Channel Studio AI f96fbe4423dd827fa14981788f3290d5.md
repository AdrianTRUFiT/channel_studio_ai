# CrewAI code for Channel Studio AI

**File: `D:\Studio\CrewAI\studio_crew.py`**

from crewai import Agent, Task, Crew, Process, LLM

from datetime import datetime

# ========================= CONFIG =========================

llm = LLM(

model="ollama/llama3.1:8b",        # Change to llama3.2, qwen2.5, or your best model

base_url="http://localhost:11434",

temperature=0.7

)

# ======================= AGENTS =======================

project_manager = Agent(

role="Studio Project Manager",

goal="Coordinate the entire team, keep everything on schedule, and ensure kid-friendly quality.",

backstory="You are a patient, organized leader helping 10-year-olds run Channel Studio AI.",

llm=llm,

verbose=True

)

researcher = Agent(

role="Book Researcher & Script Writer",

goal="Create simple, educational 2-5 minute video scripts from the 'Trusting AI' book or new requests.",

backstory="You specialize in breaking down AI Governance and Trust topics for kids.",

llm=llm,

verbose=True

)

visuals_agent = Agent(

role="Visuals & Thumbnail Creator",

goal="Generate excellent image prompts for Grok Imagine / Canva and thumbnail ideas.",

backstory="You create engaging visuals for faceless educational videos.",

llm=llm,

verbose=True

)

capcut_editor = Agent(

role="CapCut Automation Expert",

goal="Provide exact step-by-step CapCut automation instructions including Auto Captions, music, and export.",

backstory="You know all the best CapCut settings for fast, high-quality faceless videos.",

llm=llm,

verbose=True

)

seo_revenue_agent = Agent(

role="SEO & Revenue Optimizer",

goal="Create YouTube titles, descriptions with affiliate links + disclosure, tags, and suggest digital products.",

backstory="You maximize views and revenue while staying honest and educational.",

llm=llm,

verbose=True

)

# ======================= TASKS =======================

task1 = Task(

description="Read the request or relevant chapter from the 'Trusting AI' book in D:\\Studio\\Instructions or Books folder. Write a clear 250-400 word script for a 2-5 minute faceless video. Suggest 1-2 relevant affiliate products.",

agent=researcher,

expected_output="Full script with affiliate suggestions and places for visuals."

)

task2 = Task(

description="Based on the script, create 8-12 strong image prompts for visuals and one eye-catching thumbnail prompt.",

agent=visuals_agent,

expected_output="List of image prompts and thumbnail prompt."

)

task3 = Task(

description="Provide the exact numbered CapCut automation steps: import voiceover, AutoCut, Auto Captions (with best settings), background music, transitions, and export settings.",

agent=capcut_editor,

expected_output="Detailed step-by-step CapCut instructions."

)

task4 = Task(

description="Create an optimized YouTube title, full description (with affiliate disclosure and product links), timestamps, and 10-15 tags. Also suggest one digital product (PDF summary, cheat sheet, or mini-course module) to sell.",

agent=seo_revenue_agent,

expected_output="Complete YouTube metadata + digital product idea."

)

task5 = Task(

description="Review all outputs, create a clear checklist for the Project Manager Kid, and give final recommendations before upload.",

agent=project_manager,

expected_output="Final checklist + approval summary."

)

# ======================= CREW =======================

crew = Crew(

agents=[researcher, visuals_agent, capcut_editor, seo_revenue_agent, project_manager],

tasks=[task1, task2, task3, task4, task5],

process=Process.hierarchical,      # Project Manager coordinates

manager_agent=project_manager,

verbose=True,

memory=True

)

# ======================= RUN =======================

if __name__ == "__main__":

topic = input("Enter video topic or book chapter (e.g., 'AI Authorization'): ")

result = crew.kickoff(inputs={

"topic": topic,

"date": datetime.now().strftime("%Y-%m-%d"),

"book_name": "Trusting AI"

})

print("\n" + "="*60)

print("✅ CREW FINISHED! Full output saved below.")

print("="*60)

print(result)

# Optional: Save output to file

with open(f"D:\\Studio\\Output\\crew_output_{topic.replace(' ', '_')}.txt", "w", encoding="utf-8") as f:

f.write(str(result))

print(f"\n💾 Output also saved to D:\\Studio\\Output folder.")

**How to Use It**

1. Save the code as studio_crew.py in D:\Studio\CrewAI
2. Make sure Ollama is running (ollama serve)
3. Run:
cd D:\Studio\CrewAI
4. python studio_crew.py
5. 
6. Type the topic (e.g. “AI Authorization” or “Trusting AI Chapter 3”)

The agents will work together and deliver everything the Project Manager Kid needs.

Would you like me to also give you:

- The **Open WebUI system prompt** version?
- A version with **digital product generation** task?
- Or instructions to make it even more automated?

Just say the word! 🚀