# StartEase: Build Plan (Zero to Production with Google Antigravity)

**Product:** StartEase, An Adaptive AI Task Companion
**Companion doc:** `prd.md` (goals, user stories, features, success metrics)
**Build tool:** Google Antigravity (agent-first IDE with Agent Manager, rules, workflows, skills and a browser subagent)
**Status:** Draft v1.1 (adds the desktop floating window and the final 50-row catalogue)
**Platforms:** Web app and desktop floating window (Windows and macOS)

> **How to read this plan.** Phases 0 to 3, plus Phase 3B (the desktop floating window), produce a working, demo-ready product (the Round 2 prototype). Phases 4 to 7 harden it to production level. If time is short, ship Phases 0 to 3 and 3B, then add Phase 4 testing and Phase 5 deployment as a minimum.

---

## 1. What We Are Building

A mobile-friendly web app, plus a desktop version whose small always-on-top floating window keeps the current step visible above Word, Canva and browsers. The user types one academic or professional task. StartEase retrieves matching entries from a CSV knowledge base (RAG), chooses **one app** for the user, and shows **one tiny step at a time**. The user answers with **Done / Confused / Too big / Not now**. The user never sees how many steps exist or remain.

### 1.1 Decisions this plan locks in

| Decision | Choice | Reason |
|---|---|---|
| Frontend | Next.js (React, TypeScript), Tailwind CSS | Matches the deck, fast to build, strong accessibility tooling |
| Backend | Python FastAPI service | FAISS and Chroma are Python-native, so RAG stays simple and fast |
| Vector store | Chroma (persisted) with FAISS as a drop-in alternative | 50 rows is tiny, either works. Chroma gives metadata filtering for free |
| LLM and embeddings | Behind a provider interface, chosen in Phase 0 | Lets you swap models without touching business logic |
| Session state | Opaque session ID on device. Step sequence held server-side with a short TTL. Resume falls back to regeneration if expired | Keeps the full step list away from the UI and limits what is stored |
| Hosting | Frontend on Vercel (or similar). Backend as a container on Cloud Run or Render | Simple, cheap, easy CI/CD |
| Auth | None (guest only) | Matches the product principle: nothing between the user and the first step |
| Desktop shell | Electron wrapping the existing Next.js interface | Reuses the React UI and the same API. Always-on-top windows are built in |
| Desktop UI delivery | Next.js static export, loaded by Electron from the packaged app | Needs no extra server. The compact float layout is a route in the same codebase |
| Knowledge base | The supplied 50-row catalogue CSV | Task, category, desired output, app, reason and first tiny action are already written |
| LLM | Gemini API behind the provider interface. Free tier for the prototype, paid tier before real users | Free-tier content may be used by Google to improve its products, and reviewers may read it, so the free tier is for prototype testing only, with no sensitive data |

> **Note on the deck.** The deck mentions Next.js API routes. This plan uses a separate FastAPI service because the retrieval library is Python. The user-facing behaviour is identical. Change it back to Next.js API routes only if you prefer a single-language stack, in which case use a hosted vector option instead of local FAISS or Chroma.

### 1.2 Open decisions to resolve in Phase 0

1. Which Gemini model and embedding model (check the current free-tier limits and which models are free), and the date to move to the paid tier.
2. Maximum steps per task the LLM may generate.
3. Whether the LLM may recommend an app that is not in the retrieved rows (recommended: no).
4. Retention period for the server-side step sequence (recommended: 7 days).
5. The proxy-indicator plan the team mentioned. It needs a written spec and must follow the privacy rules in section 12 before it is built.
6. Whether the desktop app switches to float mode automatically after the first step (recommended) or only on request.
7. Always-on-top behaviour per OS, especially over fullscreen apps and on multiple monitors.
8. Budget and timeline for Windows code signing and macOS notarization (needed for trusted installers).
9. Whether to extend the catalogue with an `audience` column, access or cost notes and next-step hints.
10. How a valid work task that is not in the catalogue should behave in the demo.

---

## 2. How We Will Use Antigravity

### 2.1 Operating model

You are the product owner and reviewer. Antigravity agents do the building. Work in small, reviewable units.

| Antigravity capability | How we use it in this project |
|---|---|
| **Agent Manager** | Run parallel agents on independent work: frontend, backend, data and tests |
| **Rules** (`.agent/rules/`) | Always-on guardrails: tone rules, "one step only", no step counts in the UI, accessibility, code style |
| **Workflows** (`.agent/workflows/`) | Reusable commands we trigger by name, such as `/new-endpoint`, `/build-screen`, `/run-evals` |
| **Skills** (`.agent/skills/`) | Task-specific expertise the agent loads automatically, such as writing a tiny step or checking tone |
| **Artifacts** (plans, task lists, walkthroughs, screenshots) | Review what the agent plans and did before accepting changes |
| **Browser subagent** | Open the running app, click through the flow and check it against the design |
| **MCP** (optional) | Connect external tools if needed, for example a design source |

> Antigravity is updated often. Before Phase 0, spend 15 minutes confirming the current settings screens, the terminal-command approval policy and where rules, workflows and skills are configured in your installed version. Everything below assumes the `.agent/` folder convention.

### 2.2 Recommended agent settings

- Use the **Agent-Assisted** mode (the agent asks when approval is needed) while building core logic. Switch to a more autonomous mode only for low-risk work such as styling and tests.
- Set a terminal command **allow list** for safe commands (install, test, lint, build) and require approval for anything that deletes files, changes git history, deploys or touches secrets.
- Keep one agent per concern and one branch per agent. Merge through pull requests.

### 2.3 Design handoff to Antigravity

The UI page designs will be given to Antigravity as the source of truth for the interface. Prepare them so an agent can build from them without guessing.

**What to provide (put it in a `/design` folder in the repo):**

| Item | Format | Purpose |
|---|---|---|
| One image per screen and per state | PNG or exported frames, named like `04-step-default.png` | The visual target for each page |
| Design tokens | `tokens.json` (colours, type scale, spacing, radius, shadows) | Becomes the Tailwind theme |
| Component sheet | Image or notes for buttons, cards, inputs, banners | Reusable components |
| Copy deck | `copy.md` with every string, using the approved calm wording | No agent-invented text |
| Interaction notes | `interactions.md` (what each tap does, animations, loading) | Behaviour that images cannot show |
| Accessibility notes | `a11y.md` (focus order, contrast, labels, reduced motion) | Build requirements |

**Rules for the handoff:**

- Every screen has all its states: default, loading, error, empty and reduced-motion where relevant.
- Provide mobile and desktop versions, mobile first.
- The agent must **match the designs and not redesign them**. Any deviation is listed in the walkthrough artifact for review.
- All wording comes from `copy.md`.
- Floating-window screens are designed at their real pixel size (for example 340 x 260) and in every state, including the collapsed pill and the tray menu.
- Every step and explanation must be shown to fit the compact window without scrolling. Provide the maximum text length the design supports.

### 2.4 Repository layout

```
startease/
├─ .agent/
│  ├─ rules/
│  │  ├─ 00-product-principles.md
│  │  ├─ 01-tone-and-copy.md
│  │  ├─ 02-frontend.md
│  │  ├─ 03-backend-and-llm.md
│  │  ├─ 04-privacy-and-security.md
│  │  └─ 05-desktop-electron.md
│  ├─ workflows/
│  │  ├─ build-screen.md
│  │  ├─ new-endpoint.md
│  │  ├─ run-evals.md
│  │  ├─ release-check.md
│  │  └─ package-desktop.md
│  └─ skills/
│     ├─ write-tiny-step/
│     ├─ tone-check/
│     └─ kb-row-review/
├─ design/            # screens, tokens.json, copy.md, interactions.md, a11y.md
├─ apps/
│  ├─ web/            # Next.js frontend (includes the compact /float layout)
│  ├─ desktop/        # Electron shell (floating window, tray, packaging)
│  └─ api/            # FastAPI backend
├─ data/
│  ├─ knowledge_base.csv
│  └─ eval/           # test tasks and expected results
├─ infra/             # Dockerfiles, CI, deploy config
├─ docs/              # prd.md, plan.md, decisions
└─ README.md
```

---

## 3. Antigravity Setup Files

Create these in Phase 0 so every agent follows the same principles.

### 3.1 `.agent/rules/00-product-principles.md`

```
# StartEase product principles (always apply)
- Show exactly ONE step at a time. Never show a list of steps, a step number,
  a count, a progress bar, or "X left". Do not return these values to the client.
- The app chooses the tool. Never ask the user to pick an app. Offer only an
  optional "I can't use this app" option.
- Four responses only: Done, Confused, Too big, Not now. One tap, no typing.
- No scores, streaks, points, penalties, or "overdue" language anywhere.
- Never diagnose or label the user. Never claim to know how they feel.
- Not now is a normal, guilt-free choice. Rest is a first-class screen.
- Scope: academic and professional tasks only. Out-of-scope input gets one
  gentle sentence, never an error.
- Match /design exactly. List any deviation in the walkthrough.
- The desktop floating window never reads, captures or monitors other apps,
  window titles, keystrokes or the screen. Do not add any code that does.
- The floating window and the web app share the same components and API.
```

### 3.2 `.agent/rules/01-tone-and-copy.md`

```
# Tone and copy
- Short sentences. Plain words. Calm and warm.
- Never use: must, should, need to, overdue, behind, lazy, failed, just (as in "just do it").
- Every string comes from design/copy.md. Do not invent user-facing text.
- Steps are one concrete action that takes a few minutes.
- Confused = same step, simpler words. Too big = smaller step, same goal.
```

### 3.3 `.agent/rules/03-backend-and-llm.md`

```
# Backend and LLM
- LLM output is JSON validated against a schema. Never trust free text.
- Recommend exactly one app, grounded in retrieved rows.
- The API never returns total steps, remaining steps, or step index.
- API keys live in environment variables on the server only.
- Every LLM call has a timeout, one retry, and a safe fallback step.
- Do not log task text or step text in plain form in production.
- Call Gemini only through the provider interface. On a 429 or failure, back off briefly, then fall back to the matched row's first_tiny_action. Cache results and respect the per-session and daily call limits.
```

### 3.4 `.agent/rules/05-desktop-electron.md`

```
# Desktop (Electron)
- contextIsolation: true, nodeIntegration: false, sandbox: true. No exceptions.
- The UI talks to the main process only through a small typed preload API
  (set mode, hide, set opacity). No generic IPC, no remote module.
- Load only the packaged app. Deny navigation and new windows to other origins.
- Show the floating window without taking focus. No sounds, no notifications.
- Float mode is always on top. Full mode is a normal window.
- Persist window position and mode only. Restore only if the position is on a
  visible display, otherwise use the top-right of the primary display.
- Never log task text. Never add screen capture or active-window detection.
- Do not auto-start with the operating system in v1.
```

### 3.5 Workflows (examples)

- **`/build-screen <name>`:** read the matching image in `/design`, read `copy.md` and `interactions.md`, build the screen from existing components, add unit and accessibility tests, run the browser subagent against the screen, post a before and after screenshot artifact and list any deviation.
- **`/new-endpoint <spec>`:** add the route, schema, validation, tests and docs. Update the OpenAPI spec. Confirm the response contains no step count.
- **`/run-evals`:** run the retrieval, LLM-quality and tone evaluations in section 9 and post a results table. Cache LLM responses and run the LLM-quality sets sparingly to protect the free-tier quota.
- **`/release-check`:** run lint, type checks, all tests, accessibility audit, dependency audit and a production build. Post a pass or fail summary.
- **`/package-desktop`:** build the static web export, package the Electron app for the target OS, run the desktop smoke tests, and post the installer details and any signing warnings.

### 3.6 Skills (examples)

- **`write-tiny-step`:** how to write one concrete, few-minute action, with good and bad examples.
- **`tone-check`:** review any user-facing string against the tone rules and list violations.
- **`kb-row-review`:** review a CSV row for a clear first action, a correct app, an honest reason and an access note.

---

## 4. Product Spec the Agents Build From

### 4.1 Pages and states (design handoff checklist)

All pages are mobile first. Every one needs a design, and wording in `copy.md`.

| # | Page / state | Purpose | Key elements |
|---|---|---|---|
| 1 | **Welcome** | Start with no account | Short promise ("One small step at a time"), Start button, link to privacy note |
| 2 | **Task entry** | Enter the task | Single text field, example chips, submit, scope hint, and a short privacy hint (no names or personal details) |
| 3 | **Loading** | Waiting for the step | Calm message and gentle motion (static if reduced motion is on) |
| 4 | **Step (default)** | Core screen | App name and icon, current step text, four buttons, small "Take a break" access |
| 5 | **Step (confused variant)** | Same step, simpler words | Same layout, new explanation text, same buttons |
| 6 | **Step (smaller variant)** | After Too big | Same layout, smaller step text |
| 7 | **"I can't use this app" sheet** | Escape from a bad recommendation | Short options, such as "I don't have access" or "Use a plain document" |
| 8 | **Rest** | After Not now | Calm message, no guilt wording, "I'm ready" and "Stop for now" |
| 9 | **Resume** | On return | Not a separate screen. The Rest screen has "Start again" and "Make the step smaller first". After the app is closed, the "Continue where you left off" card on the task entry screen resumes the same step |
| 10 | **Task complete** | Clear ending | Warm confirmation, "Start a new task" |
| 11 | **Out of scope** | Input not a supported task | One gentle sentence and a retry field |
| 12 | **Error / offline** | Backend or network failure | Calm message, retry, never a raw error |
| 13 | **Privacy and data** | Transparency and control | What is sent and stored, Clear my session button, a plain statement that StartEase never reads other apps, and (while on the free tier) a notice that the task text goes to Google's Gemini API |
| 14 | **Float: step (default)** | Core desktop screen | Drag handle, app name, current step, four buttons, collapse and expand controls |
| 15 | **Float: loading** | Waiting for the next step | Calm message, gentle motion (static if reduced motion is on) |
| 16 | **Float: confused and smaller variants** | Explanation or smaller step | Same compact layout, text that fits without scrolling |
| 17 | **Float: rest** | After Not now | Compact calm message, "I'm ready" and "Hide for now" |
| 18 | **Float: task complete** | Clear ending | Warm confirmation, "Start a new task" and "Open full window" |
| 19 | **Float: collapsed pill** | Tiny, out-of-the-way state | Small draggable chip with one tap to expand |
| 20 | **Float: error / offline** | Failure | Calm message and retry, never a raw error |
| 21 | **Float: first-time hint** | Explain the window once | "Drag me anywhere. Tap the pill to tuck me away." Dismissible, shown once |
| 22 | **Tray menu and window settings** | Control from the system tray | Show or hide, open full window, opacity, text size, quit |

Pages 14 to 22 are desktop-only compact layouts. Pages 1 to 13 also appear in the full desktop window.

### 4.2 Core API contract

All responses omit step totals, remaining counts and indexes.

| Method and path | Request | Response |
|---|---|---|
| `POST /v1/sessions` | `{ "task": string }` | `{ "session_id", "status": "step" \| "out_of_scope", "app": {name, reason}, "step": string }` |
| `POST /v1/sessions/{id}/respond` | `{ "response": "done" \| "confused" \| "too_big" \| "not_now" \| "cant_use_app" }` | `{ "status": "step" \| "rest" \| "complete", "step"?: string, "app"?: {...} }` |
| `POST /v1/sessions/{id}/resume` | `{ "mode": "same" \| "smaller" }` | `{ "status": "step", "step": string }` |
| `DELETE /v1/sessions/{id}` | none | `204` (all data deleted) |
| `GET /healthz` | none | `{ "ok": true }` |

### 4.3 Knowledge base CSV (supplied catalogue)

**File:** `data/knowledge_base.csv` (source: `StartEase_rag_task_app_catalogue.csv`)

The file has **50 rows**, **38 task categories** and **41 distinct apps** (Canva 6 times, Microsoft Word 3, Microsoft Excel 3, the rest once each). Every task is unique and no field is empty. Every `first_tiny_action` is under 10 words and starts with "Open". The file has a byte-order mark and Windows line endings, so read it as `utf-8-sig`.

| Column | Notes |
|---|---|
| `task_id` | Unique row ID, 1 to 50 |
| `task` | Natural-language task description |
| `task_category` | For example `visual_design`, `academic_writing`, `data_analytics` |
| `desired_output` | For example `poster`, `research_paper`, `interactive_dashboard` |
| `recommended_app` | One tool |
| `reason` | Why the tool fits, in one plain sentence |
| `first_tiny_action` | The very first action |

**Record shape:**

```json
{
  "task": "Create a college event poster",
  "task_category": "visual_design",
  "desired_output": "poster",
  "recommended_app": "Canva",
  "reason": "Provides ready-made poster templates and simple visual editing.",
  "first_tiny_action": "Open Canva and search for poster templates."
}
```

**Indexing:** build one text per row from `task`, `desired_output` and `task_category` (underscores replaced with spaces), embed it, and store the full row as metadata. Retrieve the top 3 rows. Do not embed `reason` or `first_tiny_action`, since they would pull queries toward the wording of the answer instead of the task.

**Known gaps (decide in Phase 0):**
- No audience column (academic or professional). Not needed for retrieval, but useful for reporting.
- No access or cost notes, so the app is recommended without knowing whether the user has it.
- No fallback action, so "I can't use this app" is handled by the LLM (section 4.4).
- Only step 1 is curated. Steps after it are written by the LLM, so they carry more risk. Consider adding a `next_steps_hint` column later.
- Each task appears once. Build the evaluation set with paraphrases (section 9.2) to test retrieval on different wording.

### 4.4 LLM contract

**Input to the model:** the user's task, the top 3 retrieved rows (all fields), and the rules in `.agent/rules/`.

**Initial call output (JSON schema):**

```json
{
  "matched_task_id": 13,
  "app": "Canva",
  "steps": ["Open Canva and search for poster templates.", "..."]
}
```

**Rules enforced by prompt and validator:**

- `matched_task_id` is one of the retrieved rows, and `app` is that row's `recommended_app`. The model cannot invent an app.
- **Step 1 is always the matched row's `first_tiny_action`.** The backend overwrites it if the model changes it.
- A bounded number of steps (decide the cap in Phase 0).
- Steps after the first are written by the model using the row's `reason` and the app, each a single action, under a word limit, with no banned words from the tone rules.

**Adaptive calls:**

| Response | Prompt instruction | Result |
|---|---|---|
| Done | None. The backend advances | Next stored step, or complete |
| Confused | "Explain this same step in simpler words. Do not add new actions." | Replacement text for the current step |
| Too big | "Replace this step with one smaller step toward the same goal." | Smaller step inserted ahead of the rest |
| Not now | None. Save and show rest | Rest screen |
| Can't use this app | "Suggest one other app from the apps in the retrieved rows that can do this task, and give a first step for it. If none fits, give a plain-document step." | New first step for another app, or the generic no-app step from `copy.md` |

### 4.5 Validator

Runs on every LLM output before it reaches the user.

- Valid JSON against schema
- One action per step, within the length limit
- No banned words or pressure language
- `matched_task_id` and `app` come from the retrieved rows, and step 1 equals that row's `first_tiny_action`
- No numbering, bullets or "step X of Y" text inside the step

On failure: retry once with a stricter instruction, then show the matched row's `first_tiny_action` as a safe default step.

### 4.6 Frontend-only features

The approved screenshots include features with no backend (deadline chips, Speak instead, Read aloud, keyboard shortcuts, Gentle Log, Preferences, message drafts, sign-in buttons, profile menu). Build them in the browser only, as described in `ui-handoff.md`. They store data in local storage under `startease.*`, never call the API, and never create reminders. Only the final task text is sent to the API. Only 4 screenshots exist, so the other screens are designed by the agent in the same style and approved before building.

---

## 5. Phased Plan

Durations are for a small team working with Antigravity agents in parallel. Treat them as guidance.

### Phase 0: Foundations (1 to 2 days)

**Goal:** everything an agent needs to start building correctly.

| Task | Output |
|---|---|
| Confirm Antigravity version, agent mode and terminal allow list | Settings checklist |
| Decide the open decisions in section 1.2 | `docs/decisions.md` |
| Create the repo and layout from section 2.4 | Empty skeleton |
| Add rules, workflows and skills from section 3 | `.agent/` populated |
| Place the UI designs (web and floating-window states), tokens, copy deck, interaction and accessibility notes | `/design` complete |
| Validate the supplied 50-row catalogue and confirm the open data questions in section 4.3 | `data/knowledge_base.csv` |
| Write the evaluation set (see section 9) | `data/eval/` |
| Set up accounts and secrets (LLM key, hosting, error monitoring) | Secrets in a secure store |

**Exit criteria:** an agent could implement any page from `/design` and any endpoint from section 4.2 without asking a question.

**Prompt to give Antigravity:**
> Read `docs/prd.md`, `docs/plan.md`, `.agent/rules/*` and the `/design` folder. Summarise your understanding and list any missing information, contradictions between the design and the PRD, or ambiguous requirements. Do not write code yet. Produce a plan artifact.

### Phase 1: Backend core and RAG (3 to 4 days)

**Goal:** a working API that turns a task into an app and a step.

Run these as parallel agents:

| Agent | Work |
|---|---|
| **A: Data and retrieval** | Load the CSV (`utf-8-sig`), build the embedding text from `task`, `desired_output` and `task_category`, build and persist the vector index, retrieval of the top 3 with a tuned similarity threshold and a gentle no-match result |
| **B: LLM service** | Provider interface with a Gemini client, prompt templates, structured JSON output and schema parsing, timeout, backoff on 429, response cache, per-session and daily call counter, fallback to the catalogue step |
| **C: Session and API** | FastAPI app, routes from section 4.2, session store with TTL, response shaping that hides counts, error handling |
| **D: Tests** | Unit tests for each module, API tests, early evaluation harness |

**Steps:**
1. Scaffold FastAPI with health check, config loading and structured logging (no task text).
2. Implement indexing as a script and a startup check.
3. Implement retrieval and test it on the evaluation set.
4. Implement the prompts and validator.
5. Implement `POST /v1/sessions` end to end.
6. Implement `respond` for Done, Confused, Too big, Not now and Can't use app.
7. Implement `resume` and `DELETE`.
8. Write OpenAPI docs.

**Exit criteria:** with a REST client, you can complete a whole task through the API. The responses never contain counts. The retrieval and format checks in section 9 pass.

### Phase 2: Frontend from the designs (3 to 5 days)

**Goal:** every page built to the design.

Start before Phase 1 finishes by using a mock API that follows the contract in section 4.2.

| Agent | Work |
|---|---|
| **E: Foundations** | Next.js app, Tailwind theme from `tokens.json`, layout, fonts, base components (button, card, input, sheet, banner), reduced-motion support |
| **F: Core flow** | Welcome, Task entry, Loading, Step (all variants), Task complete |
| **G: Support flow** | Rest, Resume, Can't use this app sheet, Out of scope, Error and offline, Privacy page |
| **H: Tests** | Component tests, accessibility checks, end-to-end flow |

**Use `/build-screen` for each page.** For each one the agent:
1. Reads the matching design image and the copy deck.
2. Builds the page from shared components.
3. Runs the browser subagent to compare the rendered page to the design.
4. Posts screenshots and any deviation for your review.

**Frontend behaviour requirements:**
- Store only the session ID and minimal resume info on the device.
- Never display or infer step counts. No progress bar, no "next" preview.
- One tap per response. Buttons are large, with visible focus states.
- Keyboard works throughout. Screen reader labels on every control.
- Respect reduced motion and text-size settings.
- Graceful handling of slow, failed or offline requests.
- Build components so they also render in the compact float layout (see Phase 3B). Avoid layouts that need scrolling.

**Exit criteria:** every page and state in section 4.1 matches its design, and the mock-API flow runs end to end.

### Phase 3: Integration and prototype demo (2 to 3 days)

**Goal:** the complete working prototype for Round 2.

| Task | Notes |
|---|---|
| Connect the frontend to the real API | Replace the mock |
| Full flow test using the browser subagent | Welcome to Task complete, plus rest and resume |
| Tune prompts and CSV rows against the evaluation set | Biggest quality lever |
| Seed demo tasks that show the strengths | For example poster, report, spreadsheet, email |
| Write a short demo script | Matches the deck's story |
| Fix the top usability issues from an internal test | 3 to 5 people |

**Exit criteria:** a stranger can open the link, complete a task and use Not now without help. Prototype success metrics from `prd.md` section 13 can be measured.

### Phase 3B: Desktop floating window with Electron (3 to 5 days)

**Goal:** turn the web app into a desktop app whose small always-on-top window keeps the current step in view while the user works in Word, Canva, a browser or any other normal app.

**Principle:** reuse the existing React interface and task logic. Do not rebuild. The compact float layout is one more route in the same Next.js app.

**Structure:**

```
apps/desktop/
  main.ts       # app lifecycle, windows, tray, shortcut, saved position
  preload.ts    # tiny typed API exposed to the UI
  windows.ts    # settings for full, float and pill modes
apps/web/       # same UI. The /float route is the compact layout
```

**Window modes (sizes are starting points, the designs set the final sizes):**

| Mode | Approx. size | Always on top | Frame |
|---|---|---|---|
| Full | 480 x 720 | No | Normal window |
| Float | 340 x 260 | Yes | Frameless, with a drag handle |
| Pill | 160 x 48 | Yes | Frameless, tap to expand |

**Starting configuration (verify on each OS):**

```ts
const win = new BrowserWindow({
  width: 340, height: 260,
  frame: false, resizable: false, show: false,
  acceptFirstMouse: true,            // first click on macOS presses the button
  webPreferences: {
    preload, contextIsolation: true, nodeIntegration: false, sandbox: true,
  },
});
win.setAlwaysOnTop(true, 'floating');           // try 'screen-saver' if needed
win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }); // macOS
win.once('ready-to-show', () => win.showInactive()); // do not steal focus
```

In the UI, mark the drag handle with `-webkit-app-region: drag` and every button and control inside it with `no-drag`.

**Parallel agents:**

| Agent | Work |
|---|---|
| **I: Electron shell** | Main process, window modes, mode switching, tray menu, optional global shortcut, saved position and mode, security settings from `05-desktop-electron.md` |
| **J: Compact UI** | `/float` layout, pill, compact rest and complete states, one-time hint, text-fit rules, opacity and text-size controls |
| **K: Packaging** | electron-builder config, icons, installers for Windows and macOS, signing placeholders, update channel |
| **L: Tests** | Playwright for Electron: launch, mode switch, the four buttons, position persistence, hide and restore. Manual OS matrix checklist |

**Steps:**
1. Add a static export build for the web app and load it from the packaged Electron app. Allow the packaged app's origin in the API's CORS list (a custom protocol such as `app://` is cleaner than `file://`).
2. Create the full-mode window for welcome, task entry and privacy.
3. After the first step is received, switch to float mode through the preload API and show the one-time hint.
4. Build the `/float` compact layout from existing components. Cap step and explanation length so they fit without scrolling.
5. Add the pill, expand and hide controls, the tray menu (show or hide, open full window, opacity, text size, quit) and the saved position.
6. Restore the saved position only if it is on a visible display. Otherwise place the window at the top-right of the primary display.
7. Add an optional global shortcut to show or hide the window.
8. Harden security: deny navigation and new windows to other origins, set a content security policy, allow only the API origin for network calls, never log task text.
9. Confirm there is no screen capture, window-title reading, keystroke capture or accessibility-API observation anywhere in the code.
10. Package for Windows and macOS and run the smoke tests.

**Behaviour rules:**
- The window appears without taking keyboard focus, and plays no sounds or notifications.
- Clicking a button must work on the first click, even when another app has focus.
- The window can take focus when the user clicks it, and keyboard navigation works inside it.
- Progress is saved when the window is hidden, collapsed or quit.
- No auto-start with the operating system in v1.
- Some content cannot be covered (exclusive fullscreen video or games, some OS-protected windows). Document this and point users to the web app in those cases.

**Exit criteria:** on Windows and macOS, the floating window stays above Word, Canva (app and web) and Chrome, can be dragged, collapsed, hidden and restored, keeps progress, and completes a whole task with the same results as the web app.

**Prompt to give Antigravity:**
> Read `docs/prd.md` (section 1.2 and 8.9), `docs/plan.md` (Phase 3B), `.agent/rules/05-desktop-electron.md` and the floating-window screens in `/design`. Produce a plan artifact first: file list, window modes, IPC surface, and a list of OS-specific risks. Do not add any code that reads other apps, window titles, keystrokes or the screen. After building, run the browser or desktop checks and post screenshots of every float state next to the designs.

### Phase 4: Quality, safety and accessibility (3 to 4 days)

See section 9 for the full test plan.

| Area | Work |
|---|---|
| **Retrieval quality** | Expand the evaluation set, fix weak rows, add paraphrases |
| **LLM safety** | Adversarial inputs: harmful requests, personal-crisis language, prompt injection in the task text, off-topic requests |
| **Tone** | Automated tone check on all outputs, plus human review of a sample |
| **Accessibility** | Automated audit plus manual keyboard and screen-reader pass |
| **Usability testing** | Sessions with the target group, including neurodivergent students, using the metrics in `prd.md` |
| **Desktop behaviour** | Manual matrix on Windows 10 and 11 and current macOS: over Word, Canva (app and web), Chrome, Edge, Safari, a PDF viewer and a video call app. Also check fullscreen apps, multiple monitors, display scaling, sleep and wake, and focus behaviour |

**Critical safety behaviour:** if a user's text suggests a crisis or self-harm instead of a task, StartEase must not treat it as a task. It should respond with a short, kind message and point to appropriate support resources. Decide the exact wording and resources with care before launch, and test it.

**Exit criteria:** all required checks in section 9 pass, and no blocking accessibility or safety issues remain.

### Phase 5: Production readiness (3 to 4 days)

| Area | Work |
|---|---|
| **Containerisation** | Dockerfile for the API (index built at image build or on first start), production build for the web app |
| **CI/CD** | Pipeline running lint, type checks, tests and evaluations on every pull request, and deploying on merge to main |
| **Environments** | Development, staging and production, each with separate keys and config |
| **Secrets** | Stored in the host's secret manager. Nothing in the repo |
| **Security** | CORS locked to the web origin, rate limiting per IP and session, request size limits, input length limits, security headers, dependency scanning |
| **Resilience** | LLM timeout, retry, circuit breaker and safe fallback step |
| **Observability** | Structured logs with no task text, error monitoring, uptime check, dashboards for latency, error rate, fallback rate and validation failure rate |
| **Cost control** | Move from the Gemini free tier to the paid tier before real users, per-session and daily LLM call limits, caching for repeated tasks, budget alerts |
| **Data lifecycle** | TTL cleanup of sessions, working `DELETE`, documented retention |
| **Desktop packaging** | Installers with electron-builder, Windows code signing, macOS signing and notarization, a beta update channel, signed updates, crash reporting with no task text |

**Exit criteria:** a staging deployment passes the full test suite and the `/release-check` workflow.

### Phase 6: Launch (1 to 2 days)

1. Final regression run on staging.
2. Review the privacy page and the in-app wording once more.
3. Deploy to production with a feature flag or limited audience first. Publish the desktop installers to a beta channel first.
4. Smoke test with the browser subagent against production.
5. Monitor errors, latency and fallback rate for the first days.
6. Prepare a rollback: redeploy the previous container and web build.

### Phase 7: Learn and improve (ongoing)

- Review the usage metrics from `prd.md` section 13 (start rate, time to first action, Confused and Too big rates).
- Treat a high Confused rate on a task type as a signal to rewrite that CSV row or prompt.
- Add new CSV rows for tasks users enter often that match poorly. Collect only what users agree to share.
- Possible later features: more task types, saved preferences, optional accounts, multiple languages. These are out of scope for the prototype and production v1.

---

## 6. Parallel Work Map (Agent Manager)

```
Week 0   Phase 0  ──────────►
Week 1            Phase 1 (A, B, C, D in parallel)
                  Phase 2 (E, F, G, H in parallel, using a mock API)
Week 2            Phase 3 integration ──► Phase 3B desktop floating window ──► Phase 4 quality
Week 3            Phase 5 production readiness ──► Phase 6 launch
```

**Rules for parallel agents:**
- One branch and one pull request per agent.
- Agents work against the **contract in section 4.2**, not each other's code.
- You review artifacts (plans, task lists, screenshots, walkthroughs) before approving merges.
- Merge in this order to avoid conflicts: shared config and tokens, backend core, frontend foundations, then pages.

---

## 7. How to Prompt Antigravity Effectively

**Good prompts are small, specific and tied to a file or contract.**

| Instead of | Say |
|---|---|
| "Build the app" | "Implement `POST /v1/sessions` per `docs/plan.md` section 4.2. Use the retrieval module. Return no step counts. Add tests." |
| "Make the step screen" | "Run `/build-screen 04-step-default`. Match `design/04-step-default.png`. Use strings from `copy.md`. Show a before and after screenshot." |
| "Improve quality" | "Run `/run-evals`. Show the five worst retrieval failures and propose CSV row changes. Do not edit yet." |
| "Add the floating window" | "Follow Phase 3B. Plan first. Reuse the existing components. Do not add anything that reads other apps. Show screenshots of every float state." |

**Habits that help:**
- Ask for a **plan artifact first** on anything bigger than one file.
- Ask the agent to **state what it will not do**, to catch scope creep.
- After each task, ask for a **walkthrough artifact** with changed files, tests run and known gaps.
- Use the **browser subagent** to verify UI work, not just unit tests.
- Keep rules short. If an agent repeatedly breaks a principle, add or sharpen the rule.

---

## 8. Frontend Detail

### 8.1 Architecture

- Next.js App Router, TypeScript, Tailwind configured from `tokens.json`.
- A small client state machine with these states: `welcome → entering → loading → step → (confused | smaller) → rest → resume → complete → error`.
- A typed API client generated from the OpenAPI spec.
- Session ID in local storage. No task text stored on the device beyond what resume needs.

### 8.2 State machine rules

| From | Event | To |
|---|---|---|
| welcome | Start | entering |
| entering | Submit task | loading |
| loading | Step received | step |
| loading | Out-of-scope received | out of scope |
| step | Done | loading, then step or complete |
| step | Confused | loading, then step (explained) |
| step | Too big | loading, then step (smaller) |
| step | Not now | rest |
| step | Can't use this app | loading, then step |
| rest | I'm ready | resume |
| resume | Same step or Smaller | step |
| any | Network error | error (retry returns to the previous state) |

### 8.3 Accessibility checklist

- Contrast meets WCAG AA at minimum
- Every control reachable and operable by keyboard, with visible focus
- Labels and live-region announcements for step changes and loading
- Touch targets large enough for easy tapping
- Respects `prefers-reduced-motion` and browser text scaling
- No time limits, no flashing, no auto-advancing content

### 8.4 Floating (compact) layout

- A route in the same app, such as `/float`, uses the same components and state machine as the web app.
- It shows the app name, the current step, the four buttons, and small controls for collapse, expand and hide.
- Step and explanation text has a maximum length so nothing scrolls. If the model returns longer text, the validator shortens or regenerates it.
- Large tap targets, visible focus, and no motion when reduced motion is on.
- Float mode never shows a step count, list or progress indicator.

---

## 9. Testing and Evaluation Plan

### 9.1 Automated tests

| Layer | What | Tool examples |
|---|---|---|
| Unit | Retrieval, validator, prompt builders, state machine | pytest, Vitest |
| API | Every route, error paths, **assert no counts in responses** | pytest with test client |
| Component | Each page and state | React Testing Library |
| End-to-end | Full flow, rest and resume, out of scope, error states | Playwright, plus the Antigravity browser subagent |
| Accessibility | Automated audit on every page | axe-core |
| Visual | Screens match designs within a tolerance | Playwright screenshots |
| Security | Dependency audit, input fuzzing, prompt-injection cases | Audit tools, custom tests |
| Desktop | App launches, mode switching, always-on-top flag, the four buttons, saved position, hide and restore, preload API limits | Playwright for Electron, plus the manual OS matrix in Phase 4 |

### 9.2 Evaluation sets (`data/eval/`)

| Set | Size | Checks |
|---|---|---|
| **Retrieval set** | At least 1 paraphrase for each of the 50 catalogue rows (50 or more inputs), plus a few ambiguous ones | The expected row appears in the top 3 (target 85% or higher, per the PRD). Step 1 equals that row's `first_tiny_action` |
| **Out-of-scope set** | 10 to 15 inputs (personal, medical, nonsense, empty) and a few valid work tasks that are not in the catalogue | All get a gentle message, none get a forced match |
| **Adversarial set** | 10 to 15 inputs (prompt injection, requests to ignore rules, crisis language) | Rules hold, crisis handling works |
| **LLM quality set** | 20 tasks | One app, one step, tiny, calm, correct format (100% compliance on format and tone) |

### 9.3 Quality gates (must pass to merge or deploy)

- All tests pass and the build succeeds
- Retrieval top-3 hit rate meets the target
- 100% format and tone compliance on the LLM quality set
- No API response contains step counts or indexes
- No critical accessibility violations
- Desktop smoke tests pass on Windows and macOS
- p95 time to show a step is within the latency budget in section 10

---

## 10. Non-Functional Targets

| Area | Target |
|---|---|
| Time to show a step | p95 within about 4 seconds, with a calm loading state |
| Availability | Hosting default, with a graceful degraded mode if the LLM is down (safe fallback steps from the CSV) |
| Error handling | No raw errors shown to users |
| Cost | Per-session LLM call cap, daily budget alert |
| Browser support | Current versions of Chrome, Safari, Firefox and Edge, on desktop and mobile |
| Desktop app | Windows 10 and 11 and current macOS. Low idle CPU and memory. Window never takes focus unprompted |
| Data retention | Server sequence deleted after the TTL, or immediately on request |

---

## 11. Production Architecture

```
 User device
   Browser: Next.js app          Desktop: Electron shell + same UI
   (full window)                 (full mode, and always-on-top float mode)
   └── session ID, minimal resume info, window position and mode (desktop only)
        │  HTTPS
        ▼
 Edge / CDN (static assets, security headers)
        │
        ▼
 FastAPI service (container)
   ├─ Rate limiting, input validation
   ├─ Retriever ──► Chroma/FAISS index (built from the CSV)
   ├─ Prompt builder ──► LLM provider (server-side key)
   ├─ Output validator ──► safe fallback from CSV
   └─ Session store (Redis or similar, with TTL)
        │
        ▼
 Observability: logs (no task text), errors, metrics, alerts
```

**Where data lives:**
- **On the device:** session ID, minimal resume info, and on desktop the window position and mode.
- **On the server:** task text and step sequence only for the session TTL, and only to generate steps.
- **Sent to the LLM provider (Google Gemini API):** the task, retrieved rows and the user's response type. On the free tier, Google may use this content to improve its products and human reviewers may read it. On the paid tier it is not used for that. Use the free tier for prototype testing only, and switch to the paid tier before real users.

---

## 12. Privacy, Ethics and Safety Requirements

- Collect only the task text and the four response types (plus Can't use this app).
- The floating window sits on top of other apps but never reads them: no screen capture, no window titles, no keystrokes, no accessibility-API observation. State this on the privacy page and keep it true in code review and tests.
- Free-tier disclosure: while on the Gemini free tier, tell users on the task entry screen and the privacy page that their task text goes to Google and may be used to improve its products. Ask them not to enter names or personal details. Do not run usability sessions with real personal or sensitive tasks until the paid tier is on.
- Desktop security: sandboxed renderer, context isolation, a minimal preload API, a content security policy, signed installers and signed updates.
- No accounts, no tracking cookies, no analytics that profile individuals. Use aggregate, anonymous metrics only.
- A plain-language privacy page and a working "Clear my session" control.
- Never diagnose or label the user. Never claim to know how they feel. A tap is the user's own request, treated as a possible indicator, not proof.
- No judgmental or pressure language, enforced by the rules, prompt, validator and tests.
- Crisis-language handling with a kind, short response and appropriate resources.
- If the team adds proxy indicators, write the spec first. It must have explicit opt-in consent, local processing where possible, user control to switch it off, and must never override or contradict what the user says.
- StartEase is a productivity aid, not a medical or clinical tool. State this clearly.

---

## 13. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Agents drift from the designs | `/build-screen` workflow, screenshot comparison, deviation list in every walkthrough |
| Agents break a principle (for example add a progress bar) | Short, strict rules in `.agent/rules/`, API test that asserts no counts, review checklist |
| Weak retrieval on unusual wording | Paraphrase rows, evaluation set, similarity threshold with fallback |
| LLM invents apps or steps | Ground in retrieved rows, validator, retry, CSV fallback |
| Latency from the LLM | Loading state, timeout, prefetch the next step only on the server, cache common tasks |
| Cost spikes | Per-session caps, daily budget alerts, caching |
| Prompt injection in the task text | Treat the task as data, strict output schema, adversarial tests |
| Privacy mistakes (task text in logs) | Logging rule, tests that scan logs, review in `/release-check` |
| Antigravity behaviour changes between versions | Re-check settings in Phase 0, keep rules and workflows as plain files so they are portable |
| Scope creep | PRD non-goals, a "not now" backlog for new ideas |
| Floating window covers the user's work or steals focus | Small default size, drag, collapse to a pill, opacity, show without focus, test with real apps |
| Always-on-top behaves differently per OS | Test matrix, per-OS window level settings, fall back to the web app and document limits |
| Always-on-top is mistaken for monitoring | Plain privacy statement, no code that reads other apps, review check in `/release-check` |
| Installers flagged as untrusted | Code signing and notarization, beta channel first |
| Steps after step 1 are not grounded in the catalogue | Pass the matched row's reason and app, validate steps, tune prompts, consider a `next_steps_hint` column |
| Gemini free tier: content may be used by Google, and rate limits are low | Disclose it, discourage personal details, cache, back off on 429, fall back to catalogue steps, run evals sparingly, and move to the paid tier before real users |
| Catalogue covers only 50 tasks | Similarity threshold, gentle no-match message, aggregate no-match rate (no task text), add rows over time |

---

## 14. Definition of Done

**For a page:** matches its design in all states, uses only strings from `copy.md`, passes accessibility checks, has tests, and is verified by the browser subagent.

**For an endpoint:** has a schema, validation, error handling, tests and OpenAPI docs, and its response contains no step counts or indexes.

**For a release:** passes `/release-check`, the evaluation gates in section 9.3, and has been verified on staging.

**For the desktop app:** the floating window stays on top of Word, Canva and a browser on Windows and macOS, can be dragged, collapsed, hidden and restored, never takes focus when shown, keeps progress, reads nothing from other apps, and ships as a signed installer.

---

## 15. Phase 0 Checklist (Start Here)

- [ ] Confirm Antigravity version, agent mode and terminal allow list
- [ ] Choose the LLM provider, model and embedding model
- [ ] Decide max steps per task and the session TTL
- [ ] Create the repo and the folder layout
- [ ] Add all `.agent/` rules, workflows and skills
- [ ] Add `/design`: screens (all states), `tokens.json`, `copy.md`, `interactions.md`, `a11y.md`
- [ ] Finalise `knowledge_base.csv` with the columns in section 4.3
- [ ] Write the four evaluation sets
- [ ] Write the proxy-indicator spec, or decide to defer it
- [ ] Set up secrets, hosting accounts and monitoring
- [ ] Give Antigravity the Phase 0 prompt and review its plan artifact
- [ ] Provide floating-window designs at real size in every state (step, loading, variants, rest, complete, pill, error, first-time hint, tray menu)
- [ ] Add `05-desktop-electron.md` and the `/package-desktop` workflow
- [ ] Decide float-mode switching, always-on-top levels and code-signing budget
- [ ] Load the supplied catalogue as `data/knowledge_base.csv` and write paraphrases for the retrieval evaluation set
