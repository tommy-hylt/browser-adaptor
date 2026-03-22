# BrowserAdaptor — Runbook

Last updated: 2026-02-18

This runbook is written for day-to-day operation and “what to do when it breaks”.

## Quick start

### 1) Start server
```bat
cd /d "C:\Users\User\Desktop\260207 BrowserAdaptor\browser-adaptor\server"
npm i
npm start
```
Expected:
- HTTP: `http://127.0.0.1:8789`
- WS: `ws://127.0.0.1:8789/ws`

### 2) Load extension
- `chrome://extensions`
- Developer mode ON
- Load unpacked → `...\browser-adaptor\extension`

### 3) Prepare + health check (CLI)
```bat
cd /d "C:\Users\User\Desktop\260207 BrowserAdaptor\browser-adaptor\cli"

:: REQUIRED first
node scripts\prepare.js

:: sanity
node scripts\health.js
```

## Operator checklist (before running automation)
- Server running and reachable on 127.0.0.1:8789
- Chrome open
- Extension loaded and allowed (MV3)
- Run `prepare.js` once per session (it should ensure Chrome + extension handshake)

## Common tasks

### Get current URL
```bat
node scripts\url.js
```

### Navigate
```bat
node scripts\navigate.js https://example.com
```

### New tab
```bat
node scripts\new-tab.js https://github.com/
```

### Read content
```bat
node scripts\text.js
node scripts\html.js
node scripts\ax-tree.js
```

### Tabs / bookmarks
```bat
node scripts\tabs-list.js
node scripts\bookmarks.js
node scripts\bookmarks.js --all
```

## Operational debugging

### Symptom: “connected:false” / no extension connected
Actions (in order):
1) Ensure server is running (restart server if needed)
2) Ensure Chrome is open
3) Re-run:
```bat
node scripts\prepare.js
```
4) If still failing: reload extension on `chrome://extensions`

### Symptom: CDP attach fails
Possible causes:
- active tab is a restricted URL (ex: `chrome://*`, Web Store)
- another tool already attached to the tab via `chrome.debugger`

Fix:
- switch to a normal https tab and try again
- detach other debuggers/tools

### Symptom: click/type behaves inconsistently
Typical causes:
- dynamic layout shift / reflow
- wrong coordinate space (viewport vs page)

Fix:
- prefer robust selectors when available
- add a deterministic wait-for-state primitive (DOM ready / element exists)

## Reliability practices (recommended)
- Add timeouts everywhere.
- Prefer idempotent operations.
- Log: request id, CDP method, duration, and error.
- Keep scripts small and composable.

## When to stop and reassess
- Flaky behavior > 2 retries.
- Site introduces bot detection or aggressive anti-automation.
- You need complex flows (login + MFA) repeatedly — consider a different approach.
