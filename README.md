# BrowserAdaptor (v2)

This folder now contains two things:

- `browser-mcp/` – the **old** BrowserMCP supervisor/client experiments (moved deeper).
- `browser-adaptor/` – the **new** design with 3 sides:
  - `server/` – local HTTP+WS bridge
  - `cli/` – tiny CLI that calls the server
  - `extension/` – MV3 Chrome extension that attaches `chrome.debugger` and forwards **raw CDP** over WS

## Step 1 scope (relay mode)
Implemented: **url**, **navigate**, **click**, **screenshot** as CLI scripts that use **raw CDP**.

### Transport clarity (relay mode)
- **CLI → Server:** HTTP (single endpoint: `/cdp`)
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
node cli.js health
node cli.js url
node cli.js navigate https://google.com
node cli.js url

node cli.js navigate https://example.com

node cli.js click 200 200
node cli.js click --selector "a"

node cli.js screenshot out.png

:: raw CDP
node cli.js cdp Page.captureScreenshot "{\"format\":\"png\"}"
```

Notes:
- `click x y` is viewport coordinates (CSS pixels).
- This is intentionally minimal; element refs, snapshots, and robust waits come next.
