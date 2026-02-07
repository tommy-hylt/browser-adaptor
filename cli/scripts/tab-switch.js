#!/usr/bin/env node
import { tabsList, tabsActivate } from '../lib/bridge.js';

// Usage:
//   tab-switch.js <tabId>
//   tab-switch.js --url <substring>
//
// Switches active tab via extension (chrome.tabs.update + chrome.windows.update).

const args = process.argv.slice(2);

if (args[0] === '--url') {
  const q = (args[1] ?? '').toString();
  if (!q) {
    console.error('Usage: tab-switch.js --url <substring>');
    process.exit(1);
  }

  const tabs = await tabsList();
  const found = tabs.find(t => (t.url ?? '').includes(q));
  if (!found?.id) throw new Error('No tab matched url substring');

  await tabsActivate(found.id);
  console.log('OK');
  process.exit(0);
}

const tabId = Number(args[0]);
if (!Number.isFinite(tabId)) {
  console.error('Usage: tab-switch.js <tabId>');
  process.exit(1);
}

await tabsActivate(tabId);
console.log('OK');
