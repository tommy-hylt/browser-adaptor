#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';

// Usage: key_down.js <key>
const key = process.argv[2];
if (!key) {
  console.error('Usage: key_down.js <key>');
  process.exit(1);
}

await cdp('Input.dispatchKeyEvent', {
  type: 'keyDown',
  key
});

console.log('OK');
