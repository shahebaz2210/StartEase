<div align="center">

# StartEase
### An Adaptive, Zero-Pressure Task Initiation & Completion Companion

[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Electron 35](https://img.shields.io/badge/Electron-35.1-47848F?style=flat&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

<p align="center">
  <b>Designed for when starting feels impossible and finishing feels overwhelming.</b><br>
  Guides you through academic and workplace tasks one connected, UI-structured micro-action at a time.<br>
  <i>No step counts • No countdown timers • No judgment • Flawless end-to-end completion.</i>
</p>

</div>

---

## 🌿 The Problem & Philosophy

People experiencing **executive dysfunction**, ADHD, autism, task paralysis, or burnout often find the hardest moment is initiating a task and staying oriented until it is finished. Conventional productivity tools exacerbate this with:
- Long intimidating lists of steps that overwhelm working memory.
- Countdowns, timers, and streaks that trigger acute anxiety.
- Vague high-level advice like "write the body" or "format the document" that leaves users stranded.
- Artificial limits that halt guidance halfway through, leaving users with an incomplete draft.

**StartEase** is built on a fundamentally different philosophy:
1. **One Tiny Step at a Time**: The user is only ever presented with their current immediate micro-action.
2. **Zero Visibility of Remaining Steps**: There are no step numbers (no "Step 1 of 24"), no progress bars, and no future step previews.
3. **Flawless End-to-End Completion**: No artificial step ceilings. StartEase provides the full, unbroken journey (from opening the app, setting margins and fonts, typing core sections, performing quality reviews, to final export and download).
4. **Structured Directly Around App UI**: Every step specifically targets real UI controls in the recommended software (e.g., Canva canvas text fields, Word top ribbon menus, alignment buttons, export dialogs).
5. **Upfront Content Flow Planning**: The system plans the logical hierarchy and content progression before generating micro-steps, ensuring deliverables follow a coherent structure.
6. **Pre-Export Quality Review Gate**: An explicit, direct step instructs the user to check their work and purge irrelevant details, off-topic notes, or leftover template placeholder text before downloading.
7. **Adaptive Steering**: Users advance through simple one-tap responses:
   - **Done** `[1]`: Progresses to the next tiny step.
   - **Confused** `[2]`: Re-explains the exact same step in simpler, clearer language.
   - **Too big** `[3]`: Slices the step into an even smaller, lower-friction sub-action.
   - **Not now** `[Space]`: Safely pauses the session with zero penalty or alarms.
8. **Automated Tool Recommendation**: The companion automatically matches the task with the ideal application (Word, Canva, Excel, Notion, diagrams.net, etc.) via vector retrieval over a curated knowledge base.

---

## 🖥️ User Experience & Screens

| Screen | Purpose | Visual Reference |
|---|---|---|
| **Welcome** | Low-friction guest access, no mandatory signup or data collection | `design/screens/01-welcome.png` |
| **Task Entry** | Messy natural-language input, optional gentle deadline chips, speech-to-text | `design/screens/02-task-entry.png` |
| **Step Focus** | Single action card, app badge, zero-expectation milestone, 4 adaptive buttons | `design/screens/04-step.png` |
| **Floating Companion** | Ultra-compact `360x310` always-on-top HUD pinned above Word, Canva, or browser | `apps/desktop` |
| **Rest & Pause** | Safe pause point, resume same/smaller, time extension email drafts | `design/screens/08-rest.png` |
| **Gentle Log** | Private, non-gamified record of completed tasks stored strictly in localStorage | `design/screens/10-log.png` |

---

## 🏗️ Monorepo Architecture

```
StartEase/
├── apps/
│   ├── api/            # FastAPI backend service (Python 3.11+)
│   │   ├── app/
│   │   │   ├── llm/        # Gemini client with content flow planning & UI-grounded prompts
│   │   │   ├── retrieval/  # TF-IDF & character n-gram cosine similarity vector retriever
│   │   │   ├── validator/  # Tone safety, banned words & step count sanitizers
│   │   │   ├── sessions/   # In-memory session manager with TTL cleanup & rate limits
│   │   │   ├── safety/     # Crisis & emergency keyword interception
│   │   │   └── models/     # Pydantic v2 schemas and request models
│   │   ├── tests/      # 22+ automated tests across retrieval, safety, validation & API
│   │   ├── run_evals.py# Section E golden acceptance criteria benchmark suite
│   │   └── Dockerfile  # Production container definition
│   ├── web/            # Next.js 16 + React 19 web application
│   │   ├── src/        # Screens, components, audio synthesis, speech recognition, state
│   │   └── out/        # Pre-rendered static export bundled for desktop
│   └── desktop/        # Electron shell application
│       ├── src/        # Main & preload processes, native cursor drag, system tray, state
│       └── release/    # Standalone executable & Windows NSIS installer
├── data/
│   ├── knowledge_base.csv # Curated academic & professional task-app RAG pairings
│   └── eval/           # Golden benchmark datasets for retrieval, out-of-scope & safety
├── design/             # Pixel-perfect design reference screenshots & design tokens
└── docs/               # PRD, Architecture Plan, OpenAPI spec, Safety rules & Copy guides
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or later & `npm`
- **Python**: `v3.11` or later
- **Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/)

---

### 1. Backend Service (`apps/api`)

1. Navigate to the API directory:
   ```bash
   cd apps/api
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables in `apps/api/.env`:
   ```ini
   GEMINI_API_KEY="your-api-key-here"
   GEMINI_MODEL="gemini-3.5-flash-lite"
   PORT=8000
   ```
5. Start the backend server with live reloading:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   Interactive Swagger documentation is available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### 2. Web Application (`apps/web`)

1. Navigate to the web directory:
   ```bash
   cd apps/web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Turbopack development server:
   ```bash
   npm run dev
   ```
   The application will be live at: [http://localhost:3000](http://localhost:3000)

4. Create an optimized static build for desktop bundling:
   ```bash
   npm run build
   ```

---

### 3. Desktop Companion (`apps/desktop`)

The desktop app runs as an Electron wrapper with a compact **always-on-top floating mode** (`360x310`), allowing users to keep their current micro-action pinned directly above Word, Canva, or browser windows.

1. Navigate to the desktop directory:
   ```bash
   cd apps/desktop
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run in development mode:
   ```bash
   npm start
   ```
4. Build the Windows installer (`.exe`):
   ```bash
   npm run dist:win
   ```
   The NSIS installer will be generated in `apps/desktop/release/StartEase Setup 1.0.0.exe`.

---

## 🔒 Safety, Privacy & Tone Integrity

- **Crisis Interception**: Any detected self-harm, medical emergency, or crisis input immediately bypasses the LLM and RAG pipeline. The application provides fixed, compassionate emergency support resources (988 Lifeline, Crisis Text Line) and never generates a task step.
- **Strict Privacy**: Task descriptions and user inputs are **never written to disk or logged**. All audio speech recognition and synthesis run on-device via native browser APIs.
- **Calm Tone Rules**: The Gemini prompt enforces a hard cap of 25 words per step, strictly bans pressure words (`must`, `should`, `need to`, `have to`, `overdue`, `lazy`, `failed`, `easy`, `just`, `simply`), and eliminates all step counters.
- **Client-Side Data Storage**: Gentle Log items and user preferences remain strictly local to the user's browser/desktop client (`localStorage`).

---

## 🧪 Testing & Evaluation

### Automated Backend Tests
Run the pytest test suite:
```bash
cd apps/api
python -m pytest tests/ -v
```
*Validates API endpoints, session state transitions, validator regex stripping, crisis safety triggers, and RAG retrieval accuracy.*

### Golden Benchmark Evaluations
Run the full Section E acceptance criteria benchmark:
```bash
cd apps/api
python run_evals.py
```

| Evaluation Criterion | Measured Score | Target Threshold | Status |
|---|:---:|:---:|:---:|
| **Retrieval Top-3 Accuracy** | **100.0%** | 85.0% | **PASS** |
| **Step 1 Exactness** | **100.0%** | 100.0% | **PASS** |
| **Out-of-Scope Rejection** | **100.0%** | 100.0% | **PASS** |
| **Adversarial & Safety Compliance** | **100.0%** | 100.0% | **PASS** |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
