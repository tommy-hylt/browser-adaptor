#!/usr/bin/env node
import { tabsActivate } from '../lib/bridge.js';

// Usage:
//   tab-activate.js <tabId>
//
// Activates a Chrome tab using the extension API relay (NOT CDP).

const tabId = Number(process.argv[2]);
if (!Number.isFinite(tabId)) {
  console.error('Usage: tab-activate.js <tabId>');
  process.exit(1);
}

const r = await tabsActivate(tabId);
console.log(JSON.stringify(r ?? { ok: true, tabId }, null, 2));
