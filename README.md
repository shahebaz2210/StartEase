<div align="center">

# StartEase
### An Adaptive, Zero-Pressure Task Initiation Companion

[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Electron 35](https://img.shields.io/badge/Electron-35.1-47848F?style=flat&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

<p align="center">
  <b>Designed for when starting feels impossible.</b><br>
  Guides you through academic and workplace tasks one tiny, bite-sized micro-action at a time.<br>
  <i>No step counts • No countdown timers • No judgment • No planning required.</i>
</p>

</div>

---

## 🌿 The Problem & Philosophy

People experiencing **executive dysfunction**, ADHD, autism, task paralysis, or burnout often find the hardest moment is simply initiating a task. Conventional productivity tools exacerbate this with:
- Long lists of steps that overwhelm working memory.
- Countdowns, timers, and streaks that trigger acute anxiety.
- Demands for upfront planning and tool decisions.

**StartEase** is built on a fundamentally different philosophy:
1. **One Tiny Step at a Time**: The user is only ever presented with their current immediate micro-action.
2. **Zero Visibility of Remaining Steps**: There are no step numbers (no "Step 1 of 12"), no progress bars, and no future step previews.
3. **Zero-Expectation Milestones**: A step counts as complete simply by opening a tab, creating a file, or writing a title.
4. **Adaptive Steering**: Users advance through simple one-tap responses:
   - **Done** `[1]`: Progresses to the next tiny step.
   - **Confused** `[2]`: Re-explains the exact same step in simpler, clearer language.
   - **Too big** `[3]`: Slices the step into an even smaller, lower-friction sub-action.
   - **Not now** `[Space]`: Safely pauses the session with zero penalty or alarms.
5. **Tool Selection by the System**: The companion automatically recommends the appropriate application (Google Docs, Canva, Excel, Notion, etc.) so the user does not have to make tool choices.

---

## 🖥️ User Experience & Screens

| Screen | Purpose | Visual Reference |
|---|---|---|
| **Welcome** | Low-friction guest access, no mandatory signup or data collection | `design/screens/01-welcome.png` |
| **Task Entry** | Messy natural-language input, optional gentle deadline chips, speech-to-text | `design/screens/02-task-entry.png` |
| **Step Focus** | Single action card, app badge, zero-expectation milestone, 4 adaptive buttons | `design/screens/04-step.png` |
| **Rest & Pause** | Safe pause point, resume same/smaller, time extension email drafts | `design/screens/08-rest.png` |

---

## 🏗️ Monorepo Architecture

```
StartEase/
├── apps/
│   ├── api/            # FastAPI backend service (Python 3.11+)
│   │   ├── app/        # LLM integration (Gemini), RAG vector index, crisis safety & sessions
│   │   ├── tests/      # 22+ automated tests across retrieval, safety, validation & API
│   │   └── Dockerfile  # Production container definition
│   ├── web/            # Next.js 16 + React 19 web application
│   │   ├── src/        # Screens, components, audio synthesis, speech recognition, state
│   │   └── out/        # Pre-rendered static export bundled for desktop
│   └── desktop/        # Electron shell application
│       ├── src/        # Main & preload processes, system tray, window state management
│       └── release/    # Standalone executable & Windows NSIS installer
├── data/
│   ├── knowledge_base.csv # 160 curated academic & professional task-app RAG pairings
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
4. Set up environment variables:
   ```bash
   cp ../../.env.example .env
   ```
   Add your `GEMINI_API_KEY` to `apps/api/.env`:
   ```ini
   GEMINI_API_KEY="your-api-key-here"
   GEMINI_MODEL="gemini-3.5-flash-lite"
   PORT=8000
   ```
5. Start the backend development server:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   Interactive Swagger documentation will be available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

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

4. Create an optimized production static build:
   ```bash
   npm run build
   ```

---

### 3. Desktop Companion (`apps/desktop`)

The desktop app runs as an Electron wrapper with a compact **always-on-top floating mode** (`350x270`), allowing users to keep their tiny step pinned above Word, Canva, or browser windows.

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
- **Prompt Engineering**: The Gemini prompt enforces a hard cap of 20 words per step, prohibits step counters, and mandates calm, judgment-free phrasing.
- **Client-Side Data Storage**: Gentle Log items and user preferences remain strictly local to the user's browser/desktop client (`localStorage`).

---

## 🧪 Testing & Evaluation

### Automated Backend Tests
Run the complete pytest test suite:
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
*Evaluates top-3 retrieval hit rate, exact first-action fidelity, out-of-scope intent handling, and adversarial crisis prompt interception.*

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
