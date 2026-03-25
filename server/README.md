# server

Local bridge.

## What it does

- Hosts **HTTP** + **WebSocket** on `127.0.0.1:8789` by default.
- Accepts one extension WS client.
- Forwards requests to the extension.

## Endpoints

- `GET /health` -> `{ ok, connected }`
- `POST /cdp` -> forwards `{ method, params, timeoutMs?, clientTabId? }` to extension (`chrome.debugger.sendCommand`)
- `GET /tabs` -> forwarded to extension `chrome.tabs.query` (includes `clientTabId`)
- `GET /tabs/active` -> returns active http(s) tab with `clientTabId`
- `POST /tabs/activate` -> forwarded to extension `chrome.tabs.update` / `chrome.windows.update`
- `GET /bookmarks` -> forwarded to extension `chrome.bookmarks.getTree`

## Logs

- `extension ws connected ...`
- `extension ws closed <code> <reason>`
