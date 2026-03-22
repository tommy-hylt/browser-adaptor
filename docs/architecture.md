# BrowserAdaptor — Architecture

Last updated: 2026-02-18

## Purpose
BrowserAdaptor is a thin bridge that lets **CLI scripts drive an existing Chrome session** via the Chrome DevTools Protocol (CDP), without running a headless browser.

It is designed for **pragmatic automation**:
- reuse your real Chrome profile (cookies / logged-in state)
- run deterministic CLI scripts
- keep the “dangerous privileges” contained to an extension + localhost server

## Components

### 1) CLI (`/cli`)
- A Node.js entrypoint plus scripts.
- Owns the *behavior* (navigate/click/read content/etc).
- Talks to the server over HTTP.

**Key point:** In “relay mode”, the CLI is where the product logic lives.

### 2) Server (`/server`)
- A localhost HTTP + WebSocket bridge.
- Exposes thin endpoints (ex: `/cdp`, `/tabs`, `/bookmarks`).
- Maintains the WebSocket connection to the extension.

Server responsibilities:
- accept CLI requests
- forward them to the extension
- return results
- handle basic connection health

### 3) Chrome Extension (`/extension`)
- MV3 extension.
- Connects back to the server via WebSocket.
- Uses privileged Chrome APIs:
  - `chrome.debugger` (attach + `sendCommand`) for CDP
  - selected tab/bookmark APIs for convenience

Extension responsibilities:
- attach to the active/current tab when asked
- relay CDP commands and responses

## Data / Control Flow

### CDP relay (happy path)
1. CLI script sends HTTP request to server (ex: POST `/cdp` with `{method, params}`)
2. Server forwards to extension over WebSocket
3. Extension calls `chrome.debugger.sendCommand(...)`
4. Extension returns result over WebSocket
5. Server returns result to CLI

### Why this architecture works
- Keeps the automation “close” to user reality (real Chrome).
- Minimizes complicated browser orchestration.
- Lets you add new automation by adding a new CLI script.

## Trust / Security boundaries
- **Server is localhost**; assume only local user can call it.
- Extension is privileged; keep its API surface small.
- Treat the CLI scripts as “operators”: they can do a lot, so add guardrails.

## Extending the system
- Add a new script under `cli/scripts/`.
- Prefer a small set of primitives:
  - navigate
  - query (AXTree/text/html)
  - click/type
  - wait-for-state (deterministic)
- Document each script with:
  - inputs
  - outputs
  - failure modes

## Non-goals
- Full Playwright/Selenium parity.
- Running in untrusted remote environments.
- Heavy multi-browser support.
