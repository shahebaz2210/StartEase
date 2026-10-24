# Privacy and security
- Collect only the task text and which button was pressed.
- No accounts, no tracking, no analytics that identify a person.
- Tell users that task text goes to Google's Gemini API (docs/copy.md, privacy page). While on the free tier, say Google may use it.
- "Clear my session" must delete saved data on the device and the server.
- Rate limit by IP and by session. Limit input length to 300 characters. Lock CORS to the allowed origins.
- No secrets in the repo, the web build or the installer.
- Speech input uses the browser's speech service. Say so on the privacy page. Hide it in the desktop app.
- StartEase never reads other apps, window titles, keystrokes or the screen.
