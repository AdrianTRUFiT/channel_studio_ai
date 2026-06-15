# Channel Studio AI – Using Ollama for Your Agentic AI Agent

**Why Ollama?** It runs **100% locally** on your computer — private, free, no internet needed after setup, and matches your original “Ollama - Reads/Follows Instructions” plan.

**One-Time Setup (Adult + Project Manager Kid – ~30–60 minutes)**

1. **Make Sure Ollama is Running**
    - Open Terminal/Command Prompt and run:
    ollama serve
    - 
    - Pull good models (choose one or two):
    ollama pull llama3.2 # Fast & good for kids
    - ollama pull qwen2.5 # Strong reasoning
    - ollama pull llama3.1:8b # Balanced
    - 
2. **Best Easy Interface: Install Open WebUI** (ChatGPT-style for Ollama)
This gives the Project Manager kid a beautiful web chat where the Agent lives.
    - Easiest way (Docker recommended):
    docker run -d -p 8080:8080 --add-host=host.docker.internal:host-gateway -v ollama:/root/.ollama -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:ollama
    - 
    - Or use the one-click installer from open-webui.com.
    - Open browser → go to http://localhost:8080
    - Connect to your Ollama (it usually detects automatically).
    - Select your model (e.g., llama3.2).
3. **Create the Studio AI Agent**
In Open WebUI (or Ollama chat):
    - Start a **new chat** named “**Studio AI Agent**”.
    - Paste this as the **System Prompt** (Custom Instructions):

You are Studio AI Agent — a helpful, patient project manager for Channel Studio AI.

You manage faceless YouTube video production for 10-year-old kids.

Follow our exact 6-Phase workflow strictly.

Use simple language. Always ask the Project Manager kid for approval before moving to the next phase.

Folders to reference:

- D:\Studio\Instructions
- D:\Studio\Scripts
- D:\Studio\Visuals
- D:\Studio\Voiceovers
- D:\Studio\Videos
- D:\Studio\Output\Completed

Tools you guide:

- Script writing
- Image prompts for Grok Imagine / Canva
- CapCut automation steps (auto captions, AutoCut, music, etc.)
- Title / Description / Tags with affiliate disclosure
- Checklists

Always output a clear checklist and ask: "Ready to move to next phase?"

**Daily Workflow: Project Manager Kid + Ollama Agent**

**Project Manager Kid says things like:**

- “Agent, new video: AI Authorization. Start Phase 1.”
- “Agent, here is the script. Start Phase 3 CapCut.”
- “Agent, review this video and suggest improvements.”

**The Agent will:**

- Generate script (Phase 1)
- Give image/voice prompts (Phase 2)
- Give **exact CapCut automation steps** (from previous guide)
- Generate title/description/tags (Phase 4)
- Track progress with checklists

**Updated Phase 3 with Ollama Agent Guiding CapCut**

Tell the Agent: “Give me the full CapCut automation steps for this video.”

The Agent will output the numbered steps we covered earlier (import voice → AutoCut → Auto Captions with specific settings → music → export).

**Making It More Agentic (Optional Next Steps)**

- **Simple Level**: Stick with Open WebUI chat (easiest for kids).
- **Advanced Level** (with adult help): Use **CrewAI** + Ollama for multi-agent (one agent for script, one for SEO, etc.).
    - Install: pip install crewai langchain-ollama
    - Connect to your local Ollama models.

Start simple with Open WebUI first.

**Master Checklist (Agent Generates This Every Time)**

The Agent will keep a running checklist in the chat.

**Safety Tips**:

- Adult helps with Ollama/Open WebUI installation.
- Always have the kid review final script, video, and description.
- Save important chats in the “Journal” folder.

This setup uses **your own Ollama** exactly as requested — fully local and private.

**Want me to create right now?**

- The full ready-to-paste System Prompt (including CapCut details)
- Example conversation for the first AI Authorization video
- Printable “How to Talk to Studio AI Agent” sheet for the kids

Just say the word! 🚀