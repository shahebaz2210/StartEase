# StartEase: Product Requirements Document (PRD)

**Product:** StartEase, An Adaptive AI Task Companion
**Track:** LLMs & RAG, The Task Sequencer
**Stage:** Hackathon Round 2 (prototype)
**Status:** Draft v1.1 (adds the desktop floating window and the final 50-row knowledge base)
**Last updated:** 24 October 2026
**Platforms:** Web app (mobile first) and desktop floating window (Windows and macOS, built with Electron)

---

## 1. Overview

StartEase is a mobile-friendly web app, with a desktop floating-window companion, that helps people with executive dysfunction start academic and professional tasks. The user types one task. StartEase chooses the right tool for them and shows a single tiny first action. After that, it shows one step at a time, adapting to the user's feedback. The user never sees how many steps exist or how many remain.

**One-line pitch:** StartEase removes three barriers: deciding which tool to use, facing a task that feels too big, and losing momentum by switching between windows.

### 1.1 How it works (summary)

1. The user enters a task, such as "Create a college event poster."
2. The system retrieves the most relevant entries from a CSV knowledge base using embeddings and a vector database (FAISS or Chroma).
3. The LLM receives the task and the retrieved entries. It recommends one app and generates a sequence of small steps. The sequence is stored by the backend.
4. The UI displays only the first tiny action, such as "Open Canva and search for poster templates." On desktop it appears in a floating window above the app the user is working in.
5. The user responds with **Done**, **Confused**, **Too big** or **Not now**, and StartEase adapts.

### 1.2 Floating window (desktop)

StartEase also ships as a desktop app built with Electron. After the first step appears, the window becomes a small, draggable, always-on-top floating window that stays above applications such as Microsoft Word, Canva and web browsers.

**Why we need it:** our goal is to stop users from getting stuck between task steps. Switching back and forth between StartEase and the working app adds friction and interrupts the workflow, and every switch is a chance to lose momentum. A window that stays in view keeps guidance and help one tap away without leaving the work.

**What it shows:** the current tiny step and the four response buttons.

| Button | What happens in the floating window |
|---|---|
| Done | Marks the current step complete and shows the next step |
| Confused | Explains the current step in simpler words |
| Too big | Replaces the step with a smaller action |
| Not now | Saves progress so the user can resume from the same step later |

**Approach:** the existing React interface and task-generation logic are reused. Electron wraps the web app, and a compact layout is used in float mode. Nothing is rebuilt.

**Core idea:** StartEase stays on top of the user's desktop workflow, giving continuous, accessible guidance without becoming another task to manage.

### 1.3 Frontend-only extras

The approved UI includes a few extras that have no backend: deadline chips, speech input and output, keyboard shortcuts, a local task log, preferences, message drafts and sign-in buttons. They are built in the browser only. They store data on the device, never call the API, and never create reminders or pressure. See `ui-handoff.md`.

---

## 2. Problem Statement

Standard productivity tools assume a neurotypical baseline. They rely on rigid alarms, fixed schedules, long to-do lists and high-pressure reminders. For people with executive dysfunction, these tools often increase shame and task paralysis instead of reducing them.

Three specific barriers appear at the start of, and during, almost every task:

- **Decision overload:** choosing which tool or app to use, and where to begin.
- **Task size:** a task that looks too large to start, so nothing happens.
- **Context switching:** moving between the guidance and the working app interrupts the workflow, and momentum is lost between steps.

### 2.1 Why existing tools fall short

| Existing approach | Why it fails for this user |
|---|---|
| Timers and alarms | Apply pressure on a fixed clock, whatever the user's current capacity |
| To-do lists | Show everything at once, which can feel overwhelming |
| Fixed step plans | Same step size for everyone, no way to adapt |
| Streaks and penalties | Turn a missed day into guilt |

---

## 3. Target Users

### 3.1 Primary users

University students and early-career professionals who experience executive dysfunction, including those with ADHD, autism or similar difficulties. They know what needs to be done but struggle to begin.

### 3.2 User characteristics

- Often overwhelmed by choices, including which app to open
- Can be sensitive to pressure, guilt and judgmental wording
- May have low energy or limited focus at the moment of starting
- Need very low effort to respond to the app itself

### 3.3 Scope of the prototype

The prototype accepts **academic tasks** (for example assignments, reports, exam revision, presentations) and **professional tasks** (for example emails, reports, spreadsheets, meeting prep). Other kinds of input are out of scope. The desktop floating window targets Windows and macOS. The knowledge base is the supplied catalogue of 50 tasks (see section 8.3).

---

## 4. Goals and Non-Goals

### 4.1 Product goals

| # | Goal | Why it matters |
|---|---|---|
| G1 | Help the user start a task with minimal effort | Starting is the core difficulty |
| G2 | Remove tool-choice decisions by recommending one app | Reduces decision overload |
| G3 | Show only one tiny step at a time | Prevents overwhelm and keeps the next action obvious |
| G4 | Adapt step size and clarity based on the user's own feedback | Fits current capacity without guessing the user's state |
| G5 | Make rest and pausing a normal, guilt-free choice | Avoids shame and burnout |
| G6 | Protect privacy and keep the user in control | Responsible, ethical design |
| G7 | Keep guidance visible while the user works, without extra window switching | Prevents getting stuck between steps |

### 4.2 Non-goals (for the prototype)

- Diagnosing or assessing ADHD, autism or any condition
- Scheduling, calendars, reminders, alarms or notifications (a deadline picker exists as a frontend-only convenience, stored on the device, never sent to the server and never used to pressure the user)
- Scores, streaks, points or any penalty-based tracking
- Tasks outside academic and professional work (personal, health, finance)
- Showing the user the full list of steps or a progress count
- Replacing professional or clinical support
- Integrations with third-party apps (the app is only recommended, not launched or controlled)
- Reading, capturing or monitoring other applications, window titles, keystrokes or the user's screen
- Floating overlays on phones or tablets (desktop only)

---

## 5. User Stories

### 5.1 Starting a task

- **US-1:** As a user, I want to type a task in my own words, so that I do not have to structure it first.
- **US-2:** As a user, I want to start without creating an account, so that nothing stands between me and my first step.
- **US-3:** As a user, I want the app to choose the right tool for me, so that I do not have to decide what to open.
- **US-4:** As a user, I want to see one very small first action, so that starting feels easy.

### 5.2 Taking steps

- **US-5:** As a user, I want to see only my current step, so that I do not feel overwhelmed by what is left.
- **US-6:** As a user, I want to tap **Done** when I finish a step, so that I get the next one without typing.
- **US-7:** As a user, I want to tap **Confused** when a step is unclear, so that it gets explained in simpler words.
- **US-8:** As a user, I want to tap **Too big** when a step feels heavy, so that it gets broken into something smaller.
- **US-9:** As a user, I want to see a clear "Task complete" message at the end, so that I know I finished.

### 5.3 Rest and control

- **US-10:** As a user, I want to tap **Not now** without being judged, so that I can stop when I need to.
- **US-11:** As a user, I want my progress saved when I rest, so that I can return to the same step later.
- **US-12:** As a user, I want to resume the same step or make it smaller when I return, so that coming back is easy.
- **US-13:** As a user, I want to say I cannot use the suggested app, so that I am not stuck if I do not have access to it.
- **US-14:** As a user, I want to clear my session at any time, so that I stay in control of my data.

### 5.4 Trust and wellbeing

- **US-15:** As a user, I want calm, non-judgmental wording at every point, so that I never feel lazy or behind.
- **US-16:** As a user, I want to know what is stored and sent, so that I can trust the app.

### 5.5 Working alongside other apps (desktop)

- **US-17:** As a user, I want the current step to stay visible above Word, Canva or my browser, so that I do not have to switch windows to see what to do next.
- **US-18:** As a user, I want to tap Done, Confused, Too big or Not now from the floating window, so that I can get help without leaving my work.
- **US-19:** As a user, I want to drag the window out of the way, and have it remember where I put it, so that it never covers what I am working on.
- **US-20:** As a user, I want to shrink or hide the window in one tap, and bring it back easily, so that I stay in control.
- **US-21:** As a user, I want the window to appear without grabbing my keyboard focus or making sounds, so that it never interrupts me.
- **US-22:** As a user, I want small comforts such as an optional deadline, speaking my task, reading a step aloud, shortcuts, a private log and ready-made messages, so that I can use StartEase in the way that suits me. These stay on my device.

---

## 6. Features

Priority: **P0** = required for the prototype, **P1** = should have, **P2** = later.

| ID | Feature | Description | Stories | Priority |
|---|---|---|---|---|
| F1 | Guest start | Use the app with no account | US-2 | P0 |
| F2 | Task input | Single text field for the task, in plain language | US-1 | P0 |
| F3 | RAG retrieval | Embeds the task and retrieves the top matches from the CSV knowledge base | US-3, US-4 | P0 |
| F4 | App recommendation | The LLM chooses one app for the task, grounded in the retrieved rows | US-3 | P0 |
| F5 | Step sequence generation | The LLM creates an ordered set of small steps, stored by the backend | US-4, US-5 | P0 |
| F6 | One-Step View | Shows only the current step, with no count or list of remaining steps | US-5 | P0 |
| F7 | Four-tap response | Done, Confused, Too big and Not now buttons | US-6 to US-8, US-10 | P0 |
| F8 | Adaptive regeneration | Confused explains the same step; Too big shrinks it; Done advances | US-7, US-8 | P0 |
| F9 | Task complete | Clear ending message and an option to start a new task | US-9 | P0 |
| F10 | Rest and resume | Not now saves progress and shows a rest screen; the user resumes the same step or a smaller one | US-10 to US-12 | P0 |
| F11 | Output validator | Checks that each response is one step, short, calm and in the required format | US-15 | P0 |
| F12 | Out-of-scope handling | A gentle message if the input is not an academic or professional task | US-1 | P0 |
| F13 | Clear session | Deletes saved progress and task text | US-14 | P0 |
| F14 | "I can't use this app" | Offers another suitable tool from the retrieved options, or a plain-document step if none fits | US-13 | P1 |
| F15 | Plain-language privacy note | Short explanation of what is sent and stored | US-16 | P1 |
| F16 | Accessibility pass | Keyboard support, visible focus, readable type, mobile-first layout | US-15 | P1 |
| F17 | Floating window | Small always-on-top window showing the current step and the four buttons above Word, Canva, browsers and other apps | US-17, US-18 | P0 |
| F18 | Draggable, remembers position | The user moves the window anywhere. Its position is saved on the device | US-19 | P0 |
| F19 | Collapse, hide and tray controls | Collapse to a small pill, hide with one tap, and show, hide or quit from the system tray | US-20 | P0 |
| F20 | Full mode and float mode | Welcome, task entry and privacy use a normal window. After the first step the app switches to float mode and the user can expand it at any time | US-17 | P0 |
| F21 | Non-intrusive behaviour | Appears without taking keyboard focus, no sounds or notifications, adjustable opacity | US-21 | P1 |
| F22 | Global shortcut | One keyboard shortcut to show or hide the window | US-20 | P1 |
| F24 | Deadline chips (frontend only) | Optional deadline saved on the device and shown gently on the rest screen. No reminders | US-22 | P1 |
| F25 | Speak instead and Read aloud (frontend only) | Browser speech input and speech output for the step | US-22 | P1 |
| F26 | Keyboard shortcuts (frontend only) | 1, 2, 3 and Space respond to a step while the window has focus | US-22 | P1 |
| F27 | Gentle Log (frontend only) | Local list of past tasks, with resume. No counts or streaks | US-22 | P1 |
| F28 | Preferences (frontend only) | Text size, calm motion, read aloud, shortcuts, window opacity | US-22 | P1 |
| F29 | Message drafts (frontend only) | Fixed templates to ask for more time, with copy | US-22 | P1 |
| F30 | Sign-in buttons and profile menu (interface only) | Visible but not functional. Guest is the real path | US-22 | P2 |
| F23 | Desktop packaging and updates | Signed installers for Windows and macOS with automatic updates | US-17 | P1 |

---

## 7. User Flow

```
Welcome / Guest start
        |
        v
Enter task
        |
        v
Retrieve relevant entries (RAG) --> LLM recommends one app
        |                           and generates the step sequence
        v
Display current step  <-----------------------------+
        |                                            |
        v                                            |
User chooses                                         |
  |-- Done ------> Mark step complete                |
  |                  |-- More steps? Yes -> next step +
  |                  |-- No -> Task complete -> Start new task
  |-- Confused ---> Same step, explained simply -----+
  |-- Too big ----> Smaller step ---------------------+
  '-- Not now ----> Save progress -> Rest -> Resume same step or make it smaller
```

**Rules that apply throughout:**

- The user can stop at any step, and progress is saved.
- Only the user's own taps drive the flow.
- The UI never shows the number of steps or the number remaining.
- On desktop, the welcome and task entry screens use a normal window. After the first step appears, the app switches to the floating window. The user can expand back to the full window or hide the floating window at any time.
- The floating window uses the same four responses and the same rules as the web app.

---

## 8. Functional Requirements

### 8.1 Task input and scope

- **FR-1:** The system shall accept a free-text task of up to a reasonable length (for example 300 characters).
- **FR-2:** If the input is not an academic or professional task, the system shall show one gentle sentence explaining the supported scope and invite the user to try again.
- **FR-3:** The system shall not require login, name or email to start.

### 8.2 Retrieval (RAG)

- **FR-4:** The system shall embed the user's task and retrieve the top 3 most similar entries from the knowledge base. Each catalogue row is embedded as one text built from `task`, `desired_output` and `task_category` (underscores replaced with spaces).
- **FR-5:** The system shall apply a similarity threshold, tuned on the evaluation set. If no entry is similar enough, it shall not force a match. It shall show a gentle message that it cannot find a good match yet and invite the user to rephrase.
- **FR-6:** The knowledge base shall be the 50-row CSV catalogue, loaded and indexed in a FAISS or Chroma vector store at startup. Files are read as UTF-8 and may include a byte-order mark and Windows line endings.

### 8.3 Knowledge base (CSV)

The supplied catalogue (`StartEase_rag_task_app_catalogue.csv`) has **50 rows**, **38 task categories** and **41 distinct apps** (Canva appears most often, then Microsoft Word and Microsoft Excel). It covers academic and professional work such as writing, design, presentations, data, research, software, planning and communication. Every row has a unique task and no empty fields.

| Column | Purpose | Example |
|---|---|---|
| `task_id` | Unique row ID | 13 |
| `task` | Task description (main text that is matched) | Design a college event poster |
| `task_category` | Grouping of the task | visual_design |
| `desired_output` | What the user ends up with | poster |
| `recommended_app` | The one tool to use | Canva |
| `reason` | Why this app fits | Provides ready-made poster templates and simple visual editing. |
| `first_tiny_action` | A very small first action (under 10 words, starts with "Open") | Open Canva and search for poster templates. |

**Record shape used by the retriever:**

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

**What the catalogue does not contain:** an audience column (academic or professional), access or cost notes, a no-app fallback, or steps after the first one. Steps after the first are written by the LLM using the matched row, so they are less tightly grounded than step 1 (see risks).

### 8.4 LLM behaviour

- **FR-7:** The LLM shall recommend exactly one app per task, chosen from the apps in the retrieved entries.
- **FR-8:** The LLM shall identify the best-matching retrieved row and generate an ordered sequence of small steps. Step 1 shall be that row's `first_tiny_action`, enforced by the backend. The LLM writes the steps after it.
- **FR-9:** The LLM shall return structured output (JSON) so the UI always receives a predictable format.
- **FR-10:** Each step shall be one concrete action that can be done in a few minutes, with no jargon.
- **FR-11:** The wording shall be calm and non-judgmental, and shall never imply the user is behind or lazy.
- **FR-12:** On **Confused**, the LLM shall explain the same step in simpler words and shall not advance.
- **FR-13:** On **Too big**, the LLM shall replace the current step with a smaller step toward the same goal.
- **FR-14:** On **Done**, the system shall advance to the next stored step, or show Task complete if there are none.

**Example output format:**

```json
{
  "matched_task_id": 13,
  "app": "Canva",
  "steps": [
    "Open Canva and search for poster templates.",
    "Pick any template you like. You can change it later.",
    "Replace the title with your event name."
  ]
}
```

The backend stores `steps`. The UI receives only the current step.

### 8.5 Display and interaction

- **FR-15:** The UI shall show only the current step and the four response buttons.
- **FR-16:** The UI shall not show a list of steps, a step count, a progress bar or a countdown.
- **FR-17:** The recommended app shall be shown as part of the first step, with no choice required.
- **FR-18:** A user response shall require one tap and no typing.

### 8.6 Rest and resume

- **FR-19:** **Not now** shall save the task, the current step and the completed steps, then show a rest screen with calm wording.
- **FR-20:** On return, the user shall be offered two options: continue the same step, or make it smaller.

### 8.7 Validation

- **FR-21:** Before display, the backend shall check that the output is one step, within a length limit, and in the expected format.
- **FR-22:** If validation fails, the system shall retry once, then show a safe default step.

### 8.8 Session and privacy

- **FR-23:** Session state shall stay on the user's device by default.
- **FR-24:** The user shall be able to clear all saved data at any time.

### 8.9 Floating window (desktop)

- **FR-25:** The desktop app shall use a normal window for the welcome, task entry and privacy screens, and switch to a small always-on-top floating window after the first step is shown.
- **FR-26:** The floating window shall show only the current step, the recommended app name and the four response buttons, using the same components and the same API as the web app.
- **FR-27:** The floating window shall stay above other normal application windows, including Microsoft Word, Canva and web browsers.
- **FR-28:** The window shall be draggable, and its position and mode shall be remembered on the device.
- **FR-29:** The user shall be able to collapse the window to a small pill, hide it, expand it to the full window, and restore it from the system tray.
- **FR-30:** The window shall appear without taking keyboard focus from the app the user is working in, and shall make no sounds and show no notifications.
- **FR-31:** The window shall let the user adjust opacity and text size.
- **FR-32:** Step text shall be limited in length so every step and explanation fits in the compact window without scrolling.
- **FR-33:** The floating window shall never read, capture or monitor other applications, window titles, keystrokes or the screen.
- **FR-34:** Closing or hiding the window shall keep progress saved. Quitting from the tray shall also keep progress saved.
- **FR-35:** Not now in the floating window shall show a compact rest state with the same calm wording as the web app.

### 8.10 LLM provider and quota (Gemini)

- **FR-36:** The task entry screen and the privacy page shall state that the task text is sent to Google's Gemini API. While on the free tier, they shall also say that Google may use it to improve its products and that reviewers may read it, and ask users not to include names or personal details.
- **FR-37:** If the Gemini API returns a rate-limit error (429) or fails, the backend shall retry with a short backoff, then fall back to the matched row's `first_tiny_action` and a calm message. The user shall never see a raw error.
- **FR-38:** The backend shall cache LLM results for repeated identical inputs, and enforce a per-session and daily call limit, so the free-tier quota is not exhausted.

---

## 9. Non-Functional Requirements

| Area | Requirement |
|---|---|
| **Performance** | A step should appear within a few seconds. Show a calm loading state while waiting |
| **Accessibility** | Keyboard navigation, visible focus states, high contrast, large readable type, screen-reader labels |
| **Responsiveness** | Mobile-first layout that also works on desktop |
| **Reliability** | If the LLM or retrieval fails, show a gentle message and a safe default step. Never show a raw error |
| **Security** | The API key stays on the server. No sensitive data in logs |
| **Maintainability** | The knowledge base can be extended by editing the CSV and re-indexing |
| **Desktop platforms** | Windows 10 and 11, and current macOS versions. Linux is not supported in the prototype |
| **Desktop footprint** | Light enough to leave open all day: low idle CPU and modest memory |
| **Window behaviour** | Stays on top of normal windows, does not take focus, works on multiple monitors and common display scaling |

---

## 10. UX Principles

1. **One thing at a time.** One step, four buttons, nothing else competing for attention.
2. **The app decides, the user keeps control.** StartEase makes the tool choice, but the user can always say Confused, Too big or Not now.
3. **No guilt.** No scores, no streaks, no "you missed" messages. Not now is a normal answer.
4. **Low effort to respond.** Taps, not typing.
5. **Honest, not deceptive.** Hidden steps are not a trick. The intro says "I'll give you one small step at a time," and the end shows "Task complete."
6. **Plain, gentle language.** Short sentences, no jargon, no pressure words such as "must", "should" or "overdue".
7. **Stay out of the way.** The floating window is small, movable and easy to hide. It makes no sounds and shows no notifications, so it never becomes another task to manage.

---

## 11. Technical Overview

| Layer | Plan |
|---|---|
| Frontend | React / Next.js, mobile-first |
| Backend | API routes that coordinate retrieval, the LLM call and validation |
| Retrieval | Embeddings plus FAISS or Chroma over the CSV |
| LLM | Gemini API (free tier for the prototype, paid tier before real users), called only from the server, with a structured prompt and JSON output |
| State | Browser state by default. Optional server session store only if the user chooses to resume later |
| Desktop shell | Electron, loading the same React interface in a compact float mode, with packaged installers for Windows and macOS |

**Data flow:** UI → API → retriever → knowledge base → prompt builder and LLM → validator → UI.

---

## 12. Privacy, Ethics and Safety

- **Data used:** only the task the user types and which of the four buttons they tap. These are needed to generate the next step.
- **Other apps stay private:** the floating window sits on top of other apps but never reads them. StartEase does not capture the screen, read window titles or keystrokes, or use accessibility APIs to observe other applications.
- **Consent and control:** guest mode, a plain-language note on what is sent and stored, pause or stop at any step, and a clear-session option.
- **Storage:** step state stays on the device by default. Task text goes to the server only to generate steps. Any server storage is optional, minimal and deletable.
- **LLM provider terms:** the task text is sent to Google's Gemini API to generate steps. On the free tier, Google may use submitted content to improve its products, and human reviewers may read it. The paid tier does not use prompts and responses for that. So the prototype must tell users this plainly, ask them not to enter names or personal details, and move to the paid tier before real users rely on it.
- **No diagnosis:** StartEase does not diagnose or assess ADHD, autism or any condition. It never claims to know how the user feels.
- **Signals are indicators, not proof:** a tap is the user's own request, not a conclusion about their mental state.
- **Safe wording:** the validator blocks judgmental, pressuring or clinical language.
- **Limits:** StartEase is a productivity aid, not a substitute for professional support.

---

## 13. Success Metrics

Targets are for prototype user testing with the target demographic. They are goals to validate, not measured results. Set final numbers once you know your sample size.

### 13.1 Primary metrics (does it help people start?)

| Metric | How to measure | Target |
|---|---|---|
| **Start rate** | Share of testers who reach "Done" on the first step | 80% or higher |
| **Time to first action** | Time from entering the task to tapping Done on step 1 | Under 3 minutes |
| **Task completion rate** | Share of testers who reach Task complete | 60% or higher |

### 13.2 Friction metrics (is it easy enough?)

| Metric | How to measure | Target |
|---|---|---|
| **Taps to respond** | Actions needed per step | 1 |
| **Typing per step** | Characters typed after the initial task | 0 |
| **Confused rate** | Share of steps answered with Confused | Under 20%, and falling after tuning |
| **Too big rate** | Share of steps answered with Too big | Under 20%, and falling after tuning |
| **Response time** | Time for the next step to appear | Within a few seconds |

### 13.3 Experience and empathy metrics

| Metric | How to measure | Target |
|---|---|---|
| **Felt pressured** | Post-test rating, 1 to 5 (lower is better) | Average 2 or lower |
| **Felt judged** | Post-test rating, 1 to 5 (lower is better) | Average 1.5 or lower |
| **Ease of starting** | Post-test rating, "Starting felt easy", 1 to 5 | Average 4 or higher |
| **Would use again** | Yes or no | 70% or higher |
| **Rest felt acceptable** | "Choosing Not now felt okay", 1 to 5 | Average 4 or higher |

### 13.4 Quality metrics (are the AI outputs good?)

| Metric | How to measure | Target |
|---|---|---|
| **One-step compliance** | Share of outputs that contain exactly one step | 100% |
| **App relevance** | Reviewers rate the recommended app as suitable for the task | 90% or higher |
| **Step clarity** | Reviewers rate first steps as concrete and tiny | 90% or higher |
| **Tone check** | Outputs with no judgmental or pressure wording | 100% |
| **Retrieval accuracy** | Retrieved top result is a sensible match for the test task | 85% or higher |
| **Step 1 exactness** | Step 1 equals the matched row's `first_tiny_action` | 100% |
| **Fallback quality** | Out-of-scope or low-match inputs get a gentle, safe response | 100% |

### 13.5 Floating window metrics (desktop)

These are measured in moderated sessions and from the app's own window events only. StartEase must not monitor other apps to measure them.

| Metric | How to measure | Target |
|---|---|---|
| **Switches needed to respond** | Observed in sessions: times the user leaves the working app to answer a step | 0 |
| **Kept floating** | Share of sessions where the window stays in float mode for the whole task rather than being hidden in the first 2 minutes | 80% or higher |
| **Felt unobtrusive** | Post-test rating, "The window did not get in my way", 1 to 5 | Average 4 or higher |
| **Covered my work** | Post-test rating, "The window covered what I needed", 1 to 5 (lower is better) | Average 2 or lower |
| **Hide or collapse used** | Share of testers who found how to hide or collapse without help | 90% or higher |
| **Comparison with web** | Within-subject comparison of the same task in the web app and the floating window: preference and time between finishing a step and starting the next | Floating preferred by most testers |

### 13.6 Evaluation plan

1. Prepare 15 to 20 test tasks: 10 or more that match the CSV, a few that sit between categories, and a few that are out of scope.
2. Run all tasks through the pipeline and score the quality metrics in 13.4.
3. Run usability sessions with a small group from the target demographic, including neurodivergent students. Include both the web app and the floating window, using real working apps such as Word, Canva and a browser.
4. Collect the experience ratings in 13.3 and the behaviour data in 13.1 and 13.2.
5. Adjust prompts and CSV entries, then re-test.

---

## 14. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| The task does not match any CSV row | Poor or irrelevant recommendation | Similarity threshold, category fallback, gentle out-of-scope message |
| The LLM invents an app or step | Misleading guidance | Ground in retrieved rows, validate the output, retry once, then use a safe default |
| The recommended app is not accessible to the user | The user gets stuck | "I can't use this app" option that offers another suitable tool or a plain-document step; consider adding access notes to the catalogue |
| Steps feel generic | Lower trust and usefulness | Invest in high-quality `first_tiny_action` and `reason` text, tune prompts |
| Hidden step count feels deceptive | Loss of trust | Honest intro wording and a clear Task complete ending |
| Judgmental or pressuring wording | Harms the target user | Tone rules in the prompt, validator checks, tone review in testing |
| LLM latency or failure | Breaks the flow | Calm loading state, retry, safe default step |
| Over-reliance on the app | Reduced independence | Keep it a starting aid, state its limits clearly |
| Floating window covers the user's work | Annoyance, user hides the app | Small default size, drag, collapse to a pill, opacity setting, remembered position |
| Window steals focus or distracts | Breaks the workflow it should protect | Show without focus, no sounds or notifications, test with real apps |
| Cannot sit above some apps (exclusive fullscreen video or games, some OS settings) | Guidance disappears | Test the OS matrix, state the limitation, offer the web app as a fallback |
| Always-on-top is mistaken for monitoring | Loss of trust | Say plainly that StartEase never reads other apps, with no screen, title or keystroke access |
| Steps after step 1 are not grounded in the catalogue | Vague or wrong later steps | Pass the matched row's reason and app to the LLM, validate steps, tune prompts, and consider adding next-step hints to the CSV later |
| Desktop installers are blocked or flagged as unsafe | Users cannot install | Code signing on Windows and signing plus notarization on macOS |
| Gemini free tier: content may be used by Google and rate limits are low | Privacy promise broken, or the demo stops mid-session | Disclose it clearly, discourage personal details, cache responses, back off on 429, fall back to catalogue steps, and move to the paid tier before real users |
| Catalogue coverage is limited to 50 tasks | Valid tasks do not match | Similarity threshold, gentle message, log aggregate no-match rate (without task text) and add rows over time |

---

## 15. Assumptions

- Users have a laptop or phone and internet access.
- The 50-row CSV covers the common academic and professional tasks that testers will enter.
- Recommended apps are widely available, and most have a free tier.
- The Gemini API free tier is used for the prototype. Its rate limits are enough for development and small user tests, and prototype testing avoids sensitive or personal information.
- Users who want the floating window run Windows or macOS.
- The supplied 50-row catalogue is the knowledge base for the prototype.

---

## 16. Open Questions

1. How many steps should the LLM generate per task, and should there be a maximum?
2. May the LLM suggest an app that is not in the retrieved rows? Recommended: no, so the app is always one the catalogue supports.
3. What exactly does "Not now" store, and for how long, if server storage is used?
4. What is the final wording for the welcome message, the rest screen and the Task complete message?
5. The team plans to add proxy indicators in the prototype. These need a written specification, and they must follow the ethics principles in section 12 (consent, user control, indicators not proof).
6. Which Gemini model and embedding model exactly (check the current free-tier limits), and when does the project move to the paid tier?
7. Should the app switch to float mode automatically after the first step, or only when the user taps "Keep on top"? Recommended: automatic, with a one-time hint and an easy way to expand.
8. Which always-on-top level should be used on each OS, and how should the window behave over fullscreen apps?
9. Should the catalogue gain an `audience` column, access or cost notes, and next-step hints for later steps?
10. How should a valid work task that is not in the catalogue be handled in the demo?
11. What is the budget and timeline for Windows code signing and macOS notarization?

---

## 17. Glossary

| Term | Meaning |
|---|---|
| **Executive dysfunction** | Difficulty with starting, organising, switching and finishing tasks |
| **Task paralysis** | Being unable to begin a task despite wanting to |
| **RAG** | Retrieval-Augmented Generation. The system retrieves relevant knowledge and gives it to the LLM so its answer is grounded |
| **Embedding** | A numeric representation of text used to find similar entries |
| **Vector database** | A store (such as FAISS or Chroma) that finds entries by similarity |
| **Tiny step** | A single concrete action that takes only a few minutes and little effort |
| **One-Step View** | A screen that shows only the current step |
| **Floating window** | A small, always-on-top window that shows the current step above other applications |
| **Electron** | A framework that packages a web app as a desktop application |
| **Float mode** | The compact, always-on-top layout used after the first step on desktop |
