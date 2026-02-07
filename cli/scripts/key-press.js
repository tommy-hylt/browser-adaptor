#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';

// Usage: key_press.js <key>
const key = process.argv[2];
if (!key) {
  console.error('Usage: key_press.js <key>');
  process.exit(1);
}

await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key });
await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key });

console.log('OK');
