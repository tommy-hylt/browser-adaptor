#!/usr/bin/env node
import { cdp } from '../lib/bridge.js';
import { extractClientTabId, cdpTargetOptions } from '../lib/cli-args.js';

// Usage: mouse_up.js <x> <y> [left|middle|right]
const parsed = extractClientTabId(process.argv.slice(2));
const x = Number(parsed.args[0]);
const y = Number(parsed.args[1]);
const button = parsed.args[2] ?? 'left';
if (!Number.isFinite(x) || !Number.isFinite(y)) {
  console.error('Usage: mouse_up.js <x> <y> [left|middle|right]');
  process.exit(1);
}

await cdp('Input.dispatchMouseEvent', {
  type: 'mouseReleased',
  x,
  y,
  button,
  clickCount: 1
}, cdpTargetOptions(parsed.clientTabId));

console.log('OK');
