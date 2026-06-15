# Channel Studio AI – AutoGen Multi-Agent Framework with Ollama

*(Kid-friendly explanation + setup guide. Alternative to CrewAI.)*

**What is AutoGen?**

**AutoGen** (by Microsoft) is a powerful multi-agent framework where AI agents **talk to each other** in conversations (like a group chat) to solve problems together. Agents can pass messages, review each other’s work, and collaborate dynamically.

It’s more **flexible and conversational** than CrewAI (which is more structured with clear roles + sequential tasks). Great for creative workflows like your YouTube video production.

**AutoGen vs CrewAI (Simple Comparison for Kids)**

| **Feature** | **CrewAI** | **AutoGen** |
| --- | --- | --- |
| Style | Like assigned jobs | Like a team chatting |
| Best for | Step-by-step tasks | Creative discussion & iteration |
| Ease for beginners | Slightly easier | A bit more code but very powerful |
| Local Ollama | Good | Excellent (native support) |

Both work great locally with Ollama. Start with whichever feels simpler after trying.

**Step-by-Step Setup with Ollama (Adult + Project Manager Kid)**

**1. Prerequisites**

- Ollama running (ollama serve)
- Good model pulled: ollama pull llama3.1:8b or llama3.2
- Python installed

**2. Install AutoGen**

pip install pyautogen[ollama]

**3. Create Your Studio Crew Script** Make folder D:\Studio\AutoGen and file studio_autogen.py:

from autogen import AssistantAgent, UserProxyAgent, config_list_from_json

import os

# Ollama config (local)

config_list = [

{

"model": "llama3.1:8b",      # Change to your model

"api_type": "ollama",

# "client_host": "http://localhost:11434"  # if needed

}

]

# Define Agents (roles)

researcher = AssistantAgent(

name="Script_Researcher",

system_message="You write simple educational scripts for kids about AI topics.",

llm_config={"config_list": config_list}

)

editor = AssistantAgent(

name="CapCut_Editor",

system_message="You give exact step-by-step CapCut automation instructions including auto captions, music, and export.",

llm_config={"config_list": config_list}

)

seo = AssistantAgent(

name="YouTube_SEO",

system_message="You create catchy titles, descriptions with affiliate disclosure, and tags.",

llm_config={"config_list": config_list}

)

# Human kid as the boss

user_proxy = UserProxyAgent(

name="Project_Manager_Kid",

human_input_mode="ALWAYS",     # Kid approves or gives input

code_execution_config=False

)

# Start the conversation

user_proxy.initiate_chat(

researcher,

message="New video request: AI Authorization. Follow our 6-phase workflow and coordinate with other agents."

)

# The agents will chat and hand off work

**4. Run it**

cd D:\Studio\AutoGen

python studio_autogen.py

The agents will talk to each other and involve the kid at key points.

**How the Project Manager Kid Uses It**

- Put request in Instructions folder.
- Run the script.
- Read the conversation → approve script → ask for CapCut steps → approve final output.
- Other kids handle hands-on (CapCut clicks, upload).

You can expand it with more agents (Visuals Agent, Reviewer Agent) that join the group chat.

**Tips for Your Channel**

- Use **stronger models** (e.g., 8b or 14b) for better results.
- Add tools later (file reading, code execution for automation).
- Save conversation logs to your Journal folder.
- Start simple: Test with one agent first, then build the full team.

AutoGen shines when agents need to **discuss and iterate** (e.g., “Is this script good? Editor, give CapCut steps based on it”).

**Want me to create next?**

- A full ready-to-run studio_autogen.py with your exact 6 phases + CapCut details
- Comparison test (run both CrewAI and AutoGen examples)
- Printable kid guide for running AutoGen

Let me know which one! 🚀