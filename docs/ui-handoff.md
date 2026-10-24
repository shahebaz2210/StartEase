# UI Handoff (screenshots)

The screenshots in `design/screens/` are the visual source of truth for the screens they show. Match them. The product name in them says "Tiny Start". **The name is now StartEase. Replace it everywhere.**

## Screenshots we have

| File | Screen | Notes |
|---|---|---|
| `01-welcome.png` | Welcome | Google, email and Guest buttons |
| `02-task-entry.png` | Task entry ("Decompose" tab) | Also shows the "Continue where you left off" card |
| `04-step.png` | Step (main "Focus" screen) | Four buttons, shortcuts footer |
| `08-rest.png` | Rest (also holds the resume choices) | Start again, make smaller, draft a message, leave |

## Screens we do NOT have (design them yourself)

Build these in the same style (colours, fonts, corner radius, spacing, tone) as the four screenshots. **Post a quick preview of each for approval before building it.** Use text from `docs/copy.md`.

| Screen | Notes |
|---|---|
| Loading | Calm message, gentle motion (none if reduced motion is on) |
| Step variants | After Confused ("Here it is in simpler words") and after Too big ("Here is a smaller step"). Same layout as `04-step.png` |
| "I can't use this app" sheet | Small sheet or dialog from the step screen |
| Task complete | Warm ending and a "Start a new task" button |
| No good match | Gentle message and a "Try again" button |
| Crisis response | Fixed text from `docs/safety.md`, a "Back to StartEase" button only |
| Error or offline | Calm message and a retry button |
| Privacy and data | Text from `docs/copy.md` and a "Clear my session" button |
| Gentle Log | See below |
| Preferences | See below |
| Focus tab with no task | Short empty state with a "Start a task" button |
| Profile menu | Small menu from the avatar |
| **Floating window** | Compact (about 340 x 260). Step, app name, four buttons, collapse, hide. States: step, loading, variant, rest, complete, error, collapsed pill, first-time hint |
| Tray menu and window settings | Show or hide, open full window, opacity, text size, quit |

## Changes you must make to the screenshots

| In the screenshot | Do this |
|---|---|
| "Tiny Start" | Use "StartEase" |
| Step dots, "Step 1", "1 of ~4 steps", and any "Step N" text (including "Start again (Resume Step 1)", "saved at Step 1" and "Your last step (Step 3...)") | **Remove them.** The user never sees how many steps exist or remain. Use "Start again" and "your current step" wording from `copy.md`. If the team wants step counts back, the API and the product rules must change first. Ask before changing it |
| Long reassurance paragraph and "Zero expectation milestone" text under the step | Keep the boxes, but use the fixed text in `copy.md`. They are the same for every step. The API only returns one short step |
| Separate Resume screen | There is none. The Rest screen holds "Start again" and "Make the step smaller first". After the app is closed, the "Continue where you left off" card on the task entry screen resumes the same step |

## Frontend-only features (in the screenshots, not in the backend)

These appear in the design but have no backend. Build the interface and the behaviour below **in the browser only**. They must never call the API. Store their data in the browser's local storage under keys starting with `startease.`. They never create reminders, alarms, notifications or countdowns.

| Feature | Behaviour |
|---|---|
| **Deadline chips** (Skip, Today, Tomorrow, Choose date & time) | Saved with the task on this device. Shown in the "Gentle context note" on the Rest screen. Not sent to the API. Not used for any reminder, timer or pressure. If none is set, hide the note |
| **Speak instead** (microphone) | Fills the text box using the browser's speech recognition, only where supported. Hide it where it is not supported, and in the desktop app. Only the final text goes to the API. The privacy page must say voice is handled by the browser's speech service |
| **Read aloud** | Reads the current step using the browser's speech synthesis. Hide it if no voice is available |
| **Keyboard shortcuts** 1 Done, 2 Explain (Confused), 3 Smaller (Too big), Space Rest | Work only while the StartEase window has focus, never globally. Space must not fire while a button or text box is focused. Hide the shortcuts footer in the floating window |
| **"Working on" chip** | Shows the task the user typed (shortened if long) |
| **Nav tabs** Focus, Decompose, Gentle Log, Preferences | Focus = current step (or empty state). Decompose = task entry |
| **Gentle Log** | A list of past tasks kept on this device: task, date, "Finished" or "Paused", and the last step. Paused tasks can be resumed. A "Clear log" button. No counts, totals, scores or streaks |
| **Preferences** | Text size, calm motion (less animation), read aloud on or off, show shortcuts on or off, and window opacity (desktop only). Saved on this device |
| **Profile avatar menu** | Shows "Guest", "How your data is used" and "Clear my session". There are no accounts |
| **Google and email buttons** on Welcome | Interface only. Tapping one shows the "sign-in not available" message from `copy.md` and keeps the user on the Welcome screen. Do not collect emails and do not call any sign-in service. "Continue as Guest" is the real path |
| **"Help me draft a message to ask for more time"** | A dropdown with three fixed templates (teacher, manager, teammate). The task name is filled in on the device. A "Copy" button copies the text. No AI and no API call |
| **Tip box** on task entry, and other fixed hint text | Fixed text from `copy.md` |

## How to build it

1. Look at the four screenshots and write `design/tokens.json` (colours, fonts, sizes, spacing, corner radius). Post it for review.
2. Build shared components first (button, card, chip, text area, sheet, nav bar), then each screen.
3. Use the screenshot text for labels it shows. Use `docs/copy.md` for everything else. Where they differ, use the screenshot, except for the changes listed above, and list the difference.
4. Check every screen in the browser against its screenshot. Post side-by-side images and list any difference.
5. Floating-window screens are compact. Every step and explanation must fit without scrolling.

## Accessibility (minimum)

Keyboard works everywhere with a visible focus. Text is readable (good contrast). Buttons are large. No flashing. Respect reduced motion and the Preferences settings.
