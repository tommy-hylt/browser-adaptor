#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';
import { extractClientTabId, cdpTargetOptions } from '../lib/cli-args.js';

// Usage: key_down.js <key>
const parsed = extractClientTabId(process.argv.slice(2));
const key = parsed.args[0];
if (!key) {
  console.error('Usage: key_down.js <key>');
  process.exit(1);
}

await cdp('Input.dispatchKeyEvent', {
  type: 'keyDown',
  key
}, cdpTargetOptions(parsed.clientTabId));

console.log('OK');
