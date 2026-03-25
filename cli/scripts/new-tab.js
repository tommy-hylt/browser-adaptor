#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';
import { extractClientTabId, cdpTargetOptions } from '../lib/cli-args.js';

// Usage: new_tab.js <url>
const parsed = extractClientTabId(process.argv.slice(2));
const url = parsed.args[0];
if (!url) {
  console.error('Usage: new_tab.js <url>');
  process.exit(1);
}

// Create a new tab by opening a blank window.open() and navigating it.
// This avoids needing the chrome.tabs API in extension; we stay in pure CDP.
await cdp('Runtime.evaluate', {
  expression: `window.open(${JSON.stringify(url)}, '_blank');`,
  returnByValue: false,
  awaitPromise: false,
  userGesture: true
}, cdpTargetOptions(parsed.clientTabId));

console.log('OK');
