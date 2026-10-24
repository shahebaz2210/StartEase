# StartEase: Start Here

Read this file first. It tells you what to build, in what order, and when you are done.

## The end goal

A person who finds it hard to start a task types one academic or professional task. StartEase picks the right app for them and shows **one tiny step at a time**. They answer with one tap: **Done, Confused, Too big, Not now**. They never see how many steps exist or remain. On desktop, a small **always-on-top floating window** keeps the current step visible above Word, Canva or a browser, so they never have to switch windows to ask for help.

If a stuck person can type a task, get a first step in a few seconds, and keep going without feeling judged, the product works.

## What you are building (and nothing more)

| Part | What | Where |
|---|---|---|
| API | FastAPI service. Retrieves from the 50-row catalogue (RAG), calls Gemini, validates, returns one step | `apps/api` |
| Web app | Next.js UI with every screen in `design/screens`, plus a compact `/float` layout | `apps/web` |
| Desktop app | Electron shell around the same web UI. Full window first, then a small always-on-top floating window | `apps/desktop` |

## Do not build

Working accounts or sign-in, reminders or alarms, scores or streaks, progress bars or step counts, anything that reads other apps or the screen, mobile apps, or backend features not in `docs/prd.md`. The screenshots include some extras (deadline chips, speech, shortcuts, log, preferences, message drafts, sign-in buttons). Build those in the browser only, exactly as `docs/ui-handoff.md` says. If something else seems missing, ask. Do not add it.

## Reading order

1. `docs/prd.md` (what and why). Features marked P0 are required, P1 are nice to have.
2. `docs/plan.md` (how). Follow it, but where it conflicts with this file, this file wins.
3. `docs/prompts.md`, `docs/copy.md`, `docs/safety.md` (exact LLM prompts, exact wording, crisis handling)
4. `docs/openapi.yaml` (the API contract), `docs/acceptance-criteria.md` (how we know each part works)
5. `docs/ui-handoff.md` and `design/screens/` (the screenshots to match)
6. `docs/deployment.md` (how it ships, including the desktop installer)
7. `.agent/rules/` (always-on rules)

## Build order

1. **API.** Load `data/knowledge_base.csv`, build the vector index, implement the endpoints in `openapi.yaml`, Gemini calls with the prompts in `prompts.md`, the validator, and the tests. Pass `data/eval/`.
2. **Web UI.** Build each screen from `design/screens` using the strings in `copy.md`. Run against the real API.
3. **Desktop.** Wrap the web UI in Electron. Add the floating window, pill, tray and saved position.
4. **Ship.** Follow `docs/deployment.md`.

Work one piece at a time. For anything bigger than a single file, post a plan first and wait for approval.

## Non-negotiable rules

- One step on screen. No count, list, progress or "next" preview. The API never returns them.
- The app picks the tool. The user never chooses an app.
- Step 1 is always the matched row's `first_tiny_action`.
- Calm wording, no pressure words (see `copy.md`). All text comes from `copy.md` or the screenshots.
- Frontend-only features never call the API and never create reminders.
- The Gemini key lives only on the server. It is never in the web or desktop app.
- The app never reads other apps, window titles, keystrokes or the screen.
- Never diagnose or label the user.
- Crisis language is never treated as a task (see `safety.md`).

## Done means

Every item in `docs/acceptance-criteria.md` passes, the evaluation files in `data/eval/` pass their targets, and `docs/deployment.md` has been followed to produce a working hosted API, a hosted web app and desktop installers.
