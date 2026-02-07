# extension

MV3 Chrome extension that bridges privileged Chrome APIs to the local server.

## What it does

- Maintains a WebSocket client connection to the server (`ws://127.0.0.1:8789/ws` by default).
- Handles messages:
  - `type: "cdp"` → `chrome.debugger.attach` (best-effort) + `chrome.debugger.sendCommand`
  - `type: "tabs_list"` → `chrome.tabs.query({})`
  - `type: "bookmarks_tree"` → `chrome.bookmarks.getTree()`

## Service worker wake triggers

The MV3 service worker wakes on common events and calls `ensureConnected()`:
- `runtime.onStartup`, `runtime.onInstalled`, `action.onClicked`
- `tabs.onActivated`, `tabs.onUpdated`, `windows.onFocusChanged`
- `alarms` keepalive (1 minute)

## Utilities

- `start-chrome.cmd <url>`: opens Chrome to a URL (helps trigger tab events quickly)
