# Copy (all user-facing text)

Calm, short, warm. Plain words. No pressure.

**Never use:** must, should, need to, have to, overdue, behind, late, failed, lazy, just (as in "just do it"), simply, easy (do not tell people it is easy), "you missed", "streak", "points".

Items in [brackets] are filled by the app. Screenshots win for labels they show (see `ui-handoff.md`).

## Welcome
- Heading: StartEase
- Line: One small step at a time.
- Sub-line: Tell me what you need to do. I will pick the tool and give you a tiny first step.
- Button: Start
- Link: How your data is used
- Sign-in buttons: Continue with Google / Continue with email / Continue as Guest, no signup needed
- Sign-in message (Google or email tapped): Sign-in is not available yet. You can continue as a guest. Nothing is lost.

## Task entry
- Heading: What are you stuck on?
- Sub-line: You don't need a perfect plan. Just tell us what you need to do.
- Field label: Describe the messy task
- Field note: No formatting required
- Placeholder: Stuck? Just type your task. We'll help you out.
- Deadline label: Deadline (optional)
- Deadline note: No stress, just helps pace if helpful
- Deadline chips: Skip (no deadline) / Today / Tomorrow / Choose date & time
- Tip box: Overwhelmed by how big it feels? Try typing just the first 30 seconds of the task.
- Prompt: What would you like to start?
- Placeholder: For example, make a poster for a college event
- Hint: Please do not include names or personal details.
- Button: Help me start

## Loading
- Main: Finding a small first step...
- If slow (after 6 seconds): Still working on it. Thank you for waiting.

## Step screen
- Label above the step: Your tiny step
- App line: Use [App name]
- Buttons: **Done** / **Confused** / **Too big** / **Not now**
- Small link: Take a break

## After Confused
- Label: Here it is in simpler words

## After Too big
- Label: Here is a smaller step

## "I can't use this app"
- Link text on step screen: I can't use this app
- Title: No problem.
- Options: I don't have access / I'd rather use something simpler
- Plain-document step (when no other app fits): Open a blank document or take a sheet of paper and write one line about what you want to make.

## Rest (also holds the resume choices)
- Chip: Safe pause point active
- Heading: That's okay. Come back whenever you like.
- Body: Your task is safely saved at your current step: "[step]". You can step away, stretch, drink water, or sleep. No alarms, no penalties.
- Gentle context note (only if a deadline was set): "You set a gentle target for [deadline]. Whenever you are ready, we can focus on the smallest useful step, or you can ask for more time."
- Buttons: Start again / Make the step smaller first / Help me draft a message to ask for more time
- Link: Leave and close app (Progress is saved)
- Footer line: Pacing yourself is productive.

## Continue card (task entry screen)
- Heading: Continue where you left off
- Label: Saved draft
- Status chip: Paused
- Line: Your last step: [step]
- Buttons: Resume task / Start a new task instead

## Task complete
- Heading: You finished this task.
- Body: That took real effort. Well done.
- Buttons: Start a new task

## No good match
- Body: I can't find a good match for that yet. I can help with study and work tasks like writing, design, data, code and planning. Could you say it a different way?
- Button: Try again

## Error or offline
- Body: Something went wrong on my side. Your progress is safe.
- Buttons: Try again / Stop for now

## Crisis response
Use the text in `docs/safety.md`. Do not change it.

## Privacy and data page

**Title:** How your data is used

- What I use: only the task you type, and which button you press. Nothing else.
- What I never do: StartEase does not look at your screen, other apps, window titles or what you type elsewhere. It has no camera or microphone access.
- Where it goes: your task is sent to our server and to Google's Gemini service to write your steps. [FREE TIER ONLY:] While we are testing, Google may use what you send to improve its products, and people at Google may read it. Please do not include names or personal details.
- What is saved: your current step is saved on your device so you can come back. A copy of your steps is kept on our server for [7 days] so you can resume, then deleted.
- Stays on your device only: your deadline, your list of past tasks, your settings and message drafts.
- If you use "Speak instead": your voice is handled by your browser's speech service. Only the text goes to StartEase.
- Your control: you can hide or stop at any time. "Clear my session" deletes your saved data.
- What StartEase is not: it is not a medical or diagnostic tool. It does not tell you how you feel.
- Button: Clear my session

## Floating window
- First-time hint: Drag me anywhere. Tap the small bar to tuck me away.
- Pill label: StartEase
- Tray menu: Show / Hide, Open full window, Opacity, Text size, Quit
- Rest (compact): Rest is a good choice. Progress saved.
- Complete (compact): You finished this task. Well done.

## Step screen: fixed lines (same for every step)
- Label: Your next tiny step
- Reassurance: That's all you need to do right now.
- Milestone box title: Zero expectation milestone
- Milestone box text: Do just this one thing and this step counts as complete.
- Question above buttons: How does this step feel?
- Button hints: Done: Takes you to the next tiny step / Not now: Pause and rest without losing progress
- Footer: Shortcuts: 1 Done, 2 Explain, 3 Smaller, Space Rest. No timers. No guilt.
- Read aloud button: Read aloud

## Navigation and chrome
- Tabs: Focus / Decompose / Gentle Log / Preferences
- Working on chip: Working on: [task]
- Header chip: One tiny step at a time
- Tagline: Calm task initiation
- Footer: StartEase. Designed for cognitive calm and steady focus. / No rush. No pressure.
- Profile menu: Guest / How your data is used / Clear my session

## Focus tab with no task
- Body: Nothing in progress. When you're ready, tell us what you'd like to start.
- Button: Start a task

## Gentle Log
- Heading: Gentle Log
- Sub-line: Tasks you started, kept on this device only.
- Status labels: Finished / Paused
- Empty: Nothing here yet. Tasks you start will appear here.
- Buttons: Resume / Clear log

## Preferences
- Heading: Make StartEase comfortable
- Options: Text size / Calm motion / Read steps aloud / Show shortcuts / Window opacity (desktop only)
- Note: These settings stay on this device.

## Draft a message (fixed templates)
Dropdown title: Help me draft a message to ask for more time. Choose: To a teacher / To a manager / To a teammate. [Name] and [date] are left for the person to fill in. [task] is filled in from what they typed. The Copy button copies the text. Button after copying: Copied.

- **To a teacher:** Hi [Name], I'm working on [task]. I'd like to ask for a little more time so I can do it well. Would [date] be possible? Thank you for understanding.
- **To a manager:** Hi [Name], I'm making progress on [task] and I'd like a little more time to finish it properly. Would [date] work? I'll let you know if anything changes. Thanks.
- **To a teammate:** Hi [Name], I'm still working on [task] and would like a little more time. Could we move it to [date]? Thanks for your patience.
