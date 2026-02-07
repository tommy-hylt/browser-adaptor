# server

Local bridge.

## What it does

- Hosts **HTTP** + **WebSocket** on `127.0.0.1:8789` by default.
- Accepts one extension WS client.
- Forwards requests to the extension.

## Endpoints

- `GET /health` → `{ ok, connected }`
- `POST /cdp` → forwards `{ method, params }` to the extension (`chrome.debugger.sendCommand`)
- `GET /tabs` → forwarded to extension `chrome.tabs.query` (thin non-CDP relay)
- `GET /bookmarks` → forwarded to extension `chrome.bookmarks.getTree` (thin non-CDP relay)

## Logs

- `extension ws connected ...`
- `extension ws closed <code> <reason>`
