# cli

CLI entrypoint and helper library.

## Design

- CLI scripts contain the functionality.
- Server/extension are kept as thin relays.

## Run

All scripts use `BROWSER_ADAPTOR_URL` (default `http://127.0.0.1:8789`).

For CDP calls, pass `--clientTabId <clientTabId>` to scripts or set `BROWSER_ADAPTOR_CLIENT_TAB_ID=<clientTabId>` globally.  
If omitted, the extension falls back to the active http(s) tab.

Examples:

```bat
cd /d "C:\Users\User\Desktop\260207 BrowserAdaptor\browser-adaptor\cli"

:: REQUIRED first
node scripts\prepare.js

node scripts\url.js
node scripts\tab-active.js
node scripts\navigate.js https://example.com
node scripts\click.js --selector "a"
node scripts\type.js "hello"
node scripts\key-press.js Enter
node scripts\screenshot.js out.png
```

Note:

- Prefer the dedicated scripts (`click.js`, `type.js`, `key-press.js`, etc.) for interactions.

## Troubleshoot

### Symptom: `connected:false` or "No extension connected (WebSocket not open)"

First, run:

```bat
node scripts\prepare.js
```

`prepare` will attempt to wake Chrome/extension and re-check `/health` (up to 3 tries).

This means the MV3 service worker is asleep or has not been woken by a Chrome event yet.

Fastest fix: open a normal tab via the helper script:

```bat
cd /d "C:\Users\User\Desktop\260207 BrowserAdaptor\browser-adaptor\extension"
start-chrome.cmd https://example.com
```

Opening/focusing a new tab triggers Chrome events (`tabs.onUpdated`, `tabs.onActivated`, `windows.onFocusChanged`) which wakes the service worker and reconnects it to `ws://127.0.0.1:8789/ws`.
