# Deployment (including the desktop app)

## What gets deployed

| Part | Where it runs | How users get it |
|---|---|---|
| **API** (FastAPI + catalogue + Gemini) | A hosted container | Always on, one HTTPS address, for everyone |
| **Web app** | A static host (Vercel, Netlify or similar) | A link in the browser |
| **Desktop app** (Electron) | The user's Windows or Mac computer | An installer download |

The desktop installer contains Electron and a **bundled copy of the web UI**. When it runs, it talks to the **same hosted API** over HTTPS. The Gemini key lives only on the API server. It is never inside the installer, because anyone can unpack an installer.

```
User's computer                          Cloud
┌──────────────────────────┐            ┌─────────────────────┐
│ StartEase desktop app    │  HTTPS     │ API (container)     │──► Gemini
│  Electron + bundled UI   │ ─────────► │ catalogue + index   │
│  floating window         │            └─────────────────────┘
└──────────────────────────┘            ┌─────────────────────┐
        Browser users ────────────────► │ Web app (static)    │
                                        └─────────────────────┘
```

## Path 1: Hackathon prototype (fastest)

Goal: a working demo with no cost beyond free tiers.

**1. Deploy the API**
1. Build the Docker image for `apps/api` (the 50-row index is built when the container starts, which takes seconds).
2. Deploy it on a free or low-cost container host (Render, Cloud Run, Railway or similar).
3. Set the environment variables from `.env.example`. Set `ALLOWED_ORIGINS` to your web address and `app://startease`.
4. Check `GET /healthz`. Free hosts may sleep when idle, so open the health URL a few minutes before a demo.

**2. Deploy the web app**
1. Set `NEXT_PUBLIC_API_BASE_URL` to the API address.
2. Deploy to Vercel or Netlify. Open the link and finish one task.

**3. Build the desktop installers**
1. Build the web app as a static export.
2. Package with electron-builder. Build **on each target system**: Windows installer on Windows, Mac `.dmg` on a Mac. (GitHub Actions can do both, see below.)
3. Upload the installers to a GitHub Release, or put them on the web app's download link.
4. Install on a clean machine and run one full task before the demo.

**Unsigned installers show warnings.** On Windows, SmartScreen may say the app is unrecognised (choose More info, then Run anyway). On macOS, Gatekeeper may block an app that is not signed and notarized (the user may need to open it from System Settings, Privacy and Security). For a demo on your own laptop this is fine. Tell testers about it in advance.

## Path 2: Production

Do all of Path 1, plus:

| Step | Why |
|---|---|
| **Move Gemini to the paid tier** | The free tier may use user content to improve Google products. Required before real users |
| **Sign the installers** | Windows code-signing certificate. Apple Developer Program, signing and notarization for macOS. Both cost money and take time to set up |
| **Auto-update** | Use `electron-updater` with GitHub Releases. The app checks on launch and installs signed updates |
| **Build in CI** | A tag like `v1.0.0` builds Windows and Mac installers and publishes them |
| **Rate limiting** | The API has no logins, so limit by IP and by session and cap daily Gemini calls |
| **Monitoring** | Error alerts and an uptime check on `/healthz`. Logs must never contain task text |
| **Staging** | A second API and web deployment to test before production |

## electron-builder config (starting point)

```json
{
  "appId": "com.startease.app",
  "productName": "StartEase",
  "files": ["dist/**", "out/**"],
  "win": { "target": "nsis" },
  "mac": { "target": "dmg", "category": "public.app-category.productivity" },
  "publish": [{ "provider": "github" }]
}
```

`out/` is the static web export. Serve it inside Electron through a custom protocol such as `app://startease` rather than `file://`, because exported web pages often break on `file://`. That is why `app://startease` is in `ALLOWED_ORIGINS`.

## CI (GitHub Actions, short version)

```yaml
on:
  push:
    tags: ["v*"]
jobs:
  desktop:
    strategy:
      matrix:
        os: [windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build:web        # static export
      - run: npx electron-builder --publish always
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # signing secrets go here for production
```

## How updates reach people

| Change | How it ships |
|---|---|
| API change (prompts, catalogue, retrieval) | Redeploy the API. Everyone gets it at once. Keep `/v1` stable so older desktop versions keep working |
| UI change | Browser users get it on the next load. Desktop users get it in a new installer (or an auto-update in production) |
| New catalogue rows | Edit the CSV and redeploy the API only. No desktop update needed |

## Release checklist

- [ ] All items in `acceptance-criteria.md` pass
- [ ] `data/eval/` targets pass
- [ ] API deployed and `/healthz` is OK
- [ ] Web app deployed and finishes a full task
- [ ] Desktop installer tested on a clean Windows machine and a clean Mac
- [ ] Floating window stays above Word, Canva and a browser
- [ ] No API key in the web build or the installer
- [ ] Privacy page matches what the app does, including the Gemini notice
- [ ] Crisis text and helpline numbers checked and current
- [ ] Rollback ready: previous API image and previous release available

## Rollback

API: redeploy the previous container image. Web: redeploy the previous build. Desktop: unpublish or mark the bad release as a pre-release so auto-update does not offer it, and keep the last good installer available.

## Not supported in v1

Linux, auto-start with the computer, mobile floating windows. Some fullscreen video or games cannot be covered by any always-on-top window. Point users to the web app in those cases.
