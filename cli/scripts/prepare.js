#!/usr/bin/env node
// prepare.js
// Ensures browser-adaptor is ready to use.
//
// Behavior:
// - Call GET /health
//   - if {ok:false} or request fails -> hard fail
//   - if {connected:true} -> fast success
//   - else (connected:false) -> run extension/start-chrome.cmd, wait 3s, retry
// - Give up after 3 tries.

import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const BASE = process.env.BROWSER_ADAPTOR_URL ?? 'http://127.0.0.1:8789';
const TRIES = 3;
const SLEEP_MS = 3000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function health() {
  const res = await fetch(`${BASE}/health`, { method: 'GET' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET /health -> ${res.status}: ${text}`);
  }
  const json = await res.json();
  return json;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function startChrome(url = 'https://example.com') {
  const extDir = path.resolve(__dirname, '..', '..', 'extension');
  const cmdPath = path.join(extDir, 'start-chrome.cmd');

  // Use cmd.exe to execute .cmd reliably.
  const r = spawnSync('cmd.exe', ['/c', cmdPath, url], {
    encoding: 'utf8',
    windowsHide: true,
  });
  return {
    code: r.status ?? 0,
    stdout: (r.stdout || '').trimEnd(),
    stderr: (r.stderr || '').trimEnd(),
  };
}

async function main() {
  for (let i = 1; i <= TRIES; i++) {
    const h = await health();

    if (!h || h.ok !== true) {
      // server responded but not ok => failure
      console.error(JSON.stringify({ ok: false, step: 'health', health: h }, null, 2));
      process.exit(2);
    }

    if (h.connected === true) {
      console.log(JSON.stringify({ ok: true, connected: true, tries: i }, null, 2));
      return;
    }

    if (i === TRIES) break;

    const sc = startChrome('https://example.com');
    // best-effort; even if start-chrome fails, we'll still re-check /health once.
    await sleep(SLEEP_MS);

    // eslint-disable-next-line no-unused-vars
    void sc;
  }

  const final = await health().catch((e) => ({ ok: false, error: String(e?.message ?? e) }));
  console.error(JSON.stringify({ ok: false, error: 'NOT_CONNECTED', tries: TRIES, health: final }, null, 2));
  process.exit(3);
}

main().catch((e) => {
  console.error(JSON.stringify({ ok: false, error: String(e?.message ?? e) }, null, 2));
  process.exit(1);
});
