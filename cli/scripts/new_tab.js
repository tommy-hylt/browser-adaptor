#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';

// Usage: new_tab.js <url>
const url = process.argv[2];
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
});

console.log('OK');
