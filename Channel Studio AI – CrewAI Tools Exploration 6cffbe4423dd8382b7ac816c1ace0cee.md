# Channel Studio AI – CrewAI Tools Exploration

**CrewAI Tools** are external capabilities (skills) that agents can use to perform actions beyond pure reasoning. They turn your agents from “thinkers” into “doers.”

**Core Concepts**

- Tools are assigned to individual **Agents** (not the whole crew).
- Agents decide **when and how** to use them based on their role/goal and the task.
- CrewAI supports:
    - Built-in **CrewAI Tools** (from crewai_tools package)
    - **LangChain Tools**
    - **Custom tools** (easiest for your project)

**Most Useful Tools for Channel Studio AI**

**1. File & Directory Tools (Highly Recommended – Local & Private)**

Perfect for reading your “Trusting AI” book, scripts, and folders.

from crewai_tools import (

FileReadTool,

DirectoryReadTool,

FileWriteTool

)

file_read = FileReadTool()

dir_read = DirectoryReadTool(directory="D:\\Studio\\Instructions")

file_write = FileWriteTool()   # For saving scripts/PDF ideas

**Best Agents to Give These**:

- Researcher (read book chapters)
- SEO/Revenue Agent (write metadata files)

**2. Search & Research Tools**

For finding affiliates, latest AI governance news, or certification trends.

- SerperDevTool or ExaSearchTool (web search – needs API key)
- WebsiteSearchTool / ScrapeWebsiteTool

For **fully local** setup, rely more on custom tools or limit to file-based research.

**3. Other Relevant Tools**

- CodeInterpreterTool — Run Python code (useful for revenue calculations)
- CSVSearchTool / DOCXSearchTool — Search your journal or documents
- Custom image generation prompts (tie into Canva/Grok Imagine)

**How to Add Tools to Your Crew**

**Example for Your Studio**:

from crewai_tools import FileReadTool, DirectoryReadTool, FileWriteTool

# Tools

book_reader = FileReadTool()                    # Read Trusting AI book

folder_reader = DirectoryReadTool(directory="D:\\Studio")

script_writer = FileWriteTool()

# Assign to agents

researcher = Agent(

role="Book Researcher & Script Writer",

goal="Extract content from the Trusting AI book and create scripts",

backstory="...",

tools=[book_reader, folder_reader],   # ← Tools here

allow_delegation=False,

verbose=True

)

seo_agent = Agent(

...,

tools=[script_writer],   # Can save descriptions

...

)

**Creating Custom Tools (Very Powerful for Your Workflow)**

**Simplest Method – Decorator** (Recommended):

from crewai import tool

@tool("Save_Final_Script")

def save_final_script(script_content: str, filename: str) -> str:

"""Saves the generated script to the Scripts folder."""

path = f"D:\\Studio\\Scripts\\{filename}.txt"

with open(path, "w", encoding="utf-8") as f:

f.write(script_content)

return f"Script saved successfully to {path}"

Then assign: tools=[save_final_script]

**Recommendations for Channel Studio AI**

1. **Start Simple**: Use FileReadTool, DirectoryReadTool, and 1–2 custom tools.
2. **Project Manager Agent** should have fewer tools (focus on coordination).
3. **Researcher & SEO Agents** benefit most from tools.
4. Combine with **Memory** and **Hierarchical Delegation** for best results.
5. Keep it local-friendly — avoid heavy external API tools initially.

Would you like me to:

- Update the full studio_crew.py with useful tools integrated?
- Provide custom tool examples (e.g., “Generate CapCut Instructions”, “Create PDF Summary”, “Suggest Affiliates”)?
- Or show how to combine tools with delegation?

Just tell me the next piece! 🚀