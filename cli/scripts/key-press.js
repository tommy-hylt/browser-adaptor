#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';
import { extractClientTabId, cdpTargetOptions } from '../lib/cli-args.js';

// Usage: key_press.js <key>
const parsed = extractClientTabId(process.argv.slice(2));
const key = parsed.args[0];
if (!key) {
  console.error('Usage: key_press.js <key>');
  process.exit(1);
}

const options = cdpTargetOptions(parsed.clientTabId);
await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key }, options);
await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key }, options);

console.log('OK');
