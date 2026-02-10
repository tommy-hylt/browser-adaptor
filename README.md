# BrowserAdaptor

A thin bridge that lets CLI scripts drive an existing Chrome session.

## Layout

- `server/` – local HTTP+WS bridge
- `cli/` – CLI entrypoint + scripts
- `extension/` – MV3 Chrome extension that relays `chrome.debugger` CDP + a few privileged Chrome APIs (tabs, bookmarks)

## Scope (relay mode)
CLI scripts implement: **url**, **navigate**, **new tab**, **click**, **mouse**, **keys**, **text/html**, **AXTree**, **screenshot**, plus **tabs/bookmarks** via thin extension relays.

### Transport clarity (relay mode)
- **CLI → Server:** HTTP (`/cdp`, plus a few thin endpoints like `/tabs`, `/bookmarks`)
- **Extension → Server:** WebSocket
- **Server → Extension:** WebSocket (same connection)

In relay mode:
- **Server** is just a bridge.
- **Extension** is just a bridge (chrome.debugger attach + sendCommand).
- **All functionality lives in `cli/scripts/*.js`.**

## Run

### 1) Start server

```bat
cd /d "C:\Users\User\Desktop\260207 BrowserAdaptor\browser-adaptor\server"
npm i
npm start
```

Server defaults to `http://127.0.0.1:8789` and WS at `ws://127.0.0.1:8789/ws`.

### 2) Load extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select:

`C:\Users\User\Desktop\260207 BrowserAdaptor\browser-adaptor\extension`

The extension will connect to the server and attach to the **current active tab** when it receives requests.

### 3) Use CLI

```bat
cd /d "C:\Users\User\Desktop\260207 BrowserAdaptor\browser-adaptor\cli"

:: REQUIRED first
node scripts\prepare.js

:: health
node scripts\health.js

:: CDP-driven scripts
node scripts\url.js
node scripts\navigate.js https://example.com
node scripts\new-tab.js https://github.com/
node scripts\click.js --selector "a"
node scripts\screenshot.js out.png

:: page content
node scripts\text.js
node scripts\html.js
node scripts\ax-tree.js

:: non-CDP relays
node scripts\tabs-list.js
node scripts\bookmarks.js
node scripts\bookmarks.js --all
```

Notes:
- `click.js <x> <y>` uses viewport coordinates (CSS pixels).
- See `cli/README.md` and `cli/scripts/README.md` for full usage.
