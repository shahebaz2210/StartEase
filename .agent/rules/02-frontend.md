# Frontend
- Next.js, TypeScript, Tailwind. Theme values come from design/tokens.json (made from the screenshots).
- One client state machine: welcome, entering, loading, step, rest, resume, complete, no_match, crisis, error.
- Store only the session ID, the task and current step text (for resume), and on desktop the window position and mode.
- Keyboard works everywhere with a visible focus. Large buttons. Respect reduced motion.
- Build components so they also work in the compact /float layout (about 340 x 260, no scrolling).
- Never show or compute a step count. Remove step dots and "Step N" text from the screenshots.
- Frontend-only features (see docs/ui-handoff.md) use local storage keys starting with startease. and never call the API. No reminders, alarms or notifications.
- The product name is StartEase. The screenshots say Tiny Start. Replace it.
