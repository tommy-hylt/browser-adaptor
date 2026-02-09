#!/usr/bin/env node
// prepare.js
// Ensures browser-adaptor is ready to use.
//
// Behavior:
// - Call GET /health
//   - if {connected:true} -> fast success
//   - else (connected:false or server not reachable) -> run extension/start-chrome.cmd, wait 3s, retry
// - Give up after 3 tries.
//
// Important: prepare should NEVER fail (exit code 0). If we can't connect, we still exit 0 and
// print a JSON payload describing the abnormal state.

import path from 'path';
import { spawnSync } from 'child_process';

const BASE = process.env.BROWSER_ADAPTOR_URL ?? 'http://127.0.0.1:8789';
const TRIES = 3;
const SLEEP_MS = 3000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function health() {
  try {
    const res = await fetch(`${BASE}/health`, { method: 'GET' });
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      return { ok: false, status: res.status, text };
    }
    try {
      return JSON.parse(text);
    } catch {
      return { ok: false, status: res.status, text };
    }
  } catch (e) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}

function startChrome(url = 'https://example.com') {
  const extDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'extension');
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

    if (h?.ok === true && h.connected === true) {
      console.log(JSON.stringify({ ok: true, connected: true, tries: i }, null, 2));
      process.exit(0);
    }

    if (i !== TRIES) {
      const sc = startChrome('https://example.com');
      await sleep(SLEEP_MS);
      void sc;
    }
  }

  const final = await health();
  // Never fail: return ok:true but connected:false so callers can decide what to do.
  console.log(JSON.stringify({ ok: true, connected: false, abnormal: true, tries: TRIES, health: final }, null, 2));
  process.exit(0);
}

main().catch((e) => {
  // Never fail.
  console.log(JSON.stringify({ ok: true, connected: false, abnormal: true, error: String(e?.message ?? e) }, null, 2));
  process.exit(0);
});
