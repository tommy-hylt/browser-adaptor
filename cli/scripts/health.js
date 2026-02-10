#!/usr/bin/env node
// health.js
// Prints server health JSON.
// Usage:
//   node scripts\health.js

const BASE = process.env.BROWSER_ADAPTOR_URL ?? 'http://127.0.0.1:8789';

try {
  const res = await fetch(`${BASE}/health`, { method: 'GET' });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GET /health -> ${res.status}: ${text}`);
  }
  console.log(text.trim());
} catch (e) {
  console.error(JSON.stringify({ ok: false, error: String(e?.message ?? e) }, null, 2));
  process.exit(1);
}
